const WSDL_PRODUCTION =
    'https://ws.yurticikargo.com/KOPSWebServices/ShippingOrderDispatcherServices';
const WSDL_TEST =
    'http://testwebservices.yurticikargo.com:9090/KOPSWebServices/ShippingOrderDispatcherServices';

const QUERY_CACHE_MS = 60_000;
const queryCache = new Map();

const OPERATION_STATUS = {
    0: { code: 'NOP', label: 'Kargo işlem görmemiş' },
    1: { code: 'IND', label: 'Kargo teslimatta' },
    2: { code: 'ISR', label: 'Kargo işlem görmüş, fatura düzenlenmemiş' },
    3: { code: 'CNL', label: 'Kargo çıkışı engellendi' },
    4: { code: 'ISC', label: 'İptal edilmiş' },
    5: { code: 'DLV', label: 'Kargo teslim edilmiş' },
    6: { code: 'BI', label: 'Fatura şube tarafından iptal edilmiş' },
};

function getYurticiConfig() {
    const testMode = String(process.env.YURTICI_KARGO_TEST_MODE || '').toLowerCase() === 'true';
    const username = process.env.YURTICI_KARGO_USER || (testMode ? 'YKTEST' : '');
    const password = process.env.YURTICI_KARGO_PASSWORD || (testMode ? 'YK' : '');
    const customerCode = process.env.YURTICI_KARGO_CUSTOMER_CODE || '';
    const language = process.env.YURTICI_KARGO_LANGUAGE || 'TR';

    return {
        enabled: Boolean(username && password),
        testMode,
        username,
        password,
        customerCode,
        language,
        endpoint: testMode ? WSDL_TEST : WSDL_PRODUCTION,
    };
}

function escapeXml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function buildQueryShipmentEnvelope(config, key, keyType = 0) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ship="http://yurticikargo.com.tr/ShippingOrderDispatcherServices">
  <soapenv:Header/>
  <soapenv:Body>
    <ship:queryShipment>
      <wsUserName>${escapeXml(config.username)}</wsUserName>
      <wsPassword>${escapeXml(config.password)}</wsPassword>
      <wsLanguage>${escapeXml(config.language)}</wsLanguage>
      <keys>${escapeXml(key)}</keys>
      <keyType>${Number(keyType)}</keyType>
      <addHistoricalData>true</addHistoricalData>
      <onlyTracking>false</onlyTracking>
    </ship:queryShipment>
  </soapenv:Body>
</soapenv:Envelope>`;
}

function decodeXmlEntities(value) {
    return String(value ?? '')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, '&')
        .trim();
}

function getTagValues(xml, tagName) {
    const pattern = new RegExp(
        `<(?:[A-Za-z0-9_]+:)?${tagName}(?:[^>]*)>([\\s\\S]*?)</(?:[A-Za-z0-9_]+:)?${tagName}>`,
        'gi'
    );
    const values = [];
    let match = pattern.exec(xml);
    while (match) {
        values.push(decodeXmlEntities(match[1]));
        match = pattern.exec(xml);
    }
    return values;
}

function getFirstTagValue(xml, tagName) {
    return getTagValues(xml, tagName)[0] ?? '';
}

function extractBlocks(xml, tagName) {
    const pattern = new RegExp(
        `<(?:[A-Za-z0-9_]+:)?${tagName}(?:[^>]*)>([\\s\\S]*?)</(?:[A-Za-z0-9_]+:)?${tagName}>`,
        'gi'
    );
    const blocks = [];
    let match = pattern.exec(xml);
    while (match) {
        blocks.push(match[1]);
        match = pattern.exec(xml);
    }
    return blocks;
}

function formatYurticiDateTime(dateRaw, timeRaw) {
    const date = String(dateRaw ?? '').replace(/\D/g, '');
    const time = String(timeRaw ?? '').replace(/\D/g, '').padStart(6, '0');
    if (date.length !== 8) return '';
    const isoDate = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
    if (time.length >= 4) {
        const hh = time.slice(0, 2);
        const mm = time.slice(2, 4);
        const ss = time.slice(4, 6) || '00';
        return `${isoDate} ${hh}:${mm}:${ss}`;
    }
    return isoDate;
}

function mapOperationToPublicStatus(operationCode, returnStatus) {
    const code = Number(returnStatus);
    if (code === 3) return 'returned';

    switch (Number(operationCode)) {
        case 5:
            return 'delivered';
        case 3:
        case 4:
        case 6:
            return 'returned';
        default:
            return 'in_transit';
    }
}

function parseTrackingEvent(block) {
    const eventName =
        getFirstTagValue(block, 'eventName') ||
        getFirstTagValue(block, 'operationMessage') ||
        getFirstTagValue(block, 'cargoReasonExplanation');
    const unitName = getFirstTagValue(block, 'unitName');
    const cityName = getFirstTagValue(block, 'cityName');
    const townName = getFirstTagValue(block, 'townName');
    const reasonName = getFirstTagValue(block, 'reasonName');
    const eventDate = getFirstTagValue(block, 'eventDate') || getFirstTagValue(block, 'operationDate');
    const eventTime = getFirstTagValue(block, 'eventTime') || getFirstTagValue(block, 'operationTime');

    const location = [unitName, townName, cityName].filter(Boolean).join(', ');
    const datetime = formatYurticiDateTime(eventDate, eventTime);

    if (!eventName && !location && !datetime) return null;

    return {
        datetime,
        description: eventName || reasonName || '',
        location,
        reason: reasonName || '',
    };
}

function parseQueryShipmentResponse(xml) {
    const outFlag = getFirstTagValue(xml, 'outFlag');
    const outResult = getFirstTagValue(xml, 'outResult');
    const detailBlocks = extractBlocks(xml, 'shippingDeliveryDetailVO');
    const detailXml = detailBlocks[0] || xml;

    const errCode = getFirstTagValue(detailXml, 'errCode');
    const errMessage = getFirstTagValue(detailXml, 'errMessage');

    if (outFlag === '1' || outFlag === '2') {
        return {
            ok: false,
            error: errMessage || outResult || 'Yurtiçi Kargo sorgusu başarısız',
            outFlag,
        };
    }

    if (errCode && errCode !== '0') {
        return {
            ok: false,
            error: errMessage || outResult || 'Kargo kaydı bulunamadı',
            errCode,
        };
    }

    const operationCode = getFirstTagValue(detailXml, 'operationCode');
    const operationStatus = getFirstTagValue(detailXml, 'operationStatus');
    const operationMessage = getFirstTagValue(detailXml, 'operationMessage');
    const returnStatus = getFirstTagValue(detailXml, 'returnStatus');
    const docId = getFirstTagValue(detailXml, 'docId') || getFirstTagValue(detailXml, 'docid');
    const cargoKey = getFirstTagValue(detailXml, 'cargoKey');
    const trackingUrl = getFirstTagValue(detailXml, 'trackingUrl');
    const deliveryDate = getFirstTagValue(detailXml, 'deliveryDate');
    const deliveryTime = getFirstTagValue(detailXml, 'deliveryTime');
    const receiverInfo = getFirstTagValue(detailXml, 'receiverInfo');

    const historyBlocks = extractBlocks(detailXml, 'invDocCargoVOArray');
    const events = historyBlocks
        .map(parseTrackingEvent)
        .filter(Boolean)
        .sort((a, b) => String(b.datetime).localeCompare(String(a.datetime)));

    if (!events.length && operationMessage) {
        events.push({
            datetime: formatYurticiDateTime(deliveryDate, deliveryTime),
            description: operationMessage,
            location: '',
            reason: '',
        });
    }

    const statusInfo = OPERATION_STATUS[Number(operationCode)] || null;

    return {
        ok: true,
        doc_id: docId,
        cargo_key: cargoKey,
        operation_code: operationCode,
        operation_status: operationStatus,
        status_label: statusInfo?.label || operationMessage || '',
        status_code: statusInfo?.code || operationStatus || '',
        public_status: mapOperationToPublicStatus(operationCode, returnStatus),
        delivery_date: formatYurticiDateTime(deliveryDate, deliveryTime).split(' ')[0] || '',
        delivery_time: formatYurticiDateTime(deliveryDate, deliveryTime).split(' ')[1] || '',
        receiver_info: receiverInfo,
        tracking_url: trackingUrl,
        return_status: returnStatus,
        events,
        raw_message: outResult,
    };
}

function isTrackableKey(key) {
    const value = String(key ?? '').trim();
    if (!value) return false;
    if (/^(KARGO|SN)-/i.test(value)) return false;
    return value.length >= 4;
}

async function queryYurticiShipment(key, keyType = 0) {
    const config = getYurticiConfig();
    if (!config.enabled || !isTrackableKey(key)) {
        return { ok: false, skipped: true, error: 'Yurtiçi Kargo yapılandırılmamış veya geçersiz takip anahtarı' };
    }

    const cacheKey = `${key}:${keyType}`;
    const cached = queryCache.get(cacheKey);
    if (cached && Date.now() - cached.at < QUERY_CACHE_MS) {
        return cached.data;
    }

    const body = buildQueryShipmentEnvelope(config, key, keyType);
    const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            SOAPAction: 'queryShipment',
        },
        body,
    });

    const xml = await response.text();
    if (!response.ok) {
        const result = { ok: false, error: `Yurtiçi API HTTP ${response.status}` };
        queryCache.set(cacheKey, { at: Date.now(), data: result });
        return result;
    }

    const parsed = parseQueryShipmentResponse(xml);
    queryCache.set(cacheKey, { at: Date.now(), data: parsed });
    return parsed;
}

async function enrichShipmentWithYurtici(shipment) {
    const config = getYurticiConfig();
    const serialKey = String(shipment.serial_number || '').trim();
    const fallbackUrl = buildPublicTrackingUrl(serialKey);

    if (!config.enabled) {
        return {
            ...shipment,
            yurtici: {
                enabled: false,
                tracking_url: fallbackUrl || undefined,
            },
        };
    }

    const key = serialKey;
    if (!isTrackableKey(key)) {
        return {
            ...shipment,
            yurtici: {
                enabled: true,
                skipped: true,
                tracking_url: fallbackUrl || undefined,
            },
        };
    }

    let tracking = await queryYurticiShipment(key, 0);
    if (!tracking.ok && !tracking.skipped) {
        tracking = await queryYurticiShipment(key, 1);
    }

    if (!tracking.ok) {
        return {
            ...shipment,
            yurtici: {
                enabled: true,
                found: false,
                error: tracking.error || 'Canlı takip bilgisi alınamadı',
                tracking_url: fallbackUrl || undefined,
            },
        };
    }

    const enriched = {
        ...shipment,
        status: tracking.public_status || shipment.status,
        delivery_date: tracking.delivery_date || shipment.delivery_date,
        delivery_time: tracking.delivery_time || shipment.delivery_time,
        yurtici: {
            enabled: true,
            found: true,
            doc_id: tracking.doc_id,
            cargo_key: tracking.cargo_key,
            status_label: tracking.status_label,
            status_code: tracking.status_code,
            tracking_url: tracking.tracking_url,
            receiver_info: tracking.receiver_info,
            events: tracking.events,
        },
    };

    if (config.customerCode && !enriched.yurtici.tracking_url && tracking.doc_id) {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        enriched.yurtici.tracking_url =
            `https://selfservis.yurticikargo.com/reports/SavReportsFromParamFields.aspx?ssfldvn=99&sskurkod=${encodeURIComponent(config.customerCode)}&refnumber=${encodeURIComponent(tracking.doc_id)}&date=${dd}.${mm}.${yyyy}`;
    }

    if (!enriched.yurtici.tracking_url) {
        const publicNumber = tracking.doc_id || tracking.cargo_key || key;
        if (publicNumber) {
            enriched.yurtici.tracking_url =
                `https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code=${encodeURIComponent(publicNumber)}`;
        }
    }

    return enriched;
}

function buildPublicTrackingUrl(trackingNumber) {
    const number = String(trackingNumber ?? '').trim();
    if (!number || /^(KARGO|SN|IMP)-/i.test(number)) return '';
    return `https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code=${encodeURIComponent(number)}`;
}

module.exports = {
    getYurticiConfig,
    queryYurticiShipment,
    enrichShipmentWithYurtici,
    isTrackableKey,
    buildPublicTrackingUrl,
};

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
    const receiverCustName = getFirstTagValue(detailXml, 'receiverCustName');
    const receiverAddress = getFirstTagValue(detailXml, 'receiverAddress');
    const documentDate = getFirstTagValue(detailXml, 'documentDate');
    const departureDate = getFirstTagValue(detailXml, 'departureDate');
    const arrivalUnitName = getFirstTagValue(detailXml, 'arrivalUnitName');
    const cityName = getFirstTagValue(detailXml, 'cityName');
    const townName = getFirstTagValue(detailXml, 'townName');

    const shipDateRaw = departureDate || documentDate;
    const ship_date = formatYurticiDateTime(shipDateRaw, '').split(' ')[0] || '';

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
        receiver_info: receiverInfo || receiverCustName,
        receiver_cust_name: receiverCustName,
        receiver_address: receiverAddress,
        arrival_unit: arrivalUnitName,
        arrival_city: cityName,
        arrival_town: townName,
        ship_date,
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

function collectLookupKeys(shipment) {
    const keys = [];
    const add = (value) => {
        const key = String(value ?? '').trim();
        if (key && isTrackableKey(key) && !keys.includes(key)) keys.push(key);
    };
    add(shipment.gonderi_kodu);
    add(shipment.serial_number);
    return keys;
}

function resolvePublicGonderiKodu(tracking, shipment) {
    const fromApi = String(tracking?.cargo_key ?? '').trim() || String(tracking?.doc_id ?? '').trim();
    if (fromApi) return fromApi;
    return String(shipment?.gonderi_kodu ?? '').trim();
}

async function queryYurticiBestMatch(keys) {
    for (const key of keys) {
        for (const keyType of [0, 1]) {
            const result = await queryYurticiShipment(key, keyType);
            if (result.ok) {
                return result;
            }
        }
    }
    return { ok: false, error: 'Kargo kaydı bulunamadı' };
}

async function enrichShipmentWithYurtici(shipment) {
    const config = getYurticiConfig();
    const storedGonderiKodu = String(shipment.gonderi_kodu ?? '').trim();
    const lookupKeys = collectLookupKeys(shipment);

    if (!config.enabled) {
        return {
            ...shipment,
            gonderi_kodu: storedGonderiKodu,
            yurtici: {
                enabled: false,
                ...(storedGonderiKodu ? { tracking_url: buildPublicTrackingUrl(storedGonderiKodu) } : {}),
            },
        };
    }

    if (!lookupKeys.length) {
        return {
            ...shipment,
            gonderi_kodu: storedGonderiKodu,
            yurtici: { enabled: true, skipped: true },
        };
    }

    const tracking = await queryYurticiBestMatch(lookupKeys);

    if (!tracking.ok) {
        return {
            ...shipment,
            gonderi_kodu: storedGonderiKodu,
            yurtici: {
                enabled: true,
                found: false,
                error: tracking.error || 'Canlı takip bilgisi alınamadı',
                ...(storedGonderiKodu ? { tracking_url: buildPublicTrackingUrl(storedGonderiKodu) } : {}),
            },
        };
    }

    const publicCode = resolvePublicGonderiKodu(tracking, shipment);
    const arrivalCity = [tracking.arrival_town, tracking.arrival_city].filter(Boolean).join(', ');

    const enriched = {
        ...shipment,
        status: tracking.public_status || shipment.status,
        ship_date: tracking.ship_date || shipment.ship_date,
        delivery_date: tracking.delivery_date || shipment.delivery_date,
        delivery_time: tracking.delivery_time || shipment.delivery_time,
        recipient: tracking.receiver_info || shipment.recipient,
        address: tracking.receiver_address || shipment.address,
        arrival_city: arrivalCity || shipment.arrival_city,
        gonderi_kodu: publicCode,
        yurtici: {
            enabled: true,
            found: true,
            doc_id: tracking.doc_id,
            cargo_key: tracking.cargo_key,
            status_label: tracking.status_label,
            status_code: tracking.status_code,
            receiver_info: tracking.receiver_info,
            events: tracking.events,
            tracking_url: publicCode ? buildPublicTrackingUrl(publicCode) : undefined,
        },
    };

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

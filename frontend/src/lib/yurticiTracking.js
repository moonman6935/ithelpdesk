const YURTICI_INQUIRY_BASE =
    'https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula';

function isInternalYurticiUrl(url) {
    const value = String(url ?? '').trim();
    if (!value) return true;
    return value.includes('selfservis.yurticikargo.com');
}

export function getGonderiKodu(shipment) {
    const explicit = String(shipment?.gonderi_kodu ?? shipment?.shipment_code ?? '').trim();
    if (explicit) return explicit;

    const cargoKey = String(shipment?.yurtici?.cargo_key ?? '').trim();
    if (cargoKey) return cargoKey;

    const docId = String(shipment?.yurtici?.doc_id ?? '').trim();
    if (docId) return docId;

    const serial = String(shipment?.serial_number ?? '').trim();
    if (serial && !/^(KARGO|SN|IMP)-/i.test(serial)) return serial;

    return '';
}

/** @deprecated use getGonderiKodu */
export function getShipmentTrackingNumber(shipment) {
    return getGonderiKodu(shipment);
}

export function buildYurticiInquiryUrl(gonderiKodu) {
    const code = String(gonderiKodu ?? '').trim();
    if (!code) return '';
    return `${YURTICI_INQUIRY_BASE}?code=${encodeURIComponent(code)}`;
}

export function buildYurticiTrackingUrl(gonderiKodu, preferredUrl) {
    const code = String(gonderiKodu ?? '').trim();
    if (!code) return '';

    const preferred = String(preferredUrl ?? '').trim();
    if (
        preferred &&
        !isInternalYurticiUrl(preferred) &&
        preferred.includes('yurticikargo.com') &&
        preferred.includes('gonderi-sorgula')
    ) {
        return preferred;
    }

    return buildYurticiInquiryUrl(code);
}

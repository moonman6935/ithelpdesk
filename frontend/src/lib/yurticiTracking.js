export function getShipmentTrackingNumber(shipment) {
    const docId = String(shipment?.yurtici?.doc_id ?? '').trim();
    const cargoKey = String(shipment?.yurtici?.cargo_key ?? '').trim();
    const serial = String(shipment?.serial_number ?? '').trim();

    if (docId) return docId;
    if (cargoKey) return cargoKey;
    if (serial && !/^(KARGO|SN|IMP)-/i.test(serial)) return serial;
    return '';
}

export function buildYurticiTrackingUrl(trackingNumber, preferredUrl) {
    const number = String(trackingNumber ?? '').trim();
    if (!number) return '';

    if (preferredUrl) return preferredUrl;

    return `https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code=${encodeURIComponent(number)}`;
}

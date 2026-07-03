const YURTICI_INQUIRY_BASE =
    'https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula';

/**
 * Yurtiçi Kargo'da "Gönderi Kodu" = API cargoKey.
 * docId (barkod) yedek sorgu kodu olarak kullanılabilir.
 * Ürün seri numarası (S/N) asla gönderi kodu değildir.
 */
export function getGonderiKodu(shipment) {
    const cargoKey = String(shipment?.yurtici?.cargo_key ?? '').trim();
    if (cargoKey) return cargoKey;

    const docId = String(shipment?.yurtici?.doc_id ?? '').trim();
    if (docId) return docId;

    const stored = String(shipment?.gonderi_kodu ?? '').trim();
    if (stored) return stored;

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

export function buildYurticiTrackingUrl(gonderiKodu) {
    return buildYurticiInquiryUrl(gonderiKodu);
}

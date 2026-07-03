import * as XLSX from 'xlsx';

const normalize = (value) =>
    String(value ?? '')
        .toLowerCase()
        .trim()
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c');

function parseDeliveryDate(dateStr, timeStr) {
    const date = String(dateStr ?? '').trim();
    const time = String(timeStr ?? '00:00').trim() || '00:00';
    if (!date) return new Date().toISOString();

    const slashParts = date.split(/[./-]/);
    if (slashParts.length === 3) {
        const [a, b, c] = slashParts;
        const day = a.length === 4 ? c : a;
        const month = a.length === 4 ? b : b;
        const year = a.length === 4 ? a : c;
        const iso = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${time}:00`;
        const parsed = new Date(iso);
        if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
    }

    const fallback = new Date(date);
    return Number.isNaN(fallback.getTime()) ? new Date().toISOString() : fallback.toISOString();
}

function parseSpecialField(text) {
    const raw = String(text ?? '').trim();
    const barkodMatch = raw.match(/BARKOD:\s*([A-Za-z0-9-]+)/i);
    const serial = barkodMatch ? barkodMatch[1].trim() : '';

    let itemName = raw
        .replace(/\s*-\s*BARKOD:.*/i, '')
        .replace(/^\*MF\*\s*/i, '')
        .trim();

    if (!itemName) itemName = 'Kargo Gönderimi';

    return { itemName, serial };
}

function extractGonderiKodu(row) {
    const fromColumn = String(
        row['Gönderi Kodu'] ??
        row['Gonderi Kodu'] ??
        row['Gönderi No'] ??
        row['Gonderi No'] ??
        row['Referans No'] ??
        row['Referans Kodu'] ??
        row['Referans'] ??
        row['İrsaliye No'] ??
        row['Irsaliye No'] ??
        ''
    ).trim();
    if (fromColumn) return fromColumn;

    for (const field of ['Özel Alan 1', 'Ozel Alan 1', 'Özel Alan 2', 'Ozel Alan 2']) {
        const raw = String(row[field] ?? '').trim();
        const dcsMatch = raw.match(/\b(DCS\d+)\b/i);
        if (dcsMatch) return dcsMatch[1].toUpperCase();
    }

    return '';
}

function rowToCargoRecord(row, format) {
    if (format !== 'cargo') {
        const base = rowToRecord(row, format);
        return base ? { ...base, direction_meta: {} } : null;
    }

    const name = String(row['Alıcı Müşteri'] ?? row['Alici Musteri'] ?? '').trim();
    const { itemName, serial } = parseSpecialField(row['Özel Alan 2'] ?? row['Ozel Alan 2']);
    const gonderiKodu = extractGonderiKodu(row);
    if (!name) return null;

    return {
        personnel_name: name,
        item_name: itemName,
        gonderi_kodu: gonderiKodu,
        serial_number: serial || `KARGO-${row.No ?? Date.now()}`,
        created_at: parseDeliveryDate(row['Teslim Tarihi'], row['Teslim Saati']),
        row_no: row.No ?? null,
        address: String(row['Alıcı Adresi'] ?? '').trim(),
        phone: String(row['Alıcı Telefonu'] ?? '').trim(),
        ship_date: String(row['Çıkış Tarihi'] ?? '').trim(),
        sender: String(row['Gönderen Müşteri'] ?? '').trim(),
        arrival_date: String(row['Varış Tarihi'] ?? '').trim(),
        arrival_city: String(row['Varış İli'] ?? '').trim(),
        delivery_type: String(row['Teslim Tipi'] ?? '').trim(),
        delivery_date: String(row['Teslim Tarihi'] ?? '').trim(),
        delivery_time: String(row['Teslim Saati'] ?? '').trim(),
        recipient: String(row['Teslim Alan'] ?? '').trim(),
        recipient_unit: String(row['Teslim Birimi'] ?? '').trim(),
        recipient_city: String(row['Teslim İli'] ?? '').trim(),
        package_count: row['Kargo Adedi'] ?? null,
        return_flag: String(row['İade'] ?? row['Iade'] ?? '').trim(),
        return_reason: String(row['İade Sebebi'] ?? row['Iade Sebebi'] ?? '').trim(),
    };
}

function rowToRecord(row, format) {
    if (format === 'cargo') {
        const name = String(row['Alıcı Müşteri'] ?? row['Alici Musteri'] ?? '').trim();
        const { itemName, serial } = parseSpecialField(row['Özel Alan 2'] ?? row['Ozel Alan 2']);
        if (!name) return null;

        return {
            personnel_name: name,
            item_name: itemName,
            serial_number: serial || `KARGO-${row.No ?? Date.now()}`,
            created_at: parseDeliveryDate(row['Teslim Tarihi'], row['Teslim Saati']),
            status: 'assigned',
        };
    }

    const personnelId = String(
        row['Personel ID'] ?? row['Personel ID (6 Hane)'] ?? row.personnel_id ?? ''
    ).trim();
    const personnelName = String(
        row['Personel Adı Soyadı'] ?? row['Personel Adi Soyadi'] ?? row.personnel_name ?? ''
    ).trim();
    const itemName = String(row['Ürün Adı'] ?? row['Urun Adi'] ?? row.item_name ?? '').trim();
    const serial = String(row['S/N'] ?? row['Seri Numarası'] ?? row.serial_number ?? '').trim();
    const dateRaw = row.Tarih ?? row.created_at ?? row['Teslim Tarihi'];

    if (!personnelName && !personnelId) return null;

    return {
        personnel_id: personnelId || undefined,
        personnel_name: personnelName || personnelId,
        item_name: itemName || 'Ürün',
        serial_number: serial || `SN-${Date.now()}`,
        created_at: dateRaw ? parseDeliveryDate(dateRaw, '00:00') : new Date().toISOString(),
        status: normalize(row.Durum ?? row.status).includes('iade') ? 'returned' : 'assigned',
    };
}

function detectFormat(headers) {
    const normalized = headers.map(normalize);
    if (normalized.some((h) => h.includes('alici musteri'))) return 'cargo';
    if (normalized.some((h) => h.includes('personel'))) return 'direct';
    return 'cargo';
}

export function parseInventoryExcel(fileBuffer) {
    const workbook = XLSX.read(fileBuffer, { type: 'array', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(matrix.length, 15); i++) {
        const row = matrix[i];
        if (!Array.isArray(row)) continue;
        const line = row.map(normalize).join('|');
        if (
            line.includes('alici musteri') ||
            line.includes('personel adi') ||
            line.includes('personel id') ||
            line.includes('urun adi')
        ) {
            headerRowIndex = i;
            break;
        }
    }

    if (headerRowIndex === -1) {
        throw new Error('EXCEL_HEADER_NOT_FOUND');
    }

    const headers = matrix[headerRowIndex];
    const format = detectFormat(headers);
    const rows = XLSX.utils.sheet_to_json(sheet, { range: headerRowIndex, defval: '' });

    const items = [];
    const errors = [];

    rows.forEach((row, index) => {
        try {
            const record = rowToCargoRecord(row, format);
            if (record) items.push(record);
        } catch (err) {
            errors.push({ row: headerRowIndex + index + 2, message: err.message });
        }
    });

    return {
        format,
        sheetName,
        totalRows: rows.length,
        items,
        errors,
    };
}

export async function readExcelFile(file) {
    const buffer = await file.arrayBuffer();
    return parseInventoryExcel(buffer);
}

export { normalize as normalizeCargoKey };

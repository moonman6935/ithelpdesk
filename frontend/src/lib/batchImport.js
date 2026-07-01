import api from './api';

const IMPORT_TIMEOUT_MS = 120000;
const DEFAULT_BATCH_SIZE = 40;

export async function batchImport(endpoint, basePayload, items, batchSize = DEFAULT_BATCH_SIZE) {
    let totalImported = 0;
    let totalSkipped = 0;

    for (let i = 0; i < items.length; i += batchSize) {
        const chunk = items.slice(i, i + batchSize);
        const res = await api.post(
            endpoint,
            { ...basePayload, items: chunk },
            { timeout: IMPORT_TIMEOUT_MS }
        );
        totalImported += res.data.imported ?? 0;
        totalSkipped += res.data.skipped ?? 0;
    }

    return { imported: totalImported, skipped: totalSkipped };
}

export function getImportErrorMessage(err, fallback) {
    if (err?.response?.status === 504 || err?.code === 'ECONNABORTED') {
        return 'Sunucu zaman aşımına uğradı. Lütfen tekrar deneyin veya daha küçük bir dosya kullanın.';
    }
    return err?.response?.data?.detail || fallback;
}

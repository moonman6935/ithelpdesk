import api from './api';
import { SYSTEM_MIN } from './systemCheck';

const DOWNLOAD_PATH = `${process.env.PUBLIC_URL || ''}/speed-test.bin`;
const UPLOAD_BYTES = 1.5 * 1024 * 1024; // 1.5 MB

function mbpsFrom(bytes, elapsedMs) {
  if (!elapsedMs || elapsedMs <= 0) return 0;
  return (bytes * 8) / (elapsedMs / 1000) / 1_000_000;
}

/**
 * Download speed test against a static public file (cache-busted).
 * @param {(p: { phase: string, progress: number, mbps: number|null }) => void} onProgress
 */
export async function runDownloadSpeedTest(onProgress) {
  const url = `${DOWNLOAD_PATH}?t=${Date.now()}`;
  const t0 = performance.now();
  onProgress?.({ phase: 'download', progress: 0, mbps: null });

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`download_http_${res.status}`);

  const total = Number(res.headers.get('content-length')) || 0;
  const reader = res.body?.getReader();
  if (!reader) {
    const buf = await res.arrayBuffer();
    const elapsed = performance.now() - t0;
    const mbps = mbpsFrom(buf.byteLength, elapsed);
    onProgress?.({ phase: 'download', progress: 1, mbps });
    return { bytes: buf.byteLength, mbps, elapsedMs: elapsed };
  }

  let received = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    const elapsed = performance.now() - t0;
    const progress = total > 0 ? Math.min(1, received / total) : 0;
    onProgress?.({
      phase: 'download',
      progress,
      mbps: mbpsFrom(received, elapsed),
    });
  }

  const elapsed = performance.now() - t0;
  const mbps = mbpsFrom(received, elapsed);
  onProgress?.({ phase: 'download', progress: 1, mbps });
  return { bytes: received, mbps, elapsedMs: elapsed };
}

/**
 * Upload speed test via POST /api/speed-echo (body discarded server-side).
 */
export async function runUploadSpeedTest(onProgress) {
  const payload = new Uint8Array(UPLOAD_BYTES);
  crypto.getRandomValues(payload);

  onProgress?.({ phase: 'upload', progress: 0, mbps: null });
  const t0 = performance.now();

  const base = api.defaults.baseURL || '';
  const url = `${base}/api/speed-echo`;

  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable) return;
      const elapsed = performance.now() - t0;
      onProgress?.({
        phase: 'upload',
        progress: e.loaded / e.total,
        mbps: mbpsFrom(e.loaded, elapsed),
      });
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`upload_http_${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error('upload_network'));
    xhr.send(payload);
  });

  const elapsed = performance.now() - t0;
  const mbps = mbpsFrom(UPLOAD_BYTES, elapsed);
  onProgress?.({ phase: 'upload', progress: 1, mbps });
  return { bytes: UPLOAD_BYTES, mbps, elapsedMs: elapsed };
}

export async function runSpeedTests(onProgress) {
  const download = await runDownloadSpeedTest(onProgress);
  const upload = await runUploadSpeedTest(onProgress);
  return {
    downloadMbps: Math.round(download.mbps * 10) / 10,
    uploadMbps: Math.round(upload.mbps * 10) / 10,
    download,
    upload,
    meetsMinimum:
      download.mbps >= SYSTEM_MIN.downloadMbps && upload.mbps >= SYSTEM_MIN.uploadMbps,
  };
}

import { SYSTEM_MIN } from './systemCheck';

const DOWNLOAD_PATH = `${process.env.PUBLIC_URL || ''}/speed-test.bin`;
const UPLOAD_BYTES = 512 * 1024; // 512 KB — enough to estimate Mbps

function mbpsFrom(bytes, elapsedMs) {
  if (!elapsedMs || elapsedMs <= 0) return 0;
  return (bytes * 8) / (elapsedMs / 1000) / 1_000_000;
}

/** Fill buffer without crypto.getRandomValues size limit (max 65536). */
function fillRandomBytes(size) {
  const out = new Uint8Array(size);
  const chunk = 65536;
  for (let offset = 0; offset < size; offset += chunk) {
    const end = Math.min(offset + chunk, size);
    const slice = out.subarray(offset, end);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(slice);
    } else {
      for (let i = 0; i < slice.length; i += 1) slice[i] = (Math.random() * 256) | 0;
    }
  }
  return out;
}

/**
 * Always same-origin — ignore REACT_APP_API_URL (avoids broken upload hosts).
 */
function speedEchoUrl() {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/api/speed-echo`;
  }
  return '/api/speed-echo';
}

export async function runDownloadSpeedTest(onProgress) {
  const url = `${DOWNLOAD_PATH}?t=${Date.now()}`;
  const t0 = performance.now();
  onProgress?.({ phase: 'download', progress: 0, mbps: null });

  const res = await fetch(url, { cache: 'no-store', credentials: 'same-origin' });
  if (!res.ok) throw new Error(`download_http_${res.status}`);

  const total = Number(res.headers.get('content-length')) || 0;
  const reader = res.body?.getReader?.();
  if (!reader) {
    const buf = await res.arrayBuffer();
    if (buf.byteLength < 100_000) throw new Error('download_too_small');
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

  if (received < 100_000) throw new Error('download_too_small');

  const elapsed = performance.now() - t0;
  const mbps = mbpsFrom(received, elapsed);
  onProgress?.({ phase: 'download', progress: 1, mbps });
  return { bytes: received, mbps, elapsedMs: elapsed };
}

export async function runUploadSpeedTest(onProgress) {
  const payload = fillRandomBytes(UPLOAD_BYTES);
  const blob = new Blob([payload], { type: 'application/octet-stream' });

  onProgress?.({ phase: 'upload', progress: 0, mbps: null });
  const t0 = performance.now();
  const url = speedEchoUrl();

  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.timeout = 60_000;
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
    xhr.ontimeout = () => reject(new Error('upload_timeout'));
    xhr.send(blob);
  });

  const elapsed = performance.now() - t0;
  const mbps = mbpsFrom(UPLOAD_BYTES, elapsed);
  onProgress?.({ phase: 'upload', progress: 1, mbps });
  return { bytes: UPLOAD_BYTES, mbps, elapsedMs: elapsed };
}

export async function runSpeedTests(onProgress) {
  let download;
  try {
    download = await runDownloadSpeedTest(onProgress);
  } catch (err) {
    const e = new Error(`download:${err?.message || err}`);
    e.phase = 'download';
    throw e;
  }

  let upload;
  try {
    upload = await runUploadSpeedTest(onProgress);
  } catch (err) {
    const e = new Error(`upload:${err?.message || err}`);
    e.phase = 'upload';
    throw e;
  }

  return {
    downloadMbps: Math.round(download.mbps * 10) / 10,
    uploadMbps: Math.round(upload.mbps * 10) / 10,
    download,
    upload,
    meetsMinimum:
      download.mbps >= SYSTEM_MIN.downloadMbps && upload.mbps >= SYSTEM_MIN.uploadMbps,
  };
}

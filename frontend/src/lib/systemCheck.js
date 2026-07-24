/** Minimum DCS agent PC requirements + browser probes. */

export const SYSTEM_MIN = {
  ramGb: 8,
  diskGb: 128,
  gpuVramGb: 2,
  downloadMbps: 50,
  uploadMbps: 8,
  cpuLabel: 'i3-9th+',
};

/**
 * @returns {'windows11'|'windows10'|'other'|'unknown'}
 */
export function parseOsFromUa(userAgent = '', platformVersion = '') {
  const ua = String(userAgent || '');
  const isWindows = /Windows/i.test(ua) || /Win64|Win32|WOW64/i.test(ua);
  if (!isWindows) return 'other';

  // Chromium UA-CH: platformVersion major >= 13 => Windows 11
  const major = parseInt(String(platformVersion).split('.')[0], 10);
  if (Number.isFinite(major) && major > 0) {
    return major >= 13 ? 'windows11' : 'windows10';
  }

  if (/Windows NT 6\./.test(ua) || /Windows (7|8)/i.test(ua)) return 'other';
  // NT 10.0 can be Win10 or Win11 without UA-CH
  return 'unknown';
}

export async function detectOs() {
  let platformVersion = '';
  try {
    if (navigator.userAgentData?.getHighEntropyValues) {
      const hints = await navigator.userAgentData.getHighEntropyValues(['platformVersion']);
      platformVersion = hints.platformVersion || '';
    }
  } catch {
    /* ignore */
  }
  return parseOsFromUa(navigator.userAgent || '', platformVersion);
}

export function detectRamGb() {
  const mem = typeof navigator !== 'undefined' ? navigator.deviceMemory : undefined;
  if (typeof mem === 'number' && mem > 0) return mem;
  return null;
}

export function detectCpuCores() {
  const n = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : undefined;
  return typeof n === 'number' && n > 0 ? n : null;
}

export function detectGpuName() {
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
    if (!gl) return null;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (ext) {
      const renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
      return renderer ? String(renderer) : null;
    }
    return gl.getParameter(gl.RENDERER) || null;
  } catch {
    return null;
  }
}

/**
 * Infer whether GPU likely has >= minVramGb from WebGL renderer string.
 * @returns {boolean|null} null = unknown
 */
export function inferGpuVramOk(gpuName, minVramGb = SYSTEM_MIN.gpuVramGb) {
  if (!gpuName) return null;
  const s = String(gpuName);

  const gbMatch = s.match(/(\d+(?:\.\d+)?)\s*GB/i);
  if (gbMatch) {
    return parseFloat(gbMatch[1]) >= minVramGb;
  }
  const mbMatch = s.match(/(\d+)\s*MB/i);
  if (mbMatch) {
    return parseFloat(mbMatch[1]) / 1024 >= minVramGb;
  }

  // Integrated / weak
  if (/UHD|HD Graphics|Iris Xe|Intel\(R\) HD|SwiftShader|Microsoft Basic/i.test(s)) {
    return minVramGb <= 0.5 ? true : false;
  }

  // Discrete NVIDIA / AMD commonly >= 2 GB for GTX/RX class and above
  if (/RTX\s*[2-9]|GTX\s*(1[0-9]{2,}|[2-9]\d{2,})|Quadro|Tesla/i.test(s)) return true;
  if (/Radeon\s*(RX|R[579]|Pro|Vega)/i.test(s)) return true;
  if (/GeForce/i.test(s) && !/GT\s*\d{2,3}\b/i.test(s)) return true;

  return null;
}

/**
 * Weak CPU heuristic from core count only (not a substitute for real model).
 * @returns {boolean|null}
 */
export function inferCpuLikelyOk(cpuCores) {
  if (typeof cpuCores !== 'number' || cpuCores < 1) return null;
  // i3-9xxx typically 4 threads; very low core counts unlikely to meet policy
  if (cpuCores < 4) return false;
  return null; // cannot confirm generation from cores alone
}

export async function detectStorageEstimateGb() {
  try {
    if (!navigator.storage?.estimate) return null;
    const est = await navigator.storage.estimate();
    if (est?.quota != null) return Math.round((est.quota / (1024 ** 3)) * 10) / 10;
  } catch {
    /* ignore */
  }
  return null;
}

/** Decode ?hw= base64 JSON produced by DCS-Sistem-Donanim.cmd */
export function parseHwPayloadFromSearch(search = '') {
  try {
    const q = new URLSearchParams(String(search || '').replace(/^\?/, ''));
    let hw = q.get('hw');
    if (!hw) return null;
    hw = hw.replace(/-/g, '+').replace(/_/g, '/');
    while (hw.length % 4) hw += '=';
    const binary = atob(hw);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    const json = new TextDecoder().decode(bytes);
    const data = JSON.parse(json);
    if (!data || typeof data !== 'object') return null;
    return data;
  } catch {
    return null;
  }
}

export async function collectAutoProbes() {
  const [os, storageEstimateGb] = await Promise.all([detectOs(), detectStorageEstimateGb()]);
  const gpuName = detectGpuName();
  const cpuCores = detectCpuCores();
  return {
    os,
    ramGb: detectRamGb(),
    cpuCores,
    gpuName,
    storageEstimateGb,
    gpuVramOk: inferGpuVramOk(gpuName),
    cpuLikelyOk: inferCpuLikelyOk(cpuCores),
  };
}

/**
 * @param {object} input
 * @param {'windows11'|'windows10'|'other'} input.os
 * @param {boolean} input.cpuOk
 * @param {number|null} input.ramGb
 * @param {boolean|null} input.ramOkManual - used when ramGb is null
 * @param {boolean} input.diskOk
 * @param {boolean} input.gpuVramOk
 * @param {number|null} input.downloadMbps
 * @param {number|null} input.uploadMbps
 */
export function evaluateSystemCheck(input) {
  const {
    os,
    cpuOk,
    ramGb,
    ramOkManual,
    diskOk,
    gpuVramOk,
    downloadMbps,
    uploadMbps,
  } = input;

  const checks = [];

  const osPass = os === 'windows11';
  const osWarn = os === 'windows10';
  checks.push({
    id: 'os',
    pass: osPass,
    warn: osWarn && !osPass,
    value: os,
    required: 'windows11',
  });

  checks.push({
    id: 'cpu',
    pass: !!cpuOk,
    value: cpuOk ? SYSTEM_MIN.cpuLabel : 'below',
    required: SYSTEM_MIN.cpuLabel,
  });

  let ramPass = false;
  let ramValue = ramGb;
  if (typeof ramGb === 'number' && ramGb > 0) {
    ramPass = ramGb >= SYSTEM_MIN.ramGb;
  } else if (ramOkManual === true) {
    ramPass = true;
    ramValue = 'manual-ok';
  } else if (ramOkManual === false) {
    ramPass = false;
    ramValue = 'manual-fail';
  } else {
    ramPass = false;
    ramValue = null;
  }
  checks.push({
    id: 'ram',
    pass: ramPass,
    value: ramValue,
    required: SYSTEM_MIN.ramGb,
  });

  checks.push({
    id: 'disk',
    pass: !!diskOk,
    value: diskOk ? `ssd>=${SYSTEM_MIN.diskGb}` : 'below',
    required: SYSTEM_MIN.diskGb,
  });

  checks.push({
    id: 'gpu',
    pass: !!gpuVramOk,
    value: gpuVramOk ? `vram>=${SYSTEM_MIN.gpuVramGb}` : 'below',
    required: SYSTEM_MIN.gpuVramGb,
  });

  const dl = typeof downloadMbps === 'number' ? downloadMbps : null;
  const ul = typeof uploadMbps === 'number' ? uploadMbps : null;
  const downloadPass = dl != null && dl >= SYSTEM_MIN.downloadMbps;
  const uploadPass = ul != null && ul >= SYSTEM_MIN.uploadMbps;

  checks.push({
    id: 'download',
    pass: downloadPass,
    value: dl,
    required: SYSTEM_MIN.downloadMbps,
  });
  checks.push({
    id: 'upload',
    pass: uploadPass,
    value: ul,
    required: SYSTEM_MIN.uploadMbps,
  });

  const hardwareIds = ['cpu', 'ram', 'disk', 'gpu'];
  const hardwareOk = hardwareIds.every((id) => checks.find((c) => c.id === id)?.pass);
  const speedOk = downloadPass && uploadPass;
  const failReasons = checks.filter((c) => !c.pass && !(c.id === 'os' && osWarn)).map((c) => c.id);

  // OS alone: Win10 is warn path only when hardware+speed OK
  let status = 'fail'; // pass | warn | fail
  if (!hardwareOk || !speedOk) {
    status = 'fail';
  } else if (os === 'windows11') {
    status = 'pass';
  } else if (os === 'windows10') {
    status = 'warn';
  } else {
    status = 'fail';
    if (!failReasons.includes('os')) failReasons.unshift('os');
  }

  return {
    status,
    checks,
    hardwareOk,
    speedOk,
    failReasons,
    upgradeRecommended: status === 'warn',
  };
}

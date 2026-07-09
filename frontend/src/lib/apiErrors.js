export function getApiErrorMessage(err, fallback = 'İşlem başarısız oldu.') {
  const data = err?.response?.data;
  if (typeof data === 'string' && data.trim()) return data;
  if (typeof data?.detail === 'string' && data.detail.trim()) return data.detail;
  if (typeof data?.message === 'string' && data.message.trim()) return data.message;
  if (err?.message === 'Network Error') return 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.';
  if (err?.code === 'ECONNABORTED') return 'İstek zaman aşımına uğradı.';
  return fallback;
}

export function isStrongPasswordClient(password) {
  return String(password ?? '').length >= 10;
}

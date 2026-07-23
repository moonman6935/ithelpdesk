import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import {
  Wrench, Upload, Download, RotateCcw, FileCog, CheckCircle2, AlertCircle,
} from 'lucide-react';

const MAX_BYTES = 8 * 1024 * 1024;

function formatBytes(bytes) {
  if (bytes == null) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

const ToolFilesPanel = ({ canWrite = false }) => {
  const { t, language } = useLanguage();
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const fileInputs = useRef({});

  const apiBase = api.defaults.baseURL || '';

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/admin/tools');
      setTools(Array.isArray(res.data) ? res.data : []);
    } catch {
      setFeedback({ type: 'error', text: t('admin.toolFiles.error') });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const formatDate = (ts) => {
    if (!ts) return '-';
    try {
      return new Date(ts).toLocaleString(
        language === 'en' ? 'en-GB' : language === 'de' ? 'de-DE' : language === 'ka' ? 'ka-GE' : 'tr-TR'
      );
    } catch {
      return ts;
    }
  };

  const handleUpload = async (key, file) => {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setFeedback({ type: 'error', text: t('admin.toolFiles.tooLarge') });
      return;
    }
    setBusyKey(key);
    setFeedback(null);
    try {
      const content_base64 = await readFileAsBase64(file);
      await api.post(`/api/admin/tools/${key}`, {
        filename: file.name,
        content_type: file.type || 'application/octet-stream',
        content_base64,
      });
      setFeedback({ type: 'success', text: t('admin.toolFiles.uploaded') });
      await load();
    } catch (err) {
      const detail = err?.response?.data?.detail || t('admin.toolFiles.error');
      setFeedback({ type: 'error', text: detail });
    } finally {
      setBusyKey(null);
      if (fileInputs.current[key]) fileInputs.current[key].value = '';
    }
  };

  const handleRevert = async (key) => {
    if (!window.confirm(t('admin.toolFiles.confirmRevert'))) return;
    setBusyKey(key);
    setFeedback(null);
    try {
      await api.delete(`/api/admin/tools/${key}`);
      setFeedback({ type: 'success', text: t('admin.toolFiles.reverted') });
      await load();
    } catch (err) {
      const detail = err?.response?.data?.detail || t('admin.toolFiles.error');
      setFeedback({ type: 'error', text: detail });
    } finally {
      setBusyKey(null);
    }
  };

  const toolLabel = (key) => {
    const label = t(`admin.toolFiles.${key}`);
    return label === `admin.toolFiles.${key}` ? key : label;
  };

  return (
    <Card className="border-2 border-indigo-200">
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileCog className="w-5 h-5 text-indigo-600" />
          <CardTitle>{t('admin.toolFiles.title')}</CardTitle>
        </div>
        <CardDescription>{t('admin.toolFiles.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {feedback && (
          <Alert className={feedback.type === 'success' ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}>
            {feedback.type === 'success'
              ? <CheckCircle2 className="w-4 h-4 text-green-600" />
              : <AlertCircle className="w-4 h-4 text-red-600" />}
            <AlertDescription className={feedback.type === 'success' ? 'text-green-800 ml-2' : 'text-red-800 ml-2'}>
              {feedback.text}
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <p className="text-sm text-gray-500">...</p>
        ) : (
          tools.map((tool) => (
            <div key={tool.key} className="rounded-xl border border-gray-200 p-4 bg-white">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <span className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                  <Wrench className="w-5 h-5 text-indigo-600" />
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-gray-900">{toolLabel(tool.key)}</h4>
                    <Badge className={tool.overridden ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-700'}>
                      {tool.overridden ? t('admin.toolFiles.custom') : t('admin.toolFiles.defaultFile')}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5 truncate">
                    <span className="font-medium">{t('admin.toolFiles.currentFile')}:</span> {tool.filename}
                    {tool.overridden && tool.size != null && (
                      <span className="text-gray-400"> · {formatBytes(tool.size)}</span>
                    )}
                  </p>
                  {tool.overridden && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {t('admin.toolFiles.updatedAt')}: {formatDate(tool.updated_at)}
                      {tool.updated_by ? ` · ${t('admin.toolFiles.updatedBy')}: ${tool.updated_by}` : ''}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <a href={`${apiBase}/api/tools/${tool.key}`} download>
                    <Button type="button" variant="outline" size="sm" className="rounded-lg">
                      <Download className="w-4 h-4 mr-1" />
                      {t('admin.toolFiles.download')}
                    </Button>
                  </a>

                  {canWrite && (
                    <>
                      <input
                        ref={(el) => { fileInputs.current[tool.key] = el; }}
                        type="file"
                        className="hidden"
                        onChange={(e) => handleUpload(tool.key, e.target.files?.[0])}
                      />
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
                        disabled={busyKey === tool.key}
                        onClick={() => fileInputs.current[tool.key]?.click()}
                      >
                        <Upload className="w-4 h-4 mr-1" />
                        {busyKey === tool.key ? t('admin.toolFiles.uploading') : t('admin.toolFiles.upload')}
                      </Button>
                      {tool.overridden && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-lg border-red-200 text-red-600 hover:bg-red-50"
                          disabled={busyKey === tool.key}
                          onClick={() => handleRevert(tool.key)}
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          {t('admin.toolFiles.revert')}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {canWrite && !loading && (
          <p className="text-xs text-gray-400">{t('admin.toolFiles.hint')}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ToolFilesPanel;

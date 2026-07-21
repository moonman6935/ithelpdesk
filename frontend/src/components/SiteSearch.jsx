import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Search, X, CornerDownLeft, ArrowUp, ArrowDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { SEARCH_ENTRIES, searchSite } from '../lib/searchIndex';
import { resetBodyInteraction } from '../lib/resetBodyInteraction';
import '../styles/site-search.css';

const SiteSearch = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const results = useMemo(() => {
    if (!query.trim()) return SEARCH_ENTRIES.slice(0, 6);
    return searchSite(query, language, { limit: 8 });
  }, [query, language]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setActive(0);
    resetBodyInteraction();
  }, []);

  const go = useCallback((entry) => {
    if (!entry) return;
    close();
    navigate(entry.path);
  }, [close, navigate]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    if (!open) return undefined;
    document.body.style.overflow = 'hidden';
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      cancelAnimationFrame(id);
      resetBodyInteraction();
    };
  }, [open]);

  // Global keyboard shortcut: Ctrl/Cmd+K
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(results[active]);
    }
  };

  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const button = (
    <button
      type="button"
      onClick={() => setOpen(true)}
      title={t('search.button')}
      aria-label={t('search.button')}
      className="site-search-trigger group flex items-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 px-3 py-2 text-white/90 transition-all duration-300 hover:bg-white/20 hover:border-white/60 md:min-w-[280px] lg:min-w-[340px]"
    >
      <Search className="w-4 h-4 shrink-0" />
      <span className="hidden md:inline text-sm font-medium whitespace-nowrap">{t('search.button')}</span>
      <span className="hidden md:inline text-[10px] font-semibold rounded-md bg-white/20 px-1.5 py-0.5 ml-auto">Ctrl K</span>
    </button>
  );

  const modal = open ? createPortal(
    <div className="site-search-overlay" role="dialog" aria-modal="true" onMouseDown={close}>
      <div className="site-search-panel" onMouseDown={(e) => e.stopPropagation()}>
        <div className="site-search-inputRow">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t('search.placeholder')}
            className="site-search-input"
            autoComplete="off"
            spellCheck={false}
          />
          <button type="button" onClick={close} className="site-search-close" aria-label={t('search.close')}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="site-search-results" ref={listRef}>
          {results.length === 0 ? (
            <div className="site-search-empty">
              <Search className="w-8 h-8 text-slate-300 mb-2" />
              <p className="font-medium text-slate-600">{t('search.noResults')}</p>
              <p className="text-sm text-slate-400">{t('search.noResultsHint')}</p>
            </div>
          ) : (
            <>
              {!query.trim() && (
                <div className="site-search-sectionLabel">{t('search.suggested')}</div>
              )}
              {results.map((entry, idx) => {
                const Icon = entry.icon;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    data-idx={idx}
                    onMouseEnter={() => setActive(idx)}
                    onClick={() => go(entry)}
                    className={`site-search-item ${idx === active ? 'is-active' : ''}`}
                  >
                    <span className="site-search-itemIcon">
                      <Icon className="w-5 h-5" />
                    </span>
                    <span className="site-search-itemText">
                      <span className="site-search-itemTitle">{entry.title[language] || entry.title.en}</span>
                      <span className="site-search-itemDesc">{entry.description[language] || entry.description.en}</span>
                    </span>
                    {idx === active && <CornerDownLeft className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />}
                  </button>
                );
              })}
            </>
          )}
        </div>

        <div className="site-search-footer">
          <span className="site-search-hintItem"><ArrowUp className="w-3 h-3" /><ArrowDown className="w-3 h-3" /> {t('search.hintNavigate')}</span>
          <span className="site-search-hintItem"><CornerDownLeft className="w-3 h-3" /> {t('search.hintOpen')}</span>
          <span className="site-search-hintItem">Esc {t('search.hintClose')}</span>
        </div>
      </div>
    </div>,
    document.body,
  ) : null;

  return (
    <>
      {button}
      {modal}
    </>
  );
};

export default SiteSearch;

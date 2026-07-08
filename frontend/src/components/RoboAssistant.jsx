import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { roboTranslations } from '../translations/roboTranslations';
import { getFlowNode, ROCKET_CHAT_URL } from '../lib/roboFlows';
import {
  X,
  ArrowLeft,
  Check,
  ExternalLink,
  MessageCircle,
  PartyPopper,
  Monitor,
  Headphones,
  Laptop,
  Wifi,
  Truck,
  ClipboardCheck,
  Download,
  Key,
  Volume2,
  Mic,
  Plug,
  RefreshCw,
  AlertCircle,
  Play,
  Layers,
  RotateCcw,
} from 'lucide-react';
import RoboDog, { RoboDogArena } from './RoboDog';

const SEARCH_DURATION_MS = 4200;

const ICON_MAP = {
  monitor: Monitor,
  headphones: Headphones,
  laptop: Laptop,
  wifi: Wifi,
  truck: Truck,
  clipboard: ClipboardCheck,
  download: Download,
  key: Key,
  volume: Volume2,
  mic: Mic,
  plug: Plug,
  refresh: RefreshCw,
  alert: AlertCircle,
  play: Play,
  display: Monitor,
  layers: Layers,
};

function useRoboT() {
  const { language } = useLanguage();
  return useCallback(
    (key) => {
      const path = key.startsWith('robo.') ? key.slice(5) : key;
      const parts = path.split('.');
      let obj = roboTranslations[language] || roboTranslations.tr;
      for (const p of parts) {
        obj = obj?.[p];
      }
      if (typeof obj === 'string') return obj;
      let fallback = roboTranslations.tr;
      for (const p of parts) {
        fallback = fallback?.[p];
      }
      return typeof fallback === 'string' ? fallback : key;
    },
    [language]
  );
}

function RoboOverlay({ onClose }) {
  const t = useRoboT();
  const navigate = useNavigate();
  const [nodeId, setNodeId] = useState('root');
  const [slideDir, setSlideDir] = useState('forward');
  const [checked, setChecked] = useState({});
  const [showTyping, setShowTyping] = useState(false);
  const [phase, setPhase] = useState('flow');
  const [dogMode, setDogMode] = useState('roam');
  const [isSearching, setIsSearching] = useState(false);

  const node = getFlowNode(nodeId);

  const syncDogModeForNode = useCallback((id, flowPhase) => {
    if (flowPhase === 'resolved' || flowPhase === 'escalate') {
      setDogMode('roam');
      return;
    }
    const n = getFlowNode(id);
    if (n.type === 'choices') setDogMode('still');
    else if (n.type === 'checklist') setDogMode('roam');
    else setDogMode('still');
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setDogMode('roam');
    const settle = window.setTimeout(() => {
      syncDogModeForNode('root', 'flow');
    }, 2200);
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(settle);
    };
  }, [syncDogModeForNode]);

  const goTo = (nextId, dir = 'forward') => {
    setSlideDir(dir);
    setNodeId(nextId);
    setChecked({});
    setPhase('flow');
    setShowTyping(false);
    setIsSearching(false);
    syncDogModeForNode(nextId, 'flow');
  };

  const goToAfterSearch = (nextId, dir = 'forward') => {
    setIsSearching(true);
    setDogMode('search');
    setSlideDir(dir);
    window.setTimeout(() => {
      goTo(nextId, dir);
    }, SEARCH_DURATION_MS);
  };

  const handleBack = () => {
    if (phase !== 'flow') {
      setPhase('flow');
      syncDogModeForNode(nodeId, 'flow');
      return;
    }
    const parent = node.parent;
    if (parent) goTo(parent, 'back');
  };

  const handleChoice = (option) => {
    if (option.link) {
      onClose();
      navigate(option.link);
      return;
    }
    if (option.next) goToAfterSearch(option.next, 'forward');
  };

  const toggleCheck = (itemKey) => {
    setChecked((prev) => ({ ...prev, [itemKey]: !prev[itemKey] }));
  };

  const checklistItems = node.type === 'checklist' ? node.itemKeys || [] : [];
  const checkedCount = checklistItems.filter((k) => checked[k]).length;
  const allChecked = checklistItems.length > 0 && checkedCount === checklistItems.length;

  const renderChoices = () => {
    const options = node.options || [];

    return (
      <div className={`robo-panel ${slideDir === 'back' ? 'robo-panel--back' : ''}`}>
        <div className="robo-bubble">
          {node.greetingKey ? (
            <>
              <h2 className="robo-bubble__title">{t(node.greetingKey)}</h2>
              <p className="robo-bubble__text">{t(node.messageKey)}</p>
            </>
          ) : (
            <h2 className="robo-bubble__title">{t(node.messageKey)}</h2>
          )}
        </div>
        <div className="robo-choices">
          {options.map((opt, i) => {
            const Icon = ICON_MAP[opt.icon] || Monitor;
            return (
              <button
                key={opt.id}
                type="button"
                className="robo-choice"
                style={{ animationDelay: `${i * 0.06}s` }}
                onClick={() => handleChoice(opt)}
              >
                <span className="robo-choice__icon">
                  <Icon className="w-5 h-5 text-cyan-200" />
                </span>
                <span className="robo-choice__label">{t(opt.labelKey)}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderChecklist = () => (
    <div className={`robo-panel ${slideDir === 'back' ? 'robo-panel--back' : ''}`}>
      <div className="robo-bubble">
        <h2 className="robo-bubble__title">{t(node.titleKey)}</h2>
        <p className="robo-bubble__text">{t('robo.checklistHint')}</p>
      </div>

      <div className="robo-progress">
        <div className="robo-progress__label">
          <span>{t('robo.progress')}</span>
          <span>
            {checkedCount}/{checklistItems.length}
          </span>
        </div>
        <div className="robo-progress__bar">
          <div
            className="robo-progress__fill"
            style={{ width: `${checklistItems.length ? (checkedCount / checklistItems.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="robo-checklist">
        {checklistItems.map((itemKey, i) => {
          const done = Boolean(checked[itemKey]);
          return (
            <button
              key={itemKey}
              type="button"
              className={`robo-check-item ${done ? 'robo-check-item--done' : ''}`}
              style={{ animationDelay: `${i * 0.07}s` }}
              onClick={() => toggleCheck(itemKey)}
            >
              <span className="robo-check-item__box">
                {done && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
              </span>
              <span className="robo-check-item__text">{t(itemKey)}</span>
            </button>
          );
        })}
      </div>

      {node.guideLink && (
        <div className="mt-4">
          <button
            type="button"
            className="robo-btn robo-btn--link w-full"
            onClick={() => {
              onClose();
              navigate(node.guideLink);
            }}
          >
            <ExternalLink className="w-4 h-4" />
            {t(node.guideLabelKey)}
          </button>
        </div>
      )}

      {allChecked && (
        <div className="robo-footer-actions">
          <p className="text-center text-cyan-300 font-semibold text-sm mb-1">
            {t('robo.allChecked')}
          </p>
          <p className="text-center text-white/70 text-sm mb-2">{t('robo.resolvedQuestion')}</p>
          <button
            type="button"
            className="robo-btn robo-btn--primary w-full"
            onClick={() => {
              setPhase('resolved');
              setDogMode('roam');
            }}
          >
            <PartyPopper className="w-5 h-5" />
            {t('robo.resolvedYes')}
          </button>
          <button
            type="button"
            className="robo-btn robo-btn--rocket w-full"
            onClick={() => {
              setPhase('escalate');
              setDogMode('roam');
            }}
          >
            <MessageCircle className="w-5 h-5" />
            {t('robo.resolvedNo')}
          </button>
        </div>
      )}
    </div>
  );

  const renderResolved = () => (
    <div className="robo-panel robo-result">
      <div className="robo-result__icon robo-result__icon--success">
        <PartyPopper className="w-10 h-10 text-white" />
      </div>
      <h2 className="robo-result__title">{t('robo.resolvedTitle')}</h2>
      <p className="robo-result__text">{t('robo.resolvedMessage')}</p>
      <button type="button" className="robo-btn robo-btn--primary" onClick={onClose}>
        {t('robo.close')}
      </button>
      <button
        type="button"
        className="robo-btn robo-btn--secondary mt-3 w-full max-w-xs mx-auto"
        onClick={() => goTo('root', 'back')}
      >
        <RotateCcw className="w-4 h-4" />
        {t('robo.restart')}
      </button>
    </div>
  );

  const renderEscalate = () => (
    <div className="robo-panel robo-result">
      <div className="robo-result__icon robo-result__icon--escalate">
        <MessageCircle className="w-10 h-10 text-white" />
      </div>
      <h2 className="robo-result__title">{t('robo.escalateTitle')}</h2>
      <p className="robo-result__text">{t('robo.escalateMessage')}</p>
      <p className="robo-result__tip">{t('robo.escalateTip')}</p>
      <a
        href={ROCKET_CHAT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="robo-btn robo-btn--rocket inline-flex"
      >
        <ExternalLink className="w-5 h-5" />
        {t('robo.openRocketChat')}
      </a>
      <button
        type="button"
        className="robo-btn robo-btn--secondary mt-3 w-full max-w-xs mx-auto"
        onClick={() => goTo('root', 'back')}
      >
        <RotateCcw className="w-4 h-4" />
        {t('robo.restart')}
      </button>
    </div>
  );

  let content = null;
  if (isSearching) {
    content = (
      <div className="robo-panel">
        <div className="robo-bubble robo-bubble--search">
          <p className="robo-bubble__title">{t('robo.searchingTitle')}</p>
          <p className="robo-bubble__text">{t('robo.searching')}</p>
          <div className="robo-typing">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    );
  } else if (showTyping) {
    content = (
      <div className="robo-panel">
        <div className="robo-bubble">
          <p className="robo-bubble__text mb-2">{t('robo.typing')}</p>
          <div className="robo-typing">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    );
  } else if (phase === 'resolved') {
    content = renderResolved();
  } else if (phase === 'escalate') {
    content = renderEscalate();
  } else if (node.type === 'choices') {
    content = renderChoices();
  } else if (node.type === 'checklist') {
    content = renderChecklist();
  }

  const canGoBack = phase !== 'flow' || (node.parent && nodeId !== 'root');

  return (
    <div className="robo-overlay" role="dialog" aria-modal="true" aria-label="Robo">
      <div className="robo-overlay__grid" aria-hidden="true" />
      <div className="robo-overlay__glow robo-overlay__glow--a" aria-hidden="true" />
      <div className="robo-overlay__glow robo-overlay__glow--b" aria-hidden="true" />

      <header className="robo-overlay__header">
        <div className="robo-overlay__brand">
          {canGoBack && (
            <button
              type="button"
              onClick={handleBack}
              className="mr-2 p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label={t('robo.back')}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="robo-overlay__avatar robo-overlay__avatar--dog">
            <RoboDog mode="still" size="sm" />
          </div>
          <div>
            <p className="robo-overlay__name">Robo</p>
            <p className="robo-overlay__status">
              <span className="robo-overlay__status-dot" />
              DCS IT Assistant
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          aria-label={t('robo.close')}
        >
          <X className="w-6 h-6" />
        </button>
      </header>

      <div className="robo-overlay__layout">
        <div className="robo-overlay__body">{content}</div>
        <RoboDogArena mode={dogMode} hint={dogMode === 'search' ? t('robo.searching') : ''} />
      </div>
    </div>
  );
}

const RoboAssistant = () => {
  const t = useRoboT();
  const [open, setOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('robo-bubble-dismissed') === '1') return undefined;

    const showTimer = window.setTimeout(() => setShowBubble(true), 1800);
    const hideTimer = window.setTimeout(() => setShowBubble(false), 14000);

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  const dismissBubble = () => {
    setShowBubble(false);
    sessionStorage.setItem('robo-bubble-dismissed', '1');
  };

  const handleOpen = () => {
    dismissBubble();
    setOpen(true);
  };

  return (
    <>
      <div className="robo-fab">
        {showBubble && !open && (
          <div className="robo-fab__bubble" role="status">
            <button
              type="button"
              className="robo-fab__bubble-close"
              onClick={dismissBubble}
              aria-label={t('robo.close')}
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <p className="robo-fab__bubble-text">{t('robo.fabBubble')}</p>
            <span className="robo-fab__bubble-tail" aria-hidden="true" />
          </div>
        )}

        <button
          type="button"
          className="robo-fab__btn"
          onClick={handleOpen}
          aria-label={t('robo.fabLabel')}
        >
          <RoboDog mode="still" size="fab" className="robo-fab__dog" />
        </button>
        <span className="robo-fab__label">Robo</span>
      </div>

      {open &&
        createPortal(
          <RoboOverlay onClose={() => setOpen(false)} />,
          document.body
        )}
    </>
  );
};

export default RoboAssistant;

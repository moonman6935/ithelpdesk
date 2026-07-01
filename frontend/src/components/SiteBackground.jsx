import React from 'react';
import {
  Monitor,
  Laptop,
  Headphones,
  Keyboard,
  Mic,
  RefreshCw,
  Cable,
  ScreenShare,
  Server,
  Mouse,
  Wifi,
} from 'lucide-react';

function WindowsMark({ size = 28, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="currentColor" d="M3 5.5 10 4.5v7H3V5.5zm0 8.5h7v7.5l-7-1V14zm8.5-9.5L21 3v8.5h-9.5V4.5zm0 9.5H21V22l-9.5-1.5V14z" />
    </svg>
  );
}

function AppleMark({ size = 28, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.92.65.03 2.47.26 3.63 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
      />
    </svg>
  );
}

function CitrixMark({ size = 28, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path fill="currentColor" d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    </svg>
  );
}

const LEFT_DECOR = [
  { type: 'windows', top: '14%', left: '2%', size: 32, rotate: -14, color: 'text-blue-400/35' },
  { Icon: Keyboard, top: '28%', left: '5%', size: 30, rotate: 8, color: 'text-slate-400/35' },
  { type: 'apple', top: '44%', left: '1.5%', size: 30, rotate: -6, color: 'text-slate-500/30' },
  { Icon: Mic, top: '58%', left: '6%', size: 26, rotate: 12, color: 'text-violet-400/35' },
  { Icon: Mouse, top: '72%', left: '3%', size: 24, rotate: -10, color: 'text-slate-400/30' },
  { Icon: Server, top: '86%', left: '5.5%', size: 28, rotate: 6, color: 'text-emerald-400/30' },
  { type: 'citrix', top: '36%', left: '3.5%', size: 26, rotate: 0, color: 'text-teal-400/28' },
  { Icon: Wifi, top: '66%', left: '1%', size: 20, rotate: -8, color: 'text-blue-300/25' },
];

const RIGHT_DECOR = [
  { Icon: Headphones, top: '16%', right: '2.5%', size: 34, rotate: 10, color: 'text-emerald-400/40' },
  { Icon: ScreenShare, top: '30%', right: '5%', size: 30, rotate: -8, color: 'text-indigo-400/35' },
  { Icon: Cable, top: '46%', right: '1.5%', size: 32, rotate: 14, color: 'text-teal-400/35' },
  { Icon: Monitor, top: '60%', right: '6%', size: 28, rotate: -12, color: 'text-blue-400/30' },
  { Icon: Keyboard, top: '74%', right: '2%', size: 26, rotate: 5, color: 'text-slate-400/30' },
  { Icon: Mic, top: '88%', right: '5%', size: 24, rotate: -6, color: 'text-violet-400/28' },
  { Icon: Laptop, top: '40%', right: '3.5%', size: 22, rotate: 8, color: 'text-slate-500/25' },
  { type: 'windows', top: '52%', right: '1%', size: 22, rotate: 8, color: 'text-blue-400/22' },
];

function FloatingDecor({ item }) {
  const style = {
    top: item.top,
    left: item.left,
    right: item.right,
    transform: `rotate(${item.rotate}deg)`,
  };

  const className = `absolute ${item.color}`;

  if (item.type === 'windows') {
    return (
      <div className={className} style={style}>
        <WindowsMark size={item.size} />
      </div>
    );
  }
  if (item.type === 'apple') {
    return (
      <div className={className} style={style}>
        <AppleMark size={item.size} />
      </div>
    );
  }
  if (item.type === 'citrix') {
    return (
      <div className={className} style={style}>
        <CitrixMark size={item.size} />
      </div>
    );
  }

  const { Icon } = item;
  return (
    <div className={className} style={style}>
      <Icon size={item.size} strokeWidth={1.25} />
    </div>
  );
}

const SiteBackground = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
    <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-red-50/50" />
    <div className="absolute -top-40 -right-32 w-[28rem] h-[28rem] rounded-full bg-red-200/25 blur-3xl" />
    <div className="absolute top-[20%] -left-28 w-80 h-80 rounded-full bg-blue-200/20 blur-3xl" />
    <div className="absolute top-[55%] right-[10%] w-72 h-72 rounded-full bg-emerald-200/20 blur-3xl" />
    <div className="absolute bottom-[5%] left-[20%] w-96 h-96 rounded-full bg-violet-200/15 blur-3xl" />
    <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-orange-200/15 blur-2xl" />

    {/* Kenar vektör ikonları — geniş ekranlarda */}
    <div className="hidden xl:block absolute inset-0">
      {LEFT_DECOR.map((item, i) => (
        <FloatingDecor key={`l-${i}`} item={item} />
      ))}
      {RIGHT_DECOR.map((item, i) => (
        <FloatingDecor key={`r-${i}`} item={item} />
      ))}
    </div>

    {/* Orta alanın dışında kalan bölgeye ekstra küçük ikonlar (2xl+) */}
    <div className="hidden 2xl:block absolute inset-0">
      <div className="absolute top-[22%] left-[9%] rotate-12 text-blue-300/20">
        <WindowsMark size={20} />
      </div>
      <Headphones className="absolute top-[48%] right-[10%] w-5 h-5 text-green-300/20 -rotate-6" strokeWidth={1} />
      <Keyboard className="absolute top-[78%] left-[8%] w-5 h-5 text-slate-300/20 rotate-6" strokeWidth={1} />
      <ScreenShare className="absolute top-[65%] right-[9%] w-5 h-5 text-indigo-300/20 -rotate-[8deg]" strokeWidth={1} />
      <Mic className="absolute top-[32%] right-[11%] w-4 h-4 text-purple-300/18" strokeWidth={1} />
      <Cable className="absolute top-[55%] left-[10%] w-4 h-4 text-teal-300/18 -rotate-[12deg]" strokeWidth={1} />
      <div className="absolute top-[38%] left-[11%] text-slate-300/18 rotate-[-6deg]">
        <AppleMark size={18} />
      </div>
    </div>

    <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-400" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  </div>
);

export default SiteBackground;

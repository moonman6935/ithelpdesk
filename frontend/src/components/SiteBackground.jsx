import React from 'react';

const SiteBackground = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
    <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-red-50/50" />
    <div className="absolute -top-40 -right-32 w-[28rem] h-[28rem] rounded-full bg-red-200/25 blur-3xl" />
    <div className="absolute top-[20%] -left-28 w-80 h-80 rounded-full bg-blue-200/20 blur-3xl" />
    <div className="absolute top-[55%] right-[10%] w-72 h-72 rounded-full bg-emerald-200/20 blur-3xl" />
    <div className="absolute bottom-[5%] left-[20%] w-96 h-96 rounded-full bg-violet-200/15 blur-3xl" />
    <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-orange-200/15 blur-2xl" />
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

export const ANNOUNCEMENT_BACKGROUNDS = [
  { id: 'red', gradient: 'from-red-500 via-red-600 to-orange-500' },
  { id: 'blue', gradient: 'from-blue-600 via-blue-700 to-indigo-700' },
  { id: 'green', gradient: 'from-emerald-500 via-teal-600 to-cyan-600' },
  { id: 'orange', gradient: 'from-orange-500 via-amber-500 to-yellow-600' },
  { id: 'violet', gradient: 'from-violet-600 via-purple-600 to-fuchsia-600' },
  { id: 'slate', gradient: 'from-slate-700 via-slate-800 to-gray-900' },
];

export const PRIORITY_STYLES = {
  high: {
    badge: 'bg-red-600 text-white',
    ring: 'ring-red-400',
  },
  medium: {
    badge: 'bg-amber-500 text-white',
    ring: 'ring-amber-400',
  },
  low: {
    badge: 'bg-blue-500 text-white',
    ring: 'ring-blue-400',
  },
};

export function getBackgroundGradient(id) {
  return ANNOUNCEMENT_BACKGROUNDS.find((b) => b.id === id)?.gradient
    || ANNOUNCEMENT_BACKGROUNDS[0].gradient;
}

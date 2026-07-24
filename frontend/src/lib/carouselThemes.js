import {
  Sparkles,
  Download,
  Monitor,
  RefreshCw,
  MessageSquare,
  Package,
  ShieldCheck,
  Laptop,
  Cable,
  Truck,
  ClipboardCheck,
  Headphones,
  AlertCircle,
  HelpCircle,
  Ticket,
  Video,
  Home,
  Megaphone,
  Wifi,
  Settings,
  Bell,
  Star,
  Zap,
  Globe,
  UserCog,
} from 'lucide-react';

export const CAROUSEL_TEMPLATES = [
  { id: 'red', gradient: 'from-red-500 via-red-600 to-orange-500', blob: 'bg-yellow-300/30' },
  { id: 'indigo', gradient: 'from-indigo-600 via-blue-700 to-violet-800', blob: 'bg-indigo-300/30' },
  { id: 'blue', gradient: 'from-blue-600 via-blue-700 to-indigo-700', blob: 'bg-sky-300/30' },
  { id: 'emerald', gradient: 'from-emerald-500 via-teal-600 to-cyan-600', blob: 'bg-lime-300/30' },
  { id: 'violet', gradient: 'from-violet-600 via-purple-600 to-fuchsia-600', blob: 'bg-pink-300/30' },
  { id: 'amber', gradient: 'from-amber-500 via-orange-600 to-red-600', blob: 'bg-amber-300/30' },
  { id: 'slate', gradient: 'from-slate-600 via-slate-700 to-zinc-800', blob: 'bg-slate-300/30' },
  { id: 'cyan', gradient: 'from-cyan-600 via-blue-600 to-indigo-700', blob: 'bg-cyan-300/30' },
  { id: 'teal', gradient: 'from-teal-600 via-green-600 to-emerald-700', blob: 'bg-teal-300/30' },
  { id: 'rose', gradient: 'from-rose-500 via-pink-600 to-red-700', blob: 'bg-rose-300/30' },
  { id: 'orange', gradient: 'from-orange-500 via-amber-500 to-yellow-600', blob: 'bg-yellow-300/30' },
];

export const CAROUSEL_ICON_MAP = {
  sparkles: Sparkles,
  download: Download,
  monitor: Monitor,
  refresh: RefreshCw,
  message: MessageSquare,
  package: Package,
  shield: ShieldCheck,
  laptop: Laptop,
  cable: Cable,
  truck: Truck,
  clipboard: ClipboardCheck,
  headphones: Headphones,
  alert: AlertCircle,
  help: HelpCircle,
  ticket: Ticket,
  video: Video,
  home: Home,
  megaphone: Megaphone,
  wifi: Wifi,
  settings: Settings,
  bell: Bell,
  star: Star,
  zap: Zap,
  globe: Globe,
  userCog: UserCog,
};

export const CAROUSEL_ICONS = Object.keys(CAROUSEL_ICON_MAP);

export const CAROUSEL_TEMPLATE_IDS = CAROUSEL_TEMPLATES.map((t) => t.id);

export function getCarouselTemplate(templateId) {
  return CAROUSEL_TEMPLATES.find((t) => t.id === templateId) || CAROUSEL_TEMPLATES[0];
}

export function getCarouselIcon(iconId) {
  return CAROUSEL_ICON_MAP[iconId] || Sparkles;
}

export function buildSlideMeta(templateId, iconId) {
  const template = getCarouselTemplate(templateId);
  const Icon = getCarouselIcon(iconId);
  return {
    gradient: template.gradient,
    blob: template.blob,
    Icon,
    templateId: template.id,
    iconId: iconId || 'sparkles',
  };
}

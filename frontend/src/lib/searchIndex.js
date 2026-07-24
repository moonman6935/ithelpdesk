import {
  Home,
  Monitor,
  Headphones,
  AlertCircle,
  HelpCircle,
  ClipboardCheck,
  Truck,
  Video,
  Download,
  Laptop,
  RefreshCw,
  UserCog,
} from 'lucide-react';

/**
 * Searchable pages of the site. Each entry has localized title/description and a
 * generous list of keywords (including common typos & simple wordings) per language
 * so that even loosely-typed queries resolve to the right page.
 */
export const SEARCH_ENTRIES = [
  {
    id: 'home',
    path: '/',
    icon: Home,
    title: { tr: 'Ana Sayfa', de: 'Startseite', en: 'Home', fr: 'Accueil', ka: 'მთავარი' },
    description: {
      tr: 'DCS IT Yardım Masası ana sayfası',
      de: 'DCS IT Helpdesk Startseite',
      en: 'DCS IT Help Desk home page',
      fr: 'Page d\'accueil du helpdesk informatique DCS',
      ka: 'DCS IT დახმარების სამსახურის მთავარი გვერდი',
    },
    keywords: {
      tr: ['ana sayfa', 'anasayfa', 'ana', 'giris', 'baslangic', 'home', 'ilk sayfa', 'menu'],
      de: ['startseite', 'start', 'hauptseite', 'home', 'anfang'],
      en: ['home', 'main', 'start', 'landing', 'homepage'],
      fr: ['accueil', 'page d accueil', 'home', 'debut', 'menu', 'portail'],
      ka: ['მთავარი', 'მთავარი გვერდი', 'დასაწყისი', 'მენიუ', 'home'],
    },
  },
  {
    id: 'pc-setup',
    path: '/pc-setup',
    icon: Monitor,
    title: { tr: 'PC Kurulumu', de: 'PC-Einrichtung', en: 'PC Setup', fr: 'Installation du PC', ka: 'PC დაყენება' },
    description: {
      tr: 'Yeni bilgisayar kurulum rehberi',
      de: 'Anleitung zur Einrichtung eines neuen Computers',
      en: 'New computer setup guide',
      fr: 'Guide d\'installation d\'un nouvel ordinateur',
      ka: 'ახალი კომპიუტერის დაყენების სახელმძღვანელო',
    },
    keywords: {
      tr: ['pc kurulum', 'pc kurulumu', 'bilgisayar kurulum', 'bilgisayar kurulumu', 'kurulum', 'pc', 'bilgisayar', 'setup', 'kurmak', 'yeni bilgisayar', 'pc kur', 'bilgisayar kur'],
      de: ['pc einrichtung', 'computer einrichten', 'pc setup', 'installation', 'pc', 'computer', 'neuer computer', 'einrichten'],
      en: ['pc setup', 'computer setup', 'setup', 'pc', 'computer', 'install pc', 'new computer', 'configure pc'],
      fr: ['installation pc', 'installation ordinateur', 'pc', 'ordinateur', 'setup', 'configurer pc', 'nouvel ordinateur'],
      ka: ['pc', 'კომპიუტერი', 'დაყენება', 'ინსტალაცია', 'ახალი კომპიუტერი', 'pc setup'],
    },
  },
  {
    id: 'headset-test',
    path: '/headset-test',
    icon: Headphones,
    title: { tr: 'Kulaklık Testi', de: 'Headset-Test', en: 'Headset Test', fr: 'Test du casque', ka: 'ყურსასმენის ტესტი' },
    description: {
      tr: 'USB kulaklık ses ve mikrofon testi',
      de: 'USB-Headset Ton- und Mikrofontest',
      en: 'USB headset audio and microphone test',
      fr: 'Test audio et microphone du casque USB',
      ka: 'USB ყურსასმენის ხმისა და მიკროფონის ტესტი',
    },
    keywords: {
      tr: ['kulaklik testi', 'kulaklik test', 'kulaklik', 'mikrofon', 'mikrofon testi', 'ses testi', 'ses', 'headset', 'kulaklik dene', 'usb kulaklik', 'mic test'],
      de: ['headset test', 'kopfhorer', 'mikrofon', 'mikrofon test', 'ton test', 'audio test', 'headset', 'usb headset'],
      en: ['headset test', 'headphones', 'microphone', 'mic test', 'audio test', 'sound test', 'headset', 'usb headset', 'speaker test'],
      fr: ['test casque', 'casque', 'microphone', 'micro', 'test audio', 'son', 'headset', 'casque usb'],
      ka: ['ყურსასმენი', 'მიკროფონი', 'ხმა', 'ტესტი', 'headset', 'usb'],
    },
  },
  {
    id: 'troubleshooting',
    path: '/troubleshooting',
    icon: AlertCircle,
    title: { tr: 'Sorun Giderme', de: 'Fehlerbehebung', en: 'Troubleshooting', fr: 'Dépannage', ka: 'პრობლემების მოგვარება' },
    description: {
      tr: 'Yaygın sorunlar için çözümler',
      de: 'Lösungen für häufige Probleme',
      en: 'Solutions for common problems',
      fr: 'Solutions aux problèmes courants',
      ka: 'ხშირი პრობლემების გადაწყვეტილებები',
    },
    keywords: {
      tr: ['sorun giderme', 'sorun', 'problem', 'cozum', 'hata', 'ariza', 'calismiyor', 'sorunlar', 'destek', 'yardim', 'duzeltme'],
      de: ['fehlerbehebung', 'problem', 'losung', 'fehler', 'funktioniert nicht', 'hilfe', 'support', 'probleme'],
      en: ['troubleshooting', 'problem', 'issue', 'fix', 'error', 'not working', 'help', 'support', 'solutions'],
      fr: ['depannage', 'probleme', 'solution', 'erreur', 'ne fonctionne pas', 'aide', 'support', 'problemes'],
      ka: ['პრობლემა', 'მოგვარება', 'შეცდომა', 'დახმარება', 'გამოსწორება', 'არ მუშაობს'],
    },
  },
  {
    id: 'faq',
    path: '/faq',
    icon: HelpCircle,
    title: { tr: 'Sıkça Sorulan Sorular', de: 'Häufig gestellte Fragen', en: 'FAQ', fr: 'FAQ', ka: 'ხშირად დასმული კითხვები' },
    description: {
      tr: 'Sık sorulan sorular ve adım adım yanıtlar',
      de: 'Häufige Fragen und Schritt-für-Schritt-Antworten',
      en: 'Frequently asked questions and step-by-step answers',
      fr: 'Questions fréquentes et réponses étape par étape',
      ka: 'ხშირი კითხვები და ნაბიჯ-ნაბიჯ პასუხები',
    },
    keywords: {
      tr: ['sss', 'sik sorulan sorular', 'sorular', 'faq', 'yardim', 'nasil yapilir', 'rehber', 'rehberler', 'soru cevap'],
      de: ['faq', 'haufige fragen', 'fragen', 'hilfe', 'anleitung', 'wie geht', 'antworten'],
      en: ['faq', 'frequently asked questions', 'questions', 'help', 'guide', 'how to', 'answers'],
      fr: ['faq', 'questions frequentes', 'questions', 'aide', 'guide', 'comment faire', 'reponses'],
      ka: ['faq', 'კითხვები', 'პასუხები', 'ხშირი კითხვები', 'დახმარება'],
    },
  },
  {
    id: 'agent-setup',
    path: '/agent-ilk-kurulum',
    icon: UserCog,
    title: {
      tr: 'Personel İlk Kurulum',
      de: 'Personal-Ersteinrichtung',
      en: 'Personnel First Setup',
      fr: 'Première installation du personnel',
      ka: 'პერსონალის პირველი დაყენება',
    },
    description: {
      tr: 'AnyDesk, Rocket.Chat ve Citrix tek dosyayla kurulum rehberi',
      de: 'AnyDesk, Rocket.Chat und Citrix mit einer Datei installieren',
      en: 'Install AnyDesk, Rocket.Chat and Citrix with one setup file',
      fr: 'Installer AnyDesk, Rocket.Chat et Citrix avec un seul fichier',
      ka: 'AnyDesk, Rocket.Chat და Citrix ერთი ფაილით დაყენების სახელმძღვანელო',
    },
    keywords: {
      tr: ['personel kurulum', 'ilk kurulum', 'agent kurulum', 'anydesk', 'rocketchat', 'citrix', 'yonetici', 'uac', 'agent setup'],
      de: ['personal', 'ersteinrichtung', 'agent', 'anydesk', 'rocketchat', 'citrix', 'administrator', 'uac'],
      en: ['personnel', 'first setup', 'agent setup', 'anydesk', 'rocketchat', 'citrix', 'administrator', 'uac'],
      fr: ['personnel', 'premiere installation', 'agent', 'anydesk', 'rocketchat', 'citrix', 'administrateur', 'uac'],
      ka: ['პერსონალი', 'პირველი დაყენება', 'anydesk', 'rocketchat', 'citrix', 'ადმინისტრატორი'],
    },
  },
  {
    id: 'citrix-setup',
    path: '/faq/citrix-kurulum',
    icon: Download,
    title: { tr: 'Citrix Kurulumu', de: 'Citrix-Installation', en: 'Citrix Setup', fr: 'Installation de Citrix', ka: 'Citrix-ის დაყენება' },
    description: {
      tr: 'Citrix Workspace adım adım kurulum rehberi',
      de: 'Citrix Workspace Schritt-für-Schritt Installationsanleitung',
      en: 'Citrix Workspace step-by-step setup guide',
      fr: 'Guide d\'installation étape par étape de Citrix Workspace',
      ka: 'Citrix Workspace ნაბიჯ-ნაბიჯ დაყენების სახელმძღვანელო',
    },
    keywords: {
      tr: ['citrix kurulum', 'citrix kurulumu', 'citrix', 'citrix indir', 'citrix workspace', 'workspace', 'sitrix', 'citriks', 'citrix nasil kurulur', 'citrix yukle'],
      de: ['citrix installation', 'citrix', 'citrix installieren', 'citrix workspace', 'workspace', 'citrix download', 'citrix herunterladen'],
      en: ['citrix setup', 'citrix', 'install citrix', 'citrix workspace', 'workspace', 'citrix download', 'citrix install'],
      fr: ['installation citrix', 'citrix', 'installer citrix', 'citrix workspace', 'workspace', 'telecharger citrix'],
      ka: ['citrix', 'სიტრიქსი', 'workspace', 'დაყენება', 'ინსტალაცია', 'citrix workspace'],
    },
  },
  {
    id: 'mac-setup',
    path: '/faq/mac-kurulum',
    icon: Laptop,
    title: { tr: 'macOS Kurulumu (AnyDesk & Citrix)', de: 'macOS-Einrichtung (AnyDesk & Citrix)', en: 'macOS Setup (AnyDesk & Citrix)', fr: 'Installation macOS (AnyDesk & Citrix)', ka: 'macOS დაყენება (AnyDesk და Citrix)' },
    description: {
      tr: 'Mac için AnyDesk ve Citrix kurulum rehberi',
      de: 'AnyDesk- und Citrix-Installationsanleitung für Mac',
      en: 'AnyDesk and Citrix setup guide for Mac',
      fr: 'Guide d\'installation AnyDesk et Citrix pour Mac',
      ka: 'Mac-ისთვის AnyDesk და Citrix დაყენების სახელმძღვანელო',
    },
    keywords: {
      tr: ['mac', 'macos', 'mac os', 'macbook', 'apple', 'mac kurulum', 'mac citrix', 'mac anydesk', 'anydesk', 'any desk', 'enidesk', 'mek', 'imac', 'mac bilgisayar'],
      de: ['mac', 'macos', 'mac os', 'macbook', 'apple', 'mac einrichtung', 'anydesk', 'any desk', 'mac citrix'],
      en: ['mac', 'macos', 'mac os', 'macbook', 'apple', 'mac setup', 'anydesk', 'any desk', 'mac citrix', 'imac'],
      fr: ['mac', 'macos', 'mac os', 'macbook', 'apple', 'installation mac', 'anydesk', 'any desk', 'mac citrix', 'imac'],
      ka: ['mac', 'macos', 'macbook', 'apple', 'anydesk', 'citrix', 'მაკი', 'დაყენება'],
    },
  },
  {
    id: 'windows-11',
    path: '/windows-11-upgrade',
    icon: RefreshCw,
    title: { tr: 'Windows 11 Güncellemesi', de: 'Windows 11 Upgrade', en: 'Windows 11 Upgrade', fr: 'Mise à niveau Windows 11', ka: 'Windows 11 განახლება' },
    description: {
      tr: 'Windows 10\'dan Windows 11\'e geçiş rehberi',
      de: 'Anleitung für den Wechsel von Windows 10 auf Windows 11',
      en: 'Guide to upgrade from Windows 10 to Windows 11',
      fr: 'Guide pour passer de Windows 10 à Windows 11',
      ka: 'Windows 10-დან Windows 11-ზე გადასვლის სახელმძღვანელო',
    },
    keywords: {
      tr: ['windows 11', 'windows11', 'win 11', 'win11', 'windows guncelleme', 'windows 11 gecis', 'windows yukseltme', 'windows', 'w11', 'windows on bir', 'wind 11'],
      de: ['windows 11', 'windows11', 'win 11', 'win11', 'windows upgrade', 'windows aktualisieren', 'windows', 'w11'],
      en: ['windows 11', 'windows11', 'win 11', 'win11', 'windows upgrade', 'upgrade windows', 'windows', 'w11'],
      fr: ['windows 11', 'windows11', 'win 11', 'win11', 'mise a niveau windows', 'passer a windows 11', 'windows', 'w11'],
      ka: ['windows 11', 'windows11', 'win11', 'განახლება', 'ვინდოუსი', 'upgrade'],
    },
  },
  {
    id: 'video-tutorials',
    path: '/video-tutorials',
    icon: Video,
    title: { tr: 'Videolu Anlatım', de: 'Video-Anleitungen', en: 'Video Tutorials', fr: 'Tutoriels vidéo', ka: 'ვიდეო ინსტრუქციები' },
    description: {
      tr: 'Sorun giderme için videolu anlatımlar',
      de: 'Video-Anleitungen zur Fehlerbehebung',
      en: 'Video tutorials for troubleshooting',
      fr: 'Tutoriels vidéo pour le dépannage',
      ka: 'პრობლემების მოგვარების ვიდეო ინსტრუქციები',
    },
    keywords: {
      tr: ['video', 'videolu anlatim', 'videolar', 'video rehber', 'izle', 'video anlatim', 'egitim videosu', 'vidyo'],
      de: ['video', 'video anleitung', 'videos', 'tutorial', 'ansehen', 'schulungsvideo'],
      en: ['video', 'video tutorials', 'videos', 'tutorial', 'watch', 'guide video'],
      fr: ['video', 'tutoriel video', 'videos', 'tutoriel', 'regarder', 'guide video'],
      ka: ['ვიდეო', 'ინსტრუქცია', 'ტუტორიალი', 'video'],
    },
  },
  {
    id: 'asset-confirmation',
    path: '/asset-confirmation',
    icon: ClipboardCheck,
    title: { tr: 'Zimmet Onaylama', de: 'Geräte-Bestätigung', en: 'Asset Confirmation', fr: 'Confirmation du matériel', ka: 'ინვენტარის დადასტურება' },
    description: {
      tr: 'Zimmet formunuzu doldurun ve dijital onay verin',
      de: 'Füllen Sie Ihr Geräteformular aus und bestätigen Sie digital',
      en: 'Fill in your asset form and confirm digitally',
      fr: 'Remplissez votre formulaire de matériel et confirmez numériquement',
      ka: 'შეავსეთ ინვენტარის ფორმა და დაადასტურეთ ციფრულად',
    },
    keywords: {
      tr: ['zimmet', 'zimmet onay', 'zimmet onaylama', 'zimmet formu', 'zimet', 'zimmet form', 'ekipman onay', 'dijital onay', 'zimmet imza', 'zimmetleme', 'demirbas'],
      de: ['gerate bestatigung', 'geratebestatigung', 'zuweisung', 'geratformular', 'ausrustung bestatigen', 'digitale bestatigung', 'gerate'],
      en: ['asset confirmation', 'asset', 'asset form', 'equipment confirmation', 'digital confirmation', 'assign', 'assignment', 'confirm equipment'],
      fr: ['confirmation materiel', 'materiel', 'formulaire materiel', 'confirmation equipement', 'confirmation numerique', 'inventaire'],
      ka: ['ინვენტარი', 'დადასტურება', 'ფორმა', 'აღჭურვილობა', 'ზიმეთი'],
    },
  },
  {
    id: 'cargo-status',
    path: '/cargo-status',
    icon: Truck,
    title: { tr: 'Kargo Takibi', de: 'Sendungsverfolgung', en: 'Cargo Tracking', fr: 'Suivi des colis', ka: 'ტვირთის თვალყურის დევნება' },
    description: {
      tr: 'Ad soyad ve personel numaranız ile kargo durumunu sorgulayın',
      de: 'Verfolgen Sie Ihre Sendung mit Name und Personalnummer',
      en: 'Track your shipment with your name and personnel number',
      fr: 'Suivez votre envoi avec votre nom et votre numéro de personnel',
      ka: 'თვალი ადევნეთ ტვირთს სახელითა და პერსონალის ნომრით',
    },
    keywords: {
      tr: ['kargo', 'kargo takibi', 'kargo takip', 'kargo durumu', 'gonderi', 'kargo sorgula', 'kargom nerede', 'takip', 'kargoo', 'paket takibi'],
      de: ['sendungsverfolgung', 'sendung', 'paket', 'lieferung', 'kargo', 'verfolgen', 'sendungsstatus', 'paket verfolgen'],
      en: ['cargo tracking', 'cargo', 'shipment', 'package', 'delivery', 'track', 'parcel', 'tracking', 'where is my package'],
      fr: ['suivi colis', 'colis', 'envoi', 'paquet', 'livraison', 'suivi', 'tracking', 'ou est mon colis'],
      ka: ['ტვირთი', 'ამანათი', 'თვალყური', 'მიწოდება', 'კარგო', 'tracking'],
    },
  },
];

export function normalize(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Keep Latin + digits + Georgian letters (Mkhedruli / Asomtavruli)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 0; i < a.length; i++) {
    let cur = [i + 1];
    for (let j = 0; j < b.length; j++) {
      const cost = a[i] === b[j] ? 0 : 1;
      cur[j + 1] = Math.min(cur[j] + 1, prev[j + 1] + 1, prev[j] + cost);
    }
    prev = cur;
  }
  return prev[b.length];
}

/** Fuzzy typo tolerance based on query length. */
function typoAllowance(len) {
  if (len <= 3) return 1;
  if (len <= 5) return 2;
  if (len <= 8) return 3;
  return 4;
}

/** Score a single query token against a single target string. */
function scoreToken(qToken, target) {
  if (!qToken || !target) return 0;
  if (target === qToken) return 100;
  if (target.startsWith(qToken)) return 88;
  if (target.includes(qToken)) return 72;

  let best = 0;
  const words = target.split(' ');
  for (const word of words) {
    if (!word) continue;
    if (word === qToken) { best = Math.max(best, 92); continue; }
    if (word.startsWith(qToken)) { best = Math.max(best, 80); continue; }
    if (qToken.length >= 4 && word.includes(qToken)) { best = Math.max(best, 64); continue; }

    if (qToken.length >= 3) {
      const dist = levenshtein(qToken, word);
      const allow = typoAllowance(qToken.length);
      if (dist <= allow) {
        const ratio = 1 - dist / Math.max(qToken.length, word.length);
        best = Math.max(best, Math.round(55 * ratio) + (word.startsWith(qToken[0]) ? 8 : 0));
      }
    }
  }
  return best;
}

/**
 * Score an entry for the given query and language. Returns 0..100-ish.
 */
export function scoreEntry(query, entry, language) {
  const q = normalize(query);
  if (!q) return 0;

  const targets = [
    normalize(entry.title[language] || entry.title.en || entry.title.tr),
    normalize(entry.description[language] || entry.description.en || entry.description.tr || ''),
    ...(entry.keywords[language] || []).map(normalize),
    ...(entry.keywords.en || []).map(normalize),
    ...(entry.keywords.tr || []).map(normalize),
    ...(entry.keywords.fr || []).map(normalize),
    ...(entry.keywords.ka || []).map(normalize),
  ].filter(Boolean);

  // Whole-query pass (handles multi-word phrases well).
  let best = 0;
  for (const target of targets) {
    best = Math.max(best, scoreToken(q, target));
  }

  // Per-token pass: average of best score per query token (rewards partial matches).
  const tokens = q.split(' ').filter(Boolean);
  if (tokens.length > 1) {
    let sum = 0;
    for (const tok of tokens) {
      let tokBest = 0;
      for (const target of targets) tokBest = Math.max(tokBest, scoreToken(tok, target));
      sum += tokBest;
    }
    best = Math.max(best, Math.round(sum / tokens.length));
  }

  return best;
}

/**
 * Search all entries for a query, returning sorted matches above a threshold.
 */
export function searchSite(query, language, { limit = 8, threshold = 30 } = {}) {
  const scored = SEARCH_ENTRIES.map((entry) => ({ entry, score: scoreEntry(query, entry, language) }))
    .filter((r) => r.score >= threshold)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((r) => r.entry);
}

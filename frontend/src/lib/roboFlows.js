export const ROCKET_CHAT_URL = 'https://rocket.dmc-rz.com';

/**
 * Flow node types: choices | checklist | resolved | escalate
 */
export const ROBO_FLOW = {
  root: {
    type: 'choices',
    greetingKey: 'robo.greeting',
    messageKey: 'robo.greetingSub',
    options: [
      { id: 'citrix', labelKey: 'robo.topics.citrix', icon: 'monitor', next: 'citrix_menu' },
      { id: 'headset', labelKey: 'robo.topics.headset', icon: 'headphones', next: 'headset_menu' },
      { id: 'pc', labelKey: 'robo.topics.pc', icon: 'laptop', next: 'pc_menu' },
      { id: 'network', labelKey: 'robo.topics.network', icon: 'wifi', next: 'network_check' },
      { id: 'cargo', labelKey: 'robo.topics.cargo', icon: 'truck', next: 'cargo_check' },
      { id: 'asset', labelKey: 'robo.topics.asset', icon: 'clipboard', next: 'asset_check' },
      { id: 'mac', labelKey: 'robo.topics.mac', icon: 'apple', next: 'mac_menu' },
      { id: 'windows', labelKey: 'robo.topics.windows', icon: 'refresh', next: 'windows_check' },
      { id: 'search', labelKey: 'robo.topics.search', icon: 'search', next: 'search_help' },
    ],
  },

  citrix_menu: {
    type: 'choices',
    messageKey: 'robo.citrix.question',
    parent: 'root',
    options: [
      { id: 'install', labelKey: 'robo.citrix.install.label', icon: 'download', next: 'citrix_install' },
      { id: 'login', labelKey: 'robo.citrix.login.label', icon: 'key', next: 'citrix_login' },
      { id: 'sound', labelKey: 'robo.citrix.sound.label', icon: 'volume', next: 'citrix_sound' },
      { id: 'mic', labelKey: 'robo.citrix.mic.label', icon: 'mic', next: 'citrix_mic' },
      { id: 'connection', labelKey: 'robo.citrix.connection.label', icon: 'plug', next: 'citrix_connection' },
      { id: 'update', labelKey: 'robo.citrix.update.label', icon: 'refresh', next: 'citrix_update' },
    ],
  },

  citrix_install: {
    type: 'checklist',
    titleKey: 'robo.citrix.install.title',
    itemKeys: [
      'robo.citrix.install.c1',
      'robo.citrix.install.c2',
      'robo.citrix.install.c3',
      'robo.citrix.install.c4',
    ],
    guideLink: '/faq/citrix-kurulum',
    guideLabelKey: 'robo.openGuide',
    parent: 'citrix_menu',
  },
  citrix_login: {
    type: 'checklist',
    titleKey: 'robo.citrix.login.title',
    itemKeys: ['robo.citrix.login.c1', 'robo.citrix.login.c2', 'robo.citrix.login.c3'],
    parent: 'citrix_menu',
  },
  citrix_sound: {
    type: 'checklist',
    titleKey: 'robo.citrix.sound.title',
    itemKeys: ['robo.citrix.sound.c1', 'robo.citrix.sound.c2', 'robo.citrix.sound.c3', 'robo.citrix.sound.c4'],
    guideLink: '/troubleshooting',
    guideLabelKey: 'robo.openTroubleshooting',
    parent: 'citrix_menu',
  },
  citrix_mic: {
    type: 'checklist',
    titleKey: 'robo.citrix.mic.title',
    itemKeys: ['robo.citrix.mic.c1', 'robo.citrix.mic.c2', 'robo.citrix.mic.c3', 'robo.citrix.mic.c4'],
    guideLink: '/faq',
    guideLabelKey: 'robo.openFaq',
    parent: 'citrix_menu',
  },
  citrix_connection: {
    type: 'checklist',
    titleKey: 'robo.citrix.connection.title',
    itemKeys: ['robo.citrix.connection.c1', 'robo.citrix.connection.c2', 'robo.citrix.connection.c3'],
    parent: 'citrix_menu',
  },
  citrix_update: {
    type: 'checklist',
    titleKey: 'robo.citrix.update.title',
    itemKeys: ['robo.citrix.update.c1', 'robo.citrix.update.c2', 'robo.citrix.update.c3'],
    parent: 'citrix_menu',
  },

  headset_menu: {
    type: 'choices',
    messageKey: 'robo.headset.question',
    parent: 'root',
    options: [
      { id: 'no_sound', labelKey: 'robo.headset.noSound.label', icon: 'volume', next: 'headset_no_sound' },
      { id: 'no_mic', labelKey: 'robo.headset.noMic.label', icon: 'mic', next: 'headset_no_mic' },
      { id: 'not_detected', labelKey: 'robo.headset.notDetected.label', icon: 'alert', next: 'headset_not_detected' },
      { id: 'test', labelKey: 'robo.headset.test.label', icon: 'play', link: '/headset-test' },
    ],
  },
  headset_no_sound: {
    type: 'checklist',
    titleKey: 'robo.headset.noSound.title',
    itemKeys: ['robo.headset.noSound.c1', 'robo.headset.noSound.c2', 'robo.headset.noSound.c3', 'robo.headset.noSound.c4'],
    guideLink: '/troubleshooting',
    guideLabelKey: 'robo.openTroubleshooting',
    parent: 'headset_menu',
  },
  headset_no_mic: {
    type: 'checklist',
    titleKey: 'robo.headset.noMic.title',
    itemKeys: ['robo.headset.noMic.c1', 'robo.headset.noMic.c2', 'robo.headset.noMic.c3', 'robo.headset.noMic.c4'],
    guideLink: '/faq',
    guideLabelKey: 'robo.openFaq',
    parent: 'headset_menu',
  },
  headset_not_detected: {
    type: 'checklist',
    titleKey: 'robo.headset.notDetected.title',
    itemKeys: ['robo.headset.notDetected.c1', 'robo.headset.notDetected.c2', 'robo.headset.notDetected.c3'],
    guideLink: '/pc-setup',
    guideLabelKey: 'robo.openPcSetup',
    parent: 'headset_menu',
  },

  pc_menu: {
    type: 'choices',
    messageKey: 'robo.pc.question',
    parent: 'root',
    options: [
      { id: 'setup', labelKey: 'robo.pc.setup.label', icon: 'monitor', next: 'pc_setup' },
      { id: 'display', labelKey: 'robo.pc.display.label', icon: 'display', next: 'pc_display' },
      { id: 'dual', labelKey: 'robo.pc.dual.label', icon: 'layers', next: 'pc_dual' },
    ],
  },
  pc_setup: {
    type: 'checklist',
    titleKey: 'robo.pc.setup.title',
    itemKeys: ['robo.pc.setup.c1', 'robo.pc.setup.c2', 'robo.pc.setup.c3', 'robo.pc.setup.c4'],
    guideLink: '/pc-setup',
    guideLabelKey: 'robo.openPcSetup',
    parent: 'pc_menu',
  },
  pc_display: {
    type: 'checklist',
    titleKey: 'robo.pc.display.title',
    itemKeys: ['robo.pc.display.c1', 'robo.pc.display.c2', 'robo.pc.display.c3'],
    guideLink: '/troubleshooting',
    guideLabelKey: 'robo.openTroubleshooting',
    parent: 'pc_menu',
  },
  pc_dual: {
    type: 'checklist',
    titleKey: 'robo.pc.dual.title',
    itemKeys: ['robo.pc.dual.c1', 'robo.pc.dual.c2', 'robo.pc.dual.c3'],
    guideLink: '/pc-setup',
    guideLabelKey: 'robo.openPcSetup',
    parent: 'pc_menu',
  },

  network_check: {
    type: 'checklist',
    titleKey: 'robo.network.title',
    itemKeys: ['robo.network.c1', 'robo.network.c2', 'robo.network.c3'],
    parent: 'root',
  },
  cargo_check: {
    type: 'checklist',
    titleKey: 'robo.cargo.title',
    itemKeys: ['robo.cargo.c1', 'robo.cargo.c2', 'robo.cargo.c3'],
    guideLink: '/cargo-status',
    guideLabelKey: 'robo.openCargo',
    parent: 'root',
  },
  asset_check: {
    type: 'checklist',
    titleKey: 'robo.asset.title',
    itemKeys: ['robo.asset.c1', 'robo.asset.c2', 'robo.asset.c3'],
    guideLink: '/asset-confirmation',
    guideLabelKey: 'robo.openAsset',
    parent: 'root',
  },

  mac_menu: {
    type: 'choices',
    messageKey: 'robo.mac.question',
    parent: 'root',
    options: [
      { id: 'anydesk', labelKey: 'robo.mac.anydesk.label', icon: 'download', next: 'mac_anydesk' },
      { id: 'citrix', labelKey: 'robo.mac.citrix.label', icon: 'monitor', next: 'mac_citrix' },
      { id: 'guide', labelKey: 'robo.mac.guide.label', icon: 'laptop', link: '/faq/mac-kurulum' },
    ],
  },
  mac_anydesk: {
    type: 'checklist',
    titleKey: 'robo.mac.anydesk.title',
    itemKeys: ['robo.mac.anydesk.c1', 'robo.mac.anydesk.c2', 'robo.mac.anydesk.c3', 'robo.mac.anydesk.c4'],
    guideLink: '/faq/mac-kurulum',
    guideLabelKey: 'robo.openMacGuide',
    parent: 'mac_menu',
  },
  mac_citrix: {
    type: 'checklist',
    titleKey: 'robo.mac.citrix.title',
    itemKeys: ['robo.mac.citrix.c1', 'robo.mac.citrix.c2', 'robo.mac.citrix.c3', 'robo.mac.citrix.c4'],
    guideLink: '/faq/mac-kurulum',
    guideLabelKey: 'robo.openMacGuide',
    parent: 'mac_menu',
  },

  windows_check: {
    type: 'checklist',
    titleKey: 'robo.windows.title',
    itemKeys: ['robo.windows.c1', 'robo.windows.c2', 'robo.windows.c3', 'robo.windows.c4'],
    guideLink: '/windows-11-upgrade',
    guideLabelKey: 'robo.openWindows',
    parent: 'root',
  },

  search_help: {
    type: 'checklist',
    titleKey: 'robo.search.title',
    itemKeys: ['robo.search.c1', 'robo.search.c2', 'robo.search.c3'],
    parent: 'root',
  },

  resolved: { type: 'resolved' },
  escalate: { type: 'escalate' },
};

export function getFlowNode(nodeId) {
  return ROBO_FLOW[nodeId] || ROBO_FLOW.root;
}

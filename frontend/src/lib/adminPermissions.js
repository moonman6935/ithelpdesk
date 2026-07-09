const MODULE_KEYS = [
  'dashboard',
  'assets',
  'inventory',
  'outgoing_cargo',
  'incoming_cargo',
  'confirmations',
  'announcement',
  'video_tutorials',
  'carousel',
];

function moduleEntry(view = false, write = false) {
  return { view: Boolean(view), write: Boolean(write) };
}

function buildPermissions(entries) {
  const perms = {};
  for (const key of MODULE_KEYS) {
    perms[key] = moduleEntry(entries[key]?.view, entries[key]?.write);
  }
  return perms;
}

export function defaultPermissionsForRole(role) {
  if (role === 'system_admin') {
    return buildPermissions(
      Object.fromEntries(MODULE_KEYS.map((k) => [k, { view: true, write: k !== 'dashboard' }]))
    );
  }
  if (role === 'admin') {
    return buildPermissions({
      dashboard: { view: true },
      assets: { view: true, write: true },
      inventory: { view: true, write: true },
      outgoing_cargo: { view: true, write: true },
      incoming_cargo: { view: true, write: true },
      confirmations: { view: true, write: false },
      announcement: { view: false, write: false },
      video_tutorials: { view: false, write: false },
      carousel: { view: false, write: false },
    });
  }
  return buildPermissions(
    Object.fromEntries(MODULE_KEYS.map((k) => [k, { view: true, write: false }]))
  );
}

export function normalizePermissions(input, role = 'viewer') {
  const base = defaultPermissionsForRole(role);
  if (!input || typeof input !== 'object') return base;

  const out = {};
  for (const key of MODULE_KEYS) {
    const mod = input[key];
    if (mod && typeof mod === 'object') {
      out[key] = {
        view: Boolean(mod.view),
        write: Boolean(mod.write),
      };
    } else {
      out[key] = { ...base[key] };
    }
  }
  return out;
}

export function resolveUserPermissions(user) {
  if (!user) return defaultPermissionsForRole('viewer');
  if (user.role === 'system_admin') return defaultPermissionsForRole('system_admin');
  return normalizePermissions(user.permissions, user.role);
}

export function canView(permissions, module) {
  if (!permissions || !module) return false;
  return Boolean(permissions[module]?.view);
}

export function canWrite(permissions, module) {
  if (!permissions || !module) return false;
  return Boolean(permissions[module]?.write);
}

export function emptyPermissionsForForm(role = 'viewer') {
  return JSON.parse(JSON.stringify(defaultPermissionsForRole(role)));
}

export { MODULE_KEYS };

export function loadStoredPermissions() {
  try {
    const raw = localStorage.getItem('admin_permissions');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const role = localStorage.getItem('admin_role') || 'viewer';
    return normalizePermissions(parsed, role);
  } catch {
    return null;
  }
}

export function storeSessionAuth({ role, permissions }) {
  localStorage.setItem('admin_role', role);
  localStorage.setItem('admin_permissions', JSON.stringify(permissions));
}

export function clearSessionAuth() {
  localStorage.removeItem('admin_role');
  localStorage.removeItem('admin_permissions');
}

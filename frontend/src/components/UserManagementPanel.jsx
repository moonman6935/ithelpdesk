import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from './ui/dialog';
import { Pencil, Trash2, Shield } from 'lucide-react';
import api from '../lib/api';
import { getApiErrorMessage, isStrongPasswordClient } from '../lib/apiErrors';
import {
  MODULE_KEYS,
  defaultPermissionsForRole,
  emptyPermissionsForForm,
} from '../lib/adminPermissions';

function PermissionMatrix({ value, onChange, disabled }) {
  const { t } = useLanguage();

  const setPerm = (module, field, checked) => {
    onChange({
      ...value,
      [module]: {
        ...value[module],
        [field]: checked,
        ...(field === 'view' && !checked ? { write: false } : {}),
      },
    });
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b text-left">
            <th className="p-3 font-semibold">{t('admin.userMgmt.module')}</th>
            <th className="p-3 font-semibold text-center w-24">{t('admin.userMgmt.canView')}</th>
            <th className="p-3 font-semibold text-center w-24">{t('admin.userMgmt.canWrite')}</th>
          </tr>
        </thead>
        <tbody>
          {MODULE_KEYS.map((key) => (
            <tr key={key} className="border-b last:border-b-0">
              <td className="p-3">{t(`admin.userMgmt.modules.${key}`)}</td>
              <td className="p-3 text-center">
                <input
                  type="checkbox"
                  checked={Boolean(value?.[key]?.view)}
                  disabled={disabled}
                  onChange={(e) => setPerm(key, 'view', e.target.checked)}
                />
              </td>
              <td className="p-3 text-center">
                <input
                  type="checkbox"
                  checked={Boolean(value?.[key]?.write)}
                  disabled={disabled || key === 'dashboard' || !value?.[key]?.view}
                  onChange={(e) => setPerm(key, 'write', e.target.checked)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const UserManagementPanel = ({ users, onRefresh, currentUsername }) => {
  const { t } = useLanguage();
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: 'viewer',
    permissions: emptyPermissionsForForm('viewer'),
  });
  const [editUser, setEditUser] = useState(null);
  const [saving, setSaving] = useState(false);

  const roleLabel = (role) => t(`admin.roles.${role}`) || role;

  const handleRoleChange = (role, setter, current) => {
    setter({
      ...current,
      role,
      permissions: role === 'system_admin' ? null : emptyPermissionsForForm(role),
    });
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    const username = newUser.username.trim();
    if (!username) {
      alert(t('admin.userMgmt.usernameRequired'));
      return;
    }
    if (!isStrongPasswordClient(newUser.password)) {
      alert(t('admin.userMgmt.passwordTooShort'));
      return;
    }

    setSaving(true);
    try {
      await api.post('/api/admin/users', {
        username,
        password: newUser.password,
        role: newUser.role,
        permissions: newUser.role === 'system_admin' ? undefined : newUser.permissions,
      });
      alert(t('admin.userMgmt.created'));
      setNewUser({
        username: '',
        password: '',
        role: 'viewer',
        permissions: emptyPermissionsForForm('viewer'),
      });
      onRefresh();
    } catch (err) {
      alert(getApiErrorMessage(err, t('admin.userMgmt.error')));
      console.error('Add user failed:', err?.response?.status, err?.response?.data || err);
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (user) => {
    setEditUser({
      username: user.username,
      password: '',
      role: user.role,
      permissions: user.role === 'system_admin'
        ? null
        : JSON.parse(JSON.stringify(user.permissions || emptyPermissionsForForm(user.role))),
    });
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    if (editUser.password.trim() && !isStrongPasswordClient(editUser.password)) {
      alert(t('admin.userMgmt.passwordTooShort'));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        role: editUser.role,
        permissions: editUser.role === 'system_admin' ? undefined : editUser.permissions,
      };
      if (editUser.password.trim()) {
        payload.password = editUser.password;
      }
      await api.put(`/api/admin/users/${encodeURIComponent(editUser.username)}`, payload);
      alert(t('admin.userMgmt.updated'));
      setEditUser(null);
      onRefresh();
    } catch (err) {
      alert(getApiErrorMessage(err, t('admin.userMgmt.error')));
      console.error('Update user failed:', err?.response?.status, err?.response?.data || err);
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (username) => {
    if (!window.confirm(`${username} — ${t('admin.userMgmt.deleteConfirm')}`)) return;
    try {
      await api.delete(`/api/admin/users/${encodeURIComponent(username)}`);
      onRefresh();
    } catch (err) {
      alert(getApiErrorMessage(err, t('admin.userMgmt.error')));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8 text-red-600" />
        <div>
          <h2 className="text-2xl font-bold">{t('admin.userMgmt.title')}</h2>
          <p className="text-gray-500 text-sm">{t('admin.userMgmt.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <Card className="xl:col-span-1 border-2">
          <CardHeader>
            <CardTitle>{t('admin.addNewAdmin')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('admin.username')}</label>
                <Input
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('admin.password')}</label>
                <Input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                  minLength={10}
                />
                <p className="text-xs text-gray-500 mt-1">{t('admin.userMgmt.passwordHint')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('admin.role')}</label>
                <select
                  className="w-full p-2 border rounded"
                  value={newUser.role}
                  onChange={(e) => handleRoleChange(e.target.value, setNewUser, newUser)}
                >
                  <option value="viewer">{roleLabel('viewer')}</option>
                  <option value="admin">{roleLabel('admin')}</option>
                  <option value="system_admin">{roleLabel('system_admin')}</option>
                </select>
              </div>

              {newUser.role !== 'system_admin' && (
                <PermissionMatrix
                  value={newUser.permissions}
                  onChange={(permissions) => setNewUser({ ...newUser, permissions })}
                />
              )}

              <Button type="submit" className="w-full bg-red-600" disabled={saving}>
                {saving ? '...' : t('admin.addButton')}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2 border-2">
          <CardHeader>
            <CardTitle>{t('admin.adminsList')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-4">{t('admin.username')}</th>
                    <th className="p-4">{t('admin.role')}</th>
                    <th className="p-4">{t('admin.userMgmt.accessSummary')}</th>
                    <th className="p-4">{t('admin.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const perms = user.permissions || defaultPermissionsForRole(user.role);
                    const writeCount = MODULE_KEYS.filter((k) => perms[k]?.write).length;
                    const viewCount = MODULE_KEYS.filter((k) => perms[k]?.view).length;
                    const isProtected = user.username === 'admin';

                    return (
                      <tr key={user.id || user.username} className="border-b align-top">
                        <td className="p-4 font-bold">
                          {user.username}
                          {user.username === currentUsername && (
                            <Badge className="ml-2 bg-blue-100 text-blue-700">{t('admin.userMgmt.you')}</Badge>
                          )}
                        </td>
                        <td className="p-4">
                          <Badge variant="outline">{roleLabel(user.role)}</Badge>
                        </td>
                        <td className="p-4 text-gray-600 text-xs">
                          {user.role === 'system_admin'
                            ? t('admin.userMgmt.fullAccess')
                            : `${viewCount} ${t('admin.userMgmt.views')} · ${writeCount} ${t('admin.userMgmt.writes')}`}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEdit(user)}>
                              <Pencil className="w-4 h-4 mr-1" />
                              {t('admin.userMgmt.edit')}
                            </Button>
                            {!isProtected && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteUser(user.username)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(editUser)} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('admin.userMgmt.editTitle')} — {editUser?.username}</DialogTitle>
            <DialogDescription>{t('admin.userMgmt.editHint')}</DialogDescription>
          </DialogHeader>

          {editUser && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('admin.role')}</label>
                <select
                  className="w-full p-2 border rounded"
                  value={editUser.role}
                  disabled={editUser.username === 'admin'}
                  onChange={(e) => handleRoleChange(e.target.value, setEditUser, editUser)}
                >
                  <option value="viewer">{roleLabel('viewer')}</option>
                  <option value="admin">{roleLabel('admin')}</option>
                  <option value="system_admin">{roleLabel('system_admin')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t('admin.userMgmt.newPasswordOptional')}</label>
                <Input
                  type="password"
                  value={editUser.password}
                  onChange={(e) => setEditUser({ ...editUser, password: e.target.value })}
                  placeholder={t('admin.userMgmt.passwordKeepBlank')}
                />
              </div>

              {editUser.role !== 'system_admin' ? (
                <PermissionMatrix
                  value={editUser.permissions}
                  onChange={(permissions) => setEditUser({ ...editUser, permissions })}
                />
              ) : (
                <p className="text-sm text-gray-500 bg-gray-50 border rounded-lg p-3">
                  {t('admin.userMgmt.systemAdminNote')}
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)} disabled={saving}>
              {t('admin.importCancel')}
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving} className="bg-red-600 hover:bg-red-700">
              {saving ? '...' : t('admin.userMgmt.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagementPanel;

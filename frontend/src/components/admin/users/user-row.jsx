'use client';

import { useState } from 'react';

export default function UserRow({ user, roles, onChanged, onError }) {
  const [selectedRoles, setSelectedRoles] = useState(user.roles.filter((role) => role !== 'super_admin'));
  const [pending, setPending] = useState(false);
  const protectedAccount = user.isProtected || user.roles.includes('super_admin');

  async function request(path, method, body) {
    setPending(true);
    try {
      const response = await fetch(path, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'İşlem tamamlanamadı.');
      await onChanged();
    } catch (error) {
      onError(error.message);
    } finally {
      setPending(false);
    }
  }

  function toggleRole(roleCode) {
    setSelectedRoles((current) => current.includes(roleCode)
      ? current.filter((code) => code !== roleCode)
      : [...current, roleCode]);
  }

  return (
    <article className="grid gap-5 border-b border-border px-4 py-5 last:border-b-0 lg:grid-cols-[1.2fr_1fr_auto] lg:items-center">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-medium">{user.firstName} {user.lastName}</h3>
          {protectedAccount ? <span className="rounded-full bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">Korumalı süper admin</span> : null}
          <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${user.status === 'active' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>{user.status === 'active' ? 'Aktif' : 'Devre dışı'}</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
        <p className="mt-2 text-xs text-muted-foreground">2FA: {user.twoFactorConfigured ? 'Kurulu' : 'Henüz kurulmadı'}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {protectedAccount ? user.roles.map((role) => <span key={role} className="rounded-md border border-border px-2.5 py-1.5 text-xs">{role}</span>) : roles.map((role) => (
          <label key={role.code} className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs">
            <input type="checkbox" checked={selectedRoles.includes(role.code)} onChange={() => toggleRole(role.code)} disabled={pending} />
            {role.name}
          </label>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 lg:justify-end">
        {!protectedAccount ? (
          <>
            <button type="button" disabled={pending || selectedRoles.length === 0} onClick={() => request(`/api/admin/users/${user.id}/roles`, 'PUT', { roleCodes: selectedRoles })} className="rounded-md border border-border px-3 py-2 text-xs font-medium disabled:opacity-50">Rolleri kaydet</button>
            <button type="button" disabled={pending} onClick={() => request(`/api/admin/users/${user.id}/status`, 'PUT', { status: user.status === 'active' ? 'disabled' : 'active' })} className="rounded-md border border-border px-3 py-2 text-xs font-medium disabled:opacity-50">{user.status === 'active' ? 'Devre dışı bırak' : 'Etkinleştir'}</button>
            <button type="button" disabled={pending} onClick={() => request(`/api/admin/users/${user.id}`, 'DELETE')} className="rounded-md border border-danger/30 px-3 py-2 text-xs font-medium text-danger disabled:opacity-50">Arşivle</button>
          </>
        ) : <span className="text-xs text-muted-foreground">Değiştirilemez</span>}
      </div>
    </article>
  );
}

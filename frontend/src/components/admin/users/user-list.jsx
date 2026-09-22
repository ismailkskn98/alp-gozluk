'use client';

import UserRow from './user-row';

export default function UserList({ users, roles, onChanged, onError }) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-4">
        <h2 className="font-semibold">Panel kullanıcıları</h2>
        <p className="mt-1 text-sm text-muted-foreground">Rol veya durum değişikliğinde kullanıcının aktif oturumları kapatılır.</p>
      </div>
      {users.length ? users.map((user) => <UserRow key={`${user.id}:${user.status}:${user.roles.join(',')}`} user={user} roles={roles} onChanged={onChanged} onError={onError} />) : <p className="p-6 text-sm text-muted-foreground">Henüz panel kullanıcısı bulunmuyor.</p>}
    </section>
  );
}

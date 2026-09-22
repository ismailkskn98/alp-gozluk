'use client';

import { Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import AdminPageHeader from '@/components/admin/page-header';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/animate-ui/components/radix/sheet';
import { AdminButton } from '@/components/admin/ui/button';
import CreateUserForm from './create-user-form';
import UserList from './user-list';

async function fetchAdminUsers() {
  const [usersResponse, rolesResponse] = await Promise.all([
    fetch('/api/admin/users', { cache: 'no-store' }),
    fetch('/api/admin/users/roles', { cache: 'no-store' }),
  ]);
  const usersPayload = await usersResponse.json();
  const rolesPayload = await rolesResponse.json();
  if (!usersResponse.ok) throw new Error(usersPayload.message || 'Kullanıcılar alınamadı.');
  if (!rolesResponse.ok) throw new Error(rolesPayload.message || 'Roller alınamadı.');
  return {
    users: usersPayload.data.users || [],
    roles: rolesPayload.data.roles || [],
  };
}

export default function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchAdminUsers();
      setUsers(result.users);
      setRoles(result.roles);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchAdminUsers()
      .then((result) => {
        if (!active) return;
        setUsers(result.users);
        setRoles(result.roles);
      })
      .catch((error) => {
        if (active) setMessage(error.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader eyebrow="Erişim yönetimi" title="Yönetici kullanıcılar" description="Yeni panel hesaplarını yalnızca süper yönetici oluşturabilir. Public kayıt akışı admin yetkisi vermez." actions={<Sheet open={createOpen} onOpenChange={setCreateOpen}><SheetTrigger asChild><AdminButton><Plus className="size-4" />Kullanıcı oluştur</AdminButton></SheetTrigger><SheetContent className="w-[min(94vw,36rem)] overflow-y-auto border-border bg-card text-card-foreground sm:w-[36rem]"><SheetHeader className="border-b border-border p-6"><SheetTitle>Yönetici kullanıcı oluştur</SheetTitle><SheetDescription>Süper yönetici rolü buradan atanamaz. Yeni hesapta güçlü bir geçici şifre kullanın.</SheetDescription></SheetHeader><div className="p-6"><CreateUserForm compact roles={roles} onCreated={async (user, error) => { setMessage(error || (user ? 'Kullanıcı oluşturuldu.' : '')); if (user) { setCreateOpen(false); await load(); } }} /></div></SheetContent></Sheet>} />
      {message ? <p role="alert" className="rounded-lg border border-danger/20 bg-danger/5 p-4 text-sm text-danger">{message}</p> : null}
      {loading ? <div className="h-40 animate-pulse rounded-xl bg-muted" /> : <UserList users={users} roles={roles} onChanged={load} onError={setMessage} />}
    </div>
  );
}

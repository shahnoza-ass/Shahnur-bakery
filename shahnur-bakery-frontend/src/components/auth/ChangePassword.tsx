import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
export const ChangePassword = () => {
  const { logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); if (busy) return;
    if (newPassword !== confirmation) { toast.error('Yangi parollar mos emas'); return; }
    setBusy(true);
    try {
      await authService.changePassword({ currentPassword, newPassword });
      logout();
      toast.success('Parol yangilandi. Yangi parol bilan qayta kiring.');
    } catch { toast.error('Parol o‘zgartirilmadi. Joriy parolni tekshiring.'); }
    finally { setBusy(false); }
  };
  return <form onSubmit={submit} className="mt-8 border-t pt-8 space-y-4"><h2 className="text-xl font-bold">Parolni almashtirish</h2>
    <label className="block">Joriy parol<input className="block w-full border rounded-xl p-3 mt-1" type="password" autoComplete="current-password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} /></label>
    <label className="block">Yangi parol<input className="block w-full border rounded-xl p-3 mt-1" type="password" autoComplete="new-password" minLength={8} maxLength={72} required value={newPassword} onChange={e => setNewPassword(e.target.value)} /></label>
    <label className="block">Yangi parolni tasdiqlash<input className="block w-full border rounded-xl p-3 mt-1" type="password" autoComplete="new-password" required value={confirmation} onChange={e => setConfirmation(e.target.value)} /></label>
    <button disabled={busy} className="rounded-xl bg-pink-600 text-white p-3 w-full disabled:opacity-50">{busy ? 'Saqlanmoqda…' : 'Parolni yangilash'}</button>
  </form>;
};

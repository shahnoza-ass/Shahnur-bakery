import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
export const PasswordRecovery = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); if (busy) return;
    if (token && password !== confirmPassword) { toast.error('Parollar mos emas'); return; }
    setBusy(true);
    try {
      const response = await api.post(token ? '/auth/reset-password/' + token : '/auth/forgot-password', token ? { password, confirmPassword } : { email });
      setMessage(response.data.message);
      if (token) { localStorage.removeItem('shahnur_token'); toast.success('Parol yangilandi'); navigate('/login'); }
    } catch { setMessage('So‘rov bajarilmadi. Ma’lumotlarni tekshirib, qayta urinib ko‘ring.'); }
    finally { setBusy(false); }
  };
  return <div className="max-w-md mx-auto px-4 py-16"><h1 className="text-3xl font-bold mb-6">{token ? 'Yangi parol' : 'Parolni tiklash'}</h1>
    <form onSubmit={submit} className="bg-white rounded-2xl p-6 space-y-4 border">
      {token ? <><label className="block">Yangi parol<input className="w-full border rounded-xl p-3 mt-1" type="password" autoComplete="new-password" minLength={8} maxLength={72} required value={password} onChange={e => setPassword(e.target.value)} /></label><label className="block">Parolni tasdiqlang<input className="w-full border rounded-xl p-3 mt-1" type="password" autoComplete="new-password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} /></label></> : <label className="block">Email<input className="w-full border rounded-xl p-3 mt-1" type="email" required value={email} onChange={e => setEmail(e.target.value)} /></label>}
      <button disabled={busy} className="w-full bg-pink-600 text-white rounded-xl p-3 disabled:opacity-50">{busy ? 'Yuborilmoqda…' : token ? 'Parolni saqlash' : 'Tiklash havolasini olish'}</button>
      {message && <p role="status">{message}</p>}<Link className="block text-pink-700" to="/login">Kirish sahifasi</Link>
    </form></div>;
};

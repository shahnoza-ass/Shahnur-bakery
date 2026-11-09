import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { AdminLayout } from './AdminLayout';
import toast from 'react-hot-toast';
interface Message { _id: string; name: string; email: string; message: string; isRead: boolean; createdAt: string; }
export const AdminMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  useEffect(() => {
    let live = true; setLoading(true);
    api.get('/contact', { params: { page } }).then(res => { if (live) { setMessages(res.data.data); setPages(res.data.pagination.pages); } }).catch(() => toast.error('Xabarlar yuklanmadi')).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [page]);
  const markRead = async (id: string) => {
    try { await api.patch('/contact/' + id + '/read'); setMessages(previous => previous.map(m => m._id === id ? { ...m, isRead: true } : m)); }
    catch { toast.error('O‘zgartirish saqlanmadi'); }
  };
  return <AdminLayout title="Murojaatlar" subtitle="Aloqa formasidan kelgan xabarlar">
    {loading ? <p>Yuklanmoqda…</p> : !messages.length ? <p>Hozircha murojaatlar yo‘q</p> : <div className="space-y-4">{messages.map(m => <article key={m._id} className="bg-white rounded-2xl p-5 border">
      <div className="flex justify-between gap-3"><h2 className="font-bold">{m.name}</h2><span>{m.isRead ? 'O‘qilgan' : 'Yangi'}</span></div>
      <a className="text-pink-700" href={'mailto:' + m.email}>{m.email}</a><p className="whitespace-pre-wrap break-words my-4">{m.message}</p>
      <time className="text-sm text-gray-500">{new Date(m.createdAt).toLocaleString('uz-UZ')}</time>
      {!m.isRead && <button className="ml-4 text-pink-700" onClick={() => markRead(m._id)}>O‘qildi deb belgilash</button>}
    </article>)}</div>}
    <div className="flex gap-4 mt-6"><button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Oldingi</button><span>{page} / {Math.max(1, pages)}</span><button disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Keyingi</button></div>
  </AdminLayout>;
};

import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { chatService, Chat, ChatMessage } from '../../services/chatService';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
export const ChatWindow = ({ admin = false }: { admin?: boolean }) => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const [chats, setChats] = useState<Chat[]>([]);
  const [active, setActive] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(0);
  const refresh = async () => { const data = await chatService.list(admin); setChats(data); };
  useEffect(() => {
    let live = true;
    chatService.list(admin).then(data => { if (live) setChats(data); }).catch(() => { if (live) setError('Chatlarni yuklab bo‘lmadi. Sahifani qayta yuklang.'); }).finally(() => { if (live) setLoading(false); });
    return () => { live = false; requestId.current++; };
  }, [admin]);
  const open = async (chat: Chat) => {
    const request = ++requestId.current;
    setOpening(true); setError(''); setActive(null); setMessages([]);
    try {
      if (admin && !chat.participants.some(p => p._id === user?._id)) await chatService.assign(chat._id, user!._id);
      const data = await chatService.get(chat._id);
      if (request !== requestId.current) return;
      setActive(data); setMessages(data.messages || []);
      await chatService.read(data._id);
    } catch { if (request === requestId.current) setError('Suhbatni ochib bo‘lmadi'); }
    finally { if (request === requestId.current) setOpening(false); }
  };
  useEffect(() => {
    if (!socket) return;
    const handler = (data: { chatId: string; message: ChatMessage }) => {
      if (data.chatId === active?._id) {
        setMessages(previous => previous.some(m => m._id === data.message._id) ? previous : [...previous, data.message]);
        chatService.read(data.chatId).catch(() => {});
      }
      refresh().catch(() => {});
    };
    socket.on('new_message', handler);
    return () => { socket.off('new_message', handler); };
  }, [socket, active?._id, admin]);
  const support = async () => {
    setOpening(true);
    try { const chat = await chatService.support(); await refresh(); await open(chat); }
    catch { setError('Yordam xizmati bilan bog?lanib bo‘lmadi'); setOpening(false); }
  };
  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!active || sending || !text.trim()) return;
    const chatId = active._id;
    setSending(true);
    try {
      const message = await chatService.send(chatId, text.trim());
      setMessages(previous => previous.some(m => m._id === message._id) ? previous : [...previous, message]);
      setText(''); await refresh();
    } catch { toast.error('Xabar yuborilmadi. Qayta urinib ko?ring.'); }
    finally { setSending(false); }
  };
  return <section className="bg-white rounded-2xl border border-pink-100 overflow-hidden">
    <div className="p-4 border-b flex justify-between"><h2 className="font-bold">Suhbatlar</h2><span className="text-sm text-gray-500" role="status">{isConnected ? 'Onlayn' : 'Qayta ulanmoqda'}</span></div>
    {error && <p role="alert" className="p-4 text-red-700">{error}</p>}
    <div className="grid md:grid-cols-3 min-h-[450px]">
      <aside className="border-r p-3 space-y-2">
        {!admin && <button disabled={opening} onClick={support} className="w-full rounded-xl bg-pink-600 text-white p-3 disabled:opacity-50">Yordam bilan suhbat</button>}
        {loading ? <p>Yuklanmoqda...</p> : !chats.length && <p className="p-3 text-gray-500">Hozircha suhbatlar yo‘q</p>}
        {chats.map(chat => <button key={chat._id} disabled={sending || opening} onClick={() => open(chat)} className={'w-full text-left p-3 rounded-xl ' + (active?._id === chat._id ? 'bg-pink-100' : 'bg-gray-50')}>
          <span className="font-semibold">{chat.participants.filter(p => p._id !== user?._id).map(p => p.firstName + ' ' + p.lastName).join(', ')}</span>
          <p className="text-sm text-gray-500 truncate">{chat.lastMessage?.content || 'Yangi suhbat'}</p>
        </button>)}
      </aside>
      <div className="md:col-span-2 flex flex-col">
        <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[500px]" aria-live="polite">
          {opening ? <p>Suhbat yuklanmoqda...</p> : !active ? <p className="text-gray-500">Suhbatni tanlang</p> : !messages.length ? <p>Birinchi xabaringizni yozing</p> : messages.map(message => {
            const mine = (typeof message.sender === 'string' ? message.sender : message.sender?._id) === user?._id;
            return <div key={message._id} className={'flex ' + (mine ? 'justify-end' : 'justify-start')}><div className={'max-w-[85%] rounded-2xl p-3 whitespace-pre-wrap break-words ' + (mine ? 'bg-pink-600 text-white' : 'bg-gray-100')}><p>{message.content}</p><time className="block text-xs opacity-70 mt-1">{new Date(message.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</time></div></div>;
          })}
        </div>
        <form onSubmit={send} className="border-t p-3 flex gap-2"><input aria-label="Xabar" maxLength={2000} value={text} onChange={e => setText(e.target.value)} disabled={!active || sending} placeholder="Xabaringizni yozing..." className="flex-1 min-w-0 border rounded-xl p-3" /><button disabled={!active || sending || !text.trim()} className="rounded-xl bg-pink-600 text-white px-4 disabled:opacity-50">{sending ? 'Yuborilmoqda...' : 'Yuborish'}</button></form>
      </div>
    </div>
  </section>;
};

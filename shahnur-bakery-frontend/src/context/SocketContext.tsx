import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';
import api from '../services/api';
interface SocketContextType {
  socket: Socket | null; isConnected: boolean; unreadCount: number;
  sendMessage: (chatId: string, content: string) => void;
  joinChat: (chatId: string) => void; leaveChat: (chatId: string) => void;
}
export const SocketContext = createContext<SocketContextType | undefined>(undefined);
export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, loading } = useAuth();
  useEffect(() => {
    setUnreadCount(0);
    if (loading || !user) return;
    const token = localStorage.getItem('shahnur_token');
    if (!token) return;
    const connection = io(import.meta.env.VITE_SOCKET_URL || window.location.origin, { auth: { token }, reconnectionAttempts: 5 });
    setSocket(connection);
    const refreshUnread = () => api.get('/chat/unread').then(res => setUnreadCount(res.data.data.totalUnread)).catch(() => {});
    connection.on('connect', () => { setIsConnected(true); refreshUnread(); });
    connection.on('disconnect', () => setIsConnected(false));
    connection.on('new_message', refreshUnread);
    connection.on('unread_count', setUnreadCount);
    connection.on('new_order', data => { if (user.role !== 'user') toast.success('Yangi buyurtma: ' + data.orderNumber); });
    return () => { connection.removeAllListeners(); connection.disconnect(); setSocket(null); setIsConnected(false); };
  }, [user?._id, loading]);
  return <SocketContext.Provider value={{ socket, isConnected, unreadCount,
    sendMessage: (chatId, content) => socket?.emit('send_message', { chatId, content }, (result: any) => { if (!result.success) toast.error(result.message || 'Xabar yuborilmadi'); }),
    joinChat: chatId => { socket?.emit('join_chat', chatId); },
    leaveChat: chatId => { socket?.emit('leave_chat', chatId); },
  }}>{children}</SocketContext.Provider>;
};

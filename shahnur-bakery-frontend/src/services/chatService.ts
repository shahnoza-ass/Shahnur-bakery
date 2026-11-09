import api from './api';
export interface ChatMessage { _id: string; content: string; sender: string | { _id: string; firstName: string; lastName: string }; createdAt: string; }
export interface Chat { _id: string; participants: { _id: string; firstName: string; lastName: string; role: string }[]; messages?: ChatMessage[]; lastMessage?: { content: string }; isActive: boolean; }
export const chatService = {
  async list(admin = false): Promise<Chat[]> { return (await api.get(admin ? '/admin/chats' : '/chat')).data.data; },
  async support(): Promise<Chat> { return (await api.post('/chat/support', {})).data.data; },
  async get(id: string): Promise<Chat> { return (await api.get('/chat/' + id)).data.data; },
  async send(id: string, content: string): Promise<ChatMessage> { return (await api.post('/chat/' + id + '/messages', { content })).data.data; },
  async read(id: string) { await api.put('/chat/' + id + '/read'); },
  async assign(id: string, adminId: string) { await api.put('/admin/chats/' + id + '/assign', { adminId }); },
};

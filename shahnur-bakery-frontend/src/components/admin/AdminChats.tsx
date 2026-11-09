import React from 'react';
import { AdminLayout } from './AdminLayout';
import { ChatWindow } from '../chat/ChatWindow';
export const AdminChats = () => <AdminLayout title="Chatlar" subtitle="Mijozlar bilan muloqot"><ChatWindow admin /></AdminLayout>;

import { create } from 'zustand';
import type { Notification } from '@/types';
import { generateId, MAX_NOTIFICATIONS } from '@/constants';

interface NotificationState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  getNotifications: () => Notification[];
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],

  addNotification: (notification) => {
    const id = generateId();
    const newNotification: Notification = {
      ...notification,
      id,
      createdAt: Date.now(),
      duration: notification.duration ?? 5000,
    };

    set((state) => ({
      notifications: [newNotification, ...state.notifications].slice(0, MAX_NOTIFICATIONS),
    }));

    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearNotifications: () => set({ notifications: [] }),

  getNotifications: () => get().notifications,
}));

export const notify = {
  success: (title: string, message: string, options?: Partial<Notification>) =>
    useNotificationStore.getState().addNotification({ type: 'success', title, message, ...options }),
  warning: (title: string, message: string, options?: Partial<Notification>) =>
    useNotificationStore.getState().addNotification({ type: 'warning', title, message, ...options }),
  error: (title: string, message: string, options?: Partial<Notification>) =>
    useNotificationStore.getState().addNotification({ type: 'error', title, message, ...options }),
  info: (title: string, message: string, options?: Partial<Notification>) =>
    useNotificationStore.getState().addNotification({ type: 'info', title, message, ...options }),
};
import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@shared/utils';
import { useNotificationStore } from '@/stores/notificationStore';
import type { Notification } from '@shared/types';

const ICONS = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
  info: Info,
};

const COLORS = {
  success: 'text-success border-success/30 bg-success/5',
  warning: 'text-warning border-warning/30 bg-warning/5',
  error: 'text-danger border-danger/30 bg-danger/5',
  info: 'text-primary border-primary/30 bg-primary/5',
};

export function NotificationToast({ notification }: { notification: Notification }) {
  const { removeNotification } = useNotificationStore();
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        setExiting(true);
        setTimeout(() => {
          setVisible(false);
          removeNotification(notification.id);
        }, 200);
      }, notification.duration);
      return () => clearTimeout(timer);
    }
  }, [notification.duration, notification.id, removeNotification]);

  if (!visible) return null;

  const IconComponent = ICONS[notification.type];
  const colorClass = COLORS[notification.type];

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-start gap-3 p-4 min-w-[320px] max-w-[480px] rounded-lg border shadow-window animate-in',
        exiting && 'animate-out',
        colorClass
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex-shrink-0 mt-0.5">
        <IconComponent className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-text">{notification.title}</p>
        {notification.message && (
          <p className="text-sm text-text-secondary mt-0.5">{notification.message}</p>
        )}
        {notification.action && (
          <button
            className="mt-2 text-sm font-medium text-primary hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            onClick={() => {
              notification.action?.onClick();
              removeNotification(notification.id);
            }}
          >
            {notification.action.label}
          </button>
        )}
      </div>
      <button
        className="flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors text-text-muted"
        onClick={() => removeNotification(notification.id)}
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
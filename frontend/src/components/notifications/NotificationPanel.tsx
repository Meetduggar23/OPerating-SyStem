import { Bell, X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn, formatRelativeTime } from '@/utils';
import { useNotificationStore } from '@/stores/notificationStore';
import type { Notification } from '@/types';

const ICONS = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
  info: Info,
};

const COLORS = {
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-danger',
  info: 'text-primary',
};

interface NotificationPanelProps {
  onClose: () => void;
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { notifications, removeNotification, clearNotifications } = useNotificationStore();

  return (
    <div
      className="fixed bottom-[56px] right-4 z-[60] w-96 animate-in"
      style={{ maxHeight: '400px' }}
      role="region"
      aria-label="Notification center"
    >
      <div className="bg-surface border border-border rounded-xl shadow-window overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-medium text-text">Notifications</h3>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                className="text-sm text-text-muted hover:text-text transition-colors"
                onClick={() => { clearNotifications(); onClose(); }}
              >
                Clear all
              </button>
            )}
            <button
              className="p-1 rounded hover:bg-surface-hover transition-colors text-text-muted"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[340px] p-2">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-text-muted">
              <Bell className="w-12 h-12 opacity-30 mb-3" />
              <p className="text-sm">No notifications</p>
              <p className="text-xs mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onDismiss={() => removeNotification(notification.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NotificationItem({ notification, onDismiss }: { notification: Notification; onDismiss: () => void }) {
  const IconComponent = ICONS[notification.type];
  const colorClass = COLORS[notification.type];

  return (
    <div className={cn(
      'flex items-start gap-3 p-3 rounded-lg border transition-colors',
      'hover:bg-surface-hover',
      notification.type === 'success' && 'border-success/30 bg-success/5',
      notification.type === 'warning' && 'border-warning/30 bg-warning/5',
      notification.type === 'error' && 'border-danger/30 bg-danger/5',
      notification.type === 'info' && 'border-primary/30 bg-primary/5'
    )}>
      <div className={cn('flex-shrink-0 mt-0.5', colorClass)}>
        <IconComponent className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium text-text">{notification.title}</p>
            {notification.message && (
              <p className="text-sm text-text-secondary mt-0.5">{notification.message}</p>
            )}
          </div>
          <span className="text-xs text-text-muted flex-shrink-0">{formatRelativeTime(notification.createdAt)}</span>
        </div>
        {notification.action && (
          <button
            className="mt-2 text-sm font-medium text-primary hover:underline"
            onClick={() => {
              notification.action?.onClick();
              onDismiss();
            }}
          >
            {notification.action.label}
          </button>
        )}
      </div>
      <button
        className="flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors text-text-muted"
        onClick={onDismiss}
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
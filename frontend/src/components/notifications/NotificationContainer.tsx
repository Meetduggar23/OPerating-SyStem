import { useNotificationStore } from '@/stores/notificationStore';
import { NotificationToast } from './NotificationToast';

export function NotificationContainer() {
  const { notifications } = useNotificationStore();

  return (
    <div className="fixed top-4 right-4 z-[700] flex flex-col gap-2 pointer-events-none" role="region" aria-label="Notifications" aria-live="polite">
      {notifications.map((notification) => (
        <NotificationToast key={notification.id} notification={notification} />
      ))}
    </div>
  );
}
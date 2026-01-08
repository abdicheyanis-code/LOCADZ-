import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';

type NotificationType = 'success' | 'error' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
}

interface NotificationContextValue {
  notify: (n: { type: NotificationType; message: string }) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined
);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notify = useCallback(
    ({ type, message }: { type: NotificationType; message: string }) => {
      const id = crypto.randomUUID();
      setNotifications(prev => [...prev, { id, type, message }]);

      // Auto-disparition après 4s
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 4000);
    },
    []
  );

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}

      {/* Zone d'affichage des toasts */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
        {notifications.map(n => (
          <div
            key={n.id}
            className={`px-4 py-3 rounded-2xl text-sm font-bold shadow-xl border backdrop-blur-md ${
              n.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-400/60 text-emerald-700'
                : n.type === 'error'
                ? 'bg-rose-500/10 border-rose-400/60 text-rose-700'
                : 'bg-indigo-500/10 border-indigo-400/60 text-indigo-700'
            }`}
          >
            {n.message}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return ctx;
};

// components/NotificationBell.tsx

import React, { useState, useEffect, useRef } from 'react';
import { notificationService } from '../services/notificationService';
import { Notification } from '../types';

// ✅ Installation nécessaire : npm install date-fns
// (Pour afficher "Il y a 2 min" au lieu de la date complète)
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface NotificationBellProps {
  userId: string;                    // L'ID de l'utilisateur connecté
  unreadCount: number;               // Nombre de notifs non lues (vient de App.tsx)
  onMarkAllRead: () => void;         // Fonction appelée quand on clique "Tout marquer comme lu"
  isScrolled?: boolean;              // Pour adapter le style selon l'état de la Navbar
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  userId,
  unreadCount,
  onMarkAllRead,
  isScrolled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);                      // État du dropdown (ouvert/fermé)
  const [notifications, setNotifications] = useState<Notification[]>([]); // Liste des notifications
  const bellRef = useRef<HTMLDivElement>(null);                     // Référence pour détecter les clics extérieurs

  // ✅ EFFET 1 : Récupère les notifications quand le dropdown s'ouvre OU que le compteur change
  useEffect(() => {
    if (!userId) return;

    const fetchNotifications = async () => {
      const data = await notificationService.getUserNotifications(userId, 10); // Limite à 10 notifs
      setNotifications(data);
    };

    fetchNotifications();
  }, [userId, unreadCount]); // Se déclenche quand unreadCount change (= nouvelle notif)

  // ✅ EFFET 2 : Ferme le dropdown si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ✅ FONCTION : Formate la date en français (ex: "Il y a 2 min")
  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: fr
    });
  };

  // ✅ FONCTION : Marque une notification comme lue
  const handleMarkAsRead = async (id: string) => {
    await notificationService.markAsRead(id);
    
    // Recharge les notifications pour mettre à jour l'affichage
    const data = await notificationService.getUserNotifications(userId, 10);
    setNotifications(data);
    
    // Met à jour le compteur global (dans App.tsx)
    onMarkAllRead();
  };

  // ✅ FONCTION : Retourne l'emoji selon le type de notification
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking_created': return '🆕';
      case 'booking_accepted': return '✅';
      case 'booking_rejected': return '❌';
      case 'booking_cancelled': return '🚫';
      case 'verification_approved': return '🛡️';
      case 'verification_rejected': return '⚠️';
      default: return '📬';
    }
  };

  return (
    <div className="relative" ref={bellRef}>
      {/* ========== BOUTON CLOCHE ========== */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-full transition-all duration-300 ${
          isOpen
            ? 'bg-white/20 text-white'
            : isScrolled
            ? 'text-white/70 hover:text-white hover:bg-white/10'
            : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-100'
        }`}
      >
        {/* Icône de cloche */}
        <svg
          className={`w-6 h-6 transition-transform ${isOpen ? 'animate-bounce' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* 🔴 BADGE ROUGE avec le nombre */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-5 px-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-black rounded-full shadow-lg animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ========== DROPDOWN ========== */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 md:w-96 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden z-[120] animate-in zoom-in-95 fade-in duration-200 origin-top-right">
          
          {/* HEADER du dropdown */}
          <div className="p-4 bg-gradient-to-r from-indigo-500 to-violet-500 text-white">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-lg">🔔 Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-bold">
                  {unreadCount}
                </span>
              )}
            </div>
            
            {/* Bouton "Tout marquer comme lu" */}
            {unreadCount > 0 && (
              <button
                onClick={async () => {
                  await notificationService.markAllAsRead(userId);
                  onMarkAllRead();
                  const data = await notificationService.getUserNotifications(userId, 10);
                  setNotifications(data);
                }}
                className="mt-2 w-full p-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-bold transition-all"
              >
                ✓ Tout marquer comme lu
              </button>
            )}
          </div>

          {/* LISTE DES NOTIFICATIONS */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              // Aucune notification
              <div className="p-8 text-center text-gray-500">
                <p className="text-4xl mb-2">🎉</p>
                <p className="text-lg font-bold text-gray-700">Aucune notification</p>
                <p className="text-sm mt-1">Revenez plus tard !</p>
              </div>
            ) : (
              // Affichage des notifications
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-all cursor-pointer ${
                    !notif.read_at ? 'bg-indigo-50/50' : ''
                  }`}
                  onClick={() => handleMarkAsRead(notif.id)}
                >
                  <div className="flex items-start gap-3">
                    {/* Icône selon le type */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xl ${
                      !notif.read_at 
                        ? 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {getNotificationIcon(notif.type)}
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm truncate ${
                        !notif.read_at ? 'text-indigo-900' : 'text-gray-900'
                      }`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {notif.body || "Nouvelle notification"}
                      </p>
                      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatDate(notif.created_at)}
                      </p>
                    </div>

                    {/* Point rouge si non lue */}
                    {!notif.read_at && (
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 shrink-0"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

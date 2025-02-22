import React, { useState, useEffect, useRef } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { notificationService, type Notification } from '../../lib/notifications';
import { supabase } from '../../lib/supabase';
import NotificationList from './NotificationList';

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotifications();
    const unsubscribe = notificationService.subscribe(handleNewNotification);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const notifications = await notificationService.getNotifications(user.id);
      setNotifications(notifications);
      setUnreadCount(notifications.filter(n => !n.read_at).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleNewNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  return (
    <div ref={bellRef} className="relative">
      <button
        onClick={toggleNotifications}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
      >
        {unreadCount > 0 ? (
          <>
            <BellRing className="h-6 w-6 text-blue-600" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount}
            </span>
          </>
        ) : (
          <Bell className="h-6 w-6 text-gray-600" />
        )}
      </button>

      {showNotifications && (
        <NotificationList
          notifications={notifications}
          onNotificationRead={(id) => {
            setUnreadCount(prev => Math.max(0, prev - 1));
            setNotifications(prev =>
              prev.map(n =>
                n.id === id ? { ...n, read_at: new Date().toISOString() } : n
              )
            );
          }}
          onClose={() => setShowNotifications(false)}
        />
      )}
    </div>
  );
}
import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Clock,
  Calendar,
  Building
} from 'lucide-react';
import { notificationService, type Notification } from '../../lib/notifications';

interface NotificationListProps {
  notifications: Notification[];
  onNotificationRead: (id: string) => void;
  onClose: () => void;
}

export default function NotificationList({
  notifications,
  onNotificationRead,
  onClose
}: NotificationListProps) {
  const handleAction = async (
    notification: Notification,
    action: 'confirm' | 'request_change' | 'cancel'
  ) => {
    try {
      if (!notification.shift_id) return;

      await notificationService.handleShiftAction(
        notification.id,
        notification.shift_id,
        action
      );

      onNotificationRead(notification.id);
    } catch (error) {
      console.error('Error handling notification action:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'shift_reminder':
        return <Clock className="h-6 w-6 text-blue-600" />;
      case 'shift_confirmation':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'shift_change':
        return <AlertCircle className="h-6 w-6 text-yellow-600" />;
      case 'shift_cancellation':
        return <XCircle className="h-6 w-6 text-red-600" />;
      default:
        return <Calendar className="h-6 w-6 text-gray-600" />;
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl z-50 max-h-[80vh] overflow-y-auto">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Notificaciones</h3>
      </div>

      <div className="divide-y">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No tienes notificaciones
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 ${!notification.read_at ? 'bg-blue-50' : ''}`}
            >
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {notification.title}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {notification.message}
                  </p>
                  
                  {notification.company_name && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                      <Building className="h-4 w-4" />
                      <span>{notification.company_name}</span>
                    </div>
                  )}

                  {notification.shift_date && (
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(new Date(notification.shift_date), "d 'de' MMMM", { locale: es })}
                      </span>
                      <Clock className="h-4 w-4 ml-2" />
                      <span>
                        {notification.shift_start} - {notification.shift_end}
                      </span>
                    </div>
                  )}

                  {notification.type === 'shift_reminder' && notification.status === 'pending' && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleAction(notification, 'confirm')}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        Confirmar asistencia
                      </button>
                      <button
                        onClick={() => handleAction(notification, 'request_change')}
                        className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        Solicitar cambio
                      </button>
                      <button
                        onClick={() => handleAction(notification, 'cancel')}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        Cancelar turno
                      </button>
                    </div>
                  )}

                  <p className="text-xs text-gray-500 mt-2">
                    {format(new Date(notification.created_at), "d MMM 'a las' HH:mm", { locale: es })}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
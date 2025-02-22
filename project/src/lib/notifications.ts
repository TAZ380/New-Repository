import { supabase } from './supabase';

export type NotificationStatus = 'pending' | 'confirmed' | 'cancelled' | 'change_requested';
export type NotificationType = 'shift_reminder' | 'shift_confirmation' | 'shift_change' | 'shift_cancellation';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  shift_id?: string;
  company_name?: string;
  shift_date?: string;
  shift_start?: string;
  shift_end?: string;
  status: NotificationStatus;
  created_at: string;
  read_at?: string;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: string;
  style: 'success' | 'warning' | 'danger';
}

class NotificationService {
  private static instance: NotificationService;
  private subscribers: ((notification: Notification) => void)[] = [];

  private constructor() {
    this.initializeRealtime();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private initializeRealtime() {
    supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          this.notifySubscribers(payload.new as Notification);
        }
      )
      .subscribe();
  }

  public subscribe(callback: (notification: Notification) => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  private notifySubscribers(notification: Notification) {
    this.subscribers.forEach(callback => callback(notification));
  }

  public async getNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  public async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) throw error;
  }

  public async handleShiftAction(
    notificationId: string,
    shiftId: string,
    action: 'confirm' | 'request_change' | 'cancel'
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Update notification status
      const { error: notificationError } = await supabase
        .from('notifications')
        .update({
          status: action === 'confirm' ? 'confirmed' :
                 action === 'cancel' ? 'cancelled' : 'change_requested',
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (notificationError) throw notificationError;

      // Update shift status
      const { error: shiftError } = await supabase
        .from('nurse_shifts')
        .update({
          status: action === 'confirm' ? 'confirmed' :
                 action === 'cancel' ? 'cancelled' : 'pending_change',
          updated_at: new Date().toISOString()
        })
        .eq('id', shiftId);

      if (shiftError) throw shiftError;

      // Create notification for company
      const message = action === 'confirm' ? 'ha confirmado su asistencia al turno' :
                     action === 'cancel' ? 'ha cancelado su asistencia al turno' :
                     'ha solicitado un cambio en el turno';

      const { error: companyNotificationError } = await supabase
        .from('notifications')
        .insert([{
          user_id: user.id,
          type: action === 'confirm' ? 'shift_confirmation' :
                action === 'cancel' ? 'shift_cancellation' : 'shift_change',
          title: `Actualización de turno`,
          message: `El/la enfermero/a ${message}`,
          shift_id: shiftId,
          status: 'pending'
        }]);

      if (companyNotificationError) throw companyNotificationError;
    } catch (error) {
      console.error('Error handling shift action:', error);
      throw error;
    }
  }
}

export const notificationService = NotificationService.getInstance();
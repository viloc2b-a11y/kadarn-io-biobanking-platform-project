// ==========================================================================
// Notification Service — Email, in-app, and webhook notifications
// ==========================================================================

export interface Notification {
  id: string;
  type: 'email' | 'in_app' | 'webhook';
  recipientId: string;
  organizationId?: string;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
  readAt?: string;
  createdAt: string;
}

export interface SendEmailOptions {
  to: string[];
  subject: string;
  body: string;
  html?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: { name: string; content: Buffer; contentType: string }[];
}

export interface SendInAppOptions {
  userId: string;
  organizationId?: string;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationService {
  /** Send an email notification */
  sendEmail(options: SendEmailOptions): Promise<{ messageId: string }>;

  /** Send an in-app notification */
  sendInApp(options: SendInAppOptions): Promise<{ notificationId: string }>;

  /** Get unread notifications for a user */
  getUnread(userId: string, organizationId?: string): Promise<Notification[]>;

  /** Mark a notification as read */
  markAsRead(notificationId: string, userId: string): Promise<void>;

  /** Get notification preferences for a user */
  getPreferences(userId: string): Promise<Record<string, boolean>>;

  /** Update notification preferences */
  setPreferences(userId: string, preferences: Record<string, boolean>): Promise<void>;
}

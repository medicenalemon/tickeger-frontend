import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import { Bell, CheckCircle, MessageSquare, Tag, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { STATUS_LABELS } from '../utils/helpers';
import './Notifications.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { decrementUnread, setUnreadCount } = useNotifications();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await notificationService.getAll();
      setNotifications(data);
      // Synchronize the global unread count
      const unread = data.filter(n => !n.isRead).length;
      setUnreadCount(unread);
    } catch (err) {
      setError(t('notifications.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await notificationService.markAsRead(notification._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notification._id ? { ...n, isRead: true } : n))
        );
        decrementUnread();
      } catch (err) {
        console.error('Error al marcar como leída:', err);
      }
    }
    
    // Redirect to ticket
    if (notification.ticket) {
      navigate(`/tickets/${notification.ticket._id}`);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'assignment':
        return <Tag size={20} className="notification-icon-assignment" />;
      case 'status_change':
        return <CheckCircle size={20} className="notification-icon-status" />;
      case 'new_comment':
        return <MessageSquare size={20} className="notification-icon-comment" />;
      default:
        return <AlertCircle size={20} className="notification-icon-default" />;
    }
  };

  const formatNotificationMessage = (message, type) => {
    if (!message) return '';
    
    // 1. Status change pattern: El estado del ticket "{title}" cambió a {status}
    if (type === 'status_change') {
      const match = message.match(/^El estado del ticket "(.*?)" cambió a (.*)$/);
      if (match) {
        const title = match[1];
        let status = match[2];
        Object.keys(STATUS_LABELS).forEach((key) => {
          if (status.includes(STATUS_LABELS[key]) || status.includes(key)) {
            status = `"${t(`status.${key}`)}"`;
          }
        });
        return t('notifications.msgStatusChange', { title, status });
      }
    }

    // 2. Assignment patterns
    if (type === 'assignment') {
      const match1 = message.match(/^Responsable cambiado de (.*?) a (.*?) en el ticket "(.*)"$/);
      if (match1) {
        return t('notifications.msgAssignChange', { oldUser: match1[1], newUser: match1[2], title: match1[3] });
      }
      const match2 = message.match(/^El ticket "(.*?)" ha sido asignado a (.*)$/);
      if (match2) {
        return t('notifications.msgAssigned', { title: match2[1], user: match2[2] });
      }
    }

    // 3. Comment pattern: {user} comentó: "{text}"
    if (type === 'new_comment') {
      const match = message.match(/^(.*?) comentó: "(.*)"$/);
      if (match) {
        return t('notifications.msgComment', { user: match[1], text: match[2] });
      }
    }

    // Fallback if patterns don't match: translate just the status labels if they exist
    let formattedMsg = message;
    
    Object.keys(STATUS_LABELS).forEach((key) => {
      const regex = new RegExp(`\\b${STATUS_LABELS[key]}\\b`, 'g');
      formattedMsg = formattedMsg.replace(regex, `"${t(`status.${key}`)}"`);
    });
    
    Object.keys(STATUS_LABELS).forEach((key) => {
       const regex = new RegExp(`\\b${key}\\b`, 'g');
       formattedMsg = formattedMsg.replace(regex, `"${t(`status.${key}`)}"`);
    });

    return formattedMsg;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const locale = i18n.language?.startsWith('en') ? 'en-US' : 'es-ES';
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-screen">
          <div className="spinner spinner-lg"></div>
          <p>{t('notifications.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('notifications.title')}</h1>
          <p className="page-subtitle">
            {t('notifications.subtitle')}
          </p>
        </div>
      </div>

      <div className="notifications-list">
        {notifications.length === 0 ? (
          <div className="no-notifications">
            <Bell size={48} className="empty-icon" />
            <p>{t('notifications.empty')}</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification._id}
              className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="notification-icon-container">
                {getIcon(notification.type)}
              </div>
              <div className="notification-content">
                <p className="notification-message">{formatNotificationMessage(notification.message, notification.type)}</p>
                <div className="notification-meta">
                  {notification.ticket && (
                    <span className="notification-ticket-ref">
                      {notification.ticket.ticketNumber || 'Ticket'}
                    </span>
                  )}
                  <span className="notification-time">
                    {formatDate(notification.createdAt)}
                  </span>
                </div>
              </div>
              {!notification.isRead && (
                <div className="notification-unread-indicator"></div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;

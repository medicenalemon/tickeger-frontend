import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../services/api';
import { Bell, CheckCircle, MessageSquare, Tag, AlertCircle } from 'lucide-react';
import './Notifications.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await notificationService.getAll();
      setNotifications(data);
    } catch (err) {
      setError('Error al cargar las notificaciones');
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
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
          <p>Cargando notificaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Notificaciones</h1>
        </div>
      </div>

      <div className="notifications-list">
        {notifications.length === 0 ? (
          <div className="no-notifications">
            <Bell size={48} className="empty-icon" />
            <p>No tienes notificaciones pendientes</p>
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
                <p className="notification-message">{notification.message}</p>
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

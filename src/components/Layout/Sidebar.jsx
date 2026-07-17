import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  Users,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Info,
  Bell,
  Globe
} from 'lucide-react';
import { useState } from 'react';
import './Layout.css';

const Sidebar = ({ mobileMenuOpen, onClose }) => {
  const { user, logout, isAdmin } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('es') ? 'en' : 'es';
    i18n.changeLanguage(newLang);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: t('sidebar.dashboard') },
    { to: '/notifications', icon: Bell, label: t('sidebar.notifications') },
    { to: '/tickets', icon: Ticket, label: t('sidebar.tickets') },
    { to: '/tickets/new', icon: PlusCircle, label: t('sidebar.newTicket') },
    ...(isAdmin ? [{ to: '/users', icon: Users, label: t('sidebar.users') }] : []),
    { to: '/profile', icon: User, label: t('sidebar.profile') },
    { to: '/about', icon: Info, label: t('sidebar.about') },
  ];

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''} ${mobileMenuOpen ? 'sidebar-mobile-open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo" onClick={() => navigate('/')}>
          <img src="/logo.png" alt="Tickeger" className="sidebar-logo-img" />
          {!collapsed && <span className="sidebar-logo-text">TICKEGER</span>}
        </div>
        <button
          className="sidebar-toggle"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={onClose}
            className={({ isActive }) => {
              if (item.to === '/tickets' && location.pathname === '/tickets/new') {
                return 'sidebar-link';
              }
              return `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`;
            }}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <item.icon size={20} />
              {item.to === '/notifications' && unreadCount > 0 && (
                <span className="sidebar-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
            </div>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          {!collapsed && (
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.name}</span>
              <span className="sidebar-user-role">{user?.role}</span>
            </div>
          )}
        </div>
        <div className="sidebar-footer-actions">
          <button className="sidebar-action-btn" onClick={toggleLanguage} title={t('sidebar.toggleLanguage')}>
            <Globe size={18} />
          </button>
          <button className="sidebar-action-btn" onClick={toggleTheme} title={isDarkMode ? t('sidebar.lightMode') : t('sidebar.darkMode')}>
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="sidebar-action-btn" onClick={handleLogout} title={t('sidebar.logout')}>
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

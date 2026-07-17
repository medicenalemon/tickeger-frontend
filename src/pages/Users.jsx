import { useState, useEffect } from 'react';
import { userService } from '../services/api';
import { Users as UsersIcon, Shield, UserCheck, UserX, Edit2, X, Check } from 'lucide-react';
import { formatDate, getInitials } from '../utils/helpers';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import './Users.css';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: '' });
  const { t } = useTranslation();

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await userService.getAll();
      setUsers(data);
    } catch (error) {
      toast.error(t('users.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user._id);
    setEditForm({ name: user.name, email: user.email, role: user.role });
  };

  const handleSave = async () => {
    try {
      await userService.update(editingUser, editForm);
      setEditingUser(null);
      fetchUsers();
      toast.success(t('users.updated'));
    } catch (error) {
      toast.error(t('users.errorUpdate'));
    }
  };

  const handleToggleActive = async (userId, isActive) => {
    try {
      if (isActive) {
        await userService.delete(userId);
        toast.success(t('users.deactivated'));
      } else {
        await userService.update(userId, { isActive: true });
        toast.success(t('users.activated'));
      }
      fetchUsers();
    } catch (error) {
      toast.error(t('users.errorStatus'));
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-screen"><div className="spinner spinner-lg"></div><p>{t('users.loading')}</p></div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('users.title')}</h1>
          <p className="page-subtitle">{t('users.subtitle', { count: users.length })}</p>
        </div>
      </div>

      <div className="users-grid">
        {users.map((u, i) => (
          <div key={u._id} className={`user-card card animate-fade-in ${!u.isActive ? 'user-card-inactive' : ''}`}
            style={{ animationDelay: `${i * 60}ms` }}>
            {editingUser === u._id ? (
              <div className="user-edit-form">
                <input className="form-input" value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))} />
                <input className="form-input" value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))} />
                <select className="form-select" value={editForm.role}
                  onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}>
                  <option value="user">{t('users.roleUser')}</option>
                  <option value="admin">{t('users.roleAdmin')}</option>
                </select>
                <div className="user-edit-actions">
                  <button className="btn btn-primary btn-sm" onClick={handleSave}><Check size={14} /> {t('users.save')}</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditingUser(null)}><X size={14} /></button>
                </div>
              </div>
            ) : (
              <>
                <div className="user-card-header">
                  <div className="user-card-avatar">{getInitials(u.name)}</div>
                  <div className="user-card-info">
                    <h3 className="user-card-name">{u.name}</h3>
                    <p className="user-card-email">{u.email}</p>
                  </div>
                </div>
                <div className="user-card-details">
                  <span className={`badge badge-role-${u.role}`}>
                    {u.role === 'admin' ? <Shield size={10} /> : <UsersIcon size={10} />}
                    {u.role.toUpperCase()}
                  </span>
                  <span className="user-card-date">{t('users.since', { date: formatDate(u.createdAt) })}</span>
                </div>
                <div className="user-card-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(u)}>
                    <Edit2 size={14} /> {t('users.edit')}
                  </button>
                  <button className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-primary'}`}
                    onClick={() => handleToggleActive(u._id, u.isActive)}>
                    {u.isActive ? <><UserX size={14} /> {t('users.deactivate')}</> : <><UserCheck size={14} /> {t('users.activate')}</>}
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Users;

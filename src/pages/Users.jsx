import { useState, useEffect } from 'react';
import { userService } from '../services/api';
import { Users as UsersIcon, Shield, UserCheck, UserX, Edit2, X, Check } from 'lucide-react';
import { formatDate, getInitials } from '../utils/helpers';
import toast from 'react-hot-toast';
import './Users.css';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: '' });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await userService.getAll();
      setUsers(data);
    } catch (error) {
      toast.error('Error al cargar usuarios');
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
      toast.success('Usuario actualizado');
    } catch (error) {
      toast.error('Error al actualizar');
    }
  };

  const handleToggleActive = async (userId, isActive) => {
    try {
      if (isActive) {
        await userService.delete(userId);
        toast.success('Usuario desactivado');
      } else {
        await userService.update(userId, { isActive: true });
        toast.success('Usuario activado');
      }
      fetchUsers();
    } catch (error) {
      toast.error('Error al cambiar estado');
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-screen"><div className="spinner spinner-lg"></div><p>Cargando usuarios...</p></div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Usuarios</h1>
          <p className="page-subtitle">{users.length} usuarios registrados</p>
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
                  <option value="user">Usuario</option>
                  <option value="admin">Admin</option>
                </select>
                <div className="user-edit-actions">
                  <button className="btn btn-primary btn-sm" onClick={handleSave}><Check size={14} /> Guardar</button>
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
                    {u.role}
                  </span>
                  <span className="user-card-date">Desde {formatDate(u.createdAt)}</span>
                </div>
                <div className="user-card-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(u)}>
                    <Edit2 size={14} /> Editar
                  </button>
                  <button className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-primary'}`}
                    onClick={() => handleToggleActive(u._id, u.isActive)}>
                    {u.isActive ? <><UserX size={14} /> Desactivar</> : <><UserCheck size={14} /> Activar</>}
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

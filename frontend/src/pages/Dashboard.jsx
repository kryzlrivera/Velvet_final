import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { Package, Clock, MessageSquare, MapPin, Edit2, X, Check } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({ phone: '', address: '' });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (user.role === 'admin') {
      navigate('/admin');
      return;
    }

    setProfileForm({ phone: user.phone || '', address: user.address || '' });

    api.get('/orders')
      .then(res => setOrders(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const handleUpdateProfile = async () => {
    try {
      await api.put('/user', profileForm);
      alert('Profile updated successfully! Refreshing to apply changes...');
      window.location.reload();
    } catch (err) {
      alert('Failed to update profile');
      console.error(err);
    }
  };

  if (!user) return null;
  if (loading) return <div className="loading-state">Loading your dashboard...</div>;

  return (
    <div className="container dashboard-page animate-fade-in">
      <div className="dashboard-header">
        <h2>Welcome back, {user.name}</h2>
        <p>Manage your orders and account details</p>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-sidebar">
          <div className="card profile-card" style={{position: 'relative'}}>
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} style={{position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)'}}>
                <Edit2 size={18} />
              </button>
            )}
            <div className="profile-avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <h3>{user.name}</h3>
            <p className="text-muted">{user.email}</p>
            
            <div className="profile-details">
              {isEditing ? (
                <div style={{marginTop: '1rem', width: '100%', textAlign: 'left'}}>
                  <div className="form-group" style={{marginBottom: '10px'}}>
                    <label style={{fontSize: '0.8rem'}}>Phone Number</label>
                    <input type="text" className="input-field" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} style={{padding: '6px', fontSize: '0.9rem'}}/>
                  </div>
                  <div className="form-group" style={{marginBottom: '10px'}}>
                    <label style={{fontSize: '0.8rem'}}>Delivery Address</label>
                    <textarea className="input-field" value={profileForm.address} onChange={e => setProfileForm({...profileForm, address: e.target.value})} style={{padding: '6px', fontSize: '0.9rem', resize: 'none'}} rows="3"></textarea>
                  </div>
                  <div style={{display: 'flex', gap: '8px'}}>
                    <button onClick={handleUpdateProfile} className="btn btn-primary" style={{flex: 1, padding: '6px', display: 'flex', justifyContent: 'center', alignItems: 'center'}}><Check size={16}/></button>
                    <button onClick={() => setIsEditing(false)} className="btn btn-outline" style={{flex: 1, padding: '6px', display: 'flex', justifyContent: 'center', alignItems: 'center'}}><X size={16}/></button>
                  </div>
                </div>
              ) : (
                <>
                  {user.phone ? (
                    <div className="detail-item">
                      <MessageSquare size={16} /> {user.phone}
                    </div>
                  ) : (
                    <div className="detail-item text-muted" style={{fontStyle: 'italic'}}><MessageSquare size={16} /> No phone added</div>
                  )}
                  {user.address ? (
                    <div className="detail-item">
                      <MapPin size={16} /> {user.address}
                    </div>
                  ) : (
                    <div className="detail-item text-muted" style={{fontStyle: 'italic'}}><MapPin size={16} /> No address added</div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="dashboard-main">
          <div className="card orders-card">
            <h3><Package size={20} style={{marginRight: '10px'}} /> Order History</h3>
            
            {orders.length === 0 ? (
              <div className="empty-state">
                <p>You haven't placed any orders yet.</p>
                <button className="btn btn-outline" onClick={() => navigate('/catalog')} style={{marginTop: '1rem'}}>
                  Browse Catalog
                </button>
              </div>
            ) : (
              <div className="orders-list">
                {orders.map(order => (
                  <div key={order.id} className="order-item">
                    <div className="order-header">
                      <div>
                        <strong>Order #{order.id}</strong>
                        <span className="order-date">
                          <Clock size={14} style={{marginRight: '4px', display:'inline', verticalAlign:'text-bottom'}} />
                          {new Date(order.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <span className={`status-badge status-${order.status.toLowerCase().replace(' ', '-')}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="order-details">
                      <p><strong>Total:</strong> ₱{parseFloat(order.total_amount).toFixed(2)}</p>
                      <p><strong>Items:</strong> {order.items.reduce((acc, item) => acc + item.quantity, 0)}</p>
                      {order.wrap_style && <p><strong>Wrap:</strong> {order.wrap_style}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

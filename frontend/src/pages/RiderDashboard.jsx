import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './RiderDashboard.css';

// Fix for default leaflet marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const RiderDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'rider') {
      navigate('/dashboard');
      return;
    }

    api.get('/orders')
      .then(res => {
        setOrders(res.data);
        if (res.data.length > 0) {
          setSelectedOrderId(res.data[0].id);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const updateStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}`, { status });
      setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o));
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const getNextStatus = (currentStatus) => {
    if (currentStatus === 'Pending') return 'In Arrangement';
    if (currentStatus === 'In Arrangement') return 'Out for Delivery';
    if (currentStatus === 'Out for Delivery') return 'Delivered';
    return 'Delivered';
  };

  const getProgressPercentage = (status) => {
    if (status === 'Pending') return 25;
    if (status === 'In Arrangement') return 50;
    if (status === 'Out for Delivery') return 75;
    if (status === 'Delivered') return 100;
    return 0;
  };

  if (!user || user.role !== 'rider') return null;
  if (loading) return <div className="loading-state">Loading Delivery Dashboard...</div>;

  const activeDeliveries = orders.filter(o => o.status !== 'Delivered');
  const selectedOrder = orders.find(o => o.id === selectedOrderId) || orders[0];

  return (
    <div className="rider-wrapper animate-fade-in">
      <div className="rider-dashboard-header">
        <h1>Delivery Driver Dashboard</h1>
        <p>Rider panel: orders and delivery progress. No cart available for riders.</p>
      </div>

      <div className="rider-dashboard-content">
        
        {/* Delivery List */}
        <div className="rider-card">
          <h2>Delivery List</h2>
          <div className="delivery-list-container">
            {activeDeliveries.length === 0 ? (
              <p style={{padding: '1rem', color: '#C20E4D'}}>No active deliveries.</p>
            ) : (
              activeDeliveries.map(order => (
                <div 
                  key={order.id} 
                  className={`delivery-list-item ${selectedOrderId === order.id ? 'active' : ''}`}
                  onClick={() => setSelectedOrderId(order.id)}
                >
                  <div className="delivery-list-info">
                    <strong>Order order_{order.id}_1773671476936</strong>
                    <span>{order.shipping_address.split(',')[0] || 'Butuan City'}</span>
                  </div>
                  <div className="delivery-list-actions">
                    <button className="btn-rider-map">Map</button>
                    <button 
                      className="btn-rider-next"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateStatus(order.id, getNextStatus(order.status));
                      }}
                    >
                      Next status
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Delivery Details */}
        {selectedOrder && (
          <div className="rider-card">
            <h2>Delivery Details</h2>
            <div className="delivery-details-content">
              <strong>Order order_{selectedOrder.id}_1773671476936</strong>
              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <select 
                  className="status-dropdown"
                  value={selectedOrder.status}
                  onChange={(e) => updateStatus(selectedOrder.id, e.target.value)}
                >
                  <option value="Pending">Pending</option>
                  <option value="In Arrangement">In Arrangement</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>
              <div className="detail-row">
                <span className="detail-label">Option:</span> {selectedOrder.wrap_style || 'Standard'}
              </div>
              <div className="detail-row">
                <span className="detail-label">Address:</span> {selectedOrder.shipping_address}
              </div>
              <div className="detail-row">
                <span className="detail-label">Phone:</span> {selectedOrder.user?.phone || '09934649794'}
              </div>
              
              {(selectedOrder.latitude && selectedOrder.longitude) ? (
                <div style={{ height: '200px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #E0E0E0', marginTop: '1rem' }}>
                  <MapContainer center={[selectedOrder.latitude, selectedOrder.longitude]} zoom={15} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <Marker position={[selectedOrder.latitude, selectedOrder.longitude]} />
                  </MapContainer>
                </div>
              ) : (
                <div style={{ height: '100px', width: '100%', borderRadius: '8px', border: '1px dashed #CCC', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="text-muted" style={{fontSize: '0.85rem'}}>No GPS coordinates provided.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Progress */}
        {selectedOrder && (
          <div className="rider-card">
            <h2>Progress</h2>
            <div className="progress-content">
              <strong>Order order_{selectedOrder.id}_1773671476936</strong>
              <div className="progress-bar-container">
                <div 
                  className="progress-bar-fill" 
                  style={{width: `${getProgressPercentage(selectedOrder.status)}%`}}
                ></div>
              </div>
              <span className="progress-status-text">{selectedOrder.status}</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default RiderDashboard;

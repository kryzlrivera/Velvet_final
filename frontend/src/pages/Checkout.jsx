import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Checkout.css';
import { geocodeAddress } from '../utils/geocoding';

// Fix for default leaflet marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const DraggableMarker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  
  return position === null ? null : (
    <Marker
      position={position}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const pos = marker.getLatLng();
          setPosition([pos.lat, pos.lng]);
        },
      }}
    />
  );
};

const MapRecenter = ({ lat, lon }) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lon) {
      map.flyTo([lat, lon], 14, { animate: true, duration: 1.5 });
    }
  }, [lat, lon, map]);
  return null;
};

const Checkout = () => {
  const { cart, cartTotal, clearCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: user ? user.name : '',
    email: user ? user.email : '',
    shipping_address: user ? user.address || '' : '',
    notes: '',
    wrap_style: 'Standard',
    latitude: 14.5995,
    longitude: 120.9842
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const [addressParts, setAddressParts] = useState({
    province: '', provinceName: '',
    city: '', cityName: '',
    barangay: '', barangayName: '',
    street: '', landmark: ''
  });

  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [barangays, setBarangays] = useState([]);

  useEffect(() => {
    fetch('https://psgc.gitlab.io/api/provinces')
      .then(res => res.json())
      .then(data => setProvinces(data.sort((a, b) => a.name.localeCompare(b.name))))
      .catch(console.error);
  }, []);

  const handleProvinceChange = (e) => {
    const code = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;
    setAddressParts({ ...addressParts, province: code, provinceName: name, city: '', cityName: '', barangay: '', barangayName: '' });
    setCities([]);
    setBarangays([]);
    if (formErrors.province) setFormErrors({ ...formErrors, province: '' });
    
    if (code) {
      fetch(`https://psgc.gitlab.io/api/provinces/${code}/cities-municipalities`)
        .then(res => res.json())
        .then(data => setCities(data.sort((a, b) => a.name.localeCompare(b.name))))
        .catch(console.error);
    }
  };

  const handleCityChange = async (e) => {
    const code = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;
    setAddressParts({ ...addressParts, city: code, cityName: name, barangay: '', barangayName: '' });
    setBarangays([]);
    if (formErrors.city) setFormErrors({ ...formErrors, city: '' });
    
    if (code) {
      fetch(`https://psgc.gitlab.io/api/cities-municipalities/${code}/barangays`)
        .then(res => res.json())
        .then(data => setBarangays(data.sort((a, b) => a.name.localeCompare(b.name))))
        .catch(console.error);
      
      const coords = await geocodeAddress(`${name}, ${addressParts.provinceName}, Philippines`);
      if (coords) {
        setFormData(prev => ({ ...prev, latitude: coords.lat, longitude: coords.lon }));
      }
    }
  };

  const handleBarangayChange = async (e) => {
    const code = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;
    setAddressParts({ ...addressParts, barangay: code, barangayName: name });
    if (formErrors.barangay) setFormErrors({ ...formErrors, barangay: '' });
    
    if (name) {
      const coords = await geocodeAddress(`${name}, ${addressParts.cityName}, ${addressParts.provinceName}, Philippines`);
      if (coords) {
        setFormData(prev => ({ ...prev, latitude: coords.lat, longitude: coords.lon }));
      }
    }
  };

  const handleAddressTextChange = (e) => {
    setAddressParts({ ...addressParts, [e.target.name]: e.target.value });
    if (formErrors[e.target.name]) {
      setFormErrors({ ...formErrors, [e.target.name]: '' });
    }
  };

  if (cart.length === 0 && !success) {
    navigate('/cart');
    return null;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (formErrors[e.target.name]) {
      setFormErrors({ ...formErrors, [e.target.name]: '' });
    }
  };

  const setMapPosition = (pos) => {
    setFormData(prev => ({ ...prev, latitude: pos[0], longitude: pos[1] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Explicit Form Validation
    const errors = {};
    if (!user) {
      if (!formData.name.trim()) errors.name = 'Full Name is required.';
      if (!formData.email.trim()) errors.email = 'Email Address is required.';
    }
    if (!addressParts.province) errors.province = 'Please select a Province.';
    if (!addressParts.city) errors.city = 'Please select a City/Municipality.';
    if (!addressParts.barangay) errors.barangay = 'Please select a Barangay.';
    if (!addressParts.street.trim()) errors.street = 'Street, Purok, or House No. is required.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setError('Please fill out all required fields to complete your order.');
      return; // Stop submission
    }

    setFormErrors({});
    setLoading(true);
    setError('');

    const fullAddress = `${addressParts.street}, Brgy. ${addressParts.barangayName}, ${addressParts.cityName}, ${addressParts.provinceName}${addressParts.landmark ? ` (Landmark: ${addressParts.landmark})` : ''}`;

    const payload = {
      ...formData,
      shipping_address: fullAddress,
      total_amount: cartTotal,
      items: cart.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        ...(item.custom_details && { custom_details: item.custom_details })
      }))
    };

    try {
      let res;
      if (user) {
        res = await api.post('/orders', payload);
      } else {
        res = await api.post('/guest-checkout', payload);
        if (res.data.access_token) {
          localStorage.setItem('token', res.data.access_token);
        }
      }
      setSuccess('Your order has been placed successfully!');
      clearCart();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container checkout-success animate-fade-in">
        <div className="card" style={{padding: '3rem', textAlign: 'center', maxWidth: '600px', margin: '4rem auto'}}>
          <div className="success-icon">✓</div>
          <h2>Order Confirmed!</h2>
          <p>{success}</p>
          <p style={{color: 'var(--text-muted)', marginTop: '1rem'}}>Payment Method: Cash on Delivery</p>
          <div style={{display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem'}}>
            <button className="btn btn-outline" onClick={() => navigate('/catalog')}>
              Continue Shopping
            </button>
            <button className="btn btn-primary" onClick={() => {
              // Force reload to update auth context if they checked out as guest
              window.location.href = '/dashboard';
            }}>
              View Order Status
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container checkout-page animate-fade-in">
      <h2>Checkout</h2>
      
      <div className="checkout-content">
        <div className="checkout-form-container card">
          <h3>Delivery Details</h3>
          
          {error && <div className="error-alert">{error}</div>}
          
          <form onSubmit={handleSubmit} className="checkout-form" noValidate>
            {!user && (
              <>
                <div className="form-group">
                  <label>Full Name <span style={{color: '#C62828'}}>*</span></label>
                  <input type="text" name="name" className={`input-field ${formErrors.name ? 'error-border' : ''}`} value={formData.name} onChange={handleChange} />
                  {formErrors.name && <small className="error-text" style={{color: '#C62828', fontSize: '0.8rem', display: 'block'}}>{formErrors.name}</small>}
                </div>
                <div className="form-group">
                  <label>Email Address <span style={{color: '#C62828'}}>*</span></label>
                  <input type="email" name="email" className={`input-field ${formErrors.email ? 'error-border' : ''}`} value={formData.email} onChange={handleChange} />
                  {formErrors.email ? (
                    <small className="error-text" style={{color: '#C62828', fontSize: '0.8rem', display: 'block'}}>{formErrors.email}</small>
                  ) : (
                    <small style={{color: 'var(--text-muted)'}}>We'll create a temporary account to track your order.</small>
                  )}
                </div>
              </>
            )}
            
            <div className="form-group">
              <label>Province <span style={{color: '#C62828'}}>*</span></label>
              <select name="province" className={`input-field ${formErrors.province ? 'error-border' : ''}`} value={addressParts.province} onChange={handleProvinceChange}>
                <option value="">Select Province</option>
                {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
              </select>
              {formErrors.province && <small className="error-text" style={{color: '#C62828', fontSize: '0.8rem', display: 'block'}}>{formErrors.province}</small>}
            </div>

            <div className="form-row">
              <div className="form-group" style={{flex: 1}}>
                <label>City / Municipality <span style={{color: '#C62828'}}>*</span></label>
                <select name="city" className={`input-field ${formErrors.city ? 'error-border' : ''}`} value={addressParts.city} onChange={handleCityChange} disabled={!addressParts.province}>
                  <option value="">Select City</option>
                  {cities.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
                {formErrors.city && <small className="error-text" style={{color: '#C62828', fontSize: '0.8rem', display: 'block'}}>{formErrors.city}</small>}
              </div>
              <div className="form-group" style={{flex: 1}}>
                <label>Barangay <span style={{color: '#C62828'}}>*</span></label>
                <select name="barangay" className={`input-field ${formErrors.barangay ? 'error-border' : ''}`} value={addressParts.barangay} onChange={handleBarangayChange} disabled={!addressParts.city}>
                  <option value="">Select Barangay</option>
                  {barangays.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
                </select>
                {formErrors.barangay && <small className="error-text" style={{color: '#C62828', fontSize: '0.8rem', display: 'block'}}>{formErrors.barangay}</small>}
              </div>
            </div>

            <div className="form-group">
              <label>Street, Purok, House No. <span style={{color: '#C62828'}}>*</span></label>
              <input type="text" name="street" className={`input-field ${formErrors.street ? 'error-border' : ''}`} value={addressParts.street} onChange={handleAddressTextChange} placeholder="e.g. 123 Main St, Purok 4" />
              {formErrors.street && <small className="error-text" style={{color: '#C62828', fontSize: '0.8rem', display: 'block'}}>{formErrors.street}</small>}
            </div>

            <div className="form-group">
              <label>Landmark (Optional)</label>
              <input type="text" name="landmark" className="input-field" value={addressParts.landmark} onChange={handleAddressTextChange} placeholder="e.g. Near 7-11, Blue Gate" />
            </div>

            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label>Pin Delivery Location on Map</label>
              <div style={{ height: '300px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #E0E0E0' }}>
                <MapContainer center={[formData.latitude, formData.longitude]} zoom={13} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <MapRecenter lat={formData.latitude} lon={formData.longitude} />
                  <DraggableMarker position={[formData.latitude, formData.longitude]} setPosition={setMapPosition} />
                </MapContainer>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group" style={{flex: 1}}>
                <label>Wrapping Style</label>
                <select name="wrap_style" className="input-field" value={formData.wrap_style} onChange={handleChange}>
                  <option value="Standard">Standard Ribbon</option>
                  <option value="Premium">Premium Box</option>
                  <option value="Eco-friendly">Eco-friendly Kraft</option>
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label>Personal Note (Card Message)</label>
              <textarea name="notes" className="input-field" value={formData.notes} onChange={handleChange} rows="2" placeholder="Write a message to accompany your flowers..."></textarea>
            </div>

            <div className="payment-section">
              <h4>Payment Method</h4>
              <div className="payment-method selected">
                <input type="radio" checked readOnly />
                <label>Cash on Delivery (COD)</label>
              </div>
            </div>
            
            <button type="submit" className="btn btn-primary full-width" disabled={loading}>
              {loading ? 'Processing...' : `Place Order - ₱${cartTotal.toFixed(2)}`}
            </button>
          </form>
        </div>
        
        <div className="checkout-summary card">
          <h3>Order Items</h3>
          <div className="summary-items">
            {cart.map(item => (
              <div key={item.cart_id || item.product_id} className="summary-item">
                <div className="summary-item-info">
                  <span className="qty">{item.quantity}x</span>
                  <span>{item.product.name} {item.custom_details ? '(Custom)' : ''}</span>
                </div>
                <span>₱{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="summary-divider"></div>
          <div className="summary-row total">
            <span>Total (COD)</span>
            <span>₱{cartTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import './CustomizeBouquet.css';

// Hardcoded Master Data
const FLOWERS = [
  { id: 'f1', name: 'Red Rose', price: 150, emoji: '🌹' },
  { id: 'f2', name: 'White Lily', price: 200, emoji: '💮' },
  { id: 'f3', name: 'Sunflower', price: 180, emoji: '🌻' },
  { id: 'f4', name: 'Pink Tulip', price: 120, emoji: '🌷' },
  { id: 'f5', name: 'Baby Breath', price: 80, emoji: '🌿' },
];

const WRAPPERS = [
  { id: 'w1', name: 'Matte Black', color: '#2c3e50', price: 50 },
  { id: 'w2', name: 'Kraft Paper', color: '#d4a373', price: 40 },
  { id: 'w3', name: 'White Lace', color: '#f8f9fa', price: 60 },
  { id: 'w4', name: 'Pink Silk', color: '#ffb5a7', price: 80 },
];

const RIBBONS = [
  { id: 'r1', name: 'Crimson Red', color: '#9d0208', price: 30 },
  { id: 'r2', name: 'Gold Satin', color: '#d4af37', price: 40 },
  { id: 'r3', name: 'Navy Blue', color: '#03045e', price: 30 },
  { id: 'r4', name: 'White Chiffon', color: '#ffffff', price: 35 },
];

const ADDONS = [
  { id: 'a1', name: 'Ferrero Rocher Box', price: 350 },
  { id: 'a2', name: 'Mini Plush Bear', price: 250 },
  { id: 'a3', name: 'Foil Balloon (Love)', price: 150 },
];

const CustomizeBouquet = () => {
  const { addToCart } = useContext(CartContext);
  const navigate = useNavigate();

  const [customProduct, setCustomProduct] = useState(null);
  
  // Custom Bouquet State
  const [stems, setStems] = useState({});
  const [wrapper, setWrapper] = useState(WRAPPERS[0]);
  const [ribbon, setRibbon] = useState(RIBBONS[0]);
  const [selectedAddons, setSelectedAddons] = useState([]);
  
  const [totalPrice, setTotalPrice] = useState(0);

  // Load the generic Custom Bouquet product ID from backend on mount
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/products')
      .then(res => res.json())
      .then(data => {
        const custom = data.find(p => p.name === 'Custom Bouquet');
        if (custom) setCustomProduct(custom);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    let total = 0;
    Object.keys(stems).forEach(id => {
      const flower = FLOWERS.find(f => f.id === id);
      total += flower.price * stems[id];
    });
    total += wrapper.price;
    total += ribbon.price;
    selectedAddons.forEach(id => {
      const addon = ADDONS.find(a => a.id === id);
      total += addon.price;
    });
    setTotalPrice(total);
  }, [stems, wrapper, ribbon, selectedAddons]);

  const updateStem = (id, delta) => {
    setStems(prev => {
      const current = prev[id] || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: next };
    });
  };

  const toggleAddon = (id) => {
    setSelectedAddons(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleAddToCart = () => {
    if (Object.keys(stems).length === 0) {
      alert("Please select at least one flower stem to create a bouquet.");
      return;
    }

    if (!customProduct) {
      alert("System error: Custom Bouquet product not found in database.");
      return;
    }

    // Build the custom details payload
    const customDetails = {
      flowers: Object.keys(stems).map(id => {
        const f = FLOWERS.find(fl => fl.id === id);
        return { name: f.name, quantity: stems[id], price: f.price };
      }),
      wrapper: { name: wrapper.name, price: wrapper.price },
      ribbon: { name: ribbon.name, price: ribbon.price },
      addons: selectedAddons.map(id => {
        const a = ADDONS.find(ad => ad.id === id);
        return { name: a.name, price: a.price };
      })
    };

    // Override the generic product's price with our calculated dynamic price
    const productToAdd = {
      ...customProduct,
      price: totalPrice,
      custom_details: customDetails,
      is_custom: true
    };

    addToCart(productToAdd, 1);
    navigate('/cart');
  };

  return (
    <div className="container customize-page animate-fade-in">
      <div className="customize-header">
        <h2>Design Your Own Bouquet</h2>
        <p className="text-muted">Handpick every detail, from fresh stems to elegant wrappers.</p>
      </div>

      <div className="builder-layout">
        <div className="builder-main">
          
          <div className="builder-section">
            <h3>1. Choose Your Flowers</h3>
            <div className="flower-grid">
              {FLOWERS.map(flower => (
                <div key={flower.id} className="flower-card">
                  <div className="flower-img">{flower.emoji}</div>
                  <h4>{flower.name}</h4>
                  <p className="text-muted" style={{fontSize: '0.9rem'}}>₱{flower.price} / stem</p>
                  <div className="quantity-controls">
                    <button onClick={() => updateStem(flower.id, -1)}>-</button>
                    <span>{stems[flower.id] || 0}</span>
                    <button onClick={() => updateStem(flower.id, 1)}>+</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="builder-section">
            <h3>2. Select Wrapper</h3>
            <div className="swatch-grid">
              {WRAPPERS.map(w => (
                <div 
                  key={w.id} 
                  className={`swatch-item ${wrapper.id === w.id ? 'active' : ''}`}
                  onClick={() => setWrapper(w)}
                >
                  <div className="swatch-color" style={{background: w.color, border: w.color === '#ffffff' ? '1px solid #ccc' : 'none'}}></div>
                  <span style={{fontSize: '0.85rem'}}>{w.name} (+₱{w.price})</span>
                </div>
              ))}
            </div>
          </div>

          <div className="builder-section">
            <h3>3. Select Ribbon</h3>
            <div className="swatch-grid">
              {RIBBONS.map(r => (
                <div 
                  key={r.id} 
                  className={`swatch-item ${ribbon.id === r.id ? 'active' : ''}`}
                  onClick={() => setRibbon(r)}
                >
                  <div className="swatch-color" style={{background: r.color, border: r.color === '#ffffff' ? '1px solid #ccc' : 'none'}}></div>
                  <span style={{fontSize: '0.85rem'}}>{r.name} (+₱{r.price})</span>
                </div>
              ))}
            </div>
          </div>

          <div className="builder-section">
            <h3>4. Add-ons (Optional)</h3>
            <div className="addon-list">
              {ADDONS.map(addon => (
                <div 
                  key={addon.id} 
                  className={`addon-item ${selectedAddons.includes(addon.id) ? 'active' : ''}`}
                  onClick={() => toggleAddon(addon.id)}
                >
                  <div>
                    <strong>{addon.name}</strong>
                    <div className="text-muted" style={{fontSize: '0.85rem'}}>+₱{addon.price}</div>
                  </div>
                  <input type="checkbox" checked={selectedAddons.includes(addon.id)} readOnly style={{accentColor: 'var(--primary-color)', width: '20px', height: '20px'}} />
                </div>
              ))}
            </div>
          </div>

        </div>

        <div className="builder-sidebar">
          <div className="summary-panel">
            <h3>Bouquet Summary</h3>
            
            <div className="summary-list">
              {Object.keys(stems).map(id => {
                const f = FLOWERS.find(fl => fl.id === id);
                return (
                  <div className="summary-row" key={id}>
                    <span>{stems[id]}x {f.name}</span>
                    <span>₱{stems[id] * f.price}</span>
                  </div>
                );
              })}
              
              <div className="summary-row" style={{marginTop: '10px'}}>
                <span>Wrapper: {wrapper.name}</span>
                <span>₱{wrapper.price}</span>
              </div>
              <div className="summary-row">
                <span>Ribbon: {ribbon.name}</span>
                <span>₱{ribbon.price}</span>
              </div>

              {selectedAddons.map(id => {
                const a = ADDONS.find(ad => ad.id === id);
                return (
                  <div className="summary-row" key={id}>
                    <span>Addon: {a.name}</span>
                    <span>₱{a.price}</span>
                  </div>
                );
              })}
            </div>

            <div className="total-row">
              <span>Total Price</span>
              <span>₱{totalPrice}</span>
            </div>

            <button 
              className="btn btn-primary full-width" 
              style={{marginTop: '2rem'}}
              onClick={handleAddToCart}
            >
              Add Custom Bouquet to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomizeBouquet;

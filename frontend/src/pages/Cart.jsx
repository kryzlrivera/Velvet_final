import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import './Cart.css';

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, cartTotal } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="container empty-cart animate-fade-in">
        <h2>Your Cart is Empty</h2>
        <p>Looks like you haven't added any beautiful blooms yet.</p>
        <Link to="/catalog" className="btn btn-primary" style={{marginTop: '2rem'}}>
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container cart-page animate-fade-in">
      <h2>Shopping Cart</h2>
      
      <div className="cart-content">
        <div className="cart-items">
          {cart.map(item => (
            <div key={item.cart_id || item.product_id} className="cart-item card">
              <div className="cart-item-image">
                {item.product.image_url ? (
                  <img src={`http://localhost:8000${item.product.image_url}`} alt={item.product.name} />
                ) : (
                  <div className="product-placeholder small"></div>
                )}
              </div>
              
              <div className="cart-item-details">
                <h3>{item.product.name}</h3>
                {item.custom_details && (
                  <div style={{fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0'}}>
                    <em>Customized Bouquet</em>
                  </div>
                )}
                <p className="cart-item-price">₱{parseFloat(item.price).toFixed(2)}</p>
              </div>
              
              <div className="cart-item-actions">
                <div className="quantity-controls">
                  <button onClick={() => updateQuantity(item.cart_id || item.product_id, item.quantity - 1)}>
                    <Minus size={16} />
                  </button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.cart_id || item.product_id, item.quantity + 1)}>
                    <Plus size={16} />
                  </button>
                </div>
                
                <p className="cart-item-total">
                  ₱{(item.price * item.quantity).toFixed(2)}
                </p>
                
                <button 
                  className="btn-remove" 
                  onClick={() => removeFromCart(item.cart_id || item.product_id)}
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="cart-summary card">
          <h3>Order Summary</h3>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>₱{cartTotal.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <span>Calculated at checkout</span>
          </div>
          <div className="summary-divider"></div>
          <div className="summary-row total">
            <span>Total</span>
            <span>₱{cartTotal.toFixed(2)}</span>
          </div>
          
          <button 
            className="btn btn-primary full-width" 
            style={{marginTop: '2rem'}}
            onClick={() => navigate('/checkout')}
          >
            Proceed to Checkout <ArrowRight size={18} style={{marginLeft: '8px'}}/>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;

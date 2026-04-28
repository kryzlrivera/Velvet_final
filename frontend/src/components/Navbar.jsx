import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { ShoppingCart, User, LogOut, Package } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { cart } = useContext(CartContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <nav className="navbar">
      <div className="container navbar-content">
        <Link to="/" className="navbar-brand">
          Velvet <span style={{ fontStyle: 'italic' }}>&amp;</span> Vine
        </Link>
        {user && user.role === 'rider' ? (
          <>
            <div className="navbar-center" style={{display: 'flex', alignItems: 'center', gap: '10px', color: '#C20E4D', position: 'absolute', left: '50%', transform: 'translateX(-50%)'}}>
              <span style={{fontSize: '0.9rem'}}>Hello, {user.name}</span>
              <button onClick={handleLogout} className="btn-outline-pink">Sign Out</button>
            </div>
            <div className="navbar-links" style={{marginLeft: 'auto'}}>
              <Link to="/dashboard">Orders</Link>
              <Link to="/dashboard">Profile</Link>
              <Link to="/rider">Delivery Driver</Link>
            </div>
          </>
        ) : (
          <>
            <div className="navbar-links">
              <Link to="/catalog">Shop</Link>
              <Link to="/customize">Customize</Link>
              {user && user.role === 'customer' && <Link to="/dashboard">Orders</Link>}
              {user && user.role === 'customer' && <Link to="/dashboard">Profile</Link>}
              {user && user.role === 'admin' && <Link to="/admin">Admin</Link>}
            </div>
            <div className="navbar-actions">
              {(!user || user.role === 'customer') && (
                <Link to="/cart" className="cart-btn">
                  Cart: {cartItemCount}
                </Link>
              )}
              {user ? (
                <button onClick={handleLogout} className="btn-logout" style={{marginLeft: '15px'}}>
                  <LogOut size={20} /> Logout
                </button>
              ) : (
                <div className="auth-links" style={{display: 'inline-flex', marginLeft: '15px'}}>
                  <Link to="/login" className="btn btn-outline" style={{marginRight: '10px', padding: '8px 20px'}}>Login</Link>
                  <Link to="/register" className="cart-btn">Register</Link>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

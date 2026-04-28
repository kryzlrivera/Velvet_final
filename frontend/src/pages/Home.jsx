import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import api from '../api/axios';
import './Home.css';

const Home = () => {
  const [products, setProducts] = useState([]);
  const { addToCart } = useContext(CartContext);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/products')
      .then(res => {
        // Filter out the Custom Bouquet placeholder and only show active ones
        const available = res.data.filter(p => p.name !== 'Custom Bouquet' && p.is_active);
        // Grab the latest 4 products
        setProducts(available.slice(0, 4));
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="home-container animate-fade-in">
      {/* Hero Section */}
      <section className="hero container">
        <div className="hero-content">
          <div className="badge">
            <span className="dot"></span> New Bouquet Style
          </div>
          <h1>Curated Florals that<br/>Speak to the Soul</h1>
          <p className="subtitle">Each flower to evoke feeling and draw hearts closer.</p>
          
          <div className="hero-actions">
            <button className="btn hero-btn-primary" onClick={() => navigate('/catalog')}>Order Now</button>
            <button className="btn hero-btn-outline" onClick={() => navigate('/catalog')}>Customize Bouquet</button>
          </div>

          <div className="hero-stats">
            <div className="stat-card">
              <span className="stat-number">36K+</span>
              <span className="stat-label">Monthly Users</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">120K</span>
              <span className="stat-label">Bouquets Delivered</span>
            </div>
          </div>
        </div>

        <div className="hero-image-card">
          <div className="hero-image-bg"></div>
          <div className="hero-image-footer">
            <div className="hero-image-text">
              <span className="hero-badge-small">NEW BOUQUET STYLE</span>
              <h3>Crafting by Loves</h3>
            </div>
            <button className="btn hero-btn-demo">View Demo</button>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="products-section container">
        <h2>Order with Confidence</h2>
        
        <div className="products-grid">
          {products.map(product => (
            <div className="product-card" key={product.id}>
              <div className="product-image">
                {product.image_url ? (
                  <img src={`http://localhost:8000${product.image_url}`} alt={product.name} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                ) : (
                  <div className="product-placeholder-img"></div>
                )}
              </div>
              <div className="product-info">
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <div className="product-footer">
                  <span className="price">₱{product.price}</span>
                  <button className="btn btn-add-cart" onClick={() => addToCart(product)}>Add to Cart</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom Blocks */}
      <section className="bottom-blocks container">
        <div className="block block-left">
          <h2>Why custom hand picked flower?</h2>
          <p>Each bloom receives soft laughter, secret glances, and love that lingers forever.</p>
          <button className="btn hero-btn-primary" style={{marginTop: 'auto', alignSelf: 'flex-start'}}>Personalized Bouquet</button>
        </div>
        <div className="block block-right">
          <h2>Blooms recalls the one you love</h2>
          <p>Elegant blooms that speak to the soul. Crafted to warm the heart.</p>
          <div className="block-stats">
            <div className="stat-box">
              <span className="stat-number">160K</span>
              <span className="stat-label">Bouquet Delivered</span>
            </div>
            <div className="stat-box light">
              <span className="stat-title">Love at First Bloom</span>
              <span className="stat-label" style={{color: '#C20E4D'}}>Order Now</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

import React, { useState, useEffect, useContext } from 'react';
import { CartContext } from '../context/CartContext';
import api from '../api/axios';
import { ShoppingBag } from 'lucide-react';
import './Catalog.css';

const Catalog = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const { addToCart } = useContext(CartContext);

  useEffect(() => {
    api.get('/products')
      .then(res => {
        const publicProducts = res.data.filter(p => p.name !== 'Custom Bouquet');
        setProducts(publicProducts);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const categories = ['All', ...new Set(products.map(p => p.category))];
  const filteredProducts = filter === 'All' ? products : products.filter(p => p.category === filter);

  if (loading) return <div className="loading-state">Loading beautiful blooms...</div>;

  return (
    <div className="container catalog-page animate-fade-in">
      <div className="catalog-header">
        <h2>Our Collection</h2>
        <div className="category-filters">
          {categories.map(cat => (
            <button 
              key={cat} 
              className={`filter-btn ${filter === cat ? 'active' : ''}`}
              onClick={() => setFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="product-grid">
        {filteredProducts.map(product => (
          <div key={product.id} className="product-card card">
            <div className="product-image-container">
              {product.image_url ? (
                <img src={`http://localhost:8000${product.image_url}`} alt={product.name} className="product-image" />
              ) : (
                <div className="product-placeholder"></div>
              )}
              {product.stock_quantity < 5 && product.stock_quantity > 0 && (
                <span className="stock-badge warning">Low Stock</span>
              )}
              {product.stock_quantity === 0 && (
                <span className="stock-badge out">Out of Stock</span>
              )}
            </div>
            <div className="product-info">
              <span className="product-category">{product.category}</span>
              <h3>{product.name}</h3>
              <p className="product-price">₱{parseFloat(product.price).toFixed(2)}</p>
              <button 
                className="btn btn-outline full-width add-to-cart-btn"
                onClick={() => addToCart(product)}
                disabled={product.stock_quantity === 0}
              >
                <ShoppingBag size={18} style={{marginRight: '8px'}} />
                {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Catalog;

import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { Search, Download, FileText, ChevronDown, MoreHorizontal, MapPin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './AdminDashboard.css';

// Fix for default leaflet marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Product CRUD State
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '', description: '', price: '', stock_quantity: '', category: '', image_url: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    const fetchData = async () => {
      try {
        const [ordersRes, productsRes, ridersRes] = await Promise.all([
          api.get('/orders'),
          api.get('/admin/products'),
          api.get('/riders')
        ]);
        setOrders(ordersRes.data);
        setProducts(productsRes.data);
        setRiders(ridersRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  const handleAssignRider = async (orderId, riderId) => {
    try {
      await api.put(`/orders/${orderId}`, { rider_id: riderId });
      setOrders(orders.map(o => o.id === orderId ? { ...o, rider_id: riderId } : o));
      alert('Rider successfully assigned!');
    } catch (err) {
      alert('Failed to assign rider');
      console.error(err);
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setProductForm({ name: '', description: '', price: '', stock_quantity: '', category: '', image_url: '' });
    setShowProductModal(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      stock_quantity: product.stock_quantity,
      category: product.category || '',
      image_url: product.image_url || ''
    });
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, productForm);
      } else {
        await api.post('/products', productForm);
      }
      const res = await api.get('/admin/products');
      setProducts(res.data);
      setShowProductModal(false);
    } catch (err) {
      alert('Failed to save product');
      console.error(err);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts(products.filter(p => p.id !== id));
    } catch (err) {
      alert('Failed to delete product');
      console.error(err);
    }
  };

  const handleToggleArchive = async (product) => {
    try {
      const updatedData = { is_active: !product.is_active };
      await api.put(`/products/${product.id}`, updatedData);
      setProducts(products.map(p => p.id === product.id ? { ...p, is_active: !product.is_active } : p));
    } catch (err) {
      alert('Failed to update product status');
      console.error(err);
    }
  };

  if (!user || user.role !== 'admin') return null;
  if (loading) return <div className="loading-state">Loading Admin Dashboard...</div>;

  // Calculate Analytics Data
  const totalSalesCount = orders.length;
  const totalSalesRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0);
  const totalVolume = orders.reduce((sum, o) => sum + (o.items ? o.items.reduce((acc, item) => acc + item.quantity, 0) : 0), 0);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyRevenue = {};
  orders.forEach(o => {
    const d = new Date(o.created_at);
    const m = months[d.getMonth()];
    if (!monthlyRevenue[m]) monthlyRevenue[m] = 0;
    monthlyRevenue[m] += parseFloat(o.total_amount);
  });

  const currentMonthIdx = new Date().getMonth();
  const barData = [];
  for (let i = 4; i >= 0; i--) {
    let mIdx = currentMonthIdx - i;
    if (mIdx < 0) mIdx += 12;
    const mName = months[mIdx];
    barData.push({
      name: mName,
      revenue: monthlyRevenue[mName] || 0,
      profit: (monthlyRevenue[mName] || 0) * 0.3
    });
  }

  const productMap = {};
  products.forEach(p => productMap[p.id] = p);
  
  const categorySales = {};
  const productVolume = {};
  orders.forEach(o => {
    if (!o.items) return;
    o.items.forEach(item => {
      const product = productMap[item.product_id];
      const category = product ? product.category : 'Other';
      if (!categorySales[category]) categorySales[category] = 0;
      categorySales[category] += (item.quantity * parseFloat(item.price));
      
      if (!productVolume[item.product_id]) productVolume[item.product_id] = 0;
      productVolume[item.product_id] += item.quantity;
    });
  });

  const pieData = Object.keys(categorySales).map(cat => ({
    name: cat,
    value: categorySales[cat]
  }));
  if (pieData.length === 0) pieData.push({ name: 'None', value: 1 });
  
  let topProductId = null;
  let maxSold = 0;
  Object.keys(productVolume).forEach(pid => {
    if (productVolume[pid] > maxSold) {
      maxSold = productVolume[pid];
      topProductId = pid;
    }
  });
  const topProduct = productMap[topProductId] || products[0] || { name: 'No Products', stock_quantity: 0, price: 0 };

  const COLORS = ['#F8BBD0', '#F48FB1', '#C20E4D', '#1A1A1A', '#A00B3E', '#FF80AB'];

  const miniBarData = [
    { name: 'Tue', value: Math.floor(maxSold * 0.2) || 0 },
    { name: 'Wed', value: Math.floor(maxSold * 0.4) || 0 },
    { name: 'Thu', value: maxSold || 0 },
    { name: 'Fri', value: Math.floor(maxSold * 0.3) || 0 },
  ];

  return (
    <div className="admin-wrapper animate-fade-in">
      {/* Top Nav (Specific to Mockup) */}
      <div className="admin-top-nav">
        <div className="admin-brand">
          <span className="brand-icon">V</span> Velvet & Vine
        </div>
        <div className="admin-nav-links">
          <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}><span className="nav-icon">⊞</span> Dashboard</button>
          <button className={`nav-item ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}><span className="nav-icon">◈</span> Inventory</button>
          <button className="nav-item"><span className="nav-icon">📦</span> Purchases</button>
          <button className="nav-item"><span className="nav-icon">👥</span> Customers</button>
          <button className="nav-item"><span className="nav-icon">📈</span> Analytics</button>
          <button className="nav-item"><span className="nav-icon">⚙️</span> Settings</button>
        </div>
        <div className="admin-user-profile">
          <div className="admin-avatar"></div>
          <span className="admin-name">{user.name}</span>
          <ChevronDown size={16} />
        </div>
      </div>

      <div className="admin-main-content">
        {/* Header */}
        <div className="admin-header-row">
          <h1>{activeTab === 'dashboard' ? 'Dashboard' : 'Inventory Management'}</h1>
          <div className="admin-header-actions">
            <div className="search-bar">
              <Search size={18} className="text-muted" />
              <input type="text" placeholder="Search product..." />
            </div>
            <button className="btn-outline-admin"><FileText size={16} /> Export CSV</button>
            <button className="btn-outline-admin"><Download size={16} /> Download Report</button>
          </div>
        </div>

        {activeTab === 'dashboard' ? (
          <>
            {/* Top Widgets Grid */}
            <div className="admin-grid-top">
              
              {/* Left Column KPIs */}
              <div className="kpi-column">
                <div className="admin-card kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-title">Total Products Sales</span>
                  </div>
                  <div className="kpi-value-row">
                    <h2>{totalSalesCount.toLocaleString()}</h2>
                    <span className="badge badge-success">+10% ↗</span>
                    <div className="kpi-icon"><span className="icon-graph">📈</span></div>
                  </div>
                  <div className="kpi-footer">
                    <span>View Sales Details</span>
                    <span>→</span>
                  </div>
                </div>

                <div className="admin-card kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-title">Total Volume Of Products</span>
                  </div>
                  <div className="kpi-value-row">
                    <h2>{totalVolume.toLocaleString()}</h2>
                    <span className="badge badge-danger">-12% ↘</span>
                    <div className="kpi-icon"><span className="icon-store">🏪</span></div>
                  </div>
                  <div className="kpi-footer">
                    <span>View All Products</span>
                    <span>→</span>
                  </div>
                </div>
              </div>

              {/* Middle Column Bar Chart */}
              <div className="admin-card chart-card">
                <div className="chart-header">
                  <span className="kpi-title">Total Products Sales</span>
                  <button className="btn-dots"><MoreHorizontal size={20}/></button>
                </div>
                <div className="kpi-value-row" style={{marginBottom: '1rem'}}>
                  <h2>₱{totalSalesRevenue.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</h2>
                  <span className="badge badge-success">+45% ↗</span>
                </div>
                <div className="chart-legend">
                  <span className="legend-item"><span className="dot dot-dark"></span> Total Revenue</span>
                  <span className="legend-item"><span className="dot dot-light"></span> Total Profit</span>
                </div>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{top: 0, right: 0, left: -25, bottom: 0}}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} />
                      <RechartsTooltip cursor={{fill: 'transparent'}} />
                      <Bar dataKey="profit" stackId="a" fill="#F8BBD0" radius={[0, 0, 8, 8]} />
                      <Bar dataKey="revenue" stackId="a" fill="#1A1A1A" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Right Column Donut Chart */}
              <div className="admin-card chart-card">
                <div className="chart-header" style={{marginBottom: 0}}>
                  <span className="kpi-title">Total Sales Statistics</span>
                  <button className="btn-outline-admin small">Monthly ⏷</button>
                </div>
                
                <div className="donut-container">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="donut-center-text">
                    <h3>23,324</h3>
                    <span className="badge badge-success small">+45% ↗</span>
                  </div>
                </div>

                <div className="donut-legend">
                  {pieData.map((entry, index) => (
                    <div key={index} className={`donut-legend-item ${index % 2 !== 0 ? 'right-align' : ''}`}>
                      <span className="dot" style={{background: COLORS[index % COLORS.length]}}></span>
                      <div>
                        <div className="legend-name">{entry.name}</div>
                        <div className="legend-value">₱{entry.value.toLocaleString(undefined, {minimumFractionDigits:0, maximumFractionDigits:0})}</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="donut-footer">
                  <span className="kpi-title">Total Number of Sales</span>
                  <h2>{totalSalesCount.toLocaleString()}</h2>
                </div>
              </div>

            </div>

            {/* Bottom Widgets Grid */}
            <div className="admin-grid-bottom">
              
              {/* Recent Orders Table */}
              <div className="admin-card orders-table-card">
                <div className="chart-header">
                  <div>
                    <h2>Recent Orders</h2>
                    <p className="text-muted" style={{fontSize: '0.85rem', marginTop: '4px'}}>Keep track of recent order data and others information</p>
                  </div>
                  <button className="btn-outline-admin small">View All →</button>
                </div>
                
                <div className="table-responsive">
                  <table className="custom-admin-table">
                    <thead>
                      <tr>
                        <th>Order id</th>
                        <th>Product Name</th>
                        <th>Date</th>
                        <th>Payment</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 5).map((order, idx) => (
                        <tr key={order.id || idx}>
                          <td className="fw-bold">#{202523 - idx}</td>
                          <td>
                            <div className="table-product">
                              <div className="table-product-icon"></div>
                              {order.items && order.items[0] && order.items[0].product ? order.items[0].product.name : 'Velvet Bouquet'}
                            </div>
                          </td>
                          <td>{order.created_at ? new Date(order.created_at).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'}) : '28 Mar 2025'}</td>
                          <td>{idx % 2 === 0 ? 'Mastercard' : (idx % 3 === 0 ? 'Visa' : 'Paypal')}</td>
                          <td className="fw-bold">₱{parseFloat(order.total_amount || 1230).toFixed(2)}</td>
                          <td>
                            <span className={`status-badge ${idx % 3 === 0 ? 'in-progress' : (idx % 2 === 0 ? 'complete' : 'waiting')}`}>
                              {idx % 3 === 0 ? 'In Progress' : (idx % 2 === 0 ? 'Complete' : 'Waiting')}
                            </span>
                          </td>
                          <td>
                            <button className="btn-outline-admin small" onClick={() => setSelectedOrder(order)}>
                              <MapPin size={14} style={{marginRight: '4px', verticalAlign: 'middle'}}/> View & Assign
                            </button>
                          </td>
                        </tr>
                      ))}
                      {/* Fill empty rows if needed to match mockup height */}
                      {orders.length === 0 && (
                         <tr>
                          <td className="fw-bold">#202523</td>
                          <td>
                            <div className="table-product">
                              <div className="table-product-icon" style={{background: '#E8F5E9'}}></div>
                              Airpods Pro Max
                            </div>
                          </td>
                          <td>28 Mar 2025</td>
                          <td>Mastercard</td>
                          <td className="fw-bold">₱1,230.00</td>
                          <td><span className="status-badge in-progress">In Progress</span></td>
                          <td><button className="btn-outline-admin small">View & Assign</button></td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top Selling Products */}
              <div className="admin-card top-selling-card">
                <div className="chart-header">
                  <h2>Top Selling Products</h2>
                  <button className="btn-outline-admin small">Monthly ⏷</button>
                </div>
                
                <div className="top-product-item">
                  <div className="product-thumb"></div>
                  <div className="product-info-compact">
                    <h4>{topProduct.name}</h4>
                    <div className="product-meta">
                      <span className="brand">Category: <strong>{topProduct.category || 'Velvet'}</strong></span>
                      <span className="stock">{topProduct.stock_quantity} Stock Available</span>
                    </div>
                    <div className="price">₱{parseFloat(topProduct.price).toFixed(2)}</div>
                  </div>
                  <button className="btn-dots"><MoreHorizontal size={16}/></button>
                </div>
                
                <div className="mini-chart-container">
                   <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={miniBarData} margin={{top: 20, right: 0, left: -40, bottom: 0}}>
                      <YAxis axisLine={false} tickLine={false} tick={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} dy={5}/>
                      <Bar dataKey="value" fill="#E0E0E0" radius={[4, 4, 0, 0]} maxBarSize={30}>
                        {miniBarData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 2 ? '#C20E4D' : '#F5F5F5'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mini-chart-labels">
                    {miniBarData.map((d, i) => (
                      <div key={i} className={`mini-label ${i === 2 ? 'active' : ''}`} style={{left: `${(i * 25) + 12}%`}}>
                        {d.value}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </>
        ) : (
          <div className="admin-card inventory-card">
            <div className="chart-header" style={{marginBottom: '1.5rem'}}>
              <div>
                <h2>Product Inventory Tracker</h2>
                <p className="text-muted" style={{fontSize: '0.85rem', marginTop: '4px'}}>Monitor stock levels and identify products running low on stock</p>
              </div>
              <button onClick={handleAddProduct} className="btn-outline-admin" style={{background: '#C20E4D', color: 'white', border: 'none'}}>+ Add Product</button>
            </div>
            
            <div className="table-responsive">
              <table className="custom-admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock Quantity</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const isLowStock = product.stock_quantity <= 10;
                    const isOutOfStock = product.stock_quantity === 0;
                    return (
                      <tr key={product.id}>
                        <td className="fw-bold">#{product.id}</td>
                        <td>
                          <div className="table-product">
                            <div className="table-product-icon"></div>
                            {product.name}
                          </div>
                        </td>
                        <td>{product.category}</td>
                        <td className="fw-bold">₱{parseFloat(product.price).toFixed(2)}</td>
                        <td>
                          <span style={{color: isOutOfStock ? '#C62828' : (isLowStock ? '#E65100' : 'inherit'), fontWeight: isLowStock ? 'bold' : 'normal'}}>
                            {product.stock_quantity} units
                          </span>
                        </td>
                        <td>
                        {isOutOfStock && product.is_active ? (
                          <span className="status-badge waiting" style={{background: '#FFEBEE', color: '#C62828'}}>Out of Stock</span>
                        ) : !product.is_active ? (
                          <span className="status-badge" style={{background: '#E0E0E0', color: '#757575'}}>Archived</span>
                        ) : isLowStock ? (
                          <span className="status-badge waiting">Low Stock</span>
                        ) : (
                          <span className="status-badge complete">In Stock</span>
                        )}
                      </td>
                      <td className="action-cell">
                        <button onClick={() => handleEditProduct(product)} className="btn-icon" title="Edit">✏️</button>
                        <button onClick={() => handleToggleArchive(product)} className="btn-icon" title={product.is_active ? 'Archive' : 'Unarchive'}>
                          {product.is_active ? '📦' : '✅'}
                        </button>
                        <button onClick={() => handleDeleteProduct(product.id)} className="btn-icon text-danger" title="Delete">🗑️</button>
                      </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {showProductModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
            <form onSubmit={handleSaveProduct} className="admin-form">
              <div className="form-group">
                <label>Product Name</label>
                <input type="text" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Price</label>
                  <input type="number" step="0.01" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Stock Quantity</label>
                  <input type="number" value={productForm.stock_quantity} onChange={e => setProductForm({...productForm, stock_quantity: e.target.value})} required />
                </div>
              </div>
              <div className="form-group">
                <label>Category</label>
                <input type="text" value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Image URL</label>
                <input type="text" value={productForm.image_url} onChange={e => setProductForm({...productForm, image_url: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows="3" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})}></textarea>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowProductModal(false)} className="btn-outline-admin">Cancel</button>
                <button type="submit" className="btn-admin-primary">{editingProduct ? 'Update Product' : 'Save Product'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{maxWidth: '600px'}}>
            <h2>Order #{selectedOrder.id} Location</h2>
            
            <div className="form-group" style={{marginBottom: '1.5rem'}}>
              <label>Delivery Address</label>
              <p style={{background: '#F5F5F5', padding: '10px', borderRadius: '6px', fontSize: '0.9rem'}}>{selectedOrder.shipping_address}</p>
            </div>

            <div className="form-group" style={{marginBottom: '1.5rem'}}>
              <label>Order Items</label>
              <div style={{background: '#F5F5F5', padding: '10px', borderRadius: '6px', fontSize: '0.9rem', maxHeight: '150px', overflowY: 'auto'}}>
                {selectedOrder.items && selectedOrder.items.map(item => (
                  <div key={item.id} style={{marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #E0E0E0'}}>
                    <strong>{item.quantity}x {item.product ? item.product.name : 'Unknown Product'}</strong>
                    {item.custom_details && (
                      <div style={{marginTop: '4px', paddingLeft: '10px', color: '#555', fontSize: '0.85rem'}}>
                        <div><em>Flowers:</em> {item.custom_details.flowers?.map(f => `${f.quantity}x ${f.name}`).join(', ')}</div>
                        <div><em>Wrapper:</em> {item.custom_details.wrapper?.name}</div>
                        <div><em>Ribbon:</em> {item.custom_details.ribbon?.name}</div>
                        {item.custom_details.addons && item.custom_details.addons.length > 0 && (
                          <div><em>Add-ons:</em> {item.custom_details.addons.map(a => a.name).join(', ')}</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ height: '300px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #E0E0E0', marginBottom: '1.5rem' }}>
              {(selectedOrder.latitude && selectedOrder.longitude) ? (
                <MapContainer center={[selectedOrder.latitude, selectedOrder.longitude]} zoom={15} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <Marker position={[selectedOrder.latitude, selectedOrder.longitude]} />
                </MapContainer>
              ) : (
                <div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5'}}>
                  <p className="text-muted">No specific GPS coordinates provided for this order.</p>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Assign Delivery Rider</label>
              <select 
                className="input-field" 
                style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E0E0E0'}}
                value={selectedOrder.rider_id || ''}
                onChange={(e) => {
                  const newRiderId = e.target.value;
                  setSelectedOrder({...selectedOrder, rider_id: newRiderId});
                  handleAssignRider(selectedOrder.id, newRiderId);
                }}
              >
                <option value="">-- Unassigned --</option>
                {riders.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            <div className="modal-actions">
              <button type="button" onClick={() => setSelectedOrder(null)} className="btn-outline-admin">Close</button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
};

export default AdminDashboard;

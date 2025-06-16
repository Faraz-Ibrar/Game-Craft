import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import axios from 'axios';
import './AdminDashboard.css';

// Set base URL for axios
axios.defaults.baseURL = 'http://localhost:5000';

export default function AdminPage() {
  const { user, isAuthenticated, getAuthToken } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Data states
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [checkouts, setCheckouts] = useState([]);
  const [carts, setCarts] = useState([]);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // New product form state
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category: '',
    brand: '',
    specifications: '',
    image: ''
  });
  const [showProductForm, setShowProductForm] = useState(false);

  // Fetch all data
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') return;

    const fetchAllData = async () => {
      try {
        setLoading(true);
        setError('');
        
        const token = getAuthToken();
        if (!token) throw new Error('No authentication token');

        const headers = { Authorization: `Bearer ${token}` };

        // Fetch all data in parallel
        const [usersRes, productsRes, checkoutsRes, cartsRes] = await Promise.all([
          axios.get('/api/users', { headers }),
          axios.get('/api/products', { headers }),
          axios.get('/api/checkout/admin/all', { headers }),
          axios.get('/api/cart/admin/all', { headers })
        ]);

        setUsers(usersRes.data);
        setProducts(productsRes.data);
        setCheckouts(checkoutsRes.data.data || checkoutsRes.data);
        setCarts(cartsRes.data);
        
      } catch (err) {
        console.error('Error fetching admin data:', err);
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [isAuthenticated, user, getAuthToken]);

  // Filter functions
  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.brand?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCheckouts = checkouts.filter(checkout => {
    const matchesSearch = 
      checkout.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      checkout.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || checkout.orderStatus === statusFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const checkoutDate = new Date(checkout.createdAt);
      const today = new Date();
      const daysDiff = Math.floor((today - checkoutDate) / (1000 * 60 * 60 * 24));
      
      switch (dateFilter) {
        case 'today': matchesDate = daysDiff === 0; break;
        case 'week': matchesDate = daysDiff <= 7; break;
        case 'month': matchesDate = daysDiff <= 30; break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const filteredCarts = carts.filter(cart =>
    cart.userId?.toString().includes(searchTerm.toLowerCase())
  );

  // Statistics
  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    totalProducts: products.length,
    totalRevenue: checkouts.reduce((sum, c) => sum + (c.finalAmount || 0), 0),
    pendingOrders: checkouts.filter(c => c.orderStatus === 'pending').length,
    activeCarts: carts.filter(c => c.items?.length > 0).length
  };

  // CRUD Operations
  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const token = getAuthToken();
      await axios.delete(`/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(users.filter(u => u._id !== userId));
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err.response?.data?.message || err.message);
    }
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const token = getAuthToken();
      await axios.delete(`/api/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(products.filter(p => p._id !== productId));
    } catch (err) {
      console.error('Error deleting product:', err);
      setError(err.response?.data?.message || err.message);
    }
  };

  const deleteCart = async (cartId) => {
    if (!window.confirm('Are you sure you want to delete this cart?')) return;
    
    try {
      const token = getAuthToken();
      await axios.delete(`/api/cart/${cartId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCarts(carts.filter(c => c._id !== cartId));
    } catch (err) {
      console.error('Error deleting cart:', err);
      setError(err.response?.data?.message || err.message);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = getAuthToken();
      const response = await axios.patch(
        `/api/checkout/${orderId}/status`,
        { orderStatus: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setCheckouts(checkouts.map(c => 
        c._id === orderId ? response.data.data : c
      ));
    } catch (err) {
      console.error('Error updating order status:', err);
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleProductInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const token = getAuthToken();
      const response = await axios.post('/api/products', newProduct, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setProducts([...products, response.data]);
      setNewProduct({
        name: '',
        price: '',
        category: '',
        brand: '',
        specifications: '',
        image: ''
      });
      setShowProductForm(false);
    } catch (err) {
      console.error('Error adding product:', err);
      setError(err.response?.data?.message || err.message);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-container">
        <div className="access-denied">
          <h2>🔒 Access Denied</h2>
          <p>Please login to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="admin-container">
        <div className="access-denied">
          <h2>⛔ Admin Access Required</h2>
          <p>You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {error && (
        <div className="admin-error">
          Error: {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      <div className="admin-header">
        <div className="admin-title">
          <h1>🛠️ Admin Dashboard</h1>
          <p>Welcome back, {user?.name}</p>
        </div>
        <div className="admin-stats">
          <div className="stat-card">
            <span className="stat-value">{stats.totalUsers}</span>
            <span className="stat-label">Total Users</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">Rs. {stats.totalRevenue.toLocaleString()}</span>
            <span className="stat-label">Revenue</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.pendingOrders}</span>
            <span className="stat-label">Pending Orders</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.activeCarts}</span>
            <span className="stat-label">Active Carts</span>
          </div>
        </div>
      </div>

      <div className="admin-tabs">
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Users ({stats.totalUsers})
        </button>
        <button
          className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          📦 Products ({stats.totalProducts})
        </button>
        <button
          className={`tab-btn ${activeTab === 'checkouts' ? 'active' : ''}`}
          onClick={() => setActiveTab('checkouts')}
        >
          🛒 Orders ({checkouts.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'carts' ? 'active' : ''}`}
          onClick={() => setActiveTab('carts')}
        >
          🛍️ Carts ({carts.length})
        </button>
      </div>

      <div className="admin-filters">
        <div className="search-bar">
          <input
            type="text"
            placeholder="🔍 Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {activeTab === 'checkouts' && (
          <>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </>
        )}
      </div>

      {activeTab === 'products' && (
        <div className="admin-actions">
          <button 
            className="add-product-btn"
            onClick={() => setShowProductForm(!showProductForm)}
          >
            {showProductForm ? 'Cancel' : '+ Add Product'}
          </button>
        </div>
      )}

      {showProductForm && (
        <div className="product-form">
          <h3>Add New Product</h3>
          <form onSubmit={handleAddProduct}>
            <div className="form-group">
              <label>Name:</label>
              <input
                type="text"
                name="name"
                value={newProduct.name}
                onChange={handleProductInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Price:</label>
              <input
                type="number"
                name="price"
                value={newProduct.price}
                onChange={handleProductInputChange}
                required
                step="0.01"
              />
            </div>
            <div className="form-group">
              <label>Category:</label>
              <input
                type="text"
                name="category"
                value={newProduct.category}
                onChange={handleProductInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Brand:</label>
              <input
                type="text"
                name="brand"
                value={newProduct.brand}
                onChange={handleProductInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Image URL:</label>
              <input
                type="text"
                name="image"
                value={newProduct.image}
                onChange={handleProductInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Specifications:</label>
              <textarea
                name="specifications"
                value={newProduct.specifications}
                onChange={handleProductInputChange}
              />
            </div>
            <button type="submit" className="submit-btn">
              Add Product
            </button>
          </form>
        </div>
      )}

      <div className="admin-content">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner">⏳</div>
            <p>Loading data...</p>
          </div>
        ) : (
          <>
            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="users-section">
                <div className="section-header">
                  <h2>User Management</h2>
                  <div className="user-stats">
                    <span className="badge success">Active: {stats.activeUsers}</span>
                    <span className="badge warning">Inactive: {stats.totalUsers - stats.activeUsers}</span>
                  </div>
                </div>
                
                <div className="data-table">
                  <table>
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(user => (
                        <tr key={user._id}>
                          <td>
                            <div className="user-info">
                              <div className="user-avatar">
                                {user.name?.charAt(0).toUpperCase()}
                              </div>
                              <div className="user-details">
                                <strong>{user.name}</strong>
                                <small>Joined: {new Date(user.createdAt).toLocaleDateString()}</small>
                              </div>
                            </div>
                          </td>
                          <td>{user.email}</td>
                          <td>{user.role || 'customer'}</td>
                          <td>
                            <span className={`status-badge ${user.status || 'active'}`}>
                              {user.status || 'active'}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button className="btn-sm view">👁️</button>
                              <button className="btn-sm edit">✏️</button>
                              <button 
                                className="btn-sm delete"
                                onClick={() => deleteUser(user._id)}
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Products Tab */}
            {activeTab === 'products' && (
              <div className="products-section">
                <div className="section-header">
                  <h2>Product Management</h2>
                </div>
                
                <div className="products-grid">
                  {filteredProducts.map(product => (
                    <div key={product._id} className="product-card">
                      <div className="product-image">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          onError={(e) => {
                            e.target.src = '/placeholder-product.jpg';
                          }}
                        />
                      </div>
                      <div className="product-details">
                        <h3>{product.name}</h3>
                        <p className="brand">{product.brand}</p>
                        <p className="category">{product.category}</p>
                        <p className="price">Rs. {product.price?.toLocaleString()}</p>
                        {product.specifications && (
                          <p className="specs">
                            {product.specifications.length > 50 
                              ? `${product.specifications.substring(0, 50)}...` 
                              : product.specifications}
                          </p>
                        )}
                      </div>
                      <div className="product-actions">
                        <button className="btn-sm edit">✏️ Edit</button>
                        <button 
                          className="btn-sm delete"
                          onClick={() => deleteProduct(product._id)}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Checkouts Tab */}
            {activeTab === 'checkouts' && (
              <div className="checkouts-section">
                <div className="section-header">
                  <h2>Order Management</h2>
                  <div className="checkout-stats">
                    <span className="badge success">Completed: {checkouts.filter(c => c.orderStatus === 'delivered').length}</span>
                    <span className="badge warning">Pending: {checkouts.filter(c => c.orderStatus === 'pending').length}</span>
                  </div>
                </div>
                
                <div className="data-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Order #</th>
                        <th>Customer</th>
                        <th>Amount</th>
                        <th>Items</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCheckouts.map(checkout => (
                        <tr key={checkout._id}>
                          <td><strong>{checkout.orderNumber}</strong></td>
                          <td>
                            <div className="customer-info">
                              <strong>{checkout.customerName}</strong>
                              <small>{checkout.customerPhone}</small>
                            </div>
                          </td>
                          <td>Rs. {checkout.finalAmount?.toLocaleString()}</td>
                          <td>{checkout.cartItems?.length || 0} items</td>
                          <td>{new Date(checkout.createdAt).toLocaleDateString()}</td>
                          <td>
                            <select
                              value={checkout.orderStatus}
                              onChange={(e) => updateOrderStatus(checkout._id, e.target.value)}
                              className={`status-select ${checkout.orderStatus}`}
                            >
                              <option value="pending">Pending</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button className="btn-sm view">👁️ View</button>
                              <button className="btn-sm print">🖨️ Invoice</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Carts Tab */}
            {activeTab === 'carts' && (
              <div className="carts-section">
                <div className="section-header">
                  <h2>All Carts</h2>
                </div>
                
                <div className="data-table">
                  <table>
                    <thead>
                      <tr>
                        <th>User ID</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Last Updated</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCarts.map(cart => (
                        <tr key={cart._id}>
                          <td>{cart.userId}</td>
                          <td>{cart.items?.length || 0} items</td>
                          <td>
                            Rs. {cart.items?.reduce((sum, item) => sum + (item.totalPrice || 0), 0).toLocaleString()}
                          </td>
                          <td>{new Date(cart.updatedAt).toLocaleDateString()}</td>
                          <td>
                            <div className="action-buttons">
                              <button className="btn-sm view">👁️ View</button>
                              <button 
                                className="btn-sm delete"
                                onClick={() => deleteCart(cart._id)}
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
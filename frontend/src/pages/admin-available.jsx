import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './admin-available.css';

export default function AdminLaptopManager() {
  const [laptops, setLaptops] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'admin') {
      navigate(role ? '/' : '/login');
      return;
    }

    // Initial fetch
    fetchLaptops();

    // Set up polling for real-time updates
    const interval = setInterval(() => {
      fetchLaptops();
    }, 3000); // Update every 3 seconds

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [navigate]);

  const fetchLaptops = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/laptops', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setLaptops(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch laptops:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this laptop?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/laptops/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');

      // ✅ Update UI immediately
      setLaptops(prev => prev.filter(l => l._id !== id));
      alert(data.message || 'Laptop deleted');
    } catch (err) {
      alert('Failed to delete laptop');
      console.error(err);
    }
  };

  return (
    <div className="admin-laptop-container">
      <h1 className="admin-laptop-header">📦 Manage Laptops</h1>

      {/* Laptop List */}
      {loading ? (
        <p className="loading-text">Loading laptops...</p>
      ) : laptops.length === 0 ? (
        <p className="no-data-text">No laptops found.</p>
      ) : (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Laptop</th>
                <th>Status</th>
                <th>Price</th>
                <th>Features</th>
                <th>Size</th>
                <th>Subscription</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {laptops.map((laptop) => (
                <tr key={laptop._id}>
                  <td>
                    <span className="laptop-name">{laptop.brand} {laptop.model}</span>
                  </td>
                  <td>
                    <span className={`status-badge ${laptop.status === 'Available' ? 'status-available' : 'status-outofstock'}`}>
                      {laptop.status || 'Available'}
                    </span>
                  </td>
                  <td className="price-cell">
                    KES {laptop.price}
                  </td>
                  <td className="features-cell">
                    {laptop.features}
                  </td>
                  <td>
                    {laptop.size}
                  </td>
                  <td>
                    {laptop.subscriptionType}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => handleDelete(laptop._id)}
                      className="delete-btn"
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

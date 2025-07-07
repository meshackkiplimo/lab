import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminLaptopManager() {
  const [laptops, setLaptops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    brand: '',
    model: '',
    size: '',
    subscriptionType: '',
    price: '',
    features: '',
    image: ''
  });
  const [editId, setEditId] = useState(null);
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

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = editId
      ? `http://localhost:5000/api/laptops/${editId}`
      : 'http://localhost:5000/api/laptops';
    const method = editId ? 'PUT' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Operation failed');

      alert(data.message || 'Success');
      setForm({
        brand: '',
        model: '',
        size: '',
        subscriptionType: '',
        price: '',
        features: '',
        image: '',
      });
      setEditId(null);
      fetchLaptops(); // Refresh the list
    } catch (error) {
      alert(error.message);
    }
  };

  const handleEdit = (laptop) => {
    setForm({
      brand: laptop.brand,
      model: laptop.model,
      size: laptop.size,
      subscriptionType: laptop.subscriptionType,
      price: laptop.price,
      features: laptop.features,
      image: laptop.image,
    });
    setEditId(laptop._id);
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
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>📦 Admin Laptop Manager</h1>

      {/* Form Section */}
      <form onSubmit={handleSubmit} style={{ background: '#f1f5f9', padding: '1rem', borderRadius: 8, marginBottom: '2rem' }}>
        <h3>{editId ? '✏️ Edit Laptop' : '➕ Add New Laptop'}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {['brand', 'model', 'size', 'subscriptionType', 'price', 'features', 'image'].map((field) => (
            <input
              key={field}
              type="text"
              name={field}
              placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
              value={form[field]}
              onChange={handleInputChange}
              required
              style={{ padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc' }}
            />
          ))}
          <button type="submit" style={{ padding: '0.7rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: 6 }}>
            {editId ? 'Update Laptop' : 'Add Laptop'}
          </button>
        </div>
      </form>

      {/* Laptop List */}
      {loading ? (
        <p>Loading laptops...</p>
      ) : laptops.length === 0 ? (
        <p>No laptops found.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {laptops.map((laptop) => (
            <div
              key={laptop._id}
              style={{
                background: '#fff',
                padding: '1rem',
                borderRadius: 8,
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ flex: 1 }}>
                <h4>{laptop.brand} {laptop.model}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      backgroundColor: laptop.status === 'Available' ? '#dcfce7' : '#fee2e2',
                      color: laptop.status === 'Available' ? '#16a34a' : '#dc2626',
                    }}
                  >
                    {laptop.status || 'Available'}
                  </span>
                </div>
                <p>🧩 Features: {laptop.features}</p>
                <p>💰 KES {laptop.price} | 💼 {laptop.subscriptionType} | 🖥️ {laptop.size}</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => handleEdit(laptop)} style={{ background: '#0ea5e9', color: '#fff', border: 'none', padding: '0.5rem', borderRadius: 4 }}>Edit</button>
                <button onClick={() => handleDelete(laptop._id)} style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '0.5rem', borderRadius: 4 }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

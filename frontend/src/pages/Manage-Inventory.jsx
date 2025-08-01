import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Apidomain } from '../utils/ApiDomain';

const ManageInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchApplications = async () => {
    try {
      // Get applications
      const res = await axios.get(`${Apidomain}/applications`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      
      let paymentsData = [];
      try {
        const paymentsRes = await axios.get(`${Apidomain}/mpesa/payments`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        paymentsData = paymentsRes.data;
        console.log('📥 Raw payments:', paymentsData);
      } catch (err) {
        console.error('Error fetching payments:', err);
        paymentsData = [];
      }

      const applications = res.data.applications;

      // Process each application
      const formatted = applications.map((app) => {
        // Get payments for this laptop
        const laptopPayments = paymentsData
          .filter(p => String(p.laptopId?._id) === String(app.laptop?._id))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const laptopPrice = Number(app.laptop?.price || 0);
        
        // Calculate total paid for this laptop
        const totalPaid = laptopPayments.reduce((sum, p) => {
          const amount = Number(p.amount || 0);
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);

        console.log(`💰 Laptop: ${app.laptop?.model}`, {
          price: laptopPrice,
          paid: totalPaid,
          remaining: Math.max(0, laptopPrice - totalPaid),
          payments: laptopPayments.map(p => ({
            id: p._id,
            amount: p.amount,
            date: new Date(p.createdAt).toLocaleString()
          }))
        });

        return {
          id: app._id,
          name: `${app.student?.firstName || ''} ${app.student?.lastName || ''}`.trim(),
          email: app.student?.email,
          year: app.year || '1st Year',
          laptopBrand: `${app.laptop?.brand || ''} ${app.laptop?.model || ''}`.trim(),
          applicationStatus: app.status || 'Pending',
          laptopPrice: laptopPrice,
          laptopId: app.laptop?._id,
          amountPaid: totalPaid,
          remainingBalance: Math.max(0, laptopPrice - totalPaid)
        };
      });

      setInventory(formatted);
      setFilteredInventory(formatted);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
    // Set up refresh interval
    const refreshInterval = setInterval(() => {
      fetchApplications();
    }, 10000); // Refresh every 10 seconds

    // Cleanup on unmount
    return () => clearInterval(refreshInterval);
  }, []);

  // Filter inventory based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredInventory(inventory);
    } else {
      const filtered = inventory.filter(item => {
        const searchLower = searchTerm.toLowerCase();
        const firstName = item.name.split(' ')[0]?.toLowerCase() || '';
        const fullName = item.name.toLowerCase();
        const laptopBrand = item.laptopBrand.toLowerCase();
        
        return firstName.includes(searchLower) ||
               fullName.includes(searchLower) ||
               laptopBrand.includes(searchLower);
      });
      setFilteredInventory(filtered);
    }
  }, [searchTerm, inventory]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`${Apidomain}/applications/${id}/status`, { status }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      fetchApplications();
    } catch (error) {
      console.error('❌ Failed to update status:', error);
    }
  };

  const deleteApplication = async (id) => {
    if (!window.confirm('Are you sure you want to delete this application?')) return;

    try {
      await axios.delete(`${Apidomain}/applications/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      fetchApplications();
    } catch (error) {
      console.error('❌ Failed to delete application:', error);
    }
  };

  // Calculate totals based on filtered inventory
  let totalPaid = 0, totalExpected = 0, totalRemaining = 0;

  filteredInventory.forEach(item => {
    const paid = Number(item.amountPaid || 0);
    const price = Number(item.laptopPrice || 0);
    const remaining = Math.max(0, price - paid);

    console.log(`📊 ${item.laptopBrand}:`, { price, paid, remaining });

    totalPaid += paid;
    totalExpected += price;
    totalRemaining += remaining;
  });

  console.log('💰 Totals:', { totalPaid, totalExpected, totalRemaining });

  // Styles
  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(to top right, #f8fafc, #e2e8f0)',
    padding: '40px',
    fontFamily: 'Arial, sans-serif',
  };
  
  const cardStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
    padding: '30px',
  };
  
  const headingStyle = {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '20px',
    textAlign: 'center',
    color: '#333',
  };
  
  const tableStyle = { width: '100%', borderCollapse: 'collapse' };
  
  const thStyle = {
    border: '1px solid #ccc',
    padding: '12px',
    backgroundColor: '#f3f4f6',
    textAlign: 'left',
    fontWeight: 'bold',
    color: '#222',
  };
  
  const tdStyle = {
    border: '1px solid #ddd',
    padding: '10px',
    textAlign: 'left',
    color: '#333',
  };

  const searchInputStyle = {
    width: '100%',
    maxWidth: '400px',
    padding: '12px 16px',
    fontSize: '16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s ease',
    marginBottom: '20px',
  };

  const searchContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '20px',
    gap: '10px',
  };

  return (
    <div style={containerStyle}>
      <div className="stats-cards">
        <div className="stats-card stats-amount">
          <span className="stats-icon" role="img" aria-label="Amount Paid">💰</span>
          <div>
            <div className="stats-value">KES {totalPaid.toLocaleString()}</div>
            <div className="stats-label">Total Amount Paid</div>
          </div>
        </div>

        <div className="stats-card stats-expected">
          <span className="stats-icon" role="img" aria-label="Expected">💵</span>
          <div>
            <div className="stats-value">KES {totalExpected.toLocaleString()}</div>
            <div className="stats-label">Total Expected</div>
          </div>
        </div>

        <div className="stats-card stats-remaining">
          <span className="stats-icon" role="img" aria-label="Remaining">⏳</span>
          <div>
            <div className="stats-value">KES {totalRemaining.toLocaleString()}</div>
            <div className="stats-label">Total Remaining</div>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={headingStyle}>📋 Applied Laptop Records</h2>
        
        {/* Search Input */}
        <div style={searchContainerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>🔍</span>
            <input
              type="text"
              placeholder="Search by student name or laptop brand..."
              value={searchTerm}
              onChange={handleSearchChange}
              style={{
                ...searchInputStyle,
                borderColor: searchTerm ? '#3b82f6' : '#e5e7eb',
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = searchTerm ? '#3b82f6' : '#e5e7eb'}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#374151',
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Results count */}
        {searchTerm && (
          <div style={{
            textAlign: 'center',
            marginBottom: '15px',
            color: '#6b7280',
            fontSize: '14px'
          }}>
            Found {filteredInventory.length} result{filteredInventory.length !== 1 ? 's' : ''}
            {filteredInventory.length > 0 && ` for "${searchTerm}"`}
          </div>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Year</th>
                <th style={thStyle}>Laptop</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Total Price</th>
                <th style={thStyle}>Amount Paid</th>
                <th style={thStyle}>Remaining</th>
                <th style={thStyle}>Actions</th>
                <th style={thStyle}>Progress</th>
                <th style={thStyle}>Delete</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ ...tdStyle, textAlign: 'center', padding: '20px', color: '#888' }}>
                    {loading ? 'Loading...' : searchTerm ? `No results found for "${searchTerm}"` : 'No laptop applications found.'}
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => (
                  <tr key={item.id}>
                    <td style={tdStyle}>{item.name || 'N/A'}</td>
                    <td style={tdStyle}>{item.email}</td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: '8px',
                          fontWeight: '600',
                          fontSize: '0.8rem',
                          backgroundColor: '#e0f2fe',
                          color: '#0369a1',
                          display: 'inline-block',
                          minWidth: '70px',
                          textAlign: 'center',
                        }}
                      >
                        {item.year}
                      </span>
                    </td>
                    <td style={tdStyle}>{item.laptopBrand || 'Unknown'}</td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontWeight: '600',
                          fontSize: '0.85rem',
                          backgroundColor:
                            item.applicationStatus === 'Approved'
                              ? '#d1fae5'
                              : item.applicationStatus === 'Rejected'
                              ? '#fee2e2'
                              : '#fef9c3',
                          color:
                            item.applicationStatus === 'Approved'
                              ? '#065f46'
                              : item.applicationStatus === 'Rejected'
                              ? '#991b1b'
                              : '#92400e',
                          display: 'inline-block',
                          minWidth: '80px',
                          textAlign: 'center',
                        }}
                      >
                        {item.applicationStatus}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 600, color: "#2563eb" }}>
                        KES {Number(item.laptopPrice).toLocaleString()}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 600, color: "#059669" }}>
                        KES {Number(item.amountPaid).toLocaleString()}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 600, color: "#dc2626" }}>
                        KES {Number(item.remainingBalance).toLocaleString()}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <select
                        onChange={(e) => updateStatus(item.id, e.target.value)}
                        defaultValue=""
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          fontWeight: '500',
                          border: '1px solid #ccc',
                        }}
                      >
                        <option value="" disabled>
                          -- Select Action --
                        </option>
                        <option value="Approved">✅ Approve</option>
                        <option value="Rejected">❌ Reject</option>
                      </select>
                    </td>
                    <td style={tdStyle}>
                      {(() => {
                        const ratio = item.amountPaid / item.laptopPrice;
                        const getProgressStyle = (ratio) => {
                          let backgroundColor, color;
                          if (ratio >= 1) {
                            backgroundColor = '#d1fae5';
                            color = '#065f46';
                          } else if (ratio >= 0.5) {
                            backgroundColor = '#fef9c3';
                            color = '#92400e';
                          } else {
                            backgroundColor = '#fee2e2';
                            color = '#991b1b';
                          }
                          return {
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontWeight: '600',
                            fontSize: '0.85rem',
                            backgroundColor,
                            color,
                            display: 'inline-block',
                            minWidth: '80px',
                            textAlign: 'center',
                          };
                        };
                        return (
                          <span style={getProgressStyle(ratio)}>
                            {(ratio * 100).toFixed(0)}%
                          </span>
                        );
                      })()}
                    </td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => deleteApplication(item.id)}
                        style={{
                          backgroundColor: loading ? '#9ca3af' : '#ef4444',
                          color: '#fff',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageInventory;

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Apidomain } from '../utils/ApiDomain';

const ManageInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    try {
      // Get applications
      const res = await axios.get(`${Apidomain}/applications`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      // Get payments
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
          laptopBrand: `${app.laptop?.brand || ''} ${app.laptop?.model || ''}`.trim(),
          applicationStatus: app.status || 'Pending',
          laptopPrice: laptopPrice,
          laptopId: app.laptop?._id,
          amountPaid: totalPaid,
          remainingBalance: Math.max(0, laptopPrice - totalPaid)
        };
      });

      setInventory(formatted);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

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

  // Calculate totals
  let totalPaid = 0, totalExpected = 0, totalRemaining = 0;

  inventory.forEach(item => {
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

  return (
    <div style={containerStyle}>
      <div style={{
        display: "flex",
        gap: "32px",
        marginBottom: "32px",
        justifyContent: "center",
        flexWrap: "wrap"
      }}>
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          minWidth: '280px',
          textAlign: 'center'
        }}>
          <h3 style={{ fontSize: '1.2rem', color: '#334155', marginBottom: '12px' }}>Total Amount Paid</h3>
          <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#059669' }}>
            KES {totalPaid.toLocaleString()}
          </p>
        </div>

        <div style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          minWidth: '280px',
          textAlign: 'center'
        }}>
          <h3 style={{ fontSize: '1.2rem', color: '#334155', marginBottom: '12px' }}>Total Expected</h3>
          <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#2563eb' }}>
            KES {totalExpected.toLocaleString()}
          </p>
        </div>

        <div style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          minWidth: '280px',
          textAlign: 'center'
        }}>
          <h3 style={{ fontSize: '1.2rem', color: '#334155', marginBottom: '12px' }}>Total Remaining</h3>
          <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#dc2626' }}>
            KES {totalRemaining.toLocaleString()}
          </p>
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={headingStyle}>📋 Applied Laptop Records</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Laptop</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Total Price</th>
                <th style={thStyle}>Amount Paid</th>
                <th style={thStyle}>Remaining</th>
                <th style={thStyle}>Actions</th>
                <th style={thStyle}>Delete</th>
              </tr>
            </thead>
            <tbody>
              {inventory.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ ...tdStyle, textAlign: 'center', padding: '20px', color: '#888' }}>
                    {loading ? 'Loading...' : 'No laptop applications found.'}
                  </td>
                </tr>
              ) : (
                inventory.map((item) => (
                  <tr key={item.id}>
                    <td style={tdStyle}>{item.name || 'N/A'}</td>
                    <td style={tdStyle}>{item.email}</td>
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
                      <button
                        onClick={() => deleteApplication(item.id)}
                        style={{
                          backgroundColor: '#ef4444',
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

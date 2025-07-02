import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Apidomain } from '../utils/ApiDomain';

const ManageInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    try {
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
      } catch (err) {
        console.error('Error fetching payments:', err);
        paymentsData = [];
      }

      const applications = res.data.applications;
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);

      const formatted = applications.map((app) => ({
        id: app._id,
        name: `${app.student?.firstName || ''} ${app.student?.lastName || ''}`.trim(),
        email: app.student?.email,
        laptopBrand: `${app.laptop?.brand || ''} ${app.laptop?.model || ''}`.trim(),
        applicationStatus: app.status || 'Pending',
        laptopPrice: app.laptop?.price || 0,
        laptopId: app.laptop?._id,
      }));

      setInventory(formatted);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching applications:', error);
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
      {/* Analytics Cards */}
      <div style={{
        display: "flex",
        gap: "32px",
        marginBottom: "32px",
        justifyContent: "center",
        flexWrap: "wrap"
      }}>
        {/* Amount Gained Card */}
        <div style={{
          background: "linear-gradient(120deg, #22c55e 60%, #bbf7d0 100%)",
          color: "#fff",
          borderRadius: "16px",
          boxShadow: "0 4px 24px rgba(34,197,94,0.13)",
          padding: "32px 38px",
          minWidth: "260px",
          textAlign: "center",
          fontWeight: 700,
          fontSize: "1.25rem",
          letterSpacing: "0.01em"
        }}>
          <div style={{ fontSize: "2.1rem", marginBottom: "10px" }}>💸</div>
          <div>Amount Gained</div>
          <div style={{ fontSize: "2rem", marginTop: "8px" }}>
            KES {
              payments
                .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
                .toLocaleString()
            }
          </div>
        </div>
        {/* Expected Amount Card */}
        <div style={{
          background: "linear-gradient(120deg, #2563eb 60%, #dbeafe 100%)",
          color: "#fff",
          borderRadius: "16px",
          boxShadow: "0 4px 24px rgba(37,99,235,0.13)",
          padding: "32px 38px",
          minWidth: "260px",
          textAlign: "center",
          fontWeight: 700,
          fontSize: "1.25rem",
          letterSpacing: "0.01em"
        }}>
          <div style={{ fontSize: "2.1rem", marginBottom: "10px" }}>🎯</div>
          <div>Expected Amount</div>
          <div style={{ fontSize: "2rem", marginTop: "8px" }}>
            KES {
              inventory
                .reduce((sum, item) => sum + (Number(item.laptopPrice) || 0), 0)
                .toLocaleString()
            }
          </div>
        </div>
      </div>

      {/* Applications Table */}
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
                <th style={thStyle}>Amount Gained</th>
                <th style={thStyle}>Actions</th>
                <th style={thStyle}>Delete</th>
              </tr>
            </thead>
            <tbody>
              {inventory.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ ...tdStyle, textAlign: 'center', padding: '20px', color: '#888' }}>
                    {loading ? 'Loading...' : 'No laptop applications found.'}
                  </td>
                </tr>
              ) : (
                inventory.map((item) => {
                  const laptopPayments = payments.filter(
                    (p) => String(p.laptopId) === String(item.laptopId)
                  );
                  const totalPaid = laptopPayments
                    .filter(p => Number(p.amount) > 0)
                    .reduce((sum, p) => sum + Number(p.amount), 0);
                  return (
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
                        <span style={{ fontWeight: 600, color: "#22c55e" }}>
                          KES {totalPaid.toLocaleString()}
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageInventory;

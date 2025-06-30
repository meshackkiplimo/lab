import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Apidomain } from '../utils/ApiDomain';

const ManageInventory = () => {
  const [inventory, setInventory] = useState([]);

  const fetchApplications = async () => {
    try {
      const res = await axios.get(`${Apidomain}/applications`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const applications = res.data.applications.map(app => ({
        id: app._id,
        name: app.student ? `${app.student.firstName || ''} ${app.student.lastName || ''}`.trim() : 'Unknown',
        email: app.student?.email,
        laptopBrand: `${app.laptop?.brand || ''} ${app.laptop?.model || ''}`,
        status: app.status || 'Pending',
        amountPaid: app.amountPaid || 0,
      }));

      setInventory(applications);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await axios.patch(
        `${Apidomain}/applications/${id}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      fetchApplications(); // Refresh after update
    } catch (error) {
      console.error('❌ Error updating status:', error);
    }
  };

  const containerStyle = { minHeight: '100vh', background: 'linear-gradient(to top right, #f8fafc, #e2e8f0)', padding: '40px', fontFamily: 'Arial, sans-serif' };
  const cardStyle = { maxWidth: '1200px', margin: '0 auto', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)', padding: '30px' };
  const headingStyle = { fontSize: '28px', fontWeight: 'bold', marginBottom: '20px', textAlign: 'center', color: '#333' };
  const tableStyle = { width: '100%', borderCollapse: 'collapse' };
  const thStyle = { border: '1px solid #ccc', padding: '12px', backgroundColor: '#f3f4f6', textAlign: 'left', fontWeight: 'bold', color: '#222' };
  const tdStyle = { border: '1px solid #ddd', padding: '10px', textAlign: 'left', color: '#333' };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h2 style={headingStyle}>📋 Applied Laptop Records</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Laptop</th>
                <th style={thStyle}>Amount Paid</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventory.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ ...tdStyle, textAlign: 'center', padding: '20px', color: '#888' }}>
                    No laptop applications found.
                  </td>
                </tr>
              ) : (
                inventory.map((item) => (
                  <tr key={item.id}>
                    <td style={tdStyle}>{item.name}</td>
                    <td style={tdStyle}>{item.email}</td>
                    <td style={tdStyle}>{item.laptopBrand}</td>
                    <td style={tdStyle}>KES {item.amountPaid.toLocaleString()}</td>
                    <td style={tdStyle}>{item.status}</td>
                    <td style={tdStyle}>
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          backgroundColor: '#f1f5f9',
                          border: '1px solid #cbd5e1',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approve</option>
                        <option value="Rejected">Reject</option>
                      </select>
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

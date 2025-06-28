import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ManageInventory = () => {
  const [inventory, setInventory] = useState([]);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await axios.get(
          
          '/api/applications',
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        
        );
        const applications = res.data.applications;

        const formatted = applications.map(app => ({
          id: app._id,
          name: app.student?.name || 'N/A',
          email: app.student?.email || 'N/A',
          laptopBrand: `${app.laptop?.brand || ''} ${app.laptop?.model || ''}`,
          applicationStatus: app.status || 'Pending',
        }));

        setInventory(formatted);
      } catch (error) {
        console.error('Error fetching applications:', error);
      }
    };

    fetchApplications();
  }, []);

  // Styles
  const containerStyle = { minHeight: '100vh', background: 'linear-gradient(to top right, #f8fafc, #e2e8f0)', padding: '40px', fontFamily: 'Arial, sans-serif' };
  const cardStyle = { maxWidth: '1200px', margin: '0 auto', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)', padding: '30px' };
  const headingStyle = { fontSize: '28px', fontWeight: 'bold', marginBottom: '20px', textAlign: 'center', color: '#333' };
  const tableStyle = { width: '100%', borderCollapse: 'collapse' };
  const thStyle = { border: '1px solid #ccc', padding: '12px', backgroundColor: '#f3f4f6', textAlign: 'left', fontWeight: 'bold', color: '#222' };
  const tdStyle = { border: '1px solid #ddd', padding: '10px', textAlign: 'left', color: '#333' };
  const rowHoverStyle = { backgroundColor: '#f9fafb' };

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
                <th style={thStyle}>Application Status</th>
              </tr>
            </thead>
            <tbody>
              {inventory.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ ...tdStyle, textAlign: 'center', padding: '20px', color: '#888' }}>
                    No laptop applications found.
                  </td>
                </tr>
              ) : (
                inventory.map(item => (
                  <tr key={item.id} style={rowHoverStyle}>
                    <td style={tdStyle}>{item.name}</td>
                    <td style={tdStyle}>{item.email}</td>
                    <td style={tdStyle}>{item.laptopBrand}</td>
                    <td style={tdStyle}>{item.applicationStatus}</td>
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

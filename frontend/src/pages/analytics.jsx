import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';
import { Apidomain } from '../utils/ApiDomain';

const Analytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLaptops: 0,
    availableLaptops: 0,
    outOfStock: 0,
    totalApplications: 0,
    totalRevenue: 0,
    applicationsByStatus: [],
    revenueByMonth: []
  });

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'admin') {
      navigate('/');
      return;
    }
    
    fetchAnalytics();
    // Refresh data every minute
    const interval = setInterval(fetchAnalytics, 60000);
    return () => clearInterval(interval);
  }, [navigate]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const [laptopsRes, applicationsRes, paymentsRes] = await Promise.all([
        axios.get(`${Apidomain}/laptops`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${Apidomain}/applications`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${Apidomain}/mpesa/payments`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const laptops = laptopsRes.data;
      const applications = applicationsRes.data.applications;
      const payments = paymentsRes.data;

      // Calculate statistics
      const availableLaptops = laptops.filter(l => l.status === 'Available').length;
      const outOfStock = laptops.filter(l => l.status === 'Out of Stock').length;

      // Group applications by status
      const applicationsByStatus = [
        { name: 'Pending', value: applications.filter(a => a.status === 'Pending').length },
        { name: 'Approved', value: applications.filter(a => a.status === 'Approved').length },
        { name: 'Rejected', value: applications.filter(a => a.status === 'Rejected').length }
      ];

      // Calculate monthly revenue
      const revenueByMonth = calculateMonthlyRevenue(payments);

      setStats({
        totalLaptops: laptops.length,
        availableLaptops,
        outOfStock,
        totalApplications: applications.length,
        totalRevenue: payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
        applicationsByStatus,
        revenueByMonth
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setLoading(false);
    }
  };

  const calculateMonthlyRevenue = (payments) => {
    const monthlyData = {};
    payments.forEach(payment => {
      const date = new Date(payment.createdAt);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthYear] = (monthlyData[monthYear] || 0) + Number(payment.amount || 0);
    });

    return Object.entries(monthlyData)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Last 6 months
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

  if (loading) return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      Loading analytics...
    </div>
  );

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem', color: '#1e40af' }}>
        📊 Analytics Dashboard
      </h1>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <StatCard title="Total Laptops" value={stats.totalLaptops} color="#3b82f6" />
        <StatCard title="Available Laptops" value={stats.availableLaptops} color="#10b981" />
        <StatCard title="Out of Stock" value={stats.outOfStock} color="#ef4444" />
        <StatCard 
          title="Total Revenue" 
          value={`KES ${stats.totalRevenue.toLocaleString()}`} 
          color="#8b5cf6" 
        />
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gap: '2rem', marginTop: '2rem' }}>
        {/* Application Status Distribution */}
        <div style={{ 
          background: 'white', 
          padding: '1.5rem', 
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Application Status Distribution
          </h2>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <PieChart width={400} height={300}>
              <Pie
                data={stats.applicationsByStatus}
                cx={200}
                cy={150}
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {stats.applicationsByStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div style={{ 
          background: 'white', 
          padding: '1.5rem', 
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Monthly Revenue
          </h2>
          <BarChart
            width={800}
            height={300}
            data={stats.revenueByMonth}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="amount" name="Revenue (KES)" fill="#8884d8" />
          </BarChart>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, color }) => (
  <div style={{
    background: 'white',
    padding: '1.5rem',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    borderLeft: `4px solid ${color}`
  }}>
    <h3 style={{ fontSize: '1rem', color: '#6b7280', marginBottom: '0.5rem' }}>{title}</h3>
    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color }}>{value}</p>
  </div>
);

export default Analytics;
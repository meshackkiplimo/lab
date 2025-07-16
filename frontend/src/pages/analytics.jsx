import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
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
    revenueByMonth: [],
    laptopTypes: []
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
      const [laptopsRes, applicationsRes, paymentsRes, laptopTypesRes] = await Promise.all([
        axios.get(`${Apidomain}/laptops`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${Apidomain}/applications`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${Apidomain}/mpesa/payments`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${Apidomain}/laptops/types`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const laptops = laptopsRes.data;
      const applications = applicationsRes.data.applications;
      const payments = paymentsRes.data;
      const laptopTypesData = laptopTypesRes.data;

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
        revenueByMonth,
        laptopTypes: laptopTypesData.laptopTypes || []
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

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#8DD1E1'];
  const LAPTOP_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

  if (loading) return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      Loading analytics...
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '2rem'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.9)',
        padding: '2rem',
        borderRadius: '1rem',
        marginBottom: '2rem',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        border: '1px solid rgba(255, 255, 255, 0.18)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              margin: 0,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              📊 Analytics Dashboard
            </h1>
            <p style={{
              margin: '0.5rem 0 0 0',
              color: '#6b7280',
              fontSize: '1.1rem'
            }}>
              Real-time insights into your laptop rental system
            </p>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '1rem',
            borderRadius: '1rem',
            color: 'white',
            textAlign: 'center',
            minWidth: '120px'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Live</div>
            <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Updated Now</div>
          </div>
        </div>
      </div>

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

        {/* Laptop Types Distribution - Outstanding Design */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '2rem',
          borderRadius: '1rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Background Pattern */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
            pointerEvents: 'none'
          }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{
                background: 'rgba(255,255,255,0.2)',
                padding: '0.75rem',
                borderRadius: '0.75rem',
                marginRight: '1rem',
                backdropFilter: 'blur(10px)'
              }}>
                💻
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
                  Laptop Brands Distribution
                </h2>
                <p style={{ margin: 0, opacity: 0.8, fontSize: '0.875rem' }}>
                  Real-time inventory breakdown by manufacturer
                </p>
              </div>
            </div>

            {stats.laptopTypes.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'center' }}>
                {/* Enhanced Pie Chart */}
                <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '1rem', padding: '1.5rem', backdropFilter: 'blur(10px)' }}>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={stats.laptopTypes.map(type => ({
                          name: type.brand,
                          value: type.count,
                          percentage: type.percentage
                        }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percentage }) => `${name} ${percentage}%`}
                        labelLine={false}
                      >
                        {stats.laptopTypes.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={LAPTOP_COLORS[index % LAPTOP_COLORS.length]}
                            stroke="rgba(255,255,255,0.2)"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: 'rgba(255,255,255,0.95)',
                          border: 'none',
                          borderRadius: '0.5rem',
                          color: '#1f2937',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Enhanced Bar Chart */}
                <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '1rem', padding: '1.5rem', backdropFilter: 'blur(10px)' }}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.laptopTypes}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                      <XAxis
                        dataKey="brand"
                        stroke="rgba(255,255,255,0.8)"
                        fontSize={12}
                      />
                      <YAxis
                        stroke="rgba(255,255,255,0.8)"
                        fontSize={12}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'rgba(255,255,255,0.95)',
                          border: 'none',
                          borderRadius: '0.5rem',
                          color: '#1f2937',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Bar
                        dataKey="count"
                        fill="url(#barGradient)"
                        radius={[4, 4, 0, 0]}
                      />
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.9}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.7}/>
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                color: 'rgba(255,255,255,0.8)',
                padding: '3rem',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '1rem',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
                <h3 style={{ margin: '0 0 0.5rem 0' }}>No Laptop Data Available</h3>
                <p style={{ margin: 0, opacity: 0.7 }}>Add some laptops to see the distribution</p>
              </div>
            )}

            {/* Stats Cards for Laptop Types */}
            {stats.laptopTypes.length > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginTop: '2rem'
              }}>
                {stats.laptopTypes.map((type, index) => (
                  <div key={type.brand} style={{
                    background: 'rgba(255,255,255,0.15)',
                    padding: '1.5rem',
                    borderRadius: '1rem',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-5px)';
                    e.target.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          marginBottom: '0.5rem'
                        }}>
                          <div style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: LAPTOP_COLORS[index % LAPTOP_COLORS.length],
                            marginRight: '0.5rem'
                          }} />
                          <h3 style={{
                            fontWeight: 'bold',
                            margin: 0,
                            fontSize: '1.1rem'
                          }}>
                            {type.brand}
                          </h3>
                        </div>
                        <p style={{
                          margin: 0,
                          opacity: 0.8,
                          fontSize: '0.875rem'
                        }}>
                          {type.percentage}% of inventory
                        </p>
                      </div>
                      <div style={{
                        fontSize: '2rem',
                        fontWeight: 'bold',
                        background: 'rgba(255,255,255,0.2)',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.75rem',
                        backdropFilter: 'blur(10px)'
                      }}>
                        {type.count}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
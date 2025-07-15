import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/authcontext';
import { Apidomain } from '../utils/ApiDomain';
import socketService from '../services/socketService';

const Notifications = ({ isOpen, onToggle }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [realTimeNotifications, setRealTimeNotifications] = useState([]);

  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Get user applications and payments
      const [applicationsRes, paymentsRes] = await Promise.all([
        axios.get(`${Apidomain}/applications/user`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${Apidomain}/mpesa/user-payments`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const applications = applicationsRes.data;
      const payments = paymentsRes.data;

      // Generate payment reminder notifications
      const paymentNotifications = [];

      applications.forEach(app => {
        const laptopId = String(app.laptop?._id || app.laptop);
        const laptopPayments = payments.filter(p => {
          const paymentLaptopId = String(
            p.laptopId?._id || p.laptopId || p._doc?.laptopId
          );
          return paymentLaptopId === laptopId;
        });

        const price = Number(app.laptopDetails?.price || 0);
        const paid = laptopPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
        const remaining = Math.max(0, price - paid);

        if (remaining > 0 && app.status?.toLowerCase() === 'approved') {
          const progressPercentage = price > 0 ? (paid / price) * 100 : 0;
          
          let urgency = 'low';
          let message = '';
          
          if (progressPercentage < 25) {
            urgency = 'high';
            message = `Payment overdue! You've only paid ${progressPercentage.toFixed(0)}% (KES ${paid.toLocaleString()}) of your ${app.laptopDetails?.model}. Remaining: KES ${remaining.toLocaleString()}`;
          } else if (progressPercentage < 50) {
            urgency = 'medium';
            message = `Payment reminder: You've paid ${progressPercentage.toFixed(0)}% (KES ${paid.toLocaleString()}) of your ${app.laptopDetails?.model}. Remaining: KES ${remaining.toLocaleString()}`;
          } else if (progressPercentage < 90) {
            urgency = 'low';
            message = `Almost there! You've paid ${progressPercentage.toFixed(0)}% (KES ${paid.toLocaleString()}) of your ${app.laptopDetails?.model}. Only KES ${remaining.toLocaleString()} remaining`;
          }

          if (message) {
            paymentNotifications.push({
              id: `payment-${app._id}`,
              type: 'payment_reminder',
              urgency,
              message,
              laptopId: app.laptop?._id || app.laptop,
              laptopModel: app.laptopDetails?.model,
              amountPaid: paid,
              amountRemaining: remaining,
              progressPercentage,
              createdAt: new Date().toISOString(),
              isRead: false
            });
          }
        }
      });

      // Sort by urgency (high -> medium -> low) and then by remaining amount (highest first)
      paymentNotifications.sort((a, b) => {
        const urgencyOrder = { high: 3, medium: 2, low: 1 };
        if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
          return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
        }
        return b.amountRemaining - a.amountRemaining;
      });

      setNotifications(paymentNotifications);
      setUnreadCount(paymentNotifications.filter(n => !n.isRead).length);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    // Fetch initial notifications
    fetchNotifications();
    
    // Connect to WebSocket for real-time notifications
    socketService.connect(user.id);
    
    // Listen for real-time notifications
    const unsubscribe = socketService.onNotification((notification) => {
      // Add real-time notification to the list
      setRealTimeNotifications(prev => {
        // Check if notification already exists
        const exists = prev.some(n => n.id === notification.id);
        if (exists) return prev;
        
        // Add new notification at the beginning
        const updated = [notification, ...prev];
        
        // Keep only last 10 real-time notifications
        return updated.slice(0, 10);
      });
      
      // Update unread count for real-time notifications
      if (!notification.isRead) {
        setUnreadCount(prev => prev + 1);
      }
    });
    
    // Set up periodic refresh for payment reminders (every 2 minutes)
    const interval = setInterval(fetchNotifications, 120000);
    
    return () => {
      clearInterval(interval);
      unsubscribe();
      socketService.disconnect();
    };
  }, [user]);

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getUrgencyIcon = (urgency) => {
    switch (urgency) {
      case 'high': return '🚨';
      case 'medium': return '⚠️';
      case 'low': return '💡';
      default: return '📋';
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Notification Bell Icon */}
      <div
        style={{
          color: '#fff',
          fontSize: '1.2rem',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              backgroundColor: '#ef4444',
              color: '#fff',
              borderRadius: '50%',
              fontSize: '0.7rem',
              fontWeight: 'bold',
              minWidth: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'pulse 2s infinite'
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </div>

      {/* Notification Dropdown */}
      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: '100%',
            left: '-200px',
            width: '350px',
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            border: '1px solid #e5e7eb',
            zIndex: 1000,
            maxHeight: '400px',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '1rem',
              borderBottom: '1px solid #e5e7eb',
              background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
              color: '#fff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
              Payment Reminders
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: '#fff',
                  padding: '0.3rem 0.6rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Content */}
          <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                Loading notifications...
              </div>
            ) : (() => {
              // Combine real-time and payment reminder notifications
              const allNotifications = [
                ...realTimeNotifications,
                ...notifications
              ];
              
              // Remove duplicates based on ID
              const uniqueNotifications = allNotifications.filter((notification, index, self) =>
                index === self.findIndex(n => n.id === notification.id)
              );
              
              // Sort by timestamp (newest first)
              uniqueNotifications.sort((a, b) =>
                new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt)
              );
              
              return uniqueNotifications.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                  <p style={{ margin: 0 }}>All payments up to date!</p>
                </div>
              ) : (
                uniqueNotifications.map(notification => (
                  <div
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  style={{
                    padding: '1rem',
                    borderBottom: '1px solid #f3f4f6',
                    cursor: 'pointer',
                    backgroundColor: notification.isRead ? '#fff' : '#f8fafc',
                    transition: 'background-color 0.2s',
                    borderLeft: `4px solid ${getUrgencyColor(notification.urgency)}`
                  }}
                  onMouseEnter={e => e.target.style.backgroundColor = '#f1f5f9'}
                  onMouseLeave={e => e.target.style.backgroundColor = notification.isRead ? '#fff' : '#f8fafc'}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>
                      {getUrgencyIcon(notification.urgency)}
                    </span>
                    <div style={{ flex: 1 }}>
                      <p style={{ 
                        margin: 0, 
                        fontSize: '0.9rem', 
                        color: '#374151',
                        lineHeight: '1.4'
                      }}>
                        {notification.message}
                      </p>
                      {notification.progressPercentage !== undefined && (
                        <div style={{
                          marginTop: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <div
                            style={{
                              flex: 1,
                              height: '4px',
                              backgroundColor: '#e5e7eb',
                              borderRadius: '2px',
                              overflow: 'hidden'
                            }}
                          >
                            <div
                              style={{
                                width: `${notification.progressPercentage}%`,
                                height: '100%',
                                backgroundColor: getUrgencyColor(notification.urgency),
                                transition: 'width 0.3s ease'
                              }}
                            />
                          </div>
                          <span style={{
                            fontSize: '0.8rem',
                            color: '#6b7280',
                            fontWeight: 500
                          }}>
                            {notification.progressPercentage.toFixed(0)}%
                          </span>
                        </div>
                      )}
                      <p style={{
                        margin: '0.3rem 0 0 0',
                        fontSize: '0.8rem',
                        color: '#6b7280'
                      }}>
                        {new Date(notification.timestamp || notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          backgroundColor: getUrgencyColor(notification.urgency),
                          borderRadius: '50%',
                          marginTop: '0.2rem'
                        }}
                      />
                    )}
                  </div>
                </div>
                ))
              );
            })()}
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </div>
  );
};

export default Notifications;
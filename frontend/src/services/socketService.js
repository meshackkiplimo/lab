import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.notificationCallbacks = new Set();
  }

  connect(userId) {
    if (this.socket) {
      this.disconnect();
    }

    const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      timeout: 20000
    });

    this.setupEventListeners(userId);
  }

  setupEventListeners(userId) {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('🔗 Connected to notification server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Authenticate user
      if (userId) {
        this.socket.emit('authenticate', userId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from notification server:', reason);
      this.isConnected = false;
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        this.socket.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('🚫 Connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('❌ Max reconnection attempts reached');
        toast.error('Unable to connect to notification service');
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
      this.isConnected = true;
      
      // Re-authenticate user
      if (userId) {
        this.socket.emit('authenticate', userId);
      }
    });

    // Listen for notifications
    this.socket.on('notification', (notification) => {
      console.log('🔔 Received notification:', notification);
      this.handleNotification(notification);
    });
  }

  handleNotification(notification) {
    // Show toast notification based on type
    switch (notification.type) {
      case 'payment_success':
        toast.success(
          `🎉 Payment Successful!\nKES ${notification.amount.toLocaleString()} for ${notification.laptopModel}\nReceipt: ${notification.receiptNumber || 'Pending'}`,
          {
            duration: notification.autoClose || 5000,
            style: {
              background: '#10b981',
              color: '#fff',
              maxWidth: '400px'
            }
          }
        );
        break;

      case 'payment_failed':
        toast.error(
          `❌ Payment Failed!\nKES ${notification.amount.toLocaleString()} for ${notification.laptopModel}\n${notification.reason || 'Please try again'}`,
          {
            duration: notification.autoClose || 8000,
            style: {
              background: '#ef4444',
              color: '#fff',
              maxWidth: '400px'
            }
          }
        );
        break;

      case 'payment_reminder':
        const urgencyColors = {
          high: '#ef4444',
          medium: '#f59e0b',
          low: '#10b981'
        };
        
        toast(notification.message, {
          duration: 6000,
          style: {
            background: urgencyColors[notification.urgency] || '#6b7280',
            color: '#fff',
            maxWidth: '400px'
          },
          icon: notification.urgency === 'high' ? '🚨' : notification.urgency === 'medium' ? '⚠️' : '💡'
        });
        break;

      case 'broadcast':
        toast(notification.message, {
          duration: 5000,
          style: {
            background: '#2563eb',
            color: '#fff',
            maxWidth: '400px'
          },
          icon: '📢'
        });
        break;

      default:
        toast(notification.message || notification.title, {
          duration: 4000,
          style: {
            background: '#374151',
            color: '#fff'
          }
        });
    }

    // Notify registered callbacks
    this.notificationCallbacks.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Error in notification callback:', error);
      }
    });
  }

  // Register callback for notifications
  onNotification(callback) {
    this.notificationCallbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.notificationCallbacks.delete(callback);
    };
  }

  // Send test notification (for development)
  sendTestNotification(type = 'test') {
    if (!this.isConnected) {
      toast.error('Not connected to notification service');
      return;
    }

    const testNotifications = {
      success: {
        type: 'payment_success',
        amount: 5000,
        laptopModel: 'Dell Latitude 5520',
        receiptNumber: 'TEST123456'
      },
      failed: {
        type: 'payment_failed',
        amount: 5000,
        laptopModel: 'Dell Latitude 5520',
        reason: 'Insufficient funds'
      },
      reminder: {
        type: 'payment_reminder',
        urgency: 'high',
        message: 'Payment overdue! You have only paid 25% (KES 12,500) of your Dell Latitude 5520. Remaining: KES 37,500'
      }
    };

    const notification = testNotifications[type] || testNotifications.success;
    this.handleNotification(notification);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('🔌 Disconnected from notification server');
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
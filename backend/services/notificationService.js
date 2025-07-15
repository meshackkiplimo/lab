const { Server } = require('socket.io');
const Payment = require('../models/payment');
const User = require('../models/User');

class NotificationService {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    this.setupSocketHandlers();
    console.log('🔔 Notification service initialized');
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('👤 User connected:', socket.id);

      // Handle user authentication and join their room
      socket.on('authenticate', (userId) => {
        if (userId) {
          socket.join(`user_${userId}`);
          console.log(`✅ User ${userId} authenticated and joined room`);
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('👤 User disconnected:', socket.id);
      });
    });
  }

  // Emit payment success notification
  async emitPaymentSuccess(userId, paymentData) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      const notification = {
        id: `payment-success-${paymentData._id}`,
        type: 'payment_success',
        urgency: 'high',
        title: 'Payment Successful! 🎉',
        message: `Your payment of KES ${paymentData.amount.toLocaleString()} for ${paymentData.laptopModel || 'laptop'} has been processed successfully.`,
        amount: paymentData.amount,
        laptopModel: paymentData.laptopModel,
        remainingBalance: paymentData.remainingBalance,
        receiptNumber: paymentData.mpesaReceiptNumber,
        timestamp: new Date().toISOString(),
        isRead: false,
        autoClose: 5000 // Auto close after 5 seconds
      };

      // Emit to specific user
      this.io.to(`user_${userId}`).emit('notification', notification);
      
      console.log(`🔔 Payment success notification sent to user ${userId}:`, {
        amount: paymentData.amount,
        laptop: paymentData.laptopModel,
        receipt: paymentData.mpesaReceiptNumber
      });

    } catch (error) {
      console.error('❌ Error emitting payment success notification:', error);
    }
  }

  // Emit payment reminder notification
  async emitPaymentReminder(userId, reminderData) {
    try {
      const notification = {
        id: `payment-reminder-${reminderData.laptopId}`,
        type: 'payment_reminder',
        urgency: reminderData.urgency || 'medium',
        title: 'Payment Reminder 💰',
        message: reminderData.message,
        laptopId: reminderData.laptopId,
        laptopModel: reminderData.laptopModel,
        amountPaid: reminderData.amountPaid,
        amountRemaining: reminderData.amountRemaining,
        progressPercentage: reminderData.progressPercentage,
        timestamp: new Date().toISOString(),
        isRead: false
      };

      // Emit to specific user
      this.io.to(`user_${userId}`).emit('notification', notification);
      
      console.log(`🔔 Payment reminder sent to user ${userId}:`, {
        laptop: reminderData.laptopModel,
        remaining: reminderData.amountRemaining
      });

    } catch (error) {
      console.error('❌ Error emitting payment reminder:', error);
    }
  }

  // Emit payment failed notification
  async emitPaymentFailed(userId, paymentData) {
    try {
      const notification = {
        id: `payment-failed-${paymentData._id}`,
        type: 'payment_failed',
        urgency: 'high',
        title: 'Payment Failed ❌',
        message: `Your payment of KES ${paymentData.amount.toLocaleString()} for ${paymentData.laptopModel || 'laptop'} failed. ${paymentData.reason || 'Please try again.'}`,
        amount: paymentData.amount,
        laptopModel: paymentData.laptopModel,
        reason: paymentData.reason,
        timestamp: new Date().toISOString(),
        isRead: false,
        autoClose: 8000 // Auto close after 8 seconds
      };

      // Emit to specific user
      this.io.to(`user_${userId}`).emit('notification', notification);
      
      console.log(`🔔 Payment failed notification sent to user ${userId}:`, {
        amount: paymentData.amount,
        reason: paymentData.reason
      });

    } catch (error) {
      console.error('❌ Error emitting payment failed notification:', error);
    }
  }

  // Emit general notification
  async emitNotification(userId, notificationData) {
    try {
      const notification = {
        id: notificationData.id || `notification-${Date.now()}`,
        type: notificationData.type || 'general',
        urgency: notificationData.urgency || 'medium',
        title: notificationData.title,
        message: notificationData.message,
        timestamp: new Date().toISOString(),
        isRead: false,
        ...notificationData
      };

      // Emit to specific user
      this.io.to(`user_${userId}`).emit('notification', notification);
      
      console.log(`🔔 Notification sent to user ${userId}:`, notification.title);

    } catch (error) {
      console.error('❌ Error emitting notification:', error);
    }
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.io.engine.clientsCount;
  }

  // Send notification to all connected users (admin feature)
  async broadcastNotification(notificationData) {
    try {
      const notification = {
        id: `broadcast-${Date.now()}`,
        type: 'broadcast',
        urgency: notificationData.urgency || 'medium',
        title: notificationData.title,
        message: notificationData.message,
        timestamp: new Date().toISOString(),
        isRead: false,
        ...notificationData
      };

      this.io.emit('notification', notification);
      console.log('📢 Broadcast notification sent to all users:', notification.title);

    } catch (error) {
      console.error('❌ Error broadcasting notification:', error);
    }
  }
}

module.exports = NotificationService;
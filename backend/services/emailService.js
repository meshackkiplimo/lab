const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    console.log('📧 Email service initialized');
  }

  // Send laptop application confirmation email
  async sendApplicationConfirmationEmail(userEmail, applicationData) {
    try {
      const {
        userName,
        laptopModel,
        laptopBrand,
        totalPrice
      } = applicationData;

      const emailTemplate = this.generateApplicationConfirmationTemplate({
        userName,
        laptopModel,
        laptopBrand,
        totalPrice
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: `Application Confirmed - ${laptopBrand} ${laptopModel}`,
        html: emailTemplate
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ Application confirmation email sent successfully:', {
        to: userEmail,
        messageId: result.messageId,
        laptop: `${laptopBrand} ${laptopModel}`
      });

      return {
        success: true,
        messageId: result.messageId
      };

    } catch (error) {
      console.error('❌ Error sending application confirmation email:', error);
      throw error;
    }
  }

  // Send payment reminder email after first payment
  async sendPaymentReminderEmail(userEmail, paymentData) {
    try {
      const { 
        userName, 
        laptopModel, 
        laptopBrand, 
        totalPrice, 
        amountPaid, 
        remainingBalance,
        paymentDate 
      } = paymentData;

      const emailTemplate = this.generatePaymentReminderTemplate({
        userName,
        laptopModel,
        laptopBrand,
        totalPrice,
        amountPaid,
        remainingBalance,
        paymentDate
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: `Payment Confirmation & Reminder - ${laptopBrand} ${laptopModel}`,
        html: emailTemplate
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ Payment reminder email sent successfully:', {
        to: userEmail,
        messageId: result.messageId,
        laptop: `${laptopBrand} ${laptopModel}`,
        remainingBalance
      });

      return {
        success: true,
        messageId: result.messageId
      };

    } catch (error) {
      console.error('❌ Error sending payment reminder email:', error);
      throw error;
    }
  }

  // Generate HTML email template for application confirmation
  generateApplicationConfirmationTemplate(data) {
    const {
      userName,
      laptopModel,
      laptopBrand,
      totalPrice
    } = data;

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Application Confirmed</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .container {
          background-color: #ffffff;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          color: #2c3e50;
          border-bottom: 2px solid #3498db;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .success-badge {
          background-color: #27ae60;
          color: white;
          padding: 10px 20px;
          border-radius: 25px;
          display: inline-block;
          margin-bottom: 20px;
          font-weight: bold;
        }
        .application-details {
          background-color: #ecf0f1;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .next-steps {
          background-color: #e8f6f3;
          border: 1px solid #27ae60;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .amount {
          font-size: 1.2em;
          font-weight: bold;
          color: #2c3e50;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #ecf0f1;
          color: #7f8c8d;
        }
        .btn {
          display: inline-block;
          background-color: #3498db;
          color: white;
          padding: 12px 25px;
          text-decoration: none;
          border-radius: 5px;
          margin: 10px 0;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💻 SmartLaptop Application Confirmed</h1>
          <div class="success-badge">✅ Application Received!</div>
        </div>

        <p>Dear <strong>${userName}</strong>,</p>

        <p>Congratulations! Your laptop application has been successfully submitted and is now being processed.</p>

        <div class="application-details">
          <h3>📋 Application Details</h3>
          <p><strong>Laptop:</strong> ${laptopBrand} ${laptopModel}</p>
          <p><strong>Total Price:</strong> <span class="amount">KES ${totalPrice.toLocaleString()}</span></p>
          <p><strong>Application Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Status:</strong> <span style="color: #f39c12; font-weight: bold;">Pending Approval</span></p>
        </div>

        <div class="next-steps">
          <h3>🚀 Next Steps</h3>
          <ol>
            <li><strong>Admin Review:</strong> Our team will review your application within 24-48 hours</li>
            <li><strong>Approval Notification:</strong> You'll receive an email once your application is approved</li>
            <li><strong>Payment Process:</strong> After approval, you can start making payments towards your laptop</li>
            <li><strong>Laptop Delivery:</strong> Once payments are complete, we'll arrange delivery</li>
          </ol>
          
          <p>💡 <strong>Pro Tip:</strong> You can start making payments even before approval to speed up the process!</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="#" class="btn">Check Application Status</a>
        </div>

        <div class="footer">
          <p>Thank you for choosing SmartLaptop financing!</p>
          <p><small>This is an automated email. Please do not reply to this message.</small></p>
          <p><small>If you have any questions, please contact our support team.</small></p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  // Generate HTML email template for payment reminder
  generatePaymentReminderTemplate(data) {
    const {
      userName,
      laptopModel,
      laptopBrand,
      totalPrice,
      amountPaid,
      remainingBalance,
      paymentDate
    } = data;

    const progressPercentage = Math.round((amountPaid / totalPrice) * 100);

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Confirmation & Reminder</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .container {
          background-color: #ffffff;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          color: #2c3e50;
          border-bottom: 2px solid #3498db;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .success-badge {
          background-color: #27ae60;
          color: white;
          padding: 10px 20px;
          border-radius: 25px;
          display: inline-block;
          margin-bottom: 20px;
          font-weight: bold;
        }
        .payment-details {
          background-color: #ecf0f1;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .progress-bar {
          background-color: #ecf0f1;
          border-radius: 10px;
          padding: 3px;
          margin: 15px 0;
        }
        .progress-fill {
          background-color: #3498db;
          height: 20px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 12px;
        }
        .reminder-section {
          background-color: #fff3cd;
          border: 1px solid #ffc107;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .amount {
          font-size: 1.2em;
          font-weight: bold;
          color: #2c3e50;
        }
        .remaining {
          font-size: 1.3em;
          font-weight: bold;
          color: #e74c3c;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #ecf0f1;
          color: #7f8c8d;
        }
        .btn {
          display: inline-block;
          background-color: #3498db;
          color: white;
          padding: 12px 25px;
          text-decoration: none;
          border-radius: 5px;
          margin: 10px 0;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💻 SmartLaptop Payment Confirmation</h1>
          <div class="success-badge">✅ Payment Received!</div>
        </div>

        <p>Dear <strong>${userName}</strong>,</p>

        <p>Thank you for your payment! We have successfully received your installment for the <strong>${laptopBrand} ${laptopModel}</strong>.</p>

        <div class="payment-details">
          <h3>📋 Payment Summary</h3>
          <p><strong>Laptop:</strong> ${laptopBrand} ${laptopModel}</p>
          <p><strong>Total Price:</strong> <span class="amount">KES ${totalPrice.toLocaleString()}</span></p>
          <p><strong>Amount Paid:</strong> <span class="amount">KES ${amountPaid.toLocaleString()}</span></p>
          <p><strong>Payment Date:</strong> ${new Date(paymentDate).toLocaleDateString()}</p>
          
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progressPercentage}%;">
              ${progressPercentage}% Paid
            </div>
          </div>
        </div>

        <div class="reminder-section">
          <h3>💰 Outstanding Balance</h3>
          <p>You still have an outstanding balance of:</p>
          <p class="remaining">KES ${remainingBalance.toLocaleString()}</p>
          
          <p>📝 <strong>Reminder:</strong> Please continue making payments to complete your laptop purchase. You can make payments anytime through your dashboard.</p>
          
          <p>💡 <strong>Tip:</strong> Regular payments help you get your laptop faster and build a good payment history!</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="#" class="btn">Make Another Payment</a>
        </div>

        <div class="footer">
          <p>Thank you for choosing SmartLaptop financing!</p>
          <p><small>This is an automated email. Please do not reply to this message.</small></p>
          <p><small>If you have any questions, please contact our support team.</small></p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  // Test email connection
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Email service connection verified');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      return false;
    }
  }

  // Send welcome email (bonus feature)
  async sendWelcomeEmail(userEmail, userData) {
    try {
      const { firstName, lastName } = userData;

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: 'Welcome to SmartLaptop Financing System!',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2c3e50;">Welcome to SmartLaptop! 🎉</h2>
          <p>Dear ${firstName} ${lastName},</p>
          <p>Your account has been successfully created. You can now browse and apply for laptop financing.</p>
          <p>Start by exploring our available laptops and applying for the one that suits your needs.</p>
          <p>Best regards,<br>SmartLaptop Team</p>
        </div>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Welcome email sent:', result.messageId);
      return result;
    } catch (error) {
      console.error('❌ Error sending welcome email:', error);
      throw error;
    }
  }
}

module.exports = EmailService;
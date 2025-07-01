require('dotenv').config();
const axios = require('axios');

class MpesaService {
  static async getAccessToken() {
    const { MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET } = process.env;
    const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');
    const url = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

    try {
      const response = await axios.get(url, {
        headers: { Authorization: `Basic ${auth}` },
      });
      return response.data.access_token;
    } catch (error) {
      throw new Error(`Failed to get access token: ${error.message}`);
    }
  }

  static async initiateStkPush(phoneNumber, amount, transactionDesc) {
    const accessToken = await this.getAccessToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const { MPESA_SHORTCODE, MPESA_PASSKEY, MPESA_CALLBACK_URL } = process.env;
    const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString('base64');

    const payload = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: MPESA_SHORTCODE,
      PhoneNumber: phoneNumber,
      CallBackURL: process.env.MPESA_CALLBACK_URL || 'https://lab-c85c.onrender.com/api/mpesa/callback',
      AccountReference: 'Laptop Payment',
      TransactionDesc: transactionDesc || 'Payment for laptop',
      ResponseType: 'Completed'
    };

    console.log('🚀 Initiating STK Push with payload:', {
      ...payload,
      Password: '***HIDDEN***',
      CallBackURL: MPESA_CALLBACK_URL
    });

    try {
      const response = await axios.post(
        'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
        payload,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      console.log('✅ STK Push Response:', response.data);
      return {
        ...response.data,
        CheckoutRequestID: response.data.CheckoutRequestID
      };
    } catch (error) {
      console.error('❌ STK Push Error:', error.response?.data || error.message);
      throw new Error(`STK Push failed: ${error.response?.data?.errorMessage || error.message}`);
    }
  }
}

module.exports = MpesaService;

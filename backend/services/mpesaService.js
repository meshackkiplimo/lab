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
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: 'Laptop Payment',
      TransactionDesc: transactionDesc || 'Payment for laptop',
      ResponseType: 'Completed'
    };

    // Log full payload details for debugging
    console.log('🚀 Initiating STK Push with payload:', {
      ...payload,
      Password: '***HIDDEN***',
      CallBackURL: MPESA_CALLBACK_URL,
      Amount: amount,
      PhoneNumber: phoneNumber
    });

    try {
      const timestamp = new Date().toISOString();
      console.log(`🚀 [${timestamp}] Sending STK push request...`);
      
      const response = await axios.post(
        'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        }
      );

      console.log('✅ STK Push Response:', response.data);
      return {
        ...response.data,
        CheckoutRequestID: response.data.CheckoutRequestID
      }
    } catch (error) {
      console.error('❌ STK Push Error:', error.response?.data || error.message);
      throw new Error(`STK Push failed: ${error.response?.data?.errorMessage || error.message}`);
    }
  }

  static async queryTransactionStatus(checkoutRequestId) {
    try {
      const timestamp = new Date().toISOString();
      console.log(`🔍 [${timestamp}] Querying status for ${checkoutRequestId}`);

      const accessToken = await this.getAccessToken();
      const { MPESA_SHORTCODE, MPESA_PASSKEY } = process.env;
      const currentTimestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
      const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${currentTimestamp}`).toString('base64');

      const payload = {
        BusinessShortCode: MPESA_SHORTCODE,
        Password: password,
        Timestamp: currentTimestamp,
        CheckoutRequestID: checkoutRequestId
      };

      const response = await axios.post(
        'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000 // 5 second timeout
        }
      );

      console.log(`✅ [${timestamp}] Status query response:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ [${new Date().toISOString()}] Status query error:`, error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = MpesaService;

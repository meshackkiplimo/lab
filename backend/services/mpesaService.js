require('dotenv').config();
const axios = require('axios');

class MpesaService {

 

  // Generate OAuth access token
  static async getAccessToken() {

    
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const url = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    console.log('Fetching access token with:', { consumerKey, consumerSecret });

    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      });
      return response.data.access_token;
    } catch (error) {
      throw new Error(`Failed to get access token: ${error.message}`);
    }
  }

  // Initiate STK Push
  static async initiateStkPush(phoneNumber, amount, transactionDesc) {
      console.log('Initiating STK Push with:', { phoneNumber, amount, transactionDesc });
      const accessToken = await this.getAccessToken();
    const url = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const shortCode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;
    const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');

    const payload = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phoneNumber, // e.g., 2547XXXXXXXX
      PartyB: shortCode,
      PhoneNumber: phoneNumber,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: 'Test123',
      TransactionDesc: transactionDesc || 'Payment for goods',
    };

    try {
      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      console.log('STK Push Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('STK Push Error:', error.response?.data || error.message);
      throw new Error(`STK Push failed: ${error.message}`);
    }
  }
}

module.exports = MpesaService;
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const http = require('http');
const NotificationService = require('./services/notificationService');

const app = express();
const server = http.createServer(app);

// Initialize notification service
let notificationService;

// Middleware
// Enable CORS for all routes
app.use(cors({
  origin: 'http://localhost:5173', 
  // origin for mpesa callback


  methods: 'GET,POST,PUT,DELETE,OPTIONS', // Allow specific methods
  allowedHeaders: 'Content-Type,Authorization' // Allow specific headers
}));


// Parse JSON payloads
app.use(express.json());

// Serve static frontend build files from dist
app.use(express.static(path.join(__dirname, 'dist')));

// Route imports (assuming these exist)
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const laptopRoutes = require('./routes/laptop');
const controllerRoutes = require('./routes/controller');
const applicationRoutes = require('./routes/application');
const dashboardRoutes = require('./routes/dashboard');
const mpesaRoutes = require('./routes/mpesaRoute');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/laptops', laptopRoutes);
app.use('/api/controller', controllerRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/mpesa', mpesaRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('Welcome to the SLFS Backend API');
});



const LaptopApplication = require('./models/laptopapplication');

// === Clearance Application Route ===
app.post('/api/clearance/apply', async (req, res) => {
  try {
    const { name, email, laptopId, department, reason } = req.body;

    // Basic validation
    if (!name || !email || !laptopId || !department || !reason) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Check if laptopId exists in laptops collection
    // Assuming you have a Laptop model (you can import it from ./routes/laptop or define it here)
    // Here is a quick mockup, you should replace it with your actual Laptop model
    /*
    const laptopExists = await Laptop.findOne({ laptopId });
    if (!laptopExists) {
      return res.status(400).json({ error: 'Laptop ID not found in inventory.' });
    }
    */

    // Save new clearance application
    const newApplication = new LaptopApplication({
      name,
      email,
      laptopId,
      department,
      reason
    });

    await newApplication.save();

    res.json({ message: 'Clearance application submitted successfully. Please wait for approval.' });

  } catch (error) {
    console.error('Clearance application error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Catch-all route to serve React SPA
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected');
  
  // Start server with HTTP and WebSocket support
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Initialize notification service after server starts
    notificationService = new NotificationService(server);
    
    // Make notification service available globally
    global.notificationService = notificationService;
  });
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

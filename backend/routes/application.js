const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

const {
  applyLaptop,
  getApplications,
  updateApplicationStatus,
  deleteApplication,
  getUserApplications
} = require('../controllers/laptopapplication');

// 🧑‍🎓 Student: Apply for a laptop
router.post('/apply', authMiddleware(), applyLaptop);

// 🔐 Admin: Get all laptop applications (can filter with ?status=Approved)
router.get('/', authMiddleware('admin'), getApplications);

// 🔐 Admin: Update application status (Approve/Reject only)
router.put('/:id/status', authMiddleware('admin'), updateApplicationStatus);
// 🔐 Admin: Delete application (optional, not in original code)
router.delete('/:id', authMiddleware('admin'), deleteApplication);

// 🧑‍🎓 Student: Get their own applications
router.get('/user', authMiddleware(), getUserApplications);

module.exports = router;

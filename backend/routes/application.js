const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  applyLaptop,
  getApplications,
  updateApplicationStatus,
} = require('../controllers/laptopapplication');

router.post('/apply', authMiddleware(), applyLaptop);
router.get('/', authMiddleware(), getApplications);
router.put('/:id/status', authMiddleware('admin'), updateApplicationStatus);

module.exports = router;
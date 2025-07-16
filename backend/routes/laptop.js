const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  addLaptop,
  getLaptops,
  updateLaptop,
  deleteLaptop,
  getLaptopTypes
} = require('../controllers/laptopcontroller');
const Laptop = require('../models/laptop'); // ✅ ensure this is correct

// 🔒 Protected route: get all laptops (requires authentication)
router.get('/', auth(), getLaptops);

// 🔒 Admin-only route: get laptop types/brands statistics
router.get('/types', auth('admin'), getLaptopTypes);

// 🔒 Protected route: get one laptop by ID (requires authentication)
router.get('/:id', auth(), async (req, res) => {
  try {
    const laptop = await Laptop.findById(req.params.id);
    if (!laptop) return res.status(404).json({ message: 'Laptop not found' });
    res.json(laptop);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 🔒 Admin-only routes
router.post('/', auth('admin'), addLaptop);
router.put('/:id', auth('admin'), updateLaptop);
router.delete('/:id', auth('admin'), deleteLaptop);

module.exports = router;

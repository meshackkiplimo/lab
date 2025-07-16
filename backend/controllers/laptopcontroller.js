const Laptop = require('../models/laptop');

// Admin: Add new laptop
exports.addLaptop = async (req, res) => {
  try {
    console.log('Received body:', req.body); // Log the incoming data
    const laptop = await Laptop.create(req.body);
    res.status(201).json({ message: 'Laptop added', laptop });
  } catch (err) {
    console.error('Add Laptop Error:', err.message); // Log the error message
    res.status(400).json({ error: err.message });
  }
};

// Admin/User: Get all laptops
exports.getLaptops = async (req, res) => {
  try {
    console.log('📱 Getting laptops for user:', req.user.id);
    const laptops = await Laptop.find();
    console.log(`✅ Found ${laptops.length} laptops`);
    res.json(laptops);
  } catch (err) {
    console.error('❌ Error getting laptops:', err);
    res.status(500).json({
      error: 'Failed to fetch laptops',
      details: err.message
    });
  }
};

// Admin: Update laptop
exports.updateLaptop = async (req, res) => {
  try {
    const updated = await Laptop.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ message: 'Laptop updated', updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Admin: Delete laptop
exports.deleteLaptop = async (req, res) => {
  try {
    await Laptop.findByIdAndDelete(req.params.id);
    res.json({ message: 'Laptop deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


// Admin: Get laptop types/brands statistics
exports.getLaptopTypes = async (req, res) => {
  try {
    console.log('📊 Getting laptop types statistics');
    const laptops = await Laptop.find();
    
    // Group laptops by brand and count them
    const brandCounts = {};
    laptops.forEach(laptop => {
      const brand = laptop.brand.toLowerCase();
      brandCounts[brand] = (brandCounts[brand] || 0) + 1;
    });

    // Convert to array format for charts
    const laptopTypes = Object.entries(brandCounts).map(([brand, count]) => ({
      brand: brand.charAt(0).toUpperCase() + brand.slice(1), // Capitalize first letter
      count,
      percentage: ((count / laptops.length) * 100).toFixed(1)
    }));

    console.log(`✅ Found ${laptopTypes.length} different laptop brands`);
    res.json({
      totalLaptops: laptops.length,
      laptopTypes: laptopTypes.sort((a, b) => b.count - a.count) // Sort by count descending
    });
  } catch (err) {
    console.error('❌ Error getting laptop types:', err);
    res.status(500).json({
      error: 'Failed to fetch laptop types',
      details: err.message
    });
  }
};

// controllers/laptopapplication.js

const mongoose = require('mongoose');
const LaptopApplication = require('../models/laptopapplication');
const Laptop = require('../models/laptop');

// Student: Apply for a laptop
exports.applyLaptop = async (req, res) => {
  try {
    console.log('📥 applyLaptop called:', req.body);

    // Ensure authenticated user exists
    if (!req.user) {
      console.error('❌ req.user is missing!');
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }
    console.log('✅ Authenticated user:', req.user);

    // Eligibility check: Only 1st to 3rd year students
    if (req.user.year === 4) {
      return res.status(403).json({
        success: false,
        message: "Only students from 1st to 3rd year are eligible for SmartLaptop financing."
      });
    }

    const { laptopId } = req.body;

    // Validate laptopId format
    if (!laptopId || !laptopId.match(/^[0-9a-fA-F]{24}$/)) {
      console.error('❌ Invalid laptopId:', laptopId);
      return res.status(400).json({ success: false, error: 'Invalid laptopId format' });
    }

    // Check if laptop exists and is available
    const laptop = await Laptop.findById(laptopId);
    if (!laptop) {
      return res.status(404).json({ success: false, error: 'Laptop not found' });
    }
    if (laptop.status === 'Out of Stock') {
      return res.status(400).json({ success: false, error: 'Laptop is out of stock' });
    }

    // Check for existing pending application for the same laptop
    const existingApplication = await LaptopApplication.findOne({
      student: req.user.id,
      laptop: laptopId,
      status: 'Pending'
    });
    if (existingApplication) {
      return res.status(400).json({
        success: false,
        error: 'You already have a pending application for this laptop'
      });
    }

    // Start a transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Create new laptop application
      const [newApplication] = await LaptopApplication.create([{
        student: req.user.id,
        laptop: laptopId
      }], { session });

      // Update laptop status to Out of Stock
      await Laptop.findByIdAndUpdate(
        laptopId,
        { status: 'Out of Stock' },
        { session }
      );

      // Commit the transaction
      await session.commitTransaction();
      console.log('✅ Application created and laptop status updated:', newApplication);

      return res.status(201).json({
        success: true,
        message: 'Application submitted successfully',
        application: newApplication
      });
    } catch (error) {
      // If an error occurred, abort the transaction
      await session.abortTransaction();
      throw error;
    } finally {
      // End the session
      session.endSession();
    }
  } catch (err) {
    console.error('❌ Error in applyLaptop:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Admin: Get all laptop applications (with optional filtering)
exports.getApplications = async (req, res) => {
  try {
    const query = req.query.status ? { status: req.query.status } : {};

    const applications = await LaptopApplication.find(query)
      .populate('student', 'firstName lastName email year')
      .populate('laptop', 'model brand spec available price');

    return res.status(200).json({
      success: true,
      applications
    });

  } catch (err) {
    console.error('❌ Error in getApplications:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Admin: Update application status
// Admin: Update application status (Approve or Reject only)
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Allow only valid transitions
    const validStatuses = ['Approved', 'Rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status value' });
    }

    // Start a transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find and update the application
      const updated = await LaptopApplication.findByIdAndUpdate(
        id,
        { status },
        { new: true, session }
      )
        .populate('student', 'firstName lastName email year')
        .populate('laptop', 'model brand spec');

      if (!updated) {
        await session.abortTransaction();
        return res.status(404).json({ success: false, error: 'Application not found' });
      }

      // If application is rejected, set laptop status back to Available
      if (status === 'Rejected') {
        await Laptop.findByIdAndUpdate(
          updated.laptop._id,
          { status: 'Available' },
          { session }
        );
      }

      // Commit the transaction
      await session.commitTransaction();
      console.log(`✅ Application ID: ${id} updated to status: ${status}`);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

    return res.status(200).json({
      success: true,
      message: `Application has been ${status.toLowerCase()}`,
      application: updated
    });

  } catch (err) {
    console.error('❌ Error in updateApplicationStatus:', err.message);
    return res.status(500).json({
      success: false,
      error: 'An error occurred while updating the application status'
    });
  }
};

// Admin: Delete application
exports.deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, error: 'Invalid application ID format' });
    }

    const deleted = await LaptopApplication.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    console.log(`✅ Application ID: ${id} deleted successfully`);

    return res.status(200).json({
      success: true,
      message: 'Application deleted successfully'
    });

  } catch (err) {
    console.error('❌ Error in deleteApplication:', err.message);
    return res.status(500).json({
      success: false,
      error: 'An error occurred while deleting the application'
    });
  }
};

// Student: Get their own applications
exports.getUserApplications = async (req, res) => {
  try {
    const applications = await LaptopApplication.find({ student: req.user.id })
      .populate('laptop', 'model brand spec price')
      .sort({ createdAt: -1 });

    // Map applications to include laptopDetails for frontend compatibility
    const appsWithDetails = applications.map(app => {
      const laptop = app.laptop || {};
      return {
        ...app.toObject(),
        laptopDetails: {
          model: laptop.model || 'N/A',
          price: laptop.price || 'N/A',
          name: laptop.brand || 'Laptop',
        }
      };
    });
    return res.status(200).json(appsWithDetails);
  } catch (err) {
    console.error('❌ Error in getUserApplications:', err.message);
    return res.status(500).json({
      success: false,
      error: 'An error occurred while fetching your applications'
    });
  }
};

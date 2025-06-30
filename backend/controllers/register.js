router.post('/register', async (req, res) => {
  try {
    const { email, password, role,firstName,lastName } = req.body;
    const emailLower = email.toLowerCase().trim();

    let user = await User.findOne({ email: emailLower });
    if (user) return res.status(400).json({ message: 'Email already registered' });

    user = new User({
      email: emailLower,
      password,
      role: ['student', 'admin'].includes(role) ? role : 'student',
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });

    await user.save();

    const payload = { userId: user._id, role: user.role, firstName: user.firstName, lastName: user.lastName }; // Include first and last name in payload
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(201).json({
      token,
      user: { email: user.email, role: user.role , firstName: user.firstName, lastName: user.lastName },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Registration failed. Email may already be in use.' });
  }
});

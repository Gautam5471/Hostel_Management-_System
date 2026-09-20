const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { ensureAuthenticated, ensureGuest } = require('../middleware/auth');

// GET /auth/login
router.get('/login', ensureGuest, (req, res) => {
  res.render('auth/login', {
    title: 'Login | Hostel & Mess Portal',
  });
});

// POST /auth/login
router.post('/login', ensureGuest, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      req.flash('error_msg', 'Please enter both email and password');
      return res.redirect('/auth/login');
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      req.flash('error_msg', 'Invalid credentials. User not found.');
      return res.redirect('/auth/login');
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      req.flash('error_msg', 'Invalid password. Please try again.');
      return res.redirect('/auth/login');
    }

    // Store user in session (excluding password)
    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      rollNo: user.rollNo,
      department: user.department,
      gender: user.gender,
      phone: user.phone,
    };

    req.flash('success_msg', `Welcome back, ${user.name}!`);
    if (user.role === 'admin' || user.role === 'warden') {
      return res.redirect('/admin/dashboard');
    }
    res.redirect('/student/dashboard');
  } catch (error) {
    console.error('Login error:', error);
    req.flash('error_msg', 'A server error occurred during login. Please try again.');
    res.redirect('/auth/login');
  }
});

// GET /auth/register
router.get('/register', ensureGuest, (req, res) => {
  res.render('auth/register', {
    title: 'Student Registration | Hostel Portal',
  });
});

// POST /auth/register
router.post('/register', ensureGuest, async (req, res) => {
  try {
    const { name, email, password, confirmPassword, rollNo, department, yearOfStudy, gender, phone, emergencyName, emergencyPhone } = req.body;

    if (!name || !email || !password || !rollNo) {
      req.flash('error_msg', 'Please fill in all mandatory fields');
      return res.redirect('/auth/register');
    }

    if (password !== confirmPassword) {
      req.flash('error_msg', 'Passwords do not match');
      return res.redirect('/auth/register');
    }

    if (password.length < 6) {
      req.flash('error_msg', 'Password must be at least 6 characters long');
      return res.redirect('/auth/register');
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase().trim() }, { rollNo: rollNo.trim() }],
    });

    if (existingUser) {
      req.flash('error_msg', 'An account with that email or Roll Number already exists.');
      return res.redirect('/auth/register');
    }

    const newUser = new User({
      name,
      email: email.toLowerCase().trim(),
      password,
      role: 'student',
      rollNo: rollNo.trim().toUpperCase(),
      department,
      yearOfStudy,
      gender,
      phone,
      emergencyContact: {
        name: emergencyName || '',
        phone: emergencyPhone || '',
      },
    });

    await newUser.save();

    req.session.user = {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      rollNo: newUser.rollNo,
      department: newUser.department,
      gender: newUser.gender,
      phone: newUser.phone,
    };

    req.flash('success_msg', 'Account created successfully! Welcome to your Hostel Portal.');
    res.redirect('/student/dashboard');
  } catch (error) {
    console.error('Registration error:', error);
    req.flash('error_msg', error.message || 'Registration failed.');
    res.redirect('/auth/register');
  }
});

// Quick demo login route for rapid evaluation
router.get('/demo-login/:role', async (req, res) => {
  try {
    const { role } = req.params;
    let user;
    if (role === 'admin' || role === 'warden') {
      user = await User.findOne({ role: { $in: ['admin', 'warden'] } });
    } else {
      user = await User.findOne({ role: 'student' });
    }

    if (!user) {
      req.flash('error_msg', 'No demo accounts found. Please run seed script first.');
      return res.redirect('/auth/login');
    }

    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      rollNo: user.rollNo,
      department: user.department,
      gender: user.gender,
      phone: user.phone,
    };

    req.flash('success_msg', `Logged in as Demo ${user.role.toUpperCase()}: ${user.name}`);
    if (user.role === 'admin' || user.role === 'warden') {
      return res.redirect('/admin/dashboard');
    }
    return res.redirect('/student/dashboard');
  } catch (err) {
    console.error(err);
    res.redirect('/auth/login');
  }
});

// GET /auth/logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Error destroying session:', err);
    res.redirect('/auth/login');
  });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Block = require('../models/Block');
const Room = require('../models/Room');
const MessMenu = require('../models/MessMenu');

// GET / — Landing Page
router.get('/', async (req, res) => {
  try {
    const totalBlocks = await Block.countDocuments();
    const rooms = await Room.find();
    let totalBeds = 0;
    let occupiedBeds = 0;
    rooms.forEach((r) => {
      totalBeds += r.capacity || 0;
      occupiedBeds += r.occupiedBeds || 0;
    });

    const availableBeds = Math.max(0, totalBeds - occupiedBeds);

    // Get today's featured meal menu
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[new Date().getDay()];
    const todayMenu = await MessMenu.find({ dayOfWeek: currentDay });

    res.render('index', {
      title: 'Hostel Room Allotment & Mess Management Portal',
      stats: {
        totalBlocks: totalBlocks || 3,
        totalRooms: rooms.length || 24,
        totalBeds: totalBeds || 56,
        availableBeds: availableBeds || 18,
      },
      todayMenu,
      currentDay,
    });
  } catch (err) {
    console.error('Landing page error:', err);
    res.render('index', {
      title: 'Hostel Room Allotment & Mess Management Portal',
      stats: { totalBlocks: 3, totalRooms: 24, totalBeds: 56, availableBeds: 18 },
      todayMenu: [],
      currentDay: 'Today',
    });
  }
});

// Convenience redirects
router.get('/login', (req, res) => res.redirect('/auth/login'));
router.get('/register', (req, res) => res.redirect('/auth/register'));
router.get('/logout', (req, res) => res.redirect('/auth/logout'));

module.exports = router;

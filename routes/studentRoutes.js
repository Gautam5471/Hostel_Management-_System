const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Block = require('../models/Block');
const Room = require('../models/Room');
const Allotment = require('../models/Allotment');
const RoomRequest = require('../models/RoomRequest');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const MessMenu = require('../models/MessMenu');
const MessFeedback = require('../models/MessFeedback');
const MessLeave = require('../models/MessLeave');
const MessBill = require('../models/MessBill');
const { ensureAuthenticated, ensureStudent } = require('../middleware/auth');

// Apply auth & student guard to all routes
router.use(ensureAuthenticated, ensureStudent);

// GET /student/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const studentId = req.session.user._id;

    // Fetch active allotment
    const activeAllotment = await Allotment.findOne({
      student: studentId,
      status: 'Active',
    }).populate({
      path: 'room',
      populate: { path: 'block' },
    });

    // If student has a room, find roommates
    let roommates = [];
    if (activeAllotment && activeAllotment.room) {
      const otherAllotments = await Allotment.find({
        room: activeAllotment.room._id,
        status: 'Active',
        student: { $ne: studentId },
      }).populate('student', 'name rollNo department yearOfStudy phone email');
      roommates = otherAllotments.map((a) => a.student).filter(Boolean);
    }

    // Recent room requests
    const recentRequests = await RoomRequest.find({ student: studentId })
      .populate('preferredBlock targetRoom currentRoom')
      .sort({ createdAt: -1 })
      .limit(3);

    // Active maintenance tickets
    const activeTickets = await MaintenanceRequest.find({
      student: studentId,
      status: { $in: ['Reported', 'In Progress'] },
    }).sort({ createdAt: -1 });

    // Today's mess menu
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[new Date().getDay()];
    const todayMenu = await MessMenu.find({ dayOfWeek: currentDay }).sort({
      mealType: 1,
    });

    // Latest unpaid mess bill
    const latestBill = await MessBill.findOne({ student: studentId }).sort({ year: -1, createdAt: -1 });

    // Stats summary
    const stats = {
      hasRoom: !!activeAllotment,
      pendingRequestsCount: await RoomRequest.countDocuments({ student: studentId, status: 'Pending' }),
      activeTicketsCount: activeTickets.length,
      unpaidBillsCount: await MessBill.countDocuments({ student: studentId, status: 'Unpaid' }),
    };

    res.render('student/dashboard', {
      title: 'Student Dashboard | Hostel Portal',
      activeAllotment,
      roommates,
      recentRequests,
      activeTickets,
      todayMenu,
      currentDay,
      latestBill,
      stats,
    });
  } catch (err) {
    console.error('Student Dashboard error:', err);
    req.flash('error_msg', 'Failed to load dashboard data');
    res.redirect('/auth/login');
  }
});

// GET /student/rooms — Browse all rooms
router.get('/rooms', async (req, res) => {
  try {
    const { block, type, ac, status } = req.query;
    const filter = {};

    if (block && block !== 'all') {
      filter.block = block;
    }
    if (type && type !== 'all') {
      filter.roomType = type;
    }
    if (ac && ac !== 'all') {
      filter.isAc = ac === 'true';
    }
    if (status && status !== 'all') {
      filter.status = status;
    }

    const rooms = await Room.find(filter).populate('block').sort({ roomNumber: 1 });
    const blocks = await Block.find().sort({ name: 1 });

    // Check if student already has active allotment or pending request
    const studentId = req.session.user._id;
    const activeAllotment = await Allotment.findOne({ student: studentId, status: 'Active' });
    const pendingRequest = await RoomRequest.findOne({ student: studentId, status: 'Pending' });

    res.render('student/rooms-browse', {
      title: 'Browse Hostel Rooms | Hostel Portal',
      rooms,
      blocks,
      selectedFilters: { block, type, ac, status },
      hasRoom: !!activeAllotment,
      pendingRequest,
    });
  } catch (err) {
    console.error('Browse Rooms error:', err);
    req.flash('error_msg', 'Failed to load rooms');
    res.redirect('/student/dashboard');
  }
});

// POST /student/rooms/request — Request room allotment
router.post('/rooms/request', async (req, res) => {
  try {
    const studentId = req.session.user._id;
    const { preferredBlock, preferredRoomType, targetRoom, reason } = req.body;

    // Check if student already has an active room
    const activeAllotment = await Allotment.findOne({ student: studentId, status: 'Active' });
    if (activeAllotment) {
      req.flash('error_msg', 'You already have an active room allotment. Please use the Room Change option.');
      return res.redirect('/student/my-room');
    }

    // Check if there's already a pending request
    const existingPending = await RoomRequest.findOne({
      student: studentId,
      status: 'Pending',
    });

    if (existingPending) {
      req.flash('error_msg', 'You already have a pending room request under review.');
      return res.redirect('/student/dashboard');
    }

    if (!reason || reason.trim().length < 5) {
      req.flash('error_msg', 'Please provide a valid reason for your room request.');
      return res.redirect('/student/rooms');
    }

    const newRequest = new RoomRequest({
      student: studentId,
      requestType: 'New Allotment',
      preferredBlock: preferredBlock || null,
      preferredRoomType: preferredRoomType || 'Any',
      targetRoom: targetRoom || null,
      reason: reason.trim(),
      status: 'Pending',
    });

    await newRequest.save();

    req.flash('success_msg', 'Room allotment request submitted successfully! Warden will review shortly.');
    res.redirect('/student/dashboard');
  } catch (err) {
    console.error('Room Request error:', err);
    req.flash('error_msg', 'Failed to submit room request');
    res.redirect('/student/rooms');
  }
});

// GET /student/my-room — Room details, roommates, change/vacate forms
router.get('/my-room', async (req, res) => {
  try {
    const studentId = req.session.user._id;
    const activeAllotment = await Allotment.findOne({
      student: studentId,
      status: 'Active',
    }).populate({
      path: 'room',
      populate: { path: 'block' },
    });

    let roommates = [];
    if (activeAllotment && activeAllotment.room) {
      const otherAllotments = await Allotment.find({
        room: activeAllotment.room._id,
        status: 'Active',
        student: { $ne: studentId },
      }).populate('student', 'name rollNo department yearOfStudy phone email gender');
      roommates = otherAllotments.map((a) => ({
        ...a.student.toObject(),
        bedNumber: a.bedNumber,
        allottedDate: a.allottedDate,
      }));
    }

    const pendingRequests = await RoomRequest.find({
      student: studentId,
      status: 'Pending',
    }).populate('preferredBlock targetRoom');

    const blocks = await Block.find().sort({ name: 1 });
    const availableRooms = await Room.find({ status: 'Available' }).populate('block').sort({ roomNumber: 1 });

    res.render('student/my-room', {
      title: 'My Hostel Room | Hostel Portal',
      activeAllotment,
      roommates,
      pendingRequests,
      blocks,
      availableRooms,
    });
  } catch (err) {
    console.error('My Room error:', err);
    req.flash('error_msg', 'Failed to load room details');
    res.redirect('/student/dashboard');
  }
});

// POST /student/room-change — Raise room change request
router.post('/room-change', async (req, res) => {
  try {
    const studentId = req.session.user._id;
    const { preferredBlock, preferredRoomType, targetRoom, reason } = req.body;

    const activeAllotment = await Allotment.findOne({ student: studentId, status: 'Active' });
    if (!activeAllotment) {
      req.flash('error_msg', 'You do not have an active room allotment to change.');
      return res.redirect('/student/rooms');
    }

    const pendingReq = await RoomRequest.findOne({ student: studentId, status: 'Pending' });
    if (pendingReq) {
      req.flash('error_msg', 'You already have a pending request awaiting warden approval.');
      return res.redirect('/student/my-room');
    }

    const newRequest = new RoomRequest({
      student: studentId,
      requestType: 'Room Change',
      currentRoom: activeAllotment.room,
      preferredBlock: preferredBlock || null,
      preferredRoomType: preferredRoomType || 'Any',
      targetRoom: targetRoom || null,
      reason: reason.trim(),
      status: 'Pending',
    });

    await newRequest.save();
    req.flash('success_msg', 'Room change request submitted. You will be notified once reviewed.');
    res.redirect('/student/my-room');
  } catch (err) {
    console.error('Room Change error:', err);
    req.flash('error_msg', 'Could not submit room change request');
    res.redirect('/student/my-room');
  }
});

// POST /student/vacate — Raise vacate request
router.post('/vacate', async (req, res) => {
  try {
    const studentId = req.session.user._id;
    const { reason } = req.body;

    const activeAllotment = await Allotment.findOne({ student: studentId, status: 'Active' });
    if (!activeAllotment) {
      req.flash('error_msg', 'You do not have an active room allotment.');
      return res.redirect('/student/dashboard');
    }

    const pendingReq = await RoomRequest.findOne({ student: studentId, status: 'Pending' });
    if (pendingReq) {
      req.flash('error_msg', 'You have a pending request awaiting processing.');
      return res.redirect('/student/my-room');
    }

    const vacateReq = new RoomRequest({
      student: studentId,
      requestType: 'Vacate',
      currentRoom: activeAllotment.room,
      reason: reason ? reason.trim() : 'Vacating hostel premises',
      status: 'Pending',
    });

    await vacateReq.save();
    req.flash('success_msg', 'Vacate request submitted. Warden clearance and bed release will be processed.');
    res.redirect('/student/my-room');
  } catch (err) {
    console.error('Vacate error:', err);
    req.flash('error_msg', 'Failed to submit vacate request');
    res.redirect('/student/my-room');
  }
});

// GET /student/maintenance — Maintenance complaints
router.get('/maintenance', async (req, res) => {
  try {
    const studentId = req.session.user._id;
    const activeAllotment = await Allotment.findOne({
      student: studentId,
      status: 'Active',
    }).populate('room');

    const requests = await MaintenanceRequest.find({ student: studentId })
      .populate({
        path: 'room',
        populate: { path: 'block' },
      })
      .sort({ createdAt: -1 });

    res.render('student/maintenance', {
      title: 'Maintenance & Complaints | Hostel Portal',
      requests,
      activeAllotment,
    });
  } catch (err) {
    console.error('Maintenance error:', err);
    req.flash('error_msg', 'Failed to load maintenance requests');
    res.redirect('/student/dashboard');
  }
});

// POST /student/maintenance — Submit maintenance ticket
router.post('/maintenance', async (req, res) => {
  try {
    const studentId = req.session.user._id;
    const { category, priority, title, description } = req.body;

    const activeAllotment = await Allotment.findOne({ student: studentId, status: 'Active' });
    if (!activeAllotment) {
      req.flash('error_msg', 'You must have an active room allotment to lodge a room maintenance request.');
      return res.redirect('/student/maintenance');
    }

    if (!title || !description || !category) {
      req.flash('error_msg', 'Please fill in all complaint details.');
      return res.redirect('/student/maintenance');
    }

    const ticket = new MaintenanceRequest({
      student: studentId,
      room: activeAllotment.room,
      category,
      priority: priority || 'Medium',
      title: title.trim(),
      description: description.trim(),
      status: 'Reported',
    });

    await ticket.save();
    req.flash('success_msg', 'Maintenance ticket submitted successfully. Technician assigned.');
    res.redirect('/student/maintenance');
  } catch (err) {
    console.error('Create Maintenance error:', err);
    req.flash('error_msg', 'Failed to create maintenance ticket');
    res.redirect('/student/maintenance');
  }
});

// GET /student/mess-menu — Weekly interactive mess menu
router.get('/mess-menu', async (req, res) => {
  try {
    const allMenuItems = await MessMenu.find().sort({ mealType: 1 });
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const currentDayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];

    const menuByDay = {};
    days.forEach((d) => {
      menuByDay[d] = allMenuItems.filter((item) => item.dayOfWeek === d);
    });

    res.render('student/mess-menu', {
      title: 'Hostel Mess Menu | Hostel Portal',
      days,
      currentDayName,
      menuByDay,
    });
  } catch (err) {
    console.error('Mess Menu error:', err);
    req.flash('error_msg', 'Failed to load mess menu');
    res.redirect('/student/dashboard');
  }
});

// GET /student/mess-feedback & POST
router.get('/mess-feedback', async (req, res) => {
  try {
    const studentId = req.session.user._id;
    const feedbacks = await MessFeedback.find({ student: studentId }).sort({ createdAt: -1 }).limit(15);

    res.render('student/mess-feedback', {
      title: 'Meal Feedback & Ratings | Hostel Portal',
      feedbacks,
    });
  } catch (err) {
    console.error('Mess Feedback error:', err);
    req.flash('error_msg', 'Failed to load feedback');
    res.redirect('/student/dashboard');
  }
});

router.post('/mess-feedback', async (req, res) => {
  try {
    const studentId = req.session.user._id;
    const { mealDate, mealType, rating, category, comments } = req.body;

    if (!mealType || !rating) {
      req.flash('error_msg', 'Please provide a meal type and star rating.');
      return res.redirect('/student/mess-feedback');
    }

    const feedback = new MessFeedback({
      student: studentId,
      mealDate: mealDate ? new Date(mealDate) : new Date(),
      mealType,
      rating: parseInt(rating, 10),
      category: category || 'Taste & Quality',
      comments: comments ? comments.trim() : '',
    });

    await feedback.save();
    req.flash('success_msg', 'Thank you! Your meal rating and review have been recorded.');
    res.redirect('/student/mess-feedback');
  } catch (err) {
    console.error('Submit Feedback error:', err);
    req.flash('error_msg', 'Failed to submit feedback');
    res.redirect('/student/mess-feedback');
  }
});

// Alias for /student/feedback
router.get('/feedback', (req, res) => res.redirect('/student/mess-feedback'));
router.post('/feedback', (req, res) => res.redirect(307, '/student/mess-feedback'));

// GET /student/mess-leave & POST
router.get('/mess-leave', async (req, res) => {
  try {
    const studentId = req.session.user._id;
    const leaves = await MessLeave.find({ student: studentId }).sort({ createdAt: -1 });

    res.render('student/mess-leave', {
      title: 'Mess Rebate & Leave | Hostel Portal',
      leaves,
    });
  } catch (err) {
    console.error('Mess Leave error:', err);
    req.flash('error_msg', 'Failed to load mess leave records');
    res.redirect('/student/dashboard');
  }
});

router.post('/mess-leave', async (req, res) => {
  try {
    const studentId = req.session.user._id;
    const { startDate, endDate, reason } = req.body;

    if (!startDate || !endDate || !reason) {
      req.flash('error_msg', 'Please provide start date, end date, and reason for absence.');
      return res.redirect('/student/mess-leave');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      req.flash('error_msg', 'End date cannot be prior to start date.');
      return res.redirect('/student/mess-leave');
    }

    const diffTime = Math.abs(end - start);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const leave = new MessLeave({
      student: studentId,
      startDate: start,
      endDate: end,
      totalDays,
      reason: reason.trim(),
      status: 'Approved', // Auto-approved for mess rebate calculation
    });

    await leave.save();
    req.flash('success_msg', `Mess leave logged for ${totalDays} day(s). Rebate will be factored into your next bill!`);
    res.redirect('/student/mess-leave');
  } catch (err) {
    console.error('Mess Leave submit error:', err);
    req.flash('error_msg', 'Failed to submit mess leave');
    res.redirect('/student/mess-leave');
  }
});

// GET /student/bills — Monthly Mess Bills & Receipts
router.get('/bills', async (req, res) => {
  try {
    const studentId = req.session.user._id;
    const bills = await MessBill.find({ student: studentId }).sort({ year: -1, createdAt: -1 });

    res.render('student/mess-bills', {
      title: 'Monthly Mess Bills & Invoices | Hostel Portal',
      bills,
    });
  } catch (err) {
    console.error('Mess Bills error:', err);
    req.flash('error_msg', 'Failed to load mess bills');
    res.redirect('/student/dashboard');
  }
});

// POST /student/bills/:id/pay — Pay mess bill (simulated payment)
router.post('/bills/:id/pay', async (req, res) => {
  try {
    const studentId = req.session.user._id;
    const bill = await MessBill.findOne({ _id: req.params.id, student: studentId });

    if (!bill) {
      req.flash('error_msg', 'Bill record not found');
      return res.redirect('/student/bills');
    }

    if (bill.status === 'Paid') {
      req.flash('info_msg', 'This bill has already been settled.');
      return res.redirect('/student/bills');
    }

    bill.status = 'Paid';
    bill.paidAt = new Date();
    bill.transactionId = 'TXN-' + Math.floor(10000000 + Math.random() * 90000000);
    await bill.save();

    req.flash('success_msg', `Payment successful! Transaction ID: ${bill.transactionId}`);
    res.redirect('/student/bills');
  } catch (err) {
    console.error('Pay Bill error:', err);
    req.flash('error_msg', 'Payment transaction failed');
    res.redirect('/student/bills');
  }
});

module.exports = router;

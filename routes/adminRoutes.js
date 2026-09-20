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
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');

// Apply auth & admin guard to all routes
router.use(ensureAuthenticated, ensureAdmin);

// GET /admin/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const totalRooms = await Room.countDocuments();
    const rooms = await Room.find().populate('block');

    let totalBeds = 0;
    let occupiedBeds = 0;
    rooms.forEach((r) => {
      totalBeds += r.capacity || 0;
      occupiedBeds += r.occupiedBeds || 0;
    });

    const availableBeds = Math.max(0, totalBeds - occupiedBeds);
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    const totalStudents = await User.countDocuments({ role: 'student' });
    const pendingRequests = await RoomRequest.countDocuments({ status: 'Pending' });
    const activeMaintenance = await MaintenanceRequest.countDocuments({
      status: { $in: ['Reported', 'In Progress'] },
    });

    // Block-wise stats
    const blocks = await Block.find().sort({ name: 1 });
    const blockStats = await Promise.all(
      blocks.map(async (b) => {
        const bRooms = await Room.find({ block: b._id });
        let bTotalBeds = 0;
        let bOccupiedBeds = 0;
        bRooms.forEach((r) => {
          bTotalBeds += r.capacity;
          bOccupiedBeds += r.occupiedBeds;
        });
        return {
          _id: b._id,
          name: b.name,
          genderType: b.genderType,
          totalRooms: bRooms.length,
          totalBeds: bTotalBeds,
          occupiedBeds: bOccupiedBeds,
          availableBeds: Math.max(0, bTotalBeds - bOccupiedBeds),
          rate: bTotalBeds > 0 ? Math.round((bOccupiedBeds / bTotalBeds) * 100) : 0,
        };
      })
    );

    // Recent room requests
    const recentRequests = await RoomRequest.find()
      .populate('student preferredBlock targetRoom currentRoom')
      .sort({ createdAt: -1 })
      .limit(5);

    // Recent maintenance tickets
    const recentMaintenance = await MaintenanceRequest.find()
      .populate('student room')
      .sort({ createdAt: -1 })
      .limit(5);

    // Mess average rating
    const feedbacks = await MessFeedback.find();
    let avgRating = 0;
    if (feedbacks.length > 0) {
      const sum = feedbacks.reduce((acc, f) => acc + f.rating, 0);
      avgRating = (sum / feedbacks.length).toFixed(1);
    }

    res.render('admin/dashboard', {
      title: 'Warden Admin Dashboard | Hostel Management',
      stats: {
        totalRooms,
        totalBeds,
        occupiedBeds,
        availableBeds,
        occupancyRate,
        totalStudents,
        pendingRequests,
        activeMaintenance,
        avgRating,
        totalFeedbackCount: feedbacks.length,
      },
      blockStats,
      recentRequests,
      recentMaintenance,
    });
  } catch (err) {
    console.error('Admin Dashboard error:', err);
    req.flash('error_msg', 'Failed to load admin dashboard');
    res.redirect('/');
  }
});

// GET /admin/blocks — Manage blocks
router.get('/blocks', async (req, res) => {
  try {
    const blocks = await Block.find().sort({ name: 1 });
    const blocksWithStats = await Promise.all(
      blocks.map(async (b) => {
        const rooms = await Room.find({ block: b._id });
        let totalBeds = 0;
        let occupiedBeds = 0;
        rooms.forEach((r) => {
          totalBeds += r.capacity;
          occupiedBeds += r.occupiedBeds;
        });
        return {
          ...b.toObject(),
          roomCount: rooms.length,
          totalBeds,
          occupiedBeds,
          availableBeds: totalBeds - occupiedBeds,
        };
      })
    );

    res.render('admin/blocks', {
      title: 'Hostel Blocks Management | Admin',
      blocks: blocksWithStats,
    });
  } catch (err) {
    console.error('Admin Blocks error:', err);
    req.flash('error_msg', 'Failed to load blocks');
    res.redirect('/admin/dashboard');
  }
});

// POST /admin/blocks — Create block
router.post('/blocks', async (req, res) => {
  try {
    const { name, genderType, totalFloors, description, wardenInCharge, contactNumber } = req.body;

    if (!name) {
      req.flash('error_msg', 'Block name is required');
      return res.redirect('/admin/blocks');
    }

    const existingBlock = await Block.findOne({ name: name.trim() });
    if (existingBlock) {
      req.flash('error_msg', 'A block with this name already exists.');
      return res.redirect('/admin/blocks');
    }

    const block = new Block({
      name: name.trim(),
      genderType: genderType || 'Boys',
      totalFloors: parseInt(totalFloors, 10) || 3,
      description: description || 'Modern hostel block with standard student facilities.',
      wardenInCharge: wardenInCharge || 'Chief Warden',
      contactNumber: contactNumber || '+91 9876543210',
    });

    await block.save();
    req.flash('success_msg', `Hostel Block "${block.name}" created successfully!`);
    res.redirect('/admin/blocks');
  } catch (err) {
    console.error('Create Block error:', err);
    req.flash('error_msg', 'Failed to create block');
    res.redirect('/admin/blocks');
  }
});

// POST /admin/blocks/:id/edit
router.post('/blocks/:id/edit', async (req, res) => {
  try {
    const { name, genderType, totalFloors, description, wardenInCharge, contactNumber } = req.body;
    await Block.findByIdAndUpdate(req.params.id, {
      name: name.trim(),
      genderType,
      totalFloors: parseInt(totalFloors, 10),
      description,
      wardenInCharge,
      contactNumber,
    });
    req.flash('success_msg', 'Block updated successfully');
    res.redirect('/admin/blocks');
  } catch (err) {
    console.error('Update Block error:', err);
    req.flash('error_msg', 'Failed to update block');
    res.redirect('/admin/blocks');
  }
});

// POST /admin/blocks/:id/delete
router.post('/blocks/:id/delete', async (req, res) => {
  try {
    const roomsCount = await Room.countDocuments({ block: req.params.id });
    if (roomsCount > 0) {
      req.flash('error_msg', 'Cannot delete block containing rooms. Please delete or reassign rooms first.');
      return res.redirect('/admin/blocks');
    }

    await Block.findByIdAndDelete(req.params.id);
    req.flash('success_msg', 'Hostel block deleted.');
    res.redirect('/admin/blocks');
  } catch (err) {
    console.error('Delete Block error:', err);
    req.flash('error_msg', 'Failed to delete block');
    res.redirect('/admin/blocks');
  }
});

// GET /admin/rooms — Manage Rooms
router.get('/rooms', async (req, res) => {
  try {
    const { block, type, status } = req.query;
    const filter = {};
    if (block && block !== 'all') filter.block = block;
    if (type && type !== 'all') filter.roomType = type;
    if (status && status !== 'all') filter.status = status;

    const rooms = await Room.find(filter).populate('block').sort({ roomNumber: 1 });
    const blocks = await Block.find().sort({ name: 1 });

    // Fetch active occupants for each room
    const roomsWithOccupants = await Promise.all(
      rooms.map(async (r) => {
        const allotments = await Allotment.find({ room: r._id, status: 'Active' }).populate(
          'student',
          'name rollNo department phone'
        );
        return {
          ...r.toObject(),
          occupants: allotments.map((a) => a.student).filter(Boolean),
        };
      })
    );

    res.render('admin/rooms', {
      title: 'Rooms Directory & Management | Admin',
      rooms: roomsWithOccupants,
      blocks,
      selectedFilters: { block, type, status },
    });
  } catch (err) {
    console.error('Admin Rooms error:', err);
    req.flash('error_msg', 'Failed to load rooms');
    res.redirect('/admin/dashboard');
  }
});

// POST /admin/rooms — Create room
router.post('/rooms', async (req, res) => {
  try {
    const { block, roomNumber, floor, roomType, capacity, pricePerMonth, isAc, hasAttachedBathroom, amenities } = req.body;

    if (!block || !roomNumber || !capacity) {
      req.flash('error_msg', 'Please fill in all mandatory room fields.');
      return res.redirect('/admin/rooms');
    }

    const existingRoom = await Room.findOne({ block, roomNumber: roomNumber.trim() });
    if (existingRoom) {
      req.flash('error_msg', `Room ${roomNumber} already exists in this block.`);
      return res.redirect('/admin/rooms');
    }

    const parsedAmenities = amenities
      ? amenities.split(',').map((item) => item.trim()).filter(Boolean)
      : ['High-speed Wi-Fi', 'Study Table & Chair', 'Wardrobe'];

    const room = new Room({
      block,
      roomNumber: roomNumber.trim(),
      floor: parseInt(floor, 10) || 1,
      roomType: roomType || 'Double',
      capacity: parseInt(capacity, 10),
      occupiedBeds: 0,
      pricePerMonth: parseFloat(pricePerMonth) || 6000,
      isAc: isAc === 'true' || isAc === 'on',
      hasAttachedBathroom: hasAttachedBathroom === 'true' || hasAttachedBathroom === 'on',
      amenities: parsedAmenities,
      status: 'Available',
    });

    await room.save();
    req.flash('success_msg', `Room ${room.roomNumber} created successfully!`);
    res.redirect('/admin/rooms');
  } catch (err) {
    console.error('Create Room error:', err);
    req.flash('error_msg', err.message || 'Failed to create room');
    res.redirect('/admin/rooms');
  }
});

// POST /admin/rooms/:id/edit — Edit room
router.post('/rooms/:id/edit', async (req, res) => {
  try {
    const { roomNumber, floor, roomType, capacity, pricePerMonth, isAc, hasAttachedBathroom, status, amenities } = req.body;
    const room = await Room.findById(req.params.id);
    if (!room) {
      req.flash('error_msg', 'Room not found');
      return res.redirect('/admin/rooms');
    }

    const newCap = parseInt(capacity, 10);
    if (newCap < room.occupiedBeds) {
      req.flash('error_msg', `Cannot set capacity to ${newCap} because ${room.occupiedBeds} beds are currently occupied.`);
      return res.redirect('/admin/rooms');
    }

    room.roomNumber = roomNumber.trim();
    room.floor = parseInt(floor, 10) || room.floor;
    room.roomType = roomType || room.roomType;
    room.capacity = newCap;
    room.pricePerMonth = parseFloat(pricePerMonth) || room.pricePerMonth;
    room.isAc = isAc === 'true' || isAc === 'on';
    room.hasAttachedBathroom = hasAttachedBathroom === 'true' || hasAttachedBathroom === 'on';
    if (status) room.status = status;
    if (amenities) {
      room.amenities = amenities.split(',').map((a) => a.trim()).filter(Boolean);
    }

    await room.save();
    req.flash('success_msg', `Room ${room.roomNumber} updated successfully.`);
    res.redirect('/admin/rooms');
  } catch (err) {
    console.error('Update Room error:', err);
    req.flash('error_msg', 'Failed to update room');
    res.redirect('/admin/rooms');
  }
});

// POST /admin/rooms/:id/delete
router.post('/rooms/:id/delete', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      req.flash('error_msg', 'Room not found');
      return res.redirect('/admin/rooms');
    }

    if (room.occupiedBeds > 0) {
      req.flash('error_msg', 'Cannot delete an occupied room. Please vacate students first.');
      return res.redirect('/admin/rooms');
    }

    await Room.findByIdAndDelete(req.params.id);
    req.flash('success_msg', `Room ${room.roomNumber} has been removed.`);
    res.redirect('/admin/rooms');
  } catch (err) {
    console.error('Delete Room error:', err);
    req.flash('error_msg', 'Failed to delete room');
    res.redirect('/admin/rooms');
  }
});

// GET /admin/requests — Review room requests (Allotment, Change, Vacate)
router.get('/requests', async (req, res) => {
  try {
    const { status, type } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (type && type !== 'all') filter.requestType = type;

    const requests = await RoomRequest.find(filter)
      .populate('student')
      .populate('preferredBlock')
      .populate({ path: 'targetRoom', populate: { path: 'block' } })
      .populate({ path: 'currentRoom', populate: { path: 'block' } })
      .sort({ createdAt: -1 });

    const availableRooms = await Room.find({ status: 'Available' }).populate('block').sort({ roomNumber: 1 });

    res.render('admin/requests', {
      title: 'Room Allotment & Change Requests | Admin',
      requests,
      availableRooms,
      selectedFilters: { status, type },
    });
  } catch (err) {
    console.error('Admin Requests error:', err);
    req.flash('error_msg', 'Failed to load requests');
    res.redirect('/admin/dashboard');
  }
});

// POST /admin/requests/:id/approve — Smart allotment approval engine with capacity guard
router.post('/requests/:id/approve', async (req, res) => {
  try {
    const { assignedRoomId, adminRemarks } = req.body;
    const request = await RoomRequest.findById(req.params.id).populate('student');

    if (!request || request.status !== 'Pending') {
      req.flash('error_msg', 'Request not found or has already been processed.');
      return res.redirect('/admin/requests');
    }

    const studentId = request.student._id;

    // 1. ALLOTMENT or ROOM CHANGE
    if (request.requestType === 'New Allotment' || request.requestType === 'Room Change') {
      const targetRoomId = assignedRoomId || request.targetRoom;
      if (!targetRoomId) {
        req.flash('error_msg', 'Please select a room to assign to the student.');
        return res.redirect('/admin/requests');
      }

      const room = await Room.findById(targetRoomId);
      if (!room) {
        req.flash('error_msg', 'Selected room not found');
        return res.redirect('/admin/requests');
      }

      // CAPACITY ENFORCEMENT CHECK:
      if (room.occupiedBeds >= room.capacity) {
        req.flash('error_msg', `Capacity Error: Room ${room.roomNumber} is full (${room.occupiedBeds}/${room.capacity} beds). Cannot allot beyond capacity.`);
        return res.redirect('/admin/requests');
      }

      // If it is a Room Change, free up previous room bed
      if (request.requestType === 'Room Change' && request.currentRoom) {
        const previousRoom = await Room.findById(request.currentRoom);
        if (previousRoom && previousRoom.occupiedBeds > 0) {
          previousRoom.occupiedBeds = Math.max(0, previousRoom.occupiedBeds - 1);
          await previousRoom.save();
        }
        await Allotment.updateMany(
          { student: studentId, status: 'Active' },
          { status: 'Transferred', vacatedDate: new Date() }
        );
      }

      // Increment target room occupancy
      room.occupiedBeds += 1;
      await room.save();

      // Find lowest available bed number
      const existingAllotments = await Allotment.find({ room: room._id, status: 'Active' });
      const takenBeds = existingAllotments.map((a) => a.bedNumber);
      let assignedBed = 1;
      for (let i = 1; i <= room.capacity; i++) {
        if (!takenBeds.includes(i)) {
          assignedBed = i;
          break;
        }
      }

      // Create new active allotment
      const newAllotment = new Allotment({
        student: studentId,
        room: room._id,
        bedNumber: assignedBed,
        status: 'Active',
        allottedDate: new Date(),
        remarks: adminRemarks || `Approved by Admin (${request.requestType})`,
      });
      await newAllotment.save();

      // Update student user record
      await User.findByIdAndUpdate(studentId, {
        currentAllotment: newAllotment._id,
        currentRoom: room._id,
      });

      // Update request status
      request.status = 'Approved';
      request.adminRemarks = adminRemarks || `Assigned to Room ${room.roomNumber} (Bed ${assignedBed})`;
      request.targetRoom = room._id;
      request.reviewedBy = req.session.user._id;
      request.reviewedAt = new Date();
      await request.save();

      req.flash('success_msg', `Approved! Student ${request.student.name} assigned to Room ${room.roomNumber} (Bed ${assignedBed}).`);
      return res.redirect('/admin/requests');
    }

    // 2. VACATE REQUEST: Free up the bed immediately
    if (request.requestType === 'Vacate') {
      const activeAllotment = await Allotment.findOne({ student: studentId, status: 'Active' });
      if (activeAllotment) {
        activeAllotment.status = 'Vacated';
        activeAllotment.vacatedDate = new Date();
        activeAllotment.remarks = adminRemarks || 'Vacated by warden approval';
        await activeAllotment.save();

        const room = await Room.findById(activeAllotment.room);
        if (room && room.occupiedBeds > 0) {
          room.occupiedBeds = Math.max(0, room.occupiedBeds - 1);
          await room.save();
        }
      }

      // Clear student's current room references
      await User.findByIdAndUpdate(studentId, {
        currentAllotment: null,
        currentRoom: null,
      });

      request.status = 'Approved';
      request.adminRemarks = adminRemarks || 'Checkout approved. Room bed freed.';
      request.reviewedBy = req.session.user._id;
      request.reviewedAt = new Date();
      await request.save();

      req.flash('success_msg', `Vacate request approved for ${request.student.name}. Bed released.`);
      return res.redirect('/admin/requests');
    }
  } catch (err) {
    console.error('Approve Request error:', err);
    req.flash('error_msg', 'Failed to approve request: ' + err.message);
    res.redirect('/admin/requests');
  }
});

// POST /admin/requests/:id/reject — Reject request
router.post('/requests/:id/reject', async (req, res) => {
  try {
    const { adminRemarks } = req.body;
    const request = await RoomRequest.findById(req.params.id);
    if (!request) {
      req.flash('error_msg', 'Request not found');
      return res.redirect('/admin/requests');
    }

    request.status = 'Rejected';
    request.adminRemarks = adminRemarks || 'Request could not be accommodated at this time.';
    request.reviewedBy = req.session.user._id;
    request.reviewedAt = new Date();
    await request.save();

    req.flash('info_msg', 'Room request was rejected.');
    res.redirect('/admin/requests');
  } catch (err) {
    console.error('Reject Request error:', err);
    req.flash('error_msg', 'Failed to reject request');
    res.redirect('/admin/requests');
  }
});

// GET /admin/allotments — View all active/past allotments
router.get('/allotments', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;

    const allotments = await Allotment.find(filter)
      .populate('student')
      .populate({ path: 'room', populate: { path: 'block' } })
      .sort({ createdAt: -1 });

    res.render('admin/allotments', {
      title: 'Hostel Room Allotments Directory | Admin',
      allotments,
      selectedStatus: status || 'all',
    });
  } catch (err) {
    console.error('Admin Allotments error:', err);
    req.flash('error_msg', 'Failed to load allotments');
    res.redirect('/admin/dashboard');
  }
});

// POST /admin/allotments/:id/vacate — Direct manual vacate action
router.post('/allotments/:id/vacate', async (req, res) => {
  try {
    const allotment = await Allotment.findById(req.params.id);
    if (!allotment || allotment.status !== 'Active') {
      req.flash('error_msg', 'Active allotment not found');
      return res.redirect('/admin/allotments');
    }

    allotment.status = 'Vacated';
    allotment.vacatedDate = new Date();
    allotment.remarks = 'Manually vacated by Warden';
    await allotment.save();

    // Decrement room occupancy and free bed
    const room = await Room.findById(allotment.room);
    if (room && room.occupiedBeds > 0) {
      room.occupiedBeds = Math.max(0, room.occupiedBeds - 1);
      await room.save();
    }

    // Clear user active room
    await User.findByIdAndUpdate(allotment.student, {
      currentAllotment: null,
      currentRoom: null,
    });

    req.flash('success_msg', 'Student vacated successfully. Bed occupancy updated.');
    res.redirect('/admin/allotments');
  } catch (err) {
    console.error('Direct Vacate error:', err);
    req.flash('error_msg', 'Failed to process vacation');
    res.redirect('/admin/allotments');
  }
});

// GET /admin/maintenance — Manage student complaints
router.get('/maintenance', async (req, res) => {
  try {
    const { status, priority, category } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (priority && priority !== 'all') filter.priority = priority;
    if (category && category !== 'all') filter.category = category;

    const tickets = await MaintenanceRequest.find(filter)
      .populate('student')
      .populate({ path: 'room', populate: { path: 'block' } })
      .sort({ createdAt: -1 });

    res.render('admin/maintenance', {
      title: 'Hostel Maintenance Helpdesk | Admin',
      tickets,
      selectedFilters: { status, priority, category },
    });
  } catch (err) {
    console.error('Admin Maintenance error:', err);
    req.flash('error_msg', 'Failed to load maintenance tickets');
    res.redirect('/admin/dashboard');
  }
});

// POST /admin/maintenance/:id/update
router.post('/maintenance/:id/update', async (req, res) => {
  try {
    const { status, assignedTechnician, resolutionNotes } = req.body;
    const ticket = await MaintenanceRequest.findById(req.params.id);

    if (!ticket) {
      req.flash('error_msg', 'Ticket not found');
      return res.redirect('/admin/maintenance');
    }

    ticket.status = status || ticket.status;
    ticket.assignedTechnician = assignedTechnician || ticket.assignedTechnician;
    ticket.resolutionNotes = resolutionNotes !== undefined ? resolutionNotes : ticket.resolutionNotes;
    if (status === 'Resolved' || status === 'Closed') {
      ticket.resolvedAt = new Date();
    }
    await ticket.save();

    req.flash('success_msg', `Ticket #${ticket._id.toString().slice(-6).toUpperCase()} updated.`);
    res.redirect('/admin/maintenance');
  } catch (err) {
    console.error('Update Maintenance error:', err);
    req.flash('error_msg', 'Failed to update ticket');
    res.redirect('/admin/maintenance');
  }
});

// GET /admin/mess-menu & POST /admin/mess-menu — Publish weekly menu
router.get('/mess-menu', async (req, res) => {
  try {
    const menuItems = await MessMenu.find().sort({ dayOfWeek: 1, mealType: 1 });
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const meals = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];

    res.render('admin/mess-menu-manage', {
      title: 'Publish Weekly Mess Menu | Admin',
      menuItems,
      days,
      meals,
    });
  } catch (err) {
    console.error('Admin Mess Menu error:', err);
    req.flash('error_msg', 'Failed to load mess menu');
    res.redirect('/admin/dashboard');
  }
});

router.post('/mess-menu', async (req, res) => {
  try {
    const { dayOfWeek, mealType, items, timings, dietaryType, isSpecial, nutritionHighlight } = req.body;

    if (!dayOfWeek || !mealType || !items) {
      req.flash('error_msg', 'Please provide day, meal type, and menu items.');
      return res.redirect('/admin/mess-menu');
    }

    const itemsArray = items.split(',').map((i) => i.trim()).filter(Boolean);

    await MessMenu.findOneAndUpdate(
      { dayOfWeek, mealType },
      {
        dayOfWeek,
        mealType,
        items: itemsArray,
        timings: timings || 'Standard Timing',
        dietaryType: dietaryType || 'Pure Veg',
        isSpecial: isSpecial === 'true' || isSpecial === 'on',
        nutritionHighlight: nutritionHighlight || '',
        updatedBy: req.session.user.name,
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    req.flash('success_msg', `Menu for ${dayOfWeek} ${mealType} updated successfully!`);
    res.redirect('/admin/mess-menu');
  } catch (err) {
    console.error('Save Mess Menu error:', err);
    req.flash('error_msg', 'Failed to save menu');
    res.redirect('/admin/mess-menu');
  }
});

// GET /admin/mess-feedback — View student ratings & reviews
router.get('/mess-feedback', async (req, res) => {
  try {
    const feedbacks = await MessFeedback.find()
      .populate('student', 'name rollNo department')
      .sort({ createdAt: -1 });

    let avgRating = 0;
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    if (feedbacks.length > 0) {
      const sum = feedbacks.reduce((acc, f) => {
        ratingDistribution[f.rating] = (ratingDistribution[f.rating] || 0) + 1;
        return acc + f.rating;
      }, 0);
      avgRating = (sum / feedbacks.length).toFixed(1);
    }

    res.render('admin/mess-feedback-view', {
      title: 'Mess Feedback & Quality Analytics | Admin',
      feedbacks,
      avgRating,
      ratingDistribution,
      totalCount: feedbacks.length,
    });
  } catch (err) {
    console.error('Admin Feedback error:', err);
    req.flash('error_msg', 'Failed to load feedback');
    res.redirect('/admin/dashboard');
  }
});

// GET /admin/mess-bills & POST /admin/mess-bills/generate — Stretch Goal: Automated billing engine
router.get('/mess-bills', async (req, res) => {
  try {
    const { month, year, status } = req.query;
    const currentYear = new Date().getFullYear();
    const filter = {};
    if (month && month !== 'all') filter.month = month;
    if (year && year !== 'all') filter.year = parseInt(year, 10);
    if (status && status !== 'all') filter.status = status;

    const bills = await MessBill.find(filter)
      .populate('student', 'name rollNo department phone')
      .sort({ createdAt: -1 });

    const students = await User.find({ role: 'student' }).sort({ name: 1 });

    res.render('admin/mess-bills-manage', {
      title: 'Monthly Mess Bills Management | Admin',
      bills,
      students,
      currentYear,
      selectedFilters: { month, year, status },
    });
  } catch (err) {
    console.error('Admin Bills error:', err);
    req.flash('error_msg', 'Failed to load bills');
    res.redirect('/admin/dashboard');
  }
});

// POST /admin/mess-bills/generate — Generate monthly mess bills with rebate deductions
router.post('/mess-bills/generate', async (req, res) => {
  try {
    const { month, year, dailyRate, totalDaysInMonth, utilityCharge, studentOption, singleStudentId } = req.body;

    const numDays = parseInt(totalDaysInMonth, 10) || 30;
    const rate = parseFloat(dailyRate) || 150;
    const utility = parseFloat(utilityCharge) || 250;
    const targetYear = parseInt(year, 10) || new Date().getFullYear();

    let targetStudents = [];
    if (studentOption === 'single' && singleStudentId) {
      targetStudents = await User.find({ _id: singleStudentId, role: 'student' });
    } else {
      targetStudents = await User.find({ role: 'student' });
    }

    if (targetStudents.length === 0) {
      req.flash('error_msg', 'No students found to generate bills for.');
      return res.redirect('/admin/mess-bills');
    }

    let generatedCount = 0;
    let updatedCount = 0;

    for (const student of targetStudents) {
      // Calculate approved absent days for this month/year
      const monthIndex = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ].indexOf(month);

      const startOfMonth = new Date(targetYear, monthIndex, 1);
      const endOfMonth = new Date(targetYear, monthIndex + 1, 0, 23, 59, 59);

      const approvedLeaves = await MessLeave.find({
        student: student._id,
        status: 'Approved',
        startDate: { $lte: endOfMonth },
        endDate: { $gte: startOfMonth },
      });

      let totalAbsentDays = 0;
      approvedLeaves.forEach((leave) => {
        totalAbsentDays += leave.totalDays || 0;
      });

      // Clamp absent days to not exceed total days in month
      const absentDays = Math.min(numDays, totalAbsentDays);
      const presentDays = Math.max(0, numDays - absentDays);

      const baseAmount = numDays * rate;
      const rebateAmount = absentDays * rate;
      const netAmount = baseAmount - rebateAmount + utility;

      // Due date set to 10th of next month
      const dueDate = new Date(targetYear, monthIndex + 1, 10);

      const existingBill = await MessBill.findOne({
        student: student._id,
        month,
        year: targetYear,
      });

      if (existingBill) {
        if (existingBill.status !== 'Paid') {
          existingBill.totalDaysInMonth = numDays;
          existingBill.dailyRate = rate;
          existingBill.absentDays = absentDays;
          existingBill.presentDays = presentDays;
          existingBill.baseAmount = baseAmount;
          existingBill.rebateAmount = rebateAmount;
          existingBill.utilityCharge = utility;
          existingBill.netAmount = netAmount;
          existingBill.dueDate = dueDate;
          await existingBill.save();
          updatedCount++;
        }
      } else {
        const newBill = new MessBill({
          student: student._id,
          month,
          year: targetYear,
          totalDaysInMonth: numDays,
          dailyRate: rate,
          absentDays,
          presentDays,
          baseAmount,
          rebateAmount,
          utilityCharge: utility,
          netAmount,
          status: 'Unpaid',
          dueDate,
        });
        await newBill.save();
        generatedCount++;
      }
    }

    req.flash('success_msg', `Mess billing processed! ${generatedCount} new bills generated, ${updatedCount} existing bills updated.`);
    res.redirect('/admin/mess-bills');
  } catch (err) {
    console.error('Generate Bills error:', err);
    req.flash('error_msg', 'Failed to generate bills: ' + err.message);
    res.redirect('/admin/mess-bills');
  }
});

// POST /admin/mess-bills/:id/status — Toggle bill payment status
router.post('/mess-bills/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const bill = await MessBill.findById(req.params.id);
    if (!bill) {
      req.flash('error_msg', 'Bill not found');
      return res.redirect('/admin/mess-bills');
    }

    bill.status = status;
    if (status === 'Paid') {
      bill.paidAt = new Date();
      if (!bill.transactionId) {
        bill.transactionId = 'MANUAL-' + Math.floor(100000 + Math.random() * 900000);
      }
    } else {
      bill.paidAt = null;
    }

    await bill.save();
    req.flash('success_msg', `Bill marked as ${status}.`);
    res.redirect('/admin/mess-bills');
  } catch (err) {
    console.error('Update Bill Status error:', err);
    req.flash('error_msg', 'Failed to update bill status');
    res.redirect('/admin/mess-bills');
  }
});

// GET /admin/students — Enrolled Student Directory
router.get('/students', async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .populate({
        path: 'currentRoom',
        populate: { path: 'block' },
      })
      .populate('currentAllotment')
      .sort({ name: 1 });

    res.render('admin/students-list', {
      title: 'Enrolled Students Directory | Admin',
      students,
    });
  } catch (err) {
    console.error('Admin Students error:', err);
    req.flash('error_msg', 'Failed to load students');
    res.redirect('/admin/dashboard');
  }
});

module.exports = router;

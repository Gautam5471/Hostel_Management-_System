require('dotenv').config();
const mongoose = require('mongoose');
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

const seedDatabase = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const connectDB = require('../config/db');
      await connectDB();
    }
    console.log('Database ready for seeding. Clearing existing collections...');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Block.deleteMany({}),
      Room.deleteMany({}),
      Allotment.deleteMany({}),
      RoomRequest.deleteMany({}),
      MaintenanceRequest.deleteMany({}),
      MessMenu.deleteMany({}),
      MessFeedback.deleteMany({}),
      MessLeave.deleteMany({}),
      MessBill.deleteMany({}),
    ]);

    console.log('Existing data cleared. Starting seed insertions...');

    // 1. Create Warden / Admin Account
    const adminUser = new User({
      name: 'Dr. K. Raman (Chief Warden)',
      email: 'admin@hostel.edu',
      password: 'Admin@123',
      role: 'admin',
      phone: '+91 98765 00001',
      gender: 'Male',
      department: 'Hostel Administration',
    });
    await adminUser.save();

    // 2. Create Student Accounts
    const studentsData = [
      {
        name: 'Rahul Sharma',
        email: 'rahul@campus.edu',
        password: 'Student@123',
        role: 'student',
        rollNo: '24CS101',
        department: 'Computer Science & Engineering',
        yearOfStudy: '3rd Year',
        gender: 'Male',
        phone: '+91 98765 11001',
        emergencyContact: { name: 'Manoj Sharma (Father)', phone: '+91 98111 22334' },
      },
      {
        name: 'Priya Patel',
        email: 'priya@campus.edu',
        password: 'Student@123',
        role: 'student',
        rollNo: '24IT105',
        department: 'Information Technology',
        yearOfStudy: '2nd Year',
        gender: 'Female',
        phone: '+91 98765 11002',
        emergencyContact: { name: 'Sanjay Patel (Father)', phone: '+91 98222 33445' },
      },
      {
        name: 'Arjun Nair',
        email: 'arjun@campus.edu',
        password: 'Student@123',
        role: 'student',
        rollNo: '24EC202',
        department: 'Electronics & Communication',
        yearOfStudy: '3rd Year',
        gender: 'Male',
        phone: '+91 98765 11003',
        emergencyContact: { name: 'Radha Nair (Mother)', phone: '+91 98333 44556' },
      },
      {
        name: 'Sneha Gupta',
        email: 'sneha@campus.edu',
        password: 'Student@123',
        role: 'student',
        rollNo: '24ME304',
        department: 'Mechanical Engineering',
        yearOfStudy: '2nd Year',
        gender: 'Female',
        phone: '+91 98765 11004',
        emergencyContact: { name: 'Anil Gupta (Father)', phone: '+91 98444 55667' },
      },
      {
        name: 'Amit Kumar',
        email: 'amit@campus.edu',
        password: 'Student@123',
        role: 'student',
        rollNo: '24EE405',
        department: 'Electrical Engineering',
        yearOfStudy: '1st Year',
        gender: 'Male',
        phone: '+91 98765 11005',
        emergencyContact: { name: 'Sunil Kumar (Father)', phone: '+91 98555 66778' },
      },
      {
        name: 'Ananya Roy',
        email: 'ananya@campus.edu',
        password: 'Student@123',
        role: 'student',
        rollNo: '24CS188',
        department: 'Computer Science & Engineering',
        yearOfStudy: '4th Year',
        gender: 'Female',
        phone: '+91 98765 11006',
        emergencyContact: { name: 'Deepak Roy (Father)', phone: '+91 98666 77889' },
      },
      {
        name: 'Vikram Seth',
        email: 'vikram@campus.edu',
        password: 'Student@123',
        role: 'student',
        rollNo: '24CE501',
        department: 'Civil Engineering',
        yearOfStudy: '1st Year',
        gender: 'Male',
        phone: '+91 98765 11007',
        emergencyContact: { name: 'Alok Seth (Father)', phone: '+91 98777 88990' },
      },
    ];

    const createdStudents = [];
    for (const s of studentsData) {
      const student = new User(s);
      await student.save();
      createdStudents.push(student);
    }
    console.log(`Created ${createdStudents.length} demo students.`);

    // 3. Create Hostel Blocks
    const blockA = await Block.create({
      name: 'Block A - Ganga Wing',
      genderType: 'Boys',
      totalFloors: 3,
      description: 'Main boys hostel with solar water heating, high-speed fiber Wi-Fi, and 24/7 security.',
      wardenInCharge: 'Dr. K. Raman',
      contactNumber: '+91 98765 00001',
    });

    const blockB = await Block.create({
      name: 'Block B - Yamuna Wing',
      genderType: 'Girls',
      totalFloors: 4,
      description: 'Secure girls hostel block with biometric access, study hall, gym, and recreation lounge.',
      wardenInCharge: 'Dr. Meenakshi Sundaram',
      contactNumber: '+91 98765 00002',
    });

    const blockC = await Block.create({
      name: 'Block C - Saraswati Wing',
      genderType: 'Co-ed',
      totalFloors: 3,
      description: 'Postgraduate and international student residence with private studio setups and AC suites.',
      wardenInCharge: 'Prof. V. Nambiar',
      contactNumber: '+91 98765 00003',
    });

    console.log('Hostel blocks created.');

    // 4. Create Rooms
    // Block A Rooms
    const roomA101 = await Room.create({
      block: blockA._id,
      roomNumber: 'A-101',
      floor: 1,
      roomType: 'Single',
      capacity: 1,
      occupiedBeds: 0,
      isAc: true,
      hasAttachedBathroom: true,
      pricePerMonth: 8500,
      amenities: ['High-speed Wi-Fi', 'Study Table & Chair', 'Wardrobe', 'Air Conditioner', 'Attached Bathroom'],
      status: 'Available',
    });

    const roomA102 = await Room.create({
      block: blockA._id,
      roomNumber: 'A-102',
      floor: 1,
      roomType: 'Double',
      capacity: 2,
      occupiedBeds: 2, // Full: Rahul and Arjun
      isAc: true,
      hasAttachedBathroom: true,
      pricePerMonth: 6500,
      amenities: ['High-speed Wi-Fi', 'Study Tables', 'Dual Wardrobes', 'Air Conditioner', 'Balcony'],
      status: 'Full',
    });

    const roomA103 = await Room.create({
      block: blockA._id,
      roomNumber: 'A-103',
      floor: 1,
      roomType: 'Double',
      capacity: 2,
      occupiedBeds: 1, // Amit (1 bed free)
      isAc: false,
      hasAttachedBathroom: true,
      pricePerMonth: 5000,
      amenities: ['High-speed Wi-Fi', 'Study Table', 'Wardrobes', 'Ceiling Fan'],
      status: 'Available',
    });

    const roomA201 = await Room.create({
      block: blockA._id,
      roomNumber: 'A-201',
      floor: 2,
      roomType: 'Triple',
      capacity: 3,
      occupiedBeds: 0,
      isAc: false,
      hasAttachedBathroom: false,
      pricePerMonth: 4200,
      amenities: ['High-speed Wi-Fi', 'Study Tables', 'Lockers', 'Ceiling Fan'],
      status: 'Available',
    });

    const roomA202 = await Room.create({
      block: blockA._id,
      roomNumber: 'A-202',
      floor: 2,
      roomType: 'Single',
      capacity: 1,
      occupiedBeds: 0,
      isAc: false,
      hasAttachedBathroom: true,
      pricePerMonth: 6000,
      amenities: ['High-speed Wi-Fi', 'Study Desk', 'Wardrobe'],
      status: 'Available',
    });

    const roomA301 = await Room.create({
      block: blockA._id,
      roomNumber: 'A-301',
      floor: 3,
      roomType: 'Four-Bed',
      capacity: 4,
      occupiedBeds: 0,
      isAc: false,
      hasAttachedBathroom: false,
      pricePerMonth: 3500,
      amenities: ['High-speed Wi-Fi', 'Lockers', 'Study Area', 'Common Balcony'],
      status: 'Available',
    });

    // Block B Rooms
    const roomB101 = await Room.create({
      block: blockB._id,
      roomNumber: 'B-101',
      floor: 1,
      roomType: 'Double',
      capacity: 2,
      occupiedBeds: 2, // Full: Priya and Sneha
      isAc: true,
      hasAttachedBathroom: true,
      pricePerMonth: 6800,
      amenities: ['High-speed Wi-Fi', 'Study Tables', 'Dual Wardrobes', 'Air Conditioner'],
      status: 'Full',
    });

    const roomB102 = await Room.create({
      block: blockB._id,
      roomNumber: 'B-102',
      floor: 1,
      roomType: 'Single',
      capacity: 1,
      occupiedBeds: 1, // Full: Ananya
      isAc: true,
      hasAttachedBathroom: true,
      pricePerMonth: 8500,
      amenities: ['High-speed Wi-Fi', 'Executive Desk', 'Wardrobe', 'Air Conditioner', 'Private Bath'],
      status: 'Full',
    });

    const roomB201 = await Room.create({
      block: blockB._id,
      roomNumber: 'B-201',
      floor: 2,
      roomType: 'Double',
      capacity: 2,
      occupiedBeds: 0,
      isAc: false,
      hasAttachedBathroom: true,
      pricePerMonth: 5200,
      amenities: ['High-speed Wi-Fi', 'Study Tables', 'Wardrobes'],
      status: 'Available',
    });

    const roomB202 = await Room.create({
      block: blockB._id,
      roomNumber: 'B-202',
      floor: 2,
      roomType: 'Triple',
      capacity: 3,
      occupiedBeds: 0,
      isAc: false,
      hasAttachedBathroom: false,
      pricePerMonth: 4500,
      amenities: ['High-speed Wi-Fi', 'Study Tables', 'Lockers'],
      status: 'Available',
    });

    // Block C Rooms
    const roomC101 = await Room.create({
      block: blockC._id,
      roomNumber: 'C-101',
      floor: 1,
      roomType: 'Single',
      capacity: 1,
      occupiedBeds: 0,
      isAc: true,
      hasAttachedBathroom: true,
      pricePerMonth: 10000,
      amenities: ['High-speed Wi-Fi', 'Smart TV', 'Mini Fridge', 'Study Desk', 'En-suite Bath'],
      status: 'Available',
    });

    const roomC102 = await Room.create({
      block: blockC._id,
      roomNumber: 'C-102',
      floor: 1,
      roomType: 'Double',
      capacity: 2,
      occupiedBeds: 0,
      isAc: true,
      hasAttachedBathroom: true,
      pricePerMonth: 7500,
      amenities: ['High-speed Wi-Fi', 'Study Tables', 'Wardrobes', 'Air Conditioner'],
      status: 'Available',
    });

    console.log('Hostel rooms created.');

    // 5. Create Allotments and Link to Students
    // Rahul -> A-102 (Bed 1)
    const allotRahul = await Allotment.create({
      student: createdStudents[0]._id,
      room: roomA102._id,
      bedNumber: 1,
      status: 'Active',
      allottedDate: new Date('2026-08-01'),
      remarks: 'Allotted for Academic Year 2026-27',
    });
    createdStudents[0].currentAllotment = allotRahul._id;
    createdStudents[0].currentRoom = roomA102._id;
    await createdStudents[0].save();

    // Arjun -> A-102 (Bed 2)
    const allotArjun = await Allotment.create({
      student: createdStudents[2]._id,
      room: roomA102._id,
      bedNumber: 2,
      status: 'Active',
      allottedDate: new Date('2026-08-01'),
      remarks: 'Allotted for Academic Year 2026-27',
    });
    createdStudents[2].currentAllotment = allotArjun._id;
    createdStudents[2].currentRoom = roomA102._id;
    await createdStudents[2].save();

    // Amit -> A-103 (Bed 1)
    const allotAmit = await Allotment.create({
      student: createdStudents[4]._id,
      room: roomA103._id,
      bedNumber: 1,
      status: 'Active',
      allottedDate: new Date('2026-08-15'),
      remarks: 'First year fresh allotment',
    });
    createdStudents[4].currentAllotment = allotAmit._id;
    createdStudents[4].currentRoom = roomA103._id;
    await createdStudents[4].save();

    // Priya -> B-101 (Bed 1)
    const allotPriya = await Allotment.create({
      student: createdStudents[1]._id,
      room: roomB101._id,
      bedNumber: 1,
      status: 'Active',
      allottedDate: new Date('2026-08-01'),
      remarks: 'Allotted for Academic Year 2026-27',
    });
    createdStudents[1].currentAllotment = allotPriya._id;
    createdStudents[1].currentRoom = roomB101._id;
    await createdStudents[1].save();

    // Sneha -> B-101 (Bed 2)
    const allotSneha = await Allotment.create({
      student: createdStudents[3]._id,
      room: roomB101._id,
      bedNumber: 2,
      status: 'Active',
      allottedDate: new Date('2026-08-01'),
      remarks: 'Allotted for Academic Year 2026-27',
    });
    createdStudents[3].currentAllotment = allotSneha._id;
    createdStudents[3].currentRoom = roomB101._id;
    await createdStudents[3].save();

    // Ananya -> B-102 (Bed 1)
    const allotAnanya = await Allotment.create({
      student: createdStudents[5]._id,
      room: roomB102._id,
      bedNumber: 1,
      status: 'Active',
      allottedDate: new Date('2026-08-05'),
      remarks: 'Final year single occupancy request',
    });
    createdStudents[5].currentAllotment = allotAnanya._id;
    createdStudents[5].currentRoom = roomB102._id;
    await createdStudents[5].save();

    console.log('Room allotments and user references assigned.');

    // 6. Create Room Requests (Pending demo items)
    // Vikram Seth -> New Allotment Request
    await RoomRequest.create({
      student: createdStudents[6]._id,
      requestType: 'New Allotment',
      preferredBlock: blockA._id,
      preferredRoomType: 'Double',
      reason: '1st year student seeking accommodation close to Computer Science academic block.',
      status: 'Pending',
    });

    // Amit Kumar -> Room Change Request (wants AC room)
    await RoomRequest.create({
      student: createdStudents[4]._id,
      requestType: 'Room Change',
      currentRoom: roomA103._id,
      preferredBlock: blockA._id,
      preferredRoomType: 'Double',
      targetRoom: roomA102._id,
      reason: 'Requesting transfer to AC double sharing room for study environment.',
      status: 'Pending',
    });

    // 7. Create Maintenance Requests
    await MaintenanceRequest.create({
      student: createdStudents[0]._id, // Rahul
      room: roomA102._id,
      category: 'Electrical',
      priority: 'Medium',
      title: 'Ceiling fan regulator loose',
      description: 'Fan speed is stuck on 5 and regulator knob slips.',
      status: 'Resolved',
      assignedTechnician: 'Electrician Ramesh Kumar',
      resolutionNotes: 'Replaced regulator unit. Verified 5 speed calibration.',
      resolvedAt: new Date('2026-09-10'),
    });

    await MaintenanceRequest.create({
      student: createdStudents[1]._id, // Priya
      room: roomB101._id,
      category: 'Plumbing',
      priority: 'High',
      title: 'Bathroom tap slow drip',
      description: 'Hot water valve in the shower is dripping continuously.',
      status: 'In Progress',
      assignedTechnician: 'Plumber Suresh',
      resolutionNotes: 'Inspection done. Sourcing replacement washer gasket.',
    });

    await MaintenanceRequest.create({
      student: createdStudents[4]._id, // Amit
      room: roomA103._id,
      category: 'Carpentry',
      priority: 'Low',
      title: 'Study table drawer lock stuck',
      description: 'Key is not turning smoothly in the desk drawer lock.',
      status: 'Reported',
      assignedTechnician: 'Hostel Maintenance Staff',
    });

    console.log('Maintenance tickets created.');

    // 8. Weekly Mess Menu (7 days x 4 meals)
    const menuDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const sampleMenus = {
      Monday: {
        Breakfast: { items: ['Idli & Medu Vada', 'Sambar', 'Coconut Chutney', 'Tea & Coffee', 'Banana'], time: '07:30 AM - 09:30 AM', veg: 'Pure Veg', special: false },
        Lunch: { items: ['Paneer Butter Masala', 'Yellow Dal Tadka', 'Jeera Rice', 'Tawa Chapati', 'Cucumber Raita'], time: '12:30 PM - 02:30 PM', veg: 'Pure Veg', special: false },
        Snacks: { items: ['Veg Samosa (2 pcs)', 'Mint Chutney', 'Ginger Masala Chai', 'Biscuits'], time: '04:45 PM - 06:00 PM', veg: 'Pure Veg', special: false },
        Dinner: { items: ['Aloo Gobi Dry', 'Dal Makhani', 'Steamed Basmati Rice', 'Phulka', 'Gulab Jamun'], time: '07:45 PM - 09:45 PM', veg: 'Pure Veg', special: false },
      },
      Tuesday: {
        Breakfast: { items: ['Masala Dosa', 'Tomato Chutney', 'Sambar', 'Boiled Eggs / Sprouts', 'Tea / Coffee'], time: '07:30 AM - 09:30 AM', veg: 'Pure Veg', special: false },
        Lunch: { items: ['Chole Masala', 'Bhature (2 pcs)', 'Steamed Rice', 'Boondi Raita', 'Green Salad'], time: '12:30 PM - 02:30 PM', veg: 'Pure Veg', special: false },
        Snacks: { items: ['Poha with Sev & Peanuts', 'Lemon Slice', 'Cardamom Tea'], time: '04:45 PM - 06:00 PM', veg: 'Pure Veg', special: false },
        Dinner: { items: ['Kadai Paneer', 'Dal Fry', 'Jeera Pulao', 'Butter Roti', 'Ice Cream Cup'], time: '07:45 PM - 09:45 PM', veg: 'Pure Veg', special: false },
      },
      Wednesday: {
        Breakfast: { items: ['Aloo Paratha with Curd & Pickle', 'Poha', 'Fresh Cut Papaya', 'Hot Milk & Tea'], time: '07:30 AM - 09:30 AM', veg: 'Pure Veg', special: false },
        Lunch: { items: ['Rajma Masala', 'Kashmiri Dum Aloo', 'Steamed Rice', 'Roti', 'Salad'], time: '12:30 PM - 02:30 PM', veg: 'Pure Veg', special: false },
        Snacks: { items: ['Pav Bhaji (2 pavs)', 'Chopped Onions & Butter', 'Filter Coffee'], time: '04:45 PM - 06:00 PM', veg: 'Pure Veg', special: false },
        Dinner: { items: ['Chicken Biryani / Shahi Paneer Biryani', 'Mirchi Ka Salan', 'Onion Raita', 'Sweet Rasgulla'], time: '07:45 PM - 09:45 PM', veg: 'Special Feast', special: true },
      },
      Thursday: {
        Breakfast: { items: ['Uttapam with Onion & Tomato', 'Sambar', 'Groundnut Chutney', 'Tea & Coffee'], time: '07:30 AM - 09:30 AM', veg: 'Pure Veg', special: false },
        Lunch: { items: ['Bhindi Do Pyaza', 'Dal Tadka', 'Steamed Rice', 'Hot Phulkas', 'Papad'], time: '12:30 PM - 02:30 PM', veg: 'Pure Veg', special: false },
        Snacks: { items: ['Crispy Onion Pakoda', 'Green Chutney', 'Masala Tea'], time: '04:45 PM - 06:00 PM', veg: 'Pure Veg', special: false },
        Dinner: { items: ['Mix Veg Handi', 'Dal Palak', 'Veg Pulao', 'Tandoori Roti', 'Kheer'], time: '07:45 PM - 09:45 PM', veg: 'Pure Veg', special: false },
      },
      Friday: {
        Breakfast: { items: ['Puri Bhaji (4 puris)', 'Upma', 'Kesari Bath', 'Tea / Coffee / Milk'], time: '07:30 AM - 09:30 AM', veg: 'Pure Veg', special: false },
        Lunch: { items: ['Veg Biryani / Egg Biryani', 'Mix Veg Curry', 'Raita', 'Salad', 'Pickle'], time: '12:30 PM - 02:30 PM', veg: 'Non-Veg Option Available', special: false },
        Snacks: { items: ['Bread Pakoda with Stuffed Potato', 'Tomato Ketchup', 'Tea'], time: '04:45 PM - 06:00 PM', veg: 'Pure Veg', special: false },
        Dinner: { items: ['Paneer Tikka Masala / Egg Curry', 'Dal Tadka', 'Jeera Rice', 'Butter Naan', 'Custard with Fruits'], time: '07:45 PM - 09:45 PM', veg: 'Non-Veg Option Available', special: false },
      },
      Saturday: {
        Breakfast: { items: ['Onion Rava Dosa', 'Coconut Chutney', 'Sambar', 'Seasonal Fruit', 'Tea'], time: '07:30 AM - 09:30 AM', veg: 'Pure Veg', special: false },
        Lunch: { items: ['Kadhi Pakoda', 'Aloo Methi', 'Steamed Rice', 'Phulka', 'Roasted Papad'], time: '12:30 PM - 02:30 PM', veg: 'Pure Veg', special: false },
        Snacks: { items: ['Sweet Corn Chaat', 'Biscuits', 'Hot Coffee'], time: '04:45 PM - 06:00 PM', veg: 'Pure Veg', special: false },
        Dinner: { items: ['Veg Manchurian with Fried Rice', 'Chilli Paneer Gravy', 'Hakka Noodles', 'Brownie'], time: '07:45 PM - 09:45 PM', veg: 'Special Feast', special: true },
      },
      Sunday: {
        Breakfast: { items: ['Chole Bhature Special', 'Sweet Lassi', 'Fruit Salad', 'Tea / Coffee'], time: '07:30 AM - 10:00 AM', veg: 'Special Feast', special: true },
        Lunch: { items: ['Mutter Paneer', 'Dal Makhani', 'Kashmiri Pulao', 'Butter Naan', 'Pineapple Raita'], time: '12:30 PM - 03:00 PM', veg: 'Pure Veg', special: false },
        Snacks: { items: ['Cutlet with Chutney', 'Tea & Coffee'], time: '05:00 PM - 06:15 PM', veg: 'Pure Veg', special: false },
        Dinner: { items: ['Special Butter Chicken / Shahi Paneer', 'Dal Maharani', 'Jeera Rice', 'Rumali Roti', 'Moong Dal Halwa'], time: '07:45 PM - 09:45 PM', veg: 'Special Feast', special: true },
      },
    };

    for (const day of menuDays) {
      const dayData = sampleMenus[day];
      for (const meal of ['Breakfast', 'Lunch', 'Snacks', 'Dinner']) {
        const item = dayData[meal];
        await MessMenu.create({
          dayOfWeek: day,
          mealType: meal,
          items: item.items,
          timings: item.time,
          dietaryType: item.veg,
          isSpecial: item.special,
          nutritionHighlight: item.special ? 'Chef Special Weekend Feast' : 'Balanced high-energy meal',
          updatedBy: 'Chief Mess Warden',
        });
      }
    }
    console.log('Weekly 7-day mess menu schedule created.');

    // 9. Create Mess Feedbacks
    await MessFeedback.create({
      student: createdStudents[0]._id,
      mealDate: new Date('2026-09-18'),
      mealType: 'Dinner',
      rating: 5,
      category: 'Taste & Quality',
      comments: 'The Dal Makhani and butter roti were exceptionally fresh and delicious!',
    });

    await MessFeedback.create({
      student: createdStudents[1]._id,
      mealDate: new Date('2026-09-19'),
      mealType: 'Breakfast',
      rating: 5,
      category: 'Hygiene & Cleanliness',
      comments: 'Crispy dosas served hot and dining counters were kept spotless.',
    });

    await MessFeedback.create({
      student: createdStudents[2]._id,
      mealDate: new Date('2026-09-19'),
      mealType: 'Lunch',
      rating: 4,
      category: 'Quantity & Portions',
      comments: 'Great portion sizes, could add more curd varieties on hot afternoons.',
    });

    // 10. Create Mess Leaves
    const rahulLeave = await MessLeave.create({
      student: createdStudents[0]._id,
      startDate: new Date('2026-09-10'),
      endDate: new Date('2026-09-14'),
      totalDays: 5,
      reason: 'Home visit for festival celebration',
      status: 'Approved',
    });

    const priyaLeave = await MessLeave.create({
      student: createdStudents[1]._id,
      startDate: new Date('2026-09-15'),
      endDate: new Date('2026-09-17'),
      totalDays: 3,
      reason: 'Attending Inter-University Technical Symposium',
      status: 'Approved',
    });

    console.log('Mess leave records created.');

    // 11. Create Monthly Mess Bills (Stretch Goal)
    // Rahul: 30 days total, 5 days absent => 25 present => (30*150) - (5*150) + 250 = 4500 - 750 + 250 = ₹4000
    await MessBill.create({
      student: createdStudents[0]._id,
      month: 'September',
      year: 2026,
      totalDaysInMonth: 30,
      dailyRate: 150,
      absentDays: 5,
      presentDays: 25,
      baseAmount: 4500,
      rebateAmount: 750,
      utilityCharge: 250,
      netAmount: 4000,
      status: 'Unpaid',
      dueDate: new Date('2026-10-10'),
    });

    // Priya: 30 days total, 3 days absent => 27 present => (30*150) - (3*150) + 250 = 4500 - 450 + 250 = ₹4300 (Paid)
    await MessBill.create({
      student: createdStudents[1]._id,
      month: 'September',
      year: 2026,
      totalDaysInMonth: 30,
      dailyRate: 150,
      absentDays: 3,
      presentDays: 27,
      baseAmount: 4500,
      rebateAmount: 450,
      utilityCharge: 250,
      netAmount: 4300,
      status: 'Paid',
      dueDate: new Date('2026-10-10'),
      paidAt: new Date('2026-09-18'),
      transactionId: 'TXN-94821049',
    });

    // Arjun: 30 days total, 0 absent => ₹4750
    await MessBill.create({
      student: createdStudents[2]._id,
      month: 'September',
      year: 2026,
      totalDaysInMonth: 30,
      dailyRate: 150,
      absentDays: 0,
      presentDays: 30,
      baseAmount: 4500,
      rebateAmount: 0,
      utilityCharge: 250,
      netAmount: 4750,
      status: 'Unpaid',
      dueDate: new Date('2026-10-10'),
    });

    console.log('Mess bills seeded successfully.');
    console.log('----------------------------------------------------');
    console.log('----------------------------------------------------');
    return true;
  } catch (err) {
    console.error('Error seeding database:', err);
    throw err;
  }
};

module.exports = seedDatabase;

if (require.main === module) {
  seedDatabase().then(() => process.exit(0)).catch(() => process.exit(1));
}

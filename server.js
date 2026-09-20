require('dotenv').config();
const express = require('express');
const path = require('path');
const morgan = require('morgan');
const methodOverride = require('method-override');
const session = require('express-session');
const flash = require('connect-flash');

const connectDB = require('./config/db');
const viewHelpers = require('./middleware/helpers');
const User = require('./models/User');
const seedDatabase = require('./seed/seedData');

const app = express();
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  // Connect to Database (Atlas, Local, or In-Memory fallback)
  await connectDB();

  // Auto-seed if database is freshly initialized and empty
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('⚡ Initializing database with comprehensive demo dataset...');
      await seedDatabase();
    }
  } catch (seedErr) {
    console.warn('Auto-seed check note:', seedErr.message);
  }

  // View engine setup (EJS)
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  // Core middleware
  app.use(morgan('dev'));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(methodOverride('_method'));
  app.use(express.static(path.join(__dirname, 'public')));

  // Session configuration
  const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'hostel_portal_secret_key_2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
    },
  };

  app.use(session(sessionConfig));
  app.use(flash());
  app.use(viewHelpers);

  // Routes
  app.use('/', require('./routes/indexRoutes'));
  app.use('/auth', require('./routes/authRoutes'));
  app.use('/student', require('./routes/studentRoutes'));
  app.use('/admin', require('./routes/adminRoutes'));

  // 404 Handler
  app.use((req, res, next) => {
    res.status(404).render('404', {
      title: '404 - Page Not Found | Hostel Portal',
      url: req.originalUrl,
    });
  });

  // Global Error Handler
  app.use((err, req, res, next) => {
    console.error('Unhandled Application Error:', err);
    res.status(500).render('500', {
      title: '500 - Server Error | Hostel Portal',
      error: process.env.NODE_ENV === 'development' ? err : {},
    });
  });

  app.listen(PORT, () => {
    console.log(`=================================================================`);
    console.log(`🚀 HostelHub Management Portal live at: http://localhost:${PORT}`);
    console.log(`👤 Warden / Admin Login:  admin@hostel.edu  /  Admin@123`);
    console.log(`🎓 Student Login:         rahul@campus.edu  /  Student@123`);
    console.log(`=================================================================`);
  });
};

startServer();

// Authentication & Role-Based Middleware

const ensureAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  req.flash('error_msg', 'Please log in to access this page');
  res.redirect('/auth/login');
};

const ensureGuest = (req, res, next) => {
  if (req.session && req.session.user) {
    if (req.session.user.role === 'admin' || req.session.user.role === 'warden') {
      return res.redirect('/admin/dashboard');
    }
    return res.redirect('/student/dashboard');
  }
  next();
};

const ensureAdmin = (req, res, next) => {
  if (req.session && req.session.user && (req.session.user.role === 'admin' || req.session.user.role === 'warden')) {
    return next();
  }
  req.flash('error_msg', 'Access denied: Warden / Admin clearance required');
  res.redirect('/auth/login');
};

const ensureStudent = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === 'student') {
    return next();
  }
  req.flash('error_msg', 'Access restricted to enrolled students');
  res.redirect('/auth/login');
};

module.exports = {
  ensureAuthenticated,
  ensureGuest,
  ensureAdmin,
  ensureStudent,
};

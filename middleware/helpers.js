// Helper middleware for view templates

const viewHelpers = (req, res, next) => {
  res.locals.currentUser = req.session ? req.session.user : null;
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.info_msg = req.flash('info_msg');
  res.locals.currentPath = req.path;

  // Date formatter
  res.locals.formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Time formatter
  res.locals.formatDateTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Currency formatter (INR)
  res.locals.formatINR = (amount) => {
    if (amount === undefined || amount === null) return '₹0';
    return '₹' + Number(amount).toLocaleString('en-IN');
  };

  // Status badge CSS class helper
  res.locals.getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Available':
      case 'Approved':
      case 'Resolved':
      case 'Paid':
      case 'Active':
        return 'badge-success';
      case 'Pending':
      case 'In Progress':
      case 'Reported':
      case 'Unpaid':
        return 'badge-warning';
      case 'Full':
      case 'Rejected':
      case 'Emergency':
      case 'Maintenance':
      case 'Overdue':
      case 'Vacated':
        return 'badge-danger';
      case 'High':
        return 'badge-amber';
      case 'Transferred':
      case 'Closed':
        return 'badge-secondary';
      default:
        return 'badge-info';
    }
  };

  next();
};

module.exports = viewHelpers;

// Client-side interactions for Hostel & Mess Management Portal

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Sidebar Toggle
  const toggleBtn = document.querySelector('.mobile-menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('active');
    });

    // Close sidebar on click outside on mobile
    document.addEventListener('click', (e) => {
      if (
        window.innerWidth <= 1024 &&
        sidebar.classList.contains('active') &&
        !sidebar.contains(e.target) &&
        !toggleBtn.contains(e.target)
      ) {
        sidebar.classList.remove('active');
      }
    });
  }

  // 2. Alert Dismissal
  const alertCloseBtns = document.querySelectorAll('.alert-close');
  alertCloseBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const alert = btn.closest('.alert');
      if (alert) {
        alert.style.opacity = '0';
        setTimeout(() => alert.remove(), 250);
      }
    });
  });

  // Auto-dismiss alerts after 6 seconds
  const autoAlerts = document.querySelectorAll('.alert');
  if (autoAlerts.length > 0) {
    setTimeout(() => {
      autoAlerts.forEach((alert) => {
        alert.style.transition = 'opacity 0.5s ease';
        alert.style.opacity = '0';
        setTimeout(() => alert.remove(), 500);
      });
    }, 6000);
  }

  // 3. Modal Triggers
  const modalOpenBtns = document.querySelectorAll('[data-modal-target]');
  const modalCloseBtns = document.querySelectorAll('[data-modal-close]');

  modalOpenBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-modal-target');
      const modal = document.getElementById(targetId);
      if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Pre-fill target room if button carries room ID
        const roomId = btn.getAttribute('data-room-id');
        const roomInput = modal.querySelector('input[name="targetRoom"], select[name="targetRoom"]');
        if (roomId && roomInput) {
          roomInput.value = roomId;
        }
      }
    });
  });

  modalCloseBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-overlay');
      if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });

  // Close modal when clicking outside content
  document.querySelectorAll('.modal-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });

  // 4. Day Tabs for Mess Menu
  const dayTabs = document.querySelectorAll('.day-tab-btn');
  const dayPanels = document.querySelectorAll('.day-menu-panel');

  if (dayTabs.length > 0 && dayPanels.length > 0) {
    dayTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const targetDay = tab.getAttribute('data-day');

        dayTabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');

        dayPanels.forEach((panel) => {
          if (panel.getAttribute('data-day') === targetDay) {
            panel.style.display = 'grid';
          } else {
            panel.style.display = 'none';
          }
        });
      });
    });
  }

  // 5. Star Rating Selector for Feedback
  const starInputs = document.querySelectorAll('.star-rating-radio');
  const starLabels = document.querySelectorAll('.star-rating-label');

  if (starInputs.length > 0) {
    starInputs.forEach((input) => {
      input.addEventListener('change', () => {
        const val = parseInt(input.value, 10);
        starLabels.forEach((label, idx) => {
          if (idx < val) {
            label.style.color = '#f59e0b';
          } else {
            label.style.color = '#cbd5e1';
          }
        });
      });
    });
  }
});

// Helper to trigger print dialog
function printInvoice() {
  window.print();
}

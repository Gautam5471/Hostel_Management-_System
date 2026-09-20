# HostelHub — Hostel Room Allotment & Mess Management System (PS 3)

A comprehensive, production-grade **Hostel Room Allotment & Mess Management Portal** built for university campuses and facility administration using **Node.js, Express.js, EJS Server-Side Rendering**, and **MongoDB Atlas**.

---

## 🚀 Tech Stack

- **Frontend**: EJS (Server-Side Rendering) + Vanilla CSS Modern Design System + Chart.js
- **Backend**: Node.js & Express.js
- **Database**: MongoDB Atlas (with seamless local / in-memory fallback support)
- **Authentication**: Role-based Session Authentication with `express-session`, `connect-mongo`, and `bcryptjs`
- **Architecture**: MVC Pattern (Models, Views, Controllers/Routes, Middleware)

---

## 👥 User Roles & Core Features

### 🎓 1. Student Portal
- **Role-Based Authentication**: Secure student registration with Roll Number, Branch, Gender, Emergency Contacts, and Password hashing.
- **Room Explorer & Allotment Requests**:
  - Filter rooms by Hostel Block, Room Type (Single/Double/Triple/Four-bed), AC/Non-AC, and Availability status.
  - Submit room allotment requests with living preferences and special accommodation reasons.
- **My Room & Roommates**:
  - View full room specs, monthly charges, amenities, and floor details.
  - Interactive profile list of allocated roommates with branch and contact info.
  - **Room Change Request**: Submit transfer requests specifying target room preferences.
  - **Vacate / Checkout Request**: Formal clearance request to release bed and finalize dues.
- **Maintenance Helpdesk**:
  - Lodge complaints categorized by Electrical, Plumbing, Carpentry, Cleaning, Internet, or Appliances.
  - Track real-time repair progress, priority tags, and warden resolution notes.
- **Interactive Weekly Mess Menu**:
  - 7-day tabbed view (Monday to Sunday) covering Breakfast, Lunch, Evening Snacks, and Dinner with timings, dietary classifications, and Chef Special highlights.
- **Meal Ratings & Feedback**:
  - Submit 5-star ratings and written reviews on Taste, Hygiene, Quantity, and Staff Courtesy.
- **Mess Leave & Rebates**:
  - Log absence periods (e.g. Home visits, Internships, Academic Fests). Approved days are credited at **₹150 / day**.
- **Mess Billing & Invoices (Stretch Goal)**:
  - Attendance-based itemized billing statements showing days present, absence rebate credit deductions, and net dues.
  - 1-Click simulated online payment.
  - **Printable Institutional Invoice Receipt** with official layout (`window.print()`).

---

### 🛡️ 2. Warden / Admin Portal
- **Overview Dashboard & Analytics**:
  - High-level KPIs: Total rooms, Total bed capacity, Occupied beds, Available beds, Occupancy percentage, Active maintenance complaints, and Average mess satisfaction score.
  - **Chart.js Visualizer**: Dynamic stacked bar chart illustrating block-wise occupancy and capacity breakdown.
- **Hostel Blocks Management**:
  - Create, edit, and manage hostel blocks (Boys, Girls, Co-ed / International PG).
  - Track floors, warden contacts, and building descriptions.
- **Rooms & Capacity Engine**:
  - Create and configure room numbers, floor, sharing type, capacity limits, monthly rent, AC, and amenities.
  - View active occupants assigned to each room.
  - Safety check preventing accidental deletion of occupied rooms.
- **Allocation & Approval Engine**:
  - Review student requests (New Allotment, Room Change, Vacate).
  - **Capacity Validation Guard**: Prevents bed allocation if room is full (`occupiedBeds >= capacity`).
  - **Automatic Bed Release**: Immediate decrement of room occupancy upon student checkout / vacation approval.
  - Full audit directory of active, transferred, and vacated historical allotments with manual vacate action.
- **Maintenance Helpdesk**:
  - Filter tickets by status, category, and priority (Low, Medium, High, Emergency).
  - Assign maintenance technicians and update resolution logs.
- **Mess Administration**:
  - Publish and update daily meal plans across all 7 days of the week.
  - Monitor student feedback satisfaction metrics and reviews.
- **Automated Monthly Mess Billing (Stretch Goal)**:
  - Batch or individual bill generator calculating charges based on actual days present minus approved leave rebates.
  - Payment status toggle (Unpaid ↔ Paid).

---

## ⚡ Quick Demo Accounts

| Role | Institutional Email | Password | Quick Action |
|---|---|---|---|
| **Warden / Admin** | `admin@hostel.edu` | `Admin@123` | [1-Click Admin Login](http://localhost:3000/auth/demo-login/admin) |
| **Student** | `rahul@campus.edu` | `Student@123` | [1-Click Student Login](http://localhost:3000/auth/demo-login/student) |

---

## 🛠️ Installation & Setup

1. **Clone or Navigate to the Repository**:
   ```bash
   cd Assignment_2_wev
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables (`.env`)**:
   Create or edit `.env` in the root directory:
   ```env
   PORT=3000
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/hostel_db?retryWrites=true&w=majority
   SESSION_SECRET=hostel_super_secure_session_secret_key_2026
   NODE_ENV=development
   ```
   > **Note**: If you don't have MongoDB Atlas configured yet, the application will automatically fall back to local MongoDB or its built-in in-memory database with full demo data seeded out of the box!

4. **Seed Demo Data (Optional - Auto-seeds if DB is empty)**:
   ```bash
   npm run seed
   ```

5. **Start the Application**:
   ```bash
   npm start
   # or development watch mode:
   npm run dev
   ```

6. **Open in Browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📂 Project Directory Structure

```
├── config/
│   └── db.js                 # MongoDB Atlas connection & in-memory fallback handler
├── models/
│   ├── User.js               # Student & Warden profiles with bcrypt
│   ├── Block.js              # Hostel buildings & floors
│   ├── Room.js               # Rooms, bed capacity, amenities & occupancy
│   ├── Allotment.js          # Active & past room assignments
│   ├── RoomRequest.js        # New allotment, transfer, & vacate requests
│   ├── MaintenanceRequest.js # Helpdesk tickets with categories & technician logs
│   ├── MessMenu.js           # 7-day 4-meal weekly dining schedules
│   ├── MessFeedback.js       # 5-star ratings and category reviews
│   ├── MessLeave.js          # Student absence dates for mess rebates
│   └── MessBill.js           # Monthly bills with attendance calculations & receipts
├── middleware/
│   ├── auth.js               # Role-based route guards (ensureStudent, ensureAdmin)
│   └── helpers.js            # View helpers (INR formatting, dates, badges)
├── routes/
│   ├── indexRoutes.js        # Public landing page with live counters
│   ├── authRoutes.js         # Login, Register, Logout, Demo switches
│   ├── studentRoutes.js      # Student dashboard, rooms, maintenance, mess, billing
│   └── adminRoutes.js        # Warden dashboard, room CRUD, requests engine, billing
├── public/
│   ├── css/
│   │   └── styles.css        # Responsive CSS design system (cards, modals, badges, print)
│   └── js/
│       └── main.js           # Modal triggers, day tabs, star ratings, invoice print
├── views/
│   ├── partials/             # Header, footer, navbar, sidebar, alerts
│   ├── auth/                 # Login & Register views
│   ├── student/              # Student dashboard & self-service views
│   ├── admin/                # Warden dashboard, allocation engine & billing views
│   ├── index.ejs             # Modern landing page
│   ├── 404.ejs               # Not found handler
│   └── 500.ejs               # Error handler
├── seed/
│   └── seedData.js           # Complete realistic campus demo dataset
├── .env.example
├── package.json
└── server.js                 # Express server bootstrap
```
# Hostel_Management-_System

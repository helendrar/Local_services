# 🌿 LocalServices — Digital ID Local Services & Job Matching Platform

A full-stack web application connecting customers with verified local service providers
using a digital identity-based verification system.

## 📁 Complete File Structure

```
localservices/
├── backend/                           Node.js + Express REST API
│   ├── config/
│   │   └── db.js                      PostgreSQL connection pool
│   ├── controllers/                   Business logic
│   │   ├── adminController.js         Admin stats, user/provider mgmt
│   │   ├── authController.js          Register, login, change password
│   │   ├── categoryController.js      Categories CRUD (admin)
│   │   ├── jobController.js           Post, assign, accept, complete jobs
│   │   ├── locationController.js      Locations CRUD (admin)
│   │   ├── notificationController.js  Notifications with unread count
│   │   ├── providerController.js      Search providers, upload docs
│   │   ├── ratingController.js        Submit/view ratings
│   │   └── userController.js          Profile, activity, digital ID lookup
│   ├── middleware/
│   │   ├── auth.js                    JWT verification
│   │   ├── errorHandler.js            Central error handler
│   │   ├── roles.js                   Role-based access control
│   │   └── upload.js                  Multer file upload config
│   ├── routes/                        Route definitions
│   │   ├── admin.js        → /api/admin/*
│   │   ├── auth.js         → /api/auth/*
│   │   ├── categories.js   → /api/categories/*
│   │   ├── jobs.js         → /api/jobs/*
│   │   ├── locations.js    → /api/locations/*
│   │   ├── notifications.js→ /api/notifications/*
│   │   ├── providers.js    → /api/providers/*
│   │   ├── ratings.js      → /api/ratings/*
│   │   └── users.js        → /api/users/*
│   ├── uploads/                       Provider documents (auto-created)
│   ├── .env.example
│   ├── package.json
│   ├── schema.sql                     Complete DB schema + seeds
│   └── server.js                      Entry point
│
└── frontend/                          React + Vite SPA
    └── src/
        ├── api/axios.js               HTTP client with JWT interceptors
        ├── context/AuthContext.jsx    Auth state management
        ├── components/
        │   ├── JobCard.jsx            Reusable job card (all roles)
        │   ├── Layout.jsx             Sidebar + navbar wrapper
        │   ├── Navbar.jsx             Top bar with notifications
        │   ├── ProviderCard.jsx       Reusable provider card
        │   ├── StarRating.jsx         Star display & input
        │   └── StatusBadge.jsx        Shared status badge component
        └── pages/
            ├── Login.jsx              Beautiful split-panel login
            ├── Register.jsx           Role selection + digital ID
            ├── Dashboard.jsx          Role-aware (customer/provider)
            ├── ProviderList.jsx       Search with filters
            ├── ProviderProfile.jsx    Full profile + assign + rate
            ├── PostJob.jsx            Post job with urgency
            ├── MyJobs.jsx             Customer job lifecycle
            ├── AssignedJobs.jsx       Provider assignments
            ├── MyProfile.jsx          Profile + verification + notifications
            └── admin/
                ├── AdminDashboard.jsx  System stats + charts
                ├── AdminJobs.jsx       All jobs view
                ├── ManageCategories.jsx CRUD for categories
                ├── ManageLocations.jsx  CRUD for locations
                ├── ManageProviders.jsx  Review + verify providers
                └── ManageUsers.jsx      Suspend/activate users
```

## ✅ Prerequisites
- Node.js v18+
- PostgreSQL v14+
- npm v9+

## 🚀 Setup — 6 Steps

### 1. Extract the ZIP and enter the folder
```bash
cd localservices
```

### 2. Create the database
```bash
psql -U postgres -c "CREATE DATABASE localservices;"
cd backend
psql -U postgres -d localservices -f schema.sql
```

### 3. Configure environment
```bash
cp .env.example .env
```
Edit `.env` and set your `DB_PASSWORD`.

### 4. Install backend dependencies
```bash
cd backend
npm install
```

### 5. Install frontend dependencies  
```bash
cd ../frontend
npm install
```

### 6. Start both servers (in separate terminals)
```bash
# Terminal 1 (from backend folder)
npm run dev

# Terminal 2 (from frontend folder)
npm run dev
```

Open http://localhost:5173 in your browser.

## 🔐 Default Admin

| Field    | Value                       |
|----------|----------------------------|
| Email    | admin@localservices.co.ke  |
| Password | Admin@1234                 |

## 📡 API Routes — Complete Reference

### Authentication (`/api/auth`)
| Method | Path               | Access | Purpose                |
|--------|--------------------|--------|------------------------|
| POST   | /register          | Public | Register new user      |
| POST   | /login             | Public | Login, receive JWT     |
| GET    | /me                | Auth   | Get own basic profile  |
| PUT    | /change-password   | Auth   | Change password        |

### Users (`/api/users`)
| Method | Path                        | Access | Purpose                    |
|--------|-----------------------------|--------|----------------------------|
| GET    | /me                         | Auth   | Get full profile + provider data |
| PUT    | /me                         | Auth   | Update basic profile       |
| GET    | /me/activity                | Auth   | Own activity log           |
| GET    | /notifications              | Auth   | Own notifications          |
| PATCH  | /notifications/read-all     | Auth   | Mark all notifications read|
| DELETE | /notifications/:id          | Auth   | Delete one notification    |
| GET    | /lookup/:digital_id         | Auth   | Verify digital ID exists   |
| GET    | /:id                        | Auth   | View user (admin or self)  |

### Providers (`/api/providers`)
| Method | Path                  | Access    | Purpose                       |
|--------|-----------------------|-----------|-------------------------------|
| GET    | /                     | Public    | Search providers (filter/page)|
| GET    | /my-profile           | Provider  | Get own provider record       |
| PUT    | /profile              | Provider  | Update provider profile       |
| POST   | /upload-document      | Provider  | Upload verification doc       |
| GET    | /:id                  | Public    | Get provider + ratings        |

### Jobs (`/api/jobs`)
| Method | Path                  | Access    | Purpose                       |
|--------|-----------------------|-----------|-------------------------------|
| GET    | /open                 | Auth      | Browse all open jobs          |
| GET    | /mine                 | Customer  | Own posted jobs               |
| GET    | /assigned             | Provider  | Own assigned jobs             |
| POST   | /                     | Customer  | Post a new job                |
| POST   | /assign               | Customer  | Assign job to provider        |
| POST   | /respond              | Provider  | Accept/reject assignment      |
| PATCH  | /:job_id/complete     | Customer  | Mark job complete             |
| GET    | /:id                  | Auth      | Get single job                |

### Ratings (`/api/ratings`)
| Method | Path                  | Access    | Purpose                       |
|--------|-----------------------|-----------|-------------------------------|
| POST   | /                     | Customer  | Submit a rating               |
| GET    | /provider/:id         | Public    | Get provider's ratings        |

### Categories (`/api/categories`)
| Method | Path       | Access | Purpose              |
|--------|------------|--------|----------------------|
| GET    | /          | Public | All categories       |
| GET    | /:id       | Public | Single category      |
| POST   | /          | Admin  | Create category      |
| PUT    | /:id       | Admin  | Update category      |
| DELETE | /:id       | Admin  | Delete category      |

### Locations (`/api/locations`)
| Method | Path       | Access | Purpose              |
|--------|------------|--------|----------------------|
| GET    | /          | Public | All locations        |
| GET    | /:id       | Public | Single location      |
| POST   | /          | Admin  | Create location      |
| PUT    | /:id       | Admin  | Update location      |
| DELETE | /:id       | Admin  | Delete location      |

### Notifications (`/api/notifications`)
| Method | Path               | Access | Purpose               |
|--------|--------------------|--------|-----------------------|
| GET    | /                  | Auth   | All notifications     |
| GET    | /unread-count      | Auth   | Unread count only     |
| PATCH  | /read-all          | Auth   | Mark all as read      |
| PATCH  | /:id/read          | Auth   | Mark one as read      |
| DELETE | /clear-all         | Auth   | Delete all own notifs |
| DELETE | /:id               | Auth   | Delete one            |

### Admin (`/api/admin`) — All require admin role
| Method | Path                     | Purpose                         |
|--------|--------------------------|---------------------------------|
| GET    | /stats                   | Dashboard statistics            |
| GET    | /users                   | All users (filter/search/page)  |
| PATCH  | /users/:user_id/toggle   | Suspend / activate user         |
| GET    | /providers               | All providers (filter by status)|
| GET    | /providers/pending       | Pending review queue            |
| POST   | /verify-provider         | Approve / reject provider       |
| GET    | /jobs                    | All platform jobs               |
| GET    | /categories              | All categories (admin view)     |
| GET    | /locations               | All locations (admin view)      |
| GET    | /notifications           | Own admin notifications         |

## 🗃 Database Tables

| Table             | Purpose                                |
|-------------------|----------------------------------------|
| `users`           | All users (admin, customer, provider) |
| `providers`       | Provider-specific extended data        |
| `categories`      | Service categories                     |
| `locations`       | Geographic locations                   |
| `jobs`            | Job postings                           |
| `job_assignments` | Links jobs to providers                |
| `ratings`         | Customer ratings with duplicate block  |
| `notifications`   | In-app notifications                   |
| `activity_logs`   | Audit trail                            |

Refer to `LocalServices_Test_Guide.pdf` for 38 detailed test cases.

Built with ❤️ — Node.js · Express · PostgreSQL · React · Vite

# 🏪 Store Rating App

A full-stack web application that allows users to discover and rate stores registered on the platform. Built with **Express.js**, **SQLite/PostgreSQL**, and **React.js (Vite)**.

---

## 📋 Table of Contents

- [Tech Stack](#tech-stack)
- [Features & User Roles](#features--user-roles)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Frontend Pages](#frontend-pages)
- [Getting Started](#getting-started)
- [Demo Credentials](#demo-credentials)
- [Validation Rules](#validation-rules)

---

## 🛠️ Tech Stack

| Layer        | Technology                          |
|--------------|-------------------------------------|
| **Frontend** | React.js (Vite), Vanilla CSS        |
| **Backend**  | Node.js, Express.js                 |
| **Database** | SQLite (dev) / PostgreSQL (prod)    |
| **Auth**     | JWT (JSON Web Tokens), bcryptjs     |
| **Icons**    | Lucide React                        |
| **HTTP**     | Axios                               |

---

## 👥 Features & User Roles

The app has **three distinct roles**, each with its own dashboard and access level:

---

### 🛡️ 1. System Administrator (ADMIN)

Created only by the system or another admin. Cannot self-register.

**Capabilities:**
- View Dashboard Overview: total users, total stores, total ratings
- View a list of all users with filtering and sorting (by name, email, address, role)
- View a list of all stores with overall ratings, filtering and sorting
- Add new users (Normal User or Admin)
- Add new stores, optionally creating a new Store Owner simultaneously

**Dashboard Tabs:**

| Tab | Description |
|-----|-------------|
| Overview | Platform-wide stats (users, stores, ratings count) |
| All Users | Sortable/filterable user list with role badges |
| All Stores | Sortable/filterable store list with average ratings |
| Add User / Admin | Form to register a new user or admin |
| Add Store | Form to register a new store + optional store owner |

---

### 🏪 2. Store Owner (STORE_OWNER)

Created by Admin only (via Add Store form). Cannot self-register.

**Capabilities:**
- View their own store(s) with average rating
- See a list of all users who submitted ratings, along with:
  - User name, email, address
  - Rating value they gave
  - Date of rating submission/update

---

### 👤 3. Normal User (NORMAL)

Can self-register via the public Sign Up page.

**Capabilities:**
- Browse all stores in the system
- Filter stores by name or address
- Sort stores by name, address, or overall rating
- Submit or update their rating (1-5 stars) for any store
- View their own previously submitted rating per store

---

## 📁 Project Structure

```
store-rating-app/
├── backend/
│   ├── middleware/
│   │   └── auth.js           # JWT authenticate & authorize middleware
│   ├── routes/
│   │   ├── admin.js          # Admin-only endpoints
│   │   ├── auth.js           # Login, signup, change password
│   │   └── stores.js         # Store browsing & rating submission
│   ├── db.js                 # Multi-driver DB abstraction (SQLite/PostgreSQL/MySQL)
│   ├── initDb.js             # Schema creation + seed data
│   ├── validators.js         # Shared validation functions
│   ├── server.js             # Express app entry point
│   ├── schema.sql            # Raw SQL schema reference
│   ├── .env.example          # Environment variable template
│   └── store_ratings.db      # SQLite database file (auto-created)
│
└── frontend/
    └── src/
        ├── components/
        │   ├── NavBar.jsx            # Top navigation bar (all logged-in users)
        │   └── StarRating.jsx        # Interactive 1-5 star rating widget
        ├── pages/
        │   ├── Login.jsx             # Login page with demo quick-login buttons
        │   ├── Signup.jsx            # Public registration (Normal Users only)
        │   ├── AdminDashboard.jsx    # Full admin dashboard with tabs
        │   ├── UserDashboard.jsx     # Store browsing + rating page
        │   ├── StoreOwnerDashboard.jsx  # Store performance + rater list
        │   └── UpdatePassword.jsx    # Change password form
        ├── App.jsx           # Route definitions + role-based guards
        ├── api.js            # Axios instance + session helpers
        ├── index.css         # Global design system & styles
        └── main.jsx          # React entry point
```

---

## 🗄️ Database Schema

### `users` table

| Column       | Type        | Description                          |
|-------------|-------------|--------------------------------------|
| `id`         | INTEGER PK  | Auto-incremented primary key         |
| `name`       | VARCHAR(60) | Full name (20-60 chars required)     |
| `email`      | VARCHAR(255)| Unique email address                 |
| `password`   | VARCHAR(255)| bcrypt hashed password               |
| `address`    | VARCHAR(400)| Physical address (1-400 chars)       |
| `role`       | VARCHAR(20) | ADMIN, NORMAL, or STORE_OWNER        |
| `created_at` | DATETIME    | Auto timestamp                       |

### `stores` table

| Column       | Type        | Description                          |
|-------------|-------------|--------------------------------------|
| `id`         | INTEGER PK  | Auto-incremented primary key         |
| `name`       | VARCHAR(60) | Store name (20-60 chars required)    |
| `email`      | VARCHAR(255)| Store contact email                  |
| `address`    | VARCHAR(400)| Store address                        |
| `owner_id`   | INTEGER FK  | References users(id) (nullable)      |
| `created_at` | DATETIME    | Auto timestamp                       |

### `ratings` table

| Column       | Type        | Description                          |
|-------------|-------------|--------------------------------------|
| `id`         | INTEGER PK  | Auto-incremented primary key         |
| `user_id`    | INTEGER FK  | References users(id) (CASCADE)       |
| `store_id`   | INTEGER FK  | References stores(id) (CASCADE)      |
| `rating`     | INTEGER     | Value between 1 and 5 (inclusive)    |
| `created_at` | DATETIME    | First submission timestamp           |
| `updated_at` | DATETIME    | Last update timestamp                |

> **Constraint:** A user can only have **one rating per store** (UNIQUE user_id + store_id). Submitting again **updates** the existing rating.

---

## 🔌 API Endpoints

### Auth Routes — `/api/auth`

| Method | Endpoint            | Access             | Description                    |
|--------|---------------------|--------------------|--------------------------------|
| POST   | `/auth/signup`      | Public             | Register a new Normal User     |
| POST   | `/auth/login`       | Public             | Login and receive JWT token    |
| PUT    | `/auth/password`    | Any logged-in user | Change own password            |

---

### Store Routes — `/api/stores`

| Method | Endpoint                    | Access        | Description                                    |
|--------|-----------------------------|---------------|------------------------------------------------|
| GET    | `/stores`                   | Any logged-in | List all stores with avg rating & own rating   |
| POST   | `/stores/:storeId/ratings`  | NORMAL only   | Submit or update a rating (1-5)                |
| GET    | `/stores/owner/dashboard`   | STORE_OWNER   | View own stores + raters list                  |

**Query params for `GET /stores`:**
- `name` — filter by store name (partial match)
- `address` — filter by address (partial match)
- `sortBy` — `name`, `address`, or `rating`
- `sortDir` — `asc` or `desc`

---

### Admin Routes — `/api/admin` *(ADMIN only)*

| Method | Endpoint           | Description                                       |
|--------|--------------------|---------------------------------------------------|
| GET    | `/admin/dashboard` | Get total counts of users, stores, ratings        |
| GET    | `/admin/users`     | List all users (filterable + sortable)            |
| POST   | `/admin/users`     | Create a new user (NORMAL, ADMIN, or STORE_OWNER) |
| GET    | `/admin/stores`    | List all stores with avg ratings                  |
| POST   | `/admin/stores`    | Register a new store (+ optional new owner)       |

---

## 🖥️ Frontend Pages

| Route               | Component              | Access           | Description                          |
|---------------------|------------------------|------------------|--------------------------------------|
| `/login`            | Login.jsx              | Public           | Email + password login               |
| `/signup`           | Signup.jsx             | Public           | Register as Normal User              |
| `/dashboard`        | UserDashboard.jsx      | NORMAL only      | Browse and rate stores               |
| `/admin`            | AdminDashboard.jsx     | ADMIN only       | Full admin control panel             |
| `/owner`            | StoreOwnerDashboard    | STORE_OWNER only | Store performance + rater list       |
| `/account/password` | UpdatePassword.jsx     | Any logged-in    | Change password                      |
| `/`                 | HomeRedirect           | Any              | Redirects to role-appropriate page   |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- npm

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment (Optional)

Create a `.env` file in the `backend/` folder:

```env
PORT=5000
DATABASE_URL=postgres://user:pass@localhost:5432/store_ratings
JWT_SECRET=your_long_random_secret_here
```

> **Default:** If no `DATABASE_URL` is set, the app uses **SQLite** automatically at `backend/store_ratings.db`. No setup required for local development.

### 3. Run the App

```bash
# Terminal 1 — Start backend (http://localhost:5000)
cd backend
npm start

# Terminal 2 — Start frontend (http://localhost:5173)
cd frontend
npm run dev
```

On first run, the database schema is **auto-initialized** and **demo seed data is created** automatically.

---

## 🔑 Demo Credentials

> All accounts use the same password: `Password1!`

| Role           | Email                        | Password     |
|----------------|------------------------------|--------------|
| Admin          | `admin@storeratings.com`     | `Password1!` |
| Store Owner 1  | `owner1@storeratings.com`    | `Password1!` |
| Store Owner 2  | `owner2@storeratings.com`    | `Password1!` |
| Normal User 1  | `user1@storeratings.com`     | `Password1!` |
| Normal User 2  | `user2@storeratings.com`     | `Password1!` |

### Seeded Stores

| Store Name                         | Owner         |
|------------------------------------|---------------|
| Gourmet Bistro & Artisanal Bakery  | owner1        |
| Tech World Digital Electronics     | owner2        |
| Urban Fashion & Apparel Outlet     | *(no owner)*  |

---

## ✅ Validation Rules

| Field        | Rule                                                                                      |
|--------------|-------------------------------------------------------------------------------------------|
| **Name**     | 20 to 60 characters                                                                       |
| **Email**    | Valid email format (`user@domain.com`)                                                    |
| **Address**  | 1 to 400 characters                                                                       |
| **Password** | 8-16 characters, at least 1 uppercase letter, at least 1 special character (`!@#$%^&*`) |
| **Rating**   | Integer between 1 and 5 (inclusive)                                                       |

---

## 🔐 Authentication Flow

1. User logs in → Backend validates credentials → Issues a **JWT token** (7-day expiry)
2. Token stored in **`localStorage`** on the frontend
3. Every API request attaches the token via `Authorization: Bearer <token>` header
4. Backend middleware **decodes and verifies** the token, then checks role permissions
5. **Logout** clears `localStorage` (token + user data)

---

## 🎨 Design System

The app uses a **dark glassmorphism theme** with:
- Deep navy background (`#0f172a`)
- Indigo/purple primary accent color (`#6366f1`)
- Glass-effect cards with backdrop blur
- Smooth hover transitions and micro-animations
- Inter font (Google Fonts)
- Responsive grid layouts
- Role-based badge indicators in the NavBar

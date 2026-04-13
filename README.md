# Moodle Backend

A Moodle-inspired LMS backend built with **Node.js**, **Express**, and **MongoDB**. The project provides **REST APIs** for
authentication, user management, modules, assignments, submissions, preferences, dashboards, and calendar views, using
role-based access for students, teachers, and admins.

## 2. Project Overview

- **Purpose**: enable APIs for managing users, modules, assignments, submissions, and role-specific dashboard data.

- **User roles**: `student`, `teacher`, `admin` (defined in `src/constants/roles.js`).

- **Main features**:
    - Session-based login/logout
    - **Admin**: user and module management
    - **Teacher**: assignments management
    - **Student**: submissions workflow
    - Theme preference updates
    - Calendar and platform statistics APIs

- **Current backend stack**: API + MongoDB database + session store;
- **Project separation**: frontend and backend are separated; this repository contains backend APIs only. For API testing use API client such as **Bruno** with ready to use collectin stored in `src/Bruno API TESTS`

## 3. System Architecture

- **REST API order**: Express routers starts in `src/app.js` under `/api/*` referred to as a `baseUr` in **Bruno** environment.
- **Middleware**: `src/middlewares/auth.js` enable authentication and optional role checks; admin role bypasses
  role-limited checks.
- **Role-based access control**: role constants from `src/constants/roles.js` are used in route checks and per-route
  checks.
- **Authentication flow**:
    - `POST /api/auth/login` validates credentials with bcrypt and stores `{ id, role }` in `req.session.user`.
    - `POST /api/auth/logout` destroys the session.
- **Data layer**: Mongoose models stored in  `src/models` with MongoDB connection initialized in `src/server.js`.
- **Route organization**: domain-based routers (`users`, `modules`, `assignments`, `calendar`, `preferences`,
  dashboards), each initial point of entry located in `src/app.js`.
- **Entrypoint note**: this repository uses `src/server.js`; instead of `bin/www` file.

## 4. Project Structure

```text
3year-moodle-backend/
├── docker-compose.yml
├── package.json
├── package-lock.json
├── README.md
├── Readme.md
├── flake.nix
├── flake.lock
└── src/
    ├── app.js
    ├── server.js
    ├── constants/
    │   ├── roles.js
    │   └── themes.js
    ├── middlewares/
    │   └── auth.js
    ├── models/
    │   ├── user.js
    │   ├── module.js
    │   ├── assignment.js
    │   └── submission.js
    ├── routes/
    │   ├── index.js
    │   ├── auth.js
    │   ├── users.js
    │   ├── modules.js
    │   ├── assignments.js
    │   ├── preferences.js
    │   ├── adminDashboard.js
    │   └── calendar.js
    ├── utils/
    │   └── seedDatabase.js
    ├── tests/
    │   └── test.js
    └── Bruno API TESTS/
        ├── environments/
        └── ... role-based API test folders
```

Key files:

- `src/app.js`: Express app setup, JSON parsing, cookie parser, session middleware, routes access points.
- `src/server.js`: MongoDB connection + HTTP server startup.
- `src/middlewares/auth.js`: session authentication and role authorization.
- `src/utils/seedDatabase.js`: clears collections and seeds demo users to work with and test endpoints.
- `docker-compose.yml`: local MongoDB container declaration used mainly during the development. Now deprecated since
  Database was moved to **MongoDB Atlas**
- `.env.tempate`: Template holding all necessary fields for database
- `src/tests/test.js`: Automatic Endpoints tests
-  `src/Bruno API TESTS/`: Collection of manual endpoints for **Bruno** to more flexible testing 

## 5. Installation & Setup

### Prerequisites

- Node.js
- npm
- MongoDB
- Docker (Deprecated)
- 

### Clone and install

```bash
git clone https://github.com/Faotik/3year-moodle-backend
cd 3year-moodle-backend
npm install
```

### Configure environment

Create `.env` in repository root (see [Environment Variables](#6-environment-variables)).

### MongoDB setup options

- **Option A: Local MongoDB instance**
- **Option B: Docker Compose**

```bash
docker compose up -d
```

### Optional seed data

```bash
npm run seeddb
```

## 6. Environment Variables

The codebase uses the following variables:

```env
PORT=5000
SESSION_SECRET=replace_with_secure_random_string

DB_USERNAME=root
DB_PASSWORD=example
DB_HOST=localhost
DB_PORT=27017
DB_NAME=moodle

# used by test.js who works with separe Database to keep test and prod Databases isolated 
DB_NAME_TEST=moodle_test

```

Variable details:

- `PORT`: HTTP server port (`src/server.js`).
- `SESSION_SECRET`: session signing secret (`src/app.js`).
- `DB_USERNAME`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME`: primary MongoDB connection (`src/server.js`,
  `src/app.js`, `src/utils/seedDatabase.js`).
- `DB_NAME_TEST`: test database (`src/tests/test.js`).

All needed .env parameters stored in .env.template. You can duplicate, and rename it into the .env file.

## 7. Running the Project

### Development mode

```bash
npm run dev
```

### Production mode

```bash
npm start
```

### Local base URL

- `http://localhost:5000/api` (or your configured `PORT`)

## 8. Database Models

### User Model (`src/models/user.js`)

- **Purpose**: identity, credentials, role, UI preferences.
- **Fields**:
    - `name`: `String`, required
    - `email`: `String`, required, unique, indexed, lowercase
    - `password`: `String`, required (bcrypt hash)
    - `role`: `String`, required, enum: `student | teacher | admin`
    - `preferences.theme`: `String`, required, enum: `dark | light`, default `light`
- **Relationships**: no explicit mongoose `ref`.

### Module Model (`src/models/module.js`)

- **Purpose**: learning module container and membership.
- **Fields**:
    - `title`: `String`, required
    - `description`: `String`
    - `users`: `ObjectId[]` (IDs of users enrolled/linked to module)
- **Relationships**: implicit user references via IDs.

### Assignment Model (`src/models/assignment.js`)

- **Purpose**: assignment definition tied to a module.
- **Fields**:
    - `title`: `String`, required
    - `description`: `String`
    - `moduleId`: `ObjectId`, required
    - `deadline`: `Date`, required
- **Relationships**: implicit module relation via `moduleId`.
- **Timestamps**: enabled (`createdAt`, `updatedAt`).
- **Implementation note**: several routes also read/write `lecturerId` and/or `courseId`, but these are not declared in
  the schema file.

### Submission Model (`src/models/submission.js`)

- **Purpose**: student submission for an assignment.
- **Fields**:
    - `assignmentId`: `ObjectId`, required
    - `studentId`: `ObjectId`, required
    - `content`: `String`, required
- **Relationships**: implicit assignment + user references via IDs.
- **Constraints**: unique compound index on `{ assignmentId, studentId }` (one submission per student per assignment).
- **Timestamps**: enabled (`createdAt`, `updatedAt`).

## 9. API Endpoints

All endpoints are mounted under `/api`.

### Authentication

| Method | Path               | Purpose                      | Access        | Body                |
|--------|--------------------|------------------------------|---------------|---------------------|
| POST   | `/api/auth/login`  | Create authenticated session | Public        | `email`, `password` |
| POST   | `/api/auth/logout` | Destroy current session      | Authenticated | none                |

### Users (Admin APIs)

| Method | Path             | Purpose                        | Access | Body                                         |
|--------|------------------|--------------------------------|--------|----------------------------------------------|
| GET    | `/api/users`     | List users (password excluded) | Admin  |
| GET    | `/api/users/:id` | Get single user                | Admin  |
| POST   | `/api/users`     | Create user                    | Admin  | `name`, `email`, `password`, `role`          |
| PUT    | `/api/users/:id` | Update user fields             | Admin  | optional `name`, `email`, `password`, `role` |
| DELETE | `/api/users/:id` | Delete user                    | Admin  | none                                         |

### Modules

| Method | Path                           | Purpose                                                                | Access                     | Body                                     |
|--------|--------------------------------|------------------------------------------------------------------------|----------------------------|------------------------------------------|
| GET    | `/api/modules`                 | List modules (all for admin, membership-filtered for others)           | Authenticated              | none                                     |
| GET    | `/api/modules/:id`             | Get one module                                                         | Authenticated + role:admin | none                                     |
| GET    | `/api/modules/assignments/:id` | Returns all assignents linked to this module (endpoint broken in code) | Authenticated + role:admin | none                                     |
| POST   | `/api/modules`                 | Create module                                                          | Admin                      | `title`, optional `description`          |
| PUT    | `/api/modules/:id`             | Update module                                                          | Admin                      | optional `title`, `description`, `users` |
| DELETE | `/api/modules/:id`             | Delete module                                                          | Admin                      | none                                     |

### Assignments + Submissions (General router)

| Method | Path                                | Purpose                                                 | Access        |
|--------|-------------------------------------|---------------------------------------------------------|---------------|
| GET    | `/api/assignments`                  | List assignments (role-filtered)                        | Authenticated |
| GET    | `/api/assignments/:id`              | Get assignment                                          | Authenticated |
| POST   | `/api/assignments`                  | Create assignment                                       | Teacher/Admin |
| PUT    | `/api/assignments/:id`              | Update assignment                                       | Teacher/Admin |
| DELETE | `/api/assignments/:id`              | Delete assignment (+ cascade submission delete)         | Teacher/Admin |
| GET    | `/api/assignments/:id/submissions/` | List submissions for assignment (logic differs by role) | Authenticated |
| POST   | `/api/assignments/:id/submissions`  | Create student submission                               | Student       |
| PUT    | `/api/assignments/:id/submissions`  | Update student submission                               | Student       |
| DELETE | `/api/assignments/submissions/:id`  | Delete submission                                       | Teacher/Admin |

### Preferences

| Method | Path                     | Purpose                   | Access        | Body                     |
|--------|--------------------------|---------------------------|---------------|--------------------------|
| GET    | `/api/preferences/theme` | Read current user theme   | Authenticated | none                     |
| POST   | `/api/preferences/theme` | Update current user theme | Authenticated | `theme` (`dark`/`light`) |

### Calendar

| Method | Path                     | Purpose                               | Access        |
|--------|--------------------------|---------------------------------------|---------------|
| GET    | `/api/calendar/`         | List calendar events from assignments | Authenticated |
| GET    | `/api/calendar/upcoming` | List future events                    | Authenticated |
| GET    | `/api/calendar/:date`    | List events for specific date         | Authenticated |

### Admin Dashboard

| Method | Path                   | Purpose                                                    | Access |
|--------|------------------------|------------------------------------------------------------|--------|
| GET    | `/api/admin/statistic` | Platform statistic (users/modules/assignments/submissions) | Admin  |

## 10. Request / Response Models

### Login

```json
{
  "email": "email1@email.com",
  "password": "1"
}
```

Example success response:

```json
"Login successful"
```

### Register

Platform does not have a feature enable self-register. User creation handles in admin dashboard via `POST /api/users`.

Admin-create-user request:

```json
{
  "name": "New Student",
  "email": "student@example.com",
  "password": "secure-pass",
  "role": "student"
}
```

### Create Assignment (`POST /api/assignments`)

```json
{
  "title": "Essay 1",
  "description": "Submit as plain text",
  "moduleId": "66123456789abcdef012345",
  "deadline": "2026-05-01T23:59:59.000Z"
}
```

### Update Assignment (`PUT /api/assignments/:id`)

```json
{
  "title": "Essay 1 (updated)",
  "description": "Extended requirements",
  "deadline": "2026-05-03T23:59:59.000Z"
}
```

### Create Submission (`POST /api/student/assignments/:id/submissions`)

```json
{
  "content": "My answer to the assignment."
}
```

### Update Submission (`PUT /api/:id/submissions`)

### Delete Submission (`DELETE /api/submissions/:id`) 

### Admin Role Update (`PUT /api/users/:id`)

```json
{
  "role": "teacher"
}
```

Example response shape for updated user:

```json
{
  "name": "User Name",
  "email": "user@example.com",
  "role": "teacher"
}
```

## 11. Security & Validation

- **Auth mechanism**: Initial was based on JWT token, then replaced by session-based auth (`express-session` +
  `connect-mongo`).
- **JWT note**: `jsonwebtoken` is listed in dependencies but was deprecated and replaced with session-based
  authentication.
- **Role checks**:
    - Generic guard in `authMiddleware(roles)` with admin override.
- **Ownership checks**:
    - Teacher dashboard update/delete/get endpoints restrict by `lecturerId === req.user.id`.
    - Student submission endpoints restrict by `studentId === req.user.id`.
    - Module access requires membership (`module.users`) unless admin.
- **ObjectId and input validation**:
    - Many routes validate IDs using `mongoose.Types.ObjectId.isValid`.
    - Assignment and submission routes validate required fields and deadline semantics.
    - User role update validates role enum against constants.
- **Duplicate prevention**:
    - Database-level unique index on submission `(assignmentId, studentId)`.
    - Student dashboard also checks existing submission before create.

## 12. Team Contributions

| Member            | Student Number | Contribution   |
|-------------------|----------------|----------------|
| `Roman Polishcuk` |                | somehting here |
| `Kornii Kuvaldin` |                | somehting here |
| `Stanislav Kril`  | 3133810        | somehting here |

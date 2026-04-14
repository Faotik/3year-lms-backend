# Moodle Backend

A Moodle-inspired LMS backend built with **Node.js**, **Express**, and **MongoDB**. The project provides **REST APIs** for
authentication, user management, modules, assignments, submissions, preferences, dashboards, and calendar views, using
role-based access for students, teachers, and admins.

## 1. Navigation

- [1. Navigation](#1-navigation)
- [2. Project Overview](#2-project-overview)
- [3. System Architecture](#3-system-architecture)
- [4. Project Structure](#4-project-structure)
- [5. Installation & Setup](#5-installation--setup)
- [6. Environment Variables](#6-environment-variables)
- [7. Running the Project](#7-running-the-project)
- [8. Authentication](#8-authentication)
- [9. Database Models](#9-database-models)
- [10. Endpoints testing](#10-endpoints-testing)
- [11. API Endpoints](#11-api-endpoints)
- [12. Request / Response Models](#12-request--response-models)
- [13. Security & Validation](#13-security--validation)
- [14. Team Contributions](#14-team-contributions)
- [15. Project Deployment](#15-project-deployment)
- [16. Reference](#16-reference)

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
    │   ├── classTest.js
    │   ├── testSubmission.js
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
    │   ├── tests.js
    │   ├── graphs.js
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

note: Docker compose no longer supported as database migrated to cloud.

### Optionally seed data

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
MONGODB_URI=uri

DB_HOST=localhost
DB_PORT=27017
DB_NAME=moodle

# used by test.js which works with separe Database to keep test and prod Databases isolated 
DB_NAME_TEST=moodle_test

```

Variable details:

- `PORT`: HTTP server port (`src/server.js`).
- `SESSION_SECRET`: session signing secret (`src/app.js`).
- `DB_USERNAME`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME`: primary MongoDB connection (`src/server.js`,
  `src/app.js`, `src/utils/seedDatabase.js`).
- `DB_NAME_TEST`: test database (`src/tests/test.js`).

After Migrating to MongoDB Atlas, fields DB_USERNAME, DB_PASSWORD , MONGODB_URI become main concern.
<br>In order to keep project up and running connection should pass, so fields should be installed to:
```env
DB_USERNAME=hijlnotfound_db_user
DB_PASSWORD=kobKMr4GyHq3nkQC
MONGODB_URI=mongodb+srv://hijlnotfound_db_user:kobKMr4GyHq3nkQC@cluster0.eurilhk.mongodb.net/?appName=Cluster0
```

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

### Remote base URL

```link
https://threeyear-moodle-backend.onrender.com
```

## 8. Authentication

### ~~JWT~~ (Depricated)
Upon logging in, cookies with access and refresh tokens are set, which are then sent with every subsequent request.
The authentication middleware reads the access token and verifies it with the key stored on the server that was used to generate that token.
If the access token is valid, the user is granted access to the endpoint. To identify the user, the access token contains their ID and role,
so it can be used to verify whether the user has access to a specific resource.
The access token is not stored in the database, therefore, to increase user security, the access token has a short expiration time (15 minutes).
If the access token has expired, user can use their refresh token to obtain a new access token. Unlike the access token, the refresh token is stored in the database, so it can be revoked at any time if the user’s account is compromised.

### Session
Upon logging in, a cookie with session ID is set, which is then sent with every subsequent request.
The authentication middleware reads the session ID and gets the corresponding entry in the server’s memory that matches this ID. Using this information,
we can retrieve the stored user ID and the role associated with that session ID. All user information is stored on the server and
can be immediately updated to reflect any changes we make.

#### Note: JWT authentication has been depricated in favor of Session based authentication as it provides better security for our users.

## 9. Database Models

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

### Test Model (`src/models/classTest.js`)

- **Purpose**: test/quiz definition linked to a module.
- **Fields**:
    - `title`: `String`, required
    - `description`: `String`
    - `moduleId`: `ObjectId`, required
    - `deadline`: `Date`, required
    - `questions[]`:
        - `question`: `String`
        - `options`: `String[]`
        - `correctAnswer`: `String`
        - `marks`: `Number`
- **Relationships**: implicit module relation via `moduleId`.
- **Timestamps**: enabled (`createdAt`, `updatedAt`).

### Test Submission Model (`src/models/testSubmission.js`)

- **Purpose**: student answers submission for a test.
- **Fields**:
    - `testId`: `ObjectId`, required
    - `studentId`: `ObjectId`, required
    - `answers[]`:
        - `questionNumber`: `Number`
        - `answer`: `String`
- **Relationships**: implicit test + user references via IDs.
- **Constraints**: unique compound index on `{ testId, studentId }` (one submission per student per test).
- **Timestamps**: enabled (`createdAt`, `updatedAt`).

## 10. Endpoints testing
Project includes 2 ways for testing of all endpoits - [Manual](#manual-tests) and [Automatic](#automatic-tests)

### Manual tests
For manual testing we provide pre-configured list of endpoind for Bruno (api testing software).
To test endpoints, start the server:
```bash
npm run dev
```
And use bruno to send requests to the server and see what responces you will get simulating how frontend will send request to a server in procution enviroment.

### Automatic tests
For automatic tests we have setup script using Jest and Supertest that will run a number of requests to our server and check if it return correct values.
To start tests use:
```bash
npm run test
```
```
 PASS  src/tests/test.js (20.144 s)
  /api
    /auth
      POST /login
        ✓ should fail to login with wrong password (303 ms)
        ✓ should succeed to login (267 ms)
      POST /logout
        ✓ should fail to logout without login first (224 ms)
        ✓ should succeed to logout (271 ms)
    /users
      GET /
        ✓ should fail to get all users without login (223 ms)
        ✓ should fail to get all users without admin role (266 ms)
        ✓ should succeed to get all users (273 ms)
      GET /:id
        ✓ should fail to get user without login (228 ms)
        ✓ should fail to get user without admin role or being that user (272 ms)
        ✓ should succeed to get user if you admin (291 ms)
        ✓ should succeed to get user if you are that user (277 ms)
      POST /
        ✓ should fail to create user without login (225 ms)
        ✓ should fail to create user without admin role (275 ms)
        ✓ should fail to create user without all details (266 ms)
        ✓ should fail to create user with incorrect email (270 ms)
        ✓ should fail to create user with the email that aleady exists (315 ms)
        ✓ should succeed to create user (310 ms)
      PUT /:id
        ✓ should fail to update user without login (228 ms)
        ✓ should fail to update user without admin role or being that user (271 ms)
        ✓ should fail to update user with incorrect id (266 ms)
        ✓ should fail to update user with incorrect email (270 ms)
        ✓ should fail to update user with the email that aleady exists (272 ms)
        ✓ should succeed to update user (271 ms)
      DELETE /:id
        ✓ should fail to delete user without login (226 ms)
        ✓ should fail to delete user without admin role (265 ms)
        ✓ should fail to delete user with incorrect id (267 ms)
        ✓ should fail to delet last admin (265 ms)
        ✓ should succeed to delete user by admin (275 ms)
    /preferences
      GET /theme
        ✓ should fail to get theme without login (226 ms)
        ✓ should succeed to get user theme (273 ms)
      POST /theme
        ✓ should fail to update theme without login (221 ms)
        ✓ should fail to update preference with invalid theme (272 ms)
        ✓ should succeed to update user theme (274 ms)
    /modules
      GET /
        ✓ should fail to get all modules without login (227 ms)
        ✓ should succeed to get all user's modules (272 ms)
        ✓ should succeed to get all modules by admin (272 ms)
      GET /:id
        ✓ should fail to get module without login (234 ms)
        ✓ should fail to get module with incorrect id (273 ms)
        ✓ should fail to get module if user doesn't has access (266 ms)
        ✓ should succeed to get module if user has access (270 ms)
      GET /:id/assignments
        ✓ should fail to get all assignments without login (223 ms)
        ✓ should succeed to get all modules assignments (268 ms)
      POST /
        ✓ should fail to create module without login (220 ms)
        ✓ should fail to create module without admin role (268 ms)
        ✓ should fail to create module without title (264 ms)
        ✓ should succeed to create module (271 ms)
      PUT /:id
        ✓ should fail to update module without login (220 ms)
        ✓ should fail to update user without admin role (272 ms)
        ✓ should fail to update module with incorrect id (268 ms)
        ✓ should succeed to update module (269 ms)
      DELETE /:id
        ✓ should fail to delete module without login (223 ms)
        ✓ should fail to delete user without admin role (264 ms)
        ✓ should fail to delete module with incorrect id (261 ms)
        ✓ should succeed to delete module by admin (274 ms)
    /assignments
      GET /
        ✓ should fail to get all assignments without login (222 ms)
        ✓ should succeed to get all assignments by teacher (262 ms)
        ✓ should succeed to get all assignments by admin (263 ms)
      GET /:id
        ✓ should fail to get assignment without login (224 ms)
        ✓ should fail to get assignment with invalide id (267 ms)
        ✓ should succeed to get an assignment (267 ms)
      POST /
        ✓ should fail to create an assignment without login (224 ms)
        ✓ should fail to creating an assignment by student (278 ms)
        ✓ should fail to creating an assignment with incorrect details (278 ms)
        ✓ should succeed to create an assignmen by teacher (274 ms)
        ✓ should succeed to create an assignmen by admin (270 ms)
      PUT /:id
        ✓ should fail to update assignment without login (224 ms)
        ✓ should fail to update assignment without teacher role (268 ms)
        ✓ should fail to update assignment with incorrect id (267 ms)
        ✓ should fail to update assignment by incorrect teacher (273 ms)
        ✓ should succeed to update assignment by teacher (275 ms)
        ✓ should succeed to update assignment by admin (265 ms)
      DELETE /:id
        ✓ should fail to delete assignment without login (221 ms)
        ✓ should fail to delete assignment by incorrect teacher (269 ms)
        ✓ should fail to delete assignment with incorrect id (266 ms)
        ✓ should succeed to delete assignment by teacher (276 ms)
        ✓ should succeed to delete assignment by admin (271 ms)

Test Suites: 1 passed, 1 total
Tests:       76 passed, 76 total
Snapshots:   0 total
Time:        20.176 s, estimated 44 s
Ran all test suites.
```

## 11. API Endpoints

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
| GET    | `/api/modules/:id/assignments` | Returns all assignents linked to this module (endpoint broken in code) | Authenticated + role:admin | none                                     |
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

### Tests + Test Submissions

| Method | Path                          | Purpose                                                               | Access        |
|--------|-------------------------------|-----------------------------------------------------------------------|---------------|
| GET    | `/api/tests`                  | List tests (role-filtered; students do not receive correct answers)   | Authenticated |
| GET    | `/api/tests/:id`              | Get single test (students do not receive correct answers)             | Authenticated |
| POST   | `/api/tests`                  | Create test                                                           | Teacher/Admin |
| PUT    | `/api/tests/:id`              | Update test                                                           | Teacher/Admin |
| DELETE | `/api/tests/:id`              | Delete test (+ cascade test-submission delete)                        | Teacher/Admin |
| GET    | `/api/tests/:id/submissions/` | List test submissions (role-filtered; includes computed score fields) | Authenticated |
| POST   | `/api/tests/:id/submissions`  | Create test submission                                                | Student       |
| PUT    | `/api/tests/:id/submissions`  | Update own test submission                                            | Student       |
| DELETE | `/api/tests/:id/submissions`  | Delete own test submission (teacher/admin route guard)                | Teacher/Admin |

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

### Graphs

| Method | Path                | Purpose                                  | Access |
|--------|---------------------|------------------------------------------|--------|
| GET    | `/api/graphs/stats` | Return global stats used by graph widgets | Public |

## 12. Request / Response Models

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

### Update Submission (`PUT /api/assignments/:id/submissions`)

Request body:

```json
{
  "content": "Updated answer text."
}
```

Success response (`200`):

```json
{
  "_id": "66123456789abcdef0123ff",
  "assignmentId": "66123456789abcdef012345",
  "studentId": "66123456789abcdef012346",
  "content": "Updated answer text.",
  "createdAt": "2026-04-01T10:00:00.000Z",
  "updatedAt": "2026-04-01T10:05:00.000Z"
}
```

Common errors:
- `400` when `content` is missing/invalid
- `404` when assignment or submission does not exist
- `403` when role is not `student`

### Delete Submission (`DELETE /api/assignments/submissions/:id`)

Success response (`200`):

```json
{
  "message": "Submission deleted"
}
```

### Delete Submission (legacy path) (`DELETE /api/assignments/submissions/:id`)
Path params:

```json
{
  "id": "66123456789abcdef0123ff"
}
```

Success response (`200`):

```json
{
  "message": "Submission deleted"
}
```

Common errors:
- `400` when `id` is not a valid Mongo ObjectId
- `404` when submission does not exist
- `403` when role is not teacher/admin

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

## 13. Security & Validation

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

## 14. Team Contributions

| Member            | Student Number |
|-------------------|----------------|
| `Roman Polishcuk` | 3135838        |
| `Kornii Kuvaldin` | 3134926        |
| `Stanislav Kril`  | 3133810        |

Contribution
- Project setup and DB connection (docker) - `Roman Polishcuk`
- Registration, authentication (JWT + Session), authorization - `Roman Polishchuk`
- DB seeding - `Stanislav Kril, Roman Polishchuk`
- API preferences - `Roman Polishchuk`
- API assignments + submitions - `Stanislav Kril, Roman Polishchuk`
- API modules - `Kornii Kuvaldin`
- API users - `Kornii Kuvaldin`
- API graphs - `Kornii Kuvaldin`
- API calendar - `Stanislav Kril`
- API class tests - `Roman Polishchuk`
- Manual Tests (Bruno) - `Stanislav Kril`
- Automatic Tests (jest + supertest) - `Roman Polishchuk`
- Documentation (Readme.md) - `Stanislav Kril`
- Database Migration (Docker -> MongoDB Atlas) -`Stanislav Kril`
- Project host (render.com) -`Stanislav Kril`

## 15. Project Deployment
Backend hosted at render.com and can be accessible by link:
```link
https://threeyear-moodle-backend.onrender.com
```

## 16. Reference
- https://www.albertgao.com/2017/05/24/how-to-test-expressjs-with-jest-and-supertest/
- https://www.youtube.com/watch?v=FKnzS_icp20
- https://www.youtube.com/watch?v=mbsmsi7l3r4&t=
- https://www.youtube.com/watch?v=k1GjLMgz8OQ
- https://www.mongodb.com/docs/v7.0/tutorial/install-mongodb-community-with-docker/

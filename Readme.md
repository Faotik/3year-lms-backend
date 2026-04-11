# Better Moodle

***
## Installation

For starting development, you need:

```bash
# Clone the repository
git clone git@github.com:Faotik/3year-moodle-backend.git

# Navigate into the folder
cd 3year-moodle-backend

# Install dependencies
npm install
```

### Env file customization
Copy an .env.template file and rename it to .env

Change the values to any in favor, for instance:

```bash
DB_USERNAME=mongouser
DB_PASSWORD=mongopass
DB_HOST=localhost
DB_PORT=27017
DB_NAME=moodle
SERVER_PORT=5000
ACCESS_TOKEN_SECRET=secret
REFRESH_TOKEN_SECRET=secret
SESSION_SECRET=secret
```
<strong>
Warning: ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET are deprecated. We use now session based authetication insetead of jwt token
</strong>
<br>
<s> To get ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET, use this: 

```bash
# Create hex tokens, one value for 
node
require('crypto').randomBytes(64).toString('hex')
require('crypto').randomBytes(64).toString('hex')
```
Copy values and paste to ACCESS_TOKEN_SECRET followed by REFRESH_TOKEN_SECRET.
</s>
<br> To get autication working, you need to implement field SESSION_SECRET with secure key to represent sessionID. https://secretkeygen.vercel.app/ as an option to generate such key

<br>The final .env file should look like this:
```bash
DB_USERNAME=mongouser
DB_PASSWORD=mongopass
DB_HOST=localhost
DB_PORT=27017
DB_NAME=moodle
SERVER_PORT=5000
SESSION_SECRET=63f4945d921d599f27ae4fdf5bada3f1
```

### Starting Backend
```bash
# Make sure you are in the root directory of project
cd 3year-moodle-backend

# Open terminal, and run Docker container of mongo db
docker compose up -d

# Start the server at the same directory
npm run dev
```

After running server, the expected output in console are:
```bash
Server running on port 5000
Connected to Database
```

If you're seeing this, everything works fine. 
You ready for development and testing

For healthy shutdown of containers, use
```bash
docker compose down
```

### Debugging 
If any errors occur, try to run docker in debug mode

```bash
# Stop container 
docker compose down

# Run container in debug mode
docker compose up
```

***
## Project Structure

```text
3year-moodle-backend/
├── src/
│   ├── app.js                    # Express app configuration and route mounting
│   ├── server.js                 # MongoDB connection + HTTP server startup
│   ├── constants/
│   │   ├── roles.js              # Role enum: student | teacher | admin
│   │   └── themes.js             # Theme enum: light | dark
│   ├── middlewares/
│   │   └── auth.js               # Session authentication middleware
│   ├── models/
│   │   ├── user.js               # User schema (role, credentials, preferences)
│   │   ├── assignment.js         # Assignment schema (courseId, lecturerId, deadline)
│   │   ├── submission.js         # Submission schema (assignmentId, studentId, content)
│   │   └── module.js             # Learning module schema
│   └── routes/
│       ├── index.js              # Health/root route
│       ├── auth.js               # Register, login, logout
│       ├── users.js              # User CRUD endpoints
│       ├── assignments.js        # Generic assignment + submission endpoints
│       ├── preferences.js        # Theme preferences
│       ├── adminDashboard.js     # Admin-only management routes
│       ├── studentDashboard.js   # Student-only dashboard routes
│       ├── teacherDashboard.js   # Teacher-only dashboard routes
│       ├── modules.js            # Module CRUD endpoints
│       └── calendar.js           # Calendar/event endpoints from assignments
├── .env.template                 # Environment variable template
├── docker-compose.yml            # MongoDB service for local development
├── package.json                  # NPM scripts and dependencies
└── Readme.md
```
***

## Architecture and Request Lifecycle

- `src/server.js` starts the process and connects to MongoDB.
- `src/app.js` builds Express middleware stack (`express.json`, cookies, sessions) and mounts all `/api/*` routers.
- Incoming HTTP requests are handled in `src/routes/*`.
- Routes read/write MongoDB through Mongoose schemas in `src/models/*`.
- Session auth (`express-session` + `connect-mongo`) stores `req.session.user = { id, role }` after successful login.

## Authentication and Roles

- Auth middleware: routes protected with `auth` require an active session; otherwise they return `400 "Not authenticated"`.
- Role checks are implemented in route modules and return `403` for forbidden access.
- Supported roles from `src/constants/roles.js`:

```json
["student", "teacher", "admin"]
```

- Theme values from `src/constants/themes.js`:

```json
["light", "dark"]
```

***
## API Base URL

All endpoints are mounted under:

```text
http://localhost:5000/api
```

***
## Endpoint Reference

### 1) System

#### `GET /api/`
- Auth: No
- Params: None
- Query: None
- Body: None
- Response `200`: plain text `"Hello, world!"`

### 2) Authentication (`/api/auth`)

#### `POST /api/auth/register`
- Auth: No
- Body:
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "student | teacher | admin"
}
```
- Response `200`:
```json
{
  "name": "string",
  "email": "string",
  "role": "student | teacher | admin"
}
```

#### `POST /api/auth/login`
- Auth: No
- Body:
```json
{
  "email": "string",
  "password": "string"
}
```
- Side effect: creates session (`req.session.user`)
- Response `200`: `"Login successful"`
- Error `400`: `"Incorrect login credentials"`

#### `POST /api/auth/logout`
- Auth: Yes
- Body: None
- Side effect: clears current session
- Response `200`: `"Logout successful"`

### 3) Users (`/api/users`)

#### `GET /api/users/:id`
- Auth: No
- Params:
```json
{ "id": "MongoObjectId" }
```
- Response `200`: user object (password excluded)

#### `POST /api/users/`
- Auth: No
- Body:
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "student | teacher | admin"
}
```
- Response `201`: created user object (password excluded)

#### `PUT /api/users/:id`
- Auth: No
- Params:
```json
{ "id": "MongoObjectId" }
```
- Body (partial update):
```json
{
  "name": "string (optional)",
  "email": "string (optional)",
  "role": "student | teacher | admin (optional)",
  "password": "string (optional)"
}
```
- Response `200`: updated user object (password excluded)

#### `DELETE /api/users/:id`
- Auth: No
- Params:
```json
{ "id": "MongoObjectId" }
```
- Response `200`:
```json
{ "message": "User deleted" }
```

### 4) Assignments + Submissions (`/api/assignments`)

#### `POST /api/assignments/`
- Auth: Yes (`teacher` only)
- Body:
```json
{
  "title": "string",
  "description": "string (optional)",
  "courseId": "MongoObjectId",
  "deadline": "ISO date string"
}
```
- Response `201`: assignment object

#### `PUT /api/assignments/:id`
- Auth: Yes (`teacher` only; owner only)
- Params:
```json
{ "id": "MongoObjectId" }
```
- Body (partial):
```json
{
  "title": "string (optional)",
  "description": "string (optional)",
  "deadline": "ISO date string (optional)"
}
```
- Response `200`: updated assignment object

#### `GET /api/assignments/`
- Auth: Yes
- Behavior by role:
  - `admin`: all assignments
  - `teacher`: own assignments
  - `student`: all assignments (temporary behavior in code)
- Response `200`: assignment array

#### `GET /api/assignments/course/:courseId`
- Auth: Yes
- Params:
```json
{ "courseId": "MongoObjectId" }
```
- Response `200`: assignment array filtered by `courseId`

#### `GET /api/assignments/:id`
- Auth: Yes
- Params:
```json
{ "id": "MongoObjectId" }
```
- Response `200`: assignment object

#### `POST /api/assignments/:id/submissions`
- Auth: Yes (`student` only)
- Params:
```json
{ "id": "MongoObjectId (assignmentId)" }
```
- Body:
```json
{ "content": "string" }
```
- Response `201`: submission object

#### `PUT /api/assignments/:id/submissions`
- Auth: Yes (`student` only)
- Params:
```json
{ "id": "MongoObjectId (assignmentId)" }
```
- Body (intended):
```json
{ "content": "string" }
```
- Response `200`: updated submission object

#### `GET /api/assignments/:id/submissions/me`
- Auth: Yes
- Params:
```json
{ "id": "MongoObjectId (assignmentId)" }
```
- Response `200`: current user submission object (or `null` if not found in this route)

#### `GET /api/assignments/:id/submissions`
- Auth: Yes (`teacher` only)
- Params:
```json
{ "id": "MongoObjectId (assignmentId)" }
```
- Response `200`: submission array for assignment

### 5) Preferences (`/api/preferences`)

#### `GET /api/preferences/theme`
- Auth: Yes
- Body: None
- Response `200`:
```json
{ "theme": "light | dark" }
```

#### `POST /api/preferences/theme`
- Auth: Yes
- Body:
```json
{ "theme": "light | dark" }
```
- Response `200`:
```json
{ "theme": "light | dark" }
```
- Error `400`: `"Invalid theme"`

### 6) Admin Dashboard (`/api/admin`)

#### `POST /api/admin/createUser`
- Auth: No (current code has no auth middleware on this route)
- Body:
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "student | teacher | admin"
}
```
- Response `200`:
```json
{
  "name": "string",
  "email": "string",
  "role": "student | teacher | admin"
}
```

#### `GET /api/admin/users`
- Auth: Yes (`admin` only)
- Response `200`: users array (sensitive fields excluded)

#### `PUT /api/admin/users/:id/role`
- Auth: Yes (`admin` only)
- Params:
```json
{ "id": "MongoObjectId" }
```
- Body:
```json
{ "role": "student | teacher | admin" }
```
- Response `200`: updated user object

#### `DELETE /api/admin/users/:id`
- Auth: Yes (`admin` only)
- Params:
```json
{ "id": "MongoObjectId" }
```
- Response `200`:
```json
{ "message": "User deleted" }
```

#### `GET /api/admin/assignments`
- Auth: Yes (`admin` only)
- Response `200`: assignment array

#### `DELETE /api/admin/assignments/:id`
- Auth: Yes (`admin` only)
- Params:
```json
{ "id": "MongoObjectId" }
```
- Response `200`:
```json
{ "message": "Assignment deleted" }
```

#### `PUT /api/admin/assignments/:id`
- Auth: Yes (`admin` only)
- Params:
```json
{ "id": "MongoObjectId" }
```
- Body (at least one field):
```json
{
  "title": "string (optional)",
  "description": "string (optional)",
  "deadline": "ISO date string (optional)"
}
```
- Response `200`: updated assignment object

#### `GET /api/admin/submissions`
- Auth: Yes (`admin` only)
- Response `200`: submission array

#### `DELETE /api/admin/submissions/:id`
- Auth: Yes (`admin` only)
- Params:
```json
{ "id": "MongoObjectId" }
```
- Response `200`:
```json
{ "message": "Submission deleted" }
```

#### `GET /api/admin/statistic`
- Auth: Yes (`admin` only)
- Response `200`:
```json
{
  "users": 0,
  "student": 0,
  "teacher": 0,
  "admin": 0,
  "modules": 0,
  "assignments": 0,
  "submissions": 0
}
```

### 7) Student Dashboard (`/api/student`)

#### `GET /api/student/assignments`
- Auth: Yes (`student` only)
- Response `200`: assignment array

#### `GET /api/student/assignments/:id`
- Auth: Yes (`student` only)
- Params:
```json
{ "id": "MongoObjectId" }
```
- Response `200`: assignment object

#### `POST /api/student/assignments/:id/submissions`
- Auth: Yes (`student` only)
- Params:
```json
{ "id": "MongoObjectId (assignmentId)" }
```
- Body:
```json
{ "content": "string" }
```
- Response `201`: submission object

#### `PUT /api/student/assignments/:id/submissions`
- Auth: Yes (`student` only)
- Params:
```json
{ "id": "MongoObjectId (assignmentId)" }
```
- Body:
```json
{ "content": "string" }
```
- Response `200`: updated submission object

#### `GET /api/student/assignments/:id/submissions/me`
- Auth: Yes (`student` only)
- Params:
```json
{ "id": "MongoObjectId (assignmentId)" }
```
- Response `200`: current student submission object

#### `GET /api/student/submissions`
- Auth: Yes (`student` only)
- Response `200`: submission array for current student

### 8) Teacher Dashboard (`/api/teacher`)

#### `POST /api/teacher/`
- Auth: Yes (`teacher` only)
- Body:
```json
{
  "title": "string",
  "description": "string (optional)",
  "courseId": "MongoObjectId",
  "deadline": "ISO date string"
}
```
- Response `201`: assignment object

#### `PUT /api/teacher/:id`
- Auth: Yes (`teacher` only; owner only)
- Params:
```json
{ "id": "MongoObjectId" }
```
- Body (partial):
```json
{
  "title": "string (optional)",
  "description": "string (optional)",
  "deadline": "ISO date string (optional)"
}
```
- Response `200`: updated assignment object

#### `DELETE /api/teacher/:id`
- Auth: Yes (`teacher` only; owner only)
- Params:
```json
{ "id": "MongoObjectId" }
```
- Response `200`:
```json
{ "message": "Assignment deleted successfully" }
```

#### `GET /api/teacher/`
- Auth: Yes (`teacher` only)
- Response `200`: assignment array created by current teacher

#### `GET /api/teacher/:id`
- Auth: Yes (`teacher` only; owner only)
- Params:
```json
{ "id": "MongoObjectId" }
```
- Response `200`: assignment object

### 9) Modules (`/api/modules`)

#### `GET /api/modules/`
- Auth: No
- Response `200`: module array

#### `GET /api/modules/:id`
- Auth: No
- Params:
```json
{ "id": "MongoObjectId" }
```
- Response `200`: module object

#### `POST /api/modules/`
- Auth: No
- Body:
```json
{
  "title": "string",
  "description": "string (optional)"
}
```
- Response `201`: created module object

#### `PUT /api/modules/:id`
- Auth: No
- Params:
```json
{ "id": "MongoObjectId" }
```
- Body (partial):
```json
{
  "title": "string (optional)",
  "description": "string (optional)"
}
```
- Response `200`: updated module object

#### `DELETE /api/modules/:id`
- Auth: No
- Params:
```json
{ "id": "MongoObjectId" }
```
- Response `200`:
```json
{ "message": "Module deleted" }
```

### 10) Calendar (`/api/calendar`)

Calendar event object shape:
```json
{
  "id": "MongoObjectId",
  "title": "string",
  "description": "string",
  "deadline": "ISO date string",
  "courseId": "MongoObjectId"
}
```

#### `GET /api/calendar/`
- Auth: Yes
- Response `200`: event array (role filtered)

#### `GET /api/calendar/upcoming`
- Auth: Yes
- Response `200`: upcoming event array (deadline >= now)

#### `GET /api/calendar/:date`
- Auth: Yes
- Params:
```json
{ "date": "YYYY-MM-DD or any parseable date string" }
```
- Response `200`: event array for selected day

***
## Core Request Payload Templates

### Register User
```json
{
  "name": "Alice Example",
  "email": "alice@example.com",
  "password": "StrongPassword123",
  "role": "student"
}
```

### Login
```json
{
  "email": "alice@example.com",
  "password": "StrongPassword123"
}
```

### Create Assignment
```json
{
  "title": "Homework 1",
  "description": "Complete all exercises from chapter 2.",
  "courseId": "6613f8ac6b8d5f0db1f2a9f2",
  "deadline": "2026-05-01T23:59:59.000Z"
}
```

### Update Assignment
```json
{
  "title": "Homework 1 (Updated)",
  "description": "Updated task details",
  "deadline": "2026-05-03T23:59:59.000Z"
}
```

### Submit Assignment
```json
{
  "content": "Link to repository and explanation of implementation."
}
```

### Update User Role (Admin)
```json
{
  "role": "teacher"
}
```

### Create/Update Module
```json
{
  "title": "Algorithms",
  "description": "Sorting, searching, and complexity basics."
}
```

### Update Theme Preference
```json
{
  "theme": "dark"
}
```
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
```

To get ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET, use this:

```bash
# Create hex tokens, one value for 
node
require('crypto').randomBytes(64).toString('hex')
require('crypto').randomBytes(64).toString('hex')
```
Copy values and paste to ACCESS_TOKEN_SECRET followed by REFRESH_TOKEN_SECRET.

The final .env file should look like this:
```bash
DB_USERNAME=mongouser
DB_PASSWORD=mongopass
DB_HOST=localhost
DB_PORT=27017
DB_NAME=moodle
SERVER_PORT=5000
ACCESS_TOKEN_SECRET=167c219db837f5d0a885f3c4a95fce6bb8875eaf9c7e30cbc93619995187374ab4a04428f29ed30dbb9ef62bf75cb4503e51918a814bacfdbdd23521b5348b84
REFRESH_TOKEN_SECRET=d45f3e53a3bd7ca673871efb2bf4d6da59cf3cc65653c8ab1f8851dbd9c6c5e7139b161f1aa844f2ddaab0bfb8361b327d25cf8d2211b75aadc105eb3ff8ab2e
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
│
├─src/
│   ├── models/     Mongoose models
│   ├── routes/     Routes + logic
│
│
├── app.js          # Express app entry
├── server.js       # Development server
├── package.json
└── README.md
```
```text
models - hold boiler plates of expected JSON formats for every data pieces
routes - hold APi endpoints with logic in monolith format
```
***

## Request Structure
Each Request model described in ```models/``` directory, however the model of is not present there.

For ```auth/register``` endpoint, request structure is
```JSON
"name": "string",
"email": "string",
"password": "string",
"role": "string",
```
```role``` parameter are an ENUM, which hold ```['user', 'teacher', 'admin']```. For valid request, role parameter should be one of the ENUM values

For ```auth/login``` endpoint, request structure is
```JSON
"email": "string",
"password": "string",
```
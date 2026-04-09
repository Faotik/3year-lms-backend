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
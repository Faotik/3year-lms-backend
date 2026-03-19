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
const express = require('express');
const cookieParser = require('cookie-parser');

const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const assignmentRoutes = require('./routes/assignments');
const preferencesRoutes = require('./routes/preferences');
const adminDashboard = require('./routes/adminDashboard');
const studentDashboard = require('./routes/studentDashboard');
const modulesRoutes = require('./routes/modules');
const calendarRoutes = require('./routes/calendar');

const app = express();

app.use(express.json());
app.use(cookieParser());


// APi endpoints
app.use('/api', indexRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/admin', adminDashboard);
app.use('/api/student', studentDashboard);
app.use('/api/modules', modulesRoutes);
app.use('/api/calendar', calendarRoutes);

module.exports = app;

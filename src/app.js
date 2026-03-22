const express = require('express');
const cookieParser = require('cookie-parser');

const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const assignmentRoutes = require('./routes/assignments');
const preferencesRoutes = require('./routes/preferences');

const app = express();

app.use(express.json());
app.use(cookieParser());


// APi endpoints
app.use('/api', indexRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/preferences', preferencesRoutes);

module.exports = app;

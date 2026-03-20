const express = require('express');
const cookieParser = require('cookie-parser');

const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const assignmentRoutes = require('./routes/assignments');

const app = express();

app.use(express.json());
app.use(cookieParser());


// APi endpoints
app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/assignments', assignmentRoutes);

module.exports = app;

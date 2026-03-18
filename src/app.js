const express = require('express');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const assignmentRoutes = require('./routes/assignments');

const app = express();

app.use(express.json());

// Temporary imitation of users roles <Remove after implementation of  role api >
app.use((req, res, next) => {
    // mock user
    req.user = {
        id: '64f0abc1234567890abcdef1', // any valid ObjectId-like string
        role: 'lecturer' // or 'student' if needed
    };
    next();
});

// APi endpoints
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/assignments', assignmentRoutes);

module.exports = app;

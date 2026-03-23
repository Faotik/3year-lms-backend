const express = require('express');
const cookieParser = require('cookie-parser');

const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const assignmentRoutes = require('./routes/assignments');
const modulesRoutes = require('./routes/modules');

const app = express();

app.use(express.json());
app.use(cookieParser());

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
app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/assignments', assignmentRoutes);
app.use('/modules', modulesRoutes);

module.exports = app;

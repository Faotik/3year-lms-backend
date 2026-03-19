const express = require('express');
const cookieParser = require('cookie-parser');

const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/users', usersRouter);

module.exports = app;

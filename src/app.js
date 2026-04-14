require('dotenv').config()

const express = require('express');
const cookieParser = require('cookie-parser');

const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const assignmentRoutes = require('./routes/assignments');
const preferencesRoutes = require('./routes/preferences');
const adminDashboard = require('./routes/adminDashboard');
const modulesRoutes = require('./routes/modules');
const graphsRoutes = require('./routes/graphs');
const calendarRoutes = require('./routes/calendar');
const testRoutes = require('./routes/tests');

const app = express();

app.use(express.json());
app.use(cookieParser());

const session = require('express-session');
const MongoStore = require('connect-mongo').default;
const mongoUri = process.env.MONGODB_URI
    || `mongodb://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?authSource=admin`;

let sessionConfig = session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60,
        secure: false,
        httpOnly: true,
    },
});
if (!process.env.TEST_ENV) {
    sessionConfig.store = new MongoStore({
        mongoUrl: mongoUri
    })
}
app.use(sessionConfig);

// APi endpoints
app.use('/api', indexRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/graphs', graphsRoutes);

app.use('/api/admin', adminDashboard);

app.use('/api/modules', modulesRoutes);
app.use('/api/calendar', calendarRoutes);

app.use('/api/tests', testRoutes);

module.exports = app;

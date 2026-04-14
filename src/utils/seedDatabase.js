require('dotenv').config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const User = require("../models/user");
const ROLES = require("../constants/roles");

async function seed() {


    await mongoose.connect(`mongodb://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?authSource=admin`);
    const db = mongoose.connection;
    db.on('error', (error) => console.error(error));
    db.once('open', () => console.log('Connected to Database'));


    //Clear DB
    const collections = mongoose.connection.collections;
    for (let key in collections) {
        await collections[key].deleteMany();
    }

// seed users
    const users = [
        {name: "User1", email: "email1@email.com", password: "1", role: ROLES.STUDENT},
        {name: "User2", email: "email2@email.com", password: "1", role: ROLES.STUDENT},
        {name: "Teacher1", email: "email3@email.com", password: "1", role: ROLES.TEACHER},
        {name: "Teacher2", email: "email4@email.com", password: "1", role: ROLES.TEACHER},
        {name: "Admin1", email: "email5@email.com", password: "1", role: ROLES.ADMIN},
    ];

    for (const user of users) {
        const hashedPassword = await bcrypt.hash(user.password, 10);

        await User.create({
            name: user.name,
            email: user.email,
            password: hashedPassword,
            role: user.role,
        });
    }

    await mongoose.disconnect();
}

seed().catch((err) => {
    console.error(err);
});
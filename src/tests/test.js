const request = require("supertest");
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');

const app = require("../app");
const ROLES = require("../constants/roles");
const User = require('../models/user')


//Connect to db
beforeAll(async () => {
    mongoose.connect(`mongodb://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?authSource=admin`);
});

beforeEach(async () => {
    //Clear DB
    const collections = mongoose.connection.collections;
    for (let key in collections) {
        await collections[key].deleteMany();
    }

    //Populate DB with initial values 
    let users = [
        { name: "User1", email: "email1@email.com", password: "1", role: ROLES.STUDENT },
        { name: "User2", email: "email2@email.com", password: "1", role: ROLES.STUDENT },
        { name: "Teacher1", email: "email3@email.com", password: "1", role: ROLES.TEACHER },
        { name: "Teacher2", email: "email4@email.com", password: "1", role: ROLES.TEACHER },
        { name: "Admin1", email: "email5@email.com", password: "1", role: ROLES.ADMIN },
    ];

    for (const user of users) {
        //Hash password
        const hashed_password = await bcrypt.hash(user.password, 10);
        //Add user to db
        await User.create({
            name: user.name,
            email: user.email,
            password: hashed_password,
            role: user.role,
        });
    }

});

//Close db
afterAll(async () => {
    await mongoose.disconnect();
});

describe("/api", () =>
    describe("/users", () =>
        describe("GET", () => {
            it("should fail to get all users without login", async () => {
                let route = request.agent(app);

                const res = await route
                    .get("/api/users");

                expect(res.statusCode).toBe(401);
            });
            it("should fail to get all users without admin role", async () => {
                let route = request.agent(app);

                await route
                    .post("/api/auth/login")
                    .send({ email: "email1@email.com", password: "1" });
                const res = await route
                    .get("/api/users");

                expect(res.statusCode).toBe(403);
            });
            it("should succeed", async () => {
                let route = request.agent(app);

                const log_req = await route
                    .post("/api/auth/login")
                    .send({ email: "email5@email.com", password: "1" });
                console.log(log_req.headers);
                const res = await route
                    .get("/api/users");

                expect(res.statusCode).toBe(200);
                expect(res.body).toBeDefined();
            });
        })
    )
);

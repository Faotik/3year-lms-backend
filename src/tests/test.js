const request = require("supertest");
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');

const app = require("../app");
const ROLES = require("../constants/roles");
const User = require('../models/user')

//Connect to db
beforeAll(async () => {
    await mongoose.connect(`mongodb://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME_TEST}?authSource=admin`);
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

describe("/api", () => {
    describe("/auth", () => {
        describe("POST /login", () => {
            it("should fail to login with wrong password", async () => {
                const route = request.agent(app);

                const res = await route
                    .post("/api/auth/login")
                    .send({ email: "email1@email.com", password: "2" });

                expect(res.statusCode).toBe(401);
            });
            it("should succeed to login", async () => {
                const route = request.agent(app);

                const res = await route
                    .post("/api/auth/login")
                    .send({ email: "email1@email.com", password: "1" });

                expect(res.statusCode).toBe(200);
            });
        })
        describe("POST /logout", () => {
            it("should fail to logout without login first", async () => {
                let route = request.agent(app);

                const res = await route
                    .post("/api/auth/logout");

                expect(res.statusCode).toBe(401);
            });
            it("should succeed to logout", async () => {
                let route = request.agent(app);

                await route
                    .post("/api/auth/login")
                    .send({ email: "email1@email.com", password: "1" });

                const res = await route
                    .post("/api/auth/logout").send({});

                expect(res.statusCode).toBe(200);
            });
        })
    })
    describe("/users", () => {
        describe("GET /", () => {
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
            it("should succeed to get all users", async () => {
                let route = request.agent(app);

                await route
                    .post("/api/auth/login")
                    .send({ email: "email5@email.com", password: "1" });
                const res = await route
                    .get("/api/users");

                expect(res.statusCode).toBe(200);
                expect(res.body).toBeDefined();
            });
        })
    })
});

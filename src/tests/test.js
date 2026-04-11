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
        describe("GET /:id", () => {
            it("should fail to get user without login", async () => {
                let route = request.agent(app);

                const res = await route
                    .get("/api/users");

                expect(res.statusCode).toBe(401);
            });
            it("should fail to get user without admin role or being that user", async () => {
                let route = request.agent(app);

                const user = await User.findOne({ email: "email1@email.com" });

                await route
                    .post("/api/auth/login")
                    .send({ email: "email2@email.com", password: "1" });
                const res = await route
                    .get(`/api/users/${user.id}`);

                expect(res.statusCode).toBe(403);
            });
            it("should succeed to get user if you admin", async () => {
                let route = request.agent(app);

                const user = await User.findOne({ email: "email1@email.com" });

                await route
                    .post("/api/auth/login")
                    .send({ email: "email5@email.com", password: "1" });
                const res = await route
                    .get(`/api/users/${user.id}`);

                expect(res.statusCode).toBe(200);
                expect(res.body).toBeDefined();
                expect(res.body.name).toBe(user.name);
                expect(res.body.email).toBe(user.email);
                expect(res.body.role).toBe(user.role);
            });
            it("should succeed to get user if you are that user", async () => {
                let route = request.agent(app);

                const user = await User.findOne({ email: "email1@email.com" });

                await route
                    .post("/api/auth/login")
                    .send({ email: "email1@email.com", password: "1" });
                const res = await route
                    .get(`/api/users/${user.id}`);

                expect(res.statusCode).toBe(200);
                expect(res.body).toBeDefined();
                expect(res.body.name).toBe(user.name);
                expect(res.body.email).toBe(user.email);
                expect(res.body.role).toBe(user.role);
            });
        })
        describe("POST /", () => {
            it("should fail to create user without login", async () => {
                let route = request.agent(app);

                const res = await route
                    .post("/api/users")
                    .send({
                        name: "TestUser",
                        email: "test@email.com",
                        password: "2",
                        role: ROLES.STUDENT,
                    });

                expect(res.statusCode).toBe(401);
            });
            it("should fail to create user without admin role", async () => {
                let route = request.agent(app);

                await route
                    .post("/api/auth/login")
                    .send({ email: "email1@email.com", password: "1" });

                const res = await route
                    .post("/api/users")
                    .send({
                        name: "TestUser",
                        email: "test@email.com",
                        password: "2",
                        role: ROLES.STUDENT,
                    });

                expect(res.statusCode).toBe(403);
            });
            it("should fail to create user without all details", async () => {
                let route = request.agent(app);

                await route
                    .post("/api/auth/login")
                    .send({ email: "email5@email.com", password: "1" });
                const res = await route
                    .post("/api/users")
                    .send({
                        name: "TestUser",
                        password: "2",
                        role: ROLES.STUDENT,
                    });

                expect(res.statusCode).toBe(400);
            });
            it("should fail to create user with incorrect email", async () => {
                let route = request.agent(app);

                await route
                    .post("/api/auth/login")
                    .send({ email: "email5@email.com", password: "1" });

                const res = await route
                    .post("/api/users")
                    .send({
                        name: "TestUser",
                        email: "test-email.com",
                        password: "2",
                        role: ROLES.STUDENT,
                    });

                expect(res.statusCode).toBe(400);
            });
            it("should fail to create user with the email that aleady exists", async () => {
                let route = request.agent(app);

                await route
                    .post("/api/auth/login")
                    .send({ email: "email5@email.com", password: "1" });

                const res = await route
                    .post("/api/users")
                    .send({
                        name: "TestUser",
                        email: "email1@email.com",
                        password: "2",
                        role: ROLES.STUDENT,
                    });

                expect(res.statusCode).toBe(400);
            });
            it("should succeed to create user", async () => {
                let route = request.agent(app);

                await route
                    .post("/api/auth/login")
                    .send({ email: "email5@email.com", password: "1" });
                const res = await route
                    .post("/api/users")
                    .send({
                        name: "TestUser",
                        email: "test@email.com",
                        password: "2",
                        role: ROLES.STUDENT,
                    });

                expect(res.statusCode).toBe(201);
                expect(res.body).toBeDefined();
                expect(res.body.name).toBe("TestUser");
                expect(res.body.email).toBe("test@email.com");
                expect(res.body.role).toBe(ROLES.STUDENT);
            });
        })
        describe("PUT /:id", () => {
            it("should fail to update user without login", async () => {
                let route = request.agent(app);

                const user = await User.findOne({ email: "email1@email.com" });

                const res = await route
                    .put(`/api/users/${user.id}`)
                    .send({
                        name: "TestUser",
                    });

                expect(res.statusCode).toBe(401);
            });
            it("should fail to update user without admin role or being that user", async () => {
                let route = request.agent(app);

                const user = await User.findOne({ email: "email1@email.com" });

                await route
                    .post("/api/auth/login")
                    .send({ email: "email2@email.com", password: "1" });

                const res = await route
                    .put(`/api/users/${user.id}`)
                    .send({
                        name: "NewName",
                    });

                expect(res.statusCode).toBe(403);
            });
            it("should fail to update user with incorrect id", async () => {
                let route = request.agent(app);

                await route
                    .post("/api/auth/login")
                    .send({ email: "email5@email.com", password: "1" });

                const res = await route
                    .put("/api/users/-1")
                    .send({
                        email: "test-email.com",
                    });

                expect(res.statusCode).toBe(404);
            });
            it("should fail to update user with incorrect email", async () => {
                let route = request.agent(app);

                const user = await User.findOne({ email: "email1@email.com" });

                await route
                    .post("/api/auth/login")
                    .send({ email: "email5@email.com", password: "1" });

                const res = await route
                    .put(`/api/users/${user.id}`)
                    .send({
                        email: "test-email.com",
                    });

                expect(res.statusCode).toBe(400);
            });
            it("should fail to update user with the email that aleady exists", async () => {
                let route = request.agent(app);

                const user = await User.findOne({ email: "email2@email.com" });

                await route
                    .post("/api/auth/login")
                    .send({ email: "email5@email.com", password: "1" });

                const res = await route
                    .put(`/api/users/${user.id}`)
                    .send({
                        email: "email1@email.com",
                    });

                expect(res.statusCode).toBe(400);
            });
            it("should succeed to update user", async () => {
                let route = request.agent(app);

                const user = await User.findOne({ email: "email1@email.com" });

                await route
                    .post("/api/auth/login")
                    .send({ email: "email5@email.com", password: "1" });

                const res = await route
                    .put(`/api/users/${user.id}`)
                    .send({
                        email: "test@email.com",
                    });

                expect(res.statusCode).toBe(201);
                expect(res.body).toBeDefined();
                expect(res.body.name).toBe(user.name);
                expect(res.body.email).toBe("test@email.com");
                expect(res.body.role).toBe(user.role);
            });
        })
        describe("DELETE /:id", () => {
            it("should fail to delete user without login", async () => {
                let route = request.agent(app);

                const user = await User.findOne({ email: "email1@email.com" });

                const res = await route
                    .delete(`/api/users/${user.id}`);

                expect(res.statusCode).toBe(401);
            });
            it("should fail to delete user without admin role", async () => {
                let route = request.agent(app);

                const user = await User.findOne({ email: "email1@email.com" });

                await route
                    .post("/api/auth/login")
                    .send({ email: "email2@email.com", password: "1" });

                const res = await route
                    .delete(`/api/users/${user.id}`);

                expect(res.statusCode).toBe(403);
            });
            it("should fail to delete user with incorrect id", async () => {
                let route = request.agent(app);

                await route
                    .post("/api/auth/login")
                    .send({ email: "email5@email.com", password: "1" });

                const res = await route
                    .delete("/api/users/-1");

                expect(res.statusCode).toBe(400);
            });
            it("should fail to delet last admin", async () => {
                let route = request.agent(app);

                const user = await User.findOne({ email: "email5@email.com" });

                await route
                    .post("/api/auth/login")
                    .send({ email: "email5@email.com", password: "1" });

                const res = await route
                    .delete(`/api/users/${user.id}`);

                expect(res.statusCode).toBe(400);
            });
            it("should succeed to delete user", async () => {
                let route = request.agent(app);

                const user = await User.findOne({ email: "email1@email.com" });

                await route
                    .post("/api/auth/login")
                    .send({ email: "email5@email.com", password: "1" });


                const res = await route
                    .delete(`/api/users/${user.id}`);

                expect(res.statusCode).toBe(200);

                const deleted_user = await User.findOne({ email: "email1@email.com" });

                expect(deleted_user).toBeNull();
            });
        })
    })
});

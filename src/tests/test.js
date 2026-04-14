const request = require("supertest");
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');

const app = require("../app");
const ROLES = require("../constants/roles");
const User = require('../models/user');
const Module = require('../models/module');
const Assignment = require('../models/assignment');

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
    let db_users = [];
    for (const user of users) {
        //Hash password
        const hashed_password = await bcrypt.hash(user.password, 10);
        //Add user to db
        db_users.push(await User.create({
            name: user.name,
            email: user.email,
            password: hashed_password,
            role: user.role,
        }));
    }

    const module1 = await Module.create({
        title: "Module 1",
        description: "Desc 1",
        users: [db_users[0].id, db_users[2].id],
    });
    const module2 = await Module.create({
        title: "Module 2",
        description: "Desc 2",
        users: [db_users[1].id, db_users[2].id],
    });

    await Assignment.create({
        title: "Assignment 1",
        description: "Desc 1",
        moduleId: module2.id,
        deadline: new Date(Date.now() + 100000),
    });
    await Assignment.create({
        title: "Assignment 2",
        description: "Desc 2",
        moduleId: module1.id,
        deadline: new Date(Date.now() + 100000),
    });
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
        });
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
        });
    });
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
        });
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
        });
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
        });
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
        });
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
            it("should succeed to delete user by admin", async () => {
                let route = request.agent(app);

                const user = await User.findOne({ email: "email1@email.com" });

                await route
                    .post("/api/auth/login")
                    .send({ email: "email5@email.com", password: "1" });


                const res = await route
                    .delete(`/api/users/${user.id}`);

                expect(res.statusCode).toBe(200);

                const deleted_user = await User.findById(user.id);
                expect(deleted_user).toBeNull();
            });
        });
    });
    describe("/preferences", () => {
        describe("GET /theme", () => {
            it("should fail to get theme without login", async () => {
                let route = request.agent(app);

                const res = await route
                    .get("/api/preferences/theme");

                expect(res.statusCode).toBe(401);
            });
            it("should succeed to get user theme", async () => {
                let route = request.agent(app);

                await route
                    .post("/api/auth/login")
                    .send({ email: "email1@email.com", password: "1" });

                const res = await route
                    .get("/api/preferences/theme");

                expect(res.statusCode).toBe(200);
                expect(res.body.theme).toBeDefined();
            });
        });
        describe("POST /theme", () => {
            it("should fail to update theme without login", async () => {
                let route = request.agent(app);

                const res = await route
                    .post("/api/preferences/theme")
                    .send({ theme: "dark" });

                expect(res.statusCode).toBe(401);
            });
            it("should fail to update preference with invalid theme", async () => {
                let route = request.agent(app);

                await route
                    .post("/api/auth/login")
                    .send({ email: "email1@email.com", password: "1" });

                const res = await route
                    .post("/api/preferences/theme")
                    .send({ theme: "a" });

                expect(res.statusCode).toBe(400);
            });
            it("should succeed to update user theme", async () => {
                let route = request.agent(app);

                await route
                    .post("/api/auth/login")
                    .send({ email: "email1@email.com", password: "1" });

                const res = await route
                    .post("/api/preferences/theme")
                    .send({ theme: "dark" });

                expect(res.statusCode).toBe(200);
                expect(res.body.theme).toBe("dark");
            });
        });
    });
    describe("/modules", () => {
        describe("GET /", () => {
            it("should fail to get all modules without login", async () => {
                let route = request.agent(app);

                const res = await route
                    .get("/api/modules");

                expect(res.statusCode).toBe(401);
            });
            it("should succeed to get all user's modules", async () => {
                let route = request.agent(app);

                await route
                    .post("/api/auth/login")
                    .send({ email: "email1@email.com", password: "1" });

                const res = await route
                    .get("/api/modules");

                expect(res.statusCode).toBe(200);
                expect(Array.isArray(res.body)).toBe(true);
                expect(res.body.length).toBe(1);
            });
            it("should succeed to get all modules by admin", async () => {
                let route = request.agent(app);

                await route
                    .post("/api/auth/login")
                    .send({ email: "email5@email.com", password: "1" });
                const res = await route
                    .get("/api/modules");

                expect(res.statusCode).toBe(200);
                expect(Array.isArray(res.body)).toBe(true);
                expect(res.body.length).toBe(2);
            });
        });
        describe("GET /:id", () => {
            it("should fail to get module without login", async () => {
                let route = request.agent(app);

                const module = await Module.findOne();

                const res = await route
                    .get(`/api/modules/${module.id}`);

                expect(res.statusCode).toBe(401);
            });
            it("should fail to get module with incorrect id", async () => {
                let route = request.agent(app);

                await route
                    .post("/api/auth/login")
                    .send({ email: "email1@email.com", password: "1" });
                const res = await route
                    .get("/api/modules/-1");

                expect(res.statusCode).toBe(404);
            });
            it("should fail to get module if user doesn't has access", async () => {
                let route = request.agent(app);

                const module = await Module.findOne({ title: "Module 2" });

                await route
                    .post("/api/auth/login")
                    .send({ email: "email1@email.com", password: "1" });
                const res = await route.get(`/api/modules/${module.id}`);

                expect(res.statusCode).toBe(403);
            });
            it("should succeed to get module if user has access", async () => {
                let route = request.agent(app);

                const module = await Module.findOne({ title: "Module 1" });

                await route
                    .post("/api/auth/login")
                    .send({ email: "email1@email.com", password: "1" });
                const res = await route.get(`/api/modules/${module.id}`);

                expect(res.statusCode).toBe(200);
                expect(res.body.title).toBe("Module 1");
            });
        });
        describe("GET /:id/assignments", () => {
            it("should fail to get all assignments without login", async () => {
                let route = request.agent(app);

                const module = await Module.findOne({ title: "Module 1" });

                const res = await route
                    .get(`/api/modules/${module.id}/assignments`);

                expect(res.statusCode).toBe(401);
            });
            it("should succeed to get all modules assignments", async () => {
                let route = request.agent(app);

                const module = await Module.findOne({ title: "Module 1" });

                await route
                    .post("/api/auth/login")
                    .send({ email: "email1@email.com", password: "1" });
                const res = await route
                    .get(`/api/modules/${module.id}/assignments`);

                expect(res.statusCode).toBe(200);
                expect(Array.isArray(res.body)).toBe(true);
                expect(res.body.length).toBe(1);
            });
        });
        describe("POST /", () => {
            it("should fail to create module without login", async () => {
                let route = request.agent(app);

                const res = await route
                    .post("/api/modules")
                    .send({ title: "New Module", description: "New Desc" });

                expect(res.statusCode).toBe(401);
            });
            it("should fail to create module without admin role", async () => {
                let route = request.agent(app);

                await route
                    .post("/api/auth/login")
                    .send({ email: "email1@email.com", password: "1" });

                const res = await route
                    .post("/api/modules")
                    .send({ title: "New Module", description: "New Desc" });

                expect(res.statusCode).toBe(403);
            });
            it("should fail to create module without title", async () => {
                let route = request.agent(app);

                await route
                    .post("/api/auth/login")
                    .send({ email: "email5@email.com", password: "1" });
                const res = await route
                    .post("/api/modules")
                    .send({ description: "New Desc" });

                expect(res.statusCode).toBe(400);
            });
            it("should succeed to create module", async () => {
                let route = request.agent(app);

                await route
                    .post("/api/auth/login")
                    .send({ email: "email5@email.com", password: "1" });
                const res = await route
                    .post("/api/modules")
                    .send({ title: "New Module", description: "New Desc" });

                expect(res.statusCode).toBe(201);
                expect(res.body).toBeDefined();
                expect(res.body.title).toBe("New Module");
                expect(res.body.description).toBe("New Desc");
            });
        });
        describe("PUT /:id", () => {
            it("should fail to update module without login", async () => {
                let route = request.agent(app);

                const module = await Module.findOne({ title: "Module 1" });

                const res = await route
                    .put(`/api/modules/${module.id}`)
                    .send({ title: "NewTitle" });

                expect(res.statusCode).toBe(401);
            });
            it("should fail to update user without admin role", async () => {
                let route = request.agent(app);

                const module = await Module.findOne({ title: "Module 1" });

                await route
                    .post("/api/auth/login")
                    .send({ email: "email1@email.com", password: "1" });
                const res = await route
                    .put(`/api/modules/${module.id}`)
                    .send({ title: "NewTitle" });

                expect(res.statusCode).toBe(403);
            });
            it("should fail to update module with incorrect id", async () => {
                let route = request.agent(app);

                await route
                    .post("/api/auth/login")
                    .send({ email: "email5@email.com", password: "1" });

                const res = await route
                    .put("/api/modules/-1")
                    .send({ title: "NewTitle" });

                expect(res.statusCode).toBe(404);
            });
            it("should succeed to update module", async () => {
                let route = request.agent(app);

                const module = await Module.findOne({ title: "Module 1" });

                await route
                    .post("/api/auth/login")
                    .send({ email: "email5@email.com", password: "1" });
                const res = await route
                    .put(`/api/modules/${module.id}`)
                    .send({ title: "NewTitle" });

                expect(res.statusCode).toBe(200);
                expect(res.body.title).toBe("NewTitle");
                expect(res.body.description).toBe(module.description);
            });
        });
        describe("DELETE /:id", () => {
            it("should fail to delete module without login", async () => {
                let route = request.agent(app);

                const module = await Module.findOne({ title: "Module 1" });

                const res = await route
                    .delete(`/api/modules/${module.id}`);

                expect(res.statusCode).toBe(401);
            });
            it("should fail to delete user without admin role", async () => {
                let route = request.agent(app);

                const module = await Module.findOne({ title: "Module 1" });

                await route
                    .post("/api/auth/login")
                    .send({ email: "email1@email.com", password: "1" });
                const res = await route
                    .delete(`/api/modules/${module.id}`);

                expect(res.statusCode).toBe(403);
            });
            it("should fail to delete module with incorrect id", async () => {
                let route = request.agent(app);

                await route
                    .post("/api/auth/login")
                    .send({ email: "email5@email.com", password: "1" });
                const res = await route
                    .delete("/api/modules/-1");

                expect(res.statusCode).toBe(404);
            });
            it("should succeed to delete module by admin", async () => {
                let route = request.agent(app);

                const module = await Module.findOne({ title: "Module 1" });

                await route
                    .post("/api/auth/login")
                    .send({ email: "email5@email.com", password: "1" });
                const res = await route
                    .delete(`/api/modules/${module.id}`);

                expect(res.statusCode).toBe(200);

                const deleted_module = await User.findById(module.id);
                expect(deleted_module).toBeNull();
            });
        });
    });
    describe("/assignments", () => {
        describe("GET /", () => {
            it("should fail to get all assignments without login", async () => {
                const route = request.agent(app);

                const res = await route
                    .get("/api/assignments");

                expect(res.statusCode).toBe(401);
            });
            it("should succeed to get all assignments by teacher", async () => {
                const route = request.agent(app);

                await route
                    .post("/api/auth/login")
                    .send({ email: "email3@email.com", password: "1" });
                const res = await route
                    .get("/api/assignments/");

                expect(res.statusCode).toBe(200);
                expect(Array.isArray(res.body)).toBe(true);
                expect(res.body.length).toBe(2);
            });
            it("should succeed to get all assignments by admin", async () => {
                const route = request.agent(app);

                await route
                    .post("/api/auth/login")
                    .send({ email: "email5@email.com", password: "1" });
                const res = await route
                    .get("/api/assignments/");

                expect(res.statusCode).toBe(200);
                expect(Array.isArray(res.body)).toBe(true);
                expect(res.body.length).toBe(2);
            });
        });
        describe("GET /:id", () => {
            it("should fail to get assignment without login", async () => {
                const route = request.agent(app);

                const assignment = await Assignment.findOne({ title: "Assignment 1" });

                const res = await route
                    .get(`/api/assignments/${assignment.id}`);

                expect(res.statusCode).toBe(401);
            });
            it("should fail to get assignment with invalide id", async () => {
                const route = request.agent(app);

                await route
                    .post("/api/auth/login")
                    .send({ email: "email2@email.com", password: "1" });
                const res = await route
                    .get("/api/assignments/-1");

                expect(res.statusCode).toBe(404);
            });
            it("should succeed to get an assignment", async () => {
                const route = request.agent(app);

                const assignment = await Assignment.findOne({ title: "Assignment 1" });

                await route
                    .post("/api/auth/login")
                    .send({ email: "email2@email.com", password: "1" });
                const res = await route
                    .get(`/api/assignments/${assignment.id}`);

                expect(res.statusCode).toBe(200);
                expect(res.body.title).toBe("Assignment 1");
                expect(res.body.description).toBe("Desc 1");
                expect(res.body.deadline).toBeDefined();
            });
        });
        describe("POST /", () => {
            it("should fail to create an assignment without login", async () => {
                const route = request.agent(app);

                const module = await Module.findOne();

                const res = await route
                    .post("/api/assignments")
                    .send({
                        title: "NewTitle",
                        moduleId: module.id,
                        deadline: new Date(Date.now() + 100000)
                    });

                expect(res.statusCode).toBe(401);
            });
            it("should fail to creating an assignment by student", async () => {
                const route = request.agent(app);

                const module = await Module.findOne();

                await route
                    .post("/api/auth/login")
                    .send({ email: "email1@email.com", password: "1" });
                const res = await route
                    .post("/api/assignments")
                    .send({
                        title: "NewTitle",
                        moduleId: module.id,
                        deadline: new Date(Date.now() + 100000)
                    });
                expect(res.statusCode).toBe(403);
            });
            it("should fail to creating an assignment with incorrect details", async () => {
                const route = request.agent(app);

                await route
                    .post("/api/auth/login")
                    .send({ email: "email3@email.com", password: "1" });
                const res = await route
                    .post("/api/assignments")
                    .send({
                        title: "NewTitle",
                        moduleId: -1,
                        deadline: new Date(Date.now() + 100000)
                    });
                expect(res.statusCode).toBe(400);
            });
            it("should succeed to create an assignmen by teacher", async () => {
                const route = request.agent(app);

                const module = await Module.findOne();

                await route
                    .post("/api/auth/login")
                    .send({ email: "email3@email.com", password: "1" });
                const res = await route
                    .post("/api/assignments")
                    .send({
                        title: "NewTitle",
                        moduleId: module.id,
                        deadline: new Date(Date.now() + 100000)
                    });

                expect(res.statusCode).toBe(201);
                expect(res.body.title).toBe("NewTitle");
                expect(res.body.description).toBeUndefined()
                expect(res.body.deadline).toBeDefined();
            });

            it("should succeed to create an assignmen by admin", async () => {
                const route = request.agent(app);

                const module = await Module.findOne();

                await route
                    .post("/api/auth/login")
                    .send({ email: "email5@email.com", password: "1" });
                const res = await route
                    .post("/api/assignments")
                    .send({
                        title: "NewTitle",
                        moduleId: module.id,
                        deadline: new Date(Date.now() + 100000)
                    });

                expect(res.statusCode).toBe(201);
                expect(res.body.title).toBe("NewTitle");
                expect(res.body.description).toBeUndefined()
                expect(res.body.deadline).toBeDefined();
            });
        });
        describe("PUT /:id", () => {
            it("should fail to update assignment without login", async () => {
                let route = request.agent(app);

                const assignment = await Assignment.findOne({ title: "Assignment 1" });

                const res = await route
                    .put(`/api/assignments/${assignment.id}`)
                    .send({ title: "NewTitle" });

                expect(res.statusCode).toBe(401);
            });
            it("should fail to update assignment without teacher role", async () => {
                let route = request.agent(app);

                const assignment = await Assignment.findOne({ title: "Assignment 1" });

                await route
                    .post("/api/auth/login")
                    .send({ email: "email1@email.com", password: "1" });
                const res = await route
                    .put(`/api/assignments/${assignment.id}`)
                    .send({ title: "NewTitle" });

                expect(res.statusCode).toBe(403);
            });
            it("should fail to update assignment with incorrect id", async () => {
                let route = request.agent(app);

                await route
                    .post("/api/auth/login")
                    .send({ email: "email5@email.com", password: "1" });

                const res = await route
                    .put("/api/assignments/-1")
                    .send({ title: "NewTitle" });
                expect(res.statusCode).toBe(404);
            });
            it("should fail to update assignment by incorrect teacher", async () => {
                let route = request.agent(app);

                const assignment = await Assignment.findOne({ title: "Assignment 1" });

                await route
                    .post("/api/auth/login")
                    .send({ email: "email4@email.com", password: "1" });
                const res = await route
                    .put(`/api/assignments/${assignment.id}`)
                    .send({ title: "NewTitle" });

                expect(res.statusCode).toBe(404);
            });
            it("should succeed to update assignment by teacher", async () => {
                let route = request.agent(app);

                const assignment = await Assignment.findOne({ title: "Assignment 1" });

                await route
                    .post("/api/auth/login")
                    .send({ email: "email3@email.com", password: "1" });
                const res = await route
                    .put(`/api/assignments/${assignment.id}`)
                    .send({ title: "NewTitle" });

                expect(res.statusCode).toBe(200);
                expect(res.body.title).toBe("NewTitle");
                expect(res.body.description).toBe(assignment.description);
            });

            it("should succeed to update assignment by admin", async () => {
                let route = request.agent(app);

                const assignment = await Assignment.findOne({ title: "Assignment 1" });

                await route
                    .post("/api/auth/login")
                    .send({ email: "email5@email.com", password: "1" });
                const res = await route
                    .put(`/api/assignments/${assignment.id}`)
                    .send({ title: "NewTitle" });

                expect(res.statusCode).toBe(200);
                expect(res.body.title).toBe("NewTitle");
                expect(res.body.description).toBe(assignment.description);
            });
        });
        describe("DELETE /:id", () => {
            it("should fail to delete assignment without login", async () => {
                let route = request.agent(app);

                const assignment = await Assignment.findOne({ title: "Assignment 1" });

                const res = await route
                    .delete(`/api/assignments/${assignment.id}`);

                expect(res.statusCode).toBe(401);
            });
            it("should fail to delete assignment by incorrect teacher", async () => {
                let route = request.agent(app);

                const assignment = await Assignment.findOne({ title: "Assignment 1" });

                await route
                    .post("/api/auth/login")
                    .send({ email: "email4@email.com", password: "1" });
                const res = await route
                    .delete(`/api/assignments/${assignment.id}`);

                expect(res.statusCode).toBe(403);
            });
            it("should fail to delete assignment with incorrect id", async () => {
                let route = request.agent(app);

                await route
                    .post("/api/auth/login")
                    .send({ email: "email5@email.com", password: "1" });
                const res = await route
                    .delete("/api/assignments/-1");

                expect(res.statusCode).toBe(404);
            });
            it("should succeed to delete assignment by teacher", async () => {
                let route = request.agent(app);

                const assignment = await Assignment.findOne({ title: "Assignment 1" });

                await route
                    .post("/api/auth/login")
                    .send({ email: "email3@email.com", password: "1" });
                const res = await route
                    .delete(`/api/assignments/${assignment.id}`);

                expect(res.statusCode).toBe(200);

                const deleted_assignment = await Assignment.findById(assignment.id);
                expect(deleted_assignment).toBeNull();
            });
            it("should succeed to delete assignment by admin", async () => {
                let route = request.agent(app);

                const assignment = await Assignment.findOne({ title: "Assignment 1" });

                await route
                    .post("/api/auth/login")
                    .send({ email: "email5@email.com", password: "1" });
                const res = await route
                    .delete(`/api/assignments/${assignment.id}`);

                expect(res.statusCode).toBe(200);

                const deleted_assignment = await Assignment.findById(assignment.id);
                expect(deleted_assignment).toBeNull();
            });
        });
    });
});

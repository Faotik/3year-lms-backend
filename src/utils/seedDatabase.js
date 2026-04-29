require('dotenv').config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const User = require("../models/user");
const Module = require("../models/module");
const Assignment = require("../models/assignment");
const Test = require("../models/classTest");
const ROLES = require("../constants/roles");

async function seed() {
    const mongoUri = process.env.MONGODB_URI
        || `mongodb://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?authSource=admin`;


    await mongoose.connect(mongoUri);
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

    const createdUsers = [];
    for (const user of users) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        createdUsers.push(await User.create({
            name: user.name,
            email: user.email,
            password: hashedPassword,
            role: user.role,
        }));
    }

    const byEmail = Object.fromEntries(createdUsers.map(u => [u.email, u]));
    const students = createdUsers.filter(u => u.role === ROLES.STUDENT);
    const teachers = createdUsers.filter(u => u.role === ROLES.TEACHER);

    const daysFromNow = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    // seed modules (users are linked by ID only)
    const modulesToCreate = [
        {
            title: "CS101 - Intro to Programming",
            description: "Variables, loops, functions, and basic debugging.",
            users: [students[0]._id, students[1]._id, teachers[0]._id],
        },
        {
            title: "DB201 - Databases",
            description: "Schema design, queries, indexes, and transactions.",
            users: [students[0]._id, teachers[1]._id],
        },
        {
            title: "SE301 - Software Engineering",
            description: "Testing, APIs, architecture, and delivery.",
            users: [students[1]._id, teachers[0]._id, teachers[1]._id],
        },
        {
            title: "NET210 - Computer Networks",
            description: "Protocols, HTTP basics, and practical networking.",
            users: [students[0]._id, students[1]._id, teachers[1]._id],
        },
    ];

    const createdModules = await Module.create(modulesToCreate);
    const moduleByTitle = Object.fromEntries(createdModules.map(m => [m.title, m]));

    // seed assignments (linked to moduleId; lecturerId is optional but helpful for endpoint testing)
    const assignmentsToCreate = [
        // CS101
        {
            title: "CS101 - Assignment 1: Basics",
            description: "Solve small problems using variables and conditionals.",
            moduleId: moduleByTitle["CS101 - Intro to Programming"]._id,
            lecturerId: teachers[0]._id,
            deadline: daysFromNow(3),
        },
        {
            title: "CS101 - Assignment 2: Loops & Arrays",
            description: "Iterate over arrays and produce derived results.",
            moduleId: moduleByTitle["CS101 - Intro to Programming"]._id,
            lecturerId: teachers[0]._id,
            deadline: daysFromNow(10),
        },
        {
            title: "CS101 - Assignment 3: Functions",
            description: "Build reusable functions and simple validations.",
            moduleId: moduleByTitle["CS101 - Intro to Programming"]._id,
            lecturerId: teachers[0]._id,
            deadline: daysFromNow(18),
        },

        // DB201
        {
            title: "DB201 - Assignment 1: ERD",
            description: "Design an ERD for a small learning platform.",
            moduleId: moduleByTitle["DB201 - Databases"]._id,
            lecturerId: teachers[1]._id,
            deadline: daysFromNow(5),
        },
        {
            title: "DB201 - Assignment 2: SQL Queries",
            description: "Write SELECTs with joins, grouping, and filters.",
            moduleId: moduleByTitle["DB201 - Databases"]._id,
            lecturerId: teachers[1]._id,
            deadline: daysFromNow(14),
        },
        {
            title: "DB201 - Assignment 3: Indexing",
            description: "Create indexes and explain query plan improvements.",
            moduleId: moduleByTitle["DB201 - Databases"]._id,
            lecturerId: teachers[1]._id,
            deadline: daysFromNow(21),
        },

        // SE301
        {
            title: "SE301 - Assignment 1: API Contract",
            description: "Define endpoints, payloads, and validation rules.",
            moduleId: moduleByTitle["SE301 - Software Engineering"]._id,
            lecturerId: teachers[0]._id,
            deadline: daysFromNow(4),
        },
        {
            title: "SE301 - Assignment 2: Unit Tests",
            description: "Add tests for edge cases and error handling.",
            moduleId: moduleByTitle["SE301 - Software Engineering"]._id,
            lecturerId: teachers[0]._id,
            deadline: daysFromNow(12),
        },

        // NET210
        {
            title: "NET210 - Assignment 1: HTTP",
            description: "Explain request/response and common status codes.",
            moduleId: moduleByTitle["NET210 - Computer Networks"]._id,
            lecturerId: teachers[1]._id,
            deadline: daysFromNow(6),
        },
        {
            title: "NET210 - Assignment 2: DNS & TCP",
            description: "Trace DNS resolution and TCP handshake steps.",
            moduleId: moduleByTitle["NET210 - Computer Networks"]._id,
            lecturerId: teachers[1]._id,
            deadline: daysFromNow(16),
        },
    ];

    await Assignment.create(assignmentsToCreate);

    // seed tests/quizzes (linked to moduleId)
    const testsToCreate = [
        {
            title: "CS101 - Quiz 1",
            description: "Quick check on basics and control flow.",
            moduleId: moduleByTitle["CS101 - Intro to Programming"]._id,
            deadline: daysFromNow(2),
            questions: [
                { question: "Which type stores whole numbers?", options: ["String", "Number", "Boolean", "Object"], correctAnswer: "Number", marks: 1 },
                { question: "What does an if-statement do?", options: ["Repeats code", "Stores data", "Runs code conditionally", "Compiles code"], correctAnswer: "Runs code conditionally", marks: 1 },
                { question: "What is the result of 2 + 2?", options: ["3", "4", "22", "NaN"], correctAnswer: "4", marks: 1 },
            ],
        },
        {
            title: "CS101 - Quiz 2",
            description: "Loops, arrays, and basic complexity intuition.",
            moduleId: moduleByTitle["CS101 - Intro to Programming"]._id,
            deadline: daysFromNow(9),
            questions: [
                { question: "Which loop is best when you know the number of iterations?", options: ["for", "while", "do-while", "switch"], correctAnswer: "for", marks: 1 },
                { question: "Array indices usually start at…", options: ["-1", "0", "1", "Depends"], correctAnswer: "0", marks: 1 },
            ],
        },
        {
            title: "DB201 - Quiz 1",
            description: "Primary keys, foreign keys, and normalization.",
            moduleId: moduleByTitle["DB201 - Databases"]._id,
            deadline: daysFromNow(7),
            questions: [
                { question: "A primary key must be…", options: ["Nullable", "Unique", "A string", "Encrypted"], correctAnswer: "Unique", marks: 1 },
                { question: "A foreign key is used to…", options: ["Store passwords", "Link tables", "Optimize images", "Cache responses"], correctAnswer: "Link tables", marks: 1 },
                { question: "3NF primarily helps reduce…", options: ["Latency", "Redundancy", "Bandwidth", "CPU usage"], correctAnswer: "Redundancy", marks: 1 },
            ],
        },
        {
            title: "DB201 - SQL Quiz",
            description: "Joins, grouping, and filtering.",
            moduleId: moduleByTitle["DB201 - Databases"]._id,
            deadline: daysFromNow(15),
            questions: [
                { question: "Which clause filters after GROUP BY?", options: ["WHERE", "HAVING", "ORDER BY", "LIMIT"], correctAnswer: "HAVING", marks: 1 },
                { question: "INNER JOIN returns…", options: ["All rows", "Only matches", "Only left rows", "Only right rows"], correctAnswer: "Only matches", marks: 1 },
            ],
        },
        {
            title: "SE301 - Quiz 1",
            description: "APIs and testing fundamentals.",
            moduleId: moduleByTitle["SE301 - Software Engineering"]._id,
            deadline: daysFromNow(8),
            questions: [
                { question: "A 400 status code indicates…", options: ["Success", "Client error", "Server error", "Redirect"], correctAnswer: "Client error", marks: 1 },
                { question: "Unit tests should be…", options: ["Slow", "Dependent on network", "Isolated", "Manual"], correctAnswer: "Isolated", marks: 1 },
            ],
        },
        {
            title: "NET210 - Quiz 1",
            description: "HTTP, DNS, and TCP basics.",
            moduleId: moduleByTitle["NET210 - Computer Networks"]._id,
            deadline: daysFromNow(11),
            questions: [
                { question: "DNS resolves…", options: ["IP → MAC", "Domain → IP", "Port → Process", "URL → File"], correctAnswer: "Domain → IP", marks: 1 },
                { question: "TCP is…", options: ["Connectionless", "Best-effort", "Connection-oriented", "Only for emails"], correctAnswer: "Connection-oriented", marks: 1 },
                { question: "HTTP is commonly transported over…", options: ["UDP only", "TCP", "ICMP", "ARP"], correctAnswer: "TCP", marks: 1 },
            ],
        },
    ];

    await Test.create(testsToCreate);

    await mongoose.disconnect();
}

seed().catch((err) => {
    console.error(err);
});
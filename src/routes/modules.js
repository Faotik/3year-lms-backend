const express = require('express');
const router = express.Router();
const mongoose = require("mongoose");

const Module = require('../models/module');
const Assignment = require('../models/assignment');
const authMiddleware = require("../middlewares/auth");
const Test = require('../models/classTest');
const ROLES = require('../constants/roles');


// GET all modules
router.get('/', authMiddleware(), async (req, res) => {
    try {
        let modules = [];

        if (req.user.role === ROLES.ADMIN) {
            modules = await Module.find().populate('users');
        } else {
            modules = await Module.find({ users: req.user.id }).populate('users');
        }

        res.json(modules);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// GET one module
router.get('/:id', authMiddleware(), async (req, res) => {
    try {
        // Validate ID
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ error: 'Module not found' });
        }

        const module = await Module.findById(req.params.id);

        if (!module) {
            return res.status(404).json({ message: "Module not found" });
        }

        if (!module.users.some(id => id.equals(req.user.id)) && req.user.role !== ROLES.ADMIN) {
            return res.status(403).json({ message: "Access forbidden" });
        }

        res.json(module);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// GET all assignments of the module
router.get('/:id/assignments/', authMiddleware(), async (req, res) => {
    try {
        // Validate ID
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ error: 'Module not found' });
        }

        const module = await Module.findById(req.params.id);

        if (!module) {
            return res.status(404).json({ message: "Module not found" });
        }

        if (!module.users.includes(req.user.id) && req.user.role !== ROLES.ADMIN) {
            return res.status(403).json({ message: "Access forbidden" });
        }

        const assignments = await Assignment.find({
            moduleId: { $in: module.id }
        });

        res.json(assignments);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// GET all tests of the module
router.get('/:id/tests/', authMiddleware(), async (req, res) => {
    try {
        // Validate ID
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ error: 'Module not found' });
        }

        const module = await Module.findById(req.params.id);

        if (!module) {
            return res.status(404).json({ message: "Module not found" });
        }

        if (!module.users.includes(req.user.id) && req.user.role !== ROLES.ADMIN) {
            return res.status(403).json({ message: "Access forbidden" });
        }

        const tests = await Test.find({
            moduleId: { $in: module.id }
        });

        res.json(tests);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// CREATE
router.post('/', authMiddleware([ROLES.ADMIN]), async (req, res) => {
    try {
        const { title, description, users } = req.body;
        if (!title) {
            return res.status(400).json({ message: "Title is required" });
        }

        const module = new Module({
            title,
            description,
            users
        });

        await module.save();
        res.status(201).json({ title, description, users });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// UPDATE
router.put('/:id', authMiddleware([ROLES.ADMIN]), async (req, res) => {
    try {
        // Validate ID
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ error: 'Module not found' });
        }

        const { title, description, users } = req.body;

        const module = await Module.findById(req.params.id);

        if (!module) {
            return res.status(404).json({ message: "Module not found" });
        }
        if (title) {
            module.title = title;
        }
        if (description) {
            module.description = description;
        }
        if (users) {
            module.users = users;
        }

        await module.save();
        res.json({ title: module.title, description: module.description, users: module.users });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// DELETE
router.delete('/:id', authMiddleware([ROLES.ADMIN]), async (req, res) => {
    try {
        // Validate ID
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ error: 'Module not found' });
        }

        const module = await Module.findById(req.params.id);
        if (!module) return res.status(404).json({ message: "Module not found" });

        await module.deleteOne();
        res.json({ message: "Module deleted" });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();

const Module = require('../models/module');
const authMiddleware = require("../middlewares/auth");
const ROLES = require('../constants/roles');


// GET all modules
router.get('/', authMiddleware(), async (req, res) => {
    try {
        let modules = [];

        if (req.user.role === ROLES.ADMIN) {
            modules = await Module.find();
        } else {
            modules = await Module.find({ users: req.user.id });
        }

        res.json(modules);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET one module
router.get('/:id',authMiddleware([ROLES.ADMIN]), async (req, res) => {
    try {
        const module = await Module.findById(req.params.id);

        if (!module) {
            return res.status(404).json({ message: "Module not found" });
        }

        if (!module.users.includes(req.user.id) && req.user.role !== ROLES.ADMIN) {
            return res.status(404).json({ message: "Access forbidden" });
        }

        res.json(module);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// CREATE
router.post('/', authMiddleware([ROLES.ADMIN]), async (req, res) => {
    try {
        const { title, description } = req.body;
        if (!title) {
            return res.status(400).json({ message: "Title is required" });
        }

        const module = new Module({
            title,
            description
        });

        await module.save();
        res.status(201).json({ title, description });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// UPDATE
router.put('/:id', authMiddleware([ROLES.ADMIN]), async (req, res) => {
    try {
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
        res.json({ title, description, users });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE
router.delete('/:id', authMiddleware([ROLES.ADMIN]), async (req, res) => {
    try {
        const module = await Module.findById(req.params.id);
        if (!module) return res.status(404).json({ message: "Module not found" });

        await module.deleteOne();
        res.json({ message: "Module deleted" });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
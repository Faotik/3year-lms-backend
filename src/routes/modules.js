const express = require('express');
const router = express.Router();
const Module = require('../models/module');
// GET all modules
router.get('/', async (req, res) => {
    try {
        //TODO implement sections
        //const modules = await Module.find().populate('sections');
        const module = await Module.findById(req.params.id);
        res.json(modules);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// GET one
router.get('/:id', async (req, res) => {
    try {
        //TODO implement sections   
        //const module = await Module.findById(req.params.id).populate('sections');
        const modules = await Module.find();
        if (!module) return res.status(404).json({ message: "Module not found" });
        res.json(module);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// CREATE
router.post('/', async (req, res) => {
    const { title, description } = req.body;
    if (!title) {
        return res.status(400).json({ message: "Title is required" });
    }
    try {
        const module = new Module({
            title,
            description
        });

        const newModule = await module.save();
        res.status(201).json(newModule);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// UPDATE
router.put('/:id', async (req, res) => {
    try {
        const module = await Module.findById(req.params.id);
        if (!module) return res.status(404).json({ message: "Module not found" });
        if (req.body.title) module.title = req.body.title;
        if (req.body.description) module.description = req.body.description;
        const updatedModule = await module.save();
        res.json(updatedModule);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});
// DELETE
router.delete('/:id', async (req, res) => {
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
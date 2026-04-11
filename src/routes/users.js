const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const mongoose = require("mongoose");

const User = require('../models/user')
const authMiddleware = require('../middlewares/auth');
const ROLES = require('../constants/roles');

//Get all users
router.get('/', authMiddleware([ROLES.ADMIN]), async (req, res) => {
	try {
		// Restrict 'password' field in response
		const users = await User.find().select('-password');
		return res.json(users);

	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: 'Server error' });
	}
});

//Get specific user
router.get('/:id', authMiddleware(), async (req, res) => {
	try {
		if (req.params.id === req.user.id || req.user.role === ROLES.ADMIN) {
			const user = await User.findById(req.params.id).select('-password');
			if (!user) return res.status(404).json({ message: "User not found" });
			return res.json(user);
		}
		else {
			return res.status(403).send("Access forbidden");
		}
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: 'Server error' });
	}
});

//Create a new user
router.post('/', authMiddleware([ROLES.ADMIN]), async (req, res) => {
	try {
		//Hash password
		const hashed_password = await bcrypt.hash(req.body.password, 10);
		//Add user to db
		const user = await User.create({
			name: req.body.name,
			email: req.body.email,
			password: hashed_password,
			role: req.body.role,
		});
		return res.status(201).json({ name: user.name, email: user.email, role: user.role });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: 'Server error' });
	}

})

//Update specific user infomation
router.put('/:id', authMiddleware(), async (req, res) => {
	try {
		if (req.params.id === req.user.id || req.user.role === ROLES.ADMIN) {
			const { name, email, password, role } = req.body;

			//Update user info
			const user = await User.findById(req.params.id);

			// User existence validation
			if (!user) {
				return res.status(404).json({ error: 'User not found' });
			}

			if (name) {
				user.name = req.body.name;
			}
			if (email) {
				user.email = req.body.email;
			}
			if (role) {
				if (!Object.values(ROLES).includes(role)) {
					return res.status(400).json({ error: 'Invalid role' });
				}

				user.role = req.body.role;
			}
			if (password) {
				//Hash password
				const hashed_password = await bcrypt.hash(req.body.password, 10);

				user.password = await bcrypt.hash(req.body.password, 10);
			}

			await user.save();

			return res.status(201).json({ name: user.name, email: user.email, role: user.role });
		}
		else {
			return res.status(403).send("Access forbidden");
		}
	} catch (err) {
		if (err.code === 11000) {
			return res.status(400).json({ message: "Email already exists" });
		}
		console.error(err);
		return res.status(500).json({ error: 'Server error' });
	}
});

// Delete user
router.delete('/:id', authMiddleware([ROLES.ADMIN]), async (req, res) => {
	try {
		// Id format validation
		if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
			return res.status(400).json({ error: 'Invalid ID' });
		}

		// Prevent admin to delete himself
		if (req.user.id === req.params.id) {
			return res.status(400).json({ error: 'You cannot delete yourself' });
		}

		const user = await User.findById(req.params.id);

		// Check user existence
		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}

		// Prevent deleting last admin in system
		const adminCount = await User.countDocuments({ role: ROLES.ADMIN });
		if (adminCount === 1 && user.role === ROLES.ADMIN) {
			return res.status(400).json({ error: 'Cannot delete last admin' });
		}

		await User.findByIdAndDelete(req.params.id);

		res.status(200).json({ message: 'User deleted' });

	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Server error' });
	}
});

module.exports = router;
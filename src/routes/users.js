const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const User = require('../models/user')
const authMiddleware = require('../middlewares/auth');
const ROLES = require('../constants/roles');

//Get all users
router.get('/', authMiddleware([ROLES.ADMIN]), async (req, res) => {
	try {
		// Restrict 'password' field in response
		const users = await User.find().select('-password');
		res.json(users);

	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Server error' });
	}
});

//Get specific user
router.get('/:id', authMiddleware([ROLES.ADMIN]), async (req, res) => {
	try {
		if (id === req.user.id || req.user.role === ROLES.ADMIN) {
			const user = await User.findById(req.params.id).select('-password');
			if (!user) return res.status(404).json({ message: "User not found" });
			res.json(user);
		}
		else {
			return res.status(403).send("Access forbidden");
		}
	} catch (err) {
		res.status(500).json({ message: err.message });
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
		res.status(201).json({ name: user.name, email: user.email, role: user.role });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Bad request' });
	}

})

//Update all user infomation
router.post('/:id', authMiddleware(), async (req, res) => {
	try {
		if (id === req.user.id || req.user.role === ROLES.ADMIN) {
			const { name, email, password, role } = req.body;

			if (!name || !email || !password || !role) {
				return res.status(400).json({ message: "All fields are required" });
			}

			// Check role existence and validness
			if (!role || !Object.values(ROLES).includes(role)) {
				return res.status(400).json({ error: 'Invalid role' });
			}

			//Hash password
			const hashed_password = await bcrypt.hash(req.body.password, 10);

			//Update user info
			const user = await User.findById(id);

			// User existence validation
			if (!user) {
				return res.status(404).json({ error: 'User not found' });
			}

			user.name = name;
			user.email = email;
			user.password = hashedPassword;
			user.role = role;
			await user.save();

			res.status(201).json({ name, email, role });
		}
		else {
			return res.status(403).send("Access forbidden");
		}
	} catch (err) {
		if (err.code === 11000) {
			return res.status(400).json({ message: "Email already exists" });
		}
		res.status(500).json({ message: err.message });
	}
});

//Update specific user infomation
router.put('/:id', authMiddleware(), async (req, res) => {
	try {
		if (id === req.user.id || req.user.role === ROLES.ADMIN) {
			const { name, email, password, role } = req.body;

			//Update user info
			const user = await User.findById(id);

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
			if (role) {
				//Hash password
				const hashed_password = await bcrypt.hash(req.body.password, 10);

				user.password = await bcrypt.hash(req.body.password, 10);
			}

			await user.save();

			res.status(201).json({ name: user.name, email: user.email, role: user.role });
		}
		else {
			return res.status(403).send("Access forbidden");
		}
	} catch (err) {
		if (err.code === 11000) {
			return res.status(400).json({ message: "Email already exists" });
		}
		res.status(500).json({ message: err.message });
	}

	try {
		const user = await User.findById(req.params.id);
		if (!user) return res.status(404).json({ message: "User not found" });

		const updatedUser = await user.save();
		const { password, ...userWithoutPassword } = updatedUser._doc;
		res.json(userWithoutPassword);
	} catch (err) {
		res.status(400).json({ message: err.message });
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

		res.json({ message: 'User deleted' });

	} catch (err) {
		console.error(err);
		res.status(400).json({ error: 'Bad request' });
	}
});

module.exports = router;
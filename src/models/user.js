const mongoose = require('mongoose')
const ROLES = require('../constants/roles');
const THEMES = require('../constants/themes');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    index: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
    enum: Object.values(ROLES),
  },
  preferences: {
    theme: {
      type: String,
      required: true,
      enum: Object.values(THEMES),
      default: THEMES.LIGHT,
    }
  }
})

module.exports = mongoose.model('User', userSchema)
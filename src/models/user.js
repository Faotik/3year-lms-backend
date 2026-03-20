const mongoose = require('mongoose')
const ROLES = require('../constants/roles');

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
    enum: Object.values(ROLES)
  },
  refreshTokens: {
    type: [String]
  }
})

module.exports = mongoose.model('User', userSchema)
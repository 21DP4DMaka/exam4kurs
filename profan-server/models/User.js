// profan-server/models/User.js - Fixed to handle profileImage properly
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('regular', 'power', 'admin'),
    defaultValue: 'regular'
  },
  status: {
    type: DataTypes.ENUM('active', 'banned', 'suspended'),
    defaultValue: 'active'
  },
  banReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  profileImage: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
      
      // Remove validation for profileImage to allow any type of value
      // This is important since express-fileupload handles files differently
    }
  }
});

// Instance method to check password
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = User;
// Fixed User.js model with proper profileImage validation and default value
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
    allowNull: true,
    defaultValue: "/images/avatars/1.jpg", // Set default profile image
    validate: {
      // Custom validator to ensure profileImage is a string
      notAnObjectOrArray(value) {
        if (value !== null && typeof value === 'object') {
          throw new Error('profileImage cannot be an array or an object');
        }
      }
    }
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
      
      // Ensure profile image is set if it's not already
      if (!user.profileImage) {
        user.profileImage = "/images/avatars/1.jpg";
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Instance method to check password
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = User;
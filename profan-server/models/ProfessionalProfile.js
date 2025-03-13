const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProfessionalProfile = sequelize.define('ProfessionalProfile', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  education: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  verificationStatus: {
    type: DataTypes.ENUM('pending', 'verified', 'rejected'),
    defaultValue: 'pending'
  },
  verificationDocuments: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = ProfessionalProfile;
// profan-server/models/Review.js (updated)

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID of the user being reviewed'
  },
  reviewerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID of the user writing the review'
  },
  questionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID of the question this review is associated with'
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  timestamps: true
});

module.exports = Review;
// profan-server/models/index.js (Update this file with new associations)
const sequelize = require('../config/database');
const User = require('./User');
const ProfessionalProfile = require('./ProfessionalProfile');
const Tag = require('./Tag');
const Question = require('./Question');
const Answer = require('./Answer');
const Notification = require('./Notification');
const TagApplication = require('./TagApplication');
const Review = require('./Review');
const Comment = require('./Comment');
const Attachment = require('./Attachment');

// Current relationships in the system
User.hasOne(ProfessionalProfile, { foreignKey: 'userId' });
ProfessionalProfile.belongsTo(User, { foreignKey: 'userId' });

ProfessionalProfile.belongsToMany(Tag, { through: 'ProfessionalTags', timestamps: true });
Tag.belongsToMany(ProfessionalProfile, { through: 'ProfessionalTags', timestamps: true });

User.hasMany(Question, { foreignKey: 'userId' });
Question.belongsTo(User, { foreignKey: 'userId' });

Question.belongsToMany(Tag, { through: 'QuestionTags', timestamps: true });
Tag.belongsToMany(Question, { through: 'QuestionTags', timestamps: true });

User.hasMany(Answer, { foreignKey: 'userId' });
Answer.belongsTo(User, { foreignKey: 'userId' });

Question.hasMany(Answer, { foreignKey: 'questionId' });
Answer.belongsTo(Question, { foreignKey: 'questionId' });

User.hasMany(Notification, { foreignKey: 'userId' });
Notification.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(TagApplication, { foreignKey: 'userId' });
TagApplication.belongsTo(User, { foreignKey: 'userId' });

Tag.hasMany(TagApplication, { foreignKey: 'tagId' });
TagApplication.belongsTo(Tag, { foreignKey: 'tagId' });

User.hasMany(TagApplication, { foreignKey: 'reviewedBy', as: 'ReviewedApplications' });
TagApplication.belongsTo(User, { foreignKey: 'reviewedBy', as: 'Reviewer' });

User.hasMany(Review, { foreignKey: 'userId', as: 'ReceivedReviews' });
Review.belongsTo(User, { foreignKey: 'userId', as: 'ReviewedUser' });

User.hasMany(Review, { foreignKey: 'reviewerId', as: 'GivenReviews' });
Review.belongsTo(User, { foreignKey: 'reviewerId', as: 'Reviewer' });

// New relationships for Comments and Attachments
User.hasMany(Comment, { foreignKey: 'userId' });
Comment.belongsTo(User, { foreignKey: 'userId' });

Answer.hasMany(Comment, { foreignKey: 'answerId' });
Comment.belongsTo(Answer, { foreignKey: 'answerId' });

Question.hasMany(Comment, { foreignKey: 'questionId' });
Comment.belongsTo(Question, { foreignKey: 'questionId' });

User.hasMany(Attachment, { foreignKey: 'userId' });
Attachment.belongsTo(User, { foreignKey: 'userId' });

Question.hasMany(Attachment, { foreignKey: 'questionId' });
Attachment.belongsTo(Question, { foreignKey: 'questionId' });

// Export models
module.exports = {
  sequelize,
  User,
  ProfessionalProfile,
  Tag,
  Question,
  Answer,
  Notification, 
  TagApplication,
  Review,
  Comment,
  Attachment
};
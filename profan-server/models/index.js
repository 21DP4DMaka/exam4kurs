const sequelize = require('../config/database');
const User = require('./User');
const ProfessionalProfile = require('./ProfessionalProfile');
const Tag = require('./Tag');
const Question = require('./Question');
const Answer = require('./Answer');
const Notification = require('./Notification');
const TagApplication = require('./TagApplication');

// Definēt attiecības starp modeļiem
User.hasOne(ProfessionalProfile, { foreignKey: 'userId' });
ProfessionalProfile.belongsTo(User, { foreignKey: 'userId' });

// Profesionāļu un tagu M:N attiecība
ProfessionalProfile.belongsToMany(Tag, { through: 'ProfessionalTags', timestamps: true });
Tag.belongsToMany(ProfessionalProfile, { through: 'ProfessionalTags', timestamps: true });

// Jautājumi
User.hasMany(Question, { foreignKey: 'userId' });
Question.belongsTo(User, { foreignKey: 'userId' });

// Jautājumi un tagi M:N attiecība
Question.belongsToMany(Tag, { through: 'QuestionTags', timestamps: true });
Tag.belongsToMany(Question, { through: 'QuestionTags', timestamps: true });

// Atbildes
User.hasMany(Answer, { foreignKey: 'userId' });
Answer.belongsTo(User, { foreignKey: 'userId' });

Question.hasMany(Answer, { foreignKey: 'questionId' });
Answer.belongsTo(Question, { foreignKey: 'questionId' });

// Paziņojumi
User.hasMany(Notification, { foreignKey: 'userId' });
Notification.belongsTo(User, { foreignKey: 'userId' });

// Tagu pieteikumi
User.hasMany(TagApplication, { foreignKey: 'userId' });
TagApplication.belongsTo(User, { foreignKey: 'userId' });

Tag.hasMany(TagApplication, { foreignKey: 'tagId' });
TagApplication.belongsTo(Tag, { foreignKey: 'tagId' });

User.hasMany(TagApplication, { foreignKey: 'reviewedBy', as: 'ReviewedApplications' });
TagApplication.belongsTo(User, { foreignKey: 'reviewedBy', as: 'Reviewer' });

// Eksportēt modeļus
module.exports = {
  sequelize,
  User,
  ProfessionalProfile,
  Tag,
  Question,
  Answer,
  Notification,
  TagApplication
};
// profan-server/controllers/statsController.js
const { User, Question, Tag, Answer, sequelize } = require('../models');
const { Op } = require('sequelize');

// Get all statistics for the admin dashboard
exports.getAdminStats = async (req, res) => {
  try {
    // Get user statistics
    const userStats = await getUserStatistics();
    
    // Get question statistics
    const questionStats = await getQuestionStatistics();
    
    // Get tag statistics
    const tagStats = await getTagStatistics();
    
    res.json({
      userStats,
      questionStats,
      tagStats
    });
  } catch (error) {
    console.error('Error fetching admin statistics:', error);
    res.status(500).json({ message: 'Servera kļūda iegūstot statistiku' });
  }
};

// Get user statistics only
exports.getUserStats = async (req, res) => {
  try {
    const userStats = await getUserStatistics();
    res.json(userStats);
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    res.status(500).json({ message: 'Servera kļūda iegūstot lietotāju statistiku' });
  }
};

// Get question statistics only
exports.getQuestionStats = async (req, res) => {
  try {
    const questionStats = await getQuestionStatistics();
    res.json(questionStats);
  } catch (error) {
    console.error('Error fetching question statistics:', error);
    res.status(500).json({ message: 'Servera kļūda iegūstot jautājumu statistiku' });
  }
};

// Get tag statistics only
exports.getTagStats = async (req, res) => {
  try {
    const tagStats = await getTagStatistics();
    res.json(tagStats);
  } catch (error) {
    console.error('Error fetching tag statistics:', error);
    res.status(500).json({ message: 'Servera kļūda iegūstot kategoriju statistiku' });
  }
};

// Helper function to get user statistics
async function getUserStatistics() {
  // Total users count
  const totalUsers = await User.count();
  
  // Count users by role
  const powerUsers = await User.count({ 
    where: { role: 'power' } 
  });
  
  const regularUsers = await User.count({ 
    where: { role: 'regular' } 
  });
  
  const adminUsers = await User.count({ 
    where: { role: 'admin' } 
  });
  
  // Get users registered in the last week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const newUsersLastWeek = await User.count({
    where: {
      createdAt: {
        [Op.gte]: oneWeekAgo
      }
    }
  });
  
  return {
    totalUsers,
    powerUsers,
    regularUsers,
    adminUsers,
    newUsersLastWeek
  };
}

// Helper function to get question statistics
async function getQuestionStatistics() {
  // Total questions count
  const totalQuestions = await Question.count();
  
  // Count questions by status
  const openQuestions = await Question.count({ 
    where: { status: 'open' } 
  });
  
  const answeredQuestions = await Question.count({ 
    where: { status: 'answered' } 
  });
  
  const closedQuestions = await Question.count({ 
    where: { status: 'closed' } 
  });
  
  return {
    totalQuestions,
    openQuestions,
    answeredQuestions,
    closedQuestions
  };
}

// Helper function to get tag statistics
async function getTagStatistics() {
  // Find most used tags (using raw query for efficiency)
  const tagStats = await sequelize.query(`
    SELECT
      t.id,
      t.name,
      COUNT(qt.TagId) as count
    FROM Tags t
    LEFT JOIN QuestionTags qt ON t.id = qt.TagId
    GROUP BY t.id, t.name
    ORDER BY count DESC
    LIMIT 5
  `, { type: sequelize.QueryTypes.SELECT });
  
  return tagStats;
}
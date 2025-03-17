// profan-server/controllers/userController.js
const { User, Question, Answer, ProfessionalProfile, Notification, sequelize } = require('../models');
const { Op } = require('sequelize');

// Get all users with pagination (Admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    
    // Build search condition
    let whereCondition = {};
    if (search) {
      whereCondition = {
        [Op.or]: [
          { username: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } }
        ]
      };
    }
    
    const { count, rows } = await User.findAndCountAll({
      where: whereCondition,
      attributes: { exclude: ['password'] },
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      users: rows,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Servera kļūda iegūstot lietotājus' });
  }
};

// Ban a user (Admin only)
exports.banUser = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const userId = req.params.id;
    const { reason } = req.body;
    
    // Find the user
    const user = await User.findByPk(userId);
    
    if (!user) {
      await t.rollback();
      return res.status(404).json({ message: 'Lietotājs nav atrasts' });
    }
    
    // Check if user is already banned
    if (user.status === 'banned') {
      await t.rollback();
      return res.status(400).json({ message: 'Lietotājs jau ir bloķēts' });
    }
    
    // Check if trying to ban an admin
    if (user.role === 'admin') {
      await t.rollback();
      return res.status(403).json({ message: 'Nevar bloķēt administratoru' });
    }
    
    // Update user status
    await user.update({ 
      status: 'banned',
      banReason: reason || 'Lietošanas noteikumu pārkāpums'
    }, { transaction: t });
    
    // Create notification for the banned user
    await Notification.create({
      userId: user.id,
      content: `Jūsu konts ir bloķēts. Iemesls: ${reason || 'Lietošanas noteikumu pārkāpums'}`,
      type: 'system',
      isRead: false
    }, { transaction: t });
    
    await t.commit();
    
    res.json({
      message: 'Lietotājs veiksmīgi bloķēts',
      userId: userId
    });
  } catch (error) {
    await t.rollback();
    console.error('Error banning user:', error);
    res.status(500).json({ message: 'Servera kļūda bloķējot lietotāju' });
  }
};

// Unban a user (Admin only)
exports.unbanUser = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const userId = req.params.id;
    
    // Find the user
    const user = await User.findByPk(userId);
    
    if (!user) {
      await t.rollback();
      return res.status(404).json({ message: 'Lietotājs nav atrasts' });
    }
    
    // Check if user is not banned
    if (user.status !== 'banned') {
      await t.rollback();
      return res.status(400).json({ message: 'Lietotājs nav bloķēts' });
    }
    
    // Update user status
    await user.update({ 
      status: 'active',
      banReason: null
    }, { transaction: t });
    
    // Create notification for the unbanned user
    await Notification.create({
      userId: user.id,
      content: 'Jūsu konts ir atbloķēts. Jūs atkal varat lietot platformu.',
      type: 'system',
      isRead: false
    }, { transaction: t });
    
    await t.commit();
    
    res.json({
      message: 'Lietotājs veiksmīgi atbloķēts',
      userId: userId
    });
  } catch (error) {
    await t.rollback();
    console.error('Error unbanning user:', error);
    res.status(500).json({ message: 'Servera kļūda atbloķējot lietotāju' });
  }
};

// Delete a user (Admin only)
exports.deleteUser = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const userId = req.params.id;
    
    // Find the user
    const user = await User.findByPk(userId);
    
    if (!user) {
      await t.rollback();
      return res.status(404).json({ message: 'Lietotājs nav atrasts' });
    }
    
    // Check if trying to delete an admin
    if (user.role === 'admin') {
      await t.rollback();
      return res.status(403).json({ message: 'Nevar dzēst administratoru' });
    }
    
    // Delete associated data
    // 1. Delete user's professional profile if exists
    await ProfessionalProfile.destroy({
      where: { userId },
      transaction: t
    });
    
    // 2. Delete user's answers
    await Answer.destroy({
      where: { userId },
      transaction: t
    });
    
    // 3. Delete user's questions
    await Question.destroy({
      where: { userId },
      transaction: t
    });
    
    // 4. Finally delete the user
    await user.destroy({ transaction: t });
    
    await t.commit();
    
    res.json({
      message: 'Lietotājs veiksmīgi dzēsts',
      userId: userId
    });
  } catch (error) {
    await t.rollback();
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Servera kļūda dzēšot lietotāju' });
  }
};

// Report a user
exports.reportUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { reason } = req.body;
    
    // Find the user
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Lietotājs nav atrasts' });
    }
    
    // Find admin users
    const admins = await User.findAll({
      where: { role: 'admin' }
    });
    
    // Create notification for each admin
    for (const admin of admins) {
      await Notification.create({
        userId: admin.id,
        content: `Lietotājs ${user.username} (ID: ${userId}) tika ziņots. Iemesls: ${reason}`,
        type: 'system',
        isRead: false
      });
    }
    
    res.json({
      message: 'Ziņojums par lietotāju veiksmīgi iesniegts',
      userId: userId
    });
  } catch (error) {
    console.error('Error reporting user:', error);
    res.status(500).json({ message: 'Servera kļūda ziņojot par lietotāju' });
  }
};
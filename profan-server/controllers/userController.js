const { User, Question, Answer, ProfessionalProfile, Notification, Tag, sequelize } = require('../models');
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

// Add this function to userController.js

exports.getUserQuestions = async (req, res) => {
  try {
    const userId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const { count, rows } = await Question.findAndCountAll({
      where: { userId },
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'profileImage']
        },
        {
          model: Tag, 
          through: { attributes: [] },
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true
    });
    
    // Get answer count for each question
    const questionsWithCounts = await Promise.all(rows.map(async (question) => {
      const answersCount = await Answer.count({
        where: { questionId: question.id }
      });
      
      const questionJson = question.toJSON();
      questionJson.answers_count = answersCount;
      return questionJson;
    }));
    
    res.json({
      questions: questionsWithCounts,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching user questions:', error);
    res.status(500).json({ message: 'Servera kļūda iegūstot lietotāja jautājumus' });
  }
}

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: ProfessionalProfile,
          required: false,
          include: [
            {
              model: Tag,
              through: { attributes: [] },
              attributes: ['id', 'name', 'description']
            }
          ]
        }
      ]
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Lietotājs nav atrasts' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Servera kļūda iegūstot lietotāju' });
  }
};

// Add this to userController.js in profan-server/controllers/userController.js

exports.getUserAnswers = async (req, res) => {
  try {
    const userId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const { Answer, Question, User, sequelize } = require('../models');
    
    const { count, rows } = await Answer.findAndCountAll({
      where: { userId },
      include: [
        {
          model: Question,
          attributes: ['id', 'title', 'status']
        },
        {
          model: User,
          attributes: ['id', 'username', 'profileImage']
        }
      ],
      order: [
        ['isAccepted', 'DESC'],
        ['createdAt', 'DESC']
      ],
      limit,
      offset,
      distinct: true
    });
    
    res.json({
      answers: rows,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching user answers:', error);
    res.status(500).json({ message: 'Servera kļūda iegūstot lietotāja atbildes' });
  }
};
// Update profile endpoint
exports.updateProfile = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const userId = req.user.id;
    let profileImagePath = null;
    
    // Process profile image if uploaded
    if (req.files && req.files.profileImage) {
      const profileImage = req.files.profileImage;
      
      // Validate file type
      if (!profileImage.mimetype.startsWith('image/')) {
        await t.rollback();
        return res.status(400).json({ message: 'Failam jābūt attēla formātā' });
      }
      
      // Validate file size (max 2MB)
      if (profileImage.size > 2 * 1024 * 1024) {
        await t.rollback();
        return res.status(400).json({ message: 'Attēla izmērs nedrīkst pārsniegt 2MB' });
      }
      
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(__dirname, '../uploads/profile-images');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // Generate unique filename
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
      const fileExtension = profileImage.name.split('.').pop();
      const filename = `profile-${userId}-${uniqueSuffix}.${fileExtension}`;
      const filePath = path.join(uploadsDir, filename);
      
      // Save the file
      await profileImage.mv(filePath);
      
      // Set the path for database
      profileImagePath = `/uploads/profile-images/${filename}`;
    }
    
    // Find the user
    const user = await User.findByPk(userId);
    
    if (!user) {
      await t.rollback();
      return res.status(404).json({ message: 'Lietotājs nav atrasts' });
    }
    
    // Extract profile data
    const { username, bio } = req.body;
    
    // Update user profile data
    await user.update({
      username: username || user.username,
      bio: bio !== undefined ? bio : user.bio,
      profileImage: profileImagePath || user.profileImage
    }, { transaction: t });
    
    // Update professional profile if exists and user is professional
    if (req.body.professionalData && (user.role === 'power' || user.role === 'admin')) {
      let profile = await ProfessionalProfile.findOne({ where: { userId } });
      
      const { workplace } = req.body.professionalData;
      
      if (profile) {
        // Update existing profile
        await profile.update({
          education: req.body.professionalData.education || profile.education,
          workplace: workplace !== undefined ? workplace : profile.workplace
        }, { transaction: t });
      } else {
        // Create new profile
        profile = await ProfessionalProfile.create({
          userId,
          education: req.body.professionalData.education || null,
          workplace: workplace || null
        }, { transaction: t });
      }
    }
    
    await t.commit();
    
    // Return updated user data
    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: ProfessionalProfile,
          required: false
        }
      ]
    });
    
    res.json({
      message: 'Profils veiksmīgi atjaunināts',
      user: updatedUser
    });
  } catch (error) {
    await t.rollback();
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Servera kļūda atjauninot profilu' });
  }
};



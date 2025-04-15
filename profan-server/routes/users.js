const express = require('express');
const router = express.Router();
const { User, ProfessionalProfile, Tag } = require('../models');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const userController = require('../controllers/userController');

// Iegūt lietotāja profilu pēc ID
router.get('/:id', async (req, res) => {
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
});

// Get user's questions
router.get('/:id/questions', userController.getUserQuestions);
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Pašreizējā un jaunā parole ir obligātas' });
    }
    
    // Find the user
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Lietotājs nav atrasts' });
    }
    
    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Pašreizējā parole nav pareiza' });
    }
    
    // Update the password
    user.password = newPassword;
    await user.save();
    
    res.json({
      message: 'Parole veiksmīgi atjaunināta'
    });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Servera kļūda atjaunojot paroli' });
  }
});

// Получить профессиональные теги пользователя
router.get('/:id/professional-tags', async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Находим профессиональный профиль пользователя с тегами
    const profile = await ProfessionalProfile.findOne({
      where: { userId },
      include: [
        {
          model: Tag,
          through: { attributes: [] },
          attributes: ['id', 'name', 'description']
        }
      ]
    });
    
    if (!profile) {
      return res.json([]);
    }
    
    res.json(profile.Tags || []);
  } catch (error) {
    console.error('Error fetching professional tags:', error);
    res.status(500).json({ message: 'Servera kļūda iegūstot profesionālos tagus' });
  }
});

// Autentificētie maršruti lietotāju pārvaldībai
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, bio, profileImage } = req.body;
    
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Lietotājs nav atrasts' });
    }
    
    // Atjaunināt lietotāja datus
    await user.update({
      username: username || user.username,
      bio: bio || user.bio,
      profileImage: profileImage || user.profileImage
    });
    
    // Ja ir profesionāla dati un lietotājs ir power lietotājs, atjaunināt arī tos
    if (req.body.professionalData && (user.role === 'power' || user.role === 'admin')) {
      let profile = await ProfessionalProfile.findOne({ where: { userId } });
      
      if (profile) {
        await profile.update({
          education: req.body.professionalData.education || profile.education
        });
      } else {
        profile = await ProfessionalProfile.create({
          userId,
          education: req.body.professionalData.education
        });
      }
    }
    
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
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Servera kļūda atjauninot profilu' });
  }
});

// Admin user management routes
router.get('/admin/users', authenticateToken, isAdmin, userController.getAllUsers);
router.post('/:id/ban', authenticateToken, isAdmin, userController.banUser);
router.post('/:id/unban', authenticateToken, isAdmin, userController.unbanUser);
router.delete('/:id', authenticateToken, isAdmin, userController.deleteUser);

// Report user route
router.post('/:id/report', authenticateToken, userController.reportUser);

router.get('/:id', userController.getUserById);
router.get('/:id/answers', userController.getUserAnswers);

module.exports = router;
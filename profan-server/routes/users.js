const express = require('express');
const router = express.Router();
const { User, ProfessionalProfile } = require('../models');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Iegūt lietotāja profilu pēc ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: ProfessionalProfile,
          required: false
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
      bio: bio !== undefined ? bio : user.bio,
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

// Administratora maršruti lietotāju pārvaldībai
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const { count, rows } = await User.findAndCountAll({
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
});

module.exports = router;
const express = require('express');
const router = express.Router();
const { ProfessionalProfile, Tag } = require('../models');
const { authenticateToken } = require('../middleware/auth');

// Получить теги профессионального профиля по ID
router.get('/:profileId/tags', authenticateToken, async (req, res) => {
  try {
    const profileId = req.params.profileId;
    
    const profile = await ProfessionalProfile.findByPk(profileId, {
      include: [
        {
          model: Tag,
          through: { attributes: [] },
          attributes: ['id', 'name', 'description']
        }
      ]
    });
    
    if (!profile) {
      return res.status(404).json({ message: 'Профиль не найден' });
    }
    
    res.json(profile.Tags || []);
  } catch (error) {
    console.error('Error fetching profile tags:', error);
    res.status(500).json({ message: 'Ошибка при загрузке тегов профиля' });
  }
});

module.exports = router;
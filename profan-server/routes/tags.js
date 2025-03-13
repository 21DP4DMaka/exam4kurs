const express = require('express');
const router = express.Router();
const { Tag } = require('../models');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Iegūt visus tagus
router.get('/', async (req, res) => {
  try {
    const tags = await Tag.findAll({
      order: [['name', 'ASC']]
    });
    res.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ message: 'Servera kļūda iegūstot tagus' });
  }
});

// Autentificētie maršruti tagu pārvaldībai (tikai administratoriem)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const existingTag = await Tag.findOne({ where: { name } });
    if (existingTag) {
      return res.status(400).json({ message: 'Tags ar šādu nosaukumu jau eksistē' });
    }
    
    const tag = await Tag.create({ name, description });
    res.status(201).json(tag);
  } catch (error) {
    console.error('Error creating tag:', error);
    res.status(500).json({ message: 'Servera kļūda izveidojot tagu' });
  }
});

module.exports = router;
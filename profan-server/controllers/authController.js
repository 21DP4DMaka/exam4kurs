const { sequelize, User, ProfessionalProfile } = require('../models');
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');

// Reģistrēt jaunu lietotāju
exports.register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Pārbaudīt, vai lietotājs jau eksistē
    const existingUser = await User.findOne({ 
      where: { 
        [Op.or]: [{ email }, { username }] 
      } 
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: 'Lietotājs ar šādu e-pastu vai lietotājvārdu jau eksistē' 
      });
    }

    // Izveidot jaunu lietotāju
    const user = await User.create({
      username,
      email,
      password,
      role: role === 'professional' ? 'power' : 'regular'
    });

    // Ja lietotājs ir profesionālis, izveidot profesionāļa profilu
    if (role === 'professional') {
      await ProfessionalProfile.create({
        userId: user.id
      });
    }

    // Izveidot JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Lietotājs veiksmīgi reģistrēts',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Reģistrācijas kļūda:', error);
    res.status(500).json({ message: 'Servera kļūda' });
  }
};

// Lietotāja pieteikšanās
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Atrast lietotāju pēc e-pasta
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: 'Nepareizs e-pasts vai parole' });
    }

    // Pārbaudīt paroli
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Nepareizs e-pasts vai parole' });
    }

    // Izveidot JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Pieteikšanās veiksmīga',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Pieteikšanās kļūda:', error);
    res.status(500).json({ message: 'Servera kļūda' });
  }
};

// Iegūt pašreizējā lietotāja profilu
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
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

    res.json({ user });
  } catch (error) {
    console.error('Lietotāja profila iegūšanas kļūda:', error);
    res.status(500).json({ message: 'Servera kļūda' });
  }
};
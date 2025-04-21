// Updated profan-server/controllers/authController.js
const { sequelize, User, ProfessionalProfile } = require('../models');
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');

// Reģistrēt jaunu lietotāju
exports.register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Дополнительная проверка email на сервере
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: 'Nederīgs e-pasta formāts. Lūdzu, izmantojiet derīgu e-pastu (piemēram, lietotājs@domēns.com)' 
      });
    }

    // Проверяем, существует ли пользователь
    try {
      const existingUser = await User.findOne({ 
        where: { 
          [Op.or]: [{ email }, { username }] 
        } 
      });

      if (existingUser) {
        // Более точные сообщения об ошибке
        if (existingUser.email === email) {
          return res.status(400).json({ 
            message: 'Lietotājs ar šādu e-pastu jau eksistē' 
          });
        } else {
          return res.status(400).json({ 
            message: 'Lietotājs ar šādu lietotājvārdu jau eksistē' 
          });
        }
      }
    } catch (dbError) {
      console.error('Kļūda pārbaudot lietotāju:', dbError);
      return res.status(500).json({ 
        message: 'Kļūda pārbaudot lietotāju datu bāzē. Lūdzu, mēģiniet vēlreiz.' 
      });
    }

    // Создаем нового пользователя с дефолтным изображением профиля
    try {
      const user = await User.create({
        username,
        email,
        password,
        role: role === 'professional' ? 'power' : 'regular',
        profileImage: "/images/avatars/1.jpg" // Default avatar
      });

      // Создаем профессиональный профиль, если пользователь - профессионал
      if (role === 'professional') {
        await ProfessionalProfile.create({
          userId: user.id
        });
      }

      // Создаем JWT токен
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
          role: user.role,
          profileImage: user.profileImage
        }
      });
    } catch (createError) {
      console.error('Kļūda izveidojot lietotāju:', createError);
      
      // Обработка ошибок валидации Sequelize
      if (createError.name === 'SequelizeValidationError') {
        const validationErrors = createError.errors.map(err => ({
          field: err.path,
          message: err.message
        }));
        
        return res.status(400).json({ 
          message: 'Validācijas kļūda',
          errors: validationErrors
        });
      }
      
      return res.status(500).json({ message: 'Servera kļūda izveidojot lietotāju' });
    }

  } catch (error) {
    console.error('Reģistrācijas kļūda:', error);
    res.status(500).json({ 
      message: 'Servera kļūda',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Lietotāja pieteikšanās - Modified to handle banned users
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

    // Check if user is banned
    if (user.status === 'banned') {
      // Still create a token for banned users but return appropriate status and message
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(403).json({
        message: 'Jūsu konts ir bloķēts',
        reason: user.banReason || 'Lietošanas noteikumu pārkāpums',
        token // Include token so frontend can use it with the ban page
      });
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
        role: user.role,
        profileImage: user.profileImage
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
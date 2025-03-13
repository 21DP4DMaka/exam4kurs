const jwt = require('jsonwebtoken');
const { User } = require('../models');

exports.authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Nepieciešama autentifikācija' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'Lietotājs neeksistē' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Nekorekts vai novecojis tokens' });
  }
};

exports.isPowerUser = async (req, res, next) => {
  if (req.user.role === 'power' || req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Nepietiekamas tiesības' });
  }
};

exports.isAdmin = async (req, res, next) => {
  if (req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Nepietiekamas tiesības' });
  }
};
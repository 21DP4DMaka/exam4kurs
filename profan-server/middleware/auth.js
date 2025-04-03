// Updated profan-server/middleware/auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');

exports.authenticateToken = async (req, res, next) => {
  try {
    // Check Authorization header or query parameter token
    const authHeader = req.headers.authorization;
    const queryToken = req.query.token;
    
    let token;
    if (authHeader) {
      token = authHeader.split(' ')[1];
    } else if (queryToken) {
      token = queryToken;
    }
    
    if (!token) {
      return res.status(401).json({ message: 'Nepieciešama autentifikācija' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'Lietotājs neeksistē' });
    }
    
    // Check if user is banned - Return a clear error message with reason
    if (user.status === 'banned') {
      return res.status(403).json({ 
        message: 'Jūsu konts ir bloķēts',
        reason: user.banReason || 'Lietošanas noteikumu pārkāpums'
      });
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
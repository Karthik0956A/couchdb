const jwt = require('jsonwebtoken');
const { getDB } = require('../config/db');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usersDB = getDB('users');
    
    try {
      const user = await usersDB.get(decoded.id);
      req.user = user;
      req.userId = user._id;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = auth;

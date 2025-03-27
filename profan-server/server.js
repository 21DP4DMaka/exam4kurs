// profan-server/server.js (Update this file to add new routes)
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const questionRoutes = require('./routes/questions');
const answerRoutes = require('./routes/answers');
const notificationRoutes = require('./routes/notifications');
const tagRoutes = require('./routes/tags');
const userRoutes = require('./routes/users');
const tagApplicationRoutes = require('./routes/tagApplication');
const reviewRoutes = require('./routes/reviews');
const commentRoutes = require('./routes/comments'); // Make sure this is imported
const attachmentRoutes = require('./routes/attachments');
const answerCommentsRoutes = require('./routes/answerComments');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Static directories
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Set up routes
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/answers', answerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tag-applications', tagApplicationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/answers/:answerId/comments', commentRoutes);  // This line is missing
app.use('/api/comments', commentRoutes);
app.use('/api', attachmentRoutes);


// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Professional Answers API darbojas!' });
});

// Check database and start server
const startServer = async () => {
  try {
    // Just check connection, without auto-creating tables
    await sequelize.authenticate();
    console.log('Veiksmīgs savienojums ar datubāzi');
    
    app.listen(PORT, () => {
      console.log(`Serveris darbojas uz porta ${PORT}`);
    });
  } catch (error) {
    console.error('Neizdevās startēt serveri:', error);
  }
};

startServer();
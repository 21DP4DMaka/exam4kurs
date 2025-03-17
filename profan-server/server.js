const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const path = require('path');
require('dotenv').config();

// Maršrutu importēšana
const authRoutes = require('./routes/auth');
const questionRoutes = require('./routes/questions');
const answerRoutes = require('./routes/answers');
const notificationRoutes = require('./routes/notifications');
const tagRoutes = require('./routes/tags');
const userRoutes = require('./routes/users');
const tagApplicationRoutes = require('./routes/tagApplication');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Statiskā direktorija dokumentu ielādei
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Maršrutu uzstādīšana
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/answers', answerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tag-applications', tagApplicationRoutes);

// Testa maršruts, lai pārbaudītu, vai serveris darbojas
app.get('/', (req, res) => {
  res.json({ message: 'Professional Answers API darbojas!' });
});

// Datubāzes pārbaude un servera palaišana
const startServer = async () => {
  try {
    // Vienkārši pārbaudam savienojumu, BEZ automātiskas tabulu izveidošanas
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
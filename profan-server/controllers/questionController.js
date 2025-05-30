const { Question, User, Tag, Answer, sequelize, Notification } = require('../models');
const { Op } = require('sequelize');
const notificationController = require('./notificationController');

// Iegūt jautājumu sarakstu ar filtrēšanu
exports.getQuestions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Filtrēšanas parametri
    const tagIds = req.query.tags ? req.query.tags.split(',').map(id => parseInt(id)) : [];
    const searchQuery = req.query.search || '';
    const status = req.query.status || null;
    
    // Bāzes vaicājuma nosacījumi
    let whereConditions = {};
    
    // Pievienot meklēšanas nosacījumu, ja tas ir norādīts
    if (searchQuery) {
      whereConditions = {
        [Op.or]: [
          { title: { [Op.like]: `%${searchQuery}%` } },
          { content: { [Op.like]: `%${searchQuery}%` } }
        ]
      };
    }
    
    //  status filtrs
    if (status && status !== 'all') {
      whereConditions.status = status;
    }
    
    // Veidojam vaicājuma opcijas
    const queryOptions = {
      where: whereConditions,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'profileImage']
        },
        {
          model: Tag,
          through: { attributes: [] },
          attributes: ['id', 'name']
        }
      ],
      distinct: true, // Nepieciešams korektas kopējā skaita iegūšanai
    };
    
    // Ja ir norādīti tagi, pievienojam tos vaicājumam
    if (tagIds.length > 0) {
      queryOptions.include[1].where = {
        id: { [Op.in]: tagIds } 
      };
    }
    
    // Iegūt kopējo skaitu un paginācijas datus
    const { count, rows } = await Question.findAndCountAll(queryOptions);
    
    // Iegūt atbilžu skaitu katram jautājumam
    const questionsWithCounts = await Promise.all(rows.map(async (question) => {
      const answersCount = await Answer.count({
        where: { questionId: question.id }
      });
      
      const questionJson = question.toJSON();
      questionJson.answers_count = answersCount;
      return questionJson;
    }));
    
    res.json({
      questions: questionsWithCounts,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ message: 'Servera kļūda iegūstot jautājumus' });
  }
};

// Iegūt vienu jautājumu pēc ID ar atbildēm
exports.getQuestionById = async (req, res) => {
  try {
    const questionId = req.params.id;
    
    const question = await Question.findByPk(questionId, {
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'profileImage']
        },
        {
          model: Tag,
          through: { attributes: [] },
          attributes: ['id', 'name']
        },
        {
          model: Answer,
          include: [
            {
              model: User,
              attributes: ['id', 'username', 'profileImage', 'role']
            }
          ],
          order: [
            ['isAccepted', 'DESC'],
            ['createdAt', 'DESC']
          ]
        }
      ]
    });
    
    if (!question) {
      return res.status(404).json({ message: 'Jautājums nav atrasts' });
    }
    
    res.json(question);
  } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({ message: 'Servera kļūda iegūstot jautājumu' });
  }
};

// Izveidot jaunu jautājumu
exports.createQuestion = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { title, content, tags } = req.body;
    const userId = req.user.id;
    
    // Pārbaudīt, vai ir visi nepieciešamie dati
    if (!title || !content || !tags || !tags.length) {
      await t.rollback();
      return res.status(400).json({ 
        message: 'Lūdzu, aizpildiet visus obligātos laukus (virsraksts, saturs, tagi)' 
      });
    }
    
    // Izveidot jautājumu
    const question = await Question.create({
      title,
      content,
      userId
    }, { transaction: t });
    
    // Pievienot tagus
    const tagInstances = await Promise.all(tags.map(async (tagId) => {
      return await Tag.findByPk(tagId);
    }));
    
    const validTags = tagInstances.filter(tag => tag !== null);
    await question.setTags(validTags, { transaction: t });
    
    await t.commit();
    
    // Atgriežam izveidoto jautājumu ar tagiem
    const newQuestion = await Question.findByPk(question.id, {
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'profileImage']
        },
        {
          model: Tag,
          through: { attributes: [] },
          attributes: ['id', 'name']
        }
      ]
    });
    
    // Nosūtīt paziņojumus profesionāļiem ar atbilstošiem tagiem
    try {
      await notificationController.createQuestionNotificationsForProfessionals(
        newQuestion, 
        tags
      );
    } catch (notifError) {
      console.error('Error sending notifications:', notifError);
      // Turpinām, pat ja paziņojumu sūtīšana neizdodas
    }
    
    res.status(201).json({
      message: 'Jautājums veiksmīgi izveidots',
      question: newQuestion
    });
  } catch (error) {
    await t.rollback();
    console.error('Error creating question:', error);
    res.status(500).json({ message: 'Servera kļūda izveidojot jautājumu' });
  }
};

// Atjaunināt jautājumu
exports.updateQuestion = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const questionId = req.params.id;
    const { title, content, tags, status } = req.body;
    const userId = req.user.id;
    
    // Atrast jautājumu
    const question = await Question.findByPk(questionId);
    
    if (!question) {
      await t.rollback();
      return res.status(404).json({ message: 'Jautājums nav atrasts' });
    }
    
    // Pārbaudīt vai lietotājs ir jautājuma autors vai administrators
    if (question.userId !== userId && req.user.role !== 'admin') {
      await t.rollback();
      return res.status(403).json({ message: 'Nav tiesību rediģēt šo jautājumu' });
    }
    
    // Atjaunināt jautājumu
    await question.update({
      title: title || question.title,
      content: content || question.content,
      status: status || question.status
    }, { transaction: t });
    
    // Atjaunināt tagus, ja tie ir norādīti
    if (tags && tags.length > 0) {
      const tagInstances = await Promise.all(tags.map(async (tagId) => {
        return await Tag.findByPk(tagId);
      }));
      
      const validTags = tagInstances.filter(tag => tag !== null);
      await question.setTags(validTags, { transaction: t });
    }
    
    await t.commit();
    
    // Atgriežam atjaunināto jautājumu ar tagiem
    const updatedQuestion = await Question.findByPk(questionId, {
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'profileImage']
        },
        {
          model: Tag,
          through: { attributes: [] },
          attributes: ['id', 'name']
        }
      ]
    });
    
    res.json({
      message: 'Jautājums veiksmīgi atjaunināts',
      question: updatedQuestion
    });
  } catch (error) {
    await t.rollback();
    console.error('Error updating question:', error);
    res.status(500).json({ message: 'Servera kļūda atjauninot jautājumu' });
  }
};

// Delete a question (Admin only)
exports.deleteQuestion = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const questionId = req.params.id;
    
    // Find the question
    const question = await Question.findByPk(questionId, {
      include: [
        {
          model: Answer,
          attributes: ['id']
        }
      ]
    });
    
    if (!question) {
      await t.rollback();
      return res.status(404).json({ message: 'Jautājums nav atrasts' });
    }
    
    // Check if the user is an admin
    if (req.user.role !== 'admin') {
      await t.rollback();
      return res.status(403).json({ message: 'Tikai administratori var dzēst jautājumus' });
    }
    
    // Delete all associated answers
    if (question.Answers && question.Answers.length > 0) {
      const answerIds = question.Answers.map(answer => answer.id);
      await Answer.destroy({
        where: { id: { [Op.in]: answerIds } },
        transaction: t
      });
    }
    
    // Remove tag associations
    await question.setTags([], { transaction: t });
    
    // Delete question
    await question.destroy({ transaction: t });
    
    // Create notification for the question author
    await Notification.create({
      userId: question.userId,
      content: `Jūsu jautājums "${question.title.substring(0, 50)}..." tika dzēsts administratora dēļ satura noteikumu pārkāpuma.`,
      type: 'system',
      isRead: false
    }, { transaction: t });
    
    await t.commit();
    
    res.json({
      message: 'Jautājums veiksmīgi dzēsts',
      questionId: questionId
    });
  } catch (error) {
    await t.rollback();
    console.error('Error deleting question:', error);
    res.status(500).json({ message: 'Servera kļūda dzēšot jautājumu' });
  }
};
exports.reportUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { reason } = req.body;
    const reporterId = req.user.id; // Get the ID of the user who is reporting
    
    // Find the user
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Lietotājs nav atrasts' });
    }
    
    // Find the reporter to get their username
    const reporter = await User.findByPk(reporterId, {
      attributes: ['username']
    });
    
    // Find admin users
    const admins = await User.findAll({
      where: { role: 'admin' }
    });
    
    // Create notification for each admin
    for (const admin of admins) {
      await Notification.create({
        userId: admin.id,
        content: `Lietotājs ${user.username} (ID: ${userId}) tika ziņots. Ziņotājs: ${reporter ? reporter.username : 'Nezināms lietotājs'}. Iemesls: ${reason}`,
        type: 'system',
        isRead: false
      });
    }
    
    res.json({
      message: 'Ziņojums par lietotāju veiksmīgi iesniegts',
      userId: userId
    });
  } catch (error) {
    console.error('Error reporting user:', error);
    res.status(500).json({ message: 'Servera kļūda ziņojot par lietotāju' });
  }
};
// Add a reason for deletion
exports.reportQuestion = async (req, res) => {
  try {
    const questionId = req.params.id;
    const { reason } = req.body;
    const reporterId = req.user.id; // Get the ID of the user who is reporting
    
    // Find the question
    const question = await Question.findByPk(questionId);
    
    if (!question) {
      return res.status(404).json({ message: 'Jautājums nav atrasts' });
    }
    
    // Find the reporter to get their username
    const reporter = await User.findByPk(reporterId, {
      attributes: ['username']
    });
    
    // Find admin users
    const admins = await User.findAll({
      where: { role: 'admin' }
    });
    
    // Create notification for each admin
    for (const admin of admins) {
      await Notification.create({
        userId: admin.id,
        content: `Jautājums ID: ${questionId} tika ziņots. Ziņotājs: ${reporter ? reporter.username : 'Nezināms lietotājs'}. Iemesls: ${reason}`,
        type: 'system',
        relatedQuestionId: questionId,
        isRead: false
      });
    }
    
    res.json({
      message: 'Ziņojums par jautājumu veiksmīgi iesniegts',
      questionId: questionId
    });
  } catch (error) {
    console.error('Error reporting question:', error);
    res.status(500).json({ message: 'Servera kļūda ziņojot par jautājumu' });
  }
};
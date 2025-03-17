// profan-server/controllers/notificationController.js
const { Notification, Question, User, Tag, ProfessionalProfile, sequelize } = require('../models');
const { Op } = require('sequelize');

// Iegūt lietotāja paziņojumus
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const { count, rows } = await Notification.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
    
    res.json({
      notifications: rows,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      unreadCount: await Notification.count({
        where: { 
          userId,
          isRead: false
        }
      })
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Servera kļūda iegūstot paziņojumus' });
  }
};

// Atzīmēt paziņojumu kā lasītu
exports.markAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;
    
    // Atrast paziņojumu
    const notification = await Notification.findByPk(notificationId);
    
    if (!notification) {
      return res.status(404).json({ message: 'Paziņojums nav atrasts' });
    }
    
    // Pārbaudīt vai paziņojums pieder lietotājam
    if (notification.userId !== userId) {
      return res.status(403).json({ message: 'Nav tiesību piekļūt šim paziņojumam' });
    }
    
    // Atzīmēt kā lasītu
    await notification.update({ isRead: true });
    
    res.json({
      message: 'Paziņojums atzīmēts kā lasīts',
      notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Servera kļūda atjauninot paziņojumu' });
  }
};

// Atzīmēt visus lietotāja paziņojumus kā lasītus
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    
    await Notification.update(
      { isRead: true },
      { where: { userId, isRead: false } }
    );
    
    res.json({
      message: 'Visi paziņojumi atzīmēti kā lasīti'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Servera kļūda atjauninot paziņojumus' });
  }
};

// Izveidot jaunus paziņojumus profesionāļiem par jautājumiem viņu kategorijās - UPDATED
exports.createQuestionNotificationsForProfessionals = async (question, tags) => {
  const t = await sequelize.transaction();
  
  try {
    if (!question || !tags || tags.length === 0) {
      console.log('Nav jautājuma vai tagu');
      return [];
    }
    
    // MODIFIED: Atrast TIKAI profesionāļus, kuriem ir TIEŠI ŠIE tagi
    const professionals = await User.findAll({
      where: {
        [Op.or]: [
          { role: 'power' },
          { role: 'admin' }
        ]
      },
      include: [{
        model: ProfessionalProfile,
        required: true,
        include: [{
          model: Tag,
          where: {
            id: {
              [Op.in]: tags
            }
          },
          required: true // This ensures professionals must have at least one matching tag
        }]
      }]
    });
    
    if (professionals.length === 0) {
      console.log('Nav atrasti profesionāļi ar atbilstošiem tagiem');
      await t.commit();
      return [];
    }
    
    // Izveidot paziņojumus katram profesionālim ar atbilstošiem tagiem
    const notifications = [];
    for (const professional of professionals) {
      // Nenosūtīt paziņojumu pašam jautājuma autoram
      if (professional.id === question.userId) {
        continue;
      }
      
      const notification = await Notification.create({
        userId: professional.id,
        content: `Jauns jautājums jūsu kategorijā: "${question.title.substring(0, 50)}${question.title.length > 50 ? '...' : ''}"`,
        type: 'question',
        relatedQuestionId: question.id,
        isRead: false
      }, { transaction: t });
      
      notifications.push(notification);
    }
    
    await t.commit();
    return notifications;
  } catch (error) {
    await t.rollback();
    console.error('Error creating notifications for professionals:', error);
    return [];
  }
};
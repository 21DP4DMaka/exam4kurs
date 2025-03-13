const { Notification } = require('../models');

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
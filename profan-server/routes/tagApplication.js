const express = require('express');
const router = express.Router();
const tagApplicationController = require('../controllers/tagApplicationController');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const fileUpload = require('express-fileupload');

// Middleware for file upload
router.use(fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
  abortOnLimit: true,
  safeFileNames: true,
  preserveExtension: true
}));

// Lietotāju maršruti
router.get('/user', authenticateToken, tagApplicationController.getUserApplications);
router.post('/', authenticateToken, tagApplicationController.submitApplication);

// Модифицированный маршрут для получения документа - поддерживает токен в URL
router.get('/:id/document', async (req, res) => {
  try {
    const applicationId = req.params.id;
    
    // Вызываем функцию аутентификации вручную
    const authMiddleware = require('../middleware/auth').authenticateToken;
    authMiddleware(req, res, async () => {
      const { TagApplication } = require('../models');
      const fs = require('fs');
      
      const application = await TagApplication.findByPk(applicationId);
      
      if (!application) {
        return res.status(404).json({ message: 'Pieteikums nav atrasts' });
      }
      
      // Pārbaudīt vai lietotājam ir tiesības skatīt šo dokumentu
      if (req.user.id !== application.userId && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Nav tiesību piekļūt šim dokumentam' });
      }
      
      // Pārbaudīt vai fails eksistē
      if (!fs.existsSync(application.documentPath)) {
        return res.status(404).json({ message: 'Dokuments nav atrasts' });
      }
      
      // Nosūtīt failu
      res.sendFile(application.documentPath);
    });
  } catch (error) {
    console.error('Error fetching application document:', error);
    res.status(500).json({ message: 'Servera kļūda iegūstot dokumentu' });
  }
});

// Administratoru maršruti
router.get('/', authenticateToken, isAdmin, tagApplicationController.getAllApplications);
router.put('/:id/review', authenticateToken, isAdmin, tagApplicationController.reviewApplication);

module.exports = router;
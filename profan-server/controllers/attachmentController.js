// profan-server/controllers/attachmentController.js
const fs = require('fs');
const path = require('path');
const { Attachment, Question, User, sequelize } = require('../models');
const { Op } = require('sequelize');

// Helper function to ensure upload directory exists
const ensureUploadDirExists = () => {
  const uploadDir = path.join(__dirname, '../uploads/attachments');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
};

// Upload attachments for a question
exports.uploadAttachments = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const questionId = parseInt(req.params.questionId);
    const userId = req.user.id;
    
    // Check if question exists and user is the owner
    const question = await Question.findByPk(questionId);
    
    if (!question) {
      await t.rollback();
      return res.status(404).json({ message: 'Jautājums nav atrasts' });
    }
    
    // Only question author can upload attachments
    if (question.userId !== userId) {
      await t.rollback();
      return res.status(403).json({ message: 'Tikai jautājuma autors var pievienot pielikumus' });
    }
    
    // Check if files were uploaded
    if (!req.files || Object.keys(req.files).length === 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Nav augšupielādēti faili' });
    }
    
    // Get uploaded files
    let files = [];
    if (Array.isArray(req.files.files)) {
      files = req.files.files;
    } else {
      files = [req.files.files];
    }
    
    // Check file count limit (max 2 files)
    const existingFiles = await Attachment.count({ where: { questionId } });
    if (existingFiles + files.length > 2) {
      await t.rollback();
      return res.status(400).json({ message: 'Vienam jautājumam var pievienot ne vairāk kā 2 failus' });
    }
    
    // Ensure upload directory exists
    const uploadDir = ensureUploadDirExists();
    
    // Save each file and create attachment records
    const attachments = [];
    for (const file of files) {
      // Validate file type (only PDF and PNG allowed)
      if (file.mimetype !== 'application/pdf' && file.mimetype !== 'image/png') {
        await t.rollback();
        return res.status(400).json({ message: 'Atļauti tikai PDF un PNG faili' });
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        await t.rollback();
        return res.status(400).json({ message: 'Maksimālais faila izmērs ir 5MB' });
      }
      
      // Generate unique filename
      const timestamp = Date.now();
      const uniqueFilename = `${questionId}_${userId}_${timestamp}_${file.name.replace(/\s+/g, '_')}`;
      const filePath = path.join(uploadDir, uniqueFilename);
      
      // Save file
      await file.mv(filePath);
      
      // Create attachment record
      const attachment = await Attachment.create({
        questionId,
        userId,
        filename: uniqueFilename,
        originalname: file.name,
        mimetype: file.mimetype,
        path: filePath,
        size: file.size
      }, { transaction: t });
      
      attachments.push(attachment);
    }
    
    await t.commit();
    
    res.status(201).json({
      message: 'Pielikumi veiksmīgi augšupielādēti',
      attachments
    });
  } catch (error) {
    await t.rollback();
    console.error('Error uploading attachments:', error);
    res.status(500).json({ message: 'Servera kļūda augšupielādējot pielikumus' });
  }
};

// Get all attachments for a question
exports.getAttachmentsByQuestionId = async (req, res) => {
  try {
    const questionId = req.params.questionId;
    
    const attachments = await Attachment.findAll({
      where: { questionId },
      include: [
        {
          model: User,
          attributes: ['id', 'username']
        }
      ],
      order: [['createdAt', 'ASC']]
    });
    
    res.json(attachments);
  } catch (error) {
    console.error('Error fetching attachments:', error);
    res.status(500).json({ message: 'Servera kļūda iegūstot pielikumus' });
  }
};

// Get a specific attachment
exports.getAttachment = async (req, res) => {
  try {
    const attachmentId = req.params.id;
    
    const attachment = await Attachment.findByPk(attachmentId, {
      include: [
        {
          model: User,
          attributes: ['id', 'username']
        },
        {
          model: Question,
          attributes: ['id', 'title']
        }
      ]
    });
    
    if (!attachment) {
      return res.status(404).json({ message: 'Pielikums nav atrasts' });
    }
    
    res.json(attachment);
  } catch (error) {
    console.error('Error fetching attachment:', error);
    res.status(500).json({ message: 'Servera kļūda iegūstot pielikumu' });
  }
};

// Download an attachment
exports.downloadAttachment = async (req, res) => {
  try {
    const attachmentId = req.params.id;
    
    const attachment = await Attachment.findByPk(attachmentId);
    
    if (!attachment) {
      return res.status(404).json({ message: 'Pielikums nav atrasts' });
    }
    
    // Check if file exists
    if (!fs.existsSync(attachment.path)) {
      return res.status(404).json({ message: 'Faila saturs nav atrasts' });
    }
    
    // Set appropriate headers based on mimetype
    res.setHeader('Content-Type', attachment.mimetype);
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalname}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(attachment.path);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading attachment:', error);
    res.status(500).json({ message: 'Servera kļūda lejupielādējot pielikumu' });
  }
};

// Delete an attachment
exports.deleteAttachment = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const attachmentId = req.params.id;
    const userId = req.user.id;
    
    const attachment = await Attachment.findByPk(attachmentId, {
      include: [
        {
          model: Question,
          attributes: ['userId']
        }
      ]
    });
    
    if (!attachment) {
      await t.rollback();
      return res.status(404).json({ message: 'Pielikums nav atrasts' });
    }
    
    // Check if user is the attachment creator or admin
    if (attachment.userId !== userId && 
        attachment.Question.userId !== userId && 
        req.user.role !== 'admin') {
      await t.rollback();
      return res.status(403).json({ message: 'Jums nav tiesību dzēst šo pielikumu' });
    }
    
    // Delete file from filesystem
    if (fs.existsSync(attachment.path)) {
      fs.unlinkSync(attachment.path);
    }
    
    // Delete attachment record
    await attachment.destroy({ transaction: t });
    
    await t.commit();
    
    res.json({
      message: 'Pielikums veiksmīgi dzēsts',
      attachmentId
    });
  } catch (error) {
    await t.rollback();
    console.error('Error deleting attachment:', error);
    res.status(500).json({ message: 'Servera kļūda dzēšot pielikumu' });
  }
};
// profan-server/controllers/tagApplicationController.js
const fs = require('fs');
const path = require('path');
const { TagApplication, User, Tag, ProfessionalProfile, sequelize, Notification } = require('../models');
const { Op } = require('sequelize');

// Saglabāt augšupielādēto PDF failu
const saveDocument = (file, userId, tagId) => {
  // Izveidot mapi, ja tā neeksistē
  const uploadDir = path.join(__dirname, '../uploads/tag-applications');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Saglabāt failu ar unikālu nosaukumu
  const timestamp = Date.now();
  const fileName = `user_${userId}_tag_${tagId}_${timestamp}.pdf`;
  const filePath = path.join(uploadDir, fileName);
  
  fs.writeFileSync(filePath, file.data);
  
  return filePath;
};

// Iesniegt jaunu taga pieteikumu
// Iegūt lietotāja pieteikumus
exports.getUserApplications = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const applications = await TagApplication.findAll({
      where: { userId },
      include: [
        {
          model: Tag,
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(applications);
  } catch (error) {
    console.error('Error fetching user tag applications:', error);
    res.status(500).json({ message: 'Servera kļūda iegūstot pieteikumus' });
  }
};

// Iegūt visus pieteikumus (administratoriem)
exports.getAllApplications = async (req, res) => {
  try {
    const { status } = req.query;
    
    const whereClause = {};
    if (status && status !== 'all') {
      whereClause.status = status;
    }
    
    const applications = await TagApplication.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'profileImage']
        },
        {
          model: Tag,
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'Reviewer',
          attributes: ['id', 'username'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(applications);
  } catch (error) {
    console.error('Error fetching all tag applications:', error);
    res.status(500).json({ message: 'Servera kļūda iegūstot pieteikumus' });
  }
};

// Iegūt pieteikuma PDF failu
exports.getApplicationDocument = async (req, res) => {
  try {
    const applicationId = req.params.id;
    
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
  } catch (error) {
    console.error('Error fetching application document:', error);
    res.status(500).json({ message: 'Servera kļūda iegūstot dokumentu' });
  }
};

// Izskatīt pieteikumu (apstiprināt vai noraidīt)
exports.reviewApplication = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const applicationId = req.params.id;
    const adminId = req.user.id;
    const { status, notes } = req.body;
    
    // Pārbaudīt statusa vērtību
    if (status !== 'approved' && status !== 'rejected') {
      await t.rollback();
      return res.status(400).json({ message: 'Nederīgs statuss. Atļautās vērtības ir "approved" vai "rejected"' });
    }
    
    // Atrast pieteikumu
    const application = await TagApplication.findByPk(applicationId, {
      include: [
        {
          model: User,
          attributes: ['id', 'username']
        },
        {
          model: Tag,
          attributes: ['id', 'name']
        }
      ]
    });
    
    if (!application) {
      await t.rollback();
      return res.status(404).json({ message: 'Pieteikums nav atrasts' });
    }
    
    // Pārbaudīt vai pieteikums jau ir izskatīts
    if (application.status !== 'pending') {
      await t.rollback();
      return res.status(400).json({ message: 'Šis pieteikums jau ir izskatīts' });
    }
    
    // Atjaunināt pieteikumu
    await application.update({
      status,
      reviewedAt: new Date(),
      reviewedBy: adminId,
      notes: notes || null
    }, { transaction: t });
    
    // Ja pieteikums ir apstiprināts, pievienot tagu lietotāja profilam
    if (status === 'approved') {
      let professionalProfile = await ProfessionalProfile.findOne({
        where: { userId: application.userId }
      });
      
      if (!professionalProfile) {
        professionalProfile = await ProfessionalProfile.create({
          userId: application.userId
        }, { transaction: t });
      }
      
      // Pievienot tagu
      await professionalProfile.addTag(application.tagId, { transaction: t });
    }
    
    // Izveidot paziņojumu lietotājam
    await Notification.create({
      userId: application.userId,
      content: status === 'approved' 
        ? `Jūsu pieteikums tagam "${application.Tag.name}" ir apstiprināts!` 
        : `Jūsu pieteikums tagam "${application.Tag.name}" ir noraidīts.`,
      type: 'system',
      isRead: false
    }, { transaction: t });
    
    await t.commit();
    
    res.json({
      message: status === 'approved' 
        ? 'Pieteikums veiksmīgi apstiprināts' 
        : 'Pieteikums veiksmīgi noraidīts',
      application
    });
  } catch (error) {
    await t.rollback();
    console.error('Error reviewing tag application:', error);
    res.status(500).json({ message: 'Servera kļūda izskatot pieteikumu' });
  }
};

// Iesniegt jaunu taga pieteikumu
exports.submitApplication = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const userId = req.user.id;
    const { tagId } = req.body;
    
    // Pārbaudīt vai tagId ir norādīts
    if (!tagId) {
      await t.rollback();
      return res.status(400).json({ message: 'Nav norādīts tags' });
    }
    
    // Pārbaudīt vai tags eksistē
    const tag = await Tag.findByPk(tagId);
    if (!tag) {
      await t.rollback();
      return res.status(404).json({ message: 'Tags nav atrasts' });
    }
    
    // Pārbaudīt vai ir pievienots fails
    if (!req.files || !req.files.document) {
      await t.rollback();
      return res.status(400).json({ message: 'Nav pievienots dokuments' });
    }
    
    const documentFile = req.files.document;
    
    // Pārbaudīt faila tipu (tikai PDF)
    if (documentFile.mimetype !== 'application/pdf') {
      await t.rollback();
      return res.status(400).json({ message: 'Dokuments jābūt PDF formātā' });
    }
    
    // Pārbaudīt vai lietotājam jau ir šis tags
    const professionalProfile = await ProfessionalProfile.findOne({
      where: { userId },
      include: [{
        model: Tag,
        where: { id: tagId },
        required: false
      }]
    });
    
    if (professionalProfile && professionalProfile.Tags && professionalProfile.Tags.length > 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Jums jau ir šis profesionālais tags' });
    }
    
    // Pārbaudīt vai lietotājam jau ir aktīvs pieteikums šim tagam
    const existingApplication = await TagApplication.findOne({
      where: {
        userId,
        tagId,
        status: 'pending'
      }
    });
    
    if (existingApplication) {
      await t.rollback();
      return res.status(400).json({ message: 'Jums jau ir aktīvs pieteikums šim tagam' });
    }
    
    // Saglabāt failu
    const filePath = saveDocument(documentFile, userId, tagId);
    
    // Izveidot pieteikumu
    await TagApplication.create({
      userId,
      tagId,
      documentPath: filePath,
      status: 'pending'
    }, { transaction: t });
    
    await t.commit();
    
    res.status(201).json({
      message: 'Pieteikums veiksmīgi iesniegts un gaida apstiprinājumu'
    });
  } catch (error) {
    await t.rollback();
    console.error('Error creating tag application:', error);
    res.status(500).json({ message: 'Servera kļūda iesniedzot pieteikumu' });
  }
};
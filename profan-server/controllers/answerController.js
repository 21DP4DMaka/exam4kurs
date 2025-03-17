const { Answer, Question, User, Tag, ProfessionalProfile, Notification, sequelize } = require('../models');
const { Op } = require('sequelize');

// Izveidot jaunu atbildi - UPDATED to check for matching tags
exports.createAnswer = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { questionId, content } = req.body;
    const userId = req.user.id;
    
    // Pārbaudīt vai jautājums eksistē
    const question = await Question.findByPk(questionId, {
      include: [
        {
          model: Tag,
          through: { attributes: [] }
        }
      ]
    });
    
    if (!question) {
      await t.rollback();
      return res.status(404).json({ message: 'Jautājums nav atrasts' });
    }
    
    // Pārbaudīt, vai lietotājs ir profesionālis vai administrators
    if (req.user.role !== 'power' && req.user.role !== 'admin') {
      await t.rollback();
      return res.status(403).json({ message: 'Tikai profesionāļi var atbildēt uz jautājumiem' });
    }
    
    // Iegūt lietotāja profesionālo profilu un tagus
    const userProfile = await ProfessionalProfile.findOne({
      where: { userId },
      include: [{
        model: Tag
      }]
    });
    
    if (!userProfile) {
      await t.rollback();
      return res.status(403).json({ message: 'Jums nav profesionālā profila' });
    }
    
    // Pārbaudīt, vai lietotājam ir kāds no jautājuma tagiem
    const questionTagIds = question.Tags.map(tag => tag.id);
    const userTagIds = userProfile.Tags.map(tag => tag.id);
    
    const hasMatchingTag = questionTagIds.some(tagId => userTagIds.includes(tagId));
    
    if (!hasMatchingTag) {
      await t.rollback();
      return res.status(403).json({ message: 'Jums nav atbilstošo kategoriju, lai atbildētu uz šo jautājumu' });
    }
    
    // Izveidot jaunu atbildi
    const answer = await Answer.create({
      questionId,
      userId,
      content
    }, { transaction: t });
    
    // Atjaunināt jautājuma statusu, ja tas ir 'open'
    if (question.status === 'open') {
      await question.update({ status: 'answered' }, { transaction: t });
    }
    
    // Izveidot paziņojumu jautājuma autoram
    if (question.userId !== userId) {
      await Notification.create({
        userId: question.userId,
        content: `Jūsu jautājumam "${question.title.substring(0, 50)}..." ir jauna atbilde.`,
        type: 'answer',
        relatedQuestionId: questionId,
        isRead: false
      }, { transaction: t });
    }
    
    await t.commit();
    
    // Atgriežam izveidoto atbildi ar lietotāja datiem
    const newAnswer = await Answer.findByPk(answer.id, {
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'profileImage', 'role']
        }
      ]
    });
    
    res.status(201).json({
      message: 'Atbilde veiksmīgi izveidota',
      answer: newAnswer
    });
  } catch (error) {
    await t.rollback();
    console.error('Error creating answer:', error);
    res.status(500).json({ message: 'Servera kļūda izveidojot atbildi' });
  }
};

// Atzīmēt atbildi kā pieņemtu
exports.acceptAnswer = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const answerId = req.params.id;
    const userId = req.user.id;
    
    // Atrast atbildi
    const answer = await Answer.findByPk(answerId, {
      include: [
        {
          model: Question
        }
      ]
    });
    
    if (!answer) {
      await t.rollback();
      return res.status(404).json({ message: 'Atbilde nav atrasta' });
    }
    
    // Pārbaudīt vai lietotājs ir jautājuma autors
    if (answer.Question.userId !== userId) {
      await t.rollback();
      return res.status(403).json({ message: 'Tikai jautājuma autors var pieņemt atbildi' });
    }
    
    // Noņemt acceptēšanu no pašreizējās pieņemtās atbildes, ja tāda ir
    await Answer.update(
      { isAccepted: false },
      { 
        where: { 
          questionId: answer.questionId,
          isAccepted: true
        },
        transaction: t
      }
    );
    
    // Atzīmēt atbildi kā pieņemtu
    await answer.update({ isAccepted: true }, { transaction: t });
    
    // Atjaunināt jautājuma statusu
    await answer.Question.update({ status: 'closed' }, { transaction: t });
    
    // Izveidot paziņojumu atbildes autoram
    if (answer.userId !== userId) {
      await Notification.create({
        userId: answer.userId,
        content: `Jūsu atbilde jautājumam "${answer.Question.title.substring(0, 50)}..." ir pieņemta kā risinājums!`,
        type: 'acceptance',
        relatedQuestionId: answer.questionId,
        isRead: false
      }, { transaction: t });
    }
    
    await t.commit();
    
    res.json({
      message: 'Atbilde veiksmīgi pieņemta kā risinājums',
      answerId: answer.id
    });
  } catch (error) {
    await t.rollback();
    console.error('Error accepting answer:', error);
    res.status(500).json({ message: 'Servera kļūda pieņemot atbildi' });
  }
};
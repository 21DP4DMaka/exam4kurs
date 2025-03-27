const { Comment, User, Answer, Question, Notification, sequelize } = require('../models');
const { Op } = require('sequelize');

// Get comments for an answer - Fixed to include proper author IDs
exports.getCommentsByAnswerId = async (req, res) => {
  try {
    const answerId = req.params.answerId;
    console.log(`Getting comments for answerId: ${answerId}`);
    
    // Validate that answerId exists and is a number
    if (!answerId || isNaN(parseInt(answerId))) {
      return res.status(400).json({ message: 'Atbilde ID ir obligāts un jābūt skaitlim' });
    }
    
    // Find the answer to get question and user info
    const answer = await Answer.findByPk(answerId, {
      include: [
        {
          model: Question,
          attributes: ['id', 'userId'],
          required: true
        },
        {
          model: User,
          attributes: ['id']
        }
      ]
    });
    
    if (!answer) {
      console.log(`Answer not found for ID: ${answerId}`);
      return res.status(404).json({ message: 'Atbilde nav atrasta' });
    }
    
    console.log('Found answer:', {
      id: answer.id,
      questionId: answer.Question.id,
      questionAuthorId: answer.Question.userId,
      answerAuthorId: answer.userId
    });
    
    // Get all comments for this answer
    const comments = await Comment.findAll({
      where: { answerId },
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'profileImage', 'role']
        }
      ],
      order: [['createdAt', 'ASC']]
    });
    
    console.log(`Found ${comments.length} comments`);
    
    // Explicitly set these values in the response
    const responseData = {
      comments,
      questionAuthorId: answer.Question.userId,
      answerAuthorId: answer.userId
    };
    
    res.json(responseData);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Servera kļūda iegūstot komentārus' });
  }
};

// Create a new comment - Fixed to properly check permissions
exports.createComment = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { answerId, questionId, content } = req.body;
    
    // ИСПРАВЛЕНИЕ: Проверка существования req.user
    if (!req.user || !req.user.id) {
      await t.rollback();
      return res.status(401).json({ message: 'Lietotājs nav autorizēts' });
    }
    
    const userId = req.user.id;
    
    console.log('Creating comment with data:', { answerId, questionId, userId, contentLength: content?.length });
    
    // Validate required fields
    if (!answerId || !questionId || !content || !content.trim()) {
      await t.rollback();
      return res.status(400).json({ message: 'Atbildes ID, jautājuma ID un komentāra saturs ir obligāts' });
    }
    
    // Check if answer exists
    const answer = await Answer.findByPk(answerId, {
      include: [
        {
          model: Question,
          where: { id: questionId },
          required: true
        }
      ]
    });
    
    if (!answer) {
      await t.rollback();
      return res.status(404).json({ message: 'Atbilde vai jautājums nav atrasts' });
    }
    
    // ИСПРАВЛЕНИЕ: Проверка на null значения перед использованием
    const questionAuthorId = answer.Question ? answer.Question.userId : null;
    const answerAuthorId = answer.userId;
    
    // Log permission check information
    console.log('Permission check:', {
      userId,
      questionAuthorId,
      answerAuthorId,
      isQuestionAuthor: questionAuthorId !== null && userId === questionAuthorId,
      isAnswerAuthor: answerAuthorId !== null && userId === answerAuthorId
    });
    
    // Convert IDs to numbers for comparison
    const currentUserId = parseInt(userId);
    const qAuthorId = questionAuthorId !== null ? parseInt(questionAuthorId) : null;
    const aAuthorId = answerAuthorId !== null ? parseInt(answerAuthorId) : null;
    
    // Only question author and answer author can comment
    if ((qAuthorId === null || currentUserId !== qAuthorId) && 
        (aAuthorId === null || currentUserId !== aAuthorId)) {
      await t.rollback();
      return res.status(403).json({ 
        message: 'Tikai jautājuma autors vai atbildes autors var pievienot komentārus' 
      });
    }
    
    // Create comment
    const comment = await Comment.create({
      answerId,
      questionId,
      userId,
      content
    }, { transaction: t });
    
    // Create a notification for the recipient
    // ИСПРАВЛЕНИЕ: Проверка, чтобы избежать undefined
    if (answer.userId && questionAuthorId) {
      const recipientId = currentUserId === answer.userId ? questionAuthorId : answer.userId;
      
      // ИСПРАВЛЕНИЕ: Проверка username
      const username = req.user.username || 'Lietotājs';
      const questionTitle = answer.Question && answer.Question.title 
        ? answer.Question.title.substring(0, 50)
        : 'jautājumu';
      
      await Notification.create({
        userId: recipientId,
        content: `Jauns komentārs no ${username} uz jautājumu "${questionTitle}..."`,
        type: 'comment',
        relatedQuestionId: questionId,
        isRead: false
      }, { transaction: t });
    }
    
    await t.commit();
    
    // Fetch the created comment with user info
    const newComment = await Comment.findByPk(comment.id, {
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'profileImage', 'role']
        }
      ]
    });
    
    res.status(201).json({
      message: 'Komentārs veiksmīgi pievienots',
      comment: newComment
    });
  } catch (error) {
    await t.rollback();
    console.error('Error creating comment:', error);
    res.status(500).json({ message: 'Servera kļūda izveidojot komentāru' });
  }
};

// Rest of the controller code remains the same...
// Update a comment (only the creator can update)
exports.updateComment = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const commentId = req.params.id;
    const { content } = req.body;
    const userId = req.user.id;
    
    if (!content || !content.trim()) {
      await t.rollback();
      return res.status(400).json({ message: 'Komentāra saturs ir obligāts' });
    }
    
    // Find the comment
    const comment = await Comment.findByPk(commentId);
    
    if (!comment) {
      await t.rollback();
      return res.status(404).json({ message: 'Komentārs nav atrasts' });
    }
    
    // Check if user is the creator
    if (comment.userId !== userId) {
      await t.rollback();
      return res.status(403).json({ message: 'Jūs varat rediģēt tikai savus komentārus' });
    }
    
    // Update comment
    await comment.update({ content }, { transaction: t });
    
    await t.commit();
    
    res.json({
      message: 'Komentārs veiksmīgi atjaunināts',
      comment
    });
  } catch (error) {
    await t.rollback();
    console.error('Error updating comment:', error);
    res.status(500).json({ message: 'Servera kļūda atjauninot komentāru' });
  }
};

// Delete a comment (owner or admin can delete)
exports.deleteComment = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const commentId = req.params.id;
    const userId = req.user.id;
    
    // Find the comment
    const comment = await Comment.findByPk(commentId);
    
    if (!comment) {
      await t.rollback();
      return res.status(404).json({ message: 'Komentārs nav atrasts' });
    }
    
    // Check if user is the creator or admin
    if (comment.userId !== userId && req.user.role !== 'admin') {
      await t.rollback();
      return res.status(403).json({ message: 'Jums nav tiesību dzēst šo komentāru' });
    }
    
    // Delete comment
    await comment.destroy({ transaction: t });
    
    await t.commit();
    
    res.json({  
      message: 'Komentārs veiksmīgi dzēsts',
      commentId
    });
  } catch (error) {
    await t.rollback();
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Servera kļūda dzēšot komentāru' });
  }
};
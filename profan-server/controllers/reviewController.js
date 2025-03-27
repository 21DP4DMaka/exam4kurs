
const { Review, User, Question, sequelize } = require('../models');
const { Op } = require('sequelize');

// Get reviews for a user
exports.getUserReviews = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Find all reviews for the user, now including the associated question
    const reviews = await Review.findAll({
      where: { userId },
      include: [
        {
          model: User,
          as: 'Reviewer',
          attributes: ['id', 'username', 'profileImage', 'role']
        },
        {
          model: Question,
          attributes: ['id', 'title']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    // Calculate average rating
    let averageRating = 0;
    if (reviews.length > 0) {
      const sum = reviews.reduce((total, review) => total + review.rating, 0);
      averageRating = sum / reviews.length;
    }
    
    res.json({
      reviews,
      averageRating,
      totalReviews: reviews.length
    });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ message: 'Servera kļūda iegūstot atsauksmes' });
  }
};

// Create a new review - updated to require questionId and check for existing reviews
exports.createReview = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { rating, comment, questionId } = req.body;
    const userId = req.params.userId; // User being reviewed
    const reviewerId = req.user.id; // User creating the review
    
    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      await t.rollback();
      return res.status(400).json({ message: 'Vērtējumam jābūt no 1 līdz 5' });
    }
    
    if (!comment || comment.trim() === '') {
      await t.rollback();
      return res.status(400).json({ message: 'Komentārs ir obligāts' });
    }

    if (!questionId) {
      await t.rollback();
      return res.status(400).json({ message: 'Jautājuma ID ir obligāts' });
    }
    
    // Check if user exists
    const targetUser = await User.findByPk(userId);
    if (!targetUser) {
      await t.rollback();
      return res.status(404).json({ message: 'Lietotājs nav atrasts' });
    }
    
    // Prevent self-reviews
    if (userId === reviewerId) {
      await t.rollback();
      return res.status(400).json({ message: 'Nevar vērtēt pats sevi' });
    }

    // Verify the question exists
    const question = await Question.findByPk(questionId);
    if (!question) {
      await t.rollback();
      return res.status(404).json({ message: 'Jautājums nav atrasts' });
    }

    // Verify the reviewer is the question author
    if (question.userId !== reviewerId) {
      await t.rollback();
      return res.status(403).json({ message: 'Tikai jautājuma autors var atstāt atsauksmi' });
    }
    
    // Check if user already left a review for this user for this question
    const existingReview = await Review.findOne({
      where: {
        userId,
        reviewerId,
        questionId
      }
    });
    
    if (existingReview) {
      // Update existing review
      await existingReview.update({
        rating,
        comment
      }, { transaction: t });
      
      await t.commit();
      
      // Calculate new average rating
      const allReviews = await Review.findAll({
        where: { userId }
      });
      
      let averageRating = 0;
      if (allReviews.length > 0) {
        const sum = allReviews.reduce((total, review) => total + review.rating, 0);
        averageRating = sum / allReviews.length;
      }
      
      // Get the updated review with reviewer info
      const updatedReview = await Review.findByPk(existingReview.id, {
        include: [
          {
            model: User,
            as: 'Reviewer',
            attributes: ['id', 'username', 'profileImage', 'role']
          },
          {
            model: Question,
            attributes: ['id', 'title']
          }
        ]
      });
      
      return res.json({
        message: 'Atsauksme veiksmīgi atjaunināta',
        review: updatedReview,
        averageRating
      });
    }
    
    // Create new review
    const review = await Review.create({
      userId,
      reviewerId,
      questionId,
      rating,
      comment
    }, { transaction: t });
    
    await t.commit();
    
    // Calculate new average rating
    const allReviews = await Review.findAll({
      where: { userId }
    });
    
    let averageRating = 0;
    if (allReviews.length > 0) {
      const sum = allReviews.reduce((total, review) => total + review.rating, 0);
      averageRating = sum / allReviews.length;
    }
    
    // Get the newly created review with reviewer info
    const newReview = await Review.findByPk(review.id, {
      include: [
        {
          model: User,
          as: 'Reviewer',
          attributes: ['id', 'username', 'profileImage', 'role']
        },
        {
          model: Question,
          attributes: ['id', 'title']
        }
      ]
    });
    
    res.status(201).json({
      message: 'Atsauksme veiksmīgi pievienota',
      review: newReview,
      averageRating
    });
  } catch (error) {
    await t.rollback();
    console.error('Error creating review:', error);
    res.status(500).json({ message: 'Servera kļūda veidojot atsauksmi' });
  }
};

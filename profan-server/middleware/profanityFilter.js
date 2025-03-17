// profan-server/middleware/profanityFilter.js

// Simple profanity filter middleware
const profanityFilter = (req, res, next) => {
    // List of words to filter
    const profanityList = [
      'badword1', 
      'badword2', 
      'badword3'
      // Add more words as needed
    ];
  
    // Function to check content for profanity
    const containsProfanity = (text) => {
      if (!text) return false;
      
      const lowerText = text.toLowerCase();
      return profanityList.some(word => lowerText.includes(word.toLowerCase()));
    };
  
    // Check request body fields for profanity
    if (req.body) {
      // Check title if present
      if (req.body.title && containsProfanity(req.body.title)) {
        return res.status(400).json({ 
          message: 'Saturs satur nepiemērotu valodu. Lūdzu, pārskatiet savu tekstu.' 
        });
      }
      
      // Check content if present
      if (req.body.content && containsProfanity(req.body.content)) {
        return res.status(400).json({ 
          message: 'Saturs satur nepiemērotu valodu. Lūdzu, pārskatiet savu tekstu.' 
        });
      }
    }
    
    // If no profanity found, continue to the next middleware/controller
    next();
  };
  
  module.exports = profanityFilter;
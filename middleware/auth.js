const jwt = require('jsonwebtoken')

const verifyToken = async (req, res, next) => {
  // console.log("auhto-----",req.headers.authorization)
  // console.log("Aitho-----",req.headers.Authorization)
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Invalid or missing Authorization header' });
  }

  const token = authorizationHeader.split(' ')[1];

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decodedToken.user; 
    next(); 
  } catch (error) {
    return res.status(401).json({ message: error.message });
  }  
};



module.exports = verifyToken; 
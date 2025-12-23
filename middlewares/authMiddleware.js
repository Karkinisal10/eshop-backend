const jwt = require('jsonwebtoken');

module.exports.authMiddleware = async(req, res, next) =>{
    const { accessToken, customerToken } = req.cookies || {}
    // Fallback to Authorization header (Bearer <token>) for SPA clients using localStorage
    const authHeader = req.headers?.authorization || req.headers?.Authorization
    let token = accessToken || customerToken
    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7)
    }

    if (!token) {
        return res.status(409).json({ error : 'Please Login First'})
    }

    try {
        const deCodeToken = await jwt.verify(token, process.env.SECRET)
        req.role = deCodeToken.role
        req.id = deCodeToken.id
        next()
    } catch (error) {
        return res.status(409).json({ error : 'Please Login'})
    }
}
const jwt = require('jsonwebtoken')
module.exports.createToken = async(data) => {
    console.log('Creating token with data:', data)
    const token = await jwt.sign(data,process.env.SECRET,{
        expiresIn : '7d' })
    console.log('Token created successfully')
    return token
}
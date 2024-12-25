const app = require('./app')
const dotenv = require('dotenv')
const cloudinary = require('cloudinary')

const connectToDatabase = require('./config/database')

dotenv.config()

connectToDatabase();
//ajay2

cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLIENT_NAME,
    api_key: process.env.CLOUDINARY_CLIENT_API,
    api_secret: process.env.CLOUDINARY_CLIENT_SECRET
})

app.listen(process.env.PORT,()=>{
    console.log(`server is running on ${process.env.PORT}`)
})
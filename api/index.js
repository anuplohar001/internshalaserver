import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import User from '../models/user.js'
import multer from 'multer'
import bodyParser from 'body-parser'
import { configDotenv } from 'dotenv';
import {GetObjectCommand, PutObjectCommand, S3Client} from "@aws-sdk/client-s3"
import {getSignedUrl} from '@aws-sdk/s3-request-presigner'
import crypto from 'crypto'


configDotenv();
const generateRandom = (bytes = 16) => crypto.randomBytes(bytes).toString('hex')
const bucketName = process.env.BUCKET_NAME
const bucketRegion = process.env.BUCKET_REGION
const accessKey = process.env.ACCESS_KEY
const secretAccessKey = process.env.SECRET_ACCESS_KEY
const app = express();

const s3Client = new S3Client({
    credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretAccessKey,
    },
    region: bucketRegion
})

const corsOptions = {
    origin: ['http://localhost:3000', 'https://socialmedia221.netlify.app'],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD"]
};

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

const uploadAWS = (fileBuffer, name, mimetype) => {
    const uploadParam = {
        Bucket: bucketName,
        Body: fileBuffer,
        Key: name,
        ContentType: mimetype
    }
    return s3Client.send(new PutObjectCommand(uploadParam))
}

const getAws = async (key) => {
    const imageparam = {
        Bucket: bucketName,
        Key: key
    }
    const command = new GetObjectCommand(imageparam);
    const url = await getSignedUrl(s3Client, command);
    return url
}

app.use(bodyParser.json());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors(corsOptions))
app.get('/', (req, res) => {
    res.send("Welcome to server ")
})
mongoose.connect(process.env.MONGODB_URI).then(() => {
    console.log("Successfully connected")
});

app.post('/userdetails', upload.array('images'), async (req, res) => {
    
    const data = req.body
    const files = req.files
    const socialhandle = data.socialhandle.toLowerCase();

    const imagesFile = files.map(file => ({
        username: data.username,
        filename: generateRandom(),
        fileBuffer: file.buffer,
        mimetype : file.mimetype
    }));

    

    try {

        for (let i = 0; i < imagesFile.length; i++) {
            const element = imagesFile[i];
            await uploadAWS(element.fileBuffer, element.filename, element.mimetype)       
            const newuser = await User.findOneAndUpdate(
                { username: data.username }, 
                { $push: { images: { ctype: element.mimetype, filename: element.filename, socialhandle: data.socialhandle } } },
                { new: true, upsert: true }
            )
        }
        
        const user = await User.findOne({ username: data.username });
        const exists = user.socialhandles.some(handle => handle.name === socialhandle);
        
        if (!exists) {
            // console.log(data)
            const newuser = await User.findOneAndUpdate(
                { username: data.username },
                { $push: { socialhandles: { name: socialhandle } } }
            )
        }
        
        return res.status(200).send({ message: "Successful" })
    } catch (error) {
        return res.status(500).send({message:"Something went wrong"})
    }

  
})


app.get('/getusers', async (req, res) => {
    try {
        const users = await User.find({})
        for(let user of users) {
            for(let img of user.images) {
                img.url = await getAws(img.filename)
            }
        }
        return res.status(200).send({users})
    } catch (error) {
        return res.status(500).send({ message: "Something went wrong" })
    }
})

export default app

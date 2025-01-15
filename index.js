import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import User from './models/user.js'
import multer from 'multer'
import bodyParser from 'body-parser'
const app = express();
const MONGODB_URI = "mongodb+srv://anuplohar001:anup220803@anup-db.5z6a8tl.mongodb.net/demodb?retryWrites=true&w=majority&appName=Anup-DB"
const port = 5000
const corsOptions = {
    origin: 'http://localhost:3000',
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD"]
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    },
});
const upload = multer({ storage: storage });

app.use(bodyParser.json());
app.use(express.json())
app.use(cors(corsOptions))
app.get('/', (req, res) => {
    res.send("Welcome to server ")
})
mongoose.connect(MONGODB_URI).then(() => {
    console.log("Successfully connected")
});

app.post('/userdetails', upload.array('images'), async (req, res) => {
    
    const data = req.body
    const files = req.files
    const socialhandle = data.socialhandle.toLowerCase();
    const imagesFile = files.map(file => ({
        username: data.username,
        filename: file.originalname,
        path: file.path
    }));

    try {

        for (let i = 0; i < imagesFile.length; i++) {
            const element = imagesFile[i];       
            const newuser = await User.findOneAndUpdate(
                { username: element.username }, 
                { $push: { images: { path: element.path, filename: element.filename, socialhandle: data.socialhandle } } },
                { new: true, upsert: true }
            )
        }
        
        const user = await User.findOne({ username: data.username });
        const exists = user.socialhandles.some(handle => handle.name === socialhandle);
        
        if (!exists) {
            console.log(data)
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


app.get('/userimages/:username', async (req, res) => {
    const username = req.params.username
    console.log(username)
})

app.get('/getusers', async (req, res) => {
    try {
        const users = await User.find({})
        return res.status(200).send({users})
    } catch (error) {
        return res.status(500).send({ message: "Something went wrong" })
    }
})


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
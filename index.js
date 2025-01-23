//3W CHATT APP BACKEND

import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import bodyParser from 'body-parser'
import { configDotenv } from 'dotenv';
import http from "http";
import { Server } from "socket.io";
import Messages from './models/message.js';
import User from './models/user.js';
import moment from 'moment-timezone'
import GroupMembers from './models/group.js';

configDotenv();
const app = express();
 
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000"],
        methods: "GET, POST, PUT, DELETE, PATCH, HEAD",
    }
});

const handleLiveUser = async (data) => {
    const liveUser = (data.liveUser)
    await User.findOneAndUpdate({ liveUser }, { $pull: { liveUser: data.liveUser } })
    await GroupMembers.findOneAndUpdate({ liveMembers: liveUser }, { $pull: { liveMembers: data.liveUser } })
}

const handleFinalUpdate = async () => {
    const users = await User.find().populate('liveUser')
    const groups = await GroupMembers.find().populate('liveMembers')
    const data = {users, groups}
    return data
}

const handleMessage = async (message, isUser) => {
    await message.save();
    const newMessage = await message.populate('from')
    if(isUser)
        await newMessage.populate('to')
    else
        await newMessage.populate('toGroup')
    io.emit('receiveMessage', newMessage);
}

io.on('connection', (socket) => {

    socket.on('connect', async () => {
        console.log("Client connected", socket.id)
    })

    socket.on('sendMessage', async (data) => {
        const date = new Date();
        const istTime = moment.utc(date).tz("Asia/Kolkata").format("YYYY-MM-DD hh:mm:ss");
        if(data.isUser){
            const message = await Messages.create({ from: data.from, to: data.to, content: data.content, date: istTime });
            await handleMessage(message, data.isUser)
        } else {
            const message = await Messages.create({ from: data.from, toGroup: data.to, content: data.content, date: istTime });
            await handleMessage(message, data.isUser)
        }
        
    });

    socket.on('online-user', async (data)=>{
        await handleLiveUser(data)
        await User.findOneAndUpdate({_id: data.userOrGrp._id}, {
            $push: {
                liveUser: (data.liveUser)
            }
        }, {new : true})
        const finalData = await handleFinalUpdate()
        io.emit('updated-users', finalData)
    })

    socket.on('chattroom-user', async (data) => {
        await handleLiveUser(data)
        await GroupMembers.findOneAndUpdate({ _id: data.userOrGrp._id }, {
            $push: {
                liveMembers: (data.liveUser)
            }
        }, {new : true})      

        await GroupMembers.findOneAndUpdate({ _id: data.userOrGrp._id }, { 
            $addToSet: {         
                groupMembers: data.liveUser
            } 
        }, {new : true})

        const finalData = await handleFinalUpdate()
        io.emit('updated-users', finalData)
    })

    socket.on('user-typing', (data)=>{
        io.emit('started', data)
    })

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});


app.use(bodyParser.json());
app.use(express.json());
app.use(cors({
    origin: ["http://localhost:3000"],
    methods: "GET, POST, PUT, DELETE, PATCH, HEAD"
}))



app.get('/users', async (req,res) => {
    try {
        const users = await User.find({}).populate('liveUser');
        return res.status(200).send({users})
    } catch (error) {
        return res.status(500).send({message: "Something went wrong"})
    }
})

app.post('/createuser', async (req, res) => {
    const {username, password} = req.body
    try {
        const users = await User.create({username, password});
        await users.save()
        return res.status(200).send({ message: "User Created" })
    } catch (error) {
        return res.status(500).send({ message: "Something went wrong" })
    }
})

app.get('/messages', async (req, res) => {
    try {
        const messages = await Messages.find().populate("from").populate("to").populate('toGroup') 
        
        return res.status(200).send({messages})
    } catch (error) {
        return res.status(500).send({ message: "Something went wrong" })
    }
})

app.put('/creategroup', async (req, res) => {
    const {groupName} = req.body
    try {
        const group  = await GroupMembers.create({groupName})    
        await group.save()    
        return res.status(200).send({message:"Group created"})
    } catch (error) {
        return res.status(500).send({ message: "Something went wrong" })
    }
})

app.put('/removelive', async (req, res) => {
    try {
        const {liveUser} = req.body
        console.log(liveUser)
        await User.findOneAndUpdate({ liveUser }, { $pull: { liveUser: liveUser } })
        await GroupMembers.findOneAndUpdate({ liveMembers: liveUser }, { $pull: { liveMembers: liveUser} })
        return res.status(200).send({message : "user loged out"})
    } catch (error) {
        return res.status(500).send({message: "something went wrong"})
    }
})


app.get('/getgroups', async (req, res) => {
    try {
        const groups = await GroupMembers.find({}).populate('liveMembers')
        return res.status(200).send({groups})
    } catch (error) {
        return res.status(500).send({message: "Something went wrong"})
    }
})

app.get('/login/:username', async (req, res) => {
    const username = req.params.username
    try {
        const user = await User.findOne({username})
        return res.status(200).send({user})
    } catch (error) {
        return res.status(500).send({ message: "Something went wrong" })
    }
})




app.get('/', (req, res) => {
    res.send("Welcome to server ")
})

mongoose.connect(process.env.MONGODB_URI).then(() => {
    console.log("Successfully connected")
});

server.listen(process.env.PORT, ()=>{
    console.log("Server is Listening on PORT : ", process.env.PORT)
})

export default app

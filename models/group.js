import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
    groupName : {
        type: String
    },
    groupMembers : [{
        type: mongoose.Schema.Types.ObjectId,
        ref : "Users",    
        
    }],
    liveMembers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
    }]
})

const GroupMembers = mongoose.model.groups || mongoose.model('groups', groupSchema)
export default GroupMembers
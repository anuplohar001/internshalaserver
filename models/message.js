import mongoose from "mongoose";
import { type } from "os";

const messageSchema = new mongoose.Schema({
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'Users',
        require: true
    },

    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
    },

    toGroup : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'groups'
    },

    content: {
        type: String,
        require: true
    },

    date: {
        type: String,
        require: true
    }
})

const Messages = mongoose.model.messages || mongoose.model("messages", messageSchema)
export default Messages
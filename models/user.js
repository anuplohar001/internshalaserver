import mongoose from "mongoose";

// Define the User schema
const userSchema = new mongoose.Schema({
   
    username: {
        type: String,
        required: [true, 'Username is required !'],
    },
    password: {
        type: String,        
    },
    liveUser : [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users'
    }]
});

const User = mongoose.models.user || mongoose.model("Users", userSchema);
export default User
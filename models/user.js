import mongoose from "mongoose";

// Define the User schema
const userSchema = new mongoose.Schema({
   
    username: {
        type: String,
        required: [true, 'Username is required !'],
    },
    images: [{
        path: String,
        filename: String,
        socialhandle: String
    }],

    socialhandles: [{
        name: String
    }]
});

const User = mongoose.models.users || mongoose.model("User", userSchema);
export default User
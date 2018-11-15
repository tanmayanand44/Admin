const mongoose = require('mongoose');

const profileSchema = mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    profile_details: {
        type: String,
        required: true
    },
    commits: {
        type: Number,
        default: 0
    },
    type: {
        type: String,
        required: true
    },
    birthdate: {
        type: String,
        required: true
    }, 
    mobile: {
        type: String,
        required: true
    },
    loaction: {
        type: String,
        required: true
    },
    website: {
        type: String 
    }
});

module.exports = mongoose.model('Profile', profileSchema);
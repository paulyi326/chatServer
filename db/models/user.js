var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    // name: String,
    id: Number,
    friendIds: [Number],
    messages: {
        id : [String]
    }
});

module.exports = mongoose.model('User', userSchema);
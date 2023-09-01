const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    title: String,
    content: String,
    userId: mongoose.Schema.Types.ObjectId
});

module.exports = mongoose.model('Note', noteSchema);

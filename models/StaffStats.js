const mongoose = require('mongoose');

const staffStatsSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    username: { type: String, required: true },
    ticketsClosed: { type: Number, default: 0 },
    ticketsHandled: { type: Number, default: 0 },
    lastTicketDate: { type: Date }
});

module.exports = mongoose.model('StaffStats', staffStatsSchema);


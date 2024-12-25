const mongoose = require("mongoose");

const timetableSchema = new mongoose.Schema({
  class: {
    type: String,
    required: true,
  },
  day: {
    type: String,
    required: true,
  },
  slots: [
    {
      startTime: {
        type: String,    //(e.g., "9:00 AM")
        required: true,
      },
      endTime: {
        type: String,
        required: true,
      },
      subject: {
        type: String,
        required: true,
      },
      teacher: {
        type: String
      }
    },
  ],
});

module.exports = mongoose.model("Timetable", timetableSchema);
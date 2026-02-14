const mongoose = require("mongoose");

const LocationSchema = mongoose.Schema({
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
  },
  loc_name: {
    type: String,
    required: true,
  },
  loc_lat: {
    type: Number,
    required: true,
  },
  loc_long: {
    type: Number,
    required: true,
  },
  loc_radius: {
    type: Number,
  },
  loc_status: {
    type: Boolean,
    default: true,
  },
});

LocationSchema.index({ company_id: 1 });

module.exports = mongoose.model("attendance_location", LocationSchema);

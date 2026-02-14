const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const LeaveHolSchema = new Schema({
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
  },
  announcement_title: {
    type: String,
    required: true,
  },
  announcement_startdate: {
    type: String,
    required: true,
  },
  announcement_enddate: {
    type: String,
    required: true,
  },
  announcement_desc: {
    type: String,
  },
  announcement_depid: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Departement",
    },
  ],
  announcement_created: {
    type: String,
  },
});

LeaveHolSchema.index({ company_id: 1, announcement_startdate: 1 });

module.exports = mongoose.model("announcements", LeaveHolSchema);

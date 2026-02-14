const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const LeaveSchema = new Schema({
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  leave_name: {
    type: String,
    required: true,
  },
  leave_desc: {
    type: String,
  },
  leave_type: {
    type: String,
    enum: ["Unpaid", "Paid"],
    default: "Unpdaid",
  },
  leave_status: {
    type: Boolean,
    default: true,
  },
});

LeaveSchema.index({ company_id: 1 });

module.exports = mongoose.model("leave_setting", LeaveSchema);

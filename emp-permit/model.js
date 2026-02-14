const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const LeaveRequestSchema = new Schema({
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
  },
  emp_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employmeent",
  },
  emp_permit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "request-permision",
  },
  emp_replacement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employmeent",
  },
  emppermit_date: {
    type: String,
  },
  emppermit_reason: {
    type: String,
  },
  emppermit_status: {
    type: String,
    enum: ["Approved", "Pending", "Rejected"],
    default: "Pending",
  },
});

LeaveRequestSchema.index({ company_id: 1, emppermit_status: 1 });
LeaveRequestSchema.index({ emp_id: 1 });

module.exports = mongoose.model("emp-permit", LeaveRequestSchema);

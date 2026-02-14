const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const LeaveHolSchema = new Schema({
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
  },
  leavehol_startdate: {
    type: String,
    required: true,
  },
  leavehol_enddate: {
    type: String,
    required: true,
  },
  leavehol_desc: {
    type: String,
    required: true,
  },
  leavehol_type: {
    type: String,
    required: true,
  },
  leavehol_cutleave: {
    type: Boolean,
    default: false,
  },
  leavehol_depid: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Departement",
    },
  ],
  leavehol_status: {
    type: String,
    enum: ["Aktif", "Tidak Aktif"],
    default: "Aktif",
  },
});

LeaveHolSchema.index({ company_id: 1, leavehol_status: 1 });

module.exports = mongoose.model("leave_hol", LeaveHolSchema);

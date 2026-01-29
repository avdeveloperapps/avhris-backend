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
  empleave_type_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "leave_setting",
  },
  empleave_leave_type: {
    type: String,
    required: true,
  },
  empleave_start_date: {
    type: String,
  },
  empleave_end_date: {
    type: String,
  },
  empleave_start_hours: {
    type: String,
  },
  empleave_end_hours: {
    type: String,
  },
  empleave_leave_duration: {
    type: String,
  },
  empleave_apply_date: {
    type: String,
  },
  empleave_reason: {
    type: String,
  },
  empleave_attachement: [
    {
      type: String,
    },
  ],
  empleave_status: {
    type: String,
    enum: ["Approved", "Pending", "Rejected"],
    default: "Pending",
  },
  empleave_fsuperior: {
    fsuperior_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Designation",
    },
    status: {
      type: String,
      enum: ["Approved", "Rejected", "Not Approved", "Pending"],
      default: "Pending",
    },
    approved_by: {
      type: String,
    },
    approved_date: {
      type: String,
    },
    approved_hours: {
      type: String,
    },
  },
  empleave_ssuperior: {
    ssuperior_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Designation",
    },
    status: {
      type: String,
      enum: ["Approved", "Rejected", "Not Approved", "Pending"],
      default: "Pending",
    },
    approved_by: {
      type: String,
    },
    approved_date: {
      type: String,
    },
    approved_hours: {
      type: String,
    },
  },
  empleave_hr: {
    status: {
      type: String,
      enum: ["Approved", "Rejected", "Pending"],
      default: "Pending",
    },
    approved_date: {
      type: String,
    },
    approved_hours: {
      type: String,
    },
  },
});

LeaveRequestSchema.index({ company_id: 1, empleave_start_date: 1 });
LeaveRequestSchema.index({
  company_id: 1,
  empleave_start_date: 1,
  "empleave_hr.status": 1,
});

module.exports = mongoose.model("emp_leave", LeaveRequestSchema);

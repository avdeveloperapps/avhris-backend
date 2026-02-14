const mongoose = require("mongoose");

const overtimeSchema = mongoose.Schema({
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
  },
  emp_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employmeent",
    required: [true, "Please Select one employment"],
  },
  overtime_created: {
    type: String,
  },
  overtime_date: {
    type: String,
    required: [true, "Overtime Date required"],
  },
  overtime_start_hours: {
    type: String,
    required: [true, "Please fill in the start overtime hours"],
  },
  overtime_end_hours: {
    type: String,
    required: [true, "Please fill in the end overtime hours"],
  },
  overtime_duration: {
    type: String,
  },
  overtime_reason: {
    type: String,
    required: [true, "Overtime Reason required"],
  },
  overtime_amount: {
    type: Number,
  },
  overtime_fsuperior: {
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
  overtime_ssuperior: {
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
  overtime_hr: {
    hr_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Designation",
    },
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

overtimeSchema.index({ company_id: 1, overtime_status: 1 });
overtimeSchema.index({ company_id: 1, emp_id: 1, overtime_status: 1 });
overtimeSchema.index({ emp_id: 1, overtime_date: 1 });

module.exports = mongoose.model("emp-overtime-leave", overtimeSchema);

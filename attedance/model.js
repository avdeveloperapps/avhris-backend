const mongoose = require("mongoose");

const AttedanceSchema = mongoose.Schema({
  insert_databy: {
    type: String,
    enum: ["Auto_Schedule", "Has_Attendance"],
  },
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
  },
  emp_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employmeent",
  },
  attendance_date: {
    type: String,
    required: true,
  },
  attendance_date_out: {
    type: String,
  },
  attendance_reason: {
    type: String,
  },
  shift_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "shift",
    required: false,
  },
  workhours: {
    type: String,
  },
  break_duration: {
    type: String,
  },
  workhours_in: {
    type: String,
  },
  workhours_out: {
    type: String,
  },
  clock_in: {
    type: String,
    required: true,
  },
  clock_out: {
    type: String,
    required: true,
  },
  behavior_at: {
    type: String,
    emun: ["Regular", "Late", "Early"],
  },
  count_lateduration: {
    type: Number,
  },
  type: {
    type: String,
  },
  break_in: {
    type: String,
  },
  break_out: {
    type: String,
  },
  behavior_break: {
    type: String,
    emun: ["Regular", "Late", "Early"],
  },
  count_breakduration: {
    type: Number,
  },
  attendance_status: {
    type: String,
  },
  delay_deduction: {
    type: Number,
    default: 0,
  },
  attendance_deduction: {
    type: Number,
  },
  break_deduction: {
    type: Number,
  },
  orther_break_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "orther_break",
    required: false,
  },
});

AttedanceSchema.index({ company_id: 1, attendance_date: 1 });
AttedanceSchema.index({ company_id: 1, emp_id: 1, attendance_date: 1 });
AttedanceSchema.index({
  company_id: 1,
  behavior_at: 1,
  attendance_date: 1,
});
AttedanceSchema.index({
  company_id: 1,
  attendance_status: 1,
  attendance_date: 1,
});

module.exports = mongoose.model("emp_attendance", AttedanceSchema);

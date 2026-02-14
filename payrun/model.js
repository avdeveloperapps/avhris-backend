const mongoose = require("mongoose");

const PayrunSchema = mongoose.Schema({
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
  },
  emp_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employmeent",
  },
  payrun_period: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "periodic",
  },
  payrun_type_period: {
    type: String,
  },
  payrun_salary: {
    type: Number,
  },
  payrun_net_salary: {
    type: Number,
  },
  payrun_total_allowance: {
    type: Number,
  },
  payrun_total_overtime: {
    type: Number,
  },
  payrun_total_deduction: {
    type: Number,
  },
  payrun_total_deduct_attendance: {
    type: Number,
  },
  payrun_status: {
    type: String,
    enum: ["Approve", "Pending", "Cancel"],
    default: "Pending",
  },
  payrun_allowance: [
    {
      allow_id: String,
      total: Number,
      name: String,
      percent: Boolean,
    },
  ],
  payrun_deduction: [
    {
      deduct_id: String,
      total: Number,
      name: String,
      percent: Boolean,
      edit: Boolean,
    },
  ],
  payrun_file: {
    type: String,
  },
  process_status: {
    type: Boolean,
    default: false,
  },
  process_date: {
    type: String,
    default: null,
  },
  payrun_type: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PayrunType",
    default: null,
  },
});

PayrunSchema.index({ company_id: 1, payrun_period: 1 });
PayrunSchema.index({ emp_id: 1, payrun_period: 1 });
PayrunSchema.index({ company_id: 1, payrun_status: 1 });

module.exports = mongoose.model("payrun", PayrunSchema);

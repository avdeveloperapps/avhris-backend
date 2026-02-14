const mongoose = require("mongoose");

const EmpStatusSchema = mongoose.Schema({
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
  },
  emp_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employmeent",
  },
  empwarning_subject: {
    type: String,
    required: [true, "Input subject required"],
  },
  empwarning_type: {
    type: String,
    required: [true, "Please select one type"],
  },
  empwarning_date: {
    type: String,
  },
  empwarning_status: {
    type: String,
    enum: ["Solved", "Unsolved"],
    default: "Unsolved",
  },
  empwarning_desc: {
    type: String,
  },
});

EmpStatusSchema.index({ company_id: 1 });
EmpStatusSchema.index({ emp_id: 1 });

module.exports = mongoose.model("emp-warning", EmpStatusSchema);

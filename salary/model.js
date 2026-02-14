const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SalarySchema = new Schema({
  emp_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employmeent",
  },
  emp_salary: {
    type: Number,
    required: true,
  },
  emp_working_hours: {
    type: Number,
    required: true,
  },
  emp_working_days: {
    type: Number,
    required: true,
  },
  emp_periode: {
    type: String,
    required: true,
  },
});

SalarySchema.index({ emp_id: 1 });

module.exports = mongoose.model("Salary", SalarySchema);

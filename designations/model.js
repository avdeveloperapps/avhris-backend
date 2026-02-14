const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const DesignationSchema = new Schema({
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
  },
  emp_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employmeent",
  },
  des_name: {
    type: String,
    required: [true, "Designation name must be filled in"],
  },
  des_desc: {
    type: String,
  },
  des_employee_total: {
    type: Number,
  },
});

DesignationSchema.index({ company_id: 1 });

module.exports = mongoose.model("Designation", DesignationSchema);

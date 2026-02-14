const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const DepartementSchema = new Schema({
  emp_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employmeent",
  },
  empexp_company: {
    type: String,
    required: true,
  },
  empexp_comp_position: {
    type: String,
    required: true,
  },
  empexp_startdate: {
    type: String,
    required: true,
  },
  empexp_endate: {
    type: String,
    required: true,
  },
});

DepartementSchema.index({ emp_id: 1 });

module.exports = mongoose.model("Experience", DepartementSchema);

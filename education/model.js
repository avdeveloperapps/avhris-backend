const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const DepartementSchema = new Schema({
  emp_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employmeent",
  },
  empedu_type: {
    type: String,
    required: true,
  },
  empedu_result: {
    type: Number,
    required: true,
  },
  empedu_year: {
    type: String,
    required: true,
  },
  empedu_institute: {
    type: String,
    required: true,
  },
});

DepartementSchema.index({ emp_id: 1 });

module.exports = mongoose.model("Education", DepartementSchema);

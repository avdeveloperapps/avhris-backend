const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AllowSchema = new Schema({
  emp_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employmeent",
  },
  deduction_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "allowdeduct",
    required: true,
  },
  deduction_selfpercent: {
    type: Number,
    required: true,
  },
  deduction_status: {
    type: Boolean,
    default: false,
  },
  deduction_totalpercent: {
    type: Number,
    required: true,
  },
  deduction_companypercent: {
    type: Number,
    required: true,
  },
});

AllowSchema.index({ emp_id: 1 });

module.exports = mongoose.model("emp_deduction", AllowSchema);

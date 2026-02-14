const mongoose = require("mongoose");
const latelySchema = mongoose.Schema({
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
  },
  lately_flag: {
    type: String,
    required: true,
  },
  lately_duration: {
    type: Number,
    require: true,
  },
  lately_deduction: {
    type: Number,
    required: true,
  },
  lately_formula: {
    type: String,
  },
  lately_deduct_from_basic: {
    type: Boolean,
    default: true,
  },
  lately_indicator: {
    type: String,
    required: true,
  },
});

latelySchema.index({ company_id: 1 });
latelySchema.index({ lately_formula: 1 });

module.exports = mongoose.model("attendance_lately", latelySchema);

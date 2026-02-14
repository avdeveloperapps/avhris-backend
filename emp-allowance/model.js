const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AllowSchema = new Schema({
  emp_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employmeent",
  },
  empallow_allowance_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "allowdeduct",
  },
  empallow_allowance_amount: {
    type: String,
  },
  empallow_allowance_additional: {
    type: String,
  },
  empallow_allowance_status: {
    type: Boolean,
    default: false,
  },
  empallow_allowance_type: {
    type: String,
  },
});

AllowSchema.index({ emp_id: 1 });

module.exports = mongoose.model("emp_allowance", AllowSchema);

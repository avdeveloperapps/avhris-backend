const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BankSchema = new Schema({
  emp_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employmeent",
  },
  bi_holder_name: {
    type: String,
    required: true,
  },
  bi_bank_name: {
    type: String,
    required: true,
  },
  bi_account_number: {
    type: String,
    required: true,
  },
});

BankSchema.index({ emp_id: 1 });

module.exports = mongoose.model("Bank", BankSchema);

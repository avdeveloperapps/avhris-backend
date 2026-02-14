const mongoose = require("mongoose");

const BankPayrunSchema = mongoose.Schema(
  {
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "company is a required field"],
    },
    bank_name: {
      type: String,
      default: null,
      required: [true, "account number is a required field"],
    },
    account_number: {
      type: String,
      default: null,
      required: [true, "account number is a required field"],
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    is_default: {
      type: Boolean,
      default: false,
    },
    created_at: {
      type: Date,
    },
    updated_at: {
      type: Date,
    },
  },
  { timestamps: true }
);

BankPayrunSchema.index({ company_id: 1, is_default: 1 });
BankPayrunSchema.index({ company_id: 1, is_active: 1 });

module.exports = mongoose.model("BankPayrun", BankPayrunSchema);

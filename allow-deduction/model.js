const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AllowDeducSchema = new Schema({
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
  },
  ad_name: {
    type: String,
  },
  ad_desc: {
    type: String,
  },
  ad_status: {
    type: Boolean,
    default: false,
  },
  ad_type: {
    type: String,
    enum: ["Allowance", "Deduction", "Orther"],
  },
});

AllowDeducSchema.index({ company_id: 1 });
AllowDeducSchema.index({ company_id: 1, ad_type: 1 });

module.exports = mongoose.model("allowdeduct", AllowDeducSchema);

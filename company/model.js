const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CompanySchema = new Schema({
  company_name: {
    type: String,
    required: [true, "Company name must be filled in"],
  },
  company_group: {
    type: String,
    default: null,
  },

  company_zone: {
    type: String,
    default: null,
  },
  company_longtitude: {
    type: Number,
    default: null,
  },
  company_latitude: {
    type: Number,
    default: null,
  },
  company_status: {
    type: Boolean,
    default: true,
  },
  company_desc: {
    type: String,
    default: null,
  },
  company_copyright: {
    type: String,
    default: null,
  },
  company_header: {
    type: String,
  },
  company_contact: {
    type: String,
    default: null,
  },
  company_currency: {
    type: String,
    default: null,
  },
  company_cursymbol: {
    type: String,
    default: null,
  },
  company_email: {
    type: String,
    default: null,
  },
  company_password: {
    type: String,
    default: null,
  },
  company_address: {
    type: String,
    default: null,
  },
  company_image: {
    type: String,
    default: null,
  },
  role: {
    type: String,
    default: null,
  },
  company_canpayroll: {
    type: Boolean,
    default: false,
  },
});

CompanySchema.index({ company_email: 1 });

module.exports = mongoose.model("Company", CompanySchema);

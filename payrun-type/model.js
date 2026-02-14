const mongoose = require("mongoose");

const PayrunTypeSchema = mongoose.Schema(
  {
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "company is a required field"],
    },
    output_file: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OutputFile",
      required: [true, "output file is a required field"],
    },
    payrun_type: {
      type: String,
      default: null,
      required: [true, "payrun type is a required field"],
    },
    description: {
      type: String,
      default: null,
    },
    color: {
      type: String,
      required: [true, "color is a required field"],
      enum: ["green", "orange", "gray"],
    },
    is_default: {
      type: Boolean,
      default: false,
    },
    is_active: {
      type: Boolean,
      default: true,
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

PayrunTypeSchema.index({ company_id: 1, payrun_type: 1 });
PayrunTypeSchema.index({ company_id: 1, is_default: 1 });
PayrunTypeSchema.index({ company_id: 1, is_active: 1 });

module.exports = mongoose.model("PayrunType", PayrunTypeSchema);

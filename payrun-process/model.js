const mongoose = require("mongoose");

const payrunProcessSchema = mongoose.Schema(
  {
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "company is a requried field"],
    },
    output_file: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OutputFile",
      required: [true, "output file is a required field"],
    },
    period: {
      type: String,
      required: [true, "period is a required field"],
    },
    date_transaction: {
      type: String,
      required: [true, "date transaction a required field"],
    },
    status: {
      type: String,
      default: "Success",
    },
    file_name: {
      type: String,
      required: [true, "file name is a required field"],
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

payrunProcessSchema.index({ company_id: 1, period: 1 });

module.exports = mongoose.model("PayrunProcess", payrunProcessSchema);

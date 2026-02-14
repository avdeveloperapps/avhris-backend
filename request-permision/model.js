const mongoose = require("mongoose");

const permisionSchema = mongoose.Schema({
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
  },
  permision_name: {
    type: String,
    required: true,
  },
});

permisionSchema.index({ company_id: 1 });

module.exports = mongoose.model("permision-type", permisionSchema);

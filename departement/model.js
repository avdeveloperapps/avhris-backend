const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const DepartementSchema = new Schema({
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
  },
  dep_name: {
    type: String,
    required: [true, "Departement name must be filled in"],
  },
  dep_manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employmeent",
  },
  dep_desc: {
    type: String,
  },
  dep_status: {
    type: String,
    enum: ["Active", "Not Active"],
  },
  dep_location: {
    type: String,
  },
  dep_workshift: {
    type: String,
  },
  dep_created: {
    type: String,
  },
});

DepartementSchema.index({ company_id: 1 });

module.exports = mongoose.model("Departement", DepartementSchema);

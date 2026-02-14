const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const RolesSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "name can't be empty"],
    },
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
    },
    permissions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Permission",
      },
    ],
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employmeent",
      },
    ],
  },
  { collection: "roles" }
);

RolesSchema.index({ company_id: 1 });

module.exports = mongoose.model("Role", RolesSchema);

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UsersSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "name can't be empty"],
    },
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
    },
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
    },
    email: {
      type: String,
      required: [true, "username can't be empty"],
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["App Admin", "Super Admin"],
    },
    status: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  { collection: "users" }
);

UsersSchema.index({ company_id: 1, status: 1 });

module.exports = mongoose.model("Users", UsersSchema);

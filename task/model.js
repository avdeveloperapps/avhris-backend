const mongoose = require("mongoose");
const moment = require("moment");

const NotifSchema = mongoose.Schema(
  {
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      require: [true, "company_id is required"],
    },
    task_name: {
      type: String,
      required: [true, "task_name is required"],
    },
    task_desc: {
      type: String,
      required: [true, "task_desc is required"],
    },
    task_date_start: {
      type: String,
      validate: {
        validator: function (value) {
          return moment(value, "YYYY-MM-DD").format("YYYY-MM-DD") === value;
        },
        message: "task_date_start the format is not match",
      },
      required: [true, "task_date_start is required"],
    },
    task_date_end: {
      type: String,
      validate: {
        validator: function (value) {
          return moment(value, "YYYY-MM-DD").format("YYYY-MM-DD") === value;
        },
        message: "task_date_end the format is not match",
      },
      required: [true, "task_date_start is required"],
    },
    estimated_hours: {
      type: String,
      required: [true, "estimated_hours is required"],
    },
    task_workers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employmeent",
      },
    ],
    progress: {
      type: Number,
      default: 0,
    },
    task_status: {
      type: String,
      enum: ["passed", "ongoing", "not_started", "stoped"],
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
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

NotifSchema.index({ company_id: 1, task_status: 1, createdAt: 1 });

module.exports = mongoose.model("task", NotifSchema);

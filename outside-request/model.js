const mongoose = require("mongoose");

const outsideSchema = mongoose.Schema({
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
  },
  emp_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employmeent",
    required: [true, "Please Select one employment"],
  },
  //   outside_date: {
  //     type: String,
  //     required: [true, "outside Date required"],
  //   },
  outside_start_date: {
    type: String,
    required: [true, "Please fill in the start outside date"],
  },
  outside_end_date: {
    type: String,
    required: [true, "Please fill in the end outside date"],
  },
  outside_duration: {
    type: String,
  },
  outside_reason: {
    type: String,
    required: [true, "outside Reason required"],
  },
  outside_fsuperior: {
    fsuperior_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Designation",
    },
    status: {
      type: String,
      enum: ["Approved", "Rejected", "Not Approved", "Pending"],
      default: "Pending",
    },
    approved_by: {
      type: String,
    },
    approved_date: {
      type: String,
    },
    approved_hours: {
      type: String,
    },
  },
  outside_ssuperior: {
    ssuperior_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Designation",
    },
    status: {
      type: String,
      enum: ["Approved", "Rejected", "Not Approved", "Pending"],
      default: "Pending",
    },
    approved_by: {
      type: String,
    },
    approved_date: {
      type: String,
    },
    approved_hours: {
      type: String,
    },
  },
  outside_hr: {
    status: {
      type: String,
      enum: ["Approved", "Rejected", "Pending"],
      default: "Pending",
    },
    approved_date: {
      type: String,
    },
    approved_hours: {
      type: String,
    },
  },
});

outsideSchema.index({ company_id: 1, outside_status: 1 });
outsideSchema.index({ company_id: 1, emp_id: 1, outside_status: 1 });
outsideSchema.index({ emp_id: 1, outside_start_date: 1 });

module.exports = mongoose.model("emp-outside-request", outsideSchema);

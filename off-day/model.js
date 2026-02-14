const mongoose = require("mongoose");

const outsideSchema = mongoose.Schema(
  {
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
    },
    emp_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employmeent",
      required: [true, "Please Select one employment"],
    },
    emp_replacement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employmeent",
      required: [true, "Please Select one employment to change"],
    },
    offday_date: {
      type: String,
      required: [true, "Please fill in the off day date"],
    },
    offday_change: {
      type: String,
      required: [true, "Please fill in the change date"],
    },
    offday_request: {
      type: String,
    },
    offday_reason: {
      type: String,
      required: [true, "Offday Reason required"],
    },
    offday_fsuperior: {
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
    offday_ssuperior: {
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
    offday_hr: {
      hr_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Designation",
      },
      status: {
        type: String,
        enum: ["Approved", "Rejected", "Pending"],
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
    offday_status: {
      type: String,
    },
  },
  { collection: "emp-offdays" }
);

outsideSchema.index({ company_id: 1, offday_status: 1 });
outsideSchema.index({ company_id: 1, emp_id: 1, offday_status: 1 });
outsideSchema.index({ emp_id: 1, offday_date: 1 });

module.exports = mongoose.model("ChangeOffDay", outsideSchema);

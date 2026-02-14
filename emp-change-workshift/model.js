const mongoose = require("mongoose");

const ChangeShift = mongoose.Schema(
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
    empchange_request: {
      type: String,
    },
    empchange_date_request: {
      type: String,
    },
    empchange_date_request_end: {
      type: String,
    },
    empchange_shift_before: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "shift",
      required: [true, "Please fill in the start shift change"],
    },
    empchange_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "shift",
      required: [true, "Please fill in the end shift change"],
    },
    empchange_replacement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employmeent",
      required: [true, "Please Select one employment to replacement"],
    },
    empchange_reason: {
      type: String,
      required: [true, "outside Reason required"],
    },
    empchange_fsuperior: {
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
    empchange_ssuperior: {
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
    empchange_hr: {
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
    empchange_status: {
      type: String,
    },
  },
  { collection: "emp-change-shifts" }
);

ChangeShift.index({ company_id: 1, empchange_status: 1 });
ChangeShift.index({ company_id: 1, emp_id: 1, empchange_status: 1 });
ChangeShift.index({ emp_id: 1, empchange_date_request: 1 });

module.exports = mongoose.model("ChangeShift", ChangeShift);

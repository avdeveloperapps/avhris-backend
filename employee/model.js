const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const EmployementSchema = new Schema({
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
  },
  emp_profile: {
    type: String,
  },
  username: {
    type: String,
    unique: true,
  },
  emp_firstname: {
    type: String,
  },
  emp_lastname: {
    type: String,
  },
  emp_fullname: {
    type: String,
  },
  emp_phone: {
    type: String,
  },
  emp_nikktp: {
    type: String,
  },
  emp_marital_status: {
    type: String,
  },
  emp_gender: {
    type: String,
    enum: ["Laki-Laki", "Perempuan"],
  },
  emp_birthday: {
    type: String,
  },
  email: {
    type: String,
  },
  emp_blood: {
    type: String,
  },
  password: {
    type: String,
  },
  emp_depid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Departement",
  },
  emp_desid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Designation",
  },
  emp_fsuperior: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Designation",
  },
  emp_ssuperior: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Designation",
  },
  emp_hr: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Designation",
  },
  emp_tanggungan: {
    type: String,
  },
  emp_status: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "emp-status",
  },
  emp_nik_karyawan: {
    type: String,
  },
  emp_location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "attendance_location",
  },
  emp_joining_data: {
    type: String,
  },
  emp_attendance_status: {
    type: Boolean,
    default: true,
  },
  emp_employment_status: {
    type: Boolean,
    default: true,
  },
  emp_payroll_status: {
    type: Boolean,
    default: true,
  },
  emp_leave_token: {
    type: Number,
    default: 0,
  },
  role: {
    type: String,
    enum: ["App Admin", "Manager", "Employment"],
    default: "Employment",
  },
  emp_attadance: {
    senin: {
      shift: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "shift",
        required: false,
        default: function () {
          if (this.shift === "") {
            return null;
          } else {
            return this.shift;
          }
        },
      },
      off_day: { type: Boolean },
    },
    selasa: {
      shift: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "shift",
        required: false,
        default: function () {
          if (this.shift === "") {
            return null;
          } else {
            return this.shift;
          }
        },
      },
      off_day: { type: Boolean },
    },
    rabu: {
      shift: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "shift",
        required: false,
        default: function () {
          if (this.shift === "") {
            return null;
          } else {
            return this.shift;
          }
        },
      },
      off_day: { type: Boolean },
    },
    kamis: {
      shift: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "shift",
        required: false,
        default: function () {
          if (this.shift === "") {
            return null;
          } else {
            return this.shift;
          }
        },
      },
      off_day: { type: Boolean },
    },
    jumat: {
      shift: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "shift",
        required: false,
        default: function () {
          if (this.shift === "") {
            return null;
          } else {
            return this.shift;
          }
        },
      },
      off_day: { type: Boolean },
    },
    sabtu: {
      shift: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "shift",
        required: false,
        default: function () {
          if (this.shift === "") {
            return null;
          } else {
            return this.shift;
          }
        },
      },
      off_day: { type: Boolean },
    },
    minggu: {
      shift: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "shift",
        required: false,
        default: function () {
          if (this.shift === "") {
            return null;
          } else {
            return this.shift;
          }
        },
      },
      off_day: { type: Boolean },
    },
  },
  payrun_type: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PayrunType",
    default: null,
  },
  payrun_status: {
    type: Boolean,
    default: false,
  },
});

EmployementSchema.index({ company_id: 1, "emp_attadance.senin.off_day": 1 });
EmployementSchema.index({ company_id: 1, "emp_attadance.selasa.off_day": 1 });
EmployementSchema.index({ company_id: 1, "emp_attadance.rabu.off_day": 1 });
EmployementSchema.index({ company_id: 1, "emp_attadance.kamis.off_day": 1 });
EmployementSchema.index({ company_id: 1, "emp_attadance.jumat.off_day": 1 });
EmployementSchema.index({ company_id: 1, "emp_attadance.sabtu.off_day": 1 });
EmployementSchema.index({ company_id: 1, "emp_attadance.minggu.off_day": 1 });
EmployementSchema.index({ company_id: 1 });
EmployementSchema.index({ company_id: 1, emp_status: 1 });
EmployementSchema.index({ company_id: 1, emp_depid: 1 });
EmployementSchema.index({ company_id: 1, emp_desid: 1 });
EmployementSchema.index({ email: 1 });
EmployementSchema.index({ username: 1 });
EmployementSchema.index({ emp_nikktp: 1 });

module.exports = mongoose.model("Employmeent", EmployementSchema);

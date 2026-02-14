const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ShiftSchema = new Schema({
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  shift_name: {
    type: String,
    required: true,
  },
  shift_clockin: {
    type: String,
    required: true,
  },
  shift_clockout: {
    type: String,
    required: true,
  },
  shift_break_duration: {
    type: Number,
    required: true,
  },
  shift_desc: {
    type: String,
  },
  week_active: {
    type: String,
  },
  shift_late_tolarance: {
    type: Number,
    maxlength: 2,
  },
  shift_verylate_tolarance: {
    type: Number,
    maxlength: 2,
  },
  shift_status: {
    type: Boolean,
    default: true,
  },
  shift_type: {
    type: String,
  },
  schedule: {
    minggu_1: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_2: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_3: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_4: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_5: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_6: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_7: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_8: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_9: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_10: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_11: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_12: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_13: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_14: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_15: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_16: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_17: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_18: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_19: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_20: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_21: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_22: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_23: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_24: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_25: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_26: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_27: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_28: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_29: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_30: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_31: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_32: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_33: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_34: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_35: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_36: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_37: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_38: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_39: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_40: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_41: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_42: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_43: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_44: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_45: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_46: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_47: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_48: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_49: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_50: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_51: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_52: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
    minggu_53: {
      shift_clockin: { type: String },
      shift_clockout: { type: String },
      shift_break_duration: { type: Number },
      shift_late_tolarance: {
        type: Number,
        maxlength: 2,
      },
      shift_verylate_tolarance: {
        type: Number,
        maxlength: 2,
      },
    },
  },
});

ShiftSchema.index({ company_id: 1, shift_type: 1 });

module.exports = mongoose.model("shift", ShiftSchema);

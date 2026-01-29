const cron = require("node-cron");
const Attedance = require("../attedance/model");
const Employment = require("../employee/model");
const ChangeOffDay = require("../off-day/model");
const ChangeShift = require("../emp-change-workshift/model");
const LeaveHol = require("../leave-holidays/model");
const LeaveRequest = require("../leave-request/model");
const LeaveSetting = require("../leave-setting/model");
const Salary = require("../salary/model");
const Workshift = require("../workshift/model");
const moment = require("moment");
const { dateToday, getDayName } = require("../attedance/controller");
const { weeknum, serialToday } = require("../workshift/controller");

async function calculateAttendanceAbsent(emp) {
  try {
    const salary = await Salary.findOne({ emp_id: emp?._id });
    if (salary) {
      return (
        salary?.emp_salary / salary?.emp_working_days +
        (0.5 * salary?.emp_salary) / salary?.emp_working_days
      );
    } else {
      return 1;
    }
  } catch (error) {
    console.log(error);
  }
}

function getCurrentWeek(formatPatern = "DD-MM-YYYY") {
  const now = moment();
  const wStart = now.clone().startOf("isoWeek");
  const wEnd = now.clone().endOf("isoWeek");
  var days = [];
  for (var i = 0; i <= 6; i++) {
    days.push(moment(wStart).add(i, "days").format(formatPatern));
  }
  return days;
}

module.exports = {
  calculateAttendanceAbsent,
};

async function checkLeaveHolEmployment() {
  const employment = await Employment.find();
  const getIdAndDepartmentId = employment.map((emp) => ({
    emp_id: emp?._id,
    emp_depid: emp?.emp_depid,
  }));
  const leaveHol = await LeaveHol.find();

  const now = moment();

  const activeLeavehol = await Promise.all(
    leaveHol.filter((leavehol) => {
      const startDate = moment(leavehol.leavehol_startdate);
      const endDate = moment(leavehol.leavehol_enddate);
      return now.isBetween(startDate, endDate);
    })
  );
  if (activeLeavehol.length > 0) {
    const matchingEmp = await Promise.all(
      getIdAndDepartmentId.filter((emp) =>
        leaveHol.some((leavehol) =>
          leavehol.leavehol_depid.includes(emp.emp_depid)
        )
      )
    );
    await Promise.all(
      matchingEmp.map(async (employment) => {
        const chekcAttendanceToday = await Attedance.findOne({
          emp_id: employment?.emp_id,
          attendance_date: dateToday(),
        });
        const findEmployment = await Employment.findOne({
          _id: employment?.emp_id,
        }).populate({
          path: `emp_attadance.${[getDayName()]}.shift`,
        });
        if (chekcAttendanceToday) {
          if (!findEmployment?.emp_attadance[getDayName()]?.shift) {
            return;
          }
          const employmentShiftToday =
            findEmployment?.emp_attadance[getDayName()];
          const payload = {
            attendance_status: `${leaveHol[0]?.leavehol_type}`,
            attendance_deduction: 0,
          };
          const attendance = await Attedance.updateOne(
            { emp_id: findEmployment?._id, attendance_date: dateToday() },
            {
              $set: {
                ...payload,
              },
            }
          );
          if (attendance.updateCount > 0) {
            console.log("berhasil mengubah status menjadi cuti bersama");
          }
          console.log("leave hol check", attendance);
        } else {
          console.log("leaveHol -> employment belum absen");
        }
      })
    );
  }
}

async function checkLeaveRequestEmployment() {
  const employment = await Employment.find();
  const leaveRequest = await LeaveRequest.find({
    empleave_status: "Approved",
    empleave_leave_type: { $in: ["Single Day", "Multi Day"] },
  });
  const activeLeaveRequest = await Promise.all(
    leaveRequest.filter((req) => {
      if (req.empleave_end_date) {
        const startDate = moment(req?.empleave_start_date);
        const endDate = moment(req?.empleave_end_date);
        return moment().isBetween(startDate, endDate);
      } else {
        return moment().isSame(req.empleave_start_date, "day");
      }
    })
  );
  if (activeLeaveRequest.length > 0) {
    const resultLeaveEmp = await Promise.all(
      activeLeaveRequest.filter((req) =>
        employment.some((emp) => emp._id.equals(req.emp_id))
      )
    );
    await Promise.all(
      resultLeaveEmp.map(async (employment) => {
        const chekcAttendanceToday = await Attedance.findOne({
          emp_id: employment?.emp_id,
          attendance_date: dateToday(),
        });
        const findEmployment = await Employment.findOne({
          _id: employment?.emp_id,
        }).populate({
          path: `emp_attadance.${[getDayName()]}.shift`,
        });
        if (chekcAttendanceToday) {
          if (!findEmployment?.emp_attadance[getDayName()]?.shift) {
            return;
          }
          const employmentShiftToday =
            findEmployment?.emp_attadance[getDayName()];
          const leaveType = await LeaveSetting.findOne({
            _id: employment?.empleave_type_id,
          });
          const payload = {
            company_id: findEmployment?.company_id,
            emp_id: findEmployment?._id,
            insert_databy: "Has_Attendance",
            shift_id: employmentShiftToday?.shift?._id || null,
            workhours_in: employmentShiftToday?.shift?.shift_clockin || "",
            workhours_out: employmentShiftToday?.shift?.shift_clockout || "",
            clock_in: "-",
            clock_out: "-",
            break_out: "-",
            break_in: "-",
            attendance_date: dateToday(),
            workhours: "-",
            behavior_break: "-",
            count_lateduration: 0,
            count_breakduration: 0,
            attendance_status: leaveType?.leave_desc,
            type: "Auto",
            behavior_at: "-",
            attendance_deduction: 0,
            break_deduction: 0,
          };
          const attendance = await Attedance.updateOne(
            { emp_id: findEmployment?._id, attendance_date: dateToday() },
            {
              $set: {
                ...payload,
              },
            }
          );
          if (attendance.updateCount > 0) {
            console.log("berhasil mengubah status menjadi leave request");
          }
        } else {
          console.log("leaveReq -> employment belum absen");
        }
      })
    );
  }
}

async function checkChangeShiftRequestEmployment() {
  const ChangeShiftRequest = await ChangeShift.find({
    empchange_status: "Approved",
  });
  const activeChangeShiftRequest = await Promise.all(
    ChangeShiftRequest.filter((req) => {
      if (req.empchange_date_request_end) {
        const startDate = moment(req?.empchange_date_request);
        const endDate = moment(req?.empchange_date_request_end);
        return moment().isBetween(startDate, endDate);
      } else {
        return moment().isSame(req.empchange_date_request, "day");
      }
    })
  );
  if (activeChangeShiftRequest.length > 0) {
    await Promise.all(
      activeChangeShiftRequest.map(async (request) => {
        const aplicantAttendance = await Attedance.findOne({
          emp_id: request?.emp_id,
          attendance_date: dateToday(),
        });
        const shiftThatAplicantWant = await Workshift.findOne({
          _id: request?.empchange_to,
        });
        if (aplicantAttendance) {
          if (request?.empchange_replacement) {
            const replacementAttendance = await Attedance.findOne({
              emp_id: request?.empchange_replacement,
              attendance_date: dateToday(),
            });
            const replacementShift = await Workshift.findOne({
              _id: request?.empchange_shift_before,
            });
            if (replacementAttendance && replacementShift) {
              const replacementPayload = {
                shift_id: replacementShift?._id || null,
                workhours_in: replacementShift?.shift_clockin || "",
                workhours_out: replacementShift?.shift_clockout || "",
              };
              await Attedance.updateOne(
                {
                  emp_id: request?.empchange_replacement,
                  attendance_date: dateToday(),
                },
                {
                  $set: {
                    ...replacementPayload,
                  },
                }
              );
            }
          }
          if (!shiftThatAplicantWant) {
            return;
          }
          const aplicantPayload = {
            shift_id: shiftThatAplicantWant?._id || null,
            workhours_in: shiftThatAplicantWant?.shift_clockin || "",
            workhours_out: shiftThatAplicantWant?.shift_clockout || "",
          };
          const attendance = await Attedance.updateOne(
            { emp_id: request?.emp_id, attendance_date: dateToday() },
            {
              $set: {
                ...aplicantPayload,
              },
            }
          );
          if (attendance.updateCount > 0) {
            console.log("berhasil mengatur ganti shift");
          }
        } else {
          console.log("leaveReq -> employment belum absen");
        }
      })
    );
  }
}

async function checkChangeOffRequestEmployment() {
  const ChangeOffRequest = await ChangeOffDay.find({
    // offday_change: { $in: thisWeek },
    $or: [
      {
        $and: [
          { offday_date: moment().format("DD-MM-YYYY") },
          { offday_status: "Approved" },
        ],
      },
      {
        $and: [
          { offday_change: moment().format("DD-MM-YYYY") },
          { offday_status: "Approved" },
        ],
      },
    ],
  });
  const activeChangeOffRequest = await Promise.all(
    ChangeOffRequest.filter((req) => {
      const oDate = moment(req.offday_date, "DD-MM-YYYY").format("YYYY-MM-DD");
      const cDate = moment(req.offday_change, "DD-MM-YYYY").format(
        "YYYY-MM-DD"
      );
      return moment().isSame(oDate, "day") || moment().isSame(cDate, "day");
    })
  );
  if (activeChangeOffRequest.length > 0) {
    await Promise.all(
      activeChangeOffRequest.map(async (request) => {
        const oDate = moment(request.offday_date, "DD-MM-YYYY").format(
          "YYYY-MM-DD"
        );
        const cDate = moment(request.offday_change, "DD-MM-YYYY").format(
          "YYYY-MM-DD"
        );
        const employment = await Employment.findOne({
          _id: request?.emp_id,
        });
        const replacetor = await Employment.findOne({
          _id: request?.emp_replacement,
        });
        const userAttendance = await Attedance.findOne({
          emp_id: request?.emp_id,
          attendance_date: dateToday(),
        });
        if (moment().isSame(oDate, "day") || moment().isSame(cDate, "day")) {
          if (userAttendance?.attendance_status == "Off Day") {
            const userAttendancePayload = {
              attendance_status: `Absent`,
              attendance_deduction: await calculateAttendanceAbsent(employment),
            };
            await Attedance.updateOne(
              {
                emp_id: request?.emp_id,
                attendance_date: dateToday(),
              },
              {
                $set: {
                  ...userAttendancePayload,
                },
              }
            );
            if (request?.emp_replacement) {
              const replacetorPayload = {
                attendance_status: `Off Day`,
                attendance_deduction: 0,
              };
              await Attedance.updateOne(
                {
                  emp_id: request?.emp_replacement,
                  attendance_date: dateToday(),
                },
                {
                  $set: {
                    ...replacetorPayload,
                  },
                }
              );
            }
            console.log(
              employment.emp_fullname +
                " Tukar Off Dengan " +
                replacetor.emp_fullname
            );
          } else {
            const userAttendancePayload = {
              attendance_status: `Off Day`,
              attendance_deduction: 0,
            };
            await Attedance.updateOne(
              {
                emp_id: request?.emp_id,
                attendance_date: dateToday(),
              },
              {
                $set: {
                  ...userAttendancePayload,
                },
              }
            );
            if (request?.emp_replacement) {
              const replacetorPayload = {
                attendance_status: `Absent`,
                attendance_deduction: await calculateAttendanceAbsent(
                  employment
                ),
              };
              await Attedance.updateOne(
                {
                  emp_id: request?.emp_replacement,
                  attendance_date: dateToday(),
                },
                {
                  $set: {
                    ...replacetorPayload,
                  },
                }
              );
            }
            console.log(
              employment.emp_fullname +
                " Tukar Off Dengan " +
                replacetor.emp_fullname
            );
          }
        }
      })
    );
  }
}

async function addAbsentToAllEmployment() {
  try {
    const employment = await Employment.find();
    await Promise.all(
      employment.map(async (employment) => {
        if (
          employment?.emp_employment_status &&
          employment?.emp_attendance_status
        ) {
          const chekcAttendanceToday = await Attedance.findOne({
            emp_id: employment?._id,
            attendance_date: dateToday(),
          });
          const findEmployment = await Employment.findOne({
            _id: employment?._id,
          }).populate({
            path: `emp_attadance.${[getDayName()]}.shift`,
          });
          if (!chekcAttendanceToday) {
            const employmentShiftToday =
              findEmployment?.emp_attadance[getDayName()];

            const payload = {
              company_id: findEmployment?.company_id,
              emp_id: findEmployment?._id,
              insert_databy: "Has_Attendance",
              shift_id: employmentShiftToday?.shift?._id || null,
              workhours_in: employmentShiftToday?.shift?.shift_clockin,
              workhours_out: employmentShiftToday?.shift?.shift_clockout,
              clock_in: "-",
              clock_out: "-",
              break_out: "-",
              break_in: "-",
              attendance_date: dateToday(),
              workhours: "-",
              behavior_break: "-",
              count_lateduration: 0,
              count_breakduration: 0,
              attendance_status: `Absent`,
              type: "Auto",
              behavior_at: "-",
              attendance_deduction: await calculateAttendanceAbsent(employment),
              break_deduction: 0,
            };
            const attendance = new Attedance(payload);
            await attendance
              .save()
              .then(() =>
                console.log("berhasil menambahkan attedance karyawan")
              );
          }
        }
      })
    );
  } catch (error) {
    console.log(error);
  }
}

async function checkStatusUndefinedAttendanceEmployment() {
  try {
    const employment = await Employment.find();

    employment.map(async (employment) => {
      const attendance = await Attedance.updateMany(
        { emp_id: employment?._id, attendance_deduction: 100000 },
        {
          $set: {
            attendance_deduction: await calculateAttendanceAbsent(employment),
          },
        }
      );
      // console.log(attendance);
      // const chekcAttendanceToday = await Attedance.deleteOne({
      //   emp_id: employment?._id,
      //   attendance_date: dateToday(),
      //   attendance_status: "undefined",
      // });

      // if (chekcAttendanceToday.deletedCount > 0) {
      //   console.log("Ada status yang undefined");
      //   addAbsentToAllEmployment();
      // }
    });
  } catch (error) {
    console.log(error);
  }
}

async function checkOffDayEmployment() {
  try {
    // const thisWeek = getCurrentWeek();
    const employments = await Employment.find();
    // const offDayRequest = await ChangeOffDay.find({
    //   offday_change: { $in: thisWeek },
    //   offday_status: "Approved",
    // });
    // const filteredEmployment = employments.filter((emp) => {
    //   return !offDayRequest.some((req) => emp._id === req.emp_id);
    // });
    await Promise.all(
      employments.map(async (employment) => {
        const chekcAttendanceToday = await Attedance.findOne({
          emp_id: employment?._id,
          attendance_date: dateToday(),
        });
        const findEmployment = await Employment.findOne({
          _id: employment?._id,
        }).populate({
          path: `emp_attadance.${[getDayName()]}.shift`,
        });
        if (chekcAttendanceToday) {
          const employmentShiftToday =
            findEmployment?.emp_attadance[getDayName()];
          if (employmentShiftToday?.off_day) {
            const payload = {
              company_id: findEmployment?.company_id,
              emp_id: findEmployment?._id,
              insert_databy: "Has_Attendance",
              shift_id: employmentShiftToday?.shift?._id || null,
              workhours_in: employmentShiftToday?.shift?.shift_clockin,
              workhours_out: employmentShiftToday?.shift?.shift_clockout,
              clock_in: "-",
              clock_out: "-",
              break_out: "-",
              break_in: "-",
              attendance_date: dateToday(),
              workhours: "-",
              behavior_break: "-",
              count_lateduration: 0,
              count_breakduration: 0,
              attendance_status: `Off Day`,
              type: "Auto",
              behavior_at: "-",
              attendance_deduction: 0,
              break_deduction: 0,
            };
            const attendance = await Attedance.updateOne(
              { emp_id: findEmployment?._id, attendance_date: dateToday() },
              {
                $set: {
                  ...payload,
                },
              }
            );
            if (attendance.updateCount > 0) {
              console.log("berhasil mengubah status menjadi off day");
            }
            console.log(employment.emp_fullname + " Off Day");
          }
          // else {
          //   console.log("tidak ada yang libur hari ini");
          // }
        }
      })
    );
  } catch (error) {
    console.log(error);
  }
}

async function changeScheduleTime() {
  try {
    const week = weeknum();
    const workshifts = await Workshift.find({ shift_type: "Schedule" });
    workshifts.map(async (workshift) => {
      const updateWorkshift = await Workshift.updateOne(
        { _id: workshift?._id },
        {
          $set: {
            shift_clockin: workshift?.schedule[`minggu_${week}`].shift_clockin,
            shift_clockout:
              workshift?.schedule[`minggu_${week}`]?.shift_clockout,
            shift_break_duration:
              workshift?.schedule[`minggu_${week}`]?.shift_break_duration,
            shift_desc: `${workshift?.shift_name} (${
              workshift?.schedule[`minggu_${week}`]?.shift_clockin
            }-${workshift?.schedule[`minggu_${week}`]?.shift_clockout}, ${
              workshift?.schedule[`minggu_${week}`]?.shift_break_duration < 10
                ? `0${
                    workshift?.schedule[`minggu_${week}`]?.shift_break_duration
                  }:00 Hour`
                : `${
                    workshift?.schedule[`minggu_${week}`]?.shift_break_duration
                  }:00 Hour`
            })`,
            week_active: `minggu_${week}`,
          },
        }
      );
      console.log(updateWorkshift);
    });
    // console.log(week);
  } catch (error) {
    console.log(error);
  }
}

cron.schedule("*/30 * * * *", async function () {
  try {
    // checkStatusUndefinedAttendanceEmployment();
  } catch (error) {
    console.log(error);
  }
});

cron.schedule(
  "*/5 * * * *",
  async function () {
    try {
      await addAbsentToAllEmployment();
    } catch (error) {
      console.log(error);
    }
  },
  {
    scheduled: true,
    timezone: "Asia/Makassar", // set timezone to WITA
  }
);

cron.schedule(
  "0 0 * * *",
  async function () {
    try {
      changeScheduleTime();
    } catch (error) {
      console.log(error);
    }
  },
  {
    scheduled: true,
    timezone: "Asia/Makassar", // set timezone to WITA
  }
);

cron.schedule(
  "10 3 * * *",
  async function () {
    try {
      await checkOffDayEmployment();
      await checkChangeOffRequestEmployment();
      await checkLeaveRequestEmployment();
      await checkChangeShiftRequestEmployment();
      await checkLeaveHolEmployment();
    } catch (error) {
      console.log(error);
    }
  },
  {
    scheduled: true,
    timezone: "Asia/Makassar", // set timezone to WITA
  }
);

async function execute() {
  try {
    await addAbsentToAllEmployment();
    changeScheduleTime();
    await checkOffDayEmployment();
    await checkChangeOffRequestEmployment();
    await checkLeaveRequestEmployment();
    await checkChangeShiftRequestEmployment();
    await checkLeaveHolEmployment();
  } catch (error) {
    console.log(error);
  }
}

// execute();

const Attedance = require("../attedance/model");
const Employment = require("../employee/model");
const { dateToday, getDayName } = require("../attedance/controller");

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

(async () => {
  try {
    await addAbsentToAllEmployment();
  } catch (error) {
      console.log(error);
  }
})();
const Salary = require("../salary/model");

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

  module.exports = {
    calculateAttendanceAbsent,
  };
  
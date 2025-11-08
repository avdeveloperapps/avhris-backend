const Employment = require("./model");
const fs = require("fs");
const Salary = require("../salary/model");
const Company = require("../company/model");
const Shift = require("../workshift/model");
const LeaveRequest = require("../leave-request/model");
const OvertimeRequest = require("../overtime-request/model");
const OutsideRequest = require("../outside-request/model");
const ChangeWorkshift = require("../emp-change-workshift/model");
const ChangeOffDay = require("../off-day/model");
const Warning = require("../emp-warning/model");
const Attendance = require("../attedance/model");
const Payroll = require("../payrun/model");
const Experience = require("../experience/model");
const Allowance = require("../emp-allowance/model");
const Deduction = require("../emp-deduction/model");
const Education = require("../education/model");
const Bank = require("../bank/model");
const { calculateAttendanceAbsent } = require("../corn/index");
const { dateToday, getDayName } = require("../attedance/controller");

module.exports = {
  addEmployement: async (req, res) => {
    try {
      const { role, email: adminEmail } = req.admin;
      const {
        username,
        password,
        emp_firstname,
        emp_lastname,
        emp_nikktp,
        email,
        emp_phone,
        emp_gender,
        emp_marital_status,
        emp_birthday,
        emp_blood,
        emp_nik_karyawan,
        emp_tanggungan,
        emp_depid,
        emp_desid,
        emp_status,
        emp_fsuperior,
        emp_ssuperior,
        emp_hr,
        emp_location,
        emp_work_location,
        attadance,
        basic_salary,
      } = req.body;
      const parsingtoJson = JSON.parse(basic_salary);
      const checkDuplicateEmail = await Employment.findOne({ email });
      const checkDuplicateNIKKtp = await Employment.findOne({ emp_nikktp });
      const checkDuplicateUsername = await Employment.findOne({ username });
      if (!email) {
        return res.status(422).json({
          message: `Email is Required`,
        });
      }
      if (checkDuplicateEmail) {
        return res.status(422).json({
          message: `${email} has been used, please select another email`,
        });
      }
      // if (checkDuplicateNIKKtp) {
      //   return res.status(422).json({
      //     message: `NIK KTP should not be duplicate, please enter another NIK KTP`,
      //   });
      // }
      if (checkDuplicateUsername) {
        return res.status(422).json({
          message: `${username} has been used, please select another username`,
        });
      }

      function parseAndReplaceEmptyShift(data) {
        const parsedData = JSON.parse(data);
        Object.keys(parsedData).forEach((day) => {
          if (parsedData[day].shift === "") {
            parsedData[day].shift = null;
          }
        });
        return parsedData;
      }

      let company_id = "";
      if (emp_work_location && adminEmail === "admin@mtp") {
        company_id = emp_work_location;
      } else if (role === "Super Admin " || role === "Group Admin") {
        company_id = req.query.company;
      } else {
        company_id = req.admin.company_id;
      }

      const newEmployment = new Employment({
        company_id,
        emp_profile: req.file ? req.file?.filename : null,
        username,
        password,
        email,
        emp_firstname,
        emp_lastname,
        emp_fullname: `${emp_firstname} ${emp_lastname}`,
        emp_nikktp,
        emp_phone,
        emp_gender,
        emp_marital_status,
        emp_birthday,
        emp_blood,
        emp_nik_karyawan,
        emp_depid,
        emp_desid,
        emp_status,
        emp_fsuperior,
        emp_ssuperior,
        emp_location,
        emp_tanggungan,
        emp_hr,
        emp_attadance: parseAndReplaceEmptyShift(attadance),
      });
      await newEmployment.save().then(async (emp) => {
        if (parsingtoJson?.emp_salary) {
          const salary = new Salary({ ...parsingtoJson, emp_id: emp._id });
          await salary
            .save()
            .then(() => console.log("success added salary"))
            .catch((err) => console.log(err));
        }
        const chekcAttendanceToday = await Attendance.findOne({
          emp_id: emp?._id,
          attendance_date: dateToday(),
        });
        const findEmployment = await Employment.findOne({
          _id: emp?._id,
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
            break_in: "-",
            break_out: "-",
            attendance_date: dateToday(),
            workhours: "-",
            behavior_break: "-",
            count_lateduration: 0,
            count_breakduration: 0,
            attendance_status: `Absent`,
            type: "Auto",
            behavior_at: "-",
            attendance_deduction: await calculateAttendanceAbsent(emp),
            break_deduction: 0,
          };
          const attendance = new Attendance(payload);
          await attendance
            .save()
            .then(() => console.log("berhasil menambahkan attedance karyawan"));
        }
      });
      return res.json({ message: "Successfully created a new Employment" });
    } catch (error) {
      if (req?.file) {
        fs.unlinkSync(`public/uploads/${req.file.filename}`);
      }
      console.log(error);
      return res.status(500).json({
        message: "Failed to Add new Employment | Internal Server Error",
        error,
      });
    }
  },
  getEmployment: async (req, res) => {
    try {
      const { role } = req.admin;
      const company_id = req.query.company;
      // role === "Super Admin " || role === "Group Admin"
      // ? req.query.company
      // : req.admin.company_id;
      const employment = await Employment.find({
        company_id,
      })
        .select(
          "company_id emp_fullname emp_desid emp_depid emp_status emp_profile"
        )
        .populate({ path: "company_id", select: "company_name" })
        .populate({ path: "emp_depid", select: "dep_name dep_workshift" })
        .populate({
          path: "emp_status",
          select: "empstatus_name empstatus_color",
        })
        .populate({ path: "emp_desid", select: "des_name" });
      return res.status(200).json(employment);
    } catch (error) {
      res.status(500).json({ message: "Failed to Get Employment" });
    }
  },
  deleteEmployment: async (req, res) => {
    try {
      const { role } = req.admin;
      const company_id =
        role === "Super Admin " || role === "Group Admin"
          ? req.query.company
          : req.admin.company_id;
      const employment = await Employment.deleteOne({
        _id: req.params.id,
      });
      if (employment?.deletedCount > 0) {
        await LeaveRequest.deleteMany({ emp_id: req.params.id });
        await OvertimeRequest.deleteMany({ emp_id: req.params.id });
        await OutsideRequest.deleteMany({ emp_id: req.params.id });
        await ChangeWorkshift.deleteMany({ emp_id: req.params.id });
        await ChangeOffDay.deleteMany({ emp_id: req.params.id });
        await Warning.deleteMany({ emp_id: req.params.id });
        await Education.deleteMany({ emp_id: req.params.id });
        await Experience.deleteMany({ emp_id: req.params.id });
        await Attendance.deleteMany({ emp_id: req.params.id });
        await Deduction.deleteMany({ emp_id: req.params.id });
        await Allowance.deleteMany({ emp_id: req.params.id });
        await Bank.deleteMany({ emp_id: req.params.id });
        await Payroll.deleteMany({ emp_id: req.params.id });
        await Salary.deleteMany({ emp_id: req.params.id });
        return res
          .status(200)
          .json({ message: "Sucessfully Deleted Employment" });
      }
      // return res.status(200).json(employment);
      return res.status(422).json({ message: "Failed to Delete Employment" });
    } catch (error) {
      res.status(500).json({ message: "Failed to Delete Employment" });
    }
  },
  detailEmployment: async (req, res) => {
    try {
      const { id } = req.params;
      const employment = await Employment.findOne({
        _id: id,
      })
        .populate({ path: "company_id", select: "company_name" })
        .populate({ path: "emp_depid", select: "dep_name dep_workshift" })
        .populate(
          "emp_attadance.senin.shift emp_attadance.selasa.shift emp_attadance.rabu.shift emp_attadance.kamis.shift emp_attadance.jumat.shift emp_attadance.sabtu.shift emp_attadance.minggu.shift"
        )
        .populate({ path: "emp_fsuperior" })
        .populate({ path: "emp_ssuperior" })
        .populate({ path: "emp_hr" })
        .populate({
          path: "emp_status",
          select: "empstatus_name empstatus_color",
        })
        .populate({ path: "emp_desid", select: "des_name" })
        .populate({ path: "emp_location", select: "loc_name _id" });
      return res.status(200).json(employment);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Failed to Get Employment" });
    }
  },
  editPesonalDetail: async (req, res) => {
    try {
      const { role } = req.admin;
      const {
        emp_firstname,
        emp_lastname,
        emp_nikktp,
        email,
        emp_phone,
        emp_gender,
        emp_marital_status,
        emp_birthday,
        emp_blood,
      } = req.body;
      const { id } = req.params;
      const findEmployment = await Employment.findOne({ _id: id });
      // cek duplicate jika employment memperbarui email
      if (email !== findEmployment?.email) {
        const findDuplicateEmail = await Employment.findOne({ email });
        if (!findDuplicateEmail) {
          const newEmployment = await Employment.updateOne(
            { _id: id },
            {
              $set: {
                emp_profile: req.file
                  ? req.file?.filename
                  : findEmployment.emp_profile,
                email,
                emp_firstname,
                emp_lastname,
                emp_fullname: `${emp_firstname} ${emp_lastname}`,
                emp_nikktp,
                emp_phone,
                emp_gender,
                emp_marital_status,
                emp_birthday,
                emp_blood,
              },
            }
          );
          if (newEmployment.modifiedCount > 0) {
            return res.json({
              message: "Successfully updated this Employment",
            });
          } else {
            return res.json({ message: "No data changed" });
          }
        } else {
          return res
            .status(422)
            .json({ message: "Failed to update, Your email has been used" });
        }
      } else {
        const newEmployment = await Employment.updateOne(
          { _id: id },
          {
            $set: {
              emp_profile: req.file
                ? req.file?.filename
                : findEmployment.emp_profile,
              email,
              emp_firstname,
              emp_lastname,
              emp_fullname: `${emp_firstname} ${emp_lastname}`,
              emp_nikktp,
              emp_phone,
              emp_gender,
              emp_marital_status,
              emp_birthday,
              emp_blood,
            },
          }
        );
        if (newEmployment.modifiedCount > 0) {
          return res.json({ message: "Successfully updated Employment" });
        } else {
          return res.json({ message: "No data changed" });
        }
      }
      // return res.status(500).json({ message: "Failed to Add new Employment" });
    } catch (error) {
      console.log(error);
      if (req?.file) {
        console.log(error);
        fs.unlinkSync(`public/uploads/${req.file.filename}`);
      }
      return res.status(500).json({ message: "Failed to Update Employment" });
    }
  },
  editCutiDetail: async (req, res) => {
    try {
      const { amount } = req.body;
      const { id } = req.params;
      const newEmployment = await Employment.updateOne(
        { _id: id },
        {
          $set: {
            emp_leave_token: amount,
          },
        }
      );
      if (newEmployment.modifiedCount > 0) {
        return res.json({
          message: "Successfully updated this Employment",
        });
      } else {
        return res.json({ message: "No data changed" });
      }
    } catch (error) {
      return res.status(500).json({ message: "Failed to Update Employment" });
    }
  },

  uploadPhoto: async (req, res) => {
    try {
      console.log(req.files);
      if (req.files.length > 0) {
        return res.status(200).json({
          message: "Successfully upload files",
          data: req.files.map((file) => file?.filename),
        });
      } else {
        return res.status(422).json({ message: "No files uploaded" });
      }
    } catch (error) {
      if (req?.file) {
        fs.unlinkSync(`public/uploads/${req.file.filename}`);
      }
      return res.status(500).json({ message: "Failed to upload files" });
    }
  },
  editEmploymentDetail: async (req, res) => {
    try {
      const { role } = req.admin;
      const {
        username,
        emp_nik_karyawan,
        emp_depid,
        emp_desid,
        emp_status,
        emp_tanggungan,
        emp_fsuperior,
        emp_ssuperior,
        emp_hr,
        emp_location,
      } = req.body;
      const { id } = req.params;
      const findEmployment = await Employment.findOne({ _id: id });
      // cek duplicate jika employment memperbarui email
      if (username !== findEmployment?.username) {
        const findDuplicateUsername = await Employment.findOne({ username });
        if (!findDuplicateUsername) {
          const newEmployment = await Employment.updateOne(
            { _id: id },
            {
              $set: {
                username,
                emp_nik_karyawan,
                emp_depid,
                emp_desid,
                emp_status,
                emp_tanggungan,
                emp_fsuperior,
                emp_ssuperior,
                emp_location,
                emp_hr,
              },
            }
          );
          if (newEmployment.modifiedCount > 0) {
            return res.json({
              message: "Successfully updated this Employment",
            });
          } else {
            return res.json({ message: "No data changed" });
          }
        } else {
          return res
            .status(422)
            .json({ message: "Failed to update, Your username has been used" });
        }
      } else {
        const newEmployment = await Employment.updateOne(
          { _id: id },
          {
            $set: {
              username,
              emp_nik_karyawan,
              emp_depid,
              emp_desid,
              emp_status,
              emp_tanggungan,
              emp_fsuperior,
              emp_ssuperior,
              emp_hr,
              emp_location,
            },
          }
        );
        if (newEmployment.modifiedCount > 0) {
          return res.json({ message: "Successfully updated Employment" });
        } else {
          return res.json({ message: "No data changed" });
        }
      }
      // return res.status(500).json({ message: "Failed to Add new Employment" });
    } catch (error) {
      return res.status(500).json({ message: "Failed to Update Employment" });
    }
  },
  editWorkShift: async (req, res) => {
    try {
      const { role } = req.admin;
      const { id } = req.params;
      if (
        role === "Super Admin" ||
        role === "App Admin" ||
        role === "Group Admin"
      ) {
        const newEmployment = await Employment.updateOne(
          { _id: id },
          {
            $set: {
              emp_attadance: {
                ...req.body,
              },
            },
          }
        );
        if (newEmployment.modifiedCount > 0) {
          return res.json({
            message: "Successfully updated shift this Employment",
          });
        }
      } else {
        return res.status(422).json({ message: "No data changed" });
      }
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ message: "Failed to Update Shift Employment" });
    }
  },
  getAllWorkShiftEmployment: async (req, res) => {
    try {
      const { id } = req.params;
      const findEmployment = await Employment.findOne({ _id: id });
      const findCompanyOfUser = await Company.findOne({
        _id: findEmployment.company_id,
      });
      const getAllShiftInCompany = await Shift.find({
        company_id: findCompanyOfUser._id,
      }).select("_id shift_desc");
      return res.status(200).json(getAllShiftInCompany);
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ message: "Failed to get all Shift your company" });
    }
  },
  changeProfile: async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.admin;

      const updateProfile = await Employment.updateOne(
        { _id: id },
        {
          $set: {
            emp_profile: req?.file?.filename,
          },
        }
      );
      console.log(id);
      return res
        .status(200)
        .json({ message: "Successfully to update profile" });
    } catch (error) {
      console.log(error);
      if (req?.file) {
        fs.unlinkSync(`public/uploads/${req.file.filename}`);
      }
      return res.status(500).json({ message: "Failed to upload profile" });
    }
  },
  editStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const updateStatus = await Employment.updateOne(
        { _id: id },
        {
          $set: {
            ...req.body,
          },
        }
      );
      if (updateStatus?.modifiedCount > 0) {
        return res.status(200).json({ message: "Succesfully edit status" });
      }
      return res
        .status(422)
        .json({ message: "Opps No field change, Please try again!" });
    } catch (error) {
      return res.status(500).json({ message: "Failed edit status" });
    }
  },
  resetPassword: async (req, res) => {
    try {
      const { role } = req.admin;
      const { id } = req.params;
      if (
        role === "Super Admin" ||
        role === "App Admin" ||
        role === "Group Admin"
      ) {
        const updateStatus = await Employment.updateOne(
          { _id: id },
          {
            $set: {
              ...req.body,
            },
          }
        );
        if (updateStatus?.modifiedCount > 0) {
          return res
            .status(200)
            .json({ message: "Succesfully Reset Password" });
        }
        return res
          .status(422)
          .json({ message: "Opps No field change, Please try again!" });
      }
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Failed Reset Password Employment" });
    }
  },
  async updatePayrunType(req, res) {
    try {
      const { id } = req.params;
      const findEmployee = await Employment.findById(id);
      if (!findEmployee) {
        return res.status(404).send({ message: "Employee not found" });
      } else {
        await Employment.updateOne(
          { _id: id },
          {
            $set: {
              payrun_type: req.body.payrun_type,
            },
          }
        );
        return res.status(200).send({
          data: findEmployee._doc,
          message: "Updated payrun type employee",
        });
      }
    } catch (error) {
      return res.status(500).send(error);
    }
  },
  async updatePayrunStatus(req, res) {
    try {
      const id = req.params.id;
      const findEmployee = await Employment.findById(id);
      if (!findEmployee) {
        return res.status(404).send({ message: "Employee not found" });
      } else {
        await Employment.updateOne(
          { _id: id },
          {
            $set: {
              payrun_status: req.body.status,
            },
          }
        );
        return res.status(200).send({
          message: "Updated payrun status employee",
        });
      }
    } catch (error) {
      return res.status(500).send(error);
    }
  },
};

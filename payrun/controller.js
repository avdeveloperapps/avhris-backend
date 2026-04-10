const Payrun = require("./model");
const Employment = require("../employee/model");
const Payrol = require("../salary/model");
const Allowance = require("../emp-allowance/model");
const Deduction = require("../emp-deduction/model");
const Periodic = require("../periodic/model");
const Attendance = require("../attedance/model");
const moment = require("moment");
const pdf = require("html-pdf");
const Overtime = require("../overtime-request/model");
const pdfTemplate = require("../documents/document");
const { deleteObject, getPublicUrl, isR2Configured, uploadBuffer } = require(
  "../utils/r2"
);

function handleCalender(periodic_start_date, periodic_end_date, formatDate) {
  let currentDate = moment(periodic_start_date);
  const end = moment(periodic_end_date);
  const dates = [];

  if (formatDate === "MM/DD/YYYY") {
    while (currentDate <= end) {
      dates.push({
        show_date: currentDate.format("DD MMM"),
        date: currentDate.format("MM/DD/YYYY"),
      });
      currentDate = currentDate.add(1, "days");
    }
  } else {
    while (currentDate <= end) {
      dates.push({
        show_date: currentDate.format("DD MMM"),
        date: currentDate.format("YYYY-MM-DD"),
      });
      currentDate = currentDate.add(1, "days");
    }
  }
  return dates;
}

module.exports = {
  generatePayrun: async (req, res) => {
    try {
      const company_id = req.query.company_id;
      const employments = await Employment.find({ company_id })
        .select("_id emp_fullname emp_depid")
        .populate({
          path: "emp_depid",
          select: "dep_name",
        });
      const periodic_active = await Periodic.findOne({
        company_id,
        _id: req.query.periodic_id,
      });
      if (!periodic_active) {
        return res.status(422).json({
          message: `Failed generated payrun | You dont't have periodic`,
        });
      }
      const getDatePeriodicAttendance = handleCalender(
        periodic_active?.periodic_start_date,
        periodic_active?.periodic_end_date,
        "MM/DD/YYYY"
      );
      const promises = employments.map(async (employment) => {
        const salary = await Payrol.findOne({ emp_id: employment?._id });
        const allowance = await Allowance.find({
          emp_id: employment?._id,
        }).populate("empallow_allowance_id");

        const attendances = await Attendance.find({
          emp_id: employment?._id,
        });

        const filteredAttendances = attendances.filter((attendance) => {
          return getDatePeriodicAttendance.some(
            (period) => period.date === attendance.attendance_date
          );
        });

        const AttendanceStatus = filteredAttendances.filter(
          (attendance) => attendance?.attendance_status === "Attendance"
        );

        const emp_allowance = allowance.map((allow) => {
          if (allow?.empallow_allowance_type === "Proposional") {
            return {
              total:
                (+allow?.empallow_allowance_amount / salary?.emp_working_days) *
                  AttendanceStatus?.length +
                allow?.empallow_allowance_additional,
              name: allow?.empallow_allowance_id?.ad_name,
              percent: false,
              allow_id: allow?._id,
              edit: false,
            };
          } else {
            return {
              total: +allow?.empallow_allowance_amount || 0,
              name: allow?.empallow_allowance_id?.ad_name,
              percent: false,
              allow_id: allow?._id,
              edit: false,
            };
          }
        });

        const total_emp_allowance = emp_allowance.reduce(
          (total, allow) => total + allow?.total,
          0
        );

        const deduction = await Deduction.find({
          emp_id: employment?._id,
        }).populate("deduction_id");

        const filterDeductionEmployment = deduction.map((deduction) => ({
          total: Number(deduction?.deduction_totalpercent || 0),
          name: deduction?.deduction_id?.ad_name,
          percent: true,
          deduct_id: deduction?._id,
          edit: false,
        }));

        const totalPercentDeduction = filterDeductionEmployment.reduce(
          (total, value) => total + value?.total,
          0
        );

        const AllowanceCompanyFromDeduc = deduction
          .filter((deduc) => +deduc?.deduction_companypercent > 0)
          .map((deduction) => ({
            total: Number(deduction?.deduction_companypercent || 0),
            name: deduction?.deduction_id?.ad_name,
            percent: true,
            deduction_id: deduction?._id,
          }));

        const totalPercentCompanyAllow = AllowanceCompanyFromDeduc.reduce(
          (total, value) => total + value?.total,
          0
        );

        const total_allowance_company =
          (totalPercentCompanyAllow / 100) * salary?.emp_salary;

        const totalDeductionAbsent = filteredAttendances.reduce(
          (total, attendance) =>
            total + Number(attendance?.attendance_deduction),
          0
        );

        const getDatePeriodicOvertime = handleCalender(
          periodic_active?.periodic_start_date,
          periodic_active?.periodic_end_date,
          "YYYY-MM-DD"
        );

        const overtime = await Overtime.find({
          emp_id: employment?._id,
          "overtime_hr.status": "Approved",
        });

        const total_amount_overtime = overtime
          .filter((over) => {
            return getDatePeriodicOvertime.some(
              (period) => period.date === over?.overtime_created
            );
          })
          .reduce((total, overtime) => total + +overtime?.overtime_amount, 0);

        const total_deduction =
          (totalPercentDeduction / 100) * salary?.emp_salary;

        const payrun_total_allowance =
          total_emp_allowance +
          total_amount_overtime +
          Math.round(total_allowance_company);

        const payrun_net_salary =
          (salary?.emp_salary || 0) +
          payrun_total_allowance -
          (totalDeductionAbsent + total_deduction);

        const payload = {
          company_id: company_id,
          emp_id: employment?._id,
          payrun_type_period: salary?.emp_periode || "Bulan",
          payrun_salary: salary?.emp_salary || 0,
          payrun_allowance: [...emp_allowance, ...AllowanceCompanyFromDeduc],
          payrun_deduction: filterDeductionEmployment,
          payrun_total_allowance,
          payrun_total_deduction: Math.round(total_deduction) || 0,
          payrun_net_salary,
          payrun_period: periodic_active?._id,
          payrun_total_deduct_attendance: totalDeductionAbsent,
          payrun_total_overtime: total_amount_overtime,
        };
        const checkEmploymentPayrun = await Payrun.findOne({
          emp_id: employment?._id,
          payrun_period: periodic_active?._id,
        });
        if (!checkEmploymentPayrun) {
          const payrun = new Payrun(payload);
          await payrun.save();
        } else if (checkEmploymentPayrun) {
          // console.log("ada");
          const updatePayrun = await Payrun.updateOne(
            { emp_id: employment?._id, payrun_periodic: periodic_active?._id },
            {
              $set: {
                ...payload,
              },
            }
          );
        }
      });

      Promise.all(promises).then(async () => {
        const payruns = await Payrun.find({ company_id });
        return res.status(200).json({
          message: `Succesfully generated payrun for periodic ${periodic_active?.periodic_month} ${periodic_active?.periodic_years}`,
        });
      });
      //   console.log(employments);/
    } catch (error) {
      console.log(error);
      return res
        .status(422)
        .json({ message: `Failed generated payrun | Internal server error ` });
    }
  },
  getPayrun: async (req, res) => {
    try {
      const { role } = req.admin;
      const company_id =
        role === "Super Admin " || role === "Group Admin"
          ? req.query.company_id
          : req.admin.company_id;
      const payrun = await Payrun.find({
        company_id,
        payrun_period: req.query.periodic_id,
      })
        .populate({
          path: "emp_id",
          select: "emp_fullname _id emp_depid emp_desid email",
          populate: [
            {
              path: "emp_depid",
              select: "dep_name",
            },
            {
              path: "emp_desid",
              select: "des_name",
            },
          ],
        })
        .populate({
          path: "payrun_period",
        });
      return res.status(200).send({ data: payrun });
    } catch (error) {
      return res.status(500).send(error);
    }
  },
  editStatusPayrun: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.query;
      let payrunStatus;
      if (status === "Approve Finance") {
        payrunStatus = "Approve";
      } else if (status === "Pending") {
        payrunStatus = "Pending";
      } else if (status === "Cancel Payrun") {
        payrunStatus = "Cancel";
      }
      const updateStatusPayrun = await Payrun.updateOne(
        {
          _id: id,
        },
        { $set: { payrun_status: payrunStatus } }
      );
      if (updateStatusPayrun.modifiedCount > 0) {
        return res.status(200).json({
          message: `Succesfully updated payrun status`,
        });
      } else {
        return res.status(422).json({
          message: `Failed updated payrun status`,
        });
      }
    } catch (error) {
      return res.status(422).json({
        message: `Failed edit status payrun | Internal server error `,
      });
    }
  },
  recalculatePayrun: async (req, res) => {
    try {
      const { role } = req.admin;
      const company_id =
        role === "Super Admin " || role === "Group Admin"
          ? req.query.company_id
          : req.admin.company_id;
      const { id } = req.params;
      const periodic_active = await Periodic.findOne({
        company_id,
        _id: req.query.periodic_id,
      });
      if (!periodic_active) {
        return res.status(422).json({
          message: `Failed generated payrun | You dont't have periodic`,
        });
      }
      const getDatePeriodicAttendance = handleCalender(
        periodic_active?.periodic_start_date,
        periodic_active?.periodic_end_date,
        "MM/DD/YYYY"
      );
      const payrun = await Payrun.findOne({ _id: id });
      const employment = await Employment.findOne({ _id: payrun?.emp_id });
      const salary = await Payrol.findOne({ emp_id: employment?._id });
      const allowance = await Allowance.find({
        emp_id: employment?._id,
      }).populate("empallow_allowance_id");

      const attendances = await Attendance.find({
        emp_id: employment?._id,
      });

      const filteredAttendances = attendances.filter((attendance) => {
        return getDatePeriodicAttendance.some(
          (period) => period.date === attendance.attendance_date
        );
      });
      const AttendanceStatus = filteredAttendances.filter(
        (attendance) => attendance?.attendance_status === "Attendance"
      );

      const emp_allowance = allowance.map((allow) => {
        if (allow?.empallow_allowance_type === "Proposional") {
          return {
            total:
              (+allow?.empallow_allowance_amount / salary?.emp_working_days) *
              AttendanceStatus?.length,
            name: allow?.empallow_allowance_id?.ad_name,
            percent: false,
            allow_id: allow?._id,
            edit: false,
          };
        } else {
          return {
            total: +allow?.empallow_allowance_amount || 0,
            name: allow?.empallow_allowance_id?.ad_name,
            percent: false,
            allow_id: allow?._id,
            edit: false,
          };
        }
      });
      const total_emp_allowance = emp_allowance.reduce(
        (total, allow) => total + allow?.total,
        0
      );

      const deduction = await Deduction.find({
        emp_id: employment?._id,
      }).populate("deduction_id");

      const filterDeductionEmployment = deduction.map((deduction) => ({
        total: Number(deduction?.deduction_totalpercent || 0),
        name: deduction?.deduction_id?.ad_name,
        percent: true,
        deduct_id: deduction?._id,
        edit: false,
      }));
      const totalPercentDeduction = filterDeductionEmployment.reduce(
        (total, value) => total + value?.total,
        0
      );
      const AllowanceCompanyFromDeduc = deduction
        .filter((deduc) => +deduc?.deduction_companypercent > 0)
        .map((deduction) => ({
          total: Number(deduction?.deduction_companypercent || 0),
          name: deduction?.deduction_id?.ad_name,
          percent: true,
          deduction_id: deduction?._id,
        }));
      const totalPercentCompanyAllow = AllowanceCompanyFromDeduc.reduce(
        (total, value) => total + value?.total,
        0
      );
      const total_allowance_company =
        (totalPercentCompanyAllow / 100) * salary?.emp_salary;

      const totalDeductionAbsent = filteredAttendances.reduce(
        (total, attendance) => total + Number(attendance?.attendance_deduction),
        0
      );

      const getDatePeriodicOvertime = handleCalender(
        periodic_active?.periodic_start_date,
        periodic_active?.periodic_end_date,
        "YYYY-MM-DD"
      );

      const overtime = await Overtime.find({
        emp_id: employment?._id,
        "overtime_hr.status": "Approved",
      });
      const total_amount_overtime = overtime
        .filter((over) => {
          return getDatePeriodicOvertime.some(
            (period) => period.date === over?.overtime_created
          );
        })
        .reduce((total, overtime) => total + +overtime?.overtime_amount, 0);

      const payrun_net_salary =
        (salary?.emp_salary || 0) +
        total_emp_allowance -
        totalDeductionAbsent +
        total_amount_overtime +
        Math.round(total_allowance_company);
      const total_deduction =
        (totalPercentDeduction / 100) * salary?.emp_salary;

      const payrun_total_allowance =
        total_emp_allowance +
        total_amount_overtime +
        Math.round(total_allowance_company);
      const payload = {
        company_id: company_id,
        emp_id: employment?._id,
        payrun_type_period: salary?.emp_periode || "Bulan",
        payrun_salary: salary?.emp_salary || 0,
        payrun_allowance: [...emp_allowance, ...AllowanceCompanyFromDeduc],
        payrun_deduction: filterDeductionEmployment,
        payrun_total_allowance,
        payrun_total_deduction: Math.round(total_deduction) || 0,
        payrun_net_salary,
        payrun_period: periodic_active?._id,
        payrun_total_deduct_attendance: totalDeductionAbsent,
        payrun_total_overtime: total_amount_overtime,
      };
      const updatePayrun = await Payrun.updateOne(
        { _id: id },
        {
          $set: {
            ...payload,
          },
        }
      );
      if (updatePayrun.modifiedCount > 0) {
        return res.status(200).json({
          message: "Succesfully Recalculate Payrun",
        });
      } else {
        return res.status(422).json({
          message: "This Payrun Already up to date",
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(422).json({
        message: `Failed Recalculate payrun | Internal server error `,
      });
    }
  },
  editDataPayslip: async (req, res) => {
    try {
      const {
        payrun_net_salary,
        payrun_total_allowance,
        payrun_total_deduction,
        payrun_allowance,
        payrun_deduction,
        payrun_total_deduct_attendance,
        payrun_type,
      } = req.body;
      const payrun = await Payrun.updateOne(
        { _id: req.params.id },
        {
          $set: {
            payrun_net_salary,
            payrun_allowance,
            payrun_deduction,
            payrun_total_allowance,
            payrun_total_deduction,
            payrun_total_deduct_attendance,
            payrun_type,
          },
        }
      );
      if (payrun.modifiedCount > 0) {
        return res.status(200).json({
          message: "Succesfully Edited Payrun",
        });
      } else {
        return res.status(422).json({
          message: "This Payrun Already up to date",
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(422).json({
        message: `Failed Edit Payslip | Internal server error `,
      });
    }
  },
  handleUploadFile: async (req, res) => {
    try {
      const payrun = await Payrun.findOne({ _id: req.params.id }).populate(
        "emp_id"
      );
      if (!req.file?.filename) {
        return res.status(422).json({
          message: `Failed Send Payslip to ${payrun?.emp_id?.emp_fullname || "employment"}`,
        });
      }

      await uploadBuffer({
        folder: "files",
        fileName: req.file.filename,
        buffer: req.file.buffer,
        contentType: req.file.mimetype,
      });

      const updateFilePdf = await Payrun.updateOne(
        { _id: req.params.id },
        {
          $set: {
            payrun_file: req.file.filename,
          },
        }
      );
      if (updateFilePdf.modifiedCount > 0 && payrun?.payrun_file) {
        await deleteObject("files", payrun.payrun_file).catch((error) => {
          console.log("failed to delete old payrun file", error.message);
        });
        return res.status(200).json({
          message: `Succesfully Resend Payslip to ${payrun.emp_id?.emp_fullname}`,
        });
      } else if (updateFilePdf.modifiedCount > 0) {
        return res.status(200).json({
          message: `Succesfully Send Payslip to ${payrun.emp_id?.emp_fullname}`,
        });
      } else {
        return res.status(422).json({
          message: `Failed Send Payslip to ${payrun.emp_id?.emp_fullname}`,
        });
      }
      // return res.status(200).json({ message: "tes" });
    } catch (error) {
      if (req.file?.filename) {
        await deleteObject("files", req.file.filename).catch(() => null);
      }
      return res.status(422).json({
        message: `Failed Send Payslip to employment`,
      });
    }
  },
  generatePdfFile: async (req, res) => {
    try {
      const payrun = await Payrun.findOne({ _id: req.params.id })
        .populate({
          path: "emp_id",
          populate: [
            {
              path: "emp_depid",
              select: "dep_name",
            },
            {
              path: "emp_desid",
              select: "des_name",
            },
          ],
        })
        .populate("payrun_period")
        .populate("company_id");

      if (!payrun) {
        return res.status(404).send({ message: "Payrun not found" });
      }

      const pdfName = `${payrun.emp_id.emp_fullname.replace(/\s/g, "")}_${
        payrun.payrun_period.periodic_month
      }_${payrun.payrun_period.periodic_years}_${Date.now()}.pdf`;
      const options = {
        format: "A4",
        orientation: "portrait",
      };

      pdf.create(pdfTemplate(payrun), options).toBuffer(async (err, buffer) => {
        if (err) {
          return res.status(400).send(err);
        }

        try {
          await uploadBuffer({
            folder: "files",
            fileName: pdfName,
            buffer,
            contentType: "application/pdf",
          });

          const updateFilePdf = await Payrun.updateOne(
            { _id: req.params.id },
            {
              $set: {
                payrun_file: pdfName,
              },
            }
          );

          if (updateFilePdf.modifiedCount > 0 && payrun?.payrun_file) {
            await deleteObject("files", payrun.payrun_file).catch((error) => {
              console.log("failed to delete old payrun file", error.message);
            });
            return res.status(200).send({
              message: `Succesfully Resend Payslip to ${payrun.emp_id.emp_fullname}`,
              data: payrun,
              fileName: pdfName,
            });
          } else if (updateFilePdf.modifiedCount > 0) {
            return res.status(200).send({
              message: `Succesfully Send Payslip to ${payrun.emp_id.emp_fullname}`,
              data: payrun,
              fileName: pdfName,
            });
          } else {
            await deleteObject("files", pdfName).catch(() => null);
            return res.status(422).send({
              message: `Failed Send Payslip to ${payrun.emp_id.emp_fullname}`,
              data: payrun,
              fileName: pdfName,
            });
          }
        } catch (uploadError) {
          return res.status(500).send(uploadError);
        }
      });
    } catch (error) {
      return res.status(500).send(error);
    }
  },
  downloadPdfFile: async (req, res) => {
    try {
      const payrun = await Payrun.findOne({ _id: req.params.id }).populate(
        "emp_id"
      );

      if (!payrun) {
        return res.status(404).send({ message: "Payrun not found" });
      }
      const fileName = payrun.payrun_file;
      if (!fileName) {
        return res.status(404).send({ message: "Payrun file not found" });
      }

      if (isR2Configured()) {
        return res.redirect(getPublicUrl("files", fileName));
      }

      return res.status(500).send({ message: "R2 is not configured" });
    } catch (error) {
      console.log(error);
      return res.status(500).send(error);
    }
  },
};

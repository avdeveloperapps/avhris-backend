const AssignLeave = require("./model");
const Employment = require("../employee/model");
const Request = require("../request/model");
const jwt = require("jsonwebtoken");
const Departement = require("./model");
const { deleteObject, uploadBuffer } = require("../utils/r2");
// function getFormattedDateTime() {
//   const date = new Date();
//   const year = date.getFullYear();
//   const month = ("0" + (date.getMonth() + 1)).slice(-2);
//   const day = ("0" + date.getDate()).slice(-2);
//   let hour = date.getHours();
//   const amPm = hour >= 12 ? "PM" : "AM";
//   hour = ("0" + (hour % 12 || 12)).slice(-2);
//   const minute = ("0" + date.getMinutes()).slice(-2);

//   return `${year}-${month}-${day} ${hour}:${minute} ${amPm}`;
// }

function getFormattedDateTime() {
  const date = new Date();
  const year = date.getFullYear();
  const month = ("0" + (date.getMonth() + 1)).slice(-2);
  const day = ("0" + date.getDate()).slice(-2);
  let hour = date.getHours();
  const minute = ("0" + date.getMinutes()).slice(-2);
  const amPm = hour >= 12 ? "PM" : "AM";

  if (hour < 10) {
    hour = "0" + hour;
  }

  return `${year}-${month}-${day} ${hour}:${minute} ${amPm}`;
}

async function uploadAttachments(files = []) {
  const uploadedFiles = [];

  for (const file of files) {
    await uploadBuffer({
      folder: "uploads",
      fileName: file.filename,
      buffer: file.buffer,
      contentType: file.mimetype,
    });
    uploadedFiles.push(file.filename);
  }

  return uploadedFiles;
}

async function cleanupAttachments(files = []) {
  await Promise.all(
    files.filter(Boolean).map((fileName) =>
      deleteObject("uploads", fileName).catch((error) => {
        console.log("failed to cleanup leave attachment", fileName, error.message);
      })
    )
  );
}

module.exports = {
  getFormattedDateTime,
  addLeaveRequest: async (req, res) => {
    let uploadedAttachments = [];
    try {
      const {
        emp_id,
        empleave_type_id,
        empleave_leave_type,
        empleave_start_date,
        empleave_end_date,
        empleave_leave_duration,
        empleave_apply_date,
        empleave_reason,
        empleave_status = "Pending",
        empleave_start_hours,
        empleave_end_hours,
      } = req.body;
      const token = req.headers.authorization.split(" ")[1];
      const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
      const { role } = decodedToken;
      const company_id = req.query.company_id;
      uploadedAttachments = await uploadAttachments(req.files || []);
      if (
        role === "Super Admin" ||
        role === "App Admin" ||
        role === "Group Admin"
      ) {
        const employement = await Employment.findOne({ _id: emp_id });
        const payload = {
          company_id,
          emp_id,
          empleave_type_id,
          empleave_leave_type,
          empleave_start_date,
          empleave_end_date,
          empleave_leave_duration,
          empleave_apply_date,
          empleave_reason,
          empleave_status,
          empleave_attachement: uploadedAttachments,
          empleave_start_hours,
          empleave_end_hours,
          empleave_fsuperior: { fsuperior_id: employement?.emp_fsuperior },
          empleave_ssuperior: {
            ssuperior_id: employement.emp_ssuperior
              ? employement.emp_ssuperior
              : employement?.emp_fsuperior,
          },
        };
        const assignLeave = new AssignLeave({ ...payload });
        await assignLeave.save().then(async (leave) => {
          const request = new Request({
            company_id,
            request_data_id: leave?._id,
            request_type: "Leave",
            request_datetime: getFormattedDateTime(),
          });
          await request.save();
        });
        return res
          .status(200)
          .json({ message: "Successfully created a Assign Leave" });
      }
      await cleanupAttachments(uploadedAttachments);
      return res.status(403).json({ message: "You don't have access" });
    } catch (error) {
      await cleanupAttachments(uploadedAttachments);
      res.status(500).json({ message: "Failed to Add new departement" });
    }
  },
  editDataLeaveRequest: async (req, res) => {
    try {
      const {
        emp_id,
        empleave_type_id,
        empleave_leave_type,
        empleave_start_date,
        empleave_end_date,
        empleave_leave_duration,
        empleave_apply_date,
        empleave_reason,
        empleave_status,
        empleave_start_hours,
        empleave_end_hours,
      } = req.body;
      const company_id = req.query.company_id;
      const token = req.headers.authorization.split(" ")[1];
      const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
      const { role } = decodedToken;
      if (
        role === "Super Admin" ||
        role === "App Admin" ||
        role === "Group Admin"
      ) {
        await AssignLeave.updateOne(
          { _id: req.params.id },
          {
            $set: {
              company_id,
              emp_id,
              empleave_type_id,
              empleave_leave_type,
              empleave_start_date,
              empleave_end_date,
              empleave_leave_duration,
              empleave_apply_date,
              empleave_reason,
              empleave_status,
              empleave_start_hours,
              empleave_end_hours,
            },
          }
        );
        return res
          .status(200)
          .json({ message: "Successfully edited a Assign Leave" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to edited Assign Leave" });
    }
  },
  editStatusLeaveRequest: async (req, res) => {
    try {
      const { empleave_fsuperior, empleave_ssuperior, empleave_hr } = req.body;
      const findOvertime = await AssignLeave.findOne({
        _id: req.params.id,
      });
      const emp = await Employment.findOne({
        _id: findOvertime?.emp_id,
      });
      const overtimeRequest = await AssignLeave.updateOne(
        { _id: req.params.id },
        {
          $set: {
            empleave_fsuperior: {
              ...findOvertime?.empleave_fsuperior,
              status: empleave_fsuperior?.status,
              approved_by: empleave_fsuperior?.approved_by,
              approved_date:
                findOvertime?.empleave_fsuperior?.status ===
                empleave_fsuperior?.status
                  ? findOvertime?.empleave_fsuperior.approved_date
                  : empleave_fsuperior?.approved_date,
              approved_hours:
                findOvertime?.empleave_fsuperior?.status ===
                empleave_fsuperior?.status
                  ? findOvertime?.empleave_fsuperior?.approved_hours
                  : empleave_fsuperior?.approved_hours,
            },
            empleave_ssuperior: {
              ...findOvertime?.empleave_ssuperior,
              status: empleave_ssuperior?.status,
              approved_by: empleave_ssuperior?.approved_by,
              approved_date:
                findOvertime?.empleave_ssuperior?.status ===
                empleave_ssuperior?.status
                  ? findOvertime?.empleave_ssuperior?.approved_date
                  : empleave_ssuperior?.approved_date,
              approved_hours:
                findOvertime?.empleave_ssuperior?.status ===
                empleave_ssuperior?.status
                  ? findOvertime?.empleave_ssuperior.approved_hours
                  : empleave_ssuperior?.approved_hours,
            },
            empleave_hr: {
              ...findOvertime?.empleave_hr,
              status: empleave_hr?.status,
              approved_by: empleave_hr?.approved_by,
              approved_date:
                findOvertime?.empleave_hr?.status === empleave_hr?.status
                  ? findOvertime?.empleave_hr?.approved_date
                  : empleave_hr?.approved_date,
              approved_hours:
                findOvertime?.empleave_hr?.status === empleave_hr?.status
                  ? findOvertime?.empleave_hr.approved_hours
                  : empleave_hr?.approved_hours,
            },
            empleave_status:
              empleave_hr?.status === "Approved"
                ? "Approved"
                : empleave_hr?.status === "Rejected"
                ? "Rejected"
                : "Pending",
          },
        }
      );
      if (overtimeRequest.modifiedCount > 0) {
        if (empleave_hr?.status === "Approved") {
          let payload = {};
          if (emp?.emp_leave_token) {
            payload = { emp_leave_token: emp?.emp_leave_token - 1 };
          } else {
            payload = { emp_leave_token: -1 };
          }
          await Employment.updateOne(
            {
              _id: findOvertime.emp_id,
            },
            payload
          );
        }
        return res
          .status(200)
          .json({ message: "Successfully edit status Request Leave" });
      } else {
        console.log(error);
        res.status(500).json({ message: "Failed to edited status" });
      }
      // res.status(500).json({ message: "Failed to edited status" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Failed to edited status" });
    }
  },
  getLeaveRequest: async (req, res) => {
    try {
      const company_id = req.query.company_id;
      if (
        req.admin.role === "Super Admin" ||
        req.admin.role === "App Admin" ||
        req.admin.role === "Group Admin"
      ) {
        const leaveRequest = await AssignLeave.find({ company_id })
          .populate({
            path: "emp_id",
            select: "emp_fullname _id emp_depid",
            populate: {
              path: "emp_depid",
              select: "dep_name",
            },
          })
          .populate("empleave_type_id")
          .populate({
            path: "empleave_fsuperior.fsuperior_id",
            select: "des_name emp_id",
            populate: {
              path: "emp_id",
              select: "emp_fullname",
            },
          })
          .populate({
            path: "empleave_ssuperior.ssuperior_id",
            select: "des_name emp_id",
            populate: {
              path: "emp_id",
              select: "emp_fullname",
            },
          });

        res.status(200).json(leaveRequest);
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Failed to Get Departement" });
    }
  },
  detailDepartement: async (req, res) => {
    try {
      const { id } = req?.params;
      const departemen = await Departement.findOne({
        _id: id,
      });
      res.status(200).json(departemen);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Failed to Get Departement" });
    }
  },
  deleteLeaveRequest: async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req?.admin;
      if (
        role === "Super Admin" ||
        role === "App Admin" ||
        role === "Group Admin"
      ) {
        const currentLeave = await AssignLeave.findOne({ _id: id });
        const assignLeave = await AssignLeave.deleteOne({ _id: id });
        if (assignLeave.deletedCount > 0) {
          await Request.deleteOne({ request_data_id: id });
          await cleanupAttachments(currentLeave?.empleave_attachement || []);
          return res.status(200).json({
            message: `Successfully deleted Leave request`,
          });
        }
        return res
          .status(422)
          .json({ message: "Failed deleted Leave request" });
      } else {
        return res
          .status(422)
          .json({ message: "Failed deleted Leave request" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed deleted Leave request" });
    }
  },
};

const Employee = require("../employee/model");
const Attendance = require("../attedance/model");
const LeaveRequest = require("../leave-request/model");
const Periodic = require("../periodic/model");
const moment = require("moment");

module.exports = {
  async getAttendanceAndLeaveStatistic(req, res) {
    try {
      const {
        company_id,
        off_today,
        leave_request,
        by_absent,
        by_late,
        leave_today,
      } = req.query;

      const activePeriod = await Periodic.findOne({
        company_id,
        periodic_status: true,
      }).lean();

      if (!activePeriod) {
        return res.status(200).send({
          message: "Tidak ada periodik aktif di company tersebut",
          data: [],
          meta: {
            total: 0,
            totalPages: 0,
            currentPage: Math.max(parseInt(req.query.page, 10) || 1, 1),
          },
        });
      }

      const startDate = moment(activePeriod.periodic_start_date);
      const endDate = moment(activePeriod.periodic_end_date);
      const diff = endDate.diff(startDate, "days") + 1;
      const ranges = [];
      for (let i = 0; i < diff; i++) {
        ranges.push(moment(startDate).add(i, "days"));
      }
      const formateRanges = ranges.map((range) =>
        moment(range).format("MM/DD/YYYY")
      );

      const pageNumber = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const limit = Math.max(parseInt(req.query.limit, 10) || 5, 1);
      const startIndex = (pageNumber - 1) * limit;
      let meta = {
        total: 0,
        totalPages: 0,
        currentPage: pageNumber,
      };
      let employeeStatistics = [];
      const attendanceDateFilter = { attendance_date: { $in: formateRanges } };

      const attendanceAggregationLookups = [
        {
          $lookup: {
            from: "employmeents",
            localField: "_id",
            foreignField: "_id",
            as: "employee",
          },
        },
        { $unwind: "$employee" },
        {
          $lookup: {
            from: "departements",
            localField: "employee.emp_depid",
            foreignField: "_id",
            as: "department",
          },
        },
        {
          $unwind: {
            path: "$department",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            total: 1,
            employee: {
              _id: "$employee._id",
              emp_fullname: "$employee.emp_fullname",
              emp_depid: "$department",
            },
          },
        },
      ];

      const buildAttendanceAggregation = (match) => [
        { $match: match },
        { $group: { _id: "$emp_id", total: { $sum: 1 } } },
        {
          $facet: {
            metadata: [{ $count: "total" }],
            data: [
              { $sort: { total: -1 } },
              { $skip: startIndex },
              { $limit: limit },
              ...attendanceAggregationLookups,
            ],
          },
        },
        {
          $project: {
            data: "$data",
            meta: {
              total: {
                $ifNull: [{ $arrayElemAt: ["$metadata.total", 0] }, 0],
              },
            },
          },
        },
      ];

      if (by_late) {
        const [result] = await Attendance.aggregate(
          buildAttendanceAggregation({
            company_id,
            behavior_at: "Late",
            ...attendanceDateFilter,
          })
        );

        const totalData = result?.meta?.total || 0;
        employeeStatistics = result?.data || [];
        meta = {
          total: totalData,
          totalPages: Math.ceil((totalData / limit) * 1),
          currentPage: pageNumber,
        };
      }

      if (by_absent) {
        const [result] = await Attendance.aggregate(
          buildAttendanceAggregation({
            company_id,
            attendance_status: "Absent",
            ...attendanceDateFilter,
          })
        );

        const totalData = result?.meta?.total || 0;
        employeeStatistics = result?.data || [];
        meta = {
          total: totalData,
          totalPages: Math.ceil((totalData / limit) * 1),
          currentPage: pageNumber,
        };
      }

      if (off_today) {
        const today = moment(Date.now())
          .locale("ID")
          .format("dddd")
          .toLowerCase();
        const offDayField = `emp_attadance.${today}.off_day`;
        const offDayQuery = { company_id, [offDayField]: true };
        const [count, employees] = await Promise.all([
          Employee.countDocuments(offDayQuery),
          Employee.find(offDayQuery)
            .sort("_id")
            .skip(startIndex)
            .limit(limit)
            .lean(),
        ]);

        employeeStatistics = employees.map((employeeStatistic) => {
          return { employee: employeeStatistic, total: 1 };
        });

        meta = {
          total: count,
          totalPages: Math.ceil((count / limit) * 1),
          currentPage: pageNumber,
        };
      }

      if (leave_request) {
        const today = moment(Date.now()).format("YYYY-MM-DD");
        const [count, attendances] = await Promise.all([
          LeaveRequest.find({
            company_id,
            empleave_start_date: today,
          }).countDocuments(),
          LeaveRequest.find({
            company_id,
            empleave_start_date: today,
          })
            .skip(startIndex)
            .limit(limit)
            .populate({
              path: "emp_id",
              select: "emp_fullname _id emp_depid",
              populate: {
                path: "emp_depid",
                select: "dep_name",
              },
            }),
        ]);
        meta = {
          total: count,
          totalPages: Math.ceil((count / limit) * 1),
          currentPage: pageNumber,
        };

        employeeStatistics = attendances.map((attendance) => {
          return { employee: attendance.emp_id, total: 1 };
        });
      }

      if (leave_today) {
        const today = moment(Date.now()).format("YYYY-MM-DD");
        const leaveFilter = {
          company_id,
          empleave_start_date: today,
          empleave_hr: {
            status: "Approved",
          },
        };

        const [count, attendances] = await Promise.all([
          LeaveRequest.find(leaveFilter).countDocuments(),
          LeaveRequest.find(leaveFilter)
            .skip(startIndex)
            .limit(limit)
            .populate({
              path: "emp_id",
              select: "emp_fullname _id emp_depid",
              populate: {
                path: "emp_depid",
                select: "dep_name",
              },
            }),
        ]);

        meta = {
          total: count,
          totalPages: Math.ceil((count / limit) * 1),
          currentPage: pageNumber,
        };

        employeeStatistics = attendances.map((attendance) => {
          return { employee: attendance.emp_id, total: 1 };
        });
      }

      const sortEmployee = employeeStatistics
        .filter((employee) => employee.total !== 0)
        .sort((a, b) => b.total - a.total);

      return res.status(200).send({ data: sortEmployee, meta });
    } catch (error) {
      console.log(error);
      return res.status(500).send(error);
    }
  },
};

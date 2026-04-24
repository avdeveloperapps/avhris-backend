const Task = require("./model");
const Employee = require("../employee/model");

module.exports = {
  getTask: async (req, res) => {
    try {
      const { company_id, departement_id, status, employee_id, created_date } =
        req.query;
      const pageNumber = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
      const startIndex = (pageNumber - 1) * limit;
      let filterTask = {};

      if (company_id) {
        filterTask = {
          ...filterTask,
          company_id,
        };
      }
      if (created_date) {
        const splitCreatedDate = created_date.split(",");
        filterTask = {
          ...filterTask,
          createdAt: {
            $gte: splitCreatedDate[0],
            $lt: splitCreatedDate[1],
          },
        };
      }
      if (departement_id || employee_id) {
        const employeeQuery = {};
        if (departement_id) {
          employeeQuery.emp_depid = departement_id;
        }
        if (employee_id) {
          employeeQuery._id = employee_id;
        }

        const employees = await Employee.find(employeeQuery)
          .select("_id")
          .lean()
          .exec();
        const employeeIds = employees.map((employee) => employee._id);

        if (!employeeIds.length) {
          return res.status(200).send({
            data: [],
            meta: {
              total: 0,
              totalPages: 0,
              currentPage: pageNumber,
            },
          });
        }

        filterTask.task_workers = { $in: employeeIds };
      }

      if (status) {
        filterTask = {
          ...filterTask,
          task_status: status,
        };
      }

      const count = await Task.find(filterTask).countDocuments().exec();
      const tasks = await Task.find(filterTask)
        .populate({
          path: "task_workers",
          select: "_id emp_fullname emp_depid",
        })
        .populate({
          path: "company_id",
          select: "_id company_name",
        })
        .populate({
          path: "created_by",
          select: "role",
        })
        .sort({ createdAt: -1 })
        .skip(startIndex)
        .limit(limit * 1);

      const meta = {
        total: count,
        totalPages: Math.ceil((count / limit) * 1),
        currentPage: pageNumber,
      };
      return res.status(200).send({ data: tasks, meta: meta });
    } catch (error) {
      console.log(error);
      return res.status(500).send(error);
    }
  },
  createTask: async (req, res) => {
    try {
      const payload = {
        ...req.body,
        task_status: "not_started",
        progress: 0,
      };
      const task = new Task(payload);
      await task.save();
      return res.status(200).send({ data: task, message: "Created task" });
    } catch (error) {
      if (error.name === "ValidationError") {
        let errors = [];
        Object.keys(error.errors).forEach((key) => {
          const errorObj = {};

          errorObj[key] = error.errors[key].message;
          errors.push(errorObj);
        });

        return res.status(400).send({ errors: errors });
      }
      return res.status(500).send(error);
    }
  },
  updateTask: async (req, res) => {
    try {
      const id = req.params.id;
      const task = await Task.findById(id);
      if (!task) {
        return res.status(404).send({ message: "Task not found" });
      }

      await Task.updateOne(
        { _id: id },
        {
          $set: {
            ...req.body,
          },
        }
      );

      return res.status(200).send({ message: "Updated task" });
    } catch (error) {
      if (error.name === "ValidationError") {
        let errors = [];
        Object.keys(error.errors).forEach((key) => {
          const errorObj = {};

          errorObj[key] = error.errors[key].message;
          errors.push(errorObj);
        });

        return res.status(400).send({ errors: errors });
      }
      return res.status(500).send(error);
    }
  },
  deleteTask: async (req, res) => {
    try {
      const id = req.params.id;
      const task = await Task.findById(id);
      if (!task) {
        return res.status(404).send({ message: "Task not found" });
      }

      await Task.deleteOne({ _id: id });
      return res.status(200).send({ message: "Deleted task" });
    } catch (error) {
      return res.status(500).send(error);
    }
  },
};

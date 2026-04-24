const UsersSchema = require("../users/model");
const RolesSchema = require("../role/model");

// export async function addNewSalary(req, res) {
//   try {
//     const {
//       emp_salary,
//       emp_working_hours,
//       emp_working_days,
//       emp_periode,
//       emp_id,
//     } = req.body;
//     const { role } = req.admin;
//     if (
//       role === "Super Admin" ||
//       role === "App Admin" ||
//       role === "Group Admin"
//     ) {
//       const findSalary = await Salary.findOne({ emp_id });
//       if (findSalary) {
//         const salary = await Salary.updateOne(
//           { emp_id },
//           {
//             $set: {
//               emp_salary,
//               emp_working_hours,
//               emp_working_days,
//               emp_periode,
//             },
//           }
//         );
//         return res.status(200).json({ message: "Successfully updated salary" });
//       } else {
//         const salary = new Salary({
//           emp_salary,
//           emp_working_hours,
//           emp_working_days,
//           emp_periode,
//           emp_id,
//         });
//         await salary.save();
//         return res.status(200).json({ message: "Successfully added salary" });
//       }
//     } else {
//       return res
//         .status(422)
//         .json({ message: "You can't add salary to this employment" });
//     }
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: "Failed to Add salary" });
//   }
// }
// export async function editSalary(req, res) {
//   try {
//     const { emp_salary, emp_working_hours, emp_working_days, emp_periode } =
//       req.body;
//     const { role } = req.admin;
//     const { id } = req.params;
//     if (
//       role === "Super Admin" ||
//       role === "App Admin" ||
//       role === "Group Admin"
//     ) {
//       const salary = await Salary.updateOne(
//         { _id: id },
//         {
//           $set: {
//             emp_salary,
//             emp_working_hours,
//             emp_working_days,
//             emp_periode,
//           },
//         }
//       );
//       return res.status(200).json({ message: "Successfully updated salary" });
//     } else {
//       return res
//         .status(422)
//         .json({ message: "You can't updated salary this employment" });
//     }
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: "Failed to edited salary" });
//   }
// }

// export async function getData(req, res) {
//   try {
//     const emp_id = req?.query?.emp_id;
//     const { role } = req.admin;
//     // if (
//     //   role === "Super Admin" ||
//     //   role === "App Admin" ||
//     //   role === "Group Admin"
//     // ) {
//     const users = await UsersSchema.find({});
//     if (users) {
//       res.status(200).json(users);
//     } else {
//       res.status(404).json({ message: "Can't load salary" });
//     }
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: "Failed to Get User And Roles Data" });
//   }
// }

module.exports = {
  async getUsers(req, res) {
    try {
      const { compid, filter } = req.query;

      const pageNumber = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const limit = Math.max(parseInt(req.query.limit, 10) || 5, 1);
      const startIndex = (pageNumber - 1) * limit;
      let meta = {};
      let rawData = [];
      let query = {};
      query.company_id = compid;
      switch (filter) {
        case "active":
          query.status = true;
          break;
        case "inactive":
          query.status = false;
          break;
        default:
          break;
      }
      const count = await UsersSchema.find(query).countDocuments().exec();
      rawData = await UsersSchema.find(query)
        .skip(startIndex)
        .limit(limit * 1)
        .exec();
      meta = {
        total: count,
        totalPages: Math.ceil((count / limit) * 1),
        currentPage: pageNumber,
      };

      const sortedData = rawData.sort((a, b) => b.total - a.total);

      return res.status(200).send({ data: sortedData, meta });
    } catch (error) {
      return res.status(500).send(error);
    }
  },

  async switchUserStatus(req, res) {
    try {
      const { id, s } = req.query;
      await UsersSchema.where("_id", id).updateOne({ status: s }).exec();
      return res.status(200).send({ status: true });
    } catch (error) {
      return res.status(500).send(error);
    }
  },

  // Roles
  async getRoles(req, res) {
    try {
      const { compid } = req.query;

      // const pageNumber = parseInt(req.query.page) || 0;
      // const limit = parseInt(req.query.limit) || 5;
      // let startIndex = (pageNumber - 1) * limit;
      // const endIndex = (pageNumber + 1) * limit;
      let meta = {};
      let rawData = [];
      let query = {};
      query.company_id = compid;
      // const count = await RolesSchema.find(query).countDocuments().exec();
      const data = await RolesSchema.find(query).exec();
      // rawData = await RolesSchema.find(query)
      //   .skip(startIndex)
      //   .limit(limit * 1)
      //   .exec();
      // meta = {
      //   total: count,
      //   totalPages: Math.ceil((count / limit) * 1),
      //   currentPage: pageNumber,
      // };

      // const sortedData = rawData.sort((a, b) => b.total - a.total);

      return res.status(200).send({ data: data, meta });
    } catch (error) {
      return res.status(500).send(error);
    }
  },
};

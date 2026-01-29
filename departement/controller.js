const Departement = require("./model");

module.exports = {
  addNewDepartement: async (req, res) => {
    try {
      const { dep_name, dep_manager, dep_desc, dep_location, dep_created } =
        req.body;
      const { role } = req.admin;
      if (
        role === "Super Admin" ||
        role === "Group Admin" ||
        role === "App Admin"
      ) {
        const newDepartement = new Departement({
          company_id: req.query.company,
          dep_name: dep_name,
          dep_manager: dep_manager,
          dep_desc: dep_desc,
          dep_status: "Active",
          dep_location: dep_location,
          dep_created: dep_created,
        });
        await newDepartement.save();
        res
          .status(200)
          .json({ message: "Successfully created a new Departement" });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Failed to Add new departement" });
    }
  },
  editDepartement: async (req, res) => {
    try {
      const {
        dep_name,
        dep_manager,
        dep_desc,
        dep_location,
        dep_workshift,
        dep_created,
      } = req.body;
      const { id } = req.params;
      const { role } = req?.admin;
      console.log(role);
      if (
        role === "Super Admin" ||
        role === "App Admin" ||
        role === "Group Admin"
      ) {
        const departement = await Departement.updateOne(
          { _id: id },
          {
            $set: {
              dep_name,
              dep_manager,
              dep_desc,
              dep_location,
              dep_workshift,
              dep_created,
            },
          }
        );
        return res
          .status(200)
          .json({ message: "Successfully edited Departement" });
      } else {
        return res
          .status(422)
          .json({ message: "You can't change departments" });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Failed to edited departement" });
    }
  },
  getDepartement: async (req, res) => {
    try {
      const company_id = req.query.company;
      const departemen = await Departement.find({
        company_id: company_id,
      })
        .populate({ path: "company_id", select: "company_name" })
        .populate({ path: "dep_manager", select: "emp_fullname" });
      res.status(200).json(departemen);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Failed to Get Departement" });
    }
  },
  getDepartementNew: async (req, res) => {
    try {
      const company_id = req.query.company;
      const departemen = await Departement.find()
        .populate({ path: "company_id", select: "company_name" })
        .populate({ path: "dep_manager", select: "emp_fullname" });
      res.status(200).json(departemen);
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
      }).populate({ path: "dep_manager", select: "emp_fullname" });
      res.status(200).json(departemen);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Failed to Get Departement" });
    }
  },
  deleteDepartement: async (req, res) => {
    try {
      const { id } = req?.params;
      const departemen = await Departement.deleteOne({
        _id: id,
      });
      return res
        .status(200)
        .json({ message: "Successfully Delete Departement" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Failed to Delete Departement" });
    }
  },
};

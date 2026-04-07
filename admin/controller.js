const Admin = require("./model.js");
const bcrypt = require("bcrypt");
const generate_token = require("../utils/generateToken");

const validator = (value) => {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/.test(value);
};

function canAccessAccountSettings(role) {
  return ["Super Admin", "App Admin", "Group Admin"].includes(role);
}

module.exports = {
  getAdmins: async (req, res) => {
    try {
      const { role } = req.admin;

      if (!canAccessAccountSettings(role)) {
        return res.status(403).json({ message: "You don't have access" });
      }

      const admins = await Admin.find({})
        .select("_id name email role status company_id")
        .populate({ path: "company_id", select: "company_name" })
        .sort({ name: 1, email: 1 });

      return res.status(200).json(admins);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Failed to Get Admin Accounts" });
    }
  },
  registerAdmin: async (req, res) => {
    try {
      let { email, password } = req.body;
      const checkDuplicateEmail = await Admin.findOne({ email });
      if (checkDuplicateEmail) {
        return error(res, 422, "Your email has been used");
      }
      if (validator(password)) {
        password = bcrypt.hashSync(password, 10);
        const checkAdminSuper = await Admin.findOne({ role: "Super Admin" });
        const user = new Admin({
          email,
          password,
          role: !checkAdminSuper ? "Super Admin" : "App Admin",
        });
        user
          .save()
          .then(() => {
            return res.status(200).json({
              message:
                "Registration is successful, Login to start your session",
            });
          })
          .catch(() => res.status(400).json({ message: "Registrasi failed" }));
      } else {
        return res.status(400).json({
          message:
            "Password must contain 1 lowercase letter [a-z], 1 uppercase letter [A-Z], 1 number [0-9]",
        });
      }
    } catch (error) {
      console.log(error);
    }
  },
  loginAdmin: async (req, res) => {
    try {
      const { email, password } = req.body;
      const admin = await Admin.findOne({ email });
      if (admin) {
        const data = {
          admin_id: admin?._id,
          email: admin?.email,
          role: admin?.role,
        };
        const cek_password = bcrypt.compareSync(password, admin.password);
        if (!cek_password)
          return res
            .status(401)
            .json({ message: "Your password or email maybe wrong" });

        const token = generate_token(data);
        return res.status(200).json({
          message: "Authentication sukses",
          token,
        });
      }
      return res
        .status(401)
        .json({ message: "Your password or email maybe wrong" });
    } catch (error) {
      console.log(error);
    }
  },
  resetAdminPassword: async (req, res) => {
    try {
      const { role } = req.admin;
      const { password } = req.body;

      if (!canAccessAccountSettings(role)) {
        return res.status(403).json({ message: "You don't have access" });
      }

      if (!password) {
        return res.status(422).json({ message: "Password is required" });
      }

      const hashedPassword = bcrypt.hashSync(password, 10);
      const updatedAdmin = await Admin.updateOne(
        { _id: req.params.id },
        { $set: { password: hashedPassword } }
      );

      if (updatedAdmin.modifiedCount > 0) {
        return res
          .status(200)
          .json({ message: "Successfully Reset Admin Password" });
      }

      return res
        .status(422)
        .json({ message: "Opps No field change, Please try again!" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Failed Reset Password Admin" });
    }
  },
};

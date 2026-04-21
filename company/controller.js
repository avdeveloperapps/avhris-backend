const Company = require("./model.js");
const CompanyRelations = require("./../company-relations/model.js");
const bcrypt = require("bcrypt");
const generate_token = require("../utils/generateToken");
const Employment = require("../employee/model");
const Departement = require("../departement/model");
const Designation = require("../designations/model");
const Status = require("../emp-status/model");
const mongoose = require("mongoose");
const Leave = require("../leave-request/model");

const validator = (value) => {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/.test(value);
};

function canAccessAccountSettings(role) {
  return ["Super Admin", "App Admin", "Group Admin"].includes(role);
}

async function TotalStatusEmplyoment(company_id) {
  const employment = await Employment.find({ company_id });
  const status = await Status.find({ company_id });
  const result = [];
  for (let i = 0; i < status.length; i++) {
    let total = 0;
    for (let j = 0; j < employment.length; j++) {
      if (employment[j]?.emp_status?.equals(status[i]?._id)) {
        total += 1;
      }
    }
    result.push({ status: status[i]?.empstatus_name, total_employment: total });
  }
  return result;
}
async function TotalDepartementEmplyoment(company_id) {
  const employment = await Employment.find({ company_id });
  const departement = await Departement.find({ company_id });
  const result = [];
  for (let i = 0; i < departement.length; i++) {
    let total = 0;
    for (let j = 0; j < employment.length; j++) {
      if (employment[j]?.emp_depid?.equals(departement[i]?._id)) {
        total += 1;
      }
    }
    result.push({
      departement: departement[i]?.dep_name,
      total_departement: total,
    });
  }
  return result;
}
async function TotalDesignationEmplyoment(company_id) {
  const employment = await Employment.find({ company_id });
  const designation = await Designation.find({ company_id });
  const result = [];
  for (let i = 0; i < designation.length; i++) {
    let total = 0;
    for (let j = 0; j < employment.length; j++) {
      if (employment[j]?.emp_desid?.equals(designation[i]?._id)) {
        total += 1;
      }
    }
    result.push({
      designation: designation[i]?.des_name,
      total_designation: total,
    });
  }
  return result;
}

module.exports = {
  registerCompany: async (req, res) => {
    try {
      // const checkDuplicateEmail = await Company.findOne({ company_email });
      // if (checkDuplicateEmail) {
      //   return res.status(422).json({ message: "Your email has been used" });
      // }
      // const checkDuplicateName = await Company.findOne({ company_name });
      // if (checkDuplicateName) {
      //   return res
      //     .status(422)
      //     .json({ message: "Your company name has been created" });
      // }
      // if (validator(company_password)) {
      //   company_password = bcrypt.hashSync(company_password, 10);
      const company = new Company({
        role: "App Admin",
        ...req.body,
      });
      company
        .save()
        .then(() => {
          return res.status(200).json({
            message: "Successfully Added new Company",
          });
        })
        .catch((err) => {
          console.log(err);
          res.status(400).json({ message: "Failed Added new Company" });
        });
    } catch (error) {
      res.status(400).json({ message: "Failed Added new Company" });
    }
  },
  editCompany: async (req, res) => {
    try {
      // const checkDuplicateEmail = await Company.findOne({ company_email });
      // if (checkDuplicateEmail) {
      //   return res.status(422).json({ message: "Your email has been used" });
      // }
      // const checkDuplicateName = await Company.findOne({ company_name });
      // if (checkDuplicateName) {
      //   return res
      //     .status(422)
      //     .json({ message: "Your company name has been created" });
      // }
      // if (validator(company_password)) {
      let { company_password } = req.body;
      if (company_password) {
        company_password = bcrypt.hashSync(company_password, 10);
        const company = await Company.updateOne(
          { _id: req.params.id },
          {
            $set: {
              ...req.body,
              company_password,
            },
          }
        );
        if (company.modifiedCount > 0) {
          return res.status(200).json({
            message: "Successfully Edited Company",
          });
        } else {
          res
            .status(400)
            .json({ message: "Failed Edit company | No data changed" });
        }
      } else {
        const company = await Company.updateOne(
          { _id: req.params.id },
          {
            $set: {
              ...req.body,
            },
          }
        );
        if (company.modifiedCount > 0) {
          return res.status(200).json({
            message: "Successfully Edited Company",
          });
        } else {
          res
            .status(400)
            .json({ message: "Failed Edit company | No data changed" });
        }
      }
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ message: "Failed Edit company | Internal Server error" });
    }
  },
  deleteCompany: async (req, res) => {
    try {
      const company = await Company.deleteOne({ _id: req.params.id });
      if (company.deletedCount > 0) {
        return res.status(200).json({
          message: "Successfully Deleted Company",
        });
      } else {
        res.status(400).json({ message: "Failed Delete Company" });
      }
    } catch (error) {
      res
        .status(500)
        .json({ message: "Failed Delete Company | Internal Server error" });
    }
  },
  loginCompany: async (req, res) => {
    try {
      const { email, password } = req.body;
      const company = await Company.findOne({ company_email: email });
      if (company) {
        const data = {
          company_id: company?._id,
          company_name: company?.company_name,
          company_header: company?.company_header
            ? company?.company_header
            : null,
          email: company?.company_email,
          role: company?.role,
          company_canpayroll: company?.company_canpayroll,
          company_group: company?.company_group,
        };
        const cek_password = bcrypt.compareSync(
          password,
          company.company_password
        );
        if (!cek_password)
          return res
            .status(401)
            .json({ message: "Your password or email maybe wrong" });

        const token = generate_token(data);
        return res.status(200).json({
          message: "Authentication sukses",
          accountData: data,
          token,
        });
      } else {
        return res
          .status(401)
          .json({ message: "Your password or email maybe wrong" });
      }
    } catch (error) {
      console.log(error);
    }
  },
  getAllCompany: async (req, res) => {
    try {
      const { company_group, company_id } = req.admin;
      let findCompany = {};

      if (company_group) {
        const compRel = await CompanyRelations.findOne({
          companies: { $in: [company_id] },
        });
        console.log(compRel);
        if (compRel) {
          const companyIds = compRel.companies;
          findCompany = { _id: { $in: companyIds } };
          console.log(findCompany);
        } else {
          findCompany = {
            _id: company_id,
          };
        }
      } else {
        findCompany = {
          company_group: "Mufidah Group",
        };
      }

      const company = await Company.find(findCompany).select(
        "_id company_name company_group company_longtitude company_latitude company_zone company_status company_header"
      );
      console.log(company);
      return res.status(200).json(company);
    } catch (error) {
      console.log(error);
    }
  },
  getAllCompanyEmployeeOptions: async (req, res) => {
    try {
      const companies = await Company.find({}).select(
        "_id company_name company_group company_longtitude company_latitude company_zone company_status company_header"
      );
      return res.status(200).json(companies);
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ message: "Failed to Get Company Options" });
    }
  },
  getCompanyAccounts: async (req, res) => {
    try {
      const { role } = req.admin;

      if (!canAccessAccountSettings(role)) {
        return res.status(403).json({ message: "You don't have access" });
      }

      const companies = await Company.find({})
        .select(
          "_id company_name company_group company_email company_status company_header company_canpayroll"
        )
        .sort({ company_name: 1 });

      return res.status(200).json(companies);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Failed to Get Company Accounts" });
    }
  },
  resetCompanyPassword: async (req, res) => {
    try {
      const { role } = req.admin;
      const { password } = req.body;

      if (!canAccessAccountSettings(role)) {
        return res.status(403).json({ message: "You don't have access" });
      }

      if (!password) {
        return res.status(422).json({ message: "Password is required" });
      }

      const company_password = bcrypt.hashSync(password, 10);
      const company = await Company.updateOne(
        { _id: req.params.id },
        {
          $set: {
            company_password,
          },
        }
      );

      if (company.modifiedCount > 0) {
        return res
          .status(200)
          .json({ message: "Successfully Reset Company Password" });
      }

      return res
        .status(422)
        .json({ message: "Opps No field change, Please try again!" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Failed Reset Password Company" });
    }
  },
  dahsboard: async (req, res) => {
    try {
      const { role } = req.admin;
      const company_id =
        role === "Super Admin " || role === "Group Admin"
          ? req.query.company
          : req.admin.company_id;
      const employment = (await Employment.find({ company_id })).length;
      const departement = (await Departement.find({ company_id })).length;
      const leave = (await Leave.find({ company_id })).length;
      const statistic_employment = await TotalStatusEmplyoment(company_id);
      const departement_statistic = await TotalDepartementEmplyoment(
        company_id
      );
      const designation_statistic = await TotalDesignationEmplyoment(
        company_id
      );
      return res.status(200).json({
        total_employment: employment,
        total_leave: leave,
        total_departement: departement,
        employment_status: statistic_employment,
        departement_statistic,
        designation_statistic,
      });
    } catch (error) {
      console.log(error);
    }
  },
};

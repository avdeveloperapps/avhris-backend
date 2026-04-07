const express = require("express");
const { authenticationToken } = require("../middleware/authentication");
const {
  registerCompany,
  loginCompany,
  getAllCompany,
  getCompanyAccounts,
  dahsboard,
  editCompany,
  deleteCompany,
  resetCompanyPassword,
} = require("./controller");
const router = express.Router();

router.post("/registrasi", registerCompany);
router.put("/:id", editCompany);
router.delete("/:id", authenticationToken, deleteCompany);
router.post("/login", loginCompany);
router.get("/all", authenticationToken, getAllCompany);
router.get("/accounts", authenticationToken, getCompanyAccounts);
router.get("/dashboard", authenticationToken, dahsboard);
router.put("/:id/password", authenticationToken, resetCompanyPassword);
module.exports = router;

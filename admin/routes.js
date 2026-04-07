const express = require("express");
const { authenticationToken } = require("../middleware/authentication");
const {
  registerAdmin,
  loginAdmin,
  getAdmins,
  resetAdminPassword,
} = require("./controller");
const router = express.Router();

router.post("/registrasi", registerAdmin);
router.post("/login", loginAdmin);
router.get("/accounts", authenticationToken, getAdmins);
router.put("/:id/password", authenticationToken, resetAdminPassword);
module.exports = router;

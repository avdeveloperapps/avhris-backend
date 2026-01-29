const express = require("express");
const { authenticationToken } = require("../middleware/authentication");
const {
  addNewDepartement,
  getDepartement,
  getDepartementNew,
  editDepartement,
  detailDepartement,
  deleteDepartement,
} = require("./controller");
const router = express.Router();

router.get("/new", getDepartementNew);
router.post("/", authenticationToken, addNewDepartement);
router.delete("/:id", authenticationToken, deleteDepartement);
router.put("/:id", authenticationToken, editDepartement);
router.get("/:id", detailDepartement);
router.get("/", authenticationToken, getDepartement);
// router.post("/login", loginCompany);
module.exports = router;

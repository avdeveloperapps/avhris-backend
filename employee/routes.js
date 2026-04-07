const express = require("express");
const { authenticationToken } = require("../middleware/authentication");
const {
  addEmployement,
  getEmployment,
  getEmploymentAccounts,
  detailEmployment,
  editPesonalDetail,
  editCutiDetail,
  editEmploymentDetail,
  editWorkShift,
  uploadPhoto,
  getAllWorkShiftEmployment,
  changeProfile,
  deleteEmployment,
  editStatus,
  resetPassword,
  updatePayrunType,
  updatePayrunStatus,
} = require("./controller");
const router = express.Router();
const path = require("path");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads");
  },
  filename: function (req, file, cb) {
    // You could rename the file name
    cb(
      null,
      file.originalname.split(".")[0] +
        "-" +
        Date.now() +
        path.extname(file.originalname)
    );
  },
});
const fileFilter = (req, file, cb) => {
  const typeFile = file.mimetype;
  if (
    typeFile === "image/png" ||
    typeFile === "image/jpg" ||
    typeFile === "image/jpeg" ||
    typeFile ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    typeFile ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    typeFile === "application/pdf"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
    new Error("Cannot Uploded file!");
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 4000000 },
});

router.post("/upload", upload.array("files", 5), uploadPhoto);

router.post("/", authenticationToken, upload.single("profile"), addEmployement);
router.get("/", authenticationToken, getEmployment);
router.get("/accounts", authenticationToken, getEmploymentAccounts);
router.get("/:id", authenticationToken, detailEmployment);
router.delete("/:id", authenticationToken, deleteEmployment);
router.put("/personal-detail/:id", authenticationToken, editPesonalDetail);
router.put("/cuti/:id", authenticationToken, editCutiDetail);
router.put("/status/:id", authenticationToken, editStatus);
router.put("/reset/:id", authenticationToken, resetPassword);
router.put("/employment-detail/:id", authenticationToken, editEmploymentDetail);
router.put("/employment-workshift/:id", authenticationToken, editWorkShift);
router.put(
  "/profile/:id",
  authenticationToken,
  upload.single("profile"),
  changeProfile
);
router.put("/:id/payrun-type", authenticationToken, updatePayrunType);
router.get("/workshift/:id", getAllWorkShiftEmployment);
router.put("/:id/payrun-status", updatePayrunStatus);
module.exports = router;

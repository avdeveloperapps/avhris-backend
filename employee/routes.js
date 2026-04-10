const express = require("express");
const { authenticationToken } = require("../middleware/authentication");
const {
  buildUploadedFilename,
  createMemoryUpload,
  defaultFileFilter,
} = require("../utils/upload");
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
const upload = createMemoryUpload({
  beforeFilter: (req, file) => {
    file.filename = buildUploadedFilename(file.originalname);
  },
  fileFilter: defaultFileFilter,
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

const express = require("express");
const { authenticationToken } = require("../middleware/authentication");
const { buildUploadedFilename, createMemoryUpload } = require("../utils/upload");
const {
  generatePayrun,
  getPayrun,
  editStatusPayrun,
  recalculatePayrun,
  editDataPayslip,
  handleUploadFile,
  getPayrunType,
  createPayrunType,
  updatePayrunType,
  generatePdfFile,
  downloadPdfFile,
} = require("./controller");
const router = express.Router();
const upload = createMemoryUpload({
  beforeFilter: (req, file) => {
    file.filename = buildUploadedFilename(file.originalname);
  },
});

router.post("/", authenticationToken, generatePayrun);
// router.post(
//   "/upload-pdf/:id",
//   authenticationToken,
//   upload.single("file"),
//   handleUploadFile
// );
router.post("/create-pdf/:id", authenticationToken, generatePdfFile);
router.get("/download-pdf/:id", authenticationToken, downloadPdfFile);
router.put("/:id", authenticationToken, editStatusPayrun);
router.put("/recalculate/:id", authenticationToken, recalculatePayrun);
router.put("/data/:id", authenticationToken, editDataPayslip);
// router.delete("/:id", authenticationToken, deleteSalary);
router.get("/", authenticationToken, getPayrun);
// router.get("/status", authenticationToken, getPeriodicActive);
// get payrun type

module.exports = router;

const express = require("express");
const { authenticationToken } = require("../middleware/authentication");
const {
  buildUploadedFilename,
  createMemoryUpload,
  defaultFileFilter,
} = require("../utils/upload");
const {
  addLeaveRequest,
  getLeaveRequest,
  editStatusLeaveRequest,
  deleteLeaveRequest,
  editDataLeaveRequest,
} = require("./controller");
const router = express.Router();
const upload = createMemoryUpload({
  beforeFilter: (req, file) => {
    file.filename = buildUploadedFilename(file.originalname);
  },
  fileFilter: defaultFileFilter,
});

router.post(
  "/",
  authenticationToken,
  upload.array("files", 5),
  addLeaveRequest
);
router.put("/status/:id", authenticationToken, editStatusLeaveRequest);
router.put("/data/:id", authenticationToken, editDataLeaveRequest);
// router.get("/:id", detailDepartement);
router.get("/", authenticationToken, getLeaveRequest);
router.delete("/:id", authenticationToken, deleteLeaveRequest);
// router.post("/login", loginCompany);
module.exports = router;

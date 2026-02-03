const express = require("express");
const app = express();
const cors = require("cors");
const rateLimit = require("express-rate-limit");
require("dotenv").config();
const CONFIG = require("./config");
require("./database");
const mongoose = require("mongoose");
const companyRoute = require("./company/routes");
const adminRoute = require("./admin/routes");
const departementRoute = require("./departement/routes");
const designationRoute = require("./designations/routes");
const employmentRoute = require("./employee/routes");
const EducationRoute = require("./education/routes");
const ExperienceRoute = require("./experience/routes");
const BankRoute = require("./bank/routes");
const SalaryRoute = require("./salary/routes");
const ShiftRoute = require("./workshift/routes");
const AllowDeductRoute = require("./allow-deduction/routes");
const AllowanceEmployment = require("./emp-allowance/routes");
const DeductionEmployment = require("./emp-deduction/routes");
const LeaveRequestRoute = require("./leave-request/routes");
const EmploymentStatusRoute = require("./emp-status/routes");
const EmploymentWarningRoute = require("./emp-warning/routes");
const OvertimeRequestRoute = require("./overtime-request/routes");
const OutsideRequestRoute = require("./outside-request/routes");
const PeriodicRoute = require("./periodic/routes");
const path = require("path");
const LeaveRoute = require("./leave-holidays/routes");
const LeaveSettingRoute = require("./leave-setting/routes");
const OffDayRoute = require("./off-day/routes");
const ChangeWorkshiftRoute = require("./emp-change-workshift/routes");
const AnnouncementRoute = require("./announcements/routes");
const AttendanceRoute = require("./attedance/routes");
const LocationRoute = require("./location/routes");
const LatelyRoute = require("./lately_attendance/routes");
const NeedApprovalRoute = require("./need-approval/routes");
// const Task = require("./emp-permit/model");
const TaskRoutes = require("./task/routes");
const PayrunRoutes = require("./payrun/routes");
const PayrunTypeRoutes = require("./payrun-type/routes");
const BankPayrunRoutes = require("./bank-payrun/routes");
const PayrunProcessRoutes = require("./payrun-process/routes");
const OutputFileRoutes = require("./output-file/routes");
const UsersAndRolesRoutes = require("./users-and-roles/routes");
const StatisticRoutes = require("./statistic/routes");
// async function NotificationModel() {
//   // const notif = await Task.find();
//   // console.log(notif);
//   const schedule = {};
//   for (let i = 1; i <= 52; i++) {
//     schedule[`minggu_${i}`] = {
//       shift_clockin: {
//         type: String,
//         required: true,
//       },
//       shift_clockout: {
//         type: String,
//         required: true,
//       },
//       shift_break_duration: {
//         type: Number,
//         required: true,
//       },
//     };
//   }
//   console.log(schedule);
// }
// NotificationModel();
const router = express.Router();
require("./corn");

const allowedOrigins = (process.env.CORS_ORIGINS ||
  "https://avhris-backoffice.fly.dev")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
    ],
  })
);
app.options("*", cors());

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests, please try again later." },
    skip: (req) => req.method === "OPTIONS",
    keyGenerator: (req) => {
      const ip = req.ip || req.connection?.remoteAddress || "unknown";
      return `${ip}:${req.originalUrl}`;
    },
  })
);
// NOTE: Avoid sending a timeout response here; it can race with handlers and
// cause "ERR_HTTP_HEADERS_SENT" if a handler responds later.
const slowRequestMs = Number(process.env.SLOW_REQUEST_MS || 2000);
const logSlowRequests =
  process.env.LOG_SLOW_REQUESTS === "1" ||
  process.env.LOG_SLOW_REQUESTS === "true";
const requestTimeoutMs = Number(process.env.REQUEST_TIMEOUT_MS || 5000);

app.use((req, res, next) => {
  // Prevent crashes if a handler writes after timeout response.
  const originalStatus = res.status.bind(res);
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  res.status = (code) => {
    if (res.headersSent || res.writableEnded) return res;
    return originalStatus(code);
  };
  res.json = (payload) => {
    if (res.headersSent || res.writableEnded) return res;
    return originalJson(payload);
  };
  res.send = (payload) => {
    if (res.headersSent || res.writableEnded) return res;
    return originalSend(payload);
  };

  const timer = setTimeout(() => {
    if (!res.headersSent && !res.writableEnded) {
      if (logSlowRequests) {
        const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
        const payload = {
          type: "TIMEOUT_REQUEST",
          duration_ms: Math.round(durationMs),
          method: req.method,
          url: req.originalUrl,
          status_code: 504,
          ip: req.ip,
          forwarded_for: req.headers["x-forwarded-for"],
          headers: req.headers,
          query: req.query,
          body: req.body,
        };
        try {
          console.log(JSON.stringify(payload));
        } catch (err) {
          console.log("TIMEOUT_REQUEST", {
            ...payload,
            log_error: err?.message || "unknown",
          });
        }
      }
      res.status(504).json({ message: "Request timeout" });
    }
  }, requestTimeoutMs);

  res.on("finish", () => clearTimeout(timer));
  res.on("close", () => clearTimeout(timer));
  next();
});

app.use((req, res, next) => {
  if (!logSlowRequests) return next();
  const startedAt = process.hrtime.bigint();
  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    if (durationMs < slowRequestMs) return;
    const payload = {
      type: "SLOW_REQUEST",
      duration_ms: Math.round(durationMs),
      method: req.method,
      url: req.originalUrl,
      status_code: res.statusCode,
      ip: req.ip,
      forwarded_for: req.headers["x-forwarded-for"],
      headers: req.headers,
      query: req.query,
      body: req.body,
    };
    try {
      console.log(JSON.stringify(payload));
    } catch (err) {
      console.log("SLOW_REQUEST", {
        ...payload,
        log_error: err?.message || "unknown",
      });
    }
  });
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/images", express.static(path.join(__dirname, "public/uploads")));
app.use("/files", express.static(path.join(__dirname, "public/files")));
app.use("/public", express.static(path.join(__dirname, "public")));

const api_version = "api/v1";
app.use(
  `/`,
  router.get("/", (req, res) => res.json({ message: "Welcome to Avapps API" }))
);

app.use(`/${api_version}/admin`, adminRoute);
app.use(`/${api_version}/company`, companyRoute);
app.use(`/${api_version}/departement`, departementRoute);
app.use(`/${api_version}/designation`, designationRoute);

app.use(`/${api_version}/employment`, employmentRoute);
app.use(`/${api_version}/education`, EducationRoute);
app.use(`/${api_version}/experience`, ExperienceRoute);
app.use(`/${api_version}/bank`, BankRoute);
app.use(`/${api_version}/salary`, SalaryRoute);
app.use(`/${api_version}/allowance-deduction`, AllowDeductRoute);
app.use(`/${api_version}/allowance`, AllowanceEmployment);
app.use(`/${api_version}/deduction`, DeductionEmployment);
app.use(`/${api_version}/shift`, ShiftRoute);
app.use(`/${api_version}/leave-holiday`, LeaveRoute);
app.use(`/${api_version}/leave-request`, LeaveRequestRoute);
app.use(`/${api_version}/employment-status`, EmploymentStatusRoute);
app.use(`/${api_version}/employment-warning`, EmploymentWarningRoute);
app.use(`/${api_version}/overtime-request`, OvertimeRequestRoute);
app.use(`/${api_version}/outside-request`, OutsideRequestRoute);
app.use(`/${api_version}/periodic`, PeriodicRoute);
app.use(`/${api_version}/leaves`, LeaveSettingRoute);
app.use(`/${api_version}/off-day`, OffDayRoute);
app.use(`/${api_version}/announcement`, AnnouncementRoute);
app.use(`/${api_version}/attendance`, AttendanceRoute);
app.use(`/${api_version}/location`, LocationRoute);
app.use(`/${api_version}/lately`, LatelyRoute);
app.use(`/${api_version}/need-approval`, NeedApprovalRoute);
app.use(`/${api_version}/change-shift`, ChangeWorkshiftRoute);
app.use(`/${api_version}/tasks`, TaskRoutes);
app.use(`/${api_version}/payrun`, PayrunRoutes);
app.use(`/${api_version}/payrun-type`, PayrunTypeRoutes);
app.use(`/${api_version}/bank-payrun`, BankPayrunRoutes);
app.use(`/${api_version}/payrun-process`, PayrunProcessRoutes);
app.use(`/${api_version}/output-file`, OutputFileRoutes);
app.use(`/${api_version}/users-and-roles`, UsersAndRolesRoutes);
app.use(`/${api_version}/statistic`, StatisticRoutes);

// Ensure indexes are in sync on startup (covers existing data as well).
const syncIndexesOnStart = async () => {
  try {
    await mongoose.connection.asPromise();
    const models = mongoose.models || {};
    await Promise.all(
      Object.values(models).map((model) => model.syncIndexes())
    );
    console.log(
      `Indexes synced for ${Object.keys(models).length} models on startup`
    );
  } catch (err) {
    console.error("Index sync failed:", err.message);
  }
};
syncIndexesOnStart();

app.listen(CONFIG.port, async () => {
  console.log(`Server start running on port ${CONFIG.port}`);
});

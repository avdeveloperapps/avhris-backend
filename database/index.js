const mongoose = require("mongoose");
const CONFIG = require("../config");

mongoose.set("strictQuery", true);

mongoose
  .connect(CONFIG.mongodb_url, {
    maxPoolSize: CONFIG.mongodb_max_pool_size,
    minPoolSize: CONFIG.mongodb_min_pool_size,
    serverSelectionTimeoutMS: CONFIG.mongodb_server_selection_timeout_ms,
    socketTimeoutMS: CONFIG.mongodb_socket_timeout_ms,
  })
  .then(() => {
    console.log("mongodb success connected");
  })
  .catch((err) => {
    console.log("mongodb failed connected", err);
  });

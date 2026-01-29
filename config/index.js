require("dotenv").config();
const CONFIG = {
  mongodb_url:
    process.env.MONGODB_URL ||
    process.env.MONGODB_URL_PROD ||
    process.env.MONGODB_URI,
  port: parseInt(process.env.PORT || "3000", 10),
  mongodb_max_pool_size: parseInt(process.env.MONGODB_MAX_POOL_SIZE || "20", 10),
  mongodb_min_pool_size: parseInt(process.env.MONGODB_MIN_POOL_SIZE || "0", 10),
  mongodb_socket_timeout_ms: parseInt(
    process.env.MONGODB_SOCKET_TIMEOUT_MS || "20000",
    10
  ),
  mongodb_server_selection_timeout_ms: parseInt(
    process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || "10000",
    10
  ),
};

module.exports = CONFIG;

require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const connectDB = require("./config/db");
const telemetryController = require("./controllers/telemetryController");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
  maxHttpBufferSize: 1e8,
});

app.use(cors());
app.use(express.json({ limit: "50mb" }));

connectDB();

io.on("connection", (socket) => {
  socket.on("sensor_data", telemetryController.handleSocketData(socket));
});

const telemetryRoutes = require("./routes/telemetryRoutes")(io);
const labelRoutes = require("./routes/labelRoutes");

app.use("/api", telemetryRoutes);
app.use("/api", labelRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 API: http://localhost:${PORT}`));

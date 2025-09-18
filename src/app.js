require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { connectDB } = require("./config/database");
const { swaggerUi, swaggerSpecs } = require("./config/swagger");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// static landing
app.use(express.static(path.join(__dirname, "../public")));

// swagger
app.use(
  "/api-swagger",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpecs, {
    customSiteTitle: "TodoList API Docs",
  })
);

// routes
app.use("/auth", require("./routes/auth"));
app.use("/todos", require("./routes/todos"));

app.get("/health", (_req, res) =>
  res.json({ success: true, message: "Todo API is running" })
);

connectDB();
module.exports = app;

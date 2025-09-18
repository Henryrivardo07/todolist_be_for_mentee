const app = require("./app");

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("📚 Todo API running on port", PORT);
  console.log("📍 Health:", `http://localhost:${PORT}/health`);
  console.log("📍 Swagger:", `http://localhost:${PORT}/api-swagger`);
});

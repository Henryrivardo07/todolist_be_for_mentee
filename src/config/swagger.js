const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "TodoList API",
      version: "1.0.0",
      description:
        "TodoList REST API with per-user scoping (Express + Prisma + Postgres)",
    },
    servers: [{ url: "/" }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
      schemas: {
        Todo: {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            completed: { type: "boolean" },
            date: { type: "string", format: "date-time" },
            priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
          },
          required: ["id", "title", "completed", "date", "priority"],
        },
        NewTodo: {
          type: "object",
          properties: {
            title: { type: "string" },
            completed: { type: "boolean", default: false },
            date: { type: "string", format: "date-time" },
            priority: {
              type: "string",
              enum: ["LOW", "MEDIUM", "HIGH"],
              default: "MEDIUM",
            },
          },
          required: ["title"],
        },
        LoginResponse: {
          type: "object",
          properties: {
            token: { type: "string" },
            user: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                email: { type: "string" },
              },
            },
          },
        },
      },
    },
    tags: [{ name: "Auth" }, { name: "Todos" }],
  },
  apis: ["./src/routes/*.js"],
};

const swaggerSpecs = swaggerJsdoc(options);
module.exports = { swaggerUi, swaggerSpecs };

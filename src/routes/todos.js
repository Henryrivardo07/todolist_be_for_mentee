const router = require("express").Router();
const { query, body, param } = require("express-validator");
const { prisma } = require("../config/database");
const { successResponse, errorResponse } = require("../utils/response");
const { handleValidationErrors } = require("../middleware/validation");
const { authenticateToken } = require("../middleware/auth");

/**
 * @swagger
 * /todos:
 *   post:
 *     tags: [Todos]
 *     summary: Create a new todo
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/NewTodo' }
 *     responses:
 *       200:
 *         description: The created todo
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Todo' }
 *       500: { description: Server error }
 */
router.post(
  "/",
  authenticateToken,
  [body("title").isLength({ min: 1 }).withMessage("Title is required")],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { title, completed = false, date, priority = "MEDIUM" } = req.body;
      const todo = await prisma.todo.create({
        data: {
          title,
          completed,
          date: date ? new Date(date) : new Date(),
          priority,
          userId: req.user.id, // scope ke user
        },
      });
      return successResponse(res, todo, "Created");
    } catch (e) {
      console.error(e);
      return errorResponse(res);
    }
  }
);

/**
 * @swagger
 * /todos:
 *   get:
 *     tags: [Todos]
 *     summary: Retrieve todos with optional filtering, pagination, and sorting
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: query
 *         name: completed
 *         schema: { type: boolean }
 *         description: Filter by completion status (true/false). Omit to fetch all.
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [LOW, MEDIUM, HIGH] }
 *       - in: query
 *         name: dateGte
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: dateLte
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [id, title, completed, date, priority] }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: asc }
 *     responses:
 *       200:
 *         description: A paginated list of todos
 */
router.get(
  "/",
  authenticateToken,
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const {
        completed,
        priority,
        dateGte,
        dateLte,
        page = 1,
        limit = 10,
        sort = "date",
        order = "asc",
      } = req.query;

      const where = { userId: req.user.id };
      if (completed !== undefined) where.completed = completed === "true";
      if (priority) where.priority = priority;
      if (dateGte || dateLte) {
        where.date = {};
        if (dateGte) where.date.gte = new Date(dateGte);
        if (dateLte) where.date.lte = new Date(dateLte);
      }

      const [items, total] = await Promise.all([
        prisma.todo.findMany({
          where,
          orderBy: { [sort]: order },
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
        }),
        prisma.todo.count({ where }),
      ]);

      return successResponse(res, {
        todos: items,
        totalTodos: total,
        hasNextPage: Number(page) * Number(limit) < total,
        nextPage: Number(page) + 1,
      });
    } catch (e) {
      console.error(e);
      return errorResponse(res);
    }
  }
);

/**
 * @swagger
 * /todos/{id}:
 *   put:
 *     tags: [Todos]
 *     summary: Update a todo by ID
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/NewTodo' }
 *     responses:
 *       200: { description: The updated todo }
 *       404: { description: Todo not found }
 */
router.put(
  "/:id",
  authenticateToken,
  [param("id").isString().isLength({ min: 1 })],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;

      const existing = await prisma.todo.findFirst({
        where: { id, userId: req.user.id },
      });
      if (!existing) return errorResponse(res, "Todo not found", 404);

      const { title, completed, date, priority } = req.body;
      const updated = await prisma.todo.update({
        where: { id },
        data: {
          ...(title !== undefined && { title }),
          ...(completed !== undefined && { completed }),
          ...(date !== undefined && { date: new Date(date) }),
          ...(priority && { priority }),
        },
      });

      return successResponse(res, updated, "Updated");
    } catch (e) {
      console.error(e);
      return errorResponse(res);
    }
  }
);

/**
 * @swagger
 * /todos/{id}:
 *   delete:
 *     tags: [Todos]
 *     summary: Delete a todo by ID
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: The deleted todo }
 *       404: { description: Todo not found }
 */
router.delete(
  "/:id",
  authenticateToken,
  [param("id").isString().isLength({ min: 1 })],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;

      const existing = await prisma.todo.findFirst({
        where: { id, userId: req.user.id },
      });
      if (!existing) return errorResponse(res, "Todo not found", 404);

      const deleted = await prisma.todo.delete({ where: { id } });
      return successResponse(res, deleted, "Deleted");
    } catch (e) {
      console.error(e);
      return errorResponse(res);
    }
  }
);

module.exports = router;

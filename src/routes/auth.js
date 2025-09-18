const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body } = require("express-validator");
const { prisma } = require("../config/database");
const { successResponse, errorResponse } = require("../utils/response");
const { handleValidationErrors } = require("../middleware/validation");

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       201: { description: Created }
 *       400: { description: Bad Request }
 */
router.post(
  "/register",
  [
    body("name").notEmpty(),
    body("email").isEmail(),
    body("password").isLength({ min: 6 }),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { name, email, password } = req.body;
      const exists = await prisma.user.findUnique({ where: { email } });
      if (exists) return errorResponse(res, "Email already used", 400);

      const hash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { name, email, password: hash },
        select: { id: true, name: true, email: true },
      });
      return successResponse(res, user, "Registered", 201);
    } catch (e) {
      console.error(e);
      return errorResponse(res);
    }
  }
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login and get token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/LoginResponse' }
 *       401: { description: Unauthorized }
 */
router.post(
  "/login",
  [body("email").isEmail(), body("password").isLength({ min: 6 })],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return errorResponse(res, "Invalid credentials", 401);

      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return errorResponse(res, "Invalid credentials", 401);

      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        {
          expiresIn: process.env.JWT_EXPIRES_IN || "7d",
        }
      );

      return successResponse(
        res,
        { token, user: { id: user.id, name: user.name, email } },
        "Logged in"
      );
    } catch (e) {
      console.error(e);
      return errorResponse(res);
    }
  }
);

module.exports = router;

import express, { Request, Response } from 'express';
import { db } from '../database/database';
import { User, UserCreateData, UserLoginData } from '../models/User';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     UserRegister:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           minLength: 6
 *           description: User's password
 *     UserLogin:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           description: User's password
 *     AuthResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         token:
 *           type: string
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             email:
 *               type: string
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegister'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid input or user already exists
 *       500:
 *         description: Server error
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password }: UserCreateData = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const hashedPassword = await hashPassword(password);

    db.run(
      'INSERT INTO users (email, password) VALUES (?, ?)',
      [email, hashedPassword],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ message: 'Email already exists' });
          }
          return res.status(500).json({ message: 'Error creating user' });
        }

        const token = generateToken(this.lastID, email);

        res.status(201).json({
          message: 'User registered successfully',
          token,
          user: {
            id: this.lastID,
            email
          }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLogin'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password }: UserLoginData = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    db.get(
      'SELECT * FROM users WHERE email = ?',
      [email],
      async (err, row: User) => {
        if (err) {
          return res.status(500).json({ message: 'Server error' });
        }

        if (!row) {
          return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isPasswordValid = await comparePassword(password, row.password);

        if (!isPasswordValid) {
          return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = generateToken(row.id, row.email);

        res.json({
          message: 'Login successful',
          token,
          user: {
            id: row.id,
            email: row.email
          }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
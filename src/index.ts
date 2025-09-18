import express, { Request, Response } from 'express';
import authRoutes from './routes/auth';
import { specs, swaggerUi } from './swagger';
import './database/database';

const app = express();
const PORT = 3000;

app.use(express.json());

/**
 * @swagger
 * /:
 *   get:
 *     summary: Get hello world message
 *     tags: [General]
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: hello world
 */
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'hello world' });
});

// Routes
app.use('/auth', authRoutes);

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
});
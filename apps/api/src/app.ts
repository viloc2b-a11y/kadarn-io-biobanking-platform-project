// Kadarn API app — exported for testing
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authMiddleware } from './middleware/auth.js';
import marketplaceRoutes from './routes/marketplace.js';
import workspaceRoutes from './routes/workspace.js';
import operationsRoutes from './routes/operations.js';

const app = express();
const API_PREFIX = '/api/v1';

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0-beta', timestamp: new Date().toISOString() });
});

app.use(`${API_PREFIX}/marketplace`, authMiddleware, marketplaceRoutes);
app.use(`${API_PREFIX}/workspace`, authMiddleware, workspaceRoutes);
app.use(`${API_PREFIX}/operations`, authMiddleware, operationsRoutes);

export { app, API_PREFIX };

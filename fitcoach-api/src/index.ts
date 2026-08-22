import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env';
import aiRoutes from './routes/ai';
import sessionsRoutes from './routes/sessions';
import plansRoutes from './routes/plans';
import huaweiRoutes from './routes/huaweiHealth';

const app = express();

// Security and utility middlewares
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'FitCoach AI API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
app.use('/api/ai', aiRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/plans', plansRoutes);
app.use('/api/huawei', huaweiRoutes);

// 404 Handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`🚀 FitCoach API corriendo en http://localhost:${config.port}`);
    console.log(`🤖 Fireworks AI Coach listo`);
  });
}

export default app;

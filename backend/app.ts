import express from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from './src/routes/authRoutes.ts';
import chatbotRoutes from './src/routes/chatbotRoutes.ts';
import streakRoutes from './src/routes/streakRoutes.ts';
import squadRoutes from './src/routes/squadRoutes.ts';

const app = express();

// Global Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Mount Sub-routing Pipeline
app.use('/api/auth', authRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/streak', streakRoutes);
app.use('/api/squad', squadRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'HEALTHY', timestamp: new Date() });
});

export default app;

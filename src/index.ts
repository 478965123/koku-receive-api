import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import receiptRoutes from './routes/receipt.routes';
import productSubmissionRoutes from './routes/productSubmission.routes';
import itemRoutes from './routes/item.routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:8084',
    'https://item-receipt.vercel.app',
    'https://receiving-hub.vercel.app',
    'https://receiving-hub.onrender.com',
    // Add production URLs here
  ],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/receipt', receiptRoutes);
app.use('/product-submission', productSubmissionRoutes);
app.use('/item', itemRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📦 Receipt API: http://localhost:${PORT}/receipt`);
  console.log(`📦 Product Submission API: http://localhost:${PORT}/product-submission`);
  console.log(`📦 Item API: http://localhost:${PORT}/item`);
});

export default app;

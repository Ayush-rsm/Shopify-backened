import express from 'express';
import dotenv from 'dotenv';
import imageRoutes from './routes/image.js';
import testRoutes from './routes/hello.js';
import cors from 'cors';
import shopifyAuthRoutes from './routes/shopifyAuth.js';
import shopifyClient from './routes/shopifyClient.js';

dotenv.config();
const app = express();
// // Allow all origins (for dev)
// app.use(cors());


app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "frame-ancestors https://*.myshopify.com https://admin.shopify.com");
  res.setHeader("X-Frame-Options", "ALLOWALL"); // or remove it completely
  next();
});

const corsOptions = {
  origin: '*', // or 'http://localhost:5173' for tighter control
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Shopify-Token'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());
app.use('/', testRoutes);
app.use('/api/auth', shopifyAuthRoutes);
app.use('/api/shopify', shopifyClient);
app.use('/api/images', imageRoutes);
app.use('/uploads', express.static('uploads'));

export default app;

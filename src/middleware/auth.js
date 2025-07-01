// src/middleware/auth.js
import { getStoreByToken } from '../db/dbHandler.js'; // Your store lookup method

export const verifyShopifyToken = async (req, res, next) => {
  const token = req.headers['x-shopify-token'];

  if (!token) return res.status(401).json({ error: 'Missing token' });

  const store = await getStoreByToken(token); // look up by token
  if (!store) return res.status(403).json({ error: 'Invalid token' });

  req.store = store;
  req.token = token;
  next();
};

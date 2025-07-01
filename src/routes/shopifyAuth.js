// src/routes/shopifyAuth.js
import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { addStore } from '../db/dbHandler.js'; 

dotenv.config();
const router = express.Router();

const {
  SHOPIFY_API_KEY,
  SHOPIFY_API_SECRET,
  SHOPIFY_SCOPES,
  SHOPIFY_REDIRECT_URI,
} = process.env;

// STEP 1: Start OAuth
router.get('/install', (req, res) => {
  const { shop } = req.query;
  if (!shop) return res.status(400).send('Missing shop parameter');

  const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=${SHOPIFY_SCOPES}&redirect_uri=${SHOPIFY_REDIRECT_URI}`;

  res.redirect(installUrl);
});


router.get('/callback', async (req, res) => {
  const { shop, code } = req.query;

  // Exchange code for access token
  const tokenRes = await axios.post(
    `https://${shop}/admin/oauth/access_token`,
    {
      client_id: process.env.SHOPIFY_API_KEY,
      client_secret: process.env.SHOPIFY_API_SECRET,
      code,
    }
  );

  const accessToken = tokenRes.data.access_token;
  const scope = tokenRes.data.scope;

  // Save shop + token
  await addStore({
    shopDomain: shop,
    accessToken: accessToken,
    scope: scope
  });

  res.redirect(`${process.env.FRONTEND_BASE_URL}/?shop=${shop}&token=${accessToken}`);
});

export default router;
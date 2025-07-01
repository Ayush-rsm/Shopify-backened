import express from 'express';
import { getTokenByStore } from '../db/dbHandler.js'; // You need to implement this
import dotenv from 'dotenv';
dotenv.config();

const {
  SHOPIFY_API_KEY,
  SHOPIFY_API_SECRET,
  SHOPIFY_SCOPES,
  SHOPIFY_REDIRECT_URI,
} = process.env;

const router = express.Router();

router.get('/', async (req, res) => {
  const { shop } = req.query;

  if (!shop) {
    return res.status(400).send('Missing shop parameter');
  }

  try {
    const existingToken = await getTokenByStore(shop);

    if (existingToken) {
      return res.redirect(`${process.env.FRONTEND_BASE_URL}/?shop=${shop}&token=${accessToken}`);
    } else {
      // First-time install: redirect to Shopify OAuth
      const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=${SHOPIFY_SCOPES}&redirect_uri=${SHOPIFY_REDIRECT_URI}`;
      return res.redirect(installUrl);
    }
  } catch (err) {
    console.error('Error checking access token:', err);
    return res.status(500).send('Something went wrong');
  }
});

export default router;

import express from 'express';
import { verifyShopifyToken } from '../middleware/auth.js';
import { getShopifyImages } from '../utils/getShopifyImages.js';
import { getShopifyImageById } from '../utils/getShopifyImageById.js';
import { updateShopifyImageMetadata } from '../utils/updateShopifyImageMetadata.js';
import { generateAltText, generateAltTextWithGemini } from '../utils/generateAltText.js';

const router = express.Router();

router.get('/images', verifyShopifyToken, async (req, res) => {
  const { page = 1, limit = 10, missingAltText } = req.query;
  const token = req.token; // 👈 assuming middleware attaches token here

  try {
    const store = req.store

    const result = await getShopifyImages({
      shopDomain: store.shopDomain,
      accessToken: store.accessToken,
      page: parseInt(page),
      limit: parseInt(limit),
      filterMissingAlt: missingAltText === 'true',
    });

    res.json(result);
  } catch (err) {
    console.error('Error fetching Shopify images:', err);
    res.status(500).json({ error: 'Failed to fetch Shopify images' });
  }
});


// Update alt text for a Shopify product image
router.post('/image/:imageId/alt', verifyShopifyToken, async (req, res) => {
  const { imageId } = req.params;
  const { altText, productId } = req.body;

  if (!altText || !productId) {
    return res.status(400).json({ error: 'Missing altText or productId in request body' });
  }

  const store = req.store;

  try {
    const updatedImage = await updateShopifyImageMetadata({
      shopDomain: store.shopDomain,
      accessToken: store.accessToken,
      productId,
      imageId,
      altText,
    });

    res.json({ success: true, image: updatedImage });
  } catch (error) {
    console.error('Error updating Shopify image alt text:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to update alt text' });
  }
});


router.get('/image/:id/alt', verifyShopifyToken, async (req, res) => {
  const { id } = req.params;
  const useLLM = req.query.useLLM === 'true';
  const store = req.store;

  try {
    // 1. Fetch image metadata from Shopify
    const image = await getShopifyImageById({
      shopDomain: store.shopDomain,
      accessToken: store.accessToken,
      imageId: id
    });

    if (!image) {
      return res.status(404).json({ error: 'Image not found in Shopify' });
    }

    // 2. Generate alt text using Gemini or fallback method
    const metadata = {
      title: image.productTitle,
      width: image.width,
      height: image.height,
    };

    const altText = useLLM
      ? await generateAltTextWithGemini(image.src, metadata, !useLLM)
      : generateAltText(image.src, metadata);

    res.json({ suggestedAltText: altText });
  } catch (err) {
    console.error('Error generating alt text:', err);
    res.status(500).json({ error: 'Failed to generate alt text' });
  }
});

export default router;


import express from 'express';
import multer from 'multer';
import { uploadImage } from '../storage/storageHandler.js';
import { addImage, getImages, updateImageAltText, getImageById } from '../db/dbHandler.js';
import { generateAltText, generateAltTextWithGemini } from '../utils/generateAltText.js'

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('image'), async (req, res) => {
  const file = req.file;
  const metadata = req.body;

  if (!file) return res.status(400).json({ error: 'Image is required' });

  try {
    const uploadResult = await uploadImage(file);
    const imageRecord = {
      id: Date.now().toString(),
      url: uploadResult.url,
      storage: uploadResult.storage,
      originalName: file.originalname,
      metadata,
      createdAt: new Date().toISOString()
    };
    await addImage(imageRecord);
    res.status(201).json(imageRecord);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Image upload failed' });
  }
});

router.get('/', async (req, res) => {
  const page = parseInt(req.query.page || '1');
  const limit = parseInt(req.query.limit || '10');
  const useLLM = req.query.useLLM === 'true'; // defaults to false

  try {
    const result = await getImages(page, limit);

    const enrichedImages = await Promise.all(result.data.map(async (img) => {
      const hasAlt = !!(img.metadata?.altText?.trim());
      if (hasAlt) {
        return {
          ...img,
          missingAltText: false,
          suggestedAltText: null
        };
      }

      // Generate alt using appropriate function
      const suggestion = useLLM
        ? await generateAltTextWithGemini(img.url, img.metadata)
        : generateAltText(img.url, img.metadata);

      return {
        ...img,
        missingAltText: true,
        suggestedAltText: suggestion
      };
    }));

    res.json({
      ...result,
      data: enrichedImages
    });
  } catch (err) {
    console.error('Error listing images:', err);
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});


router.post('/:id/alt', async (req, res) => {
  const { id } = req.params;
  const { altText } = req.body;

  if (!altText || typeof altText !== 'string') {
    return res.status(400).json({ error: 'altText is required and must be a string' });
  }

  try {
    const success = await updateImageAltText(id, altText);

    if (!success) {
      return res.status(404).json({ error: 'Image not found or update failed' });
    }

    return res.json({ success: true, message: 'Alt text updated' });
  } catch (err) {
    console.error(`Failed to update alt text for image ${id}:`, err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


// GET /api/images/:id/alt
router.get('/:id/alt', async (req, res) => {
  const { id } = req.params;
  const useLLM = req.query.useLLM === 'true'; // defaults to false

  try {
    // 1. Get image from DB
    const image = await getImageById(id);
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // 2. Generate alt text suggestion
    let altText;
    if (useLLM) {
      altText = await generateAltTextWithGemini(image.url, image.metadata || {});
    } else {
      altText = generateAltText(image.url, image.metadata || {});
    }

    res.json({ suggestedAltText: altText });
  } catch (err) {
    console.error('Error generating alt text:', err);
    res.status(500).json({ error: 'Failed to generate alt text' });
  }
});


export default router;
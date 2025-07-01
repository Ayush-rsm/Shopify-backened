import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate alt text using Google Gemini for a local or remote image.
 * @param {string} imageUrl - Either local path (like /uploads/file.jpg) or remote URL
 * @param {Object} metadata - Optional metadata for the image
 * @param {boolean} isUrlLocal - If true, loads from disk; else, fetches from URL
 */
async function generateAltTextWithGemini(imageUrl, metadata = {}, isUrlLocal = true) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  let imageBuffer;
  let mimeType;

  if (isUrlLocal) {
    // 🗂️ Local image
    const absolutePath = path.resolve(`.${imageUrl}`);
    try {
      imageBuffer = await fs.readFile(absolutePath);
    } catch (err) {
      console.error(`❌ Failed to read local image: ${absolutePath}`, err);
      throw new Error('Failed to read local image');
    }
    mimeType = getMimeType(imageUrl);
  } else {
    // 🌐 Remote image
    try {
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      imageBuffer = Buffer.from(response.data, 'binary');
      mimeType = response.headers['content-type'] || getMimeType(imageUrl);
    } catch (err) {
      console.error(`❌ Failed to fetch image from URL: ${imageUrl}`, err);
      throw new Error('Failed to fetch remote image');
    }
  }

  const base64Image = imageBuffer.toString('base64');

  const promptParts = [
    {
      text: `Describe this image in one short sentence suitable for HTML alt text. Don't mention the alt text term just give the description.`
    },
    {
      inlineData: {
        mimeType,
        data: base64Image
      }
    }
  ];

  if (metadata && (metadata.title || metadata.tags || metadata.description)) {
    const metaText = Object.entries(metadata)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
    promptParts.unshift({ text: `Use this metadata to help if useful: ${metaText}` });
  }

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: promptParts }]
  });

  return result.response.text().trim();
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  return 'application/octet-stream';
}

/**
 * Generate basic alt text suggestion from metadata only
 */
function generateAltText(image, metadata) {
  if (!metadata) return 'Image';

  const parts = [];

  if (metadata.title) parts.push(metadata.title);
  if (metadata.tags) parts.push(`Tags: ${metadata.tags}`);
  if (metadata.description) parts.push(metadata.description);

  return parts.length > 0
    ? parts.join(' — ')
    : 'Descriptive image';
}

export { generateAltTextWithGemini, generateAltText };

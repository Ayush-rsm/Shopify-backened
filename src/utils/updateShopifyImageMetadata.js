import axios from 'axios';
import handleShopifyAuthError from '../utils/handleShopifyAuthError.js'

/**
 * Update alt text for a Shopify product image only.
 * Throws an error for page/article image IDs.
 */
export async function updateShopifyImageMetadata({ shopDomain, accessToken, imageId, altText }) {
  const headers = {
    'X-Shopify-Access-Token': accessToken,
    'Content-Type': 'application/json',
  };

  const parts = imageId.split('-');
  const type = parts[0];

  if (type !== 'product') {
    throw new Error(`Updating alt text is only supported for product images. "${type}" type is not supported.`);
  }

  const productId = parts[1];
  const imageIdPart = parts[2];

  const url = `https://${shopDomain}/admin/api/2024-01/products/${productId}/images/${imageIdPart}.json`;

  try {
    const response = await axios.put(
      url,
      {
        image: {
          id: imageIdPart,
          alt: altText,
        },
      },
      { headers }
    );

    return {
      success: true,
      type: 'product',
      updated: response.data.image,
    };
  } catch (error) {
    console.error('Error updating product image:', error?.response?.data || error.message);
    handleShopifyAuthError(error, res);
    throw error;
  }
}

import axios from 'axios';
import * as cheerio from 'cheerio'; 

function extractImagesFromHtml(html) {
  const $ = cheerio.load(html || '');
  const images = [];
  $('img').each((i, el) => {
    const src = $(el).attr('src') || '';
    const alt = $(el).attr('alt') || '';
    images.push({ src, alt });
  });
  return images;
}

export async function getShopifyImageById({ shopDomain, accessToken, imageId }) {
  const headers = { 'X-Shopify-Access-Token': accessToken };
  const parts = imageId.split('-');
  const type = parts[0];

  if (type === 'product') {
    const productId = parts[1];
    const imageId = parts[2];

    const productRes = await axios.get(`https://${shopDomain}/admin/api/2024-01/products/${productId}.json`, {
      headers
    });

    const product = productRes.data.product;
    const found = product.images.find(img => String(img.id) === imageId);

    if (found) {
      return {
        id: `product-${productId}-${imageId}`,
        type: 'product',
        src: found.src,
        alt: found.alt || '',
        createdAt: found.created_at,
        productId: productId,
        title: product.title
      };
    }
  }

  if (type === 'page') {
    const pageId = parts[1];
    const index = parseInt(parts[2]);

    const pageRes = await axios.get(`https://${shopDomain}/admin/api/2024-01/pages/${pageId}.json`, {
      headers
    });

    const page = pageRes.data.page;
    const images = extractImagesFromHtml(page.body_html);
    const img = images[index];

    if (img) {
      return {
        id: imageId,
        type: 'page',
        src: img.src,
        alt: img.alt || '',
        createdAt: page.created_at,
        pageId: page.id,
        title: page.title
      };
    }
  }

  if (type === 'article') {
    const articleId = parts[1];
    const index = parseInt(parts[2]);

    const blogsRes = await axios.get(`https://${shopDomain}/admin/api/2024-01/blogs.json`, { headers });

    for (const blog of blogsRes.data.blogs) {
      try {
        const articleRes = await axios.get(`https://${shopDomain}/admin/api/2024-01/blogs/${blog.id}/articles/${articleId}.json`, {
          headers
        });

        const article = articleRes.data.article;
        const images = extractImagesFromHtml(article.body_html);
        const img = images[index];

        if (img) {
          return {
            id: imageId,
            type: 'article',
            src: img.src,
            alt: img.alt || '',
            createdAt: article.created_at,
            articleId: article.id,
            title: article.title
          };
        }
      } catch (err) {
        // continue to next blog if not found
      }
    }
  }

  return null;
}

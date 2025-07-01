import axios from 'axios';
import * as cheerio from 'cheerio'; 


function extractImagesFromHtml(html, type, parentId, createdAt) {
  const $ = cheerio.load(html || '');
  const images = [];
  $('img').each((i, el) => {
    const src = $(el).attr('src') || '';
    const alt = $(el).attr('alt') || '';
    images.push({
      id: `${type}-${parentId}-${i}`,
      type,
      src,
      alt,
      createdAt
    });
  });
  return images;
}

export async function getShopifyImages({
  shopDomain,
  accessToken,
  page = 1,
  limit = 10,
  filterMissingAlt = true
}) {
  const offset = (page - 1) * limit;
  const headers = { 'X-Shopify-Access-Token': accessToken };

  // 1. Products
  const productRes = await axios.get(`https://${shopDomain}/admin/api/2024-01/products.json`, {
    headers,
    params: { limit: 250 }
  });

  const productImages = productRes.data.products.flatMap(product =>
    product.images.map(img => ({
      id: `product-${product.id}-${img.id}`,
      type: 'product',
      src: img.src,
      alt: img.alt || '',
      createdAt: img.created_at
    }))
  );

  // 2. Pages
  const pagesRes = await axios.get(`https://${shopDomain}/admin/api/2024-01/pages.json`, {
    headers,
    params: { limit: 250 }
  });

  const pageImages = pagesRes.data.pages.flatMap(page =>
    extractImagesFromHtml(page.body_html, 'page', page.id, page.created_at)
  );

  // 3. Articles
  const blogsRes = await axios.get(`https://${shopDomain}/admin/api/2024-01/blogs.json`, { headers });

  const articleImages = [];

  for (const blog of blogsRes.data.blogs) {
    const articlesRes = await axios.get(`https://${shopDomain}/admin/api/2024-01/blogs/${blog.id}/articles.json`, {
      headers,
      params: { limit: 250 }
    });

    const images = articlesRes.data.articles.flatMap(article =>
      extractImagesFromHtml(article.body_html, 'article', article.id, article.created_at)
    );

    articleImages.push(...images);
  }

  // Combine
  let allImages = [...productImages, ...pageImages, ...articleImages];

  // Filter missing alt
  const missingAltTextImages = allImages.filter(img => !img.alt || img.alt.trim() === '');
  if (filterMissingAlt) {
    allImages = missingAltTextImages;
  }

  // Pagination
  const paginated = allImages.slice(offset, offset + limit);

  return {
    data: paginated,
    totalImages: allImages.length,
    totalmissingAltTextImages: missingAltTextImages.length
  };
}

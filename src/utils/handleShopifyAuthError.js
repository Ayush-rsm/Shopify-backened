// utils/handleShopifyAuthError.js
function handleShopifyAuthError(error, res) {
  const status = error?.response?.status;

  // Check if it's a Shopify unauthorized error
  if ((status === 401 || status === 403) && error.config?.url) {
    const shop = new URL(error.config.url).hostname;
    const installUrl = `/install?shop=${shop}`;
    return res.redirect(installUrl);
  }

  // If not an auth error, rethrow or handle normally
  throw error;
}

export default { handleShopifyAuthError }
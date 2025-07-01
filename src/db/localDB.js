import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';

const file = path.resolve('./imageDB.json');
const adapter = new JSONFile(file);

// ✅ Provide defaultData as second param
const db = new Low(adapter, { images: [] });

await db.read();
db.data ||= { stores: [] };

export const addImage = async (img) => {
  db.data.images.push(img);
  await db.write();
};

export const getImages = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  return {
    data: db.data.images.slice(offset, offset + limit),
    total: db.data.images.length,
  };
};

export const updateImageAltText = async (id, altText) => {
  const image = db.data.images.find((img) => img.id === id);
  if (!image) return false;

  image.metadata = {
    ...image.metadata,
    altText,
  };

  await db.write();
  return true;
};

export const getImageById = async (id) => {
  return db.data.images.find(img => img.id === id);
};


/**
 * Adds or updates store credentials in local DB
 * @param {{ shopDomain: string, accessToken: string }} store
 */
export const addStore = async (store) => {
  db.data.stores = db.data.stores?.filter(s => s.shopDomain !== store.shopDomain);
  db.data.stores?.push(store);
  await db.write();
};

/**
 * Retrieves store credentials from local DB
 * @param {string} shopDomain
 */
export const getStoreDetails = async (shopDomain) => {
  await db.read();
  return db.data.stores.find(s => s.shopDomain === shopDomain);
};


export const getStoreByToken = async (token) => {
  await db.read();
  db.data.stores = db.data.stores || [];
  return db.data.stores.find(store => store.accessToken === token);
};


export const getTokenByStore = async (shop) => {
  await db.read();
  db.data.stores = db.data.stores || [];

  const store = db.data.stores.find(store => store.shop === shop);
  return store?.accessToken || null;
};
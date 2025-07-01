import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

export const addImage = async (img) => {
  img.createdAt = new Date().toISOString();
  await db.collection('images').add(img);
};

export const getImages = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  const snapshot = await db.collection('images')
    .orderBy('createdAt', 'desc')
    .offset(offset)
    .limit(limit)
    .get();

  const data = snapshot.docs.map(doc => ({
    id: doc.id,        // capture doc ID
    ...doc.data()
  }));

  // Optional: if you want the true total count, use a separate query.
  const total = data.length;

  return {
    data,
    total
  };
};

export const updateImageAltText = async (id, altText) => {
  try {
    const docRef = db.collection('images').doc(id);

    const docSnap = await docRef.get();
    if (!docSnap.exists) return false;

    await docRef.update({
      'metadata.altText': altText
    });

    return true;
  } catch (err) {
    console.error('Error updating alt text in Firestore:', err);
    return false;
  }
};

export const getImageById = async (id) => {
  const snapshot = await db.collection('images').doc(id).get();
  return snapshot.exists ? { id: snapshot.id, ...snapshot.data() } : null;
};


/**
 * Adds or updates store credentials in Firestore
 * @param {{ shopDomain: string, accessToken: string }} store
 */
export const addStore = async (store) => {
  await db.collection('stores').doc(store.shopDomain).set(store);
};

/**
 * Retrieves store credentials from Firestore
 * @param {string} shopDomain
 */
export const getStoreDetails = async (shopDomain) => {
  const doc = await db.collection('stores').doc(shopDomain).get();
  return doc.exists ? doc.data() : null;
};

export const getStoreByToken = async (token) => {
  const snapshot = await db
    .collection('stores')
    .where('accessToken', '==', token)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  return snapshot.docs[0].data();
};



import { db } from './firebase.js'; // adjust if your firebase instance exports differently

export const getTokenByStore = async (shop) => {
  const snapshot = await db
    .collection('stores')
    .where('shop', '==', shop)
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const store = snapshot.docs[0].data();
  return store.accessToken || null;
};


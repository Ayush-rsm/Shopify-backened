import dotenv from 'dotenv';
dotenv.config();

const DB_DRIVER = process.env.DB_DRIVER || 'local';

let dbModule;
if (DB_DRIVER === 'firebase') {
  dbModule = await import('./firebaseDB.js');
} else {
  dbModule = await import('./localDB.js');
}

export const addImage = dbModule.addImage;
export const getImages = dbModule.getImages;
export const updateImageAltText = dbModule.updateImageAltText;
export const getImageById = dbModule.getImageById;
export const addStore = dbModule.addStore;
export const getStoreDetails = dbModule.getStoreDetails;
export const getStoreByToken = dbModule.getStoreByToken;
export const getTokenByStore = dbModule.getTokenByStore;

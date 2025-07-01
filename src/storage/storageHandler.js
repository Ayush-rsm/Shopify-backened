import dotenv from 'dotenv';
dotenv.config();

const DRIVER = process.env.STORAGE_DRIVER || 'local';

let uploader;
if (DRIVER === 'firebase') {
  uploader = await import('./firebaseStorage.js');
} else {
  uploader = await import('./localStorage.js');
}

export const uploadImage = uploader.uploadImage;
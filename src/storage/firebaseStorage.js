import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('./firebase-service-account.json'));

initializeApp({
  credential: cert(serviceAccount),
  storageBucket: process.env.FIREBASE_BUCKET,
});

const bucket = getStorage().bucket();

export const uploadImage = async (file) => {
  const fileRef = bucket.file(file.originalname);
  await fileRef.save(file.buffer);
  await fileRef.makePublic();

  return {
    url: fileRef.publicUrl(),
    storage: 'firebase'
  };
};

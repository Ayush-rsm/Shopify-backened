import fs from 'fs';
import path from 'path';

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

export const uploadImage = async (file) => {
  const filePath = path.join(uploadDir, file.originalname);
  fs.writeFileSync(filePath, file.buffer);

  return {
    url: `/uploads/${file.originalname}`,
    storage: 'local'
  };
};

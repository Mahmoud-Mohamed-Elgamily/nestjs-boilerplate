import { diskStorage } from 'multer';
import { extname } from 'path';

export const getMulterConfig = () => {
  return {
    storage: diskStorage({
      destination: './public/uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const fileExt = extname(file.originalname);
        const fileName = `${file.fieldname}-${uniqueSuffix}${fileExt}`;
        cb(null, fileName); // Use callback to return the file name
      },
    }),
    limits: { fileSize: 500 * 1024 }, // Limit file size to 500KB
  };
};

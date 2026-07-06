import multer from 'multer';
// Use memory storage to store raw image bytes in req.file.buffer
const storage = multer.memoryStorage();
// Accept only common image types and enforce size limits (max 5MB)
export const uploadLabel = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only image files are permitted.'));
        }
    }
}).single('labelImage');
export default uploadLabel;

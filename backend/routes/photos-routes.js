import express from 'express';
import multer from 'multer';
import path from 'path';

const router = express.Router();
const storage = multer.diskStorage({
  destination: 'uploads/photos/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

router.post('/', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
  
    const fileUrl = `/uploads/photos/${req.file.filename}`;
    res.status(201).json({ url: fileUrl });
  } catch (error) {
    console.log(error);
    res.status(500).json({error});
  }
});

export default router;

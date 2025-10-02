import express from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();
const router = express.Router();

// Setup multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/services';
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.fieldname}${ext}`);
  }
});

const upload = multer({ storage });

// CREATE a new service with optional picture
router.post('/', upload.single('picture'), async (req, res) => {
  const { service, picture, description } = req.body;

  try {
    const created = await prisma.services.create({
      data: {
        service,
        picture,
        description
      }
    });
    res.status(201).json({ successful: true, data: created });
  } catch (error) {
    res.status(400).json({ successful: false, message: error.message });
  }
});

// READ all services
router.get('/', async (_req, res) => {
  try {
    const services = await prisma.services.findMany();
    res.json({ successful: true, data: services });
  } catch (error) {
    res.status(500).json({ successful: false, message: error.message });
  }
});

// READ one service by ID
router.get('/:id', async (req, res) => {
  try {
    const service = await prisma.services.findUnique({
      where: { service_id: req.params.id }
    });

    if (!service) {
      return res.status(404).json({ successful: false, message: 'Service not found' });
    }

    res.json({ successful: true, data: service });
  } catch (error) {
    res.status(500).json({ successful: false, message: error.message });
  }
});

// UPDATE a service (including optional new picture)
router.put('/:id', upload.single('picture'), async (req, res) => {
  const { service, description } = req.body;
  const picture = req.file ? req.file.filename : undefined;

  try {
    const existing = await prisma.services.findUnique({
      where: { service_id: req.params.id }
    });

    if (!existing) {
      return res.status(404).json({ successful: false, message: 'Service not found' });
    }

    // Optional: delete old picture file
    if (picture && existing.picture) {
      const oldPath = `uploads/services/${existing.picture}`;
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const updated = await prisma.services.update({
      where: { service_id: req.params.id },
      data: {
        service,
        description,
        ...(picture ? { picture } : {})
      }
    });

    res.json({ successful: true, data: updated });
  } catch (error) {
    res.status(400).json({ successful: false, message: error.message });
  }
});

// DELETE a service (and its picture)
router.delete('/:id', async (req, res) => {
  try {
    const existing = await prisma.services.findUnique({
      where: { service_id: req.params.id }
    });

    if (!existing) {
      return res.status(404).json({ successful: false, message: 'Service not found' });
    }

    // Delete picture file
    if (existing.picture) {
      const filePath = `uploads/services/${existing.picture}`;
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await prisma.services.delete({
      where: { service_id: req.params.id }
    });

    res.json({ successful: true, message: 'Service deleted successfully' });
  } catch (error) {
    res.status(400).json({ successful: false, message: error.message });
  }
});

export default router;

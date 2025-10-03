import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const tasks = await prisma.tasks.findMany({
      include: { user: { select: { user_id: true, email: true, first_name: true, last_name: true } } },
    });
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { task_title, task_description, deadline } = req.body;

    if (!task_title || !deadline) {
      return res.status(400).json({ message: 'Task title and deadline are required' });
    }

    const newTask = await prisma.tasks.create({
      data: {
        user_id: req.user.user_id,
        task_title,
        task_description,
        deadline: new Date(deadline),
      },
    });

    res.status(201).json(newTask);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/:task_id', async (req, res) => {
  try {
    const { task_id } = req.params;
    const { task_title, task_description, deadline, finished } = req.body;

    const existingTask = await prisma.tasks.findUnique({ where: { task_id: Number(task_id) } });
    if (!existingTask || existingTask.user_id !== req.user.user_id) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    const updatedTask = await prisma.tasks.update({
      where: { task_id: Number(task_id) },
      data: {
        task_title,
        task_description,
        deadline: deadline ? new Date(deadline) : undefined,
        finished,
      },
    });

    res.json(updatedTask);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/:task_id', async (req, res) => {
  try {
    const { task_id } = req.params;

    const existingTask = await prisma.tasks.findUnique({ where: { task_id: Number(task_id) } });
    if (!existingTask || existingTask.user_id !== req.user.user_id) {
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }

    await prisma.tasks.delete({ where: { task_id: Number(task_id) } });
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;

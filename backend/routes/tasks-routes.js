import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const tasks = await prisma.tasks.findMany();
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/:page', async (req, res) => {
  try {
    const page = Number(req.params.page) || 0;
    const pageSize = 5;

    const totalTasks = await prisma.tasks.count();

    const tasks = await prisma.tasks.findMany({
      skip: page * pageSize,
      take: pageSize,
      orderBy: [
        {finished: 'asc'},
        { deadline: 'asc' },
        { created: 'asc' }
      ],
    });

    res.json({
      tasks,
      info: {
        total: totalTasks,
        page,
        pageSize,
        totalPages: Math.ceil(totalTasks / pageSize),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
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
    if (!existingTask) {
      return res.status(403).json({ message: 'task not found ' });
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
    if (!existingTask) {
      return res.status(403).json({ message: 'task not found' });
    }

    await prisma.tasks.delete({ where: { task_id: Number(task_id) } });
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;

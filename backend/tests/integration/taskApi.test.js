import request from "supertest";
import app from "../../src/app.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.tasks.deleteMany();
  await prisma.$disconnect();
});

describe("Tasks API Integration", () => {
  test("POST /api/tasks → should create a new task", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .send({
        task_title: "Test Task",
        task_description: "This is a test",
        deadline: new Date().toISOString(),
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("task_id");
  });

  test("GET /api/tasks/0 → should return max 5 unfinished tasks", async () => {
    const res = await request(app).get("/api/tasks/0");
    expect(res.status).toBe(200);
    expect(res.body.tasks.length).toBeLessThanOrEqual(5);
  });

  test("PUT /api/tasks/:id → should update a task", async () => {
    const newTask = await prisma.tasks.create({
      data: {
        task_title: "Update Test",
        task_description: "Old desc",
        deadline: new Date(),
      },
    });

    const res = await request(app)
      .put(`/api/tasks/${newTask.task_id}`)
      .send({ task_description: "Updated desc" });

    expect(res.status).toBe(200);
    expect(res.body.task_description).toBe("Updated desc");
  });

  test("PATCH /api/tasks/:id/done → should mark task as finished", async () => {
    const task = await prisma.tasks.create({
      data: {
        task_title: "Done Test",
        task_description: "To be done",
        deadline: new Date(),
      },
    });

    const res = await request(app)
      .put(`/api/tasks/${task.task_id}`)
      .send({ finished: true });

    expect(res.status).toBe(200);
    const updated = await prisma.tasks.findUnique({
      where: { task_id: task.task_id },
    });
    expect(updated.finished).toBe(true);
  });

  test("DELETE /api/tasks/:id → should delete a task", async () => {
    const task = await prisma.tasks.create({
      data: {
        task_title: "Delete Test",
        task_description: "To be deleted",
        deadline: new Date(),
      },
    });

    const res = await request(app).delete(`/api/tasks/${task.task_id}`);
    expect(res.status).toBe(200);
  });
});

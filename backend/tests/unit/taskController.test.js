import { describe, test, expect, jest } from "@jest/globals";
import { createTask, updateTask, deleteTask } from "./taskController.js";

describe("tasksController unit tests", () => {
  test("createTask → creates a task with mocked Prisma", async () => {
    const mockPrisma = {
      tasks: { create: jest.fn().mockResolvedValue({ task_id: 1, task_title: "Mock Task", finished: false }) },
    };

    const taskData = { task_title: "Ignored", task_description: "Ignored", deadline: new Date() };
    const task = await createTask(mockPrisma, taskData);

    expect(task.task_title).toBe("Mock Task");
    expect(mockPrisma.tasks.create).toHaveBeenCalledWith({ data: taskData });
  });

  test("updateTask → updates a task with mocked Prisma", async () => {
    const mockPrisma = {
      tasks: { update: jest.fn().mockResolvedValue({ task_id: 1, task_title: "Updated Task" }) },
    };

    const updateData = { task_title: "Updated Task" };
    const task = await updateTask(mockPrisma, 1, updateData);

    expect(task.task_title).toBe("Updated Task");
    expect(mockPrisma.tasks.update).toHaveBeenCalledWith({ where: { task_id: 1 }, data: updateData });
  });

  test("deleteTask → deletes a task with mocked Prisma", async () => {
    const mockPrisma = {
      tasks: { delete: jest.fn().mockResolvedValue({ task_id: 1 }) },
    };

    const task = await deleteTask(mockPrisma, 1);

    expect(task.task_id).toBe(1);
    expect(mockPrisma.tasks.delete).toHaveBeenCalledWith({ where: { task_id: 1 } });
  });
});

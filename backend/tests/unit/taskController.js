// Create a new task
export const createTask = async (prismaClient, data) => {
  return await prismaClient.tasks.create({ data });
};

// Update an existing task
export const updateTask = async (prismaClient, task_id, data) => {
  return await prismaClient.tasks.update({
    where: { task_id },
    data,
  });
};

// Delete a task
export const deleteTask = async (prismaClient, task_id) => {
  return await prismaClient.tasks.delete({
    where: { task_id },
  });
};

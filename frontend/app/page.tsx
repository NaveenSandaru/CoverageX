"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  Trash2,
  PlusCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import TaskDialog from "@/components/taskDialog";
import DeleteConfirmationDialog from "@/components/deleteConfirmationDialog";


interface Task {
  task_id: number;
  task_title: string;
  task_description: string;
  deadline: string;
  created: string;
  finished: boolean;
}

export default function Home() {
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [finishedTasks, setFinishedTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [pageNumber, setPageNumber] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task>();
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [visibleFinishedCount, setVisibleFinishedCount] = useState(5);
  const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = (id: number) => {
    setDeletingTaskId(id);
    setOpenDeleteDialog(true);
  };

  const handleDeleteTask = async () => {
    if (!deletingTaskId) return;
    setDeleting(true);
    try {
      await axios.delete(`${backendURL}/tasks/${deletingTaskId}`);
      toast.success("Task deleted");
      fetchTasks();
    } catch {
      toast.error("Failed to delete task");
    } finally {
      setDeleting(false);
      setOpenDeleteDialog(false);
      setDeletingTaskId(null);
    }
  };

  const fetchTasks = async () => {
    setLoadingTasks(true);
    try {
      const res = await axios.get(`${backendURL}/tasks/${pageNumber}`);
      if (res.status !== 200) throw new Error("Error fetching tasks");
      setTasks(res.data.tasks);
      setTotalTasks(res.data.info.total);
      setTotalPages(res.data.info.totalPages);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingTasks(false);
    }
  };

  const fetchFinishedTasks = async () => {
    try {
      const res = await axios.get(`${backendURL}/tasks/finished`,{
        headers: { "Cache-Control": "no-cache" },
      });
      if (res.status == 500) {
        throw new Error("Error fetching finished tasks");
      }
      setFinishedTasks(res.data.tasks);
    }
    catch (err: any) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    fetchFinishedTasks();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [pageNumber]);

  const handleDialogOpen = () => {
    setOpenDialog(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setOpenDialog(true);
  };

  const handleToggleFinish = async (task: Task) => {
    try {
      await axios.put(`${backendURL}/tasks/${task.task_id}`, {
        ...task,
        finished: !task.finished,
      });
      toast.success(task.finished ? "Marked as pending" : "Marked as finished");
      fetchTasks();
      fetchFinishedTasks();
    } catch {
      toast.error("Failed to update status");
    }
  };

  if (loadingTasks) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Loader2 className="h-10 w-10 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 backdrop-blur-2xl p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col items-center space-y-4">
          {/* Logo + Title */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center"
          >
            <img
              src="/logo.png"
              alt="Planora Logo"
              className="h-20 w-20 mb-2 object-contain drop-shadow-lg"
            />
            <h1 className="text-5xl font-extrabold text-center bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 drop-shadow-lg">
              Planora
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-2xl font-semibold text-center text-gray-300"
          >
            My Tasks
          </motion.h3>

          {/* Add Task Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Button
              onClick={handleDialogOpen}
              className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 rounded-2xl shadow-lg flex items-center gap-2 px-5 py-2 cursor-pointer transition-all duration-300"
            >
              <PlusCircle className="h-5 w-5" />
              Add Task
            </Button>
          </motion.div>
        </div>


        {/* Task stats */}
        <p className="text-center text-gray-400">
          Showing page {pageNumber + 1} of{" "}
          {totalPages === 0 ? totalPages + 1 : totalPages} — Total tasks:{" "}
          {totalTasks}
        </p>

        {/* Task list */}
        {tasks.length === 0 ? (
          <p className="text-center text-gray-400 italic">
            No tasks found 🎉
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {tasks.map((task, idx) => (
              <motion.div
                key={task.task_id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="w-full max-w-2xl" // ensures cards are not too wide
              >
                <Card
                  className={`bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg hover:shadow-cyan-500/10 transition-all duration-300 rounded-2xl ${task.finished ? "opacity-70" : ""
                    }`}

                >
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span
                        className={`text-lg text-white ${task.finished ? "line-through text-gray-400" : ""
                          }`}
                      >
                        {task.task_title}
                      </span>
                      {task.finished ? (
                        <Badge className="bg-green-500/20 text-green-400 flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" /> Done
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-500/20 text-yellow-400 flex items-center gap-1">
                          <Clock className="h-4 w-4" /> Pending
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="flex justify-between items-center">
                    {/* Left: Task info */}
                    <div className="space-y-2">
                      <p
                        className={`text-sm ${task.finished ? "line-through text-gray-400" : "text-gray-200"
                          }`}
                      >
                        {task.task_description}
                      </p>

                      <div className={`flex items-center gap-2 text-sm ${task.finished ? "text-gray-400" : "text-gray-400"}`}>
                        <Calendar className="h-4 w-4" />
                        {new Date(task.deadline).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Right: Action buttons */}
                    <div className="flex items-center gap-2">
                      {!task.finished && (
                        <Button
                          size="icon"
                          variant="secondary"
                          className="rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 cursor-pointer"
                          onClick={() => handleEditTask(task)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      )}

                      <Button
                        size="icon"
                        variant="destructive"
                        className="rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-400/20 cursor-pointer"
                        onClick={() => confirmDelete(task.task_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>

                      {!task.finished && (
                        <Button
                          size="icon"
                          className="rounded-xl bg-green-500/20 hover:bg-cyan-500/40 text-green-400 border border-cyan-400/20 cursor-pointer"
                          onClick={() => handleToggleFinish(task)}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

              </motion.div>
            ))}
          </div>
        )}

        {/* Page controls */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-4 mt-6">
            <Button
              disabled={pageNumber === 0}
              onClick={() => setPageNumber((p) => Math.max(0, p - 1))}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 cursor-pointer"
            >
              Previous
            </Button>
            <Button
              disabled={pageNumber === totalPages - 1}
              onClick={() => setPageNumber((p) => Math.min(totalPages - 1, p + 1))}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 cursor-pointer"
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Collapsible Sidebar */}
      <motion.div
        initial={{ x: -300, opacity: 0 }}
        animate={{
          x: showSidebar ? 0 : -300,
          opacity: showSidebar ? 1 : 0,
        }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
        className="fixed top-0 left-0 h-full w-72 bg-white/10 backdrop-blur-xl border-r border-white/20 shadow-xl z-[60] flex flex-col p-4 space-y-4"
      >
        {/* Sidebar Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">Finished Tasks</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSidebar(false)}
            className="text-white/60 hover:text-white cursor-pointer"
          >
            ✕
          </Button>
        </div>

        {/* Finished task list */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {finishedTasks.length === 0 ? (
            <p className="text-gray-400 text-sm italic">No finished tasks yet 🎯</p>
          ) : (
            finishedTasks.slice(0, visibleFinishedCount).map((task) => (
              <Card
                key={task.task_id}
                className="bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-all cursor-default"
              >
                <CardContent className="p-3 flex flex-col">
                  <span className="text-white text-sm">{task.task_title}</span>
                  <span className="text-gray-400 text-xs mt-1">
                    {new Date(task.deadline).toLocaleDateString()}
                  </span>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Show more button */}
        {visibleFinishedCount < finishedTasks.length && (
          <Button
            onClick={() =>
              setVisibleFinishedCount((prev) =>
                Math.min(prev + 5, finishedTasks.length)
              )
            }
            variant="outline"
            className="bg-white/10 text-white border-white/20 hover:bg-white/20"
          >
            Show More
          </Button>
        )}
      </motion.div>

      {/* Toggle Button */}
      <button
        title="Finished Tasks"
        onClick={() => setShowSidebar((prev) => !prev)}
        className={`cursor-pointer fixed top-1/2 left-6 -translate-y-1/2 z-50 bg-white/10 border border-white/20 backdrop-blur-xl text-white p-3 rounded-full shadow-lg hover:bg-white/20 transition-all duration-300 ${showSidebar ? "rotate-180" : ""}`}
      >
        {showSidebar ? (
          <span className="flex items-center justify-center">
            {/* Close Icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </span>
        ) : (
          <span className="flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6" />
          </span>
        )}
      </button>

      {/* Task Dialog */}
      {openDialog && (
        <TaskDialog
          open={openDialog}
          onClose={() => {
            setOpenDialog(false);
            setSelectedTask(undefined);
          }}
          onSubmit={fetchTasks}
          selectedTask={selectedTask || undefined}
        />
      )}

      <DeleteConfirmationDialog
        open={openDeleteDialog}
        title="Delete Task"
        description="Are you sure you want to delete this task? This action cannot be undone."
        onCancel={() => {
          setOpenDeleteDialog(false);
          setDeletingTaskId(null);
        }}
        onConfirm={handleDeleteTask}
        loading={deleting}
      />

    </div>
  );
}

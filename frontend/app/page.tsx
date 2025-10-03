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
import { Loader2, Calendar, CheckCircle2, Clock, Plus } from "lucide-react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [pageNumber, setPageNumber] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [open, setOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDeadline, setNewDeadline] = useState("");

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

  const addTask = async () => {
    if (!newTitle || !newDeadline) {
      toast.error("Title and Deadline are required");
      return;
    }

    try {
      await axios.post(`${backendURL}/tasks`, {
        task_title: newTitle,
        task_description: newDescription,
        deadline: newDeadline,
      });
      toast.success("Task added successfully!");
      setOpen(false);
      setNewTitle("");
      setNewDescription("");
      setNewDeadline("");
      fetchTasks();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [pageNumber]);

  if (loadingTasks) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Loader2 className="h-10 w-10 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 backdrop-blur-2xl p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500"
        >
          My Tasks
        </motion.h1>

        {/* Add Task Button */}
        <div className="flex justify-center">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Add Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Task title"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Task description"
                  />
                </div>
                <div>
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    type="date"
                    id="deadline"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                  />
                </div>
                <Button className="w-full mt-2" onClick={addTask}>
                  Add Task
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Task stats */}
        <p className="text-center text-gray-400">
          Showing page {pageNumber + 1} of {totalPages == 0 ? totalPages + 1 : totalPages} — Total tasks: {totalTasks}
        </p>

        {tasks.length === 0 ? (
          <p className="text-center text-gray-300">No tasks found 🎉</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {tasks.map((task, idx) => (
              <motion.div
                key={task.task_id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-xl hover:shadow-cyan-500/20 transition-all duration-300 rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span className="text-lg text-white">{task.task_title}</span>
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
                  <CardContent className="space-y-3">
                    <p className="text-gray-200 text-sm">{task.task_description}</p>
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Calendar className="h-4 w-4" />
                      {new Date(task.deadline).toLocaleDateString()}
                    </div>
                    <Button
                      size="sm"
                      variant={task.finished ? "secondary" : "default"}
                      className="w-full rounded-xl"
                    >
                      {task.finished ? "View" : "Mark as Done"}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-4 mt-6">
            <Button
              disabled={pageNumber === 0}
              onClick={() => setPageNumber((p) => Math.max(0, p - 1))}
              variant="outline"
            >
              Previous
            </Button>
            <Button
              disabled={pageNumber === totalPages - 1}
              onClick={() => setPageNumber((p) => Math.min(totalPages - 1, p + 1))}
              variant="outline"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

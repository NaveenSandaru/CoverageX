'use client'

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import axios from "axios"

interface Task {
  task_id: number
  task_title: string
  task_description: string
  deadline: string
  created: string
  finished: boolean
}

type Props = {
  open: boolean
  onClose: () => void
  onSubmit: () => void
  selectedTask?: Task
}

export default function TaskModal({ open, onClose, onSubmit, selectedTask }: Props) {
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL

  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [finished, setFinished] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Initialize state when selectedTask changes
  useEffect(() => {
    if (selectedTask) {
      setTaskTitle(selectedTask.task_title)
      setTaskDescription(selectedTask.task_description)
      setDeadline(selectedTask.deadline?.split('T')[0] || '')
      setFinished(selectedTask.finished)
    } else {
      setTaskTitle('')
      setTaskDescription('')
      setDeadline('')
      setFinished(false)
    }
  }, [selectedTask, open])

  // Handle saving task
  const handleSave = async () => {
    if (!taskTitle.trim()) {
      toast.error("Task title is required");
      return;
    }

    setIsSaving(true);

    try {
      let taskData = {
        task_title: taskTitle,
        task_description: taskDescription,
        deadline,
        finished
      };

      if (selectedTask) {
        await axios.put(`${backendURL}/tasks/${selectedTask.task_id}`, taskData);
        toast.success("Task updated successfully");
      } else {
        if (!taskData.deadline) {
          toast.info("No deadline selected", {
            description: "Deadline is marked as today",
          });
          const today = new Date();
          today.setHours(0,0,0,0);
          setDeadline(today.toISOString());
          taskData = { ...taskData, deadline: today.toISOString() };
        }

        await axios.post(`${backendURL}/tasks`, taskData);
        toast.success("Task added successfully");
      }

      onSubmit();
      onClose();
    } catch (err) {
      toast.error(selectedTask ? "Failed to update task" : "Failed to add task");
    } finally {
      setIsSaving(false);
    }
  };


  // Close on ESC key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, handleKeyDown])

  if (!open) return null

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 180, damping: 16 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-3xl overflow-hidden bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_0_40px_rgba(255,255,255,0.2)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/10 to-transparent opacity-70 pointer-events-none" />

            <div className="relative p-6 text-white">
              <h2 className="text-center text-xl font-semibold drop-shadow-lg mb-4">
                {selectedTask ? "Edit Task" : "Add New Task"}
              </h2>

              <div className="grid gap-4 max-h-[80vh] overflow-auto">
                <div className="grid gap-2">
                  <Label htmlFor="taskTitle" className="text-white/90">Title</Label>
                  <Input
                    id="taskTitle"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="e.g. Finish UI Design"
                    className="bg-white/20 border-white/30 text-white placeholder-white/70 focus-visible:ring-white/0"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="taskDescription" className="text-white/90">Description</Label>
                  <Input
                    id="taskDescription"
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="Brief task summary"
                    className="bg-white/20 border-white/30 text-white placeholder-white/70 focus-visible:ring-white/0"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="deadline" className="text-white/90">Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    min={new Date().toISOString().split("T")[0]} 
                    className="bg-white/20 border-white/30 text-white focus-visible:ring-white/0"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="ghost"
                    onClick={onClose}
                    className="text-white hover:bg-white/10 cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-white/30 hover:bg-white/50 text-white font-medium backdrop-blur-sm cursor-pointer"
                  >
                    {isSaving
                      ? "Saving..."
                      : selectedTask
                        ? "Save Changes"
                        : "Add Task"}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

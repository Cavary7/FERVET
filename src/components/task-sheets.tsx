"use client";

import { useEffect, useState } from "react";
import { DateKey } from "@/lib/types";
import { BottomSheet, Field, Input, PillButton, Select } from "@/components/ui";

type Recurrence = "" | "daily" | "weekly" | "monthly";
type Scope = "one" | "following" | "all";

export function TaskEditSheet({
  open,
  task,
  onClose,
  onSave,
}: {
  open: boolean;
  task?: {
    id: string;
    title: string;
    dueDate: DateKey;
    recurrence?: "daily" | "weekly" | "monthly";
  };
  onClose: () => void;
  onSave: (
    taskId: string,
    title: string,
    dueDate: DateKey,
    recurrence?: "daily" | "weekly" | "monthly",
    scope?: Scope,
  ) => void;
}) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState<DateKey>("2026-01-01" as DateKey);
  const [recurrence, setRecurrence] = useState<Recurrence>("");
  const [scope, setScope] = useState<Scope>("one");

  useEffect(() => {
    if (!task || !open) return;
    setTitle(task.title);
    setDueDate(task.dueDate);
    setRecurrence(task.recurrence ?? "");
    setScope("one");
  }, [open, task]);

  return (
    <BottomSheet
      onClose={onClose}
      open={open}
      subtitle="Adjust the task details, then choose how broadly the change should apply."
      title="Edit task"
    >
      <div className="space-y-3">
        <Field label="Task">
          <Input onChange={(event) => setTitle(event.target.value)} value={title} />
        </Field>
        <Field label={recurrence ? "Starts on" : "Due date"}>
          <Input onChange={(event) => setDueDate(event.target.value as DateKey)} type="date" value={dueDate} />
        </Field>
        <Field label="Repeats">
          <Select onChange={(event) => setRecurrence(event.target.value as Recurrence)} value={recurrence}>
            <option value="">Does not repeat</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </Select>
        </Field>
        {(task?.recurrence || recurrence) ? (
          <Field label="Apply changes to">
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "This", value: "one" },
                { label: "Following", value: "following" },
                { label: "All", value: "all" },
              ].map((option) => (
                <button
                  className={`rounded-2xl border px-3 py-3 text-sm font-medium transition ${
                    scope === option.value
                      ? "border-blue-400/30 bg-[linear-gradient(180deg,#4b93ff,#2563eb)] text-white shadow-glow"
                      : "border-white/8 bg-white/[0.04] text-muted"
                  }`}
                  key={option.value}
                  onClick={() => setScope(option.value as Scope)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </Field>
        ) : null}
        <div className="flex gap-3 pt-2">
          <PillButton
            onClick={() => {
              if (!task || !title.trim()) return;
              onSave(task.id, title.trim(), dueDate, recurrence || undefined, scope);
              onClose();
            }}
          >
            Save changes
          </PillButton>
          <PillButton onClick={onClose} variant="ghost">
            Cancel
          </PillButton>
        </div>
      </div>
    </BottomSheet>
  );
}

export function TaskDeleteSheet({
  open,
  task,
  onClose,
  onDelete,
}: {
  open: boolean;
  task?: {
    id: string;
    title: string;
    recurrence?: "daily" | "weekly" | "monthly";
  };
  onClose: () => void;
  onDelete: (taskId: string, scope?: Scope) => void;
}) {
  return (
    <BottomSheet
      onClose={onClose}
      open={open}
      subtitle={task?.recurrence ? "Choose how much of the recurring series to remove." : "This removes the task immediately."}
      title={`Delete ${task?.title ?? "task"}`}
    >
      <div className="space-y-3">
        {task?.recurrence ? (
          <>
            <PillButton
              onClick={() => {
                if (!task) return;
                onDelete(task.id, "one");
                onClose();
              }}
              variant="danger"
            >
              Delete this occurrence
            </PillButton>
            <PillButton
              onClick={() => {
                if (!task) return;
                onDelete(task.id, "following");
                onClose();
              }}
              variant="danger"
            >
              Delete this and following
            </PillButton>
            <PillButton
              onClick={() => {
                if (!task) return;
                onDelete(task.id, "all");
                onClose();
              }}
              variant="danger"
            >
              Delete all
            </PillButton>
          </>
        ) : (
          <PillButton
            onClick={() => {
              if (!task) return;
              onDelete(task.id, "one");
              onClose();
            }}
            variant="danger"
          >
            Delete task
          </PillButton>
        )}
        <PillButton onClick={onClose} variant="ghost">
          Cancel
        </PillButton>
      </div>
    </BottomSheet>
  );
}

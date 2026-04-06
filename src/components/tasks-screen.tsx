"use client";

import { useMemo, useState } from "react";
import { addDays, formatLongDate, formatMonthLabel, todayKey, toDateKey } from "@/lib/date";
import { getTasksForDate } from "@/lib/metrics";
import { useAppStore } from "@/lib/store";
import { DateKey } from "@/lib/types";
import { Card, Field, Input, PillButton, SectionTitle, SegmentedControl, Shell } from "@/components/ui";

function TaskCard({
  title,
  date,
  completed,
  onToggle,
  onEdit,
  onDelete,
}: {
  title: string;
  date: string;
  completed: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className={completed ? "opacity-75" : ""}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-base font-medium ${completed ? "text-muted line-through" : "text-white"}`}>{title}</p>
          <p className="mt-1 text-sm text-muted/85">Due {date}</p>
          <div className="mt-2 flex gap-3">
            <button className="text-xs text-blue-100/80" onClick={onEdit} type="button">
              Edit
            </button>
            <button className="text-xs text-red-200" onClick={onDelete} type="button">
              Delete
            </button>
          </div>
        </div>
        <PillButton onClick={onToggle} variant={completed ? "ghost" : "primary"}>
          {completed ? "Undo" : "Done"}
        </PillButton>
      </div>
    </Card>
  );
}

function plannerGrid(anchor: Date) {
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const firstOffset = (start.getDay() + 6) % 7;
  const gridStart = addDays(start, -firstOffset);
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

export function TasksScreen() {
  const { state, actions } = useAppStore();
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState<DateKey>(todayKey());
  const [view, setView] = useState<"list" | "planner">("list");
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<DateKey>(todayKey());

  const today = todayKey();
  const todayTasks = state.tasks.filter((task) => task.dueDate === today && !task.completedAt);
  const upcomingTasks = state.tasks.filter((task) => task.dueDate > today && !task.completedAt);
  const completedTasks = state.tasks.filter((task) => task.completedAt);
  const days = useMemo(() => plannerGrid(month), [month]);
  const selectedDayTasks = getTasksForDate(state, selectedDay);

  function editTask(taskId: string, currentTitle: string, currentDueDate: DateKey) {
    const nextTitle = window.prompt("Edit task", currentTitle);
    if (!nextTitle) return;
    const nextDueDate = window.prompt("Edit due date (YYYY-MM-DD)", currentDueDate);
    if (!nextDueDate) return;
    actions.updateTask(taskId, nextTitle, nextDueDate as DateKey);
  }

  function deleteTask(taskId: string, title: string) {
    if (!window.confirm(`Delete "${title}"?`)) return;
    actions.deleteTask(taskId);
  }

  return (
    <Shell>
      <header className="mb-7">
        <p className="text-[11px] uppercase tracking-[0.28em] text-blue-200/65">Tasks</p>
        <h1 className="mt-3 text-white">Plan with clarity.</h1>
        <p className="mt-3 max-w-xs text-sm text-muted/90">
          Quick capture for today, with a cleaner month view when you need to plan ahead.
        </p>
      </header>

      <div className="space-y-6">
        <Card>
          <div className="mb-5">
            <SegmentedControl
              onChange={setView}
              options={[
                { label: "List", value: "list" },
                { label: "Planner", value: "planner" },
              ]}
              value={view}
            />
          </div>
          <SectionTitle title="Quick add" subtitle="Fast enough to trust in the moment." />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (!title.trim()) return;
              actions.addTask(title.trim(), dueDate);
              setTitle("");
              setDueDate(today);
            }}
          >
            <Field label="Task">
              <Input onChange={(event) => setTitle(event.target.value)} placeholder="Add a task" value={title} />
            </Field>
            <Field label="Due date">
              <Input onChange={(event) => setDueDate(event.target.value as DateKey)} type="date" value={dueDate} />
            </Field>
            <PillButton type="submit">Add task</PillButton>
          </form>
        </Card>

        {view === "list" ? (
          <>
            <section>
              <SectionTitle title="Today" subtitle={`${todayTasks.length} active`} />
              <div className="space-y-3">
                {todayTasks.length > 0 ? (
                  todayTasks.map((task) => (
                    <TaskCard
                      completed={false}
                      date={task.dueDate}
                      key={task.id}
                      onDelete={() => deleteTask(task.id, task.title)}
                      onEdit={() => editTask(task.id, task.title, task.dueDate)}
                      onToggle={() => actions.toggleTask(task.id)}
                      title={task.title}
                    />
                  ))
                ) : (
                  <Card>
                    <p className="text-sm text-muted/85">No tasks due today.</p>
                  </Card>
                )}
              </div>
            </section>

            <section>
              <SectionTitle title="Upcoming" subtitle={`${upcomingTasks.length} ahead`} />
              <div className="space-y-3">
                {upcomingTasks.length > 0 ? (
                  upcomingTasks.map((task) => (
                    <TaskCard
                      completed={false}
                      date={task.dueDate}
                      key={task.id}
                      onDelete={() => deleteTask(task.id, task.title)}
                      onEdit={() => editTask(task.id, task.title, task.dueDate)}
                      onToggle={() => actions.toggleTask(task.id)}
                      title={task.title}
                    />
                  ))
                ) : (
                  <Card>
                    <p className="text-sm text-muted/85">Nothing upcoming right now.</p>
                  </Card>
                )}
              </div>
            </section>

            <section>
              <SectionTitle title="Completed" subtitle={`${completedTasks.length} done`} />
              <div className="space-y-3">
                {completedTasks.length > 0 ? (
                  completedTasks.map((task) => (
                    <TaskCard
                      completed
                      date={task.dueDate}
                      key={task.id}
                      onDelete={() => deleteTask(task.id, task.title)}
                      onEdit={() => editTask(task.id, task.title, task.dueDate)}
                      onToggle={() => actions.toggleTask(task.id)}
                      title={task.title}
                    />
                  ))
                ) : (
                  <Card>
                    <p className="text-sm text-muted/85">Completed tasks will collect here.</p>
                  </Card>
                )}
              </div>
            </section>
          </>
        ) : (
          <section className="space-y-4">
            <Card className="border-blue-400/12">
              <div className="mb-5 flex items-center justify-between">
                <PillButton onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} variant="ghost">
                  Prev
                </PillButton>
                <p className="text-lg font-semibold tracking-[-0.03em] text-white">{formatMonthLabel(month)}</p>
                <PillButton onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} variant="ghost">
                  Next
                </PillButton>
              </div>
              <div className="mb-3 grid grid-cols-7 text-center text-[11px] uppercase tracking-[0.2em] text-blue-100/45">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2.5">
                {days.map((day) => {
                  const key = toDateKey(day);
                  const isCurrentMonth = day.getMonth() === month.getMonth();
                  const isSelected = key === selectedDay;
                  const dayTasks = getTasksForDate(state, key);
                  const count = dayTasks.length;

                  return (
                    <button
                      className={`min-h-[88px] rounded-[22px] border p-2.5 text-left transition ${
                        isSelected
                          ? "border-blue-400/30 bg-[linear-gradient(180deg,rgba(59,130,246,0.22),rgba(19,35,58,0.95))] shadow-glow"
                          : "border-white/8 bg-white/[0.04]"
                      } ${!isCurrentMonth ? "opacity-35" : ""}`}
                      key={key}
                      onClick={() => setSelectedDay(key)}
                      type="button"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-white">{day.getDate()}</p>
                        {count > 0 ? (
                          <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-medium text-blue-100">
                            {count}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-2 space-y-1">
                        {dayTasks.slice(0, 2).map((task) => (
                          <p className="truncate text-[11px] leading-4 text-blue-50/82" key={task.id}>
                            {task.title}
                          </p>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>

            <Card className="border-blue-400/12">
              <SectionTitle title="Day plan" subtitle={formatLongDate(selectedDay)} />
              <div className="space-y-3">
                {selectedDayTasks.length > 0 ? (
                  selectedDayTasks.map((task) => (
                    <TaskCard
                      completed={Boolean(task.completedAt)}
                      date={task.dueDate}
                      key={task.id}
                      onDelete={() => deleteTask(task.id, task.title)}
                      onEdit={() => editTask(task.id, task.title, task.dueDate)}
                      onToggle={() => actions.toggleTask(task.id)}
                      title={task.title}
                    />
                  ))
                ) : (
                  <div className="rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-4">
                    <p className="text-sm text-muted/85">No tasks planned for this date.</p>
                  </div>
                )}
              </div>
            </Card>
          </section>
        )}
      </div>
    </Shell>
  );
}

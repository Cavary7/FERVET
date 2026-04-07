"use client";

import { useMemo } from "react";
import { todayKey } from "@/lib/date";
import {
  getDayCompletion,
  getLanguageMinutesForDay,
  getMottoForDate,
  getOverallStreak,
  getRunsForDay,
  getSubjectMinutesForDay,
  getWaistSummary,
  getWeightSummary,
} from "@/lib/metrics";
import { useAppStore } from "@/lib/store";
import { Card, MetricCard, SectionTitle, Shell } from "@/components/ui";

export function HomeScreen() {
  const { state } = useAppStore();
  const today = todayKey();
  const motto = useMemo(() => getMottoForDate(state, today), [state, today]);
  const daily = getDayCompletion(state, today);
  const overallStreak = getOverallStreak(state);
  const weight = getWeightSummary(state);
  const waist = getWaistSummary(state);
  const runsToday = getRunsForDay(state, today);
  const completedTasksToday = state.tasks.filter(
    (task) => task.completedAt && new Date(task.completedAt).toISOString().slice(0, 10) === today,
  ).length;
  const cleanHabitsToday = daily.habit.statuses.filter((habit) => habit.clean === true).length;

  const progressItems = [
    {
      label: "Language",
      detail: daily.languageMinutes > 0 ? `${daily.languageMinutes} min logged` : "Log at least once",
      complete: daily.languageMinutes > 0,
    },
    {
      label: "School",
      detail: daily.subjectMinutes > 0 ? `${daily.subjectMinutes} min logged` : "Log at least once",
      complete: daily.subjectMinutes > 0,
    },
    {
      label: "Activity",
      detail: daily.movementDone ? "Completed" : "Pending",
      complete: daily.movementDone,
    },
    {
      label: "Tasks",
      detail:
        daily.dailyTasksTotal > 0
          ? `${daily.dailyTasksComplete}/${daily.dailyTasksTotal} daily tasks`
          : "No daily tasks set",
      complete: daily.tasksDone,
    },
    {
      label: "Habits",
      detail: `${cleanHabitsToday}/${state.habits.length} clean`,
      complete: daily.habit.complete,
    },
  ];

  return (
    <Shell>
      <header className="mb-7">
        <p className="text-[11px] uppercase tracking-[0.34em] text-blue-200/65">Fervet</p>
        <h1 className="mt-3 max-w-[11ch] text-white">Consistency made visible.</h1>
        <p className="mt-3 max-w-xs text-sm text-muted/90">
          A calm, disciplined system for keeping your days honest.
        </p>
      </header>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <Card className="relative overflow-hidden border-blue-400/15 bg-[linear-gradient(135deg,rgba(22,50,95,0.95),rgba(8,17,31,0.96)_55%,rgba(5,10,20,0.98))]">
          <div className="absolute right-[-3rem] top-[-3rem] h-36 w-36 rounded-full bg-blue-400/16 blur-3xl" />
          <div className="absolute bottom-[-4rem] left-[-2rem] h-40 w-40 rounded-full bg-cyan-300/8 blur-3xl" />
          <div className="relative">
            <p className="text-[11px] uppercase tracking-[0.28em] text-blue-200/70">Today&apos;s Motto</p>
            <p className="mt-5 text-[1.9rem] font-semibold leading-[1.05] tracking-[-0.05em] text-white">
              {motto.latin}
            </p>
            <p className="mt-4 max-w-[24ch] text-base leading-7 text-blue-50/78">{motto.english}</p>
          </div>
        </Card>

        <section>
          <SectionTitle
            title="Daily minimum"
            subtitle="A full day requires language, school study, activity, clean habits, and every daily task."
          />
          <Card className="space-y-3">
            {progressItems.map((item) => (
              <div
                className={`flex items-center justify-between rounded-[22px] border px-4 py-3 ${
                  item.complete
                    ? "border-blue-400/25 bg-blue-500/10"
                    : "border-white/8 bg-white/[0.03]"
                }`}
                key={item.label}
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-sm text-muted/85">{item.detail}</p>
                </div>
                <div
                  className={`h-3 w-3 rounded-full ${
                    item.complete ? "bg-blue-400 shadow-[0_0_16px_rgba(96,165,250,0.8)]" : "bg-white/15"
                  }`}
                />
              </div>
            ))}
          </Card>
        </section>
        </div>

        <div className="space-y-5">
          <Card className="overflow-hidden border-blue-400/15 bg-[linear-gradient(180deg,rgba(26,56,112,0.58),rgba(11,20,36,0.96))]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-blue-100/55">Current streak</p>
                <p className="mt-3 text-[4.25rem] font-semibold leading-none tracking-[-0.08em] text-white">
                  {overallStreak}
                </p>
                <p className="mt-3 text-sm text-blue-50/76">
                  {daily.complete ? "Today is complete." : "A full day extends the chain."}
                </p>
              </div>
              <div className="min-w-28 rounded-[24px] border border-white/10 bg-white/[0.06] px-4 py-4 text-right">
                <p className="text-[11px] uppercase tracking-[0.2em] text-blue-100/50">Focus status</p>
                <p className="mt-2 text-lg font-medium text-white">
                  {progressItems.filter((item) => item.complete).length}/{progressItems.length}
                </p>
              </div>
            </div>
          </Card>

        <section>
          <SectionTitle title="Today at a glance" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-2">
            <MetricCard label="Language" value={`${getLanguageMinutesForDay(state, today)} min`} />
            <MetricCard label="Subjects" value={`${getSubjectMinutesForDay(state, today)} min`} />
            <MetricCard
              label="Activity"
              value={`${state.movementLogs.filter((entry) => entry.date === today).length}`}
              hint="Sessions today"
            />
            <MetricCard label="Running" value={`${runsToday.length}`} hint="Runs today" />
            <MetricCard label="Habits" value={`${cleanHabitsToday}/${state.habits.length}`} />
            <MetricCard
              label="Weight"
              value={weight.current ? `${weight.current}` : "--"}
              hint={
                weight.delta !== undefined
                  ? `${weight.delta > 0 ? "+" : ""}${weight.delta.toFixed(1)} from start`
                  : "No baseline yet"
              }
            />
            <MetricCard
              label="Waist"
              value={waist.current ? `${waist.current}"` : "--"}
              hint={
                waist.delta !== undefined
                  ? `${waist.delta > 0 ? "+" : ""}${waist.delta.toFixed(1)} from start`
                  : "No baseline yet"
              }
            />
            <MetricCard label="Tasks" value={`${completedTasksToday}`} hint="Completed today" />
          </div>
        </section>
        </div>
      </div>
    </Shell>
  );
}

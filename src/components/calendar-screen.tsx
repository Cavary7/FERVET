"use client";

import { useMemo, useState } from "react";
import { addDays, formatDurationSeconds, formatLongDate, formatMonthLabel, toDateKey, todayKey } from "@/lib/date";
import {
  getDayCompletion,
  getLanguageMinutesForDay,
  getMottoForDate,
  getRunsForDay,
  getTasksForDate,
} from "@/lib/metrics";
import { useAppStore } from "@/lib/store";
import { DateKey } from "@/lib/types";
import { Card, PillButton, SectionTitle, Shell } from "@/components/ui";

function monthGrid(anchor: Date) {
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const firstOffset = (start.getDay() + 6) % 7;
  const gridStart = addDays(start, -firstOffset);
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

export function CalendarScreen() {
  const { state } = useAppStore();
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<DateKey>(todayKey());

  const days = useMemo(() => monthGrid(month), [month]);
  const selectedMotto = getMottoForDate(state, selectedDay);
  const selectedDayCompletion = getDayCompletion(state, selectedDay);
  const selectedDayTasks = getTasksForDate(state, selectedDay);
  const selectedMovement = state.movementLogs.filter((log) => log.date === selectedDay);
  const selectedRuns = getRunsForDay(state, selectedDay);
  const selectedWeight = state.weightLogs.find((log) => log.date === selectedDay);
  const selectedLanguageLogs = state.languageLogs.filter((entry) => entry.date === selectedDay);

  return (
    <Shell>
      <header className="mb-7">
        <p className="text-[11px] uppercase tracking-[0.28em] text-blue-200/65">Calendar</p>
        <h1 className="mt-3 text-white">Consistency over time.</h1>
        <p className="mt-3 max-w-xs text-sm text-muted/90">
          A monthly view of what held, what slipped, and what was actually done.
        </p>
      </header>

      <div className="space-y-6">
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
              const completion = getDayCompletion(state, key);
              const isCurrentMonth = day.getMonth() === month.getMonth();
              const isSelected = key === selectedDay;

              return (
                <button
                  className={`min-h-[78px] rounded-[22px] border p-2 text-left transition ${
                    isSelected
                      ? "border-blue-400/30 bg-[linear-gradient(180deg,rgba(59,130,246,0.22),rgba(19,35,58,0.95))] shadow-glow"
                      : completion.complete
                        ? "border-blue-500/20 bg-blue-500/14"
                        : "border-white/8 bg-white/[0.04]"
                  } ${!isCurrentMonth ? "opacity-35" : ""}`}
                  key={key}
                  onClick={() => setSelectedDay(key)}
                  type="button"
                >
                  <p className="text-sm font-medium text-white">{day.getDate()}</p>
                  <div className="mt-3 flex gap-1.5">
                    <span className={`h-1.5 flex-1 rounded-full ${completion.complete ? "bg-blue-300" : "bg-white/12"}`} />
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="border-blue-400/12 bg-[linear-gradient(180deg,rgba(20,44,84,0.55),rgba(10,18,32,0.96))]">
          <SectionTitle title="Day detail" subtitle={formatLongDate(selectedDay)} />
          <p className="text-[11px] uppercase tracking-[0.24em] text-blue-100/52">Motto</p>
          <p className="mt-3 text-2xl font-semibold leading-tight tracking-[-0.04em] text-white">{selectedMotto.latin}</p>
          <p className="mt-3 text-base leading-7 text-blue-50/76">{selectedMotto.english}</p>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card>
            <p className="text-[11px] uppercase tracking-[0.2em] text-blue-100/45">Language</p>
            <p className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-white">
              {getLanguageMinutesForDay(state, selectedDay)} min
            </p>
          </Card>
          <Card>
            <p className="text-[11px] uppercase tracking-[0.2em] text-blue-100/45">Movement</p>
            <p className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-white">{selectedMovement.length}</p>
          </Card>
          <Card>
            <p className="text-[11px] uppercase tracking-[0.2em] text-blue-100/45">Running</p>
            <p className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-white">{selectedRuns.length}</p>
          </Card>
          <Card>
            <p className="text-[11px] uppercase tracking-[0.2em] text-blue-100/45">Tasks</p>
            <p className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-white">{selectedDayTasks.length}</p>
          </Card>
        </div>

        <Card>
          <SectionTitle title="Logged notes" subtitle="Everything attached to this day in one clean panel." />
          <div className="space-y-3 text-sm text-muted/88">
            {selectedMovement.map((entry) => (
              <div className="rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-3" key={entry.id}>
                Activity: {entry.activity} • {entry.duration} min{entry.note ? ` - ${entry.note}` : ""}
              </div>
            ))}
            {selectedRuns.map((run) => (
              <div className="rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-3" key={run.id}>
                Run: {run.distance} {run.unit} • {formatDurationSeconds(run.duration)} • {run.runType}
                {run.notes ? ` - ${run.notes}` : ""}
              </div>
            ))}
            {selectedLanguageLogs.map((entry) => {
              const languageName =
                state.languages.find((language) => language.id === entry.languageId)?.name ?? "Language";
              return (
                <div className="rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-3" key={entry.id}>
                  {languageName}: {entry.minutes} min{entry.note ? ` - ${entry.note}` : ""}
                </div>
              );
            })}
            {state.habits.map((habit) => (
              <div className="rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-3" key={habit.id}>
                {habit.name}: {habit.cleanDays[selectedDay] ? "clean" : "broken"}
              </div>
            ))}
            {selectedWeight ? (
              <div className="rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-3">Weight: {selectedWeight.weight}</div>
            ) : null}
            {selectedDayTasks.map((task) => (
              <div className="rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-3" key={task.id}>
                Task: {task.title} {task.completedAt ? "• completed" : "• planned"}
              </div>
            ))}
            {selectedMovement.length === 0 &&
            selectedRuns.length === 0 &&
            selectedLanguageLogs.length === 0 &&
            !selectedWeight &&
            selectedDayTasks.length === 0 ? (
              <p>No entries recorded for this day.</p>
            ) : null}
          </div>
        </Card>
      </div>
    </Shell>
  );
}

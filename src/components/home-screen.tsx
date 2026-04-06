"use client";

import { useMemo, useState } from "react";
import { RUN_TYPES } from "@/lib/constants";
import { formatTimeSince, todayKey } from "@/lib/date";
import {
  getDayCompletion,
  getHabitStreak,
  getLanguageMinutesForDay,
  getLanguageSummaries,
  getMottoForDate,
  getOverallStreak,
  getRunsForDay,
  getWeightSummary,
  getWeeklyRunningSummary,
} from "@/lib/metrics";
import { useAppStore } from "@/lib/store";
import { Card, Input, MetricCard, PillButton, SectionTitle, Select, Shell, Textarea, Toggle } from "@/components/ui";

export function HomeScreen() {
  const { state, actions, now, hydrated } = useAppStore();
  const [showRunningLogger, setShowRunningLogger] = useState(false);
  const [showHabits, setShowHabits] = useState(false);
  const [newLanguageName, setNewLanguageName] = useState("");
  const [newHabitName, setNewHabitName] = useState("");
  const [manualMinutes, setManualMinutes] = useState("20");
  const [languageNote, setLanguageNote] = useState("");
  const [movementDuration, setMovementDuration] = useState("45");
  const [movementNote, setMovementNote] = useState("");
  const [weightInput, setWeightInput] = useState("");
  const [runDistance, setRunDistance] = useState("");
  const [runDuration, setRunDuration] = useState("");
  const [runPace, setRunPace] = useState("");
  const [runType, setRunType] = useState<string>("easy");
  const [runUnit, setRunUnit] = useState<"mi" | "km">("mi");
  const [runNotes, setRunNotes] = useState("");
  const today = todayKey();

  const selectedLanguageId = state.selectedLanguageId ?? state.languages[0]?.id;
  const selectedLanguage =
    state.languages.find((language) => language.id === selectedLanguageId) ?? state.languages[0];
  const motto = useMemo(() => getMottoForDate(state, today), [state, today]);
  const daily = getDayCompletion(state, today);
  const overallStreak = getOverallStreak(state);
  const languageSummaries = getLanguageSummaries(state);
  const weight = getWeightSummary(state);
  const runningWeek = getWeeklyRunningSummary(state);
  const runsToday = getRunsForDay(state, today);
  const completedTasksToday = state.tasks.filter(
    (task) => task.completedAt && new Date(task.completedAt).toISOString().slice(0, 10) === today,
  ).length;

  const activeSessionMinutes = state.activeLanguageSession
    ? Math.max(
        1,
        Math.round((now - new Date(state.activeLanguageSession.startedAt).getTime()) / 60_000),
      )
    : 0;

  const progressItems = [
    {
      label: "Language",
      detail: `${daily.languageMinutes}/20 min`,
      complete: daily.languageMinutes >= 20,
    },
    {
      label: "Movement",
      detail: daily.movementDone ? "Completed" : "Pending",
      complete: daily.movementDone,
    },
    {
      label: "Tasks",
      detail: daily.tasksDone ? "Done" : "Pending",
      complete: daily.tasksDone,
    },
    {
      label: "Habits",
      detail: `${daily.habit.statuses.filter((habit) => habit.clean).length}/${state.habits.length}`,
      complete: daily.habit.complete,
    },
  ];

  function renameLanguage(languageId: string, currentName: string) {
    const next = window.prompt("Rename language", currentName);
    if (!next) return;
    actions.updateLanguage(languageId, next);
  }

  function deleteLanguage(languageId: string, name: string) {
    if (!window.confirm(`Delete ${name}? This also removes its study logs.`)) return;
    actions.deleteLanguage(languageId);
  }

  function renameHabit(habitId: string, currentName: string) {
    const next = window.prompt("Rename habit", currentName);
    if (!next) return;
    actions.updateHabit(habitId, next);
  }

  function deleteHabit(habitId: string, name: string) {
    if (!window.confirm(`Delete ${name}?`)) return;
    actions.deleteHabit(habitId);
  }

  function addRun() {
    const distance = Number(runDistance);
    const duration = Number(runDuration);
    if (!Number.isFinite(distance) || distance <= 0 || !Number.isFinite(duration) || duration <= 0) {
      return;
    }
    actions.addRunningLog({
      distance,
      unit: runUnit,
      duration,
      pace: runPace || undefined,
      runType,
      notes: runNotes || undefined,
    });
    setRunDistance("");
    setRunDuration("");
    setRunPace("");
    setRunNotes("");
  }

  return (
    <Shell>
      <header className="mb-7">
        <p className="text-[11px] uppercase tracking-[0.34em] text-blue-200/65">Fervet</p>
        <h1 className="mt-3 max-w-[11ch] text-white">Consistency made visible.</h1>
        <p className="mt-3 max-w-xs text-sm text-muted/90">
          A calm, disciplined system for keeping your days honest.
        </p>
      </header>

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
                {progressItems.filter((item) => item.complete).length}/4
              </p>
            </div>
          </div>
        </Card>

        <section>
          <SectionTitle title="Daily minimum" subtitle="A cleaner view of what still matters today." />
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

        <section>
          <SectionTitle title="Languages" subtitle="Track several at once without losing speed." />
          <Card>
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <Input
                onChange={(event) => setNewLanguageName(event.target.value)}
                placeholder="Add language"
                value={newLanguageName}
              />
              <PillButton
                onClick={() => {
                  actions.addLanguage(newLanguageName);
                  setNewLanguageName("");
                }}
              >
                Add
              </PillButton>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {languageSummaries.map((language) => {
                const active = selectedLanguageId === language.id;
                return (
                  <div
                    className={`rounded-full border px-4 py-2 transition ${
                      active
                        ? "border-blue-400/30 bg-[linear-gradient(180deg,rgba(59,130,246,0.24),rgba(19,35,58,0.95))] text-white shadow-glow"
                        : "border-white/8 bg-white/[0.04] text-muted"
                    }`}
                    key={language.id}
                  >
                    <button className="text-left" onClick={() => actions.selectLanguage(language.id)} type="button">
                      <span className="block text-sm font-medium">{language.name}</span>
                      <span className="block text-xs opacity-80">
                        {language.todayMinutes} today • {language.weekMinutes} week
                      </span>
                    </button>
                    <div className="mt-2 flex gap-2">
                      <button className="text-[11px] text-blue-100/80" onClick={() => renameLanguage(language.id, language.name)} type="button">
                        Edit
                      </button>
                      <button className="text-[11px] text-blue-100/80" onClick={() => actions.resetLanguageTotals(language.id)} type="button">
                        Reset
                      </button>
                      <button className="text-[11px] text-red-200" onClick={() => deleteLanguage(language.id, language.name)} type="button">
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </section>

        <section>
          <SectionTitle title="Control panel" subtitle="Fast, tactile logging for the core trackers." />
          <div className="space-y-4">
            <Card className="border-blue-400/12">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-base font-medium text-white">Language study</p>
                  <p className="mt-1 text-sm text-muted/90">
                    {selectedLanguage?.name ?? "No language selected"}{" "}
                    {activeSessionMinutes > 0 ? `• ${activeSessionMinutes} min live` : ""}
                  </p>
                </div>
                <PillButton
                  onClick={() =>
                    state.activeLanguageSession
                      ? actions.stopLanguageSession(languageNote)
                      : selectedLanguage && actions.startLanguageSession(selectedLanguage.id)
                  }
                  disabled={!selectedLanguage}
                >
                  {state.activeLanguageSession ? "Stop timer" : "Start timer"}
                </PillButton>
              </div>
              <div className="mt-4 grid gap-3">
                <Select onChange={(event) => actions.selectLanguage(event.target.value)} value={selectedLanguageId}>
                  {state.languages.map((language) => (
                    <option key={language.id} value={language.id}>
                      {language.name}
                    </option>
                  ))}
                </Select>
                <div className="grid grid-cols-[1fr_auto] gap-3">
                  <Input min="1" onChange={(event) => setManualMinutes(event.target.value)} type="number" value={manualMinutes} />
                  <PillButton
                    onClick={() => {
                      const minutes = Number(manualMinutes);
                      if (!selectedLanguage || !Number.isFinite(minutes) || minutes <= 0) return;
                      actions.addLanguageMinutes(selectedLanguage.id, minutes, today, languageNote);
                      setLanguageNote("");
                    }}
                  >
                    Log
                  </PillButton>
                </div>
                <Textarea onChange={(event) => setLanguageNote(event.target.value)} placeholder="Optional note" value={languageNote} />
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <Card>
                <p className="text-base font-medium text-white">Movement / soccer</p>
                <p className="mt-1 text-sm text-muted/90">One clean session keeps the day moving.</p>
                <div className="mt-4 space-y-3">
                  <Input min="1" onChange={(event) => setMovementDuration(event.target.value)} type="number" value={movementDuration} />
                  <Textarea onChange={(event) => setMovementNote(event.target.value)} placeholder="Optional note" value={movementNote} />
                  <PillButton
                    onClick={() => {
                      const duration = Number(movementDuration);
                      if (!Number.isFinite(duration) || duration <= 0) return;
                      actions.addMovementLog(duration, movementNote);
                      setMovementNote("");
                    }}
                  >
                    Log session
                  </PillButton>
                </div>
              </Card>

              <Card>
                <p className="text-base font-medium text-white">Weight check-in</p>
                <p className="mt-1 text-sm text-muted/90">Quietly track the long arc.</p>
                <div className="mt-4 space-y-3">
                  <Input inputMode="decimal" onChange={(event) => setWeightInput(event.target.value)} placeholder="Current weight" value={weightInput} />
                  <PillButton
                    onClick={() => {
                      const value = Number(weightInput);
                      if (!Number.isFinite(value) || value <= 0) return;
                      if (state.weightStart === undefined) actions.setWeightStart(value);
                      actions.addWeightEntry(value);
                      setWeightInput("");
                    }}
                  >
                    Save
                  </PillButton>
                </div>
              </Card>
            </div>

            <Card className="border-blue-400/12">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-base font-medium text-white">Running</p>
                  <p className="mt-1 text-sm text-muted/90">
                    {runsToday.length} today • {runningWeek.runCount} runs this week
                  </p>
                </div>
                <button
                  className="rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-3 text-right"
                  onClick={() => setShowRunningLogger((current) => !current)}
                  type="button"
                >
                  <p className="text-[11px] uppercase tracking-[0.18em] text-blue-100/45">
                    {showRunningLogger ? "Hide run logger" : "Open run logger"}
                  </p>
                  <p className="mt-2 text-lg font-medium text-white">{runningWeek.totalDistanceMiles.toFixed(1)} mi</p>
                </button>
              </div>
              {showRunningLogger ? (
                <div className="mt-4 grid gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input inputMode="decimal" onChange={(event) => setRunDistance(event.target.value)} placeholder="Distance" value={runDistance} />
                    <Select onChange={(event) => setRunUnit(event.target.value as "mi" | "km")} value={runUnit}>
                      <option value="mi">Miles</option>
                      <option value="km">KM</option>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input inputMode="numeric" onChange={(event) => setRunDuration(event.target.value)} placeholder="Duration (min)" value={runDuration} />
                    <Input onChange={(event) => setRunPace(event.target.value)} placeholder="Pace (optional)" value={runPace} />
                  </div>
                  <Select onChange={(event) => setRunType(event.target.value)} value={runType}>
                    {RUN_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </Select>
                  <Textarea onChange={(event) => setRunNotes(event.target.value)} placeholder="Optional notes" value={runNotes} />
                  <PillButton onClick={addRun}>Add run</PillButton>
                </div>
              ) : (
                <div className="mt-4 rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-3">
                  <p className="text-sm text-muted/88">
                    Keep this folded until you need it. Your running summary stays visible above.
                  </p>
                </div>
              )}
            </Card>
          </div>
        </section>

        <section>
          <SectionTitle
            title="Habits / sobriety"
            subtitle="Each tracker keeps its own history and timer."
            action={
              <PillButton onClick={() => setShowHabits((current) => !current)} variant="ghost">
                {showHabits ? "Collapse" : "Expand"}
              </PillButton>
            }
          />
          <Card>
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <Input onChange={(event) => setNewHabitName(event.target.value)} placeholder="Add habit" value={newHabitName} />
              <PillButton
                onClick={() => {
                  actions.addHabit(newHabitName);
                  setNewHabitName("");
                }}
              >
                Add
              </PillButton>
            </div>
            {showHabits ? (
              <div className="mt-4 space-y-3">
                {state.habits.map((habit) => (
                  <div
                    className="rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(8,17,31,0.5))] p-4"
                    key={habit.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-medium text-white">{habit.name}</p>
                        <p className="mt-1 text-sm text-blue-100/72">
                          {hydrated ? formatTimeSince(habit.currentStartAt, now) : "--"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <PillButton onClick={() => renameHabit(habit.id, habit.name)} variant="ghost">
                          Edit
                        </PillButton>
                        <PillButton onClick={() => actions.resetHabit(habit.id)} variant="danger">
                          Reset
                        </PillButton>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-blue-100/45">Streak</p>
                        <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
                          {getHabitStreak(habit)}d
                        </p>
                      </div>
                      <div className="rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-blue-100/45">History</p>
                        <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
                          {habit.resets.length}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Toggle
                        checked={habit.cleanDays[today] ?? false}
                        label="Clean today?"
                        onClick={() =>
                          actions.toggleHabitDay(habit.id, today, !(habit.cleanDays[today] ?? false))
                        }
                      />
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button className="text-xs text-red-200" onClick={() => deleteHabit(habit.id, habit.name)} type="button">
                        Delete habit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-3">
                <p className="text-sm text-muted/88">
                  {state.habits.length} tracked habit{state.habits.length === 1 ? "" : "s"}.
                  Expand when you want the detailed cards and reset controls.
                </p>
              </div>
            )}
          </Card>
        </section>

        <section>
          <SectionTitle title="Today at a glance" />
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Language" value={`${getLanguageMinutesForDay(state, today)} min`} />
            <MetricCard label="Movement" value={`${state.movementLogs.filter((entry) => entry.date === today).length}`} hint="Sessions today" />
            <MetricCard label="Running" value={`${runsToday.length}`} hint="Runs today" />
            <MetricCard label="Habits" value={`${daily.habit.statuses.filter((habit) => habit.clean).length}/${state.habits.length}`} />
            <MetricCard
              label="Weight"
              value={weight.current ? `${weight.current}` : "--"}
              hint={
                weight.delta !== undefined
                  ? `${weight.delta > 0 ? "+" : ""}${weight.delta.toFixed(1)} from start`
                  : "No baseline yet"
              }
            />
            <MetricCard label="Tasks" value={`${completedTasksToday}`} hint="Completed today" />
          </div>
        </section>
      </div>
    </Shell>
  );
}

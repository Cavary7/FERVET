"use client";

import { useMemo, useState } from "react";
import { RUN_TYPES } from "@/lib/constants";
import {
  formatDateTimeLabel,
  formatDurationSeconds,
  formatTimeSince,
  toDateKey,
  toDateTimeLocalInputValue,
  toIsoFromLocalInput,
  todayKey,
} from "@/lib/date";
import {
  getDayCompletion,
  getHabitStreak,
  getLanguageMinutesForDay,
  getLanguageSummaries,
  getMottoForDate,
  getOverallStreak,
  getRunsForDay,
  getSubjectMinutesForDay,
  getSubjectSummaries,
  getWaistSummary,
  getWeightSummary,
  getWeeklyRunningSummary,
  isHabitCleanForDay,
} from "@/lib/metrics";
import { useAppStore } from "@/lib/store";
import {
  Card,
  Input,
  MetricCard,
  PillButton,
  SectionTitle,
  Select,
  Shell,
  Textarea,
  Toggle,
  Field,
} from "@/components/ui";

export function HomeScreen() {
  const { state, actions, now, hydrated } = useAppStore();
  const today = todayKey();
  const nowLocalInput = useMemo(() => toDateTimeLocalInputValue(new Date().toISOString()), []);
  const [showRunningLogger, setShowRunningLogger] = useState(false);
  const [showHabits, setShowHabits] = useState(false);
  const [newLanguageName, setNewLanguageName] = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitStartAt, setNewHabitStartAt] = useState(nowLocalInput);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editingHabitDate, setEditingHabitDate] = useState(today);
  const [editingHabitTime, setEditingHabitTime] = useState("08:00");
  const [languageManualMinutes, setLanguageManualMinutes] = useState("20");
  const [languageNote, setLanguageNote] = useState("");
  const [languageLoggedAt, setLanguageLoggedAt] = useState(nowLocalInput);
  const [subjectManualMinutes, setSubjectManualMinutes] = useState("30");
  const [subjectNote, setSubjectNote] = useState("");
  const [subjectLoggedAt, setSubjectLoggedAt] = useState(nowLocalInput);
  const [activityName, setActivityName] = useState("soccer");
  const [activityDuration, setActivityDuration] = useState("45");
  const [activityNote, setActivityNote] = useState("");
  const [activityLoggedAt, setActivityLoggedAt] = useState(nowLocalInput);
  const [weightInput, setWeightInput] = useState("");
  const [waistInput, setWaistInput] = useState("");
  const [weightLoggedAt, setWeightLoggedAt] = useState(nowLocalInput);
  const [waistLoggedAt, setWaistLoggedAt] = useState(nowLocalInput);
  const [runDistance, setRunDistance] = useState("");
  const [runMinutes, setRunMinutes] = useState("");
  const [runSeconds, setRunSeconds] = useState("");
  const [runPace, setRunPace] = useState("");
  const [runType, setRunType] = useState<string>("easy");
  const [runUnit, setRunUnit] = useState<"mi" | "km">("mi");
  const [runNotes, setRunNotes] = useState("");
  const [runLoggedAt, setRunLoggedAt] = useState(nowLocalInput);

  const selectedLanguageId = state.selectedLanguageId ?? state.languages[0]?.id;
  const selectedLanguage =
    state.languages.find((language) => language.id === selectedLanguageId) ?? state.languages[0];
  const selectedSubjectId = state.selectedSubjectId ?? state.subjects[0]?.id;
  const selectedSubject =
    state.subjects.find((subject) => subject.id === selectedSubjectId) ?? state.subjects[0];

  const motto = useMemo(() => getMottoForDate(state, today), [state, today]);
  const daily = getDayCompletion(state, today);
  const overallStreak = getOverallStreak(state);
  const languageSummaries = getLanguageSummaries(state);
  const subjectSummaries = getSubjectSummaries(state);
  const weight = getWeightSummary(state);
  const waist = getWaistSummary(state);
  const runningWeek = getWeeklyRunningSummary(state);
  const runsToday = getRunsForDay(state, today);
  const recentActivityEntries = [...state.movementLogs]
    .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())
    .slice(0, 3);
  const completedTasksToday = state.tasks.filter(
    (task) => task.completedAt && new Date(task.completedAt).toISOString().slice(0, 10) === today,
  ).length;

  const activeLanguageSessionMinutes = state.activeLanguageSession
    ? Math.max(
        1,
        Math.round((now - new Date(state.activeLanguageSession.startedAt).getTime()) / 60_000),
      )
    : 0;
  const activeSubjectSessionMinutes = state.activeSubjectSession
    ? Math.max(
        1,
        Math.round((now - new Date(state.activeSubjectSession.startedAt).getTime()) / 60_000),
      )
    : 0;

  const cleanHabitsToday = daily.habit.statuses.filter((habit) => habit.clean === true).length;
  const progressItems = [
    {
      label: "Language",
      detail: daily.languageMinutes > 0 ? `${daily.languageMinutes} min logged` : "Log at least once",
      complete: daily.languageMinutes > 0,
    },
    {
      label: "School",
      detail: daily.subjectMinutes > 0 ? `${daily.subjectMinutes} min` : "Pending",
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
      detail: `${cleanHabitsToday}/${state.habits.length}`,
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

  function renameSubject(subjectId: string, currentName: string) {
    const next = window.prompt("Rename subject", currentName);
    if (!next) return;
    actions.updateSubject(subjectId, next);
  }

  function deleteSubject(subjectId: string, name: string) {
    if (!window.confirm(`Delete ${name}? This also removes its study logs.`)) return;
    actions.deleteSubject(subjectId);
  }

  function renameHabit(habitId: string, currentName: string) {
    const next = window.prompt("Rename habit", currentName);
    if (!next) return;
    actions.updateHabit(habitId, next);
  }

  function openHabitStartEditor(habitId: string, currentIso: string) {
    const localValue = toDateTimeLocalInputValue(currentIso);
    setEditingHabitId(habitId);
    setEditingHabitDate(localValue.slice(0, 10) as typeof today);
    setEditingHabitTime(localValue.slice(11, 16));
  }

  function deleteHabit(habitId: string, name: string) {
    if (!window.confirm(`Delete ${name}?`)) return;
    actions.deleteHabit(habitId);
  }

  function addRun() {
    const distance = Number(runDistance);
    const minutes = Number(runMinutes || "0");
    const seconds = Number(runSeconds || "0");
    const duration = minutes * 60 + seconds;
    const loggedAt = toIsoFromLocalInput(runLoggedAt);
    if (
      !Number.isFinite(distance) ||
      distance <= 0 ||
      !Number.isFinite(minutes) ||
      !Number.isFinite(seconds) ||
      duration <= 0
    ) {
      return;
    }
    actions.addRunningLog({
      date: toDateKey(new Date(loggedAt)),
      loggedAt,
      distance,
      unit: runUnit,
      duration,
      pace: runPace || undefined,
      runType,
      notes: runNotes || undefined,
    });
    setRunDistance("");
    setRunMinutes("");
    setRunSeconds("");
    setRunPace("");
    setRunNotes("");
    setRunLoggedAt(toDateTimeLocalInputValue(new Date().toISOString()));
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
                {progressItems.filter((item) => item.complete).length}/{progressItems.length}
              </p>
            </div>
          </div>
        </Card>

        <section>
          <SectionTitle title="Daily minimum" subtitle="A full day requires language, school study, activity, clean habits, and every daily task." />
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
          <SectionTitle title="Languages" subtitle="Keep multiple language tracks visible at once." />
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
          <SectionTitle title="Subjects" subtitle="Track school study alongside language work." />
          <Card>
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <Input
                onChange={(event) => setNewSubjectName(event.target.value)}
                placeholder="Add subject"
                value={newSubjectName}
              />
              <PillButton
                onClick={() => {
                  actions.addSubject(newSubjectName);
                  setNewSubjectName("");
                }}
              >
                Add
              </PillButton>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {subjectSummaries.map((subject) => {
                const active = selectedSubjectId === subject.id;
                return (
                  <div
                    className={`rounded-full border px-4 py-2 transition ${
                      active
                        ? "border-blue-400/30 bg-[linear-gradient(180deg,rgba(59,130,246,0.24),rgba(19,35,58,0.95))] text-white shadow-glow"
                        : "border-white/8 bg-white/[0.04] text-muted"
                    }`}
                    key={subject.id}
                  >
                    <button className="text-left" onClick={() => actions.selectSubject(subject.id)} type="button">
                      <span className="block text-sm font-medium">{subject.name}</span>
                      <span className="block text-xs opacity-80">
                        {subject.todayMinutes} today • {subject.weekMinutes} week
                      </span>
                    </button>
                    <div className="mt-2 flex gap-2">
                      <button className="text-[11px] text-blue-100/80" onClick={() => renameSubject(subject.id, subject.name)} type="button">
                        Edit
                      </button>
                      <button className="text-[11px] text-red-200" onClick={() => deleteSubject(subject.id, subject.name)} type="button">
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
                    {activeLanguageSessionMinutes > 0 ? `• ${activeLanguageSessionMinutes} min live` : ""}
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
                  <Input min="1" onChange={(event) => setLanguageManualMinutes(event.target.value)} type="number" value={languageManualMinutes} />
                  <PillButton
                    onClick={() => {
                      const minutes = Number(languageManualMinutes);
                      if (!selectedLanguage || !Number.isFinite(minutes) || minutes <= 0) return;
                      const loggedAt = toIsoFromLocalInput(languageLoggedAt);
                      actions.addLanguageMinutes(
                        selectedLanguage.id,
                        minutes,
                        toDateKey(new Date(loggedAt)),
                        languageNote,
                        loggedAt,
                      );
                      setLanguageNote("");
                      setLanguageLoggedAt(toDateTimeLocalInputValue(new Date().toISOString()));
                    }}
                  >
                    Log
                  </PillButton>
                </div>
                <Field label="Study date & time">
                  <Input onChange={(event) => setLanguageLoggedAt(event.target.value)} type="datetime-local" value={languageLoggedAt} />
                </Field>
                <Textarea onChange={(event) => setLanguageNote(event.target.value)} placeholder="Optional note" value={languageNote} />
              </div>
            </Card>

            <Card className="border-blue-400/12">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-base font-medium text-white">Subject study</p>
                  <p className="mt-1 text-sm text-muted/90">
                    {selectedSubject?.name ?? "No subject selected"}{" "}
                    {activeSubjectSessionMinutes > 0 ? `• ${activeSubjectSessionMinutes} min live` : ""}
                  </p>
                </div>
                <PillButton
                  onClick={() =>
                    state.activeSubjectSession
                      ? actions.stopSubjectSession(subjectNote)
                      : selectedSubject && actions.startSubjectSession(selectedSubject.id)
                  }
                  disabled={!selectedSubject}
                >
                  {state.activeSubjectSession ? "Stop timer" : "Start timer"}
                </PillButton>
              </div>
              <div className="mt-4 grid gap-3">
                <Select onChange={(event) => actions.selectSubject(event.target.value)} value={selectedSubjectId}>
                  {state.subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </Select>
                <div className="grid grid-cols-[1fr_auto] gap-3">
                  <Input min="1" onChange={(event) => setSubjectManualMinutes(event.target.value)} type="number" value={subjectManualMinutes} />
                  <PillButton
                    onClick={() => {
                      const minutes = Number(subjectManualMinutes);
                      if (!selectedSubject || !Number.isFinite(minutes) || minutes <= 0) return;
                      const loggedAt = toIsoFromLocalInput(subjectLoggedAt);
                      actions.addSubjectMinutes(
                        selectedSubject.id,
                        minutes,
                        toDateKey(new Date(loggedAt)),
                        subjectNote,
                        loggedAt,
                      );
                      setSubjectNote("");
                      setSubjectLoggedAt(toDateTimeLocalInputValue(new Date().toISOString()));
                    }}
                  >
                    Log
                  </PillButton>
                </div>
                <Field label="Study date & time">
                  <Input onChange={(event) => setSubjectLoggedAt(event.target.value)} type="datetime-local" value={subjectLoggedAt} />
                </Field>
                <Textarea onChange={(event) => setSubjectNote(event.target.value)} placeholder="Optional note" value={subjectNote} />
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <Card>
                <p className="text-base font-medium text-white">Activity</p>
                <p className="mt-1 text-sm text-muted/90">Log any training, exercise, or physical activity.</p>
                <div className="mt-4 space-y-3">
                  <Input onChange={(event) => setActivityName(event.target.value)} placeholder="Activity name" value={activityName} />
                  <Input min="1" onChange={(event) => setActivityDuration(event.target.value)} type="number" value={activityDuration} />
                  <Field label="When it happened">
                    <Input onChange={(event) => setActivityLoggedAt(event.target.value)} type="datetime-local" value={activityLoggedAt} />
                  </Field>
                  <Textarea onChange={(event) => setActivityNote(event.target.value)} placeholder="Optional note" value={activityNote} />
                  <PillButton
                    onClick={() => {
                      const duration = Number(activityDuration);
                      if (!Number.isFinite(duration) || duration <= 0) return;
                      const loggedAt = toIsoFromLocalInput(activityLoggedAt);
                      actions.addMovementLog(
                        activityName || "activity",
                        duration,
                        activityNote,
                        toDateKey(new Date(loggedAt)),
                        loggedAt,
                      );
                      setActivityNote("");
                      setActivityLoggedAt(toDateTimeLocalInputValue(new Date().toISOString()));
                    }}
                  >
                    Log activity
                  </PillButton>
                  {recentActivityEntries.length > 0 ? (
                    <div className="space-y-2 rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-blue-100/45">Recent activity</p>
                      {recentActivityEntries.map((entry) => (
                        <div className="flex items-center justify-between gap-3 text-sm" key={entry.id}>
                          <div>
                            <p className="text-white">
                              {entry.activity}{" "}
                              <span className="text-muted/80">- {entry.duration} min</span>
                            </p>
                            {entry.note ? <p className="text-xs text-muted/78">{entry.note}</p> : null}
                          </div>
                          <p className="shrink-0 text-xs text-blue-100/68">{formatDateTimeLabel(entry.loggedAt)}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </Card>

              <Card>
                <p className="text-base font-medium text-white">Body metrics</p>
                <p className="mt-1 text-sm text-muted/90">Track weight and waist without adding noise.</p>
                <div className="mt-4 space-y-3">
                  <Input inputMode="decimal" onChange={(event) => setWeightInput(event.target.value)} placeholder="Current weight" value={weightInput} />
                  <Field label="Weight date & time">
                    <Input onChange={(event) => setWeightLoggedAt(event.target.value)} type="datetime-local" value={weightLoggedAt} />
                  </Field>
                  <PillButton
                    onClick={() => {
                      const value = Number(weightInput);
                      if (!Number.isFinite(value) || value <= 0) return;
                      const loggedAt = toIsoFromLocalInput(weightLoggedAt);
                      if (state.weightStart === undefined) actions.setWeightStart(value);
                      actions.addWeightEntry(value, toDateKey(new Date(loggedAt)), loggedAt);
                      setWeightInput("");
                      setWeightLoggedAt(toDateTimeLocalInputValue(new Date().toISOString()));
                    }}
                  >
                    Save weight
                  </PillButton>
                  <Input inputMode="decimal" onChange={(event) => setWaistInput(event.target.value)} placeholder="Waist (inches)" value={waistInput} />
                  <Field label="Waist date & time">
                    <Input onChange={(event) => setWaistLoggedAt(event.target.value)} type="datetime-local" value={waistLoggedAt} />
                  </Field>
                  <PillButton
                    onClick={() => {
                      const value = Number(waistInput);
                      if (!Number.isFinite(value) || value <= 0) return;
                      const loggedAt = toIsoFromLocalInput(waistLoggedAt);
                      if (state.waistStart === undefined) actions.setWaistStart(value);
                      actions.addWaistEntry(value, toDateKey(new Date(loggedAt)), loggedAt);
                      setWaistInput("");
                      setWaistLoggedAt(toDateTimeLocalInputValue(new Date().toISOString()));
                    }}
                    variant="ghost"
                  >
                    Save waist
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
                    <Input inputMode="numeric" onChange={(event) => setRunMinutes(event.target.value)} placeholder="Minutes" value={runMinutes} />
                    <Input inputMode="numeric" max="59" onChange={(event) => setRunSeconds(event.target.value)} placeholder="Seconds" value={runSeconds} />
                  </div>
                  <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-2">
                    <p className="text-xs text-muted/80">
                      Duration preview: {formatDurationSeconds(Number(runMinutes || "0") * 60 + Number(runSeconds || "0"))}
                    </p>
                  </div>
                  <Field label="Run date & time">
                    <Input onChange={(event) => setRunLoggedAt(event.target.value)} type="datetime-local" value={runLoggedAt} />
                  </Field>
                  <Input onChange={(event) => setRunPace(event.target.value)} placeholder="Pace (optional)" value={runPace} />
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
            subtitle="Each tracker keeps its own history and exact clean-start timer."
            action={
              <PillButton onClick={() => setShowHabits((current) => !current)} variant="ghost">
                {showHabits ? "Collapse" : "Expand"}
              </PillButton>
            }
          />
          <Card>
            <div className="grid gap-3">
              <Input onChange={(event) => setNewHabitName(event.target.value)} placeholder="Add habit" value={newHabitName} />
              <Input onChange={(event) => setNewHabitStartAt(event.target.value)} type="datetime-local" value={newHabitStartAt} />
              <PillButton
                onClick={() => {
                  if (!newHabitName.trim()) return;
                  actions.addHabit(newHabitName, toIsoFromLocalInput(newHabitStartAt));
                  setNewHabitName("");
                  setNewHabitStartAt(toDateTimeLocalInputValue(new Date().toISOString()));
                }}
              >
                Add
              </PillButton>
            </div>
            {showHabits ? (
              <div className="mt-4 space-y-3">
                {state.habits.map((habit) => {
                  const cleanToday = isHabitCleanForDay(habit, today) === true;
                  const lastReset = habit.resets[0]?.timestamp;
                  return (
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
                          <p className="mt-1 text-xs text-muted/75">
                            Start {new Date(habit.currentStartAt).toLocaleString()}
                          </p>
                          {lastReset ? (
                            <p className="mt-1 text-xs text-muted/70">
                              Last reset {new Date(lastReset).toLocaleString()}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex gap-2">
                          <PillButton onClick={() => renameHabit(habit.id, habit.name)} variant="ghost">
                            Edit
                          </PillButton>
                          <PillButton onClick={() => openHabitStartEditor(habit.id, habit.currentStartAt)} variant="ghost">
                            Start
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
                          checked={cleanToday}
                          label="Clean today?"
                          onClick={() => actions.toggleHabitDay(habit.id, today, !cleanToday)}
                        />
                      </div>
                      {editingHabitId === habit.id ? (
                        <div className="mt-4 rounded-[22px] border border-white/8 bg-white/[0.04] p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-blue-100/45">Adjust clean start</p>
                          <div className="mt-3 grid grid-cols-2 gap-3">
                            <Input onChange={(event) => setEditingHabitDate(event.target.value as typeof today)} type="date" value={editingHabitDate} />
                            <Input onChange={(event) => setEditingHabitTime(event.target.value)} type="time" value={editingHabitTime} />
                          </div>
                          <div className="mt-3 flex gap-3">
                            <PillButton
                              onClick={() => {
                                actions.updateHabitStartDate(
                                  habit.id,
                                  new Date(`${editingHabitDate}T${editingHabitTime}`).toISOString(),
                                );
                                setEditingHabitId(null);
                              }}
                            >
                              Save
                            </PillButton>
                            <PillButton onClick={() => setEditingHabitId(null)} variant="ghost">
                              Cancel
                            </PillButton>
                          </div>
                        </div>
                      ) : null}
                      <div className="mt-3 flex justify-end">
                        <button className="text-xs text-red-200" onClick={() => deleteHabit(habit.id, habit.name)} type="button">
                          Delete habit
                        </button>
                      </div>
                    </div>
                  );
                })}
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
            <MetricCard label="Subjects" value={`${getSubjectMinutesForDay(state, today)} min`} />
            <MetricCard label="Activity" value={`${state.movementLogs.filter((entry) => entry.date === today).length}`} hint="Sessions today" />
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
    </Shell>
  );
}

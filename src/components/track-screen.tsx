"use client";

import { useState } from "react";
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
  getHabitStreak,
  getLanguageSummaries,
  getRunsForDay,
  getSubjectSummaries,
  getWaistSummary,
  getWeightSummary,
  getWeeklyRunningSummary,
  isHabitCleanForDay,
} from "@/lib/metrics";
import { useAppStore } from "@/lib/store";
import { Card, Field, Input, PillButton, SectionTitle, Select, Shell, Textarea, Toggle } from "@/components/ui";

export function TrackScreen() {
  const { state, actions, now, hydrated } = useAppStore();
  const nowLocalInput = toDateTimeLocalInputValue(new Date().toISOString());
  const today = todayKey();
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
  const [weightLoggedAt, setWeightLoggedAt] = useState(nowLocalInput);
  const [waistInput, setWaistInput] = useState("");
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
  const languageSummaries = getLanguageSummaries(state);
  const subjectSummaries = getSubjectSummaries(state);
  const runningWeek = getWeeklyRunningSummary(state);
  const runsToday = getRunsForDay(state, today);
  const recentActivityEntries = [...state.movementLogs]
    .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())
    .slice(0, 3);
  const weight = getWeightSummary(state);
  const waist = getWaistSummary(state);

  const activeLanguageSessionMinutes = state.activeLanguageSession
    ? Math.max(1, Math.round((now - new Date(state.activeLanguageSession.startedAt).getTime()) / 60_000))
    : 0;
  const activeSubjectSessionMinutes = state.activeSubjectSession
    ? Math.max(1, Math.round((now - new Date(state.activeSubjectSession.startedAt).getTime()) / 60_000))
    : 0;

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
        <p className="text-[11px] uppercase tracking-[0.28em] text-blue-200/65">Track</p>
        <h1 className="mt-3 text-white">Log the work clearly.</h1>
        <p className="mt-3 max-w-xs text-sm text-muted/90">
          Every tracker in one place, stacked cleanly for fast mobile entry.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
        <section>
          <SectionTitle title="Languages" subtitle="Manage languages and log study without leaving this tab." />
          <Card className="space-y-4">
            <div className="space-y-3">
              <Input onChange={(event) => setNewLanguageName(event.target.value)} placeholder="Add language" value={newLanguageName} />
              <PillButton
                onClick={() => {
                  actions.addLanguage(newLanguageName);
                  setNewLanguageName("");
                }}
              >
                Add language
              </PillButton>
            </div>
            <div className="flex flex-wrap gap-2">
              {languageSummaries.map((language) => {
                const active = selectedLanguageId === language.id;
                return (
                  <div
                    className={`rounded-[22px] border px-4 py-3 transition ${
                      active
                        ? "border-blue-400/30 bg-[linear-gradient(180deg,rgba(59,130,246,0.24),rgba(19,35,58,0.95))] text-white shadow-glow"
                        : "border-white/8 bg-white/[0.04] text-muted"
                    }`}
                    key={language.id}
                  >
                    <button className="text-left" onClick={() => actions.selectLanguage(language.id)} type="button">
                      <span className="block text-sm font-medium">{language.name}</span>
                      <span className="mt-1 block text-xs opacity-80">
                        {language.todayMinutes} today • {language.weekMinutes} week
                      </span>
                    </button>
                    <div className="mt-3 flex flex-wrap gap-3">
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
            <div className="space-y-3 rounded-[24px] border border-blue-400/12 bg-white/[0.03] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-base font-medium text-white">Language study</p>
                  <p className="mt-1 text-sm text-muted/90">
                    {selectedLanguage?.name ?? "No language selected"}
                    {activeLanguageSessionMinutes > 0 ? ` • ${activeLanguageSessionMinutes} min live` : ""}
                  </p>
                </div>
                <PillButton
                  disabled={!selectedLanguage}
                  onClick={() =>
                    state.activeLanguageSession
                      ? actions.stopLanguageSession(languageNote)
                      : selectedLanguage && actions.startLanguageSession(selectedLanguage.id)
                  }
                >
                  {state.activeLanguageSession ? "Stop timer" : "Start timer"}
                </PillButton>
              </div>
              <Select onChange={(event) => actions.selectLanguage(event.target.value)} value={selectedLanguageId}>
                {state.languages.map((language) => (
                  <option key={language.id} value={language.id}>
                    {language.name}
                  </option>
                ))}
              </Select>
              <Field label="Manual minutes">
                <Input min="1" onChange={(event) => setLanguageManualMinutes(event.target.value)} type="number" value={languageManualMinutes} />
              </Field>
              <Field label="Study date & time">
                <Input onChange={(event) => setLanguageLoggedAt(event.target.value)} type="datetime-local" value={languageLoggedAt} />
              </Field>
              <Field label="Note">
                <Textarea onChange={(event) => setLanguageNote(event.target.value)} placeholder="Optional note" value={languageNote} />
              </Field>
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
                Log language study
              </PillButton>
            </div>
          </Card>
        </section>

        <section>
          <SectionTitle title="Subjects" subtitle="Keep school study separate, but just as easy to log." />
          <Card className="space-y-4">
            <div className="space-y-3">
              <Input onChange={(event) => setNewSubjectName(event.target.value)} placeholder="Add subject" value={newSubjectName} />
              <PillButton
                onClick={() => {
                  actions.addSubject(newSubjectName);
                  setNewSubjectName("");
                }}
              >
                Add subject
              </PillButton>
            </div>
            <div className="flex flex-wrap gap-2">
              {subjectSummaries.map((subject) => {
                const active = selectedSubjectId === subject.id;
                return (
                  <div
                    className={`rounded-[22px] border px-4 py-3 transition ${
                      active
                        ? "border-blue-400/30 bg-[linear-gradient(180deg,rgba(59,130,246,0.24),rgba(19,35,58,0.95))] text-white shadow-glow"
                        : "border-white/8 bg-white/[0.04] text-muted"
                    }`}
                    key={subject.id}
                  >
                    <button className="text-left" onClick={() => actions.selectSubject(subject.id)} type="button">
                      <span className="block text-sm font-medium">{subject.name}</span>
                      <span className="mt-1 block text-xs opacity-80">
                        {subject.todayMinutes} today • {subject.weekMinutes} week
                      </span>
                    </button>
                    <div className="mt-3 flex flex-wrap gap-3">
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
            <div className="space-y-3 rounded-[24px] border border-blue-400/12 bg-white/[0.03] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-base font-medium text-white">Subject study</p>
                  <p className="mt-1 text-sm text-muted/90">
                    {selectedSubject?.name ?? "No subject selected"}
                    {activeSubjectSessionMinutes > 0 ? ` • ${activeSubjectSessionMinutes} min live` : ""}
                  </p>
                </div>
                <PillButton
                  disabled={!selectedSubject}
                  onClick={() =>
                    state.activeSubjectSession
                      ? actions.stopSubjectSession(subjectNote)
                      : selectedSubject && actions.startSubjectSession(selectedSubject.id)
                  }
                >
                  {state.activeSubjectSession ? "Stop timer" : "Start timer"}
                </PillButton>
              </div>
              <Select onChange={(event) => actions.selectSubject(event.target.value)} value={selectedSubjectId}>
                {state.subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </Select>
              <Field label="Manual minutes">
                <Input min="1" onChange={(event) => setSubjectManualMinutes(event.target.value)} type="number" value={subjectManualMinutes} />
              </Field>
              <Field label="Study date & time">
                <Input onChange={(event) => setSubjectLoggedAt(event.target.value)} type="datetime-local" value={subjectLoggedAt} />
              </Field>
              <Field label="Note">
                <Textarea onChange={(event) => setSubjectNote(event.target.value)} placeholder="Optional note" value={subjectNote} />
              </Field>
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
                Log subject study
              </PillButton>
            </div>
          </Card>
        </section>

        <section>
          <SectionTitle title="Activity" subtitle="Simple, clear activity logging with recent sessions visible." />
          <Card className="space-y-4">
            <Field label="Activity type">
              <Input onChange={(event) => setActivityName(event.target.value)} placeholder="Soccer, walking, weightlifting..." value={activityName} />
            </Field>
            <Field label="Duration (minutes)">
              <Input min="1" onChange={(event) => setActivityDuration(event.target.value)} type="number" value={activityDuration} />
            </Field>
            <Field label="When it happened">
              <Input onChange={(event) => setActivityLoggedAt(event.target.value)} type="datetime-local" value={activityLoggedAt} />
            </Field>
            <Field label="Note">
              <Textarea onChange={(event) => setActivityNote(event.target.value)} placeholder="Optional note" value={activityNote} />
            </Field>
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
                  <div className="space-y-1" key={entry.id}>
                    <p className="text-sm text-white">
                      {entry.activity} <span className="text-muted/78">— {entry.duration} min</span>
                    </p>
                    <p className="text-xs text-blue-100/68">{formatDateTimeLabel(entry.loggedAt)}</p>
                    {entry.note ? <p className="text-xs text-muted/75">{entry.note}</p> : null}
                  </div>
                ))}
              </div>
            ) : null}
          </Card>
        </section>

        <section>
          <SectionTitle title="Running" subtitle="Keep run entry compact, precise, and fully on-screen." />
          <Card className="space-y-4">
            <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-3">
              <p className="text-sm text-white">{runsToday.length} runs today</p>
              <p className="mt-1 text-sm text-muted/85">
                {runningWeek.runCount} runs this week • {runningWeek.totalDistanceMiles.toFixed(1)} mi total
              </p>
            </div>
            <Field label="Distance">
              <Input inputMode="decimal" onChange={(event) => setRunDistance(event.target.value)} placeholder="Distance" value={runDistance} />
            </Field>
            <Field label="Unit">
              <Select onChange={(event) => setRunUnit(event.target.value as "mi" | "km")} value={runUnit}>
                <option value="mi">Miles</option>
                <option value="km">KM</option>
              </Select>
            </Field>
            <Field label="Minutes">
              <Input inputMode="numeric" onChange={(event) => setRunMinutes(event.target.value)} placeholder="Minutes" value={runMinutes} />
            </Field>
            <Field label="Seconds">
              <Input inputMode="numeric" max="59" onChange={(event) => setRunSeconds(event.target.value)} placeholder="Seconds" value={runSeconds} />
            </Field>
            <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-2">
              <p className="text-xs text-muted/80">
                Duration preview: {formatDurationSeconds(Number(runMinutes || "0") * 60 + Number(runSeconds || "0"))}
              </p>
            </div>
            <Field label="Run date & time">
              <Input onChange={(event) => setRunLoggedAt(event.target.value)} type="datetime-local" value={runLoggedAt} />
            </Field>
            <Field label="Pace">
              <Input onChange={(event) => setRunPace(event.target.value)} placeholder="Pace (optional)" value={runPace} />
            </Field>
            <Field label="Run type">
              <Select onChange={(event) => setRunType(event.target.value)} value={runType}>
                {RUN_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Notes">
              <Textarea onChange={(event) => setRunNotes(event.target.value)} placeholder="Optional notes" value={runNotes} />
            </Field>
            <PillButton onClick={addRun}>Add run</PillButton>
          </Card>
        </section>

        <section>
          <SectionTitle title="Body metrics" subtitle="Weight and waist logging, stacked cleanly for mobile." />
          <Card className="space-y-5">
            <div className="space-y-3 rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
              <p className="text-base font-medium text-white">Weight</p>
              <p className="text-sm text-muted/85">
                Current {weight.current ?? "--"} • Start {weight.start ?? "--"}
              </p>
              <Field label="Weight">
                <Input inputMode="decimal" onChange={(event) => setWeightInput(event.target.value)} placeholder="Current weight" value={weightInput} />
              </Field>
              <Field label="Date & time">
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
            </div>

            <div className="space-y-3 rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
              <p className="text-base font-medium text-white">Waist</p>
              <p className="text-sm text-muted/85">
                Current {waist.current ? `${waist.current}"` : "--"} • Start {waist.start ? `${waist.start}"` : "--"}
              </p>
              <Field label="Waist (inches)">
                <Input inputMode="decimal" onChange={(event) => setWaistInput(event.target.value)} placeholder="Waist (inches)" value={waistInput} />
              </Field>
              <Field label="Date & time">
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
        </section>

        <section>
          <SectionTitle
            title="Habits / sobriety"
            subtitle="Independent timers, clean-day toggles, and reset controls in one place."
            action={
              <PillButton onClick={() => setShowHabits((current) => !current)} variant="ghost">
                {showHabits ? "Collapse" : "Expand"}
              </PillButton>
            }
          />
          <Card className="space-y-4">
            <div className="space-y-3">
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
                Add habit
              </PillButton>
            </div>

            {showHabits ? (
              <div className="space-y-3">
                {state.habits.map((habit) => {
                  const cleanToday = isHabitCleanForDay(habit, today) === true;
                  const lastReset = habit.resets[0]?.timestamp;
                  return (
                    <div
                      className="rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(8,17,31,0.5))] p-4"
                      key={habit.id}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-base font-medium text-white">{habit.name}</p>
                            <p className="mt-1 text-sm text-blue-100/72">
                              {hydrated ? formatTimeSince(habit.currentStartAt, now) : "--"}
                            </p>
                            <p className="mt-1 text-xs text-muted/75">Start {new Date(habit.currentStartAt).toLocaleString()}</p>
                            {lastReset ? (
                              <p className="mt-1 text-xs text-muted/70">Last reset {new Date(lastReset).toLocaleString()}</p>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap justify-end gap-2">
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

                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-3">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-blue-100/45">Streak</p>
                            <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">{getHabitStreak(habit)}d</p>
                          </div>
                          <div className="rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-3">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-blue-100/45">History</p>
                            <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">{habit.resets.length}</p>
                          </div>
                        </div>

                        <Toggle
                          checked={cleanToday}
                          label="Clean today?"
                          onClick={() => actions.toggleHabitDay(habit.id, today, !cleanToday)}
                        />

                        {editingHabitId === habit.id ? (
                          <div className="space-y-3 rounded-[22px] border border-white/8 bg-white/[0.04] p-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-blue-100/45">Adjust clean start</p>
                            <Input onChange={(event) => setEditingHabitDate(event.target.value as typeof today)} type="date" value={editingHabitDate} />
                            <Input onChange={(event) => setEditingHabitTime(event.target.value)} type="time" value={editingHabitTime} />
                            <div className="flex flex-wrap gap-3">
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

                        <div className="flex justify-end">
                          <button className="text-xs text-red-200" onClick={() => deleteHabit(habit.id, habit.name)} type="button">
                            Delete habit
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-3">
                <p className="text-sm text-muted/88">
                  {state.habits.length} tracked habit{state.habits.length === 1 ? "" : "s"}.
                  Expand when you want the detailed cards and reset controls.
                </p>
              </div>
            )}
          </Card>
        </section>
      </div>
    </Shell>
  );
}

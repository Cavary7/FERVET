"use client";

import type { ChangeEvent } from "react";
import { useRef, useState } from "react";
import Link from "next/link";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAuth } from "@/lib/auth";
import { BACKUP_APP_NAME, createBackupPayload, isValidBackupPayload } from "@/lib/backup";
import { RUN_TYPES } from "@/lib/constants";
import { formatDateTimeLabel, formatDurationSeconds, todayKey } from "@/lib/date";
import {
  getAutoDetectedRunningBests,
  getHabitStreak,
  getLanguageSummaries,
  getOverallStreak,
  getRunningPerformanceSummary,
  getSubjectSummaries,
  getWaistSummary,
  getWeeklyLanguageMinutes,
  getWeeklyMovementCount,
  getWeeklyRunningSummary,
  getWeeklySubjectMinutes,
  getWeeklyTaskCount,
  getWeightSummary,
} from "@/lib/metrics";
import { useAppStore } from "@/lib/store";
import { DateKey } from "@/lib/types";
import { TaskDeleteSheet, TaskEditSheet } from "@/components/task-sheets";
import { Card, MetricCard, PillButton, SectionTitle, Select, Shell } from "@/components/ui";

function formatRun(run: { distance: number; unit: string; duration: number; runType: string }) {
  return `${run.distance} ${run.unit} • ${formatDurationSeconds(run.duration)} • ${run.runType}`;
}

export function ProgressScreen() {
  const { state, actions, syncMode, syncStatus, guestDataAvailable } = useAppStore();
  const auth = useAuth();
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const weight = getWeightSummary(state);
  const waist = getWaistSummary(state);
  const languageSummaries = getLanguageSummaries(state);
  const subjectSummaries = getSubjectSummaries(state);
  const running = getWeeklyRunningSummary(state);
  const runningPerformance = getRunningPerformanceSummary(state);
  const runningBests = getAutoDetectedRunningBests(state);
  const editingTask = state.tasks.find((task) => task.id === editingTaskId);
  const deletingTask = state.tasks.find((task) => task.id === deletingTaskId);

  function exportData() {
    try {
      const payload = createBackupPayload(state);
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `fervet-backup-${date}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setBackupError(null);
      setBackupMessage("Backup exported.");
    } catch {
      setBackupMessage(null);
      setBackupError("Export failed. Please try again.");
    }
  }

  async function importData(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      if (!isValidBackupPayload(parsed)) {
        setBackupMessage(null);
        setBackupError(`That file is not a valid ${BACKUP_APP_NAME} backup.`);
        event.target.value = "";
        return;
      }
      const proceed = window.confirm(
        "Restoring a backup will replace your current local Fervet data on this device. Continue?",
      );
      if (!proceed) {
        event.target.value = "";
        return;
      }
      const result = actions.importAppState(parsed.data);
      if (!result.ok) {
        setBackupMessage(null);
        setBackupError(result.error ?? "Import failed.");
      } else {
        setBackupError(null);
        setBackupMessage("Backup restored successfully.");
      }
    } catch {
      setBackupMessage(null);
      setBackupError("Import failed. Make sure the file is a valid Fervet backup JSON.");
    } finally {
      event.target.value = "";
    }
  }

  function promptUpdateLanguageLog(logId: string, minutes: number, note?: string) {
    const nextMinutes = window.prompt("Edit minutes", String(minutes));
    if (!nextMinutes) return;
    const parsed = Number(nextMinutes);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    const nextNote = window.prompt("Edit note", note ?? "") ?? undefined;
    actions.updateLanguageLog(logId, parsed, nextNote);
  }

  function promptUpdateSubjectLog(logId: string, minutes: number, note?: string) {
    const nextMinutes = window.prompt("Edit minutes", String(minutes));
    if (!nextMinutes) return;
    const parsed = Number(nextMinutes);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    const nextNote = window.prompt("Edit note", note ?? "") ?? undefined;
    actions.updateSubjectLog(logId, parsed, nextNote);
  }

  function promptUpdateMovementLog(logId: string, activity: string, duration: number, note?: string) {
    const nextActivity = window.prompt("Edit activity", activity);
    if (!nextActivity) return;
    const nextDuration = window.prompt("Edit movement minutes", String(duration));
    if (!nextDuration) return;
    const parsed = Number(nextDuration);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    const nextNote = window.prompt("Edit note", note ?? "") ?? undefined;
    actions.updateMovementLog(logId, nextActivity, parsed, nextNote);
  }

  function promptUpdateWeight(entryId: string, weightValue: number, date: string) {
    const nextWeight = window.prompt("Edit weight", String(weightValue));
    if (!nextWeight) return;
    const parsed = Number(nextWeight);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    const nextDate = window.prompt("Edit date (YYYY-MM-DD)", date);
    if (!nextDate) return;
    actions.updateWeightEntry(entryId, parsed, nextDate as DateKey);
  }

  function promptUpdateWaist(entryId: string, inchesValue: number, date: string) {
    const nextInches = window.prompt("Edit waist inches", String(inchesValue));
    if (!nextInches) return;
    const parsed = Number(nextInches);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    const nextDate = window.prompt("Edit date (YYYY-MM-DD)", date);
    if (!nextDate) return;
    actions.updateWaistEntry(entryId, parsed, nextDate as DateKey);
  }

  function promptUpdateRunning(logId: string, run: typeof state.runningLogs[number]) {
    const distance = window.prompt("Edit distance", String(run.distance));
    if (!distance) return;
    const minutes = window.prompt("Edit duration minutes", String(Math.floor(run.duration / 60)));
    if (!minutes) return;
    const seconds = window.prompt("Edit duration seconds", String(run.duration % 60));
    if (!seconds) return;
    const parsedDistance = Number(distance);
    const parsedMinutes = Number(minutes);
    const parsedSeconds = Number(seconds);
    const parsedDuration = parsedMinutes * 60 + parsedSeconds;
    if (
      !Number.isFinite(parsedDistance) ||
      parsedDistance <= 0 ||
      !Number.isFinite(parsedMinutes) ||
      !Number.isFinite(parsedSeconds) ||
      parsedDuration <= 0
    ) {
      return;
    }
    const runType = window.prompt(
      `Edit run type (${RUN_TYPES.join(", ")})`,
      run.runType,
    );
    if (!runType) return;
    const pace = window.prompt("Edit pace", run.pace ?? "") ?? undefined;
    const notes = window.prompt("Edit notes", run.notes ?? "") ?? undefined;
    const date = window.prompt("Edit date (YYYY-MM-DD)", run.date);
    if (!date) return;

    actions.updateRunningLog(logId, {
      date: date as DateKey,
      loggedAt: run.loggedAt,
      distance: parsedDistance,
      unit: run.unit,
      duration: parsedDuration,
      pace,
      runType,
      notes,
    });
  }

  function promptUpdateMotto(mottoId: string, latin: string, english: string) {
    const nextLatin = window.prompt("Edit Latin", latin);
    if (!nextLatin) return;
    const nextEnglish = window.prompt("Edit English meaning", english);
    if (!nextEnglish) return;
    actions.updateMotto(mottoId, nextLatin, nextEnglish);
  }

  function promptAddPr() {
    const label = window.prompt("PR label/event", "5K");
    if (!label) return;
    const value = window.prompt("PR value/time or distance", "24:30");
    if (!value) return;
    const date = window.prompt("Date (YYYY-MM-DD)", todayKey());
    if (!date) return;
    const note = window.prompt("Optional note", "") ?? undefined;
    actions.addRunningPr(label, value, date as DateKey, note || undefined);
  }

  function promptUpdatePr(prId: string, label: string, value: string, date: DateKey, note?: string) {
    const nextLabel = window.prompt("Edit PR label/event", label);
    if (!nextLabel) return;
    const nextValue = window.prompt("Edit PR value/time or distance", value);
    if (!nextValue) return;
    const nextDate = window.prompt("Edit date (YYYY-MM-DD)", date);
    if (!nextDate) return;
    const nextNote = window.prompt("Edit note", note ?? "") ?? undefined;
    actions.updateRunningPr(prId, nextLabel, nextValue, nextDate as DateKey, nextNote || undefined);
  }

  return (
    <Shell>
      <header className="mb-7">
        <p className="text-[11px] uppercase tracking-[0.28em] text-blue-200/65">Progress</p>
        <h1 className="mt-3 text-white">Your momentum, summarized.</h1>
        <p className="mt-3 max-w-xs text-sm text-muted/90">
          A cleaner read on the disciplines that are holding and the controls for managing your data.
        </p>
      </header>

      <div className="space-y-6">
        <Card className="border-blue-400/12">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-blue-100/52">Account</p>
              <p className="mt-2 text-lg font-medium text-white">
                {auth.session ? auth.user?.email ?? "Signed in" : "Guest mode"}
              </p>
              <p className="mt-1 text-sm text-muted/88">
                {auth.session
                  ? `Sync mode: ${syncMode} • Status: ${syncStatus}`
                  : "Sign in to sync across devices. Local storage and backups still work as-is."}
              </p>
              {!auth.session && guestDataAvailable ? (
                <p className="mt-2 text-xs text-blue-100/72">Local data is available and can be imported after sign-in.</p>
              ) : null}
            </div>
            <Link href="/account">
              <PillButton>{auth.session ? "Manage account" : "Sign in / create account"}</PillButton>
            </Link>
          </div>
        </Card>

        <Card className="border-blue-400/12 bg-[linear-gradient(180deg,rgba(21,49,98,0.55),rgba(10,18,32,0.96))]">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
            <MetricCard label="Overall streak" value={`${getOverallStreak(state)} days`} />
            <MetricCard label="Habits active" value={`${state.habits.length}`} />
            <MetricCard label="Language study" value={`${getWeeklyLanguageMinutes(state)} min`} hint="This week" />
            <MetricCard label="School study" value={`${getWeeklySubjectMinutes(state)} min`} hint="This week" />
            <MetricCard label="Activity this week" value={`${getWeeklyMovementCount(state)}`} hint="Sessions" />
            <MetricCard label="Runs this week" value={`${running.runCount}`} hint={`${running.totalDistanceMiles.toFixed(1)} mi`} />
            <MetricCard label="Longest run" value={`${running.longestRunMiles.toFixed(1)} mi`} hint={running.averagePace ?? "No pace yet"} />
            <MetricCard
              label="Weight change"
              value={
                weight.delta !== undefined ? `${weight.delta > 0 ? "+" : ""}${weight.delta.toFixed(1)}` : "--"
              }
              hint={weight.start !== undefined ? `From ${weight.start}` : "Set a starting weight"}
            />
            <MetricCard
              label="Waist change"
              value={
                waist.delta !== undefined ? `${waist.delta > 0 ? "+" : ""}${waist.delta.toFixed(1)}"` : '--'
              }
              hint={waist.start !== undefined ? `From ${waist.start}"` : "Set a starting waist"}
            />
            <MetricCard label="Tasks this week" value={`${getWeeklyTaskCount(state)}`} />
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-2">
        <section>
          <SectionTitle title="Language totals" subtitle="Per language, with reset controls." />
          <div className="space-y-3">
            {languageSummaries.map((language) => (
              <Card key={language.id}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold tracking-[-0.03em] text-white">{language.name}</p>
                    <p className="mt-1 text-sm text-muted/90">
                      {language.todayMinutes} min today • {language.weekMinutes} min this week
                    </p>
                  </div>
                  <PillButton
                    onClick={() => {
                      if (window.confirm(`Reset totals for ${language.name}?`)) {
                        actions.resetLanguageTotals(language.id);
                      }
                    }}
                    variant="ghost"
                  >
                    Reset
                  </PillButton>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle title="Subject totals" subtitle="School study summaries alongside language work." />
          <div className="space-y-3">
            {subjectSummaries.map((subject) => (
              <Card key={subject.id}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold tracking-[-0.03em] text-white">{subject.name}</p>
                    <p className="mt-1 text-sm text-muted/90">
                      {subject.todayMinutes} min today • {subject.weekMinutes} min this week
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
        <section>
          <SectionTitle title="Habit streaks" subtitle="Independent trackers with strong emphasis." />
          <div className="grid grid-cols-2 gap-3">
            {state.habits.map((habit) => (
              <MetricCard key={habit.id} label={habit.name} value={`${getHabitStreak(habit)} days`} />
            ))}
          </div>
        </section>

        <section>
          <SectionTitle
            title="Running performance"
            subtitle="Weekly mileage, longest efforts, and current streaks."
          />
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              label="Run streak"
              value={`${runningPerformance.currentStreak} days`}
              hint={`Best ${runningPerformance.bestStreak} days`}
            />
            <MetricCard
              label="Longest ever"
              value={
                runningPerformance.longestEver
                  ? `${runningPerformance.longestEver.distance} ${runningPerformance.preferredUnit}`
                  : "--"
              }
              hint={
                runningPerformance.longestEver
                  ? runningPerformance.longestEver.date
                  : "No runs yet"
              }
            />
            <MetricCard
              label="Longest 30 days"
              value={
                runningPerformance.longestLast30
                  ? `${runningPerformance.longestLast30.distance} ${runningPerformance.preferredUnit}`
                  : "--"
              }
              hint={
                runningPerformance.longestLast30
                  ? runningPerformance.longestLast30.date
                  : "No recent runs"
              }
            />
            <MetricCard
              label="Weekly unit"
              value={runningPerformance.preferredUnit.toUpperCase()}
              hint="Mileage graph basis"
            />
          </div>
          <Card className="mt-4 h-72 border-blue-400/12">
            {runningPerformance.weeklyMileage.length > 0 ? (
              <ResponsiveContainer height="100%" width="100%">
                <LineChart
                  data={runningPerformance.weeklyMileage}
                  margin={{ top: 16, right: 8, left: -16, bottom: 8 }}
                >
                  <CartesianGrid stroke="rgba(141,164,196,0.1)" vertical={false} />
                  <XAxis dataKey="week" stroke="#8da4c4" tickLine={false} axisLine={false} />
                  <YAxis stroke="#8da4c4" tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(value: number) => [
                      `${value} ${runningPerformance.preferredUnit}`,
                      "Weekly total",
                    ]}
                    contentStyle={{
                      background: "rgba(19,35,58,0.96)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 18,
                      color: "#e8f0ff",
                    }}
                  />
                  <Line
                    dataKey="total"
                    stroke="#60a5fa"
                    strokeWidth={3.5}
                    dot={{ fill: "#93c5fd", r: 4 }}
                    type="monotone"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-center text-sm text-muted/85">
                Add runs to see weekly mileage over time.
              </div>
            )}
          </Card>
        </section>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
        <section>
          <SectionTitle
            title="Running bests"
            subtitle="Automatically detected from your logged run history."
          />
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              label="Longest run"
              value={
                runningBests.longestRun
                  ? `${runningBests.longestRun.distance} ${runningBests.preferredUnit}`
                  : "--"
              }
              hint={runningBests.longestRun?.date ?? "No runs yet"}
            />
            <MetricCard
              label="Fastest avg pace"
              value={
                runningBests.fastestAveragePace
                  ? `${formatDurationSeconds(Math.round(runningBests.fastestAveragePace.duration / runningBests.fastestAveragePace.distance))}/${runningBests.fastestAveragePace.unit}`
                  : "--"
              }
              hint={
                runningBests.fastestAveragePace
                  ? `${runningBests.fastestAveragePace.distance} ${runningBests.fastestAveragePace.unit} • ${runningBests.fastestAveragePace.date}`
                  : "No pace-worthy runs yet"
              }
            />
            <MetricCard
              label="Best mile+"
              value={
                runningBests.bestMile
                  ? formatDurationSeconds(runningBests.bestMile.duration)
                  : "--"
              }
              hint={
                runningBests.bestMile
                  ? `${runningBests.bestMile.distance} ${runningBests.bestMile.unit} • ${runningBests.bestMile.date}`
                  : "Need a 1 mile+ run"
              }
            />
            <MetricCard
              label="Best 5K"
              value={runningBests.best5k ? formatDurationSeconds(runningBests.best5k.duration) : "--"}
              hint={runningBests.best5k?.date ?? "No logged 5K yet"}
            />
            <MetricCard
              label="Best 10K"
              value={runningBests.best10k ? formatDurationSeconds(runningBests.best10k.duration) : "--"}
              hint={runningBests.best10k?.date ?? "No logged 10K yet"}
            />
          </div>
        </section>

        <section>
          <SectionTitle title="Weight trend" subtitle="A calmer, roomier view of the long arc." />
          <Card className="h-80 border-blue-400/12">
            {weight.chartData.length > 1 ? (
              <ResponsiveContainer height="100%" width="100%">
                <LineChart data={weight.chartData} margin={{ top: 16, right: 8, left: -20, bottom: 8 }}>
                  <CartesianGrid stroke="rgba(141,164,196,0.1)" vertical={false} />
                  <XAxis dataKey="date" stroke="#8da4c4" tickLine={false} axisLine={false} />
                  <YAxis stroke="#8da4c4" tickLine={false} axisLine={false} domain={["dataMin - 2", "dataMax + 2"]} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(19,35,58,0.96)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 18,
                      color: "#e8f0ff",
                    }}
                  />
                  <Line dataKey="weight" stroke="#60a5fa" strokeWidth={3.5} dot={{ fill: "#93c5fd", r: 4 }} type="monotone" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-center text-sm text-muted/85">
                Add at least two weight entries to see the trend line.
              </div>
            )}
          </Card>
        </section>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
        <section>
          <SectionTitle title="Waist trend" subtitle="Track your waistline with the same quiet consistency." />
          <Card className="h-80 border-blue-400/12">
            {waist.chartData.length > 1 ? (
              <ResponsiveContainer height="100%" width="100%">
                <LineChart data={waist.chartData} margin={{ top: 16, right: 8, left: -20, bottom: 8 }}>
                  <CartesianGrid stroke="rgba(141,164,196,0.1)" vertical={false} />
                  <XAxis dataKey="date" stroke="#8da4c4" tickLine={false} axisLine={false} />
                  <YAxis stroke="#8da4c4" tickLine={false} axisLine={false} domain={["dataMin - 1", "dataMax + 1"]} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(19,35,58,0.96)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 18,
                      color: "#e8f0ff",
                    }}
                  />
                  <Line dataKey="inches" stroke="#60a5fa" strokeWidth={3.5} dot={{ fill: "#93c5fd", r: 4 }} type="monotone" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-center text-sm text-muted/85">
                Add at least two waist entries to see the trend line.
              </div>
            )}
          </Card>
        </section>

        <section>
          <SectionTitle
            title="Running PRs"
            subtitle="Store your personal records in one clean, editable list."
            action={<PillButton onClick={promptAddPr}>Add PR</PillButton>}
          />
          <div className="space-y-3">
            {state.runningPrs.length > 0 ? (
              state.runningPrs
                .slice()
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((pr) => (
                  <Card key={pr.id}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-base font-medium text-white">{pr.label}</p>
                        <p className="mt-1 text-lg font-semibold tracking-[-0.03em] text-blue-100">
                          {pr.value}
                        </p>
                        <p className="mt-1 text-sm text-muted/85">
                          {pr.date}{pr.note ? ` • ${pr.note}` : ""}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          className="text-xs text-blue-100/80"
                          onClick={() => promptUpdatePr(pr.id, pr.label, pr.value, pr.date, pr.note)}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className="text-xs text-red-200"
                          onClick={() => {
                            if (window.confirm(`Delete PR "${pr.label}"?`)) {
                              actions.deleteRunningPr(pr.id);
                            }
                          }}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </Card>
                ))
            ) : (
              <Card>
                <p className="text-sm text-muted/85">No PRs saved yet.</p>
              </Card>
            )}
          </div>
        </section>
        </div>

        <section>
          <SectionTitle
            title="Backup & restore"
            subtitle="Export a full backup or restore from a previous Fervet backup file."
          />
          <Card className="space-y-4">
            <div className="rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-3">
              <p className="text-sm text-muted/88">
                Importing a backup replaces current local data on this device. Export first if you want a safety copy before restoring.
              </p>
            </div>
            <div className="grid gap-3">
              <PillButton onClick={exportData}>Export Data</PillButton>
              <PillButton
                onClick={() => fileInputRef.current?.click()}
                variant="ghost"
              >
                Import Data
              </PillButton>
              <input
                accept="application/json,.json"
                className="hidden"
                onChange={importData}
                ref={fileInputRef}
                type="file"
              />
            </div>
            {backupMessage ? (
              <div className="rounded-[18px] border border-blue-400/18 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">
                {backupMessage}
              </div>
            ) : null}
            {backupError ? (
              <div className="rounded-[18px] border border-red-400/12 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {backupError}
              </div>
            ) : null}
          </Card>
        </section>

        <section>
          <SectionTitle title="Motto manager" subtitle="Add, edit, delete, and switch rotation mode." />
          <Card className="space-y-4">
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <Select
                onChange={(event) => actions.setMottoRotationMode(event.target.value as "cycle" | "random")}
                value={state.mottoRotationMode}
              >
                <option value="cycle">Cycle</option>
                <option value="random">Random</option>
              </Select>
              <PillButton
                onClick={() => {
                  const latin = window.prompt("Latin motto");
                  if (!latin) return;
                  const english = window.prompt("English meaning");
                  if (!english) return;
                  actions.addMotto(latin, english);
                }}
              >
                Add
              </PillButton>
            </div>
            <div className="space-y-3">
              {state.mottoes.map((motto) => (
                <div className="rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-3" key={motto.id}>
                  <p className="text-sm font-medium text-white">{motto.latin}</p>
                  <p className="mt-1 text-sm text-muted/85">{motto.english}</p>
                  <div className="mt-3 flex gap-3">
                    <button className="text-xs text-blue-100/80" onClick={() => promptUpdateMotto(motto.id, motto.latin, motto.english)} type="button">
                      Edit
                    </button>
                    <button
                      className="text-xs text-red-200"
                      onClick={() => {
                        if (window.confirm("Delete this motto?")) actions.deleteMotto(motto.id);
                      }}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section>
          <SectionTitle title="Data controls" subtitle="Edit, delete, and reset without losing app structure." />
          <Card className="space-y-5">
            <div>
              <p className="text-sm font-medium text-white">Recent language logs</p>
              <div className="mt-3 space-y-3">
                {[...state.languageLogs]
                  .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())
                  .slice(0, 5)
                  .map((log) => (
                  <div className="rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-3" key={log.id}>
                    <p className="text-sm text-white">
                      {state.languages.find((language) => language.id === log.languageId)?.name ?? "Language"} • {log.minutes} min
                    </p>
                    <p className="mt-1 text-xs text-muted/78">{formatDateTimeLabel(log.loggedAt)}</p>
                    <div className="mt-2 flex gap-3">
                      <button className="text-xs text-blue-100/80" onClick={() => promptUpdateLanguageLog(log.id, log.minutes, log.note)} type="button">
                        Edit
                      </button>
                      <button
                        className="text-xs text-red-200"
                        onClick={() => {
                          if (window.confirm("Delete this language log?")) actions.deleteLanguageLog(log.id);
                        }}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-white">Recent subject logs</p>
              <div className="mt-3 space-y-3">
                {[...state.subjectLogs]
                  .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())
                  .slice(0, 5)
                  .map((log) => (
                  <div className="rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-3" key={log.id}>
                    <p className="text-sm text-white">
                      {state.subjects.find((subject) => subject.id === log.subjectId)?.name ?? "Subject"} • {log.minutes} min
                    </p>
                    <p className="mt-1 text-xs text-muted/78">{formatDateTimeLabel(log.loggedAt)}</p>
                    <div className="mt-2 flex gap-3">
                      <button className="text-xs text-blue-100/80" onClick={() => promptUpdateSubjectLog(log.id, log.minutes, log.note)} type="button">
                        Edit
                      </button>
                      <button
                        className="text-xs text-red-200"
                        onClick={() => {
                          if (window.confirm("Delete this subject log?")) actions.deleteSubjectLog(log.id);
                        }}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-white">Recent activity logs</p>
              <div className="mt-3 space-y-3">
                {[...state.movementLogs]
                  .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())
                  .slice(0, 5)
                  .map((log) => (
                  <div className="rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-3" key={log.id}>
                    <p className="text-sm text-white">{log.activity} • {log.duration} min</p>
                    <p className="mt-1 text-xs text-muted/78">{formatDateTimeLabel(log.loggedAt)}</p>
                    <div className="mt-2 flex gap-3">
                      <button className="text-xs text-blue-100/80" onClick={() => promptUpdateMovementLog(log.id, log.activity, log.duration, log.note)} type="button">
                        Edit
                      </button>
                      <button
                        className="text-xs text-red-200"
                        onClick={() => {
                          if (window.confirm("Delete this movement log?")) actions.deleteMovementLog(log.id);
                        }}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-white">Recent runs</p>
              <div className="mt-3 space-y-3">
                {[...state.runningLogs]
                  .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())
                  .slice(0, 5)
                  .map((run) => (
                  <div className="rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-3" key={run.id}>
                    <p className="text-sm text-white">{formatRun(run)}</p>
                    <p className="mt-1 text-xs text-muted/78">{formatDateTimeLabel(run.loggedAt)}</p>
                    <div className="mt-2 flex gap-3">
                      <button className="text-xs text-blue-100/80" onClick={() => promptUpdateRunning(run.id, run)} type="button">
                        Edit
                      </button>
                      <button
                        className="text-xs text-red-200"
                        onClick={() => {
                          if (window.confirm("Delete this run?")) actions.deleteRunningLog(run.id);
                        }}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                <PillButton
                  onClick={() => {
                    if (window.confirm("Reset all running logs?")) actions.resetRunningLogs();
                  }}
                  variant="ghost"
                >
                  Reset running logs
                </PillButton>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-white">Weight entries</p>
              <div className="mt-3 space-y-3">
                {state.weightLogs
                  .slice()
                  .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())
                  .slice(0, 5)
                  .map((entry) => (
                    <div className="rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-3" key={entry.id}>
                      <p className="text-sm text-white">
                        {entry.weight} on {formatDateTimeLabel(entry.loggedAt)}
                      </p>
                      <div className="mt-2 flex gap-3">
                        <button className="text-xs text-blue-100/80" onClick={() => promptUpdateWeight(entry.id, entry.weight, entry.date)} type="button">
                          Edit
                        </button>
                        <button
                          className="text-xs text-red-200"
                          onClick={() => {
                            if (window.confirm("Delete this weight entry?")) actions.deleteWeightEntry(entry.id);
                          }}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-white">Waist entries</p>
              <div className="mt-3 space-y-3">
                {state.waistLogs
                  .slice()
                  .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())
                  .slice(0, 5)
                  .map((entry) => (
                    <div className="rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-3" key={entry.id}>
                      <p className="text-sm text-white">
                        {entry.inches}&quot; on {formatDateTimeLabel(entry.loggedAt)}
                      </p>
                      <div className="mt-2 flex gap-3">
                        <button className="text-xs text-blue-100/80" onClick={() => promptUpdateWaist(entry.id, entry.inches, entry.date)} type="button">
                          Edit
                        </button>
                        <button
                          className="text-xs text-red-200"
                          onClick={() => {
                            if (window.confirm("Delete this waist entry?")) actions.deleteWaistEntry(entry.id);
                          }}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-white">Tasks</p>
              <div className="mt-3 space-y-3">
                {state.tasks.slice(0, 5).map((task) => (
                  <div className="rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-3" key={task.id}>
                    <p className="text-sm text-white">{task.title}</p>
                    <p className="text-xs text-muted/80">{task.dueDate}</p>
                    <div className="mt-2 flex gap-3">
                      <button className="text-xs text-blue-100/80" onClick={() => setEditingTaskId(task.id)} type="button">
                        Edit
                      </button>
                      <button
                        className="text-xs text-red-200"
                        onClick={() => setDeletingTaskId(task.id)}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3">
              <PillButton
                onClick={() => {
                  if (window.confirm("Reset all language totals?")) actions.resetLanguageTotals();
                }}
                variant="ghost"
              >
                Reset language totals
              </PillButton>
              <PillButton
                onClick={() => {
                  if (window.confirm("Reset all data? This clears localStorage for Fervet.")) {
                    actions.resetAllData();
                  }
                }}
                variant="danger"
              >
                Reset All Data
              </PillButton>
            </div>
          </Card>
        </section>
      </div>
      <TaskEditSheet
        onClose={() => setEditingTaskId(null)}
        onSave={(taskId, nextTitle, nextDueDate, nextRecurrence, scope) =>
          actions.updateTask(taskId, nextTitle, nextDueDate, nextRecurrence, scope)
        }
        open={Boolean(editingTask)}
        task={editingTask}
      />
      <TaskDeleteSheet
        onClose={() => setDeletingTaskId(null)}
        onDelete={(taskId, scope) => actions.deleteTask(taskId, scope)}
        open={Boolean(deletingTask)}
        task={deletingTask}
      />
    </Shell>
  );
}

"use client";

import { useMemo, useState } from "react";
import { getGoalSummaries, getWaistSummary, getWeightSummary, getWeeklyRunningSummary } from "@/lib/metrics";
import { useAppStore } from "@/lib/store";
import { Goal, GoalTimeframe, LinkedGoalType, ManualGoalType } from "@/lib/types";
import { GoalEditSheet } from "@/components/goal-edit-sheet";
import {
  Card,
  Field,
  Input,
  PillButton,
  ProgressBar,
  SectionTitle,
  SegmentedControl,
  Select,
  Shell,
} from "@/components/ui";

const LINKED_OPTIONS: { value: LinkedGoalType; label: string }[] = [
  { value: "weight", label: "Weight" },
  { value: "waist", label: "Waist" },
  { value: "running", label: "Running" },
  { value: "language-study", label: "Language study" },
  { value: "school-study", label: "School study" },
  { value: "habit", label: "Habit / sobriety" },
];

function labelForTimeframe(timeframe: GoalTimeframe) {
  if (timeframe === "this-week") return "This week";
  if (timeframe === "this-month") return "This month";
  if (timeframe === "custom") return "Custom";
  return "Open-ended";
}

export function GoalsScreen() {
  const { state, actions } = useAppStore();
  const summaries = getGoalSummaries(state);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const weight = getWeightSummary(state);
  const waist = getWaistSummary(state);
  const running = getWeeklyRunningSummary(state);

  const [mode, setMode] = useState<"linked" | "manual">("linked");
  const [title, setTitle] = useState("");
  const [linkedType, setLinkedType] = useState<LinkedGoalType>("running");
  const [manualType, setManualType] = useState<ManualGoalType>("manual");
  const [unit, setUnit] = useState("mi");
  const [targetValue, setTargetValue] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [timeframe, setTimeframe] = useState<GoalTimeframe>("this-week");
  const [targetDate, setTargetDate] = useState("");
  const [languageId, setLanguageId] = useState(state.selectedLanguageId ?? state.languages[0]?.id ?? "");
  const [subjectId, setSubjectId] = useState(state.selectedSubjectId ?? state.subjects[0]?.id ?? "");
  const [habitId, setHabitId] = useState(state.habits[0]?.id ?? "");
  const editingGoal = summaries.find((goal) => goal.id === editingGoalId);

  const suggestedTitle = useMemo(() => {
    if (mode === "manual") return title;
    if (linkedType === "weight") return "Reach target weight";
    if (linkedType === "waist") return "Reach target waist";
    if (linkedType === "running") return "Running distance goal";
    if (linkedType === "language-study") return "Language study goal";
    if (linkedType === "school-study") return "School study goal";
    return "Habit streak goal";
  }, [linkedType, mode, title]);

  function baselineForLinkedGoal(type: LinkedGoalType) {
    if (type === "weight") return weight.current ?? weight.start ?? undefined;
    if (type === "waist") return waist.current ?? waist.start ?? undefined;
    if (type === "habit") {
      const habit = state.habits.find((entry) => entry.id === habitId);
      return habit ? Math.max(0, Math.round((Date.now() - new Date(habit.currentStartAt).getTime()) / 86_400_000)) : 0;
    }
    if (type === "running") return running.totalDistanceMiles;
    return undefined;
  }

  function addGoal() {
    const parsedTarget = Number(targetValue);
    if (!Number.isFinite(parsedTarget) || parsedTarget <= 0) return;

    const base = {
      id: `goal-${Math.random().toString(36).slice(2, 10)}`,
      title: (title.trim() || suggestedTitle).trim(),
      createdAt: new Date().toISOString(),
      targetValue: parsedTarget,
      timeframe,
      targetDate: timeframe === "custom" ? targetDate || undefined : undefined,
    };

    if (mode === "manual") {
      const parsedCurrent = Number(currentValue || "0");
      const goal: Goal = {
        ...base,
        mode: "manual",
        manualType,
        unit,
        currentValue: Number.isFinite(parsedCurrent) ? parsedCurrent : 0,
      };
      actions.addGoal(goal);
    } else {
      const goal: Goal = {
        ...base,
        mode: "linked",
        linkedType,
        unit,
        baselineValue: baselineForLinkedGoal(linkedType),
        languageId: linkedType === "language-study" ? languageId : undefined,
        subjectId: linkedType === "school-study" ? subjectId : undefined,
        habitId: linkedType === "habit" ? habitId : undefined,
      };
      actions.addGoal(goal);
    }

    setTitle("");
    setTargetValue("");
    setCurrentValue("");
    setTargetDate("");
  }

  return (
    <Shell>
      <header className="mb-7">
        <p className="text-[11px] uppercase tracking-[0.28em] text-blue-200/65">Goals</p>
        <h1 className="mt-3 text-white">Aim at something measurable.</h1>
        <p className="mt-3 max-w-xs text-sm text-muted/90">
          Create motivating goals, link them to live data, and let the app keep the score honestly.
        </p>
      </header>

      <div className="space-y-6">
        <Card>
          <SectionTitle title="Create goal" subtitle="Linked goals stay synced. Manual goals stay flexible." />
          <div className="space-y-3">
            <SegmentedControl
              onChange={setMode}
              options={[
                { label: "Linked", value: "linked" },
                { label: "Manual", value: "manual" },
              ]}
              value={mode}
            />
            <Field label="Title">
              <Input onChange={(event) => setTitle(event.target.value)} placeholder={suggestedTitle} value={title} />
            </Field>
            {mode === "linked" ? (
              <>
                <Field label="Source">
                  <Select onChange={(event) => setLinkedType(event.target.value as LinkedGoalType)} value={linkedType}>
                    {LINKED_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                {linkedType === "language-study" ? (
                  <Field label="Language">
                    <Select onChange={(event) => setLanguageId(event.target.value)} value={languageId}>
                      {state.languages.map((language) => (
                        <option key={language.id} value={language.id}>
                          {language.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                ) : null}
                {linkedType === "school-study" ? (
                  <Field label="Subject">
                    <Select onChange={(event) => setSubjectId(event.target.value)} value={subjectId}>
                      {state.subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                ) : null}
                {linkedType === "habit" ? (
                  <Field label="Habit">
                    <Select onChange={(event) => setHabitId(event.target.value)} value={habitId}>
                      {state.habits.map((habit) => (
                        <option key={habit.id} value={habit.id}>
                          {habit.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                ) : null}
              </>
            ) : (
              <Field label="Manual type">
                <Select onChange={(event) => setManualType(event.target.value as ManualGoalType)} value={manualType}>
                  <option value="manual">Manual</option>
                  <option value="fasting">Fasting</option>
                </Select>
              </Field>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Target">
                <Input inputMode="decimal" onChange={(event) => setTargetValue(event.target.value)} value={targetValue} />
              </Field>
              <Field label="Unit">
                <Input onChange={(event) => setUnit(event.target.value)} placeholder="minutes, mi, lbs, hours" value={unit} />
              </Field>
            </div>
            {mode === "manual" ? (
              <Field label="Current value">
                <Input inputMode="decimal" onChange={(event) => setCurrentValue(event.target.value)} value={currentValue} />
              </Field>
            ) : null}
            <Field label="Timeframe">
              <Select onChange={(event) => setTimeframe(event.target.value as GoalTimeframe)} value={timeframe}>
                <option value="this-week">This week</option>
                <option value="this-month">This month</option>
                <option value="custom">Custom</option>
                <option value="none">No strict date</option>
              </Select>
            </Field>
            {timeframe === "custom" ? (
              <Field label="Target date">
                <Input onChange={(event) => setTargetDate(event.target.value)} type="date" value={targetDate} />
              </Field>
            ) : null}
            <PillButton onClick={addGoal}>Add goal</PillButton>
          </div>
        </Card>

        <section>
          <SectionTitle title="Active goals" subtitle="Progress updates automatically when linked data changes." />
          <div className="space-y-3">
            {summaries.length > 0 ? (
              summaries.map((goal) => (
                <Card key={goal.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold tracking-[-0.03em] text-white">{goal.title}</p>
                      <p className="mt-1 text-sm text-muted/85">
                        {goal.mode === "linked"
                          ? goal.linkedType.replace("-", " ")
                          : goal.manualType === "fasting"
                            ? "manual fasting"
                            : "manual"}{" "}
                        • {labelForTimeframe(goal.timeframe)}
                      </p>
                    </div>
                    <p className="text-lg font-semibold text-blue-100">{goal.percent}%</p>
                  </div>
                  <div className="mt-4">
                    <ProgressBar value={goal.percent} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-muted/88">
                    <p>Target: {goal.targetValue} {goal.unit}</p>
                    <p>Current: {goal.currentValue} {goal.unit}</p>
                    <p>{goal.supporting}</p>
                    <p>{goal.targetDate ? `By ${goal.targetDate}` : labelForTimeframe(goal.timeframe)}</p>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button className="text-xs text-blue-100/80" onClick={() => setEditingGoalId(goal.id)} type="button">
                      {goal.mode === "manual" ? "Edit goal" : "Edit linked goal"}
                    </button>
                  </div>
                </Card>
              ))
            ) : (
              <Card>
                <p className="text-sm text-muted/85">No goals yet. Add one linked or manual goal to start seeing progress here.</p>
              </Card>
            )}
          </div>
        </section>
      </div>
      <GoalEditSheet
        goal={editingGoal}
        habits={state.habits}
        languages={state.languages}
        onClose={() => setEditingGoalId(null)}
        onDelete={(goalId) => actions.deleteGoal(goalId)}
        onSave={(goalId, updates) => actions.updateGoal(goalId, updates)}
        open={Boolean(editingGoal)}
        subjects={state.subjects}
      />
    </Shell>
  );
}

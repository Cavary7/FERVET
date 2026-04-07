"use client";

import { useEffect, useState } from "react";
import { Goal, GoalTimeframe, LinkedGoalType, ManualGoalType } from "@/lib/types";
import { BottomSheet, Field, Input, PillButton, Select } from "@/components/ui";

const LINKED_OPTIONS: { value: LinkedGoalType; label: string }[] = [
  { value: "weight", label: "Weight" },
  { value: "waist", label: "Waist" },
  { value: "running", label: "Running" },
  { value: "language-study", label: "Language study" },
  { value: "school-study", label: "School study" },
  { value: "habit", label: "Habit / sobriety" },
];

export function GoalEditSheet({
  open,
  goal,
  languages,
  subjects,
  habits,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  goal?: Goal;
  languages: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
  habits: { id: string; name: string }[];
  onClose: () => void;
  onSave: (goalId: string, updates: Partial<Goal>) => void;
  onDelete: (goalId: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [unit, setUnit] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [timeframe, setTimeframe] = useState<GoalTimeframe>("none");
  const [targetDate, setTargetDate] = useState("");
  const [linkedType, setLinkedType] = useState<LinkedGoalType>("running");
  const [manualType, setManualType] = useState<ManualGoalType>("manual");
  const [languageId, setLanguageId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [habitId, setHabitId] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!goal || !open) return;
    setTitle(goal.title);
    setTargetValue(String(goal.targetValue));
    setUnit(goal.unit);
    setCurrentValue(String(goal.mode === "manual" ? goal.currentValue : ""));
    setTimeframe(goal.timeframe);
    setTargetDate(goal.targetDate ?? "");
    setShowDeleteConfirm(false);
    if (goal.mode === "linked") {
      setLinkedType(goal.linkedType);
      setLanguageId(goal.languageId ?? languages[0]?.id ?? "");
      setSubjectId(goal.subjectId ?? subjects[0]?.id ?? "");
      setHabitId(goal.habitId ?? habits[0]?.id ?? "");
    } else {
      setManualType(goal.manualType);
    }
  }, [open, goal, languages, subjects, habits]);

  const canSave =
    title.trim().length > 0 &&
    Number.isFinite(Number(targetValue)) &&
    Number(targetValue) > 0 &&
    (goal?.mode === "manual" ? Number.isFinite(Number(currentValue || "0")) : true);

  function handleSave() {
    if (!goal) return;
    const parsedTarget = Number(targetValue);
    if (!Number.isFinite(parsedTarget) || parsedTarget <= 0) return;
    const updates: Partial<Goal> =
      goal.mode === "linked"
        ? {
            title: title.trim(),
            targetValue: parsedTarget,
            unit: unit.trim(),
            timeframe,
            targetDate: timeframe === "custom" ? targetDate || undefined : undefined,
            linkedType,
            languageId: linkedType === "language-study" ? languageId : undefined,
            subjectId: linkedType === "school-study" ? subjectId : undefined,
            habitId: linkedType === "habit" ? habitId : undefined,
          }
        : {
            title: title.trim(),
            targetValue: parsedTarget,
            unit: unit.trim(),
            timeframe,
            targetDate: timeframe === "custom" ? targetDate || undefined : undefined,
            manualType,
            currentValue: Number(currentValue || "0"),
          };
    onSave(goal.id, updates);
    onClose();
  }

  return (
    <BottomSheet
      footer={
        showDeleteConfirm ? (
          <div className="rounded-[18px] border border-red-400/12 bg-red-500/10 p-3">
            <p className="text-sm text-red-100">Delete this goal immediately?</p>
            <div className="mt-3 flex gap-3">
              <PillButton
                onClick={() => {
                  if (!goal) return;
                  onDelete(goal.id);
                  setShowDeleteConfirm(false);
                  onClose();
                }}
                variant="danger"
              >
                Delete goal
              </PillButton>
              <PillButton onClick={() => setShowDeleteConfirm(false)} variant="ghost">
                Cancel
              </PillButton>
            </div>
          </div>
        ) : (
          <>
            <div className="flex gap-3">
              <PillButton disabled={!canSave} onClick={handleSave}>
                Save changes
              </PillButton>
              <PillButton onClick={onClose} variant="ghost">
                Cancel
              </PillButton>
            </div>
            <button
              className="mt-3 text-sm text-red-200"
              onClick={() => setShowDeleteConfirm(true)}
              type="button"
            >
              Delete goal
            </button>
          </>
        )
      }
      onClose={onClose}
      open={open}
      subtitle="Update the goal details without leaving the flow."
      title="Edit goal"
    >
      <div className="space-y-4 pb-2">
        <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-3 py-3">
          <p className="text-xs uppercase tracking-[0.18em] text-blue-100/45">
            {goal?.mode === "linked" ? "Linked goal" : "Manual goal"}
          </p>
          <p className="mt-1 text-sm text-muted/82">
            Changes save directly to Fervet and update the goals list immediately.
          </p>
        </div>
        <Field label="Title">
          <Input onChange={(event) => setTitle(event.target.value)} value={title} />
        </Field>
        {goal?.mode === "linked" ? (
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
                  {languages.map((language) => (
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
                  {subjects.map((subject) => (
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
                  {habits.map((habit) => (
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
            <Input onChange={(event) => setUnit(event.target.value)} value={unit} />
          </Field>
        </div>
        {goal?.mode === "manual" ? (
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
      </div>
    </BottomSheet>
  );
}

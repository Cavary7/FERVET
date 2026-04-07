"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { DEFAULT_MOTTOES } from "@/lib/constants";
import { addDaysToKey, fromDateKey, todayKey, toDateKey } from "@/lib/date";
import { loadState, saveState, STORAGE_KEY } from "@/lib/storage";
import {
  AppState,
  DateKey,
  Goal,
  Habit,
  Language,
  LanguageLog,
  Motto,
  MottoRotationMode,
  MovementLog,
  RunningLog,
  RunningPr,
  RunUnit,
  Subject,
  SubjectLog,
  Task,
  WaistLog,
  WeightLog,
} from "@/lib/types";

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function createMotto(latin: string, english: string): Motto {
  return {
    id: createId("motto"),
    latin,
    english,
  };
}

function createDefaultMottoes() {
  return DEFAULT_MOTTOES.map((motto) => createMotto(motto.latin, motto.english));
}

function createDefaultLanguage(name = "Mandarin"): Language {
  return {
    id: createId("language"),
    name,
    createdAt: new Date().toISOString(),
  };
}

function createDefaultSubject(name = "Precalculus"): Subject {
  return {
    id: createId("subject"),
    name,
    createdAt: new Date().toISOString(),
  };
}

function createDefaultHabit(name = "Habit maintained", startAt = new Date().toISOString()): Habit {
  const startDateKey = toDateKey(new Date(startAt));
  return {
    id: createId("habit"),
    name,
    createdAt: new Date().toISOString(),
    trackingStartedAt: startAt,
    cleanDays: {
      [startDateKey]: true,
    },
    currentStartAt: startAt,
    resets: [],
  };
}

function isoFromDateKey(dateKey: DateKey) {
  return fromDateKey(dateKey).toISOString();
}

function createRecurringTaskId() {
  return createId("recurring-task");
}

function getNextDueDate(dateKey: DateKey, recurrence: "daily" | "weekly" | "monthly") {
  if (recurrence === "daily") return addDaysToKey(dateKey, 1);
  if (recurrence === "weekly") return addDaysToKey(dateKey, 7);
  const base = fromDateKey(dateKey);
  return `${base.getFullYear()}-${String(base.getMonth() + 2).padStart(2, "0")}-${String(
    Math.min(base.getDate(), new Date(base.getFullYear(), base.getMonth() + 2, 0).getDate()),
  ).padStart(2, "0")}` as DateKey;
}

function ensureRecurringTasks(tasks: Task[]) {
  const result = [...tasks];
  const groups = new Map<string, Task[]>();
  const horizon = addDaysToKey(todayKey(), 90);

  result.forEach((task) => {
    if (task.recurringTaskId && task.recurrence) {
      groups.set(task.recurringTaskId, [...(groups.get(task.recurringTaskId) ?? []), task]);
    }
  });

  groups.forEach((entries) => {
    const recurrence = entries[0].recurrence;
    if (!recurrence) return;

    const latest = [...entries].sort((a, b) => a.dueDate.localeCompare(b.dueDate)).at(-1);
    if (!latest) return;

    const openDates = new Set(entries.filter((task) => !task.completedAt).map((task) => task.dueDate));
    let cursor = latest.dueDate;

    while (cursor < horizon) {
      cursor = getNextDueDate(cursor, recurrence);
      if (openDates.has(cursor)) continue;
      result.push({
        ...latest,
        id: createId("task"),
        dueDate: cursor,
        completedAt: undefined,
        createdAt: new Date().toISOString(),
      });
      openDates.add(cursor);
    }
  });

  return result;
}

function createDefaultState(): AppState {
  const language = createDefaultLanguage();
  const subject = createDefaultSubject();
  return {
    mottoes: createDefaultMottoes(),
    mottoRotationMode: "cycle",
    languages: [language],
    subjects: [subject],
    selectedLanguageId: language.id,
    selectedSubjectId: subject.id,
    languageLogs: [],
    subjectLogs: [],
    movementLogs: [],
    activeSubjectSession: undefined,
    runningDurationVersion: 2,
    runningLogs: [],
    runningPrs: [],
    weightLogs: [],
    waistLogs: [],
    tasks: [],
    habits: [createDefaultHabit()],
    goals: [],
  };
}

function normalizeMottoes(raw: Record<string, unknown>) {
  if (Array.isArray(raw.mottoes) && raw.mottoes.length > 0) {
    return raw.mottoes.map((entry) => {
      const current = entry as Partial<Motto>;
      return {
        id: current.id ?? createId("motto"),
        latin: current.latin ?? "",
        english: current.english ?? "",
      };
    });
  }

  return createDefaultMottoes();
}

function normalizeMovementLogs(raw: Record<string, unknown>) {
  return Array.isArray(raw.movementLogs)
    ? raw.movementLogs.map((entry) => {
        const current = entry as Partial<MovementLog>;
        return {
          id: current.id ?? createId("movement"),
          date: (current.date ?? todayKey()) as DateKey,
          activity: current.activity ?? "soccer",
          duration: typeof current.duration === "number" ? current.duration : 0,
          note: current.note,
          completed: current.completed ?? true,
          createdAt: current.createdAt ?? new Date().toISOString(),
        };
      })
    : [];
}

function normalizeWeightLogs(raw: Record<string, unknown>) {
  return Array.isArray(raw.weightLogs) ? (raw.weightLogs as WeightLog[]) : [];
}

function normalizeWaistLogs(raw: Record<string, unknown>) {
  return Array.isArray(raw.waistLogs) ? (raw.waistLogs as WaistLog[]) : [];
}

function normalizeTasks(raw: Record<string, unknown>) {
  return Array.isArray(raw.tasks)
    ? raw.tasks
        .map((entry) => {
          const current = entry as Partial<Task>;
          if (!current.dueDate) return null;
          return {
            id: current.id ?? createId("task"),
            title: current.title ?? "Task",
            dueDate: current.dueDate,
            createdAt: current.createdAt ?? new Date().toISOString(),
            completedAt: current.completedAt,
            recurrence:
              current.recurrence === "daily" ||
              current.recurrence === "weekly" ||
              current.recurrence === "monthly"
                ? current.recurrence
                : undefined,
            recurringTaskId: current.recurringTaskId,
          };
        })
        .filter((task): task is NonNullable<typeof task> => Boolean(task))
    : [];
}

function normalizeGoals(raw: Record<string, unknown>) {
  return Array.isArray(raw.goals)
    ? raw.goals.map((entry) => {
        const current = entry as Partial<Goal> & {
          manualType?: "manual" | "fasting";
          currentValue?: number;
          linkedType?: "weight" | "waist" | "running" | "language-study" | "school-study" | "habit";
          baselineValue?: number;
          languageId?: string;
          subjectId?: string;
          habitId?: string;
        };
        return {
          id: current.id ?? createId("goal"),
          title: current.title ?? "Goal",
          createdAt: current.createdAt ?? new Date().toISOString(),
          targetValue:
            typeof current.targetValue === "number" && Number.isFinite(current.targetValue)
              ? current.targetValue
              : 0,
          targetDate: current.targetDate,
          timeframe:
            current.timeframe === "this-week" ||
            current.timeframe === "this-month" ||
            current.timeframe === "custom"
              ? current.timeframe
              : "none",
          mode: current.mode === "linked" ? "linked" : "manual",
          ...(current.mode === "linked"
            ? {
                linkedType:
                  current.linkedType === "weight" ||
                  current.linkedType === "waist" ||
                  current.linkedType === "running" ||
                  current.linkedType === "language-study" ||
                  current.linkedType === "school-study" ||
                  current.linkedType === "habit"
                    ? current.linkedType
                    : "running",
                unit: current.unit ?? "",
                baselineValue:
                  typeof current.baselineValue === "number" ? current.baselineValue : undefined,
                languageId: current.languageId,
                subjectId: current.subjectId,
                habitId: current.habitId,
              }
            : {
                manualType: current.manualType === "fasting" ? "fasting" : "manual",
                unit: current.unit ?? "",
                currentValue:
                  typeof current.currentValue === "number" && Number.isFinite(current.currentValue)
                    ? current.currentValue
                    : 0,
              }),
        } as Goal;
      })
    : [];
}

function normalizeRunningLogs(raw: Record<string, unknown>): RunningLog[] {
  const version = raw.runningDurationVersion === 2 ? 2 : 1;
  return Array.isArray(raw.runningLogs)
    ? raw.runningLogs.map((log) => {
        const current = log as Partial<RunningLog>;
        return {
          id: current.id ?? createId("run"),
          date: (current.date ?? todayKey()) as DateKey,
          distance: typeof current.distance === "number" ? current.distance : 0,
          unit: current.unit === "km" ? "km" : "mi",
          duration:
            typeof current.duration === "number"
              ? version === 2
                ? current.duration
                : current.duration * 60
              : 0,
          pace: current.pace,
          runType: current.runType ?? "easy",
          notes: current.notes,
          createdAt: current.createdAt ?? new Date().toISOString(),
        };
      })
    : [];
}

function normalizeRunningPrs(raw: Record<string, unknown>): RunningPr[] {
  return Array.isArray(raw.runningPrs)
    ? raw.runningPrs.map((entry) => {
        const current = entry as Partial<RunningPr>;
        return {
          id: current.id ?? createId("pr"),
          label: current.label ?? "Custom",
          value: current.value ?? "",
          date: (current.date ?? todayKey()) as DateKey,
          note: current.note,
          createdAt: current.createdAt ?? new Date().toISOString(),
        };
      })
    : [];
}

function normalizeState(input: unknown): AppState {
  const fallback = createDefaultState();
  const raw = (input as Record<string, unknown> | null) ?? {};

  const languages =
    Array.isArray(raw.languages) && raw.languages.length > 0
      ? (raw.languages as Language[])
      : [createDefaultLanguage(typeof raw.languageLabel === "string" ? raw.languageLabel : "Mandarin")];

  const primaryLanguageId = languages[0].id;
  const subjects =
    Array.isArray(raw.subjects) && raw.subjects.length > 0
      ? (raw.subjects as Subject[])
      : fallback.subjects;
  const primarySubjectId = subjects[0].id;
  const selectedLanguageId =
    typeof raw.selectedLanguageId === "string" &&
    languages.some((language) => language.id === raw.selectedLanguageId)
      ? raw.selectedLanguageId
      : primaryLanguageId;
  const selectedSubjectId =
    typeof raw.selectedSubjectId === "string" &&
    subjects.some((subject) => subject.id === raw.selectedSubjectId)
      ? raw.selectedSubjectId
      : primarySubjectId;

  const languageLogs: LanguageLog[] = Array.isArray(raw.languageLogs)
    ? raw.languageLogs.map((log) => {
        const current = log as Partial<LanguageLog>;
        return {
          id: current.id ?? createId("language-log"),
          languageId:
            typeof current.languageId === "string" &&
            languages.some((language) => language.id === current.languageId)
              ? current.languageId
              : primaryLanguageId,
          date: (current.date ?? todayKey()) as DateKey,
          minutes: typeof current.minutes === "number" ? current.minutes : 0,
          note: current.note,
          createdAt: current.createdAt ?? new Date().toISOString(),
          source: current.source === "timer" ? "timer" : "manual",
        };
      })
    : [];

  const subjectLogs: SubjectLog[] = Array.isArray(raw.subjectLogs)
    ? raw.subjectLogs.map((log) => {
        const current = log as Partial<SubjectLog>;
        return {
          id: current.id ?? createId("subject-log"),
          subjectId:
            typeof current.subjectId === "string" &&
            subjects.some((subject) => subject.id === current.subjectId)
              ? current.subjectId
              : primarySubjectId,
          date: (current.date ?? todayKey()) as DateKey,
          minutes: typeof current.minutes === "number" ? current.minutes : 0,
          note: current.note,
          createdAt: current.createdAt ?? new Date().toISOString(),
          source: current.source === "timer" ? "timer" : "manual",
        };
      })
    : [];

  const activeLanguageSession =
    raw.activeLanguageSession &&
    typeof raw.activeLanguageSession === "object" &&
    typeof (raw.activeLanguageSession as { startedAt?: unknown }).startedAt === "string" &&
    typeof (raw.activeLanguageSession as { languageId?: unknown }).languageId === "string"
      ? (raw.activeLanguageSession as AppState["activeLanguageSession"])
      : typeof raw.activeLanguageSessionStartedAt === "string"
        ? {
            languageId: selectedLanguageId,
            startedAt: raw.activeLanguageSessionStartedAt,
          }
        : undefined;
  const activeSubjectSession =
    raw.activeSubjectSession &&
    typeof raw.activeSubjectSession === "object" &&
    typeof (raw.activeSubjectSession as { startedAt?: unknown }).startedAt === "string" &&
    typeof (raw.activeSubjectSession as { subjectId?: unknown }).subjectId === "string"
      ? (raw.activeSubjectSession as AppState["activeSubjectSession"])
      : undefined;

  const habits =
    Array.isArray(raw.habits) && raw.habits.length > 0
      ? (raw.habits as Habit[]).map((habit) => ({
          ...habit,
          trackingStartedAt: habit.trackingStartedAt ?? habit.currentStartAt ?? new Date().toISOString(),
          currentStartAt: habit.currentStartAt ?? habit.trackingStartedAt ?? new Date().toISOString(),
          cleanDays: habit.cleanDays ?? {},
          resets: Array.isArray(habit.resets) ? habit.resets : [],
        }))
      : raw.habit && typeof raw.habit === "object"
        ? [
            {
              id: createId("habit"),
              name: "Habit maintained",
              createdAt: new Date().toISOString(),
              trackingStartedAt:
                (raw.habit as { trackingStartedAt?: string; currentStartAt?: string }).trackingStartedAt ??
                (raw.habit as { currentStartAt?: string }).currentStartAt ??
                new Date().toISOString(),
              cleanDays:
                (raw.habit as { cleanDays?: Record<DateKey, boolean> }).cleanDays ?? {
                  [todayKey()]: true,
                },
              currentStartAt:
                (raw.habit as { currentStartAt?: string }).currentStartAt ??
                new Date().toISOString(),
              resets: (raw.habit as { resets?: Habit["resets"] }).resets ?? [],
            },
          ]
        : fallback.habits;

  const mottoRotationMode: MottoRotationMode =
    raw.mottoRotationMode === "random" ? "random" : "cycle";

  return {
    mottoes: normalizeMottoes(raw),
    mottoRotationMode,
    languages,
    subjects,
    selectedLanguageId,
    selectedSubjectId,
    languageLogs,
    subjectLogs,
    activeLanguageSession,
    activeSubjectSession,
    movementLogs: normalizeMovementLogs(raw),
    runningDurationVersion: 2,
    runningLogs: normalizeRunningLogs(raw),
    runningPrs: normalizeRunningPrs(raw),
    weightStart: typeof raw.weightStart === "number" ? raw.weightStart : undefined,
    weightLogs: normalizeWeightLogs(raw),
    waistStart: typeof raw.waistStart === "number" ? raw.waistStart : undefined,
    waistLogs: normalizeWaistLogs(raw),
    tasks: ensureRecurringTasks(normalizeTasks(raw)),
    habits,
    goals: normalizeGoals(raw),
  };
}

type StoreContextValue = {
  state: AppState;
  hydrated: boolean;
  now: number;
  actions: {
    addLanguage: (name: string) => void;
    updateLanguage: (languageId: string, name: string) => void;
    deleteLanguage: (languageId: string) => void;
    resetLanguageTotals: (languageId?: string) => void;
    selectLanguage: (languageId: string) => void;
    startLanguageSession: (languageId: string) => void;
    stopLanguageSession: (note?: string) => void;
    addLanguageMinutes: (languageId: string, minutes: number, dateKey?: DateKey, note?: string) => void;
    updateLanguageLog: (logId: string, minutes: number, note?: string) => void;
    deleteLanguageLog: (logId: string) => void;
    addSubject: (name: string) => void;
    updateSubject: (subjectId: string, name: string) => void;
    deleteSubject: (subjectId: string) => void;
    selectSubject: (subjectId: string) => void;
    startSubjectSession: (subjectId: string) => void;
    stopSubjectSession: (note?: string) => void;
    addSubjectMinutes: (subjectId: string, minutes: number, dateKey?: DateKey, note?: string) => void;
    updateSubjectLog: (logId: string, minutes: number, note?: string) => void;
    deleteSubjectLog: (logId: string) => void;
    addHabit: (name: string, startAt?: string) => void;
    updateHabit: (habitId: string, name: string) => void;
    updateHabitStartDate: (habitId: string, isoTimestamp: string) => void;
    deleteHabit: (habitId: string) => void;
    toggleHabitDay: (habitId: string, dateKey: DateKey, value: boolean) => void;
    resetHabit: (habitId: string) => void;
    addMovementLog: (activity: string, duration: number, note?: string, dateKey?: DateKey) => void;
    updateMovementLog: (logId: string, activity: string, duration: number, note?: string) => void;
    deleteMovementLog: (logId: string) => void;
    addRunningLog: (payload: {
      date?: DateKey;
      distance: number;
      unit: RunUnit;
      duration: number;
      pace?: string;
      runType: string;
      notes?: string;
    }) => void;
    updateRunningLog: (logId: string, payload: Omit<RunningLog, "id" | "createdAt">) => void;
    deleteRunningLog: (logId: string) => void;
    resetRunningLogs: () => void;
    addRunningPr: (label: string, value: string, date: DateKey, note?: string) => void;
    updateRunningPr: (prId: string, label: string, value: string, date: DateKey, note?: string) => void;
    deleteRunningPr: (prId: string) => void;
    addWeightEntry: (weight: number, dateKey?: DateKey) => void;
    updateWeightEntry: (entryId: string, weight: number, dateKey?: DateKey) => void;
    deleteWeightEntry: (entryId: string) => void;
    setWeightStart: (weight: number) => void;
    addWaistEntry: (inches: number, dateKey?: DateKey) => void;
    updateWaistEntry: (entryId: string, inches: number, dateKey?: DateKey) => void;
    deleteWaistEntry: (entryId: string) => void;
    setWaistStart: (inches: number) => void;
    addTask: (title: string, dueDate: DateKey, recurrence?: Task["recurrence"]) => void;
    updateTask: (
      taskId: string,
      title: string,
      dueDate: DateKey,
      recurrence?: Task["recurrence"],
      scope?: "one" | "following" | "all",
    ) => void;
    deleteTask: (taskId: string, scope?: "one" | "following" | "all") => void;
    toggleTask: (taskId: string) => void;
    addGoal: (goal: Goal) => void;
    updateGoal: (goalId: string, updates: Partial<Goal>) => void;
    deleteGoal: (goalId: string) => void;
    importAppState: (input: unknown) => { ok: boolean; error?: string };
    addMotto: (latin: string, english: string) => void;
    updateMotto: (mottoId: string, latin: string, english: string) => void;
    deleteMotto: (mottoId: string) => void;
    setMottoRotationMode: (mode: MottoRotationMode) => void;
    resetAllData: () => void;
  };
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(createDefaultState());
  const [hydrated, setHydrated] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    setState(normalizeState(loadState(createDefaultState())));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      saveState(state);
    }
  }, [hydrated, state]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const actions = useMemo(
    () => ({
      addLanguage(name: string) {
        const trimmed = name.trim();
        if (!trimmed) return;
        const language = createDefaultLanguage(trimmed);
        setState((current) => ({
          ...current,
          languages: [...current.languages, language],
          selectedLanguageId: language.id,
        }));
      },
      updateLanguage(languageId: string, name: string) {
        const trimmed = name.trim();
        if (!trimmed) return;
        setState((current) => ({
          ...current,
          languages: current.languages.map((language) =>
            language.id === languageId ? { ...language, name: trimmed } : language,
          ),
        }));
      },
      deleteLanguage(languageId: string) {
        setState((current) => {
          const remaining = current.languages.filter((language) => language.id !== languageId);
          const nextLanguages = remaining.length > 0 ? remaining : [createDefaultLanguage()];
          const nextSelected =
            current.selectedLanguageId === languageId
              ? nextLanguages[0].id
              : current.selectedLanguageId;

          return {
            ...current,
            languages: nextLanguages,
            selectedLanguageId: nextSelected,
            languageLogs: current.languageLogs.filter((log) => log.languageId !== languageId),
            activeLanguageSession:
              current.activeLanguageSession?.languageId === languageId
                ? undefined
                : current.activeLanguageSession,
          };
        });
      },
      resetLanguageTotals(languageId?: string) {
        setState((current) => ({
          ...current,
          languageLogs: languageId
            ? current.languageLogs.filter((log) => log.languageId !== languageId)
            : [],
          activeLanguageSession:
            languageId && current.activeLanguageSession?.languageId !== languageId
              ? current.activeLanguageSession
              : undefined,
        }));
      },
      selectLanguage(languageId: string) {
        setState((current) => ({
          ...current,
          selectedLanguageId: languageId,
        }));
      },
      startLanguageSession(languageId: string) {
        setState((current) => ({
          ...current,
          selectedLanguageId: languageId,
          activeLanguageSession:
            current.activeLanguageSession ?? {
              languageId,
              startedAt: new Date().toISOString(),
            },
        }));
      },
      stopLanguageSession(note?: string) {
        setState((current) => {
          if (!current.activeLanguageSession) return current;
          const elapsedMs = Date.now() - new Date(current.activeLanguageSession.startedAt).getTime();
          const minutes = Math.max(1, Math.round(elapsedMs / 60_000));

          return {
            ...current,
            activeLanguageSession: undefined,
            languageLogs: [
              {
                id: createId("language-log"),
                languageId: current.activeLanguageSession.languageId,
                date: todayKey(),
                minutes,
                note,
                createdAt: new Date().toISOString(),
                source: "timer",
              },
              ...current.languageLogs,
            ],
          };
        });
      },
      addLanguageMinutes(languageId: string, minutes: number, dateKey = todayKey(), note?: string) {
        setState((current) => ({
          ...current,
          selectedLanguageId: languageId,
          languageLogs: [
            {
              id: createId("language-log"),
              languageId,
              date: dateKey,
              minutes,
              note,
              createdAt: new Date().toISOString(),
              source: "manual",
            },
            ...current.languageLogs,
          ],
        }));
      },
      updateLanguageLog(logId: string, minutes: number, note?: string) {
        setState((current) => ({
          ...current,
          languageLogs: current.languageLogs.map((log) =>
            log.id === logId ? { ...log, minutes, note } : log,
          ),
        }));
      },
      deleteLanguageLog(logId: string) {
        setState((current) => ({
          ...current,
          languageLogs: current.languageLogs.filter((log) => log.id !== logId),
        }));
      },
      addSubject(name: string) {
        const trimmed = name.trim();
        if (!trimmed) return;
        const subject = createDefaultSubject(trimmed);
        setState((current) => ({
          ...current,
          subjects: [...current.subjects, subject],
          selectedSubjectId: subject.id,
        }));
      },
      updateSubject(subjectId: string, name: string) {
        const trimmed = name.trim();
        if (!trimmed) return;
        setState((current) => ({
          ...current,
          subjects: current.subjects.map((subject) =>
            subject.id === subjectId ? { ...subject, name: trimmed } : subject,
          ),
        }));
      },
      deleteSubject(subjectId: string) {
        setState((current) => {
          const remaining = current.subjects.filter((subject) => subject.id !== subjectId);
          const nextSubjects = remaining.length > 0 ? remaining : [createDefaultSubject()];
          return {
            ...current,
            subjects: nextSubjects,
            selectedSubjectId:
              current.selectedSubjectId === subjectId ? nextSubjects[0].id : current.selectedSubjectId,
            subjectLogs: current.subjectLogs.filter((log) => log.subjectId !== subjectId),
            activeSubjectSession:
              current.activeSubjectSession?.subjectId === subjectId
                ? undefined
                : current.activeSubjectSession,
          };
        });
      },
      selectSubject(subjectId: string) {
        setState((current) => ({
          ...current,
          selectedSubjectId: subjectId,
        }));
      },
      startSubjectSession(subjectId: string) {
        setState((current) => ({
          ...current,
          selectedSubjectId: subjectId,
          activeSubjectSession:
            current.activeSubjectSession ?? {
              subjectId,
              startedAt: new Date().toISOString(),
            },
        }));
      },
      stopSubjectSession(note?: string) {
        setState((current) => {
          if (!current.activeSubjectSession) return current;
          const elapsedMs = Date.now() - new Date(current.activeSubjectSession.startedAt).getTime();
          const minutes = Math.max(1, Math.round(elapsedMs / 60_000));
          return {
            ...current,
            activeSubjectSession: undefined,
            subjectLogs: [
              {
                id: createId("subject-log"),
                subjectId: current.activeSubjectSession.subjectId,
                date: todayKey(),
                minutes,
                note,
                createdAt: new Date().toISOString(),
                source: "timer",
              },
              ...current.subjectLogs,
            ],
          };
        });
      },
      addSubjectMinutes(subjectId: string, minutes: number, dateKey = todayKey(), note?: string) {
        setState((current) => ({
          ...current,
          selectedSubjectId: subjectId,
          subjectLogs: [
            {
              id: createId("subject-log"),
              subjectId,
              date: dateKey,
              minutes,
              note,
              createdAt: new Date().toISOString(),
              source: "manual",
            },
            ...current.subjectLogs,
          ],
        }));
      },
      updateSubjectLog(logId: string, minutes: number, note?: string) {
        setState((current) => ({
          ...current,
          subjectLogs: current.subjectLogs.map((log) =>
            log.id === logId ? { ...log, minutes, note } : log,
          ),
        }));
      },
      deleteSubjectLog(logId: string) {
        setState((current) => ({
          ...current,
          subjectLogs: current.subjectLogs.filter((log) => log.id !== logId),
        }));
      },
      addHabit(name: string, startAt = new Date().toISOString()) {
        const trimmed = name.trim();
        if (!trimmed) return;
        setState((current) => ({
          ...current,
          habits: [...current.habits, createDefaultHabit(trimmed, startAt)],
        }));
      },
      updateHabit(habitId: string, name: string) {
        const trimmed = name.trim();
        if (!trimmed) return;
        setState((current) => ({
          ...current,
          habits: current.habits.map((habit) =>
            habit.id === habitId ? { ...habit, name: trimmed } : habit,
          ),
        }));
      },
      updateHabitStartDate(habitId: string, isoTimestamp: string) {
        const isoDateKey = toDateKey(new Date(isoTimestamp));
        setState((current) => ({
          ...current,
          habits: current.habits.map((habit) =>
            habit.id === habitId
              ? {
                  ...habit,
                  trackingStartedAt: isoTimestamp,
                  currentStartAt: isoTimestamp,
                  cleanDays: {
                    ...habit.cleanDays,
                    [isoDateKey]: true,
                  },
                }
              : habit,
          ),
        }));
      },
      deleteHabit(habitId: string) {
        setState((current) => {
          const remaining = current.habits.filter((habit) => habit.id !== habitId);
          return {
            ...current,
            habits: remaining.length > 0 ? remaining : [createDefaultHabit()],
          };
        });
      },
      toggleHabitDay(habitId: string, dateKey: DateKey, value: boolean) {
        setState((current) => ({
          ...current,
          habits: current.habits.map((habit) =>
            habit.id === habitId
              ? {
                  ...habit,
                  cleanDays: {
                    ...habit.cleanDays,
                    [dateKey]: value,
                  },
                }
              : habit,
          ),
        }));
      },
      resetHabit(habitId: string) {
        const nowIso = new Date().toISOString();
        setState((current) => ({
          ...current,
          habits: current.habits.map((habit) =>
            habit.id === habitId
              ? {
                  ...habit,
                  cleanDays: {
                    ...habit.cleanDays,
                    [todayKey()]: false,
                  },
                  currentStartAt: nowIso,
                  resets: [{ id: createId("reset"), timestamp: nowIso }, ...habit.resets],
                }
              : habit,
          ),
        }));
      },
      addMovementLog(activity: string, duration: number, note?: string, dateKey = todayKey()) {
        setState((current) => ({
          ...current,
          movementLogs: [
            {
              id: createId("movement"),
              date: dateKey,
              activity,
              duration,
              note,
              completed: true,
              createdAt: new Date().toISOString(),
            },
            ...current.movementLogs,
          ],
        }));
      },
      updateMovementLog(logId: string, activity: string, duration: number, note?: string) {
        setState((current) => ({
          ...current,
          movementLogs: current.movementLogs.map((log) =>
            log.id === logId ? { ...log, activity, duration, note } : log,
          ),
        }));
      },
      deleteMovementLog(logId: string) {
        setState((current) => ({
          ...current,
          movementLogs: current.movementLogs.filter((log) => log.id !== logId),
        }));
      },
      addRunningLog(payload: {
        date?: DateKey;
        distance: number;
        unit: RunUnit;
        duration: number;
        pace?: string;
        runType: string;
        notes?: string;
      }) {
        setState((current) => ({
          ...current,
          runningLogs: [
            {
              id: createId("run"),
              date: payload.date ?? todayKey(),
              distance: payload.distance,
              unit: payload.unit,
              duration: payload.duration,
              pace: payload.pace,
              runType: payload.runType,
              notes: payload.notes,
              createdAt: new Date().toISOString(),
            },
            ...current.runningLogs,
          ],
        }));
      },
      updateRunningLog(logId: string, payload: Omit<RunningLog, "id" | "createdAt">) {
        setState((current) => ({
          ...current,
          runningLogs: current.runningLogs.map((log) =>
            log.id === logId ? { ...log, ...payload } : log,
          ),
        }));
      },
      deleteRunningLog(logId: string) {
        setState((current) => ({
          ...current,
          runningLogs: current.runningLogs.filter((log) => log.id !== logId),
        }));
      },
      resetRunningLogs() {
        setState((current) => ({
          ...current,
          runningLogs: [],
        }));
      },
      addRunningPr(label: string, value: string, date: DateKey, note?: string) {
        const trimmedLabel = label.trim();
        const trimmedValue = value.trim();
        if (!trimmedLabel || !trimmedValue) return;
        setState((current) => ({
          ...current,
          runningPrs: [
            {
              id: createId("pr"),
              label: trimmedLabel,
              value: trimmedValue,
              date,
              note,
              createdAt: new Date().toISOString(),
            },
            ...current.runningPrs,
          ],
        }));
      },
      updateRunningPr(prId: string, label: string, value: string, date: DateKey, note?: string) {
        const trimmedLabel = label.trim();
        const trimmedValue = value.trim();
        if (!trimmedLabel || !trimmedValue) return;
        setState((current) => ({
          ...current,
          runningPrs: current.runningPrs.map((entry) =>
            entry.id === prId
              ? { ...entry, label: trimmedLabel, value: trimmedValue, date, note }
              : entry,
          ),
        }));
      },
      deleteRunningPr(prId: string) {
        setState((current) => ({
          ...current,
          runningPrs: current.runningPrs.filter((entry) => entry.id !== prId),
        }));
      },
      addWeightEntry(weight: number, dateKey = todayKey()) {
        setState((current) => ({
          ...current,
          weightLogs: [
            {
              id: createId("weight"),
              date: dateKey,
              weight,
              createdAt: new Date().toISOString(),
            },
            ...current.weightLogs.filter((entry) => entry.date !== dateKey),
          ],
        }));
      },
      updateWeightEntry(entryId: string, weight: number, dateKey?: DateKey) {
        setState((current) => ({
          ...current,
          weightLogs: current.weightLogs.map((entry) =>
            entry.id === entryId
              ? { ...entry, weight, date: dateKey ?? entry.date }
              : entry,
          ),
        }));
      },
      deleteWeightEntry(entryId: string) {
        setState((current) => ({
          ...current,
          weightLogs: current.weightLogs.filter((entry) => entry.id !== entryId),
        }));
      },
      setWeightStart(weight: number) {
        setState((current) => ({
          ...current,
          weightStart: weight,
        }));
      },
      addWaistEntry(inches: number, dateKey = todayKey()) {
        setState((current) => ({
          ...current,
          waistLogs: [
            {
              id: createId("waist"),
              date: dateKey,
              inches,
              createdAt: new Date().toISOString(),
            },
            ...current.waistLogs.filter((entry) => entry.date !== dateKey),
          ],
        }));
      },
      updateWaistEntry(entryId: string, inches: number, dateKey?: DateKey) {
        setState((current) => ({
          ...current,
          waistLogs: current.waistLogs.map((entry) =>
            entry.id === entryId ? { ...entry, inches, date: dateKey ?? entry.date } : entry,
          ),
        }));
      },
      deleteWaistEntry(entryId: string) {
        setState((current) => ({
          ...current,
          waistLogs: current.waistLogs.filter((entry) => entry.id !== entryId),
        }));
      },
      setWaistStart(inches: number) {
        setState((current) => ({
          ...current,
          waistStart: inches,
        }));
      },
      addTask(title: string, dueDate: DateKey, recurrence?: Task["recurrence"]) {
        setState((current) => ({
          ...current,
          tasks: ensureRecurringTasks([
            {
              id: createId("task"),
              title,
              dueDate,
              recurrence,
              recurringTaskId: recurrence ? createRecurringTaskId() : undefined,
              createdAt: new Date().toISOString(),
            },
            ...current.tasks,
          ]),
        }));
      },
      updateTask(
        taskId: string,
        title: string,
        dueDate: DateKey,
        recurrence?: Task["recurrence"],
        scope: "one" | "following" | "all" = "one",
      ) {
        setState((current) => {
          const target = current.tasks.find((task) => task.id === taskId);
          if (!target) return current;

          if (!target.recurringTaskId || scope === "one") {
            const nextTasks = current.tasks.map((task) =>
              task.id === taskId
                ? {
                    ...task,
                    title,
                    dueDate,
                    recurrence: scope === "one" ? undefined : recurrence,
                    recurringTaskId:
                      scope === "one"
                        ? undefined
                        : recurrence
                          ? task.recurringTaskId ?? createRecurringTaskId()
                          : undefined,
                  }
                : task,
            );
            return { ...current, tasks: ensureRecurringTasks(nextTasks) };
          }

          const groupId = target.recurringTaskId;
          const seriesTasks = current.tasks.filter((task) => task.recurringTaskId === groupId);
          const preserved =
            scope === "all"
              ? current.tasks.filter((task) => task.recurringTaskId !== groupId)
              : current.tasks.filter(
                  (task) =>
                    task.recurringTaskId !== groupId ||
                    (task.dueDate < target.dueDate && task.recurringTaskId === groupId),
                );

          const baseTask: Task = {
            id: createId("task"),
            title,
            dueDate,
            recurrence,
            recurringTaskId: recurrence ? groupId : undefined,
            createdAt: new Date().toISOString(),
          };

          const retainedCompleted =
            scope === "all"
              ? []
              : seriesTasks.filter((task) => task.completedAt && task.dueDate < dueDate);

          return {
            ...current,
            tasks: ensureRecurringTasks([baseTask, ...retainedCompleted, ...preserved]),
          };
        });
      },
      deleteTask(taskId: string, scope: "one" | "following" | "all" = "one") {
        setState((current) => {
          const target = current.tasks.find((task) => task.id === taskId);
          if (!target) return current;
          if (!target.recurringTaskId || scope === "one") {
            return {
              ...current,
              tasks: current.tasks.filter((task) => task.id !== taskId),
            };
          }
          if (scope === "all") {
            return {
              ...current,
              tasks: current.tasks.filter((task) => task.recurringTaskId !== target.recurringTaskId),
            };
          }
          return {
            ...current,
            tasks: current.tasks.filter(
              (task) =>
                task.recurringTaskId !== target.recurringTaskId || task.dueDate < target.dueDate,
            ),
          };
        });
      },
      toggleTask(taskId: string) {
        setState((current) => {
          const nextTasks = current.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  completedAt: task.completedAt ? undefined : new Date().toISOString(),
                }
              : task,
          );

          const toggled = nextTasks.find((task) => task.id === taskId);
          if (
            toggled &&
            toggled.completedAt &&
            toggled.recurrence &&
            toggled.recurringTaskId &&
            !nextTasks.some(
              (task) =>
                task.recurringTaskId === toggled.recurringTaskId &&
                !task.completedAt &&
                task.id !== toggled.id,
            )
          ) {
            nextTasks.unshift({
              id: createId("task"),
              title: toggled.title,
              dueDate: getNextDueDate(toggled.dueDate, toggled.recurrence),
              recurrence: toggled.recurrence,
              recurringTaskId: toggled.recurringTaskId,
              createdAt: new Date().toISOString(),
            });
          }

          return {
            ...current,
            tasks: ensureRecurringTasks(nextTasks),
          };
        });
      },
      addGoal(goal: Goal) {
        setState((current) => ({
          ...current,
          goals: [{ ...goal, id: goal.id || createId("goal"), createdAt: goal.createdAt || new Date().toISOString() }, ...current.goals],
        }));
      },
      updateGoal(goalId: string, updates: Partial<Goal>) {
        setState((current) => ({
          ...current,
          goals: current.goals.map((goal) => (goal.id === goalId ? { ...goal, ...updates } as Goal : goal)),
        }));
      },
      deleteGoal(goalId: string) {
        setState((current) => ({
          ...current,
          goals: current.goals.filter((goal) => goal.id !== goalId),
        }));
      },
      importAppState(input: unknown) {
        try {
          const nextState = normalizeState(input);
          setState(nextState);
          return { ok: true };
        } catch {
          return { ok: false, error: "Invalid backup data." };
        }
      },
      addMotto(latin: string, english: string) {
        const trimmedLatin = latin.trim();
        const trimmedEnglish = english.trim();
        if (!trimmedLatin || !trimmedEnglish) return;
        setState((current) => ({
          ...current,
          mottoes: [...current.mottoes, createMotto(trimmedLatin, trimmedEnglish)],
        }));
      },
      updateMotto(mottoId: string, latin: string, english: string) {
        const trimmedLatin = latin.trim();
        const trimmedEnglish = english.trim();
        if (!trimmedLatin || !trimmedEnglish) return;
        setState((current) => ({
          ...current,
          mottoes: current.mottoes.map((motto) =>
            motto.id === mottoId ? { ...motto, latin: trimmedLatin, english: trimmedEnglish } : motto,
          ),
        }));
      },
      deleteMotto(mottoId: string) {
        setState((current) => ({
          ...current,
          mottoes:
            current.mottoes.filter((motto) => motto.id !== mottoId).length > 0
              ? current.mottoes.filter((motto) => motto.id !== mottoId)
              : createDefaultMottoes(),
        }));
      },
      setMottoRotationMode(mode: MottoRotationMode) {
        setState((current) => ({
          ...current,
          mottoRotationMode: mode,
        }));
      },
      resetAllData() {
        const next = createDefaultState();
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(STORAGE_KEY);
        }
        setState(next);
      },
    }),
    [],
  );

  return (
    <StoreContext.Provider value={{ state, hydrated, now, actions }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useAppStore must be used within StoreProvider");
  }
  return context;
}

export function normalizeImportedState(input: unknown) {
  return normalizeState(input);
}

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
import { todayKey } from "@/lib/date";
import { loadState, saveState, STORAGE_KEY } from "@/lib/storage";
import {
  AppState,
  DateKey,
  Habit,
  Language,
  LanguageLog,
  Motto,
  MottoRotationMode,
  MovementLog,
  RunningLog,
  RunningPr,
  RunUnit,
  Task,
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

function createDefaultHabit(name = "Habit maintained"): Habit {
  return {
    id: createId("habit"),
    name,
    createdAt: new Date().toISOString(),
    cleanDays: {
      [todayKey()]: true,
    },
    currentStartAt: new Date().toISOString(),
    resets: [],
  };
}

function createDefaultState(): AppState {
  const language = createDefaultLanguage();
  return {
    mottoes: createDefaultMottoes(),
    mottoRotationMode: "cycle",
    languages: [language],
    selectedLanguageId: language.id,
    languageLogs: [],
    movementLogs: [],
    runningLogs: [],
    runningPrs: [],
    weightLogs: [],
    tasks: [],
    habits: [createDefaultHabit()],
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
  return Array.isArray(raw.movementLogs) ? (raw.movementLogs as MovementLog[]) : [];
}

function normalizeWeightLogs(raw: Record<string, unknown>) {
  return Array.isArray(raw.weightLogs) ? (raw.weightLogs as WeightLog[]) : [];
}

function normalizeTasks(raw: Record<string, unknown>) {
  return Array.isArray(raw.tasks) ? (raw.tasks as Task[]) : [];
}

function normalizeRunningLogs(raw: Record<string, unknown>): RunningLog[] {
  return Array.isArray(raw.runningLogs)
    ? raw.runningLogs.map((log) => {
        const current = log as Partial<RunningLog>;
        return {
          id: current.id ?? createId("run"),
          date: (current.date ?? todayKey()) as DateKey,
          distance: typeof current.distance === "number" ? current.distance : 0,
          unit: current.unit === "km" ? "km" : "mi",
          duration: typeof current.duration === "number" ? current.duration : 0,
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
  const selectedLanguageId =
    typeof raw.selectedLanguageId === "string" &&
    languages.some((language) => language.id === raw.selectedLanguageId)
      ? raw.selectedLanguageId
      : primaryLanguageId;

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

  const habits =
    Array.isArray(raw.habits) && raw.habits.length > 0
      ? (raw.habits as Habit[])
      : raw.habit && typeof raw.habit === "object"
        ? [
            {
              id: createId("habit"),
              name: "Habit maintained",
              createdAt: new Date().toISOString(),
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
    selectedLanguageId,
    languageLogs,
    activeLanguageSession,
    movementLogs: normalizeMovementLogs(raw),
    runningLogs: normalizeRunningLogs(raw),
    runningPrs: normalizeRunningPrs(raw),
    weightStart: typeof raw.weightStart === "number" ? raw.weightStart : undefined,
    weightLogs: normalizeWeightLogs(raw),
    tasks: normalizeTasks(raw),
    habits,
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
    addHabit: (name: string) => void;
    updateHabit: (habitId: string, name: string) => void;
    deleteHabit: (habitId: string) => void;
    toggleHabitDay: (habitId: string, dateKey: DateKey, value: boolean) => void;
    resetHabit: (habitId: string) => void;
    addMovementLog: (duration: number, note?: string, dateKey?: DateKey) => void;
    updateMovementLog: (logId: string, duration: number, note?: string) => void;
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
    addTask: (title: string, dueDate: DateKey) => void;
    updateTask: (taskId: string, title: string, dueDate: DateKey) => void;
    deleteTask: (taskId: string) => void;
    toggleTask: (taskId: string) => void;
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
      addHabit(name: string) {
        const trimmed = name.trim();
        if (!trimmed) return;
        setState((current) => ({
          ...current,
          habits: [...current.habits, createDefaultHabit(trimmed)],
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
      addMovementLog(duration: number, note?: string, dateKey = todayKey()) {
        setState((current) => ({
          ...current,
          movementLogs: [
            {
              id: createId("movement"),
              date: dateKey,
              duration,
              note,
              completed: true,
              createdAt: new Date().toISOString(),
            },
            ...current.movementLogs,
          ],
        }));
      },
      updateMovementLog(logId: string, duration: number, note?: string) {
        setState((current) => ({
          ...current,
          movementLogs: current.movementLogs.map((log) =>
            log.id === logId ? { ...log, duration, note } : log,
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
      addTask(title: string, dueDate: DateKey) {
        setState((current) => ({
          ...current,
          tasks: [
            {
              id: createId("task"),
              title,
              dueDate,
              createdAt: new Date().toISOString(),
            },
            ...current.tasks,
          ],
        }));
      },
      updateTask(taskId: string, title: string, dueDate: DateKey) {
        setState((current) => ({
          ...current,
          tasks: current.tasks.map((task) =>
            task.id === taskId ? { ...task, title, dueDate } : task,
          ),
        }));
      },
      deleteTask(taskId: string) {
        setState((current) => ({
          ...current,
          tasks: current.tasks.filter((task) => task.id !== taskId),
        }));
      },
      toggleTask(taskId: string) {
        setState((current) => ({
          ...current,
          tasks: current.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  completedAt: task.completedAt ? undefined : new Date().toISOString(),
                }
              : task,
          ),
        }));
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

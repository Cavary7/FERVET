import { DAILY_MINIMUMS } from "@/lib/constants";
import {
  addDaysToKey,
  daysBetween,
  eachDayOfInterval,
  formatDurationSeconds,
  formatDateLabel,
  fromDateKey,
  getWeekStart,
  startOfDay,
  toDateKey,
  todayKey,
} from "@/lib/date";
import { AppState, DateKey, Habit, Motto, Task } from "@/lib/types";

function hashDateKey(dateKey: DateKey) {
  return dateKey.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

export function getMottoForDate(state: AppState, dateKey: DateKey): Motto {
  const source = state.mottoes.length > 0 ? state.mottoes : [];
  if (source.length === 0) {
    return {
      id: "fallback",
      latin: "Acta non verba",
      english: "Deeds, not words",
    };
  }

  if (state.mottoRotationMode === "random") {
    return source[hashDateKey(dateKey) % source.length];
  }

  const base = new Date(2026, 0, 1);
  const index =
    ((daysBetween(base, fromDateKey(dateKey)) % source.length) + source.length) % source.length;
  return source[index];
}

export function getLanguageMinutesForDay(state: AppState, dateKey: DateKey, languageId?: string) {
  return state.languageLogs
    .filter((log) => log.date === dateKey && (!languageId || log.languageId === languageId))
    .reduce((sum, log) => sum + log.minutes, 0);
}

export function getSubjectMinutesForDay(state: AppState, dateKey: DateKey, subjectId?: string) {
  return state.subjectLogs
    .filter((log) => log.date === dateKey && (!subjectId || log.subjectId === subjectId))
    .reduce((sum, log) => sum + log.minutes, 0);
}

export function getMovementForDay(state: AppState, dateKey: DateKey) {
  return state.movementLogs.filter((log) => log.date === dateKey && log.completed);
}

export function getRunsForDay(state: AppState, dateKey: DateKey) {
  return state.runningLogs.filter((log) => log.date === dateKey);
}

export function getCompletedTasksForDay(tasks: Task[], dateKey: DateKey) {
  return tasks.filter(
    (task) => task.completedAt && toDateKey(new Date(task.completedAt)) === dateKey,
  );
}

export function isHabitCleanForDay(habit: Habit, dateKey: DateKey) {
  if (dateKey < (habit.trackingStartedAt.slice(0, 10) as DateKey)) {
    return null;
  }
  const resetOnDate = habit.resets.some((reset) => reset.timestamp.slice(0, 10) === dateKey);
  if (resetOnDate) {
    return false;
  }
  if (dateKey >= (habit.currentStartAt.slice(0, 10) as DateKey)) {
    return habit.cleanDays[dateKey] ?? true;
  }
  return false;
}

export function getHabitStreak(habit: Habit) {
  const start = startOfDay(new Date(habit.currentStartAt));
  const today = startOfDay(new Date());
  return daysBetween(start, today) + (isHabitCleanForDay(habit, todayKey()) ? 1 : 0);
}

export function getDailyHabitStatus(state: AppState, dateKey: DateKey) {
  const statuses = state.habits.map((habit) => ({
    habitId: habit.id,
    name: habit.name,
    clean: isHabitCleanForDay(habit, dateKey),
    streak: getHabitStreak(habit),
  }));

  return {
    statuses,
    complete: statuses.length > 0 && statuses.every((habit) => habit.clean === true),
  };
}

export function getDayCompletion(state: AppState, dateKey: DateKey) {
  const languageMinutes = getLanguageMinutesForDay(state, dateKey);
  const movementDone = getMovementForDay(state, dateKey).length > 0;
  const tasksDone = getCompletedTasksForDay(state.tasks, dateKey).length > 0;
  const habit = getDailyHabitStatus(state, dateKey);

  return {
    languageMinutes,
    movementDone,
    tasksDone,
    habit,
    complete:
      languageMinutes >= DAILY_MINIMUMS.languageMinutes &&
      movementDone &&
      tasksDone &&
      habit.complete,
  };
}

export function getOverallStreak(state: AppState) {
  let streak = 0;
  let cursor = todayKey();

  while (getDayCompletion(state, cursor).complete) {
    streak += 1;
    cursor = addDaysToKey(cursor, -1);
  }

  return streak;
}

export function getWeekRange() {
  const start = getWeekStart();
  const end = new Date();
  return { start, end };
}

export function getWeeklyLanguageMinutes(state: AppState, languageId?: string) {
  const { start, end } = getWeekRange();
  const days = new Set(eachDayOfInterval(start, end).map(toDateKey));
  return state.languageLogs
    .filter((log) => days.has(log.date) && (!languageId || log.languageId === languageId))
    .reduce((sum, log) => sum + log.minutes, 0);
}

export function getLanguageSummaries(state: AppState) {
  const today = todayKey();
  return state.languages.map((language) => ({
    ...language,
    todayMinutes: getLanguageMinutesForDay(state, today, language.id),
    weekMinutes: getWeeklyLanguageMinutes(state, language.id),
  }));
}

export function getSubjectSummaries(state: AppState) {
  const today = todayKey();
  const { start, end } = getWeekRange();
  const days = new Set(eachDayOfInterval(start, end).map(toDateKey));
  return state.subjects.map((subject) => ({
    ...subject,
    todayMinutes: getSubjectMinutesForDay(state, today, subject.id),
    weekMinutes: state.subjectLogs
      .filter((log) => log.subjectId === subject.id && days.has(log.date))
      .reduce((sum, log) => sum + log.minutes, 0),
  }));
}

export function getWeeklyMovementCount(state: AppState) {
  const { start, end } = getWeekRange();
  const days = new Set(eachDayOfInterval(start, end).map(toDateKey));
  return state.movementLogs.filter((log) => log.completed && days.has(log.date)).length;
}

export function getWeeklyTaskCount(state: AppState) {
  const { start, end } = getWeekRange();
  const startMs = start.getTime();
  const endMs = end.getTime();
  return state.tasks.filter((task) => {
    if (!task.completedAt) return false;
    const completedAt = new Date(task.completedAt).getTime();
    return completedAt >= startMs && completedAt <= endMs;
  }).length;
}

export function getTasksForDate(state: AppState, dateKey: DateKey) {
  return state.tasks.filter((task) => task.dueDate === dateKey);
}

export function getWeightSummary(state: AppState) {
  const sorted = [...state.weightLogs].sort((a, b) => a.date.localeCompare(b.date));
  const current = sorted.at(-1)?.weight;
  const start = state.weightStart;
  const delta = start !== undefined && current !== undefined ? current - start : undefined;

  return {
    current,
    start,
    delta,
    lost: delta !== undefined && delta < 0 ? Math.abs(delta) : 0,
    gained: delta !== undefined && delta > 0 ? delta : 0,
    chartData: sorted.map((entry) => ({
      date: formatDateLabel(fromDateKey(entry.date)),
      weight: entry.weight,
    })),
  };
}

export function getWaistSummary(state: AppState) {
  const sorted = [...state.waistLogs].sort((a, b) => a.date.localeCompare(b.date));
  const current = sorted.at(-1)?.inches;
  const start = state.waistStart;
  const delta = start !== undefined && current !== undefined ? current - start : undefined;

  return {
    current,
    start,
    delta,
    chartData: sorted.map((entry) => ({
      date: formatDateLabel(fromDateKey(entry.date)),
      inches: entry.inches,
    })),
  };
}

function convertDistanceToMiles(distance: number, unit: "mi" | "km") {
  return unit === "km" ? distance * 0.621371 : distance;
}

function convertDistance(distance: number, from: "mi" | "km", to: "mi" | "km") {
  if (from === to) return distance;
  return to === "mi" ? convertDistanceToMiles(distance, from) : distance / 0.621371;
}

function getPreferredRunUnit(state: AppState): "mi" | "km" {
  const totals = state.runningLogs.reduce(
    (acc, run) => {
      acc[run.unit] += 1;
      return acc;
    },
    { mi: 0, km: 0 },
  );
  return totals.km > totals.mi ? "km" : "mi";
}

function formatRunDate(dateKey: DateKey) {
  return fromDateKey(dateKey).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function getWeeklyRunningSummary(state: AppState) {
  const { start, end } = getWeekRange();
  const days = new Set(eachDayOfInterval(start, end).map(toDateKey));
  const runs = state.runningLogs.filter((run) => days.has(run.date));
  const totalMiles = runs.reduce((sum, run) => sum + convertDistanceToMiles(run.distance, run.unit), 0);
  const longestMiles = runs.reduce(
    (max, run) => Math.max(max, convertDistanceToMiles(run.distance, run.unit)),
    0,
  );
  const totalDuration = runs.reduce((sum, run) => sum + run.duration, 0);
  const averagePace =
    totalMiles > 0 && totalDuration > 0
      ? `${formatDurationSeconds(Math.round(totalDuration / totalMiles))}/mi`
      : undefined;

  return {
    runs,
    totalDistanceMiles: totalMiles,
    runCount: runs.length,
    longestRunMiles: longestMiles,
    averagePace,
  };
}

export function getRunningPerformanceSummary(state: AppState) {
  const preferredUnit = getPreferredRunUnit(state);
  const allRuns = [...state.runningLogs].sort((a, b) => a.date.localeCompare(b.date));
  const last30Boundary = addDaysToKey(todayKey(), -29);

  const weeklyBuckets = new Map<string, number>();
  allRuns.forEach((run) => {
    const date = fromDateKey(run.date);
    const weekStart = toDateKey(getWeekStart(date));
    const milesOrKm = convertDistance(run.distance, run.unit, preferredUnit);
    weeklyBuckets.set(weekStart, (weeklyBuckets.get(weekStart) ?? 0) + milesOrKm);
  });

  const weeklyMileage = Array.from(weeklyBuckets.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-8)
    .map(([weekStart, total]) => ({
      week: formatRunDate(weekStart as DateKey),
      total: Number(total.toFixed(1)),
    }));

  const longestEver = allRuns.reduce<(typeof allRuns)[number] | undefined>((best, run) => {
    if (!best) return run;
    return convertDistance(run.distance, run.unit, preferredUnit) >
      convertDistance(best.distance, best.unit, preferredUnit)
      ? run
      : best;
  }, undefined);

  const longestLast30 = allRuns
    .filter((run) => run.date >= last30Boundary)
    .reduce<(typeof allRuns)[number] | undefined>((best, run) => {
      if (!best) return run;
      return convertDistance(run.distance, run.unit, preferredUnit) >
        convertDistance(best.distance, best.unit, preferredUnit)
        ? run
        : best;
    }, undefined);

  const runDays = Array.from(new Set(allRuns.map((run) => run.date))).sort();
  let currentStreak = 0;
  let cursor = todayKey();
  while (runDays.includes(cursor)) {
    currentStreak += 1;
    cursor = addDaysToKey(cursor, -1);
  }

  let bestStreak = 0;
  let active = 0;
  let previous: DateKey | null = null;
  runDays.forEach((dateKey) => {
    if (!previous) {
      active = 1;
    } else if (addDaysToKey(previous, 1) === dateKey) {
      active += 1;
    } else {
      active = 1;
    }
    bestStreak = Math.max(bestStreak, active);
    previous = dateKey;
  });

  return {
    preferredUnit,
    weeklyMileage,
    currentStreak,
    bestStreak,
    longestEver: longestEver
      ? {
          distance: Number(convertDistance(longestEver.distance, longestEver.unit, preferredUnit).toFixed(1)),
          date: longestEver.date,
        }
      : undefined,
    longestLast30: longestLast30
      ? {
          distance: Number(convertDistance(longestLast30.distance, longestLast30.unit, preferredUnit).toFixed(1)),
          date: longestLast30.date,
        }
      : undefined,
  };
}

export function getAutoDetectedRunningBests(state: AppState) {
  const preferredUnit = getRunningPerformanceSummary(state).preferredUnit;
  const runs = [...state.runningLogs];
  const byFastest = [...runs]
    .filter((run) => run.distance > 0)
    .sort((a, b) => a.duration / a.distance - b.duration / b.distance);

  const exactDistance = (targetKm: number) =>
    runs
      .filter((run) => {
        const km = run.unit === "km" ? run.distance : run.distance / 0.621371;
        return Math.abs(km - targetKm) < 0.08;
      })
      .sort((a, b) => a.duration - b.duration)[0];

  const bestMile = runs
    .filter((run) => {
      const miles = run.unit === "mi" ? run.distance : run.distance * 0.621371;
      return miles >= 1;
    })
    .sort((a, b) => a.duration / a.distance - b.duration / b.distance)[0];

  return {
    preferredUnit,
    longestRun: getRunningPerformanceSummary(state).longestEver,
    fastestAveragePace: byFastest[0],
    bestMile,
    best5k: exactDistance(5),
    best10k: exactDistance(10),
  };
}

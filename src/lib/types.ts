export type DateKey = `${number}-${number}-${number}`;

export type Motto = {
  id: string;
  latin: string;
  english: string;
};

export type MottoRotationMode = "cycle" | "random";

export type LanguageLog = {
  id: string;
  languageId: string;
  date: DateKey;
  minutes: number;
  note?: string;
  createdAt: string;
  source: "manual" | "timer";
};

export type Language = {
  id: string;
  name: string;
  createdAt: string;
};

export type Subject = {
  id: string;
  name: string;
  createdAt: string;
};

export type SubjectLog = {
  id: string;
  subjectId: string;
  date: DateKey;
  minutes: number;
  note?: string;
  createdAt: string;
  source: "manual" | "timer";
};

export type MovementLog = {
  id: string;
  date: DateKey;
  activity: string;
  duration: number;
  note?: string;
  completed: boolean;
  createdAt: string;
};

export type RunUnit = "mi" | "km";

export type RunningLog = {
  id: string;
  date: DateKey;
  distance: number;
  unit: RunUnit;
  duration: number;
  pace?: string;
  runType: string;
  notes?: string;
  createdAt: string;
};

export type RunningPr = {
  id: string;
  label: string;
  value: string;
  date: DateKey;
  note?: string;
  createdAt: string;
};

export type WeightLog = {
  id: string;
  date: DateKey;
  weight: number;
  createdAt: string;
};

export type WaistLog = {
  id: string;
  date: DateKey;
  inches: number;
  createdAt: string;
};

export type Task = {
  id: string;
  title: string;
  dueDate: DateKey;
  createdAt: string;
  completedAt?: string;
  recurrence?: "daily" | "weekly" | "monthly";
  recurringTaskId?: string;
};

export type HabitReset = {
  id: string;
  timestamp: string;
};

export type Habit = {
  id: string;
  name: string;
  createdAt: string;
  trackingStartedAt: string;
  cleanDays: Record<DateKey, boolean>;
  currentStartAt: string;
  resets: HabitReset[];
};

export type AppState = {
  mottoes: Motto[];
  mottoRotationMode: MottoRotationMode;
  languages: Language[];
  subjects: Subject[];
  selectedLanguageId?: string;
  selectedSubjectId?: string;
  languageLogs: LanguageLog[];
  subjectLogs: SubjectLog[];
  activeLanguageSession?: {
    languageId: string;
    startedAt: string;
  };
  activeSubjectSession?: {
    subjectId: string;
    startedAt: string;
  };
  movementLogs: MovementLog[];
  runningDurationVersion: 2;
  runningLogs: RunningLog[];
  runningPrs: RunningPr[];
  weightStart?: number;
  weightLogs: WeightLog[];
  waistStart?: number;
  waistLogs: WaistLog[];
  tasks: Task[];
  habits: Habit[];
};

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

export type MovementLog = {
  id: string;
  date: DateKey;
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

export type Task = {
  id: string;
  title: string;
  dueDate: DateKey;
  createdAt: string;
  completedAt?: string;
};

export type HabitReset = {
  id: string;
  timestamp: string;
};

export type Habit = {
  id: string;
  name: string;
  createdAt: string;
  cleanDays: Record<DateKey, boolean>;
  currentStartAt: string;
  resets: HabitReset[];
};

export type AppState = {
  mottoes: Motto[];
  mottoRotationMode: MottoRotationMode;
  languages: Language[];
  selectedLanguageId?: string;
  languageLogs: LanguageLog[];
  activeLanguageSession?: {
    languageId: string;
    startedAt: string;
  };
  movementLogs: MovementLog[];
  runningLogs: RunningLog[];
  runningPrs: RunningPr[];
  weightStart?: number;
  weightLogs: WeightLog[];
  tasks: Task[];
  habits: Habit[];
};

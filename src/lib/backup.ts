import { AppState } from "@/lib/types";

export const BACKUP_APP_NAME = "Fervet";
export const BACKUP_VERSION = 1;

export type AppBackup = {
  app: typeof BACKUP_APP_NAME;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  data: AppState;
};

export function createBackupPayload(state: AppState): AppBackup {
  return {
    app: BACKUP_APP_NAME,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: state,
  };
}

export function isValidBackupPayload(input: unknown): input is AppBackup {
  if (!input || typeof input !== "object") return false;
  const current = input as Partial<AppBackup>;
  return (
    current.app === BACKUP_APP_NAME &&
    typeof current.version === "number" &&
    typeof current.exportedAt === "string" &&
    Boolean(current.data && typeof current.data === "object")
  );
}

export type Role = "PATIENT" | "DOCTOR" | "ADMIN";

export interface User {
  id?: number;
  telegramId: string;
  username?: string | null;
  firstName?: string | null;
  phoneNumber?: string | null;
  lastName?: string | null;
  photoUrl?: string | null;
  role: Role;
  createdAt: Date;
}

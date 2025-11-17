export type Role = "PATIENT" | "DOCTOR" | "ADMIN";

export interface User {
  id?: number;
  telegramId: string;
  username?: string;
  firstName?: string;
  phoneNumber?: string;
  lastName?: string;
  photoUrl?: string;
  role: Role;
  createdAt: Date;
}

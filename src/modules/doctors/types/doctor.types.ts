export interface DoctorInput {
  userId: number;
  specialization: string;
  qualification: string;
  experience: number;
  description: string;
  education: string;
  certificates: string[];
  consultationFee: number;
  languages: string[];
  approbationUrl?: string;
  country: string;
}

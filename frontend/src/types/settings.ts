export interface UserProfile {
  id: number;
  email: string;
  full_name: string | null;
  role: "patient" | "provider" | "admin";
  avatar: string | null;
  created_at?: string | null;
}

export interface NotificationSettings {
  riskAlerts?: boolean;
  weeklyDigest?: boolean;
  predictionReady?: boolean;
  providerMessages?: boolean;
  newPatientAdded?: boolean;
  modelUpdates?: boolean;
  systemAlerts?: boolean;
  marketingEmails?: boolean;
}

export interface NotificationsResponse {
  settings: NotificationSettings;
  updated_at: string | null;
}

export interface DatasetInfo {
  exists: boolean;
  filename: string;
  columns?: string[];
  rows?: number;
  updated_at?: string;
}
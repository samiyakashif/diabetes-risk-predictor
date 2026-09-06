import { Sidebar } from "@/components/dashboard/Sidebar";
import { AuthGuard } from "@/components/dashboard/AuthGuard";
import { PredictionProvider } from "@/components/prediction/PredictionProvider";

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <PredictionProvider>
        <div className="flex min-h-screen bg-background">
          <Sidebar role="patient" />
          <main className="flex-1 overflow-auto ml-64 p-8">{children}</main>
        </div>
      </PredictionProvider>
    </AuthGuard>
  );
}
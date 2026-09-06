import { Sidebar } from "@/components/dashboard/Sidebar";

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="patient" />
      <main className="flex-1 overflow-auto ml-64 p-8">
        {children}
      </main>
    </div>
  );
}
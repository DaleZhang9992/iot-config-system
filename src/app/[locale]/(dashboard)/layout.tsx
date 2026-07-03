import SessionProvider from "@/components/session-provider";
import Sidebar from "@/components/layout/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-8 bg-gray-50/50 dark:bg-gray-950">
          {children}
        </main>
      </div>
    </SessionProvider>
  );
}

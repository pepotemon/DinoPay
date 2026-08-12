import { AdminSidebar, AdminTopBar } from "@/components/admin/admin-sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar — flex sibling, hidden on mobile */}
      <AdminSidebar />

      {/* Right column: mobile top bar + page content */}
      <div className="flex flex-1 flex-col min-w-0">
        <AdminTopBar />
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

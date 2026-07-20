import { requireUser } from "@/lib/auth/session";
import { Sidebar } from "@/components/Sidebar";

export default async function AppLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  const session = await requireUser();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar session={session} />
      <main className="flex-1 min-h-0 overflow-y-auto px-8 py-6">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
      {modal}
    </div>
  );
}

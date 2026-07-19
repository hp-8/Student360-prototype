import { requireUser } from "@/lib/auth/session";
import { AppHeader } from "@/components/AppHeader";

export default async function AppLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  const session = await requireUser();

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <AppHeader session={session} />
      <main className="flex-1 min-h-0 max-w-6xl w-full mx-auto px-4 py-5 overflow-y-auto">
        {children}
      </main>
      {modal}
    </div>
  );
}

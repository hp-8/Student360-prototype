import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { NewEnquiryForm } from "./NewEnquiryForm";

export default async function NewEnquiryPage() {
  await requireRole("FRONT_DESK", "MANAGER");
  const branches = await prisma.branch.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <PageHeader
        title="New enquiry"
        description="Duplicate checks run automatically on name, phone and email before a new record is created."
      />
      <NewEnquiryForm branches={branches} />
    </div>
  );
}

import { StudentDetailContent } from "./StudentDetailContent";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StudentDetailContent id={id} />;
}

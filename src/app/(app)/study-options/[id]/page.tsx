import { StudyOptionDetailContent } from "./StudyOptionDetailContent";

export default async function StudyOptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StudyOptionDetailContent id={id} />;
}

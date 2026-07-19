import { VisaCaseDetailContent } from "./VisaCaseDetailContent";

export default async function VisaCaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <VisaCaseDetailContent id={id} />;
}

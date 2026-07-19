import { SlideOverModal } from "@/components/SlideOverModal";
import { VisaCaseDetailContent } from "../../../visa/[id]/VisaCaseDetailContent";

export default async function VisaCaseModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <SlideOverModal>
      <VisaCaseDetailContent id={id} />
    </SlideOverModal>
  );
}

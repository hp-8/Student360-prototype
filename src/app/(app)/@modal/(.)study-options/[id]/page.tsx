import { SlideOverModal } from "@/components/SlideOverModal";
import { StudyOptionDetailContent } from "../../../study-options/[id]/StudyOptionDetailContent";

export default async function StudyOptionModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <SlideOverModal>
      <StudyOptionDetailContent id={id} />
    </SlideOverModal>
  );
}

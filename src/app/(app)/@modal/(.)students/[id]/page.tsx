import { SlideOverModal } from "@/components/SlideOverModal";
import { StudentDetailContent } from "../../../students/[id]/StudentDetailContent";

export default async function StudentModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <SlideOverModal>
      <StudentDetailContent id={id} />
    </SlideOverModal>
  );
}

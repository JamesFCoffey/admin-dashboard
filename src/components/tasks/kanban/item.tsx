import { DragOverlay, useDraggable, UseDraggableArguments } from '@dnd-kit/core';

interface Props {
  id: string;
  data?: UseDraggableArguments['data'];
}

const KanbanItem = ({ children, id, data }: React.PropsWithChildren<Props>) => {
  const draggableId = String(id);
  const { attributes, listeners, setNodeRef, active } = useDraggable({
    id: draggableId,
    data,
  });
  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        style={{
          opacity: active ? (active.id === draggableId ? 1 : 0.5) : 1,
          borderRadius: '8px',
          position: 'relative',
          cursor: 'grab',
        }}
      >
        {active?.id === draggableId && (
          <DragOverlay zIndex={1000}>
            <div
              style={{
                borderRadius: '8px',
                boxShadow: 'rgba(149, 157, 165, 0.2) 0px 8px 24px',
                cursor: 'grabbing',
              }}
            >
              {children}
            </div>
          </DragOverlay>
        )}
        {children}
      </div>
    </div>
  );
};

export default KanbanItem;

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Pin, GripHorizontal } from 'lucide-react';
import { Header } from '@tanstack/react-table';
import { StudentData } from '../../types';

interface SortableHeaderProps {
  header: Header<StudentData, unknown>;
  children: React.ReactNode;
}

export const SortableHeader: React.FC<SortableHeaderProps> = ({ header, children }) => {
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({
    id: header.column.id,
  });

  const isPinned = header.column.getIsPinned();

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 50 : (isPinned ? 35 : 1),
    position: (isPinned ? 'sticky' : 'relative') as any,
    backgroundColor: isDragging ? '#f1f5f9' : undefined,
    width: header.column.getSize(),
    left: isPinned ? 0 : undefined,
  };

  return (
    <th
      ref={setNodeRef}
      style={style}
      className={`px-5 py-4 border-b border-r border-slate-200 bg-slate-50 select-none text-xs uppercase tracking-wider text-slate-500 font-bold group transition-all ${isPinned ? 'sticky z-35 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] mb-[-1px]' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={header.column.getToggleSortingHandler()}>
          <span className="font-bold tracking-wider text-slate-600">{children}</span>
          {{
            asc: <span className="text-primary font-bold ml-1">↑</span>,
            desc: <span className="text-primary font-bold ml-1">↓</span>,
          }[String(header.column.getIsSorted())] ?? null}
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              header.column.pin(isPinned ? false : 'left');
            }} 
            className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 transition cursor-pointer"
            title={isPinned ? "Unpin Column" : "Pin Column Left"}
          >
            <Pin size={11} className={isPinned ? "fill-primary text-primary" : ""} />
          </button>
          <button 
            type="button"
            {...attributes} 
            {...listeners} 
            className="p-1 hover:bg-slate-200 rounded cursor-grab text-slate-400 hover:text-slate-700 transition"
            title="Drag column to reorder"
          >
            <GripHorizontal size={13} />
          </button>
        </div>
      </div>
    </th>
  );
};

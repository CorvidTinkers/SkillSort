import { useState, useMemo } from 'react';
import { StudentData, Confidence } from '../../types';
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  VisibilityState,
  flexRender,
} from '@tanstack/react-table';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { AlertCircle } from 'lucide-react';

import { ExtractedCell } from './ExtractedCell';
import { SortableHeader } from './SortableHeader';
import { GridToolbar } from './GridToolbar';
import { ActionControls } from './ActionControls';
import { RecalculatingOverlay } from './RecalculatingOverlay';
import { ExportModal } from './ExportModal';

interface ReviewGridProps {
  students: StudentData[];
  onStudentsChange: (updated: StudentData[]) => void;
  onSelectCell: (studentId: string, field: keyof StudentData) => void;
  activeStudentId: string | null;
  activeField: keyof StudentData | null;
  hasJobDescription?: boolean;
  checklistItems?: string[];
  isExtracting?: boolean;
}

const getConfidenceBg = (confidence: string, isActive: boolean) => {
  if (isActive) return '';
  return 'hover:bg-slate-50/80';
};

export function ReviewGrid({ 
  students, 
  onStudentsChange, 
  onSelectCell, 
  activeStudentId, 
  activeField, 
  hasJobDescription = false, 
  checklistItems = [], 
  isExtracting = false 
}: ReviewGridProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnPinning, setColumnPinning] = useState({
    left: ['name'],
  });
  
  // Floating custom placement baseline weights
  const [skillWeight, setSkillWeight] = useState(70);
  const [expWeight, setExpWeight] = useState(60);
  const [domainWeight, setDomainWeight] = useState(50);

  // Recalculating ATS interactive states
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [recalculationProgress, setRecalculationProgress] = useState(0);
  const [recalculateSubtext, setRecalculateSubtext] = useState('');

  // Shortlist Export Modal states
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Dynamic feedback notices
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const columns = useMemo<ColumnDef<StudentData>[]>(() => [
    {
      id: 'name',
      accessorFn: row => row.name.value,
      header: 'Candidate',
      size: 200,
      cell: ({ row }) => (
        <div className="flex flex-col py-0.5">
          <span className="font-bold text-slate-800 tracking-tight group-hover:text-slate-950 transition-colors text-[14px]">
            {String(row.original.name.value)}
          </span>
          <span className="text-[11px] text-primary font-semibold hover:text-primary-container transition-colors select-none cursor-pointer flex items-center gap-1 mt-0.5">
            View Resume PDF
          </span>
        </div>
      ),
      enablePinning: true,
    },
    {
      id: 'domain',
      accessorKey: 'domain',
      header: 'Domain Focus',
      size: 160,
      cell: ({ row }) => <ExtractedCell field={row.original.domain} />,
    },
    {
      id: 'skills',
      accessorKey: 'skills',
      header: 'Extracted Skills',
      size: 240,
      cell: ({ row }) => <ExtractedCell field={row.original.skills} />,
    },
    {
      id: 'experience',
      accessorKey: 'experience',
      header: 'Experience Summary',
      size: 260,
      cell: ({ row }) => <ExtractedCell field={row.original.experience} />,
    },
    {
      id: 'role',
      accessorKey: 'role',
      header: 'Recommended Job',
      size: 180,
      cell: ({ row }) => <ExtractedCell field={row.original.role} />,
    },
    {
      id: 'atsScore',
      accessorKey: 'atsScore',
      header: 'ATS Matching',
      size: 140,
      cell: ({ row }) => {
        const val = row.original.atsScore;
        const score = val.value;
        
        if (Number.isNaN(score)) {
          return (
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 py-0.5 select-none whitespace-normal opacity-50 grayscale">
              <span className="px-2.5 py-1 rounded-md font-mono font-bold text-xs tracking-tight border bg-slate-100 text-slate-500 border-slate-200/60">
                NaN
              </span>
            </div>
          );
        }

        let pillStyles = '';
        let dotColor = '';
        let label = '';
        
        if (score >= 80) {
          pillStyles = 'bg-emerald-50 text-emerald-800 border-emerald-200/60';
          dotColor = 'bg-emerald-500';
          label = 'Outstanding';
        } else if (score >= 70) {
          pillStyles = 'bg-primary/5 text-primary border-primary/20';
          dotColor = 'bg-primary';
          label = 'Strong Match';
        } else if (score >= 60) {
          pillStyles = 'bg-amber-50 text-amber-800 border-amber-200/60';
          dotColor = 'bg-amber-500';
          label = 'Good Match';
        } else {
          pillStyles = 'bg-rose-50 text-rose-800 border-rose-200/60';
          dotColor = 'bg-rose-500';
          label = 'Needs Review';
        }

        return (
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 py-0.5 select-none whitespace-normal">
            <span className={`px-2.5 py-1 rounded-md font-mono font-bold text-xs tracking-tight border ${pillStyles}`}>
              {score}%
            </span>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className={`h-2 w-2 rounded-full ${dotColor}`} />
              <span className="text-xs font-semibold text-slate-700 tracking-tight">{label}</span>
            </div>
          </div>
        );
      },
      sortingFn: (a, b) => {
        const valA = a.original.atsScore.value;
        const valB = b.original.atsScore.value;
        if (Number.isNaN(valA) && Number.isNaN(valB)) return 0;
        if (Number.isNaN(valA)) return -1;
        if (Number.isNaN(valB)) return 1;
        return valA - valB;
      },
    },
    {
      id: 'githubInfo',
      accessorKey: 'githubInfo',
      header: 'Dev Verified Metrics',
      size: 200,
      cell: ({ row }) => <ExtractedCell field={row.original.githubInfo} />,
    },
  ], []);

  const [columnOrder, setColumnOrder] = useState<string[]>(columns.map(c => String(c.id)));

  const table = useReactTable({
    data: students,
    columns,
    state: {
      sorting,
      columnVisibility,
      columnOrder,
      columnPinning,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onColumnPinningChange: setColumnPinning,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const getCellClass = (studentId: string, fieldKey: keyof StudentData, isPinned: boolean) => {
    const isActive = activeStudentId === studentId && activeField === fieldKey;
    
    if (isActive) {
      if (isPinned) {
        return 'px-5 py-4 text-sm cursor-pointer border-b border-r border-slate-200 transition-all bg-primary/5 ring-inset ring-2 ring-primary z-20 sticky left-0 font-semibold shadow-inner';
      }
      return 'px-5 py-4 text-sm cursor-pointer border-b border-r border-slate-200 transition-all bg-primary/5 ring-inset ring-2 ring-primary z-10 relative font-medium shadow-inner';
    }

    if (isPinned) {
      return 'px-5 py-4 text-sm cursor-pointer border-b border-r border-slate-200 transition-colors bg-slate-50 group-hover:bg-slate-100 text-slate-900 font-semibold sticky left-0 z-20';
    }

    const student = students.find(s => s.id === studentId);
    if (!student) {
      return 'px-5 py-4 text-sm cursor-pointer border-b border-r border-slate-200 transition-colors hover:bg-slate-50 text-slate-800';
    }

    const valueObj = student[fieldKey];
    if (valueObj && typeof valueObj === 'object' && 'confidence' in valueObj) {
      const confidence = String(valueObj.confidence);
      return `px-5 py-4 text-sm cursor-pointer border-b border-r border-slate-200 transition-colors ${getConfidenceBg(confidence, isActive)}`;
    }

    return 'px-5 py-4 text-sm cursor-pointer border-b border-r border-slate-200 transition-colors hover:bg-slate-50 text-slate-800';
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setColumnOrder((order) => {
        const oldIndex = order.indexOf(String(active.id));
        const newIndex = order.indexOf(String(over.id));
        return arrayMove(order, oldIndex, newIndex);
      });
    }
  };

  const recalculateScores = () => {
    setIsRecalculating(true);
    setRecalculationProgress(0);
    setRecalculateSubtext('Re-indexing raw candidate resumes...');
    
    setTimeout(() => {
      setRecalculateSubtext('Scrutinizing skills vector density and keyword margins...');
      setRecalculationProgress(25);
    }, 450);

    setTimeout(() => {
      setRecalculateSubtext('Synthesizing roles metrics and professional layers...');
      setRecalculationProgress(55);
    }, 900);

    setTimeout(() => {
      setRecalculateSubtext('Recalibrating specialized job compatibility values...');
      setRecalculationProgress(80);
    }, 1350);

    setTimeout(() => {
      const recalculated = students.map(student => {
        let skillMultiplier = student.skills.confidence === 'high' ? 1.0 : student.skills.confidence === 'medium' ? 0.8 : 0.6;
        let expMultiplier = student.experience.confidence === 'high' ? 1.0 : student.experience.confidence === 'medium' ? 0.75 : 0.5;
        let domainMultiplier = student.domain.confidence === 'high' ? 1.0 : student.domain.confidence === 'medium' ? 0.8 : 0.65;
        
        const baseScore = Math.round(
          ((skillMultiplier * skillWeight) + (expMultiplier * expWeight) + (domainMultiplier * domainWeight)) / 
          (skillWeight + expWeight + domainWeight) * 100
        );

        const finalScore = Math.min(100, Math.max(40, baseScore + Math.floor(Math.random() * 8) - 4));
        
        return {
          ...student,
          atsScore: {
            value: finalScore,
            confidence: finalScore >= 85 ? 'high' : finalScore >= 70 ? 'medium' : 'low' as Confidence
          }
        };
      });

      onStudentsChange(recalculated);
      setRecalculationProgress(100);
      setRecalculateSubtext('Compatibility recalibration completed!');

      setTimeout(() => {
        setIsRecalculating(false);
        showToast("ATS Match quotients successfully updated based on dynamic weights!");
      }, 300);
    }, 1800);
  };

  const triggerCSVDownload = (format: 'csv' | 'xlsx' | 'json', threshold: number, eligibleCandidates: StudentData[]) => {
    try {
      if (format !== 'csv') {
        showToast(`Warning: ${format.toUpperCase()} export is not fully implemented yet, defaulting to CSV.`);
      }
      
      const headers = ["ID", "Candidate Name", "Domain Profile", "Extracted Skills", "Experience Layer", "Recommendation Role", "ATS Score"];
      const rows = eligibleCandidates.map(s => [
        s.id,
        s.name.value,
        s.domain.value,
        s.skills.value,
        s.experience.value,
        s.role?.value ?? '',
        Number.isNaN(s.atsScore.value) ? 'NaN' : `${s.atsScore.value}%`
      ]);

      const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      
      link.setAttribute("href", url);
      link.setAttribute("download", `SkillSort_Shortlist_MinScore_${threshold}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setIsExportOpen(false);
      showToast(`Shortlist generated! Downloaded portfolio on ${eligibleCandidates.length} candidates.`);
    } catch (e) {
      showToast("Error generating download file packet.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[200] bg-slate-900 border border-slate-800 text-white rounded-xl shadow-xl px-4 py-3.5 flex items-center gap-2.5 animate-in slide-in-from-bottom duration-300 max-w-sm">
          <div className="h-5 w-5 bg-primary text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0">✓</div>
          <div className="text-xs font-semibold tracking-tight">{toastMessage}</div>
        </div>
      )}

      <GridToolbar recordCount={students.length} isExtracting={isExtracting} />
      
      <ActionControls 
        table={table} 
        hasJobDescription={hasJobDescription} 
        checklistItems={checklistItems}
        onRunATS={recalculateScores}
        onExportClick={() => setIsExportOpen(true)}
      />

      <div className="flex-1 overflow-auto bg-white relative">
        <RecalculatingOverlay isVisible={isRecalculating} progress={recalculationProgress} subtext={recalculateSubtext} />

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <table 
            className="min-w-full text-left border-collapse whitespace-nowrap bg-white table-fixed"
            style={{ width: table.getTotalSize() }}
          >
            <thead className="sticky top-0 bg-slate-100 shadow-sm z-20">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  <SortableContext
                    items={columnOrder}
                    strategy={horizontalListSortingStrategy}
                  >
                    {headerGroup.headers.map(header => {
                      return (
                        <SortableHeader key={header.id} header={header}>
                          {header.isPlaceholder
                            ? null
                             : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </SortableHeader>
                      );
                    })}
                  </SortableContext>
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map(row => (
                <tr key={row.id} className={`group border-b border-slate-200 ${row.original.hasError ? 'bg-rose-50/50 hover:bg-rose-100/50' : 'hover:bg-slate-50/50'}`}>
                  {row.getVisibleCells().map(cell => {
                    const isPinned = cell.column.getIsPinned();
                    return (
                      <td
                        key={cell.id}
                        onClick={() => onSelectCell(row.original.id, cell.column.id as keyof StudentData)}
                        style={{
                          left: isPinned ? 0 : undefined,
                          width: cell.column.getSize(),
                        }}
                        className={`${isPinned ? 'sticky z-20 bg-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]' : ''} ${getCellClass(row.original.id, cell.column.id as keyof StudentData, !!isPinned)} ${row.original.hasError ? '!bg-rose-50/30' : ''}`}
                      >
                        {row.original.hasError && cell.column.id === 'name' ? (
                          <div className="flex items-center gap-2">
                            <AlertCircle size={14} className="text-rose-500" />
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </div>
                        ) : row.original.hasError && cell.column.id === 'domain' ? (
                          <span className="text-xs font-bold text-rose-600 bg-rose-100 px-2 py-1 rounded">EXTRACTION FAILED</span>
                        ) : (
                          flexRender(cell.column.columnDef.cell, cell.getContext())
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </DndContext>
      </div>

      <ExportModal 
        isOpen={isExportOpen} 
        onClose={() => setIsExportOpen(false)} 
        students={students} 
        onExport={triggerCSVDownload} 
      />
    </div>
  );
}

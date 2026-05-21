import { useState, useMemo } from 'react';
import { StudentData, ExtractedField, Confidence } from '../types';
import { FileDown, RefreshCw, Layers, GripHorizontal, Pin, Settings2, Sliders, Check, Circle, Search, X, AlertCircle, Database, HelpCircle } from 'lucide-react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  VisibilityState,
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
  useSortable,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ReviewGridProps {
  students: StudentData[];
  onStudentsChange: (updated: StudentData[]) => void;
  onSelectCell: (studentId: string, field: keyof StudentData) => void;
  activeStudentId: string | null;
  activeField: keyof StudentData | null;
}

// Color-code helper to map confidence levels to soft, palatable pastel themes
const getConfidenceBg = (confidence: string, isActive: boolean) => {
  if (isActive) return '';
  return 'hover:bg-slate-50/80';
};

const SortableHeader = ({ header, children }: any) => {
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
  };

  return (
    <th
      ref={setNodeRef}
      style={{
        ...style,
        left: isPinned ? 0 : undefined,
      }}
      className={`px-5 py-4 border-b border-r border-slate-200 bg-slate-50 select-none text-xs uppercase tracking-wider text-slate-500 font-bold group transition-all ${isPinned ? 'sticky z-35 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] mb-[-1px]' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={header.column.getToggleSortingHandler()}>
          <span className="font-bold tracking-wider text-slate-600">{children}</span>
          {{
            asc: <span className="text-primary font-bold ml-1">↑</span>,
            desc: <span className="text-primary font-bold ml-1">↓</span>,
          }[header.column.getIsSorted() as string] ?? null}
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              header.column.pin(isPinned ? false : 'left');
            }} 
            className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 transition"
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

export function ReviewGrid({ students, onStudentsChange, onSelectCell, activeStudentId, activeField }: ReviewGridProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnPinning, setColumnPinning] = useState({
    left: ['name'],
  });
  
  // Columns drop-down & weight drawer interactive states
  const [columnsMenuOpen, setColumnsMenuOpen] = useState(false);
  const [weightsOpen, setWeightsOpen] = useState(false);
  const [colSearchQuery, setColSearchQuery] = useState('');

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
  const [exportThreshold, setExportThreshold] = useState(80);
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx' | 'json'>('csv');

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
      cell: info => (
        <div className="flex flex-col py-0.5">
          <span className="font-bold text-slate-800 tracking-tight group-hover:text-slate-950 transition-colors text-[14px]">
            {info.getValue() as string}
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
      cell: info => <ExtractedCell field={info.getValue() as ExtractedField} />,
    },
    {
      id: 'skills',
      accessorKey: 'skills',
      header: 'Extracted Skills',
      size: 240,
      cell: info => <ExtractedCell field={info.getValue() as ExtractedField} />,
    },
    {
      id: 'experience',
      accessorKey: 'experience',
      header: 'Experience Summary',
      size: 260,
      cell: info => <ExtractedCell field={info.getValue() as ExtractedField} />,
    },
    {
      id: 'role',
      accessorKey: 'role',
      header: 'Recommended Job',
      size: 180,
      cell: info => <ExtractedCell field={info.getValue() as ExtractedField} />,
    },
    {
      id: 'atsScore',
      accessorKey: 'atsScore',
      header: 'ATS Matching',
      size: 140,
      cell: info => {
        const val = info.getValue() as ExtractedField;
        const score = Number(val.value);
        
        let pillStyles = '';
        let dotColor = '';
        let label = '';
        
        if (score >= 90) {
          pillStyles = 'bg-emerald-50 text-emerald-800 border-emerald-200/60';
          dotColor = 'bg-emerald-500';
          label = 'Outstanding';
        } else if (score >= 80) {
          pillStyles = 'bg-primary/5 text-primary border-primary/20';
          dotColor = 'bg-primary';
          label = 'Strong Match';
        } else if (score >= 70) {
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
      sortingFn: (a, b) => ((a.original.atsScore.value as number) - (b.original.atsScore.value as number)),
    },
    {
      id: 'githubInfo',
      accessorKey: 'githubInfo',
      header: 'Dev Verified Metrics',
      size: 200,
      cell: info => <ExtractedCell field={info.getValue() as ExtractedField} />,
    },
  ], []);

  const [columnOrder, setColumnOrder] = useState<string[]>(columns.map(c => c.id as string));

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

  const ExtractedCell = ({ field }: { field: ExtractedField }) => {
    const confidence = field.confidence;
    let textColor = 'text-slate-800';
    let dotColor = '';

    if (confidence === 'high') {
      textColor = 'text-emerald-700 font-semibold';
      dotColor = 'bg-emerald-500';
    } else if (confidence === 'medium') {
      textColor = 'text-amber-700 font-semibold';
      dotColor = 'bg-amber-500';
    } else if (confidence === 'low') {
      textColor = 'text-rose-700 font-semibold';
      dotColor = 'bg-rose-500';
    }

    return (
      <div className="flex items-center gap-2 h-full py-0.5 select-none">
        {dotColor && <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotColor}`} />}
        <span 
          className={`${textColor} truncate block text-[13px] tracking-tight max-w-[220px]`} 
          title={String(field.value)}
        >
          {field.value}
        </span>
      </div>
    );
  };

  const getCellClass = (studentId: string, fieldKey: keyof StudentData, isPinned: boolean) => {
    const isActive = activeStudentId === studentId && activeField === fieldKey;
    
    // Focus review outline
    if (isActive) {
      if (isPinned) {
        return 'px-5 py-4 text-sm cursor-pointer border-b border-r border-slate-200 transition-all bg-primary/5 ring-inset ring-2 ring-primary z-20 sticky left-0 font-semibold shadow-inner';
      }
      return 'px-5 py-4 text-sm cursor-pointer border-b border-r border-slate-200 transition-all bg-primary/5 ring-inset ring-2 ring-primary z-10 relative font-medium shadow-inner';
    }

    // Pinned column gets static freeze / neutral aesthetic
    if (isPinned) {
      return 'px-5 py-4 text-sm cursor-pointer border-b border-r border-slate-200 transition-colors bg-slate-50 group-hover:bg-slate-100 text-slate-900 font-semibold sticky left-0 z-20';
    }

    // Lookup corresponding student record to pull core field's extraction confidence
    const student = students.find(s => s.id === studentId);
    if (!student) {
      return 'px-5 py-4 text-sm cursor-pointer border-b border-r border-slate-200 transition-colors hover:bg-slate-50 text-slate-800';
    }

    const valueObj = student[fieldKey];
    if (valueObj && typeof valueObj === 'object' && 'confidence' in valueObj) {
      const confidence = (valueObj as ExtractedField).confidence;
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
        const oldIndex = order.indexOf(active.id as string);
        const newIndex = order.indexOf(over.id as string);
        return arrayMove(order, oldIndex, newIndex);
      });
    }
  };

  const filteredColumns = table.getAllLeafColumns().filter(col => {
    const headerTitle = col.columnDef.header as string;
    return headerTitle.toLowerCase().includes(colSearchQuery.toLowerCase());
  });

  // Simulator to recalculate the matching scores based on the manual sliders weights!
  const recalculateScores = () => {
    setWeightsOpen(false);
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
      // Apply calculation based on slider weights
      const recalculated = students.map(student => {
        let skillMultiplier = student.skills.confidence === 'high' ? 1.0 : student.skills.confidence === 'medium' ? 0.8 : 0.6;
        let expMultiplier = student.experience.confidence === 'high' ? 1.0 : student.experience.confidence === 'medium' ? 0.75 : 0.5;
        let domainMultiplier = student.domain.confidence === 'high' ? 1.0 : student.domain.confidence === 'medium' ? 0.8 : 0.65;
        
        // Weighted composite
        const baseScore = Math.round(
          ((skillMultiplier * skillWeight) + (expMultiplier * expWeight) + (domainMultiplier * domainWeight)) / 
          (skillWeight + expWeight + domainWeight) * 100
        );

        // Natural noise generator (+/- 4 score points)
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

  const eligibleCandidates = useMemo(() => {
    return students.filter(s => (s.atsScore.value as number) >= exportThreshold);
  }, [students, exportThreshold]);

  // Real browser CSV compiler & downloader!
  const triggerCSVDownload = () => {
    try {
      const headers = ["ID", "Candidate Name", "Domain Profile", "Extracted Skills", "Experience Layer", "Recommendation Role", "ATS Score"];
      const rows = eligibleCandidates.map(s => [
        s.id,
        s.name.value,
        s.domain.value,
        s.skills.value,
        s.experience.value,
        s.role.value,
        `${s.atsScore.value}%`
      ]);

      const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      
      link.setAttribute("href", url);
      link.setAttribute("download", `SkillSort_Shortlist_MinScore_${exportThreshold}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setIsExportOpen(false);
      showToast(`Shortlist generated! Downloaded csv portfolio on ${eligibleCandidates.length} candidates.`);
    } catch (e) {
      showToast("Error generating download file packet.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      
      {/* Dynamic Toast Popup */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[200] bg-slate-900 border border-slate-800 text-white rounded-xl shadow-xl px-4 py-3.5 flex items-center gap-2.5 animate-in slide-in-from-bottom duration-300 max-w-sm">
          <div className="h-5 w-5 bg-primary text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0">✓</div>
          <div className="text-xs font-semibold tracking-tight">{toastMessage}</div>
        </div>
      )}

      {/* Grid Toolbar */}
      <div className="h-14 border-b border-slate-200 flex items-center px-6 shrink-0 bg-white relative">
        <div className="flex items-center gap-3">
          <Layers className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-slate-800">Review Extraction ({students.length} Records)</h2>
          
          {/* Subtle palatable legend displaying confidence mapping */}
          <div className="flex items-center gap-3.5 ml-4 pl-4 border-l border-slate-200 text-xs text-slate-500 font-medium select-none">
            <span className="text-slate-400">Confidence:</span>
            <span className="flex items-center gap-1 font-semibold">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-100 border border-emerald-400" /> 
              High
            </span>
            <span className="flex items-center gap-1 font-semibold">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-100 border border-amber-400" /> 
              Med
            </span>
            <span className="flex items-center gap-1 font-semibold">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-100 border border-rose-400" /> 
              Low
            </span>
          </div>
        </div>
      </div>

      {/* Action Controls Bar */}
      <div className="h-12 border-b border-slate-200 flex items-center justify-between px-6 shrink-0 bg-slate-50/80 relative">
        <div className="flex gap-2.5">
          {/* Columns Visibility Selector */}
          <div className="relative">
            <button 
              type="button"
              onClick={() => {
                setColumnsMenuOpen(!columnsMenuOpen);
                setWeightsOpen(false);
              }}
              className={`flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border px-3 py-2 rounded-lg cursor-pointer transition shadow-sm ${columnsMenuOpen ? 'border-primary ring-1 ring-primary z-50 text-slate-900' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <Settings2 size={13} /> Display Columns
            </button>
            
            {columnsMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setColumnsMenuOpen(false)} />
                <div className="absolute left-0 top-full mt-2 w-64 bg-slate-900 text-slate-100 rounded-xl shadow-xl border border-slate-800 p-3.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Fields</span>
                    <button 
                      type="button"
                      onClick={() => {
                        const allVisible = table.getIsAllColumnsVisible();
                        table.toggleAllColumnsVisible(!allVisible);
                      }}
                      className="text-[11px] tracking-tight text-primary hover:text-primary-container font-bold cursor-pointer"
                    >
                      {table.getIsAllColumnsVisible() ? 'Clear All' : 'Reset All'}
                    </button>
                  </div>

                  <div className="relative mb-2">
                    <Search size={12} className="absolute left-2.5 top-2.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Filter column keys..."
                      value={colSearchQuery}
                      onChange={(e) => setColSearchQuery(e.target.value)}
                      className="w-full text-xs pl-8 pr-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:border-primary text-white placeholder-slate-600 font-medium"
                    />
                  </div>

                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-0.5">
                    {filteredColumns.map(column => {
                      const isVisible = column.getIsVisible();
                      return (
                        <button
                          type="button"
                          key={column.id}
                          onClick={() => column.toggleVisibility(!isVisible)}
                          className={`w-full flex items-center justify-between text-left px-2 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${isVisible ? 'bg-slate-800/60 text-white' : 'hover:bg-slate-800/40 text-slate-500'}`}
                        >
                          <span className="font-semibold">{column.columnDef.header as string}</span>
                          <div className={`h-4 w-4 rounded flex items-center justify-center border transition-all shrink-0 ${isVisible ? 'bg-primary border-primary text-white' : 'border-slate-700 bg-slate-950'}`}>
                            {isVisible && <Check size={11} strokeWidth={3} />}
                          </div>
                        </button>
                      );
                    })}
                    {filteredColumns.length === 0 && (
                      <p className="text-center text-xs text-slate-600 py-3">No matching keys</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Recalculate Weights Selector Toggle */}
          <button 
            type="button"
            onClick={() => {
              setWeightsOpen(!weightsOpen);
              setColumnsMenuOpen(false);
            }}
            className={`flex items-center gap-1.5 text-xs font-bold bg-white border px-3 py-2 rounded-lg cursor-pointer transition shadow-sm ${weightsOpen ? 'border-primary text-primary' : 'text-slate-600 hover:text-slate-900 border-slate-200 hover:border-slate-300'}`}
          >
            <Sliders size={13} /> Algorithm Strategy
          </button>
        </div>

        {/* Export Action */}
        <button 
          type="button"
          onClick={() => setIsExportOpen(true)}
          className="flex items-center gap-1.5 text-xs font-bold text-white bg-primary hover:bg-primary-container px-3.5 py-2 rounded-lg cursor-pointer transition shadow-sm border border-primary/20"
        >
          <FileDown size={13} /> Export Shortlist
        </button>
      </div>

      {/* Dynamic Weight Configuration Drawer */}
      {weightsOpen && (
        <div className="bg-slate-50 border-b border-slate-200 p-5 shrink-0 transition-all select-none animate-in slide-in-from-top duration-300">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Sliders size={16} className="text-primary" />
                <span className="text-sm font-bold text-slate-800 tracking-tight">Recalculate Weighted ATS Strategy</span>
                <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full border border-primary/20">Simulated Pipeline</span>
              </div>
              <button 
                type="button"
                onClick={() => setWeightsOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold transition"
              >
                Dismiss Panel
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Skills weight slider */}
              <div className="flex flex-col gap-1.5 bg-white p-3.5 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700">Skills Weight</span>
                  <span className="text-primary font-mono font-bold text-xs bg-primary/5 px-1.5 py-0.5 rounded">{skillWeight}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={skillWeight}
                  onChange={(e) => setSkillWeight(Number(e.target.value))}
                  className="h-1.5 w-full bg-slate-200 accent-primary cursor-pointer rounded-lg appearance-none"
                />
                <p className="text-[10px] text-slate-400 leading-normal">Sets match quotient impact for certified languages & tech.</p>
              </div>

              {/* Experience weight slider */}
              <div className="flex flex-col gap-1.5 bg-white p-3.5 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700">Experience Layer</span>
                  <span className="text-primary font-mono font-bold text-xs bg-primary/5 px-1.5 py-0.5 rounded">{expWeight}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={expWeight}
                  onChange={(e) => setExpWeight(Number(e.target.value))}
                  className="h-1.5 w-full bg-slate-200 accent-primary cursor-pointer rounded-lg appearance-none"
                />
                <p className="text-[10px] text-slate-400 leading-normal">Controls weight for internships, tenure & researcher projects.</p>
              </div>

              {/* Domain Relevance weight slider */}
              <div className="flex flex-col gap-1.5 bg-white p-3.5 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700">Domain Match Intensity</span>
                  <span className="text-primary font-mono font-bold text-xs bg-primary/5 px-1.5 py-0.5 rounded">{domainWeight}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={domainWeight}
                  onChange={(e) => setDomainWeight(Number(e.target.value))}
                  className="h-1.5 w-full bg-slate-200 accent-primary cursor-pointer rounded-lg appearance-none"
                />
                <p className="text-[10px] text-slate-400 leading-normal">Assigns rating focus to general placements focus groups.</p>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSkillWeight(70);
                  setExpWeight(60);
                  setDomainWeight(50);
                  showToast("Baseline ratios reset!");
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 transition rounded-lg"
              >
                Reset Default Weights
              </button>
              <button
                type="button"
                onClick={recalculateScores}
                className="bg-primary hover:bg-primary-container text-white font-bold text-xs px-3.5 py-1.5 flex items-center gap-1.5 rounded-lg transition shadow-sm"
              >
                <RefreshCw size={11} /> Confirm Algorithm Recalculation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid Canvas */}
      <div className="flex-1 overflow-auto bg-white relative">
        
        {/* Recalculus Overlay Indicator */}
        {isRecalculating && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center z-40 transition-all duration-300">
            <div className="max-w-md w-full px-6 flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="h-16 w-16 rounded-full border-4 border-slate-100 border-t-primary animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Database size={18} className="text-primary animate-pulse" />
                </div>
              </div>

              <h3 className="text-base font-bold text-slate-800 tracking-tight">Recalculating Compatibility Ratings</h3>
              <p className="text-xs text-slate-500 h-5 mt-1.5 animate-pulse font-medium">{recalculateSubtext}</p>
              
              {/* Progress Line */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-6 mb-3.5 border border-slate-200">
                <div 
                  className="bg-primary h-full transition-all duration-300 rounded-full"
                  style={{ width: `${recalculationProgress}%` }}
                />
              </div>
              
              <span className="text-xs font-mono font-bold text-primary">{recalculationProgress}% Complete</span>
            </div>
          </div>
        )}

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
                        <SortableHeader key={header.id} header={header} table={table}>
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
                <tr key={row.id} className="group border-b border-slate-200 hover:bg-slate-50/50">
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
                        className={`${isPinned ? 'sticky z-20 bg-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]' : ''} ${getCellClass(row.original.id, cell.column.id as keyof StudentData, !!isPinned)}`}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </DndContext>
      </div>

      {/* Shortlist Exporter Panel Overlay */}
      {isExportOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200 select-none">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 max-h-[85vh] flex flex-col animate-in scale-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4 shrink-0">
              <div className="flex items-center gap-2.5 animate-pulse">
                <div className="h-8 w-8 bg-primary/5 text-primary rounded-lg flex items-center justify-center">
                  <FileDown size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 tracking-tight">Configure Placement Export</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Bundle records into an actionable spreadsheet portfolio.</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsExportOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-lg transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto space-y-5 pr-1 py-1">
              
              {/* ATS Threshold Setting slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700">Minimum Compatible Match Rating</span>
                  <span className="text-primary font-mono font-bold text-xs bg-primary/5 px-2.5 py-0.5 rounded border border-primary/20">&gt;= {exportThreshold}% ATS Score</span>
                </div>
                <input
                  type="range"
                  min="55"
                  max="95"
                  step="5"
                  value={exportThreshold}
                  onChange={(e) => setExportThreshold(Number(e.target.value))}
                  className="h-1.5 w-full bg-slate-200 accent-primary cursor-pointer rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-0.5">
                  <span>55% Minimal match</span>
                  <span>75% Primary recommendations</span>
                  <span>95% Gold star candidates</span>
                </div>
              </div>

              {/* Spreadsheets format */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Export Ledger Format</span>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setExportFormat('csv')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition cursor-pointer ${exportFormat === 'csv' ? 'border-primary bg-primary/5 text-primary font-bold ring-1 ring-primary' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-medium'}`}
                  >
                    <span className="text-xs font-bold tracking-tight">CSV Ledger</span>
                    <span className="text-[10px] text-slate-400 font-semibold mt-1">Universal Sheets</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportFormat('xlsx')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition cursor-pointer ${exportFormat === 'xlsx' ? 'border-primary bg-primary/5 text-primary font-bold ring-1 ring-primary' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-medium'}`}
                  >
                    <span className="text-xs font-bold tracking-tight">XLSX Document</span>
                    <span className="text-[10px] text-slate-400 font-semibold mt-1">Excel Formatted</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportFormat('json')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition cursor-pointer ${exportFormat === 'json' ? 'border-primary bg-primary/5 text-primary font-bold ring-1 ring-primary' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-medium'}`}
                  >
                    <span className="text-xs font-bold tracking-tight">JSON Matrix</span>
                    <span className="text-[10px] text-slate-400 font-semibold mt-1">Full API Schema</span>
                  </button>
                </div>
              </div>

              {/* dynamic list check preview */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700">Matched Candidates Shortlist ({eligibleCandidates.length})</span>
                  <span className="text-[10px] text-slate-500 font-semibold select-none">Meets Criterion cutoff</span>
                </div>

                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-40 overflow-y-auto bg-slate-50">
                  {eligibleCandidates.map(candidate => (
                    <div key={candidate.id} className="flex px-3.5 py-2.5 items-center justify-between text-xs transition hover:bg-white select-none">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-slate-800">{candidate.name.value as string}</span>
                        <span className="text-[10px] text-slate-400 font-semibold">{candidate.domain.value as string}</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                        {candidate.atsScore.value as number}% Match
                      </span>
                    </div>
                  ))}
                  {eligibleCandidates.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-xs flex flex-col items-center gap-1.5 justify-center">
                      <AlertCircle size={15} className="text-slate-400" />
                      <span>No candidates currently score above {exportThreshold}% Match. Try lowering the threshold criteria slider.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="pt-4 border-t border-slate-100 mt-4 flex gap-3 shrink-0 justify-end">
              <button
                type="button"
                onClick={() => setIsExportOpen(false)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 px-4 py-2 border border-slate-200 hover:bg-slate-50 transition rounded-lg"
              >
                Dismiss Window
              </button>
              <button
                type="button"
                disabled={eligibleCandidates.length === 0}
                onClick={triggerCSVDownload}
                className="bg-primary hover:bg-primary-container disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed text-white font-bold text-xs px-4 py-2 flex items-center gap-2 rounded-lg transition shadow-sm border border-primary/20 cursor-pointer"
              >
                <FileDown size={14} /> Download Filtered Shortlist
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

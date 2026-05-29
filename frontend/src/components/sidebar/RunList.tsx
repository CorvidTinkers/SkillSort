import React from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { RunHistory } from '../../services/api';
import { RunListItem } from './RunListItem';

interface RunListProps {
  runs: RunHistory[];
  loading: boolean;
  error: string | null;
  currentRunId: number | null;
  onRunSelect: (runId: number) => void;
}

export const RunList: React.FC<RunListProps> = ({ runs, loading, error, currentRunId, onRunSelect }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg">
        <AlertCircle className="w-4 h-4" />
        <span>{error}</span>
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <div className="text-center p-4 text-sm text-slate-500">
        No past runs found.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {runs.map((run) => (
        <RunListItem 
          key={run.run_id}
          run={run}
          isActive={currentRunId === run.run_id}
          onClick={() => onRunSelect(run.run_id)}
        />
      ))}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { List } from 'lucide-react';
import { fetchPastRuns, fetchRun, RunHistory } from '../../services/api';
import { useResume } from '../../context/ResumeContext';
import { useNavigate } from 'react-router-dom';
import { SidebarHeader } from './SidebarHeader';
import { RunList } from './RunList';

export const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [runs, setRuns] = useState<RunHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { currentRunId, setCurrentRunId, setStudents, setHasUploaded } = useResume();
  const navigate = useNavigate();

  useEffect(() => {
    loadRuns();
  }, []);

  const loadRuns = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchPastRuns();
      setRuns(data);
    } catch (err) {
      setError('Failed to load past runs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunSelect = async (runId: number) => {
    try {
      setCurrentRunId(runId);
      const students = await fetchRun(runId);
      setStudents(students);
      setHasUploaded(true);
      navigate(`/review`);
    } catch (err) {
      console.error('Failed to fetch run data', err);
    }
  };

  const handleNewRun = () => {
    setCurrentRunId(null);
    setStudents([]);
    setHasUploaded(false);
    navigate('/upload');
  };

  if (isCollapsed) {
    return (
      <aside className="w-16 bg-sidebar-bg bg-white border-r border-border-subtle border-slate-200 flex flex-col h-full flex-shrink-0 z-30 transition-all duration-300">
        <div className="h-16 flex items-center justify-center border-b border-border-subtle border-slate-200 bg-surface-bright/50 bg-slate-50">
          <button
            onClick={() => setIsCollapsed(false)}
            className="p-2 rounded-lg hover:bg-surface-muted text-on-surface-variant transition-colors"
            title="Expand Sidebar"
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-[300px] bg-sidebar-bg bg-white border-r border-border-subtle border-slate-200 flex flex-col h-full flex-shrink-0 z-30 transition-all duration-300">
      <SidebarHeader 
        onNewRun={handleNewRun} 
        onCollapse={() => setIsCollapsed(true)} 
      />
      
      <RunList 
        runs={runs}
        loading={loading}
        error={error}
        currentRunId={currentRunId}
        onRunSelect={handleRunSelect}
      />
    </aside>
  );
};

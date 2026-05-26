import { useMemo } from 'react';
import { StudentData } from '../types';
import { MOCK_STUDENTS } from '../data';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { Users, Target, BrainCircuit, Activity } from 'lucide-react';

interface AnalyticsDashboardProps {
  students?: StudentData[];
}

export function AnalyticsDashboard({ students = MOCK_STUDENTS }: AnalyticsDashboardProps) {
  const stats = useMemo(() => {
    const scoredStudents = students.filter(s => !Number.isNaN(s.atsScore.value));
    const totalScored = scoredStudents.length;
    const avgScore = totalScored > 0 ? scoredStudents.reduce((acc, s) => acc + s.atsScore.value, 0) / totalScored : 0;
    
    // Domain distribution
    const domains = students.reduce((acc, s) => {
      const d = s.domain.value as string;
      acc[d] = (acc[d] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const domainData = Object.keys(domains).map(name => ({ name, value: domains[name] }));

    // Confidence distribution
    const confidences = students.reduce((acc, s) => {
      acc[s.domain.confidence] = (acc[s.domain.confidence] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const confidenceData = Object.keys(confidences).map(name => ({ name, value: confidences[name] }));

    // Role Score distribution
    const roleStats = scoredStudents.reduce((acc, s) => {
      const r = s.role.value as string;
      if (!acc[r]) acc[r] = { name: r, avgScore: 0, count: 0 };
      acc[r].avgScore += s.atsScore.value;
      acc[r].count += 1;
      return acc;
    }, {} as Record<string, { name: string, avgScore: number, count: number }>);
    const roleData = Object.values(roleStats).map(r => ({ ...r, avgScore: Math.round(r.avgScore / r.count) })).sort((a,b) => b.avgScore - a.avgScore).slice(0, 5);

    return { total: students.length, avgScore: Math.round(avgScore), domainData, confidenceData, roleData };
  }, [students]);

  const COLORS = ['#0f766e', '#14b8a6', '#5eead4', '#ccfbf1', '#042f2e'];
  const CONFIDENCE_COLORS = { high: '#10b981', medium: '#f59e0b', low: '#f43f5e' };

  return (
    <div className="flex-1 overflow-auto bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Placement Intelligence</h1>
          <p className="text-slate-500">Real-time metrics on candidate extraction and ATS compatibility.</p>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="bg-teal-100/50 p-3 rounded-lg text-teal-600"><Users size={24} /></div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Scanned</p>
              <h3 className="text-2xl font-bold text-slate-800">{stats.total}</h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="bg-emerald-100/50 p-3 rounded-lg text-emerald-600"><Target size={24} /></div>
            <div>
              <p className="text-sm font-medium text-slate-500">Avg ATS Match</p>
              <h3 className="text-2xl font-bold text-slate-800">{stats.avgScore}%</h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="bg-indigo-100/50 p-3 rounded-lg text-indigo-600"><BrainCircuit size={24} /></div>
            <div>
              <p className="text-sm font-medium text-slate-500">High Confidence Edges</p>
              <h3 className="text-2xl font-bold text-slate-800">
                {stats.confidenceData.find(d => d.name === 'high')?.value || 0}
              </h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="bg-rose-100/50 p-3 rounded-lg text-rose-600"><Activity size={24} /></div>
            <div>
              <p className="text-sm font-medium text-slate-500">Review Required</p>
              <h3 className="text-2xl font-bold text-slate-800">
                {(stats.confidenceData.find(d => d.name === 'low')?.value || 0) + (stats.confidenceData.find(d => d.name === 'medium')?.value || 0)}
              </h3>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-6">Candidate Domains</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.domainData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.domainData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-6">Top Roles by ATS Score</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.roleData} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} width={100} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                    cursor={{fill: '#f8fafc'}}
                  />
                  <Bar dataKey="avgScore" fill="#0f766e" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

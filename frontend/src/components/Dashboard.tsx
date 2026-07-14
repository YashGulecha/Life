import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { CommandBar } from './CommandBar';
import { 
  Heart, 
  BookOpen, 
  DollarSign, 
  Users, 
  BookMarked, 
  LogOut, 
  Activity, 
  Calendar,
  AlertCircle,
  FileText,
  Clock
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

interface DashboardProps {
  onLogout: () => void;
  email: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ onLogout, email }) => {
  // Data States
  const [financeSummary, setFinanceSummary] = useState<any>(null);
  const [financeLogs, setFinanceLogs] = useState<any[]>([]);
  const [healthLogs, setHealthLogs] = useState<any[]>([]);
  const [relations, setRelations] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [finSumRes, finLogsRes, healthRes, relRes, acadRes, notesRes] = await Promise.all([
        client.get('/finances/summary'),
        client.get('/finances/logs?limit=10'),
        client.get('/health/logs?days=14'),
        client.get('/relations'),
        client.get('/academics/semesters'),
        client.get('/notes')
      ]);

      setFinanceSummary(finSumRes.data);
      setFinanceLogs(finLogsRes.data);
      setHealthLogs(healthRes.data);
      setRelations(relRes.data);
      setSemesters(acadRes.data);
      setNotes(notesRes.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Format relative time helper
  const getRelativeTime = (dateStr: string | Date) => {
    const dateInput = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - dateInput.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return dateInput.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const activeSemester = semesters.find(s => s.is_active);

  const chartData = [...healthLogs]
    .reverse()
    .slice(-7)
    .map(log => ({
      date: new Date(log.log_date).toLocaleDateString([], { weekday: 'short' }),
      sleep: log.sleep_duration || 0,
      energy: log.energy_level || 0
    }));

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: '16px' }}>
        <div className="pulse-glow" style={{ width: '48px', height: '48px', borderRadius: '50%', border: '4px solid var(--primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}>Igniting Pulse Engine...</span>
      </div>
    );
  }

  // Count active todos/assignments
  const pendingAssignments = activeSemester?.courses?.flatMap((c: any) => c.assignments).filter((a: any) => a.status === 'pending') || [];
  
  // Count contacts overdue for check-in
  const overdueContactsCount = relations.filter(r => {
    if (!r.last_contact_date) return true;
    const days = Math.floor((new Date().getTime() - new Date(r.last_contact_date).getTime()) / (1000 * 3600 * 24));
    return days > r.contact_interval_days;
  }).length;

  return (
    <div className="app-container">
      
      {/* Header bar */}
      <header className="glass-panel" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 28px',
        borderRadius: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)' }} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, letterSpacing: '-0.03em' }}>
            PULSE <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>// LIFE OS</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }} className="sidebar-nav">
            Session: <span style={{ color: 'white', fontWeight: 500 }}>{email}</span>
          </span>
          <button 
            onClick={onLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#fca5a5',
              padding: '8px 16px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontFamily: 'var(--font-display)',
              fontSize: '12px',
              transition: 'var(--transition-smooth)'
            }}
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </header>

      {/* CLI Command Input */}
      <CommandBar onCommandExecuted={fetchDashboardData} />

      {/* KPI Overview Widgets */}
      <div className="compact-kpi-grid">
        {/* Net Worth */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'var(--success-glow)', padding: '12px', borderRadius: '12px', color: 'var(--success)' }}>
            <DollarSign size={22} />
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>NET WORTH</span>
            <span style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'white' }}>
              ₹{financeSummary?.latest_net_worth?.toLocaleString() || '0'}
            </span>
          </div>
        </div>

        {/* Sleep tracker */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'var(--primary-glow)', padding: '12px', borderRadius: '12px', color: 'var(--primary)' }}>
            <Heart size={22} />
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>LAST SLEEP</span>
            <span style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'white' }}>
              {healthLogs[0]?.sleep_duration ? `${healthLogs[0].sleep_duration} hrs` : '—'}
            </span>
          </div>
        </div>

        {/* Tasks countdown */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'var(--info-glow)', padding: '12px', borderRadius: '12px', color: 'var(--info)' }}>
            <BookOpen size={22} />
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>PENDING TASKS</span>
            <span style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'white' }}>
              {pendingAssignments.length} Assignments
            </span>
          </div>
        </div>

        {/* CRM check-ins */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'var(--warning-glow)', padding: '12px', borderRadius: '12px', color: 'var(--warning)' }}>
            <Users size={22} />
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>CRM OVERDUE</span>
            <span style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-display)', color: overdueContactsCount > 0 ? 'var(--warning)' : 'white' }}>
              {overdueContactsCount} People
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Column (Chart & Activity Log), Right Column (Milestones & CRM) */}
      <div className="responsive-grid-main">
        
        {/* Left Side: Vitals Chart & Recent Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Chart Panel */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '20px', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} style={{ color: 'var(--primary)' }} />
              Vitals History (7-Day Overview)
            </h3>
            {chartData.length > 0 ? (
              <div style={{ width: '100%', height: '220px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorSleep" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--info)" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="var(--info)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" style={{ fontSize: '11px' }} axisLine={false} tickLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.3)" style={{ fontSize: '11px' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#131520', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontFamily: 'var(--font-body)' }} />
                    <Area type="monotone" dataKey="sleep" name="Sleep (Hrs)" stroke="var(--primary)" fillOpacity={1} fill="url(#colorSleep)" strokeWidth={2.5} />
                    <Area type="monotone" dataKey="energy" name="Energy Level" stroke="var(--info)" fillOpacity={1} fill="url(#colorEnergy)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '220px', color: 'var(--text-muted)' }}>
                No telemetry recorded. Log details using `/health`.
              </div>
            )}
          </div>

          {/* Clean Activity Feed Stream */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '20px', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} style={{ color: 'var(--info)' }} />
              Recent Logs Stream
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '400px', overflowY: 'auto' }}>
              {financeLogs.length > 0 || healthLogs.length > 0 ? (
                <>
                  {financeLogs.map((log: any) => (
                    <div key={`fin-${log.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '12px' }}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ background: log.transaction_type === 'income' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', color: log.transaction_type === 'income' ? '#10b981' : '#ef4444', padding: '6px', borderRadius: '8px', height: 'fit-content' }}>
                          <DollarSign size={15} />
                        </div>
                        <div>
                          <span style={{ display: 'block', fontSize: '13px', fontWeight: 600 }}>
                            {log.transaction_type === 'income' ? 'Received Income' : `Spent on ${log.category}`}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            ₹{log.amount.toLocaleString()} {log.description ? `• ${log.description}` : ''}
                          </span>
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{getRelativeTime(log.logged_at)}</span>
                    </div>
                  ))}
                  {healthLogs.slice(0, 5).map((log: any) => (
                    <div key={`hlt-${log.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '12px' }}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ background: 'rgba(99, 102, 241, 0.08)', color: 'var(--primary)', padding: '6px', borderRadius: '8px', height: 'fit-content' }}>
                          <Heart size={15} />
                        </div>
                        <div>
                          <span style={{ display: 'block', fontSize: '13px', fontWeight: 600 }}>Daily Telemetry Logged</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {log.sleep_duration ? `${log.sleep_duration} hrs sleep ` : ''}
                            {log.water_intake ? `• ${log.water_intake} glasses water ` : ''}
                            {log.energy_level ? `• Energy: ${log.energy_level}/5 ` : ''}
                          </span>
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{getRelativeTime(log.created_at)}</span>
                    </div>
                  ))}
                </>
              ) : (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>No logs recorded yet.</span>
              )}
            </div>
          </div>

        </div>

        {/* Right Side: CRM overdue, Milestones, and Notes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Milestones / Deadlines */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '20px', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} style={{ color: 'var(--info)' }} />
              Academic Countdown
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pendingAssignments.length > 0 ? (
                pendingAssignments.map((a: any) => {
                  const daysRemaining = a.due_date ? Math.ceil((new Date(a.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
                  return (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.015)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '70%' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title}</span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Term deadline</span>
                      </div>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '4px 8px',
                        borderRadius: '6px',
                        background: daysRemaining !== null && daysRemaining <= 2 ? 'var(--error-glow)' : 'var(--info-glow)',
                        color: daysRemaining !== null && daysRemaining <= 2 ? 'var(--error)' : 'var(--info)'
                      }}>
                        {daysRemaining !== null ? (daysRemaining <= 0 ? 'Today' : `${daysRemaining}d`) : 'No date'}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', gap: '8px', color: 'var(--text-muted)', fontSize: '12px' }}>
                  <AlertCircle size={18} />
                  <span>All tasks cleared.</span>
                </div>
              )}
            </div>
          </div>

          {/* CRM Overdue lists */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '20px', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} style={{ color: 'var(--warning)' }} />
              Inner Circle Alerts
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {relations.length > 0 ? (
                relations.slice(0, 4).map((r: any) => {
                  const days = r.last_contact_date ? Math.floor((new Date().getTime() - new Date(r.last_contact_date).getTime()) / (1000 * 3600 * 24)) : 999;
                  const overdue = days > r.contact_interval_days;
                  return (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>{r.name}</span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Target: every {r.contact_interval_days}d</span>
                      </div>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: overdue ? 700 : 500,
                        padding: '4px 8px',
                        borderRadius: '6px',
                        background: overdue ? 'var(--warning-glow)' : 'rgba(255,255,255,0.03)',
                        color: overdue ? 'var(--warning)' : 'var(--text-secondary)'
                      }}>
                        {days === 999 ? 'No contact log' : `${days}d ago`}
                      </span>
                    </div>
                  );
                })
              ) : (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>No relations logged.</span>
              )}
            </div>
          </div>

          {/* Wiki Notes Deck */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '20px', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookMarked size={18} style={{ color: 'var(--primary)' }} />
              Knowledge Cards
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {notes.length > 0 ? (
                notes.slice(0, 3).map((n: any) => (
                  <div key={n.id} style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.015)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <FileText size={14} style={{ color: 'var(--primary)' }} />
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>{n.title}</span>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {n.content || 'Empty note content'}
                    </p>
                  </div>
                ))
              ) : (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>No notes found.</span>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

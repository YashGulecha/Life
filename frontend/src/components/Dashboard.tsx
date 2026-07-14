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
  Plus, 
  Moon, 
  Activity,
  Calendar,
  AlertCircle,
  FolderOpen
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

interface DashboardProps {
  onLogout: () => void;
  email: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ onLogout, email }) => {
  // State variables for different modules
  const [financeSummary, setFinanceSummary] = useState<any>(null);
  const [healthLogs, setHealthLogs] = useState<any[]>([]);
  const [relations, setRelations] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [finRes, healthRes, relRes, acadRes, notesRes] = await Promise.all([
        client.get('/finances/summary'),
        client.get('/health/logs?days=14'),
        client.get('/relations'),
        client.get('/academics/semesters'),
        client.get('/notes')
      ]);

      setFinanceSummary(finRes.data);
      setHealthLogs(healthRes.data);
      setRelations(relRes.data);
      setSemesters(acadRes.data);
      setNotes(notesRes.data);
    } catch (err) {
      console.error('Failed to fetch dashboard telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleAddWater = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await client.post('/health/log', {
        log_date: today,
        water_intake: 1 // Adds 1 glass
      });
      fetchDashboardData();
    } catch (err) {
      console.error('Failed to increment hydration:', err);
    }
  };

  // Extract active semester
  const activeSemester = semesters.find(s => s.is_active);

  // Formulate data for the health vitals AreaChart
  // Show last 7 days of sleep and energy
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

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '40px 24px 80px' }}>
      
      {/* Header bar */}
      <header className="glass-panel" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 28px',
        marginBottom: '40px',
        borderRadius: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: 'var(--primary)',
            boxShadow: '0 0 10px var(--primary)'
          }} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, letterSpacing: '-0.03em' }}>
            PULSE <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>// LIFE OS</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
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
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* CLI Core Bar */}
        <CommandBar onCommandExecuted={fetchDashboardData} />

        {/* 4 Column KPI Panel */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px'
        }}>
          
          {/* Finance Overview Card */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500, fontFamily: 'var(--font-display)' }}>FINANCE INDEX</span>
              <div style={{ background: 'var(--success-glow)', padding: '6px', borderRadius: '8px', color: 'var(--success)' }}>
                <DollarSign size={16} />
              </div>
            </div>
            <div>
              <span style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                ₹{financeSummary?.latest_net_worth?.toLocaleString() || '0'}
              </span>
              <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Total Assets Net Liquid value
              </span>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', marginTop: '20px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Monthly Outflow</span>
              <span style={{ color: 'var(--error)', fontWeight: 600 }}>₹{financeSummary?.monthly_expense?.toLocaleString() || '0'}</span>
            </div>
          </div>

          {/* Vitals & Habits Card */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500, fontFamily: 'var(--font-display)' }}>HEALTH MONITOR</span>
              <div style={{ background: 'var(--primary-glow)', padding: '6px', borderRadius: '8px', color: 'var(--primary)' }}>
                <Heart size={16} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '24px' }}>
              <div>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                  <Moon size={18} style={{ color: 'var(--primary)' }} />
                  {healthLogs[0]?.sleep_duration || '—'}
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>hr</span>
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Last Sleep</span>
              </div>
              <div style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', paddingLeft: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                    {healthLogs[0]?.water_intake || '0'}
                  </span>
                  <button 
                    onClick={handleAddWater}
                    style={{
                      background: 'var(--primary-glow)',
                      border: 'none',
                      color: 'var(--primary)',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Hydration Units</span>
              </div>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', marginTop: '20px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Latest Weight</span>
              <span style={{ fontWeight: 600 }}>{healthLogs[0]?.weight ? `${healthLogs[0].weight} kg` : '—'}</span>
            </div>
          </div>

          {/* Academic Courses Card */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500, fontFamily: 'var(--font-display)' }}>ACADEMICS</span>
              <div style={{ background: 'var(--info-glow)', padding: '6px', borderRadius: '8px', color: 'var(--info)' }}>
                <BookOpen size={16} />
              </div>
            </div>
            <div>
              <span style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-display)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {activeSemester?.name || 'No Active Term'}
              </span>
              <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Courses enrolled: {activeSemester?.courses?.length || 0}
              </span>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', marginTop: '20px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Term GPA Target</span>
              <span style={{ color: 'var(--info)', fontWeight: 600 }}>9.0+</span>
            </div>
          </div>

          {/* Relationships Urgency Card */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500, fontFamily: 'var(--font-display)' }}>RELATIONSHIPS CRM</span>
              <div style={{ background: 'var(--warning-glow)', padding: '6px', borderRadius: '8px', color: 'var(--warning)' }}>
                <Users size={16} />
              </div>
            </div>
            <div>
              {relations.length > 0 ? (
                <>
                  <span style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-display)', color: relations[0].last_contact_date ? 'white' : 'var(--error)' }}>
                    {relations[0].name}
                  </span>
                  <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {!relations[0].last_contact_date ? 'Never contacted' : `Last call: ${relations[0].last_contact_date}`}
                  </span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: '20px', fontWeight: 600 }}>Inner Circle Empty</span>
                  <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Use /rel to log your circle</span>
                </>
              )}
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', marginTop: '20px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Urgency Alert</span>
              <span style={{ color: relations.length > 0 ? 'var(--warning)' : 'var(--text-muted)', fontWeight: 600 }}>
                {relations.length > 0 ? 'Call Pending' : 'None'}
              </span>
            </div>
          </div>

        </div>

        {/* Dynamic Telemetry Graph & Middle section */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '32px',
          flexWrap: 'wrap'
        }}>
          
          {/* Vitals History Line chart */}
          <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '24px', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} style={{ color: 'var(--primary)' }} />
              Vitals Analytics (Last 7 Days)
            </h3>
            {chartData.length > 0 ? (
              <div style={{ width: '100%', height: '240px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorSleep" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="var(--text-muted)" style={{ fontSize: '11px' }} />
                    <YAxis stroke="var(--text-muted)" style={{ fontSize: '11px' }} />
                    <Tooltip contentStyle={{ background: '#10121a', border: '1px solid var(--border-light)', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="sleep" name="Sleep (Hrs)" stroke="var(--primary)" fillOpacity={1} fill="url(#colorSleep)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                Log daily health metrics to render vital charts.
              </div>
            )}
          </div>

          {/* Academic Deadlines / Counting widget */}
          <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '20px', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} style={{ color: 'var(--info)' }} />
              Countdown / Tasks
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '240px' }}>
              {activeSemester?.courses?.flatMap((c: any) => c.assignments).filter((a: any) => a.status === 'pending').length > 0 ? (
                activeSemester.courses.flatMap((c: any) => 
                  c.assignments.filter((a: any) => a.status === 'pending').map((a: any) => {
                    const daysRemaining = a.due_date ? Math.ceil((new Date(a.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
                    return (
                      <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '70%' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title}</span>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{c.name}</span>
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
                )
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '40px 0', gap: '8px' }}>
                  <AlertCircle size={24} style={{ opacity: 0.5 }} />
                  <span>No impending deliverables.</span>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* CRM list and Wiki list */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '32px',
          flexWrap: 'wrap'
        }}>
          
          {/* Inner Circle / Relations CRM */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '20px', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} style={{ color: 'var(--warning)' }} />
              Inner Circle Logs
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {relations.slice(0, 4).map((r) => {
                const days = r.last_contact_date ? Math.floor((new Date().getTime() - new Date(r.last_contact_date).getTime()) / (1000 * 3600 * 24)) : 999;
                const overdue = days > r.contact_interval_days;
                return (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600 }}>{r.name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Interval: {r.contact_interval_days} days</span>
                    </div>
                    <span style={{
                      fontSize: '11px',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      background: overdue ? 'var(--warning-glow)' : 'rgba(255,255,255,0.03)',
                      color: overdue ? 'var(--warning)' : 'var(--text-secondary)',
                      fontWeight: overdue ? 700 : 500
                    }}>
                      {days === 999 ? 'No contact log' : `${days} days ago`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes & Knowledge Zettelkasten-lite */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '20px', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookMarked size={18} style={{ color: 'var(--primary)' }} />
              Knowledge base
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {notes.length > 0 ? (
                notes.slice(0, 4).map((n) => (
                  <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                    <FolderOpen size={16} style={{ color: 'var(--primary)' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '80%' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.title}</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.content || 'Empty note'}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '8px', color: 'var(--text-muted)', fontSize: '13px' }}>
                  <span>No notes created. Use /note to create one.</span>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Embedded Spin Keyframes */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

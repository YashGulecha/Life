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
  FileText
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

interface DashboardProps {
  onLogout: () => void;
  email: string;
}

type TabType = 'pulse' | 'health' | 'academics' | 'relations' | 'notes';

export const Dashboard: React.FC<DashboardProps> = ({ onLogout, email }) => {
  const [activeTab, setActiveTab] = useState<TabType>('pulse');
  
  // State variables for different modules
  const [financeSummary, setFinanceSummary] = useState<any>(null);
  const [healthLogs, setHealthLogs] = useState<any[]>([]);
  const [relations, setRelations] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Vitals inputs state
  const [sleepInput, setSleepInput] = useState('');
  const [waterInput, setWaterInput] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [energyInput, setEnergyInput] = useState('3');
  const [vitalsNotes, setVitalsNotes] = useState('');
  const [savingVitals, setSavingVitals] = useState(false);

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


  const handleLogVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingVitals(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await client.post('/health/log', {
        log_date: today,
        sleep_duration: sleepInput ? parseFloat(sleepInput) : undefined,
        water_intake: waterInput ? parseInt(waterInput) : undefined,
        weight: weightInput ? parseFloat(weightInput) : undefined,
        energy_level: parseInt(energyInput),
        notes: vitalsNotes || undefined
      });
      setSleepInput('');
      setWaterInput('');
      setWeightInput('');
      setVitalsNotes('');
      fetchDashboardData();
    } catch (err) {
      console.error('Failed to save physical vitals:', err);
    } finally {
      setSavingVitals(false);
    }
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, letterSpacing: '-0.03em' }}>
              PULSE <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>// OS</span>
            </span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="sidebar-nav">
            <button className={`sidebar-nav-btn ${activeTab === 'pulse' ? 'active' : ''}`} onClick={() => setActiveTab('pulse')}><Activity size={14}/> Pulse</button>
            <button className={`sidebar-nav-btn ${activeTab === 'health' ? 'active' : ''}`} onClick={() => setActiveTab('health')}><Heart size={14}/> Health</button>
            <button className={`sidebar-nav-btn ${activeTab === 'academics' ? 'active' : ''}`} onClick={() => setActiveTab('academics')}><BookOpen size={14}/> Academics</button>
            <button className={`sidebar-nav-btn ${activeTab === 'relations' ? 'active' : ''}`} onClick={() => setActiveTab('relations')}><Users size={14}/> CRM</button>
            <button className={`sidebar-nav-btn ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}><BookMarked size={14}/> Wiki</button>
          </div>
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

      {/* Dynamic Tab Contents */}

      {/* --- TAB 1: PULSE (HOME OVERVIEW & CLI) --- */}
      {activeTab === 'pulse' && (
        <>
          {/* CLI Core Bar */}
          <CommandBar onCommandExecuted={fetchDashboardData} />

          {/* High-density Compact KPI Grid */}
          <div className="compact-kpi-grid">
            <div className="compact-kpi-card" onClick={() => setActiveTab('health')} style={{ cursor: 'pointer' }}>
              <div style={{ background: 'var(--primary-glow)', padding: '8px', borderRadius: '8px', color: 'var(--primary)' }}>
                <Heart size={16} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>SLEEP</span>
                <span style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                  {healthLogs[0]?.sleep_duration ? `${healthLogs[0].sleep_duration} hr` : '—'}
                </span>
              </div>
            </div>

            <div className="compact-kpi-card" onClick={() => setActiveTab('health')} style={{ cursor: 'pointer' }}>
              <div style={{ background: 'var(--info-glow)', padding: '8px', borderRadius: '8px', color: 'var(--info)' }}>
                <Activity size={16} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>WATER</span>
                <span style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                  {healthLogs[0]?.water_intake ? `${healthLogs[0].water_intake} units` : '0'}
                </span>
              </div>
            </div>

            <div className="compact-kpi-card" onClick={() => setActiveTab('academics')} style={{ cursor: 'pointer' }}>
              <div style={{ background: 'var(--success-glow)', padding: '8px', borderRadius: '8px', color: 'var(--success)' }}>
                <BookOpen size={16} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>TERM</span>
                <span style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-display)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>
                  {activeSemester?.name || 'No Term'}
                </span>
              </div>
            </div>

            <div className="compact-kpi-card" onClick={() => setActiveTab('relations')} style={{ cursor: 'pointer' }}>
              <div style={{ background: 'var(--warning-glow)', padding: '8px', borderRadius: '8px', color: 'var(--warning)' }}>
                <Users size={16} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>CRM URGENCIES</span>
                <span style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-display)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>
                  {relations.length > 0 ? relations[0].name : 'Clean'}
                </span>
              </div>
            </div>
          </div>

          {/* High-priority layouts */}
          <div className="responsive-grid-main">
            {/* Countdown / Academic tasks */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '16px', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={16} style={{ color: 'var(--info)' }} />
                Imminent Countdowns
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                {activeSemester?.courses?.flatMap((c: any) => c.assignments).filter((a: any) => a.status === 'pending').length > 0 ? (
                  activeSemester.courses.flatMap((c: any) => 
                    c.assignments.filter((a: any) => a.status === 'pending').map((a: any) => {
                      const daysRemaining = a.due_date ? Math.ceil((new Date(a.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
                      return (
                        <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.015)', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
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
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '12px', padding: '40px 0', gap: '8px' }}>
                    <AlertCircle size={20} style={{ opacity: 0.5 }} />
                    <span>All tasks cleared.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Overview Summary Card */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '16px', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={16} style={{ color: 'var(--success)' }} />
                Finance Snapshot
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)' }}>ESTIMATED NET WORTH</span>
                  <span style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--success)' }}>
                    ₹{financeSummary?.latest_net_worth?.toLocaleString() || '0'}
                  </span>
                </div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)' }}>MONTHLY OUTFLOW</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--error)' }}>
                      ₹{financeSummary?.monthly_expense?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)' }}>NET SAVINGS</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>
                      ₹{financeSummary?.net_savings?.toLocaleString() || '0'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* --- TAB 2: HEALTH & HABITS LOGGING --- */}
      {activeTab === 'health' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Area Chart Vitals */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '16px', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={16} style={{ color: 'var(--primary)' }} />
              Telemetry Analytics (Last 7 Days)
            </h3>
            {chartData.length > 0 ? (
              <div style={{ width: '100%', height: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorSleep" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="var(--text-muted)" style={{ fontSize: '10px' }} />
                    <YAxis stroke="var(--text-muted)" style={{ fontSize: '10px' }} />
                    <Tooltip contentStyle={{ background: '#10121a', border: '1px solid var(--border-light)', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="sleep" name="Sleep (Hrs)" stroke="var(--primary)" fillOpacity={1} fill="url(#colorSleep)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '12px' }}>
                No telemetry details. Use the form below to submit vital records.
              </div>
            )}
          </div>

          {/* Vitals Form */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '20px', fontFamily: 'var(--font-display)' }}>Log Today's Vitals</h3>
            <form onSubmit={handleLogVitals} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Sleep duration (hrs)</label>
                  <input className="input-base" type="number" step="0.1" placeholder="e.g. 7.5" value={sleepInput} onChange={e => setSleepInput(e.target.value)} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Water intake (Glasses)</label>
                  <input className="input-base" type="number" placeholder="e.g. 8" value={waterInput} onChange={e => setWaterInput(e.target.value)} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Weight (kg)</label>
                  <input className="input-base" type="number" step="0.1" placeholder="e.g. 72.5" value={weightInput} onChange={e => setWeightInput(e.target.value)} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Energy Level (1-5)</label>
                  <select className="input-base" value={energyInput} onChange={e => setEnergyInput(e.target.value)} style={{ background: '#161923' }}>
                    <option value="1">1 - Exhausted</option>
                    <option value="2">2 - Low Energy</option>
                    <option value="3">3 - Normal</option>
                    <option value="4">4 - Focused</option>
                    <option value="5">5 - Vibrant</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Notes</label>
                <input className="input-base" type="text" placeholder="Felt standard, light stretch in morning" value={vitalsNotes} onChange={e => setVitalsNotes(e.target.value)} />
              </div>
              <button className="btn-primary" type="submit" disabled={savingVitals} style={{ marginTop: '8px' }}>
                {savingVitals ? 'Saving...' : 'Save Vitals'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- TAB 3: ACADEMICS & DEADLINES --- */}
      {activeTab === 'academics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '17px', marginBottom: '16px', fontFamily: 'var(--font-display)' }}>
              Active Term: {activeSemester?.name || 'No Active Term Configured'}
            </h3>
            {activeSemester?.courses?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {activeSemester.courses.map((c: any) => (
                  <div key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: '15px' }}>{c.name}</span>
                        {c.code && <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>({c.code})</span>}
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--primary)' }}>
                        Grade: {c.current_grade !== null ? `${c.current_grade}%` : '—'}
                      </span>
                    </div>
                    {/* List course assignments */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '12px' }}>
                      {c.assignments?.map((a: any) => (
                        <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          <span>• {a.title} ({Math.round(a.weight * 100)}% weight)</span>
                          <span style={{ color: a.status === 'completed' ? 'var(--success)' : 'var(--text-muted)' }}>
                            {a.score !== null ? `${a.score}%` : 'Pending'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No courses logged. Use the /todo parser commands to log assignments or tasks.</span>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 4: RELATIONSHIPS CRM --- */}
      {activeTab === 'relations' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '20px', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={16} style={{ color: 'var(--warning)' }} />
            Personal CRM circle
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {relations.length > 0 ? (
              relations.map((r) => {
                const days = r.last_contact_date ? Math.floor((new Date().getTime() - new Date(r.last_contact_date).getTime()) / (1000 * 3600 * 24)) : 999;
                const overdue = days > r.contact_interval_days;
                return (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600 }}>{r.name}</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Target: Call every {r.contact_interval_days} days</span>
                    </div>
                    <span style={{
                      fontSize: '11px',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      background: overdue ? 'var(--warning-glow)' : 'rgba(255,255,255,0.03)',
                      color: overdue ? 'var(--warning)' : 'var(--text-secondary)',
                      fontWeight: overdue ? 700 : 500
                    }}>
                      {days === 999 ? 'No contact logs' : `${days} days ago`}
                    </span>
                  </div>
                );
              })
            ) : (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No contacts. Add one using {"/rel <name> | [interaction]"} in the command line.</span>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 5: KNOWLEDGE BASE WIKI --- */}
      {activeTab === 'notes' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '20px', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookMarked size={16} style={{ color: 'var(--primary)' }} />
            Knowledge wiki
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {notes.length > 0 ? (
              notes.map((n) => (
                <div key={n.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 16px', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                  <FileText size={16} style={{ color: 'var(--primary)', marginTop: '2px' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '90%' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>{n.title}</span>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{n.content || 'Empty note content'}</p>
                  </div>
                </div>
              ))
            ) : (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No wiki articles logged. Use {"/note <title> | [text]"} to create one.</span>
            )}
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <div className="bottom-nav">
        <button className={`bottom-nav-item ${activeTab === 'pulse' ? 'active' : ''}`} onClick={() => setActiveTab('pulse')}>
          <Activity size={18} />
          Pulse
        </button>
        <button className={`bottom-nav-item ${activeTab === 'health' ? 'active' : ''}`} onClick={() => setActiveTab('health')}>
          <Heart size={18} />
          Health
        </button>
        <button className={`bottom-nav-item ${activeTab === 'academics' ? 'active' : ''}`} onClick={() => setActiveTab('academics')}>
          <BookOpen size={18} />
          Class
        </button>
        <button className={`bottom-nav-item ${activeTab === 'relations' ? 'active' : ''}`} onClick={() => setActiveTab('relations')}>
          <Users size={18} />
          CRM
        </button>
        <button className={`bottom-nav-item ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}>
          <BookMarked size={18} />
          Wiki
        </button>
      </div>

    </div>
  );
};

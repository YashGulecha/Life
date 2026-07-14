import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { CommandBar } from './CommandBar';

interface DashboardProps {
  onLogout: () => void;
  email: string;
}

interface TimelineItem {
  id: string;
  type: 'finance' | 'health' | 'academic' | 'relation' | 'note';
  title: string;
  description: string;
  timestamp: Date;
  rawDate: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ onLogout, email }) => {
  const [viewMode, setViewMode] = useState<'stream' | 'status'>('stream');
  
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
        client.get('/finances/logs?limit=50'),
        client.get('/health/logs?days=30'),
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
      console.error('Failed to fetch telemetry timeline:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Format relative time helper (e.g. "2h ago", "1d ago")
  const getRelativeTime = (dateInput: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - dateInput.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return dateInput.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Compile individual logs from all tables into a unified stream list
  const compileTimeline = (): TimelineItem[] => {
    const items: TimelineItem[] = [];

    // 1. Finance transactions
    financeLogs.forEach((log: any) => {
      items.push({
        id: `fin-${log.id}`,
        type: 'finance',
        title: 'FIN',
        description: `${log.transaction_type === 'income' ? 'Received' : 'Spent'} ₹${log.amount} [${log.category}]${log.description ? ` - ${log.description}` : ''}`,
        timestamp: new Date(log.logged_at),
        rawDate: log.logged_at
      });
    });

    // 2. Health logs (sleep, water, weight, energy rating)
    healthLogs.forEach((log: any) => {
      const midnightDate = new Date(log.log_date);
      // Offset timezone to avoid UTC shift issues
      midnightDate.setMinutes(midnightDate.getMinutes() + midnightDate.getTimezoneOffset());
      
      if (log.sleep_duration) {
        items.push({
          id: `hlt-sleep-${log.id}`,
          type: 'health',
          title: 'HLT',
          description: `Logged sleep: ${log.sleep_duration} hours${log.notes ? ` (${log.notes})` : ''}`,
          timestamp: midnightDate,
          rawDate: log.log_date
        });
      }
      if (log.water_intake) {
        items.push({
          id: `hlt-water-${log.id}`,
          type: 'health',
          title: 'HLT',
          description: `Hydration level: ${log.water_intake} units logged`,
          timestamp: midnightDate,
          rawDate: log.log_date
        });
      }
      if (log.weight) {
        items.push({
          id: `hlt-weight-${log.id}`,
          type: 'health',
          title: 'HLT',
          description: `Recorded body weight: ${log.weight} kg`,
          timestamp: midnightDate,
          rawDate: log.log_date
        });
      }
    });

    // 3. CRM interaction logs
    relations.forEach((rel: any) => {
      rel.logs?.forEach((log: any) => {
        const midnightDate = new Date(log.log_date);
        midnightDate.setMinutes(midnightDate.getMinutes() + midnightDate.getTimezoneOffset());
        items.push({
          id: `crm-${log.id}`,
          type: 'relation',
          title: 'CRM',
          description: `Contacted ${rel.name}${log.notes ? ` (${log.notes})` : ''}`,
          timestamp: midnightDate,
          rawDate: log.log_date
        });
      });
    });

    // 4. Academics due dates (deadlines)
    semesters.forEach((sem: any) => {
      sem.courses?.forEach((course: any) => {
        course.assignments?.forEach((assign: any) => {
          if (assign.due_date) {
            items.push({
              id: `acd-${assign.id}`,
              type: 'academic',
              title: 'ACD',
              description: `Deadline: ${course.name} - '${assign.title}' (Status: ${assign.status})`,
              timestamp: new Date(assign.due_date),
              rawDate: assign.due_date
            });
          }
        });
      });
    });

    // 5. Wiki Notes updates
    notes.forEach((note: any) => {
      items.push({
        id: `wik-${note.id}`,
        type: 'note',
        title: 'WIK',
        description: `Note '${note.title}' updated - ${note.content ? (note.content.substring(0, 60) + (note.content.length > 60 ? '...' : '')) : 'empty'}`,
        timestamp: new Date(note.created_at || new Date()),
        rawDate: note.created_at || new Date().toISOString()
      });
    });

    // Sort chronologically (latest first)
    return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  const timeline = compileTimeline();
  const activeSemester = semesters.find(s => s.is_active);

  if (loading) {
    return (
      <div className="term-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: '12px' }}>
        <span style={{ color: '#565f89', fontSize: '13px' }}>initializing pulse shell console...</span>
      </div>
    );
  }

  return (
    <div className="term-bg">
      {/* Monospace Terminal Header */}
      <div className="term-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>$</span>
          <span>pulse_os_console_v1.2.0</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span>user:{email}</span>
          <button 
            onClick={onLogout}
            style={{
              background: 'none',
              border: 'none',
              color: '#fca5a5',
              cursor: 'pointer',
              fontSize: '11px',
              fontFamily: 'inherit',
              padding: 0
            }}
          >
            [exit]
          </button>
        </div>
      </div>

      {/* Persistent CLI input at top */}
      <div className="term-cli-wrapper">
        <CommandBar onCommandExecuted={fetchDashboardData} />
      </div>

      {/* Terminal Segment Selector */}
      <div className="term-toggle-bar">
        <button 
          className={`term-toggle-btn ${viewMode === 'stream' ? 'active' : ''}`}
          onClick={() => setViewMode('stream')}
        >
          [1] stdout_stream
        </button>
        <button 
          className={`term-toggle-btn ${viewMode === 'status' ? 'active' : ''}`}
          onClick={() => setViewMode('status')}
        >
          [2] sys_status_metrics
        </button>
      </div>

      {/* Toggle Layout Mode */}
      {viewMode === 'stream' ? (
        /* MODE A: stdout_stream timeline */
        <div className="term-feed">
          {timeline.length > 0 ? (
            timeline.map((item) => (
              <div key={item.id} className="term-log-row">
                <span className="term-time">{getRelativeTime(item.timestamp)}</span>
                <span className={`term-tag tag-${item.type === 'academic' ? 'acd' : item.type === 'relation' ? 'crm' : item.type === 'note' ? 'wik' : item.type.substring(0, 3)}`}>
                  {item.title}
                </span>
                <span style={{ color: '#c0caf5' }}>{item.description}</span>
              </div>
            ))
          ) : (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#565f89', fontSize: '12px' }}>
              stdout stream empty. type commands above to write logs.
            </div>
          )}
        </div>
      ) : (
        /* MODE B: sys_status_metrics overview */
        <div className="term-status-section">
          
          {/* Finance metrics */}
          <div className="term-status-block">
            <div className="term-status-title">[FINANCE METRICS]</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
              <span>net worth       : ₹{financeSummary?.latest_net_worth?.toLocaleString() || '0'}</span>
              <span>monthly inflow  : ₹{financeSummary?.monthly_income?.toLocaleString() || '0'}</span>
              <span>monthly outflow : ₹{financeSummary?.monthly_expense?.toLocaleString() || '0'}</span>
              <span style={{ color: 'var(--success)' }}>net savings     : ₹{financeSummary?.net_savings?.toLocaleString() || '0'}</span>
            </div>
          </div>

          {/* Health metrics */}
          <div className="term-status-block">
            <div className="term-status-title">[HEALTH VAILS]</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
              <span>sleep (today)   : {healthLogs[0]?.sleep_duration ? `${healthLogs[0].sleep_duration} hrs` : '—'}</span>
              <span>hydration       : {healthLogs[0]?.water_intake ? `${healthLogs[0].water_intake} units` : '0'}</span>
              <span>body weight     : {healthLogs[0]?.weight ? `${healthLogs[0].weight} kg` : '—'}</span>
              <span>energy levels   : {healthLogs[0]?.energy_level ? `${healthLogs[0].energy_level}/5` : '—'}</span>
            </div>
          </div>

          {/* Academic metrics */}
          <div className="term-status-block">
            <div className="term-status-title">[ACADEMIC LOGS]</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
              <span>active term     : {activeSemester?.name || 'none'}</span>
              {activeSemester?.courses?.map((c: any) => (
                <span key={c.id} style={{ paddingLeft: '8px' }}>
                  • {c.name.padEnd(16)} : grade {c.current_grade !== null ? `${c.current_grade}%` : '—'}
                </span>
              ))}
            </div>
          </div>

          {/* Relations metrics */}
          <div className="term-status-block">
            <div className="term-status-title">[CRM URGENCY LOG]</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
              {relations.length > 0 ? (
                relations.map((r) => {
                  const days = r.last_contact_date ? Math.floor((new Date().getTime() - new Date(r.last_contact_date).getTime()) / (1000 * 3600 * 24)) : 999;
                  const overdue = days > r.contact_interval_days;
                  return (
                    <span key={r.id} style={{ color: overdue ? '#f59e0b' : '#c0caf5', paddingLeft: '8px' }}>
                      • {r.name.padEnd(14)} : contacted {days === 999 ? 'never' : `${days}d ago`} (threshold: {r.contact_interval_days}d)
                    </span>
                  );
                })
              ) : (
                <span>no CRM listings configured.</span>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

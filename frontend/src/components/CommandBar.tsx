import React, { useState, useRef, useEffect } from 'react';
import client from '../api/client';
import { Terminal, Send, CheckCircle2, XCircle } from 'lucide-react';

interface CommandBarProps {
  onCommandExecuted: () => void;
}

interface LogEntry {
  command: string;
  success: boolean;
  message: string;
  time: string;
}

const COMMAND_SUGGESTIONS = [
  { prefix: '/spent', desc: '<amount> <category> [description] (e.g. /spent 500 Food dinner)', detail: 'Log an expense' },
  { prefix: '/income', desc: '<amount> <category> [description] (e.g. /income 5000 Salary monthly)', detail: 'Log an income' },
  { prefix: '/health', desc: '<sleep|weight|water|energy> <value> [notes]', detail: 'Log vital metrics' },
  { prefix: '/todo', desc: '<task name> [due_date YYYY-MM-DD]', detail: 'Create a new todo' },
  { prefix: '/note', desc: '<title> | [content]', detail: 'Write or append to a note' },
  { prefix: '/rel', desc: '<name> | [notes]', detail: 'Log relationship contact' },
];

export const CommandBar: React.FC<CommandBarProps> = ({ onCommandExecuted }) => {
  const [command, setCommand] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener (Cmd/Ctrl + K to focus command bar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || loading) return;

    setLoading(true);
    const cmdStr = command;
    setCommand('');
    setShowSuggestions(false);

    try {
      const res = await client.post('/command', { command: cmdStr });
      const entry: LogEntry = {
        command: cmdStr,
        success: res.data.success,
        message: res.data.message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
      setLogs((prev) => [entry, ...prev].slice(0, 10)); // Keep last 10 logs
      if (res.data.success) {
        onCommandExecuted();
      }
    } catch (err: any) {
      setLogs((prev) => [
        {
          command: cmdStr,
          success: false,
          message: err.response?.data?.detail || 'Connection timed out.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        },
        ...prev,
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredSuggestions = COMMAND_SUGGESTIONS.filter((s) =>
    s.prefix.startsWith(command.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <form onSubmit={handleExecute} style={{ position: 'relative' }}>
        <div className="glass-panel" style={{
          display: 'flex',
          alignItems: 'center',
          padding: '4px 8px 4px 16px',
          border: '1px solid var(--border-light)',
          borderRadius: '16px',
          background: 'rgba(16, 18, 26, 0.85)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)'
        }}>
          <Terminal size={18} style={{ color: 'var(--primary)', marginRight: '12px' }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a life command... (e.g. /spent 120 coffee, Press Ctrl+K to focus)"
            value={command}
            onChange={(e) => {
              setCommand(e.target.value);
              setShowSuggestions(e.target.value.startsWith('/'));
            }}
            onFocus={() => setShowSuggestions(command.startsWith('/'))}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-body)',
              fontSize: '15px',
              padding: '12px 0',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'var(--primary)',
              border: 'none',
              borderRadius: '12px',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white',
              transition: 'var(--transition-smooth)'
            }}
          >
            <Send size={16} />
          </button>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="glass-panel" style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            zIndex: 10,
            background: 'rgba(16, 18, 26, 0.95)',
            border: '1px solid var(--border-light)',
            borderRadius: '14px',
            padding: '8px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            maxHeight: '260px',
            overflowY: 'auto'
          }}>
            {filteredSuggestions.map((s) => (
              <div
                key={s.prefix}
                onClick={() => {
                  setCommand(s.prefix + ' ');
                  inputRef.current?.focus();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)',
                  fontSize: '13px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
                    {s.prefix}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>{s.desc}</span>
                </div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '11px', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>
                  {s.detail}
                </span>
              </div>
            ))}
          </div>
        )}
      </form>

      {/* Real-time Feedback Logs Console */}
      {logs.length > 0 && (
        <div className="glass-panel" style={{
          padding: '16px',
          background: 'rgba(9, 10, 15, 0.6)',
          border: '1px solid var(--border-light)',
          borderRadius: '16px',
          fontFamily: 'monospace',
          fontSize: '12px',
          maxHeight: '180px',
          overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
            <Terminal size={14} />
            <span>EXECUTIVE SHELL FEEDBACK</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {logs.map((log, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', opacity: index === 0 ? 1 : 0.6, transition: 'opacity 0.2s' }}>
                <span style={{ color: 'var(--text-muted)' }}>[{log.time}]</span>
                <span style={{ color: 'var(--primary)', fontWeight: 600 }}>$ {log.command}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
                  {log.success ? (
                    <CheckCircle2 size={13} style={{ color: 'var(--success)' }} />
                  ) : (
                    <XCircle size={13} style={{ color: 'var(--error)' }} />
                  )}
                  <span style={{ color: log.success ? 'var(--success)' : 'var(--error)' }}>
                    {log.message}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import {
  Sparkles,
  MessageSquare,
  X,
  ArrowRight,
  Send,
  ShieldCheck,
  AlertTriangle,
  Copy,
  Boxes,
  CheckCircle2,
  Bot
} from 'lucide-react';

const PRESET_QUERIES = [
  {
    q: 'What are the biggest data quality problems?',
    a: 'The highest severity issue is conflicting voltage/power specifications across 18 catalog items, followed by 127 missing IP ratings and secondary dimension attributes.'
  },
  {
    q: 'Which products need human engineering review?',
    a: '18 cross-source conflicts have been flagged for review where OEM datasheets and ERP purchasing records disagree on rotational speed (RPM) or power ratings.'
  },
  {
    q: 'Which category has the lowest completeness?',
    a: 'The "Pumps & Fluid Handling" and "Industrial Fasteners" categories have the lowest attribute completeness (78.4%), primarily due to missing ingress protection (IP) codes.'
  },
  {
    q: 'Which supplier has the most specification conflicts?',
    a: 'Supplier "Apex Industrial Supply" accounts for 62% of detected spec discrepancies when cross-referenced against canonical manufacturer datasheets.'
  }
];

export default function AskAIAssistantModal({ isOpen, onClose, jobId }) {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Hello! I am ASSR AI, your industrial catalog intelligence assistant. Ask me anything about dataset quality, conflicts, deduplication clusters, or taxonomy.'
    }
  ]);
  const [inputVal, setInputVal] = useState('');

  if (!isOpen) return null;

  const handleSend = (text) => {
    const query = (text || inputVal).trim();
    if (!query) return;

    const userMsg = { sender: 'user', text: query };
    const matched = PRESET_QUERIES.find((p) => p.q.toLowerCase() === query.toLowerCase());

    let aiReply = matched
      ? matched.a
      : `Based on your active industrial catalog (Job: ${jobId || 'demo'}), ASSR AI evaluated 1,050 products across 10 categories. 31 duplicate clusters were clustered with 80%+ similarity, and overall ISO data quality is scored at 94.2%.`;

    setMessages((prev) => [...prev, userMsg, { sender: 'ai', text: aiReply }]);
    setInputVal('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="glass-card rounded-3xl w-full max-w-xl shadow-2xl border border-[#E4E8F0] dark:border-[rgba(255,255,255,0.1)] overflow-hidden bg-white dark:bg-[#151D32] flex flex-col h-[580px]">
        
        {/* Header */}
        <div className="p-5 border-b border-[#E4E8F0] dark:border-[rgba(255,255,255,0.08)] flex items-center justify-between bg-slate-50 dark:bg-[#10172A]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-400 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-display font-bold text-[#172033] dark:text-white text-base flex items-center space-x-2">
                <span>ASK ASSR AI</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                  ONLINE
                </span>
              </h3>
              <p className="text-xs text-[#5D677A] dark:text-slate-400 font-mono">Contextual Dataset Intelligence Assistant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-[#172033] dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-[#F8FAFD] dark:bg-[#0B1020]">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start space-x-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'ai' && (
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`p-3.5 rounded-2xl text-xs max-w-[80%] leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-indigo-600 text-white font-medium rounded-tr-none shadow-sm'
                    : 'bg-white dark:bg-[#151D32] text-[#172033] dark:text-slate-200 border border-[#E4E8F0] dark:border-slate-800 rounded-tl-none shadow-sm font-mono'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {/* Quick Preset Queries */}
          {messages.length === 1 && (
            <div className="pt-2 space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8A94A6] dark:text-slate-400 block">
                Suggested Intelligence Inquiries:
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {PRESET_QUERIES.map((pq, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => handleSend(pq.q)}
                    className="p-2.5 rounded-xl bg-white dark:bg-[#151D32] hover:bg-indigo-50 dark:hover:bg-cyan-500/10 border border-[#E4E8F0] dark:border-slate-800 text-left text-xs text-[#5D677A] dark:text-slate-300 hover:text-indigo-600 dark:hover:text-cyan-300 transition-all flex items-center justify-between group shadow-sm"
                  >
                    <span>{pq.q}</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="p-3.5 border-t border-[#E4E8F0] dark:border-[rgba(255,255,255,0.08)] bg-white dark:bg-[#10172A] flex items-center space-x-2"
        >
          <input
            type="text"
            placeholder="Ask about data quality, conflicts, or duplicates..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="flex-1 bg-slate-50 dark:bg-[#151D32] border border-[#E4E8F0] dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-[#172033] dark:text-white placeholder-[#8A94A6] dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner"
          />
          <button
            type="submit"
            disabled={!inputVal.trim()}
            className="btn-primary px-4 py-2.5 rounded-xl"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

      </div>
    </div>
  );
}

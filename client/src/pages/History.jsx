import { useState, useEffect } from 'react';
import { historyAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineClock, HiOutlineQuestionMarkCircle, HiOutlineClipboardList, HiOutlineAcademicCap,
  HiOutlineChevronDown, HiOutlineChevronUp, HiOutlineClipboardCopy,
} from 'react-icons/hi';

export default function History() {
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { loadHistory(); }, [filter]);
  const loadHistory = async () => {
    try {
      const params = filter !== 'all' ? { type: filter } : {};
      const res = await historyAPI.getAll(params);
      setInteractions(res.data.interactions);
    } catch { toast.error('Failed to load history'); }
    finally { setLoading(false); }
  };

  const filters = [
    { value: 'all', label: 'All' },
    { value: 'ask', label: 'Questions' },
    { value: 'summary', label: 'Summaries' },
    { value: 'quiz', label: 'Quizzes' },
  ];
  const typeIcons = { ask: HiOutlineQuestionMarkCircle, summary: HiOutlineClipboardList, quiz: HiOutlineAcademicCap };
  const typeLabels = { ask: 'Question', summary: 'Summary', quiz: 'Quiz' };
  const typeColors = {
    ask: { bg: 'bg-[#FFF3E0] dark:bg-[#F18F2E]/10', text: 'text-[#F18F2E]' },
    summary: { bg: 'bg-[#FBE9E7] dark:bg-[#E74627]/10', text: 'text-[#E74627]' },
    quiz: { bg: 'bg-[#EFEBE9] dark:bg-[#7D2817]/15', text: 'text-[#7D2817] dark:text-[#fdba74]' },
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-[3px] border-[#F18F2E] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#FFF3E0] dark:bg-[#F18F2E]/10 rounded-xl flex items-center justify-center">
          <HiOutlineClock className="w-5 h-5 text-[#F18F2E]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#1c1917] dark:text-white">History</h1>
          <p className="text-xs text-[#a8a29e] dark:text-[#78716c] mt-0.5">Review your past AI interactions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => { setFilter(f.value); setLoading(true); setExpanded(null); }}
            className={`text-xs font-semibold pb-1 transition-colors ${
              filter === f.value
                ? 'text-[#1c1917] dark:text-white border-b-2 border-[#1c1917] dark:border-white'
                : 'text-[#a8a29e] dark:text-[#78716c] hover:text-[#1c1917] dark:hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {interactions.length === 0 ? (
        <div className="card p-12 text-center">
          <HiOutlineClock className="w-10 h-10 text-[#d6d3ce] dark:text-[#333231] mx-auto mb-3" />
          <h3 className="text-base font-semibold text-[#1c1917] dark:text-white mb-1.5">No interactions yet</h3>
          <p className="text-xs text-[#a8a29e] dark:text-[#78716c]">Your AI interactions will appear here</p>
        </div>
      ) : (
        <div className="space-y-3 stagger-children">
          {interactions.map((item) => {
            const Icon = typeIcons[item.type] || HiOutlineClock;
            const tc = typeColors[item.type] || typeColors.ask;
            const isOpen = expanded === item._id;
            return (
              <div key={item._id} className="card overflow-hidden">
                <button onClick={() => setExpanded(isOpen ? null : item._id)} className="w-full p-4 flex items-start gap-3 text-left hover:bg-[#f5f4f2]/50 dark:hover:bg-[#1a1918]/50 transition-colors">
                  <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${tc.bg}`}>
                    <Icon className={`w-4 h-4 ${tc.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1c1917] dark:text-white truncate">{item.question}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-semibold ${tc.text}`}>{typeLabels[item.type]}</span>
                      <span className="w-1 h-1 rounded-full bg-[#d6d3ce] dark:bg-[#333231]" />
                      <span className="text-[10px] text-[#a8a29e] dark:text-[#78716c]">{new Date(item.createdAt).toLocaleDateString()}</span>
                      {item.documentId && <><span className="w-1 h-1 rounded-full bg-[#d6d3ce] dark:bg-[#333231]" /><span className="text-[10px] text-[#a8a29e] dark:text-[#78716c] truncate max-w-[120px]">{item.documentId.originalName}</span></>}
                    </div>
                  </div>
                  {isOpen ? <HiOutlineChevronUp className="w-4 h-4 text-[#a8a29e] dark:text-[#78716c] flex-shrink-0 mt-1" /> : <HiOutlineChevronDown className="w-4 h-4 text-[#a8a29e] dark:text-[#78716c] flex-shrink-0 mt-1" />}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-0 border-t border-[#e8e5e0] dark:border-[#1e1d1c] animate-fade-in">
                    <div className="flex items-center justify-between mt-3 mb-2">
                      <p className="text-[10px] font-bold text-[#a8a29e] dark:text-[#78716c] uppercase tracking-wider">Response</p>
                      <button onClick={() => { navigator.clipboard.writeText(item.response); toast.success('Copied!'); }}
                        className="flex items-center gap-1 text-[10px] font-semibold text-[#a8a29e] dark:text-[#78716c] hover:text-[#F18F2E] transition-colors">
                        <HiOutlineClipboardCopy className="w-3 h-3" />Copy
                      </button>
                    </div>
                    <p className="text-sm text-[#78716c] dark:text-[#a8a29e] whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">{item.response}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

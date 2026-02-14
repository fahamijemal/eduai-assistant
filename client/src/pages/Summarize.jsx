import { useState } from 'react';
import { aiAPI } from '../services/api';
import DocumentSelector from '../components/DocumentSelector';
import toast from 'react-hot-toast';
import { HiOutlineClipboardList, HiOutlineClipboardCopy, HiOutlineSparkles } from 'react-icons/hi';

export default function Summarize() {
  const [documentId, setDocumentId] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSummarize = async () => {
    if (!documentId) { toast.error('Please select a document'); return; }
    setLoading(true); setSummary('');
    try { const res = await aiAPI.summarize(documentId); setSummary(res.data.summary); toast.success('Summary generated!'); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed to generate summary'); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#FBE9E7] dark:bg-[#E74627]/10 rounded-xl flex items-center justify-center">
          <HiOutlineClipboardList className="w-5 h-5 text-[#E74627]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#1c1917] dark:text-white">Summarize</h1>
          <p className="text-xs text-[#a8a29e] dark:text-[#78716c] mt-0.5">Generate AI-powered summaries of your study materials</p>
        </div>
      </div>

      <div className="card p-6 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-[#78716c] dark:text-[#a8a29e] mb-2">Select Document</label>
          <DocumentSelector value={documentId} onChange={setDocumentId} />
        </div>
        <button onClick={handleSummarize} disabled={loading || !documentId} className="btn-primary">
          {loading ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating...</>) : (<><HiOutlineSparkles className="w-4 h-4" />Generate Summary</>)}
        </button>
      </div>

      {loading && (
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#FBE9E7] dark:bg-[#E74627]/10 rounded-lg flex items-center justify-center"><div className="w-4 h-4 border-2 border-[#E74627] border-t-transparent rounded-full animate-spin" /></div>
            <div><p className="text-sm font-medium text-[#1c1917] dark:text-white">Reading and summarizing...</p><p className="text-[11px] text-[#a8a29e] dark:text-[#78716c] mt-0.5">This may take a few seconds</p></div>
          </div>
        </div>
      )}

      {summary && !loading && (
        <div className="card p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><HiOutlineSparkles className="w-4 h-4 text-[#E74627]" /><h3 className="text-xs font-bold text-[#a8a29e] dark:text-[#78716c] uppercase tracking-wider">Summary</h3></div>
            <button onClick={() => { navigator.clipboard.writeText(summary); toast.success('Copied!'); }} className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#a8a29e] dark:text-[#78716c] hover:text-[#F18F2E] hover:bg-[#FFF3E0] dark:hover:bg-[#F18F2E]/10 rounded-lg transition-colors">
              <HiOutlineClipboardCopy className="w-3.5 h-3.5" />Copy
            </button>
          </div>
          <div className="text-sm text-[#44403c] dark:text-[#a8a29e] whitespace-pre-wrap leading-relaxed">{summary}</div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { aiAPI } from '../services/api';
import DocumentSelector from '../components/DocumentSelector';
import toast from 'react-hot-toast';
import { HiOutlineQuestionMarkCircle, HiOutlinePaperAirplane, HiOutlineRefresh, HiOutlineSparkles } from 'react-icons/hi';

export default function Ask() {
  const [documentId, setDocumentId] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!documentId) { toast.error('Please select a document'); return; }
    if (!question.trim() || question.trim().length < 3) { toast.error('Question must be at least 3 characters'); return; }
    setLoading(true); setAnswer('');
    try { const res = await aiAPI.ask(documentId, question); setAnswer(res.data.answer); toast.success('Answer generated!'); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed to get answer'); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#FFF3E0] dark:bg-[#F18F2E]/10 rounded-xl flex items-center justify-center">
          <HiOutlineQuestionMarkCircle className="w-5 h-5 text-[#F18F2E]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#1c1917] dark:text-white">Ask a Question</h1>
          <p className="text-xs text-[#a8a29e] dark:text-[#78716c] mt-0.5">Get AI-powered answers from your documents</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-[#78716c] dark:text-[#a8a29e] mb-2">Document</label>
            <DocumentSelector value={documentId} onChange={setDocumentId} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#78716c] dark:text-[#a8a29e] mb-2">Your Question</label>
            <textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="What would you like to know about this document?" rows={4} className="input-premium resize-none" />
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={loading || !documentId || !question.trim()} className="btn-primary">
              {loading ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Thinking...</>) : (<><HiOutlinePaperAirplane className="w-4 h-4 rotate-90" />Ask AI</>)}
            </button>
            {answer && <button type="button" onClick={() => { setQuestion(''); setAnswer(''); }} className="btn-secondary"><HiOutlineRefresh className="w-4 h-4" />New question</button>}
          </div>
        </div>
      </form>

      {loading && (
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#FFF3E0] dark:bg-[#F18F2E]/10 rounded-lg flex items-center justify-center"><div className="w-4 h-4 border-2 border-[#F18F2E] border-t-transparent rounded-full animate-spin" /></div>
            <div><p className="text-sm font-medium text-[#1c1917] dark:text-white">Analyzing document...</p><p className="text-[11px] text-[#a8a29e] dark:text-[#78716c] mt-0.5">This may take a few seconds</p></div>
          </div>
        </div>
      )}

      {answer && !loading && (
        <div className="card p-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <HiOutlineSparkles className="w-4 h-4 text-[#F18F2E]" />
            <h3 className="text-xs font-bold text-[#a8a29e] dark:text-[#78716c] uppercase tracking-wider">AI Answer</h3>
          </div>
          <div className="text-sm text-[#44403c] dark:text-[#a8a29e] whitespace-pre-wrap leading-relaxed">{answer}</div>
        </div>
      )}
    </div>
  );
}

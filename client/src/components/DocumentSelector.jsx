import { useState, useEffect } from 'react';
import { documentsAPI } from '../services/api';
import { HiOutlineDocumentText, HiOutlineExclamation } from 'react-icons/hi';
import { Link } from 'react-router-dom';

export default function DocumentSelector({ value, onChange }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { const res = await documentsAPI.getAll(); setDocuments(res.data.documents); }
      catch { /* silently fail */ }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-[#f5f4f2] dark:bg-[#111110] border border-[#e8e5e0] dark:border-[#252423]">
        <div className="w-4 h-4 border-2 border-[#F18F2E] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-[#a8a29e] dark:text-[#78716c]">Loading documents...</span>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#FFF3E0] dark:bg-[#F18F2E]/10 border border-[#F18F2E]/20">
        <HiOutlineExclamation className="w-5 h-5 text-[#F18F2E] flex-shrink-0" />
        <div>
          <p className="text-xs font-medium text-[#1c1917] dark:text-white">No documents uploaded</p>
          <Link to="/documents" className="text-[11px] text-[#F18F2E] hover:text-[#d97c1f] font-semibold transition-colors">Upload a PDF first →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <HiOutlineDocumentText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a8a29e] dark:text-[#78716c] pointer-events-none" />
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input-premium !pl-10 appearance-none cursor-pointer">
        <option value="">Choose a document...</option>
        {documents.map((doc) => (<option key={doc._id} value={doc._id}>{doc.originalName}</option>))}
      </select>
    </div>
  );
}

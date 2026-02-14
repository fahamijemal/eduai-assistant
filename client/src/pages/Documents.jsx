import { useState, useEffect, useRef } from 'react';
import { documentsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlineDocumentText, HiOutlineUpload, HiOutlineTrash, HiOutlineCloudUpload, HiOutlinePlus } from 'react-icons/hi';

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => { loadDocuments(); }, []);
  const loadDocuments = async () => {
    try { const res = await documentsAPI.getAll(); setDocuments(res.data.documents); }
    catch { toast.error('Failed to load documents'); }
    finally { setLoading(false); }
  };
  const handleUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (file.type !== 'application/pdf') { toast.error('Only PDF files are allowed'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('File size must be under 10MB'); return; }
    setUploading(true);
    try { const fd = new FormData(); fd.append('document', file); await documentsAPI.upload(fd); toast.success('Document uploaded!'); loadDocuments(); }
    catch (err) { toast.error(err.response?.data?.error || 'Upload failed'); }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?\nThis will also remove all related interactions.`)) return;
    setDeleting(id);
    try { await documentsAPI.delete(id); toast.success('Document deleted'); setDocuments((p) => p.filter((d) => d._id !== id)); }
    catch { toast.error('Failed to delete document'); }
    finally { setDeleting(null); }
  };
  const formatSize = (b) => b < 1024 ? b + ' B' : b < 1024 * 1024 ? (b / 1024).toFixed(1) + ' KB' : (b / (1024 * 1024)).toFixed(1) + ' MB';

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-[3px] border-[#F18F2E] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1c1917] dark:text-white">My Documents</h1>
          <p className="text-xs text-[#a8a29e] dark:text-[#78716c] mt-1">Upload and manage your PDF study materials</p>
        </div>
        <label className={`btn-primary cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
          {uploading ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Uploading...</>) : (<><HiOutlinePlus className="w-4 h-4" />Upload PDF</>)}
          <input type="file" accept=".pdf" onChange={handleUpload} disabled={uploading} ref={fileInputRef} className="hidden" />
        </label>
      </div>

      {documents.length === 0 ? (
        <div className="card border-2 border-dashed border-[#e8e5e0] dark:border-[#252423] p-12">
          <div className="text-center">
            <div className="w-14 h-14 bg-[#FFF3E0] dark:bg-[#F18F2E]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <HiOutlineCloudUpload className="w-7 h-7 text-[#F18F2E]" />
            </div>
            <h3 className="text-base font-semibold text-[#1c1917] dark:text-white mb-1.5">No documents yet</h3>
            <p className="text-xs text-[#a8a29e] dark:text-[#78716c] mb-5 max-w-sm mx-auto">Upload your first PDF to start using AI-powered study features</p>
            <label className="btn-primary cursor-pointer"><HiOutlineUpload className="w-4 h-4" />Choose PDF File<input type="file" accept=".pdf" onChange={handleUpload} disabled={uploading} className="hidden" /></label>
            <p className="text-[10px] text-[#a8a29e] dark:text-[#78716c] mt-3">PDF files only, max 10MB</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 stagger-children">
          {documents.map((doc) => (
            <div key={doc._id} className="group card-hover p-4 flex items-center gap-4">
              <div className="w-11 h-11 bg-[#FBE9E7] dark:bg-[#E74627]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <HiOutlineDocumentText className="w-5 h-5 text-[#E74627]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-[#1c1917] dark:text-white truncate">{doc.originalName}</h3>
                <p className="text-[11px] text-[#a8a29e] dark:text-[#78716c] mt-0.5 flex items-center gap-2">
                  <span>{formatSize(doc.fileSize)}</span>
                  <span className="w-1 h-1 rounded-full bg-[#d6d3ce] dark:bg-[#333231]" />
                  <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                </p>
              </div>
              <button onClick={() => handleDelete(doc._id, doc.originalName)} disabled={deleting === doc._id}
                className="p-2 text-[#d6d3ce] dark:text-[#333231] hover:text-[#E74627] hover:bg-[#FBE9E7] dark:hover:bg-[#E74627]/10 rounded-xl transition-all opacity-0 group-hover:opacity-100" title="Delete">
                {deleting === doc._id ? <div className="w-4 h-4 border-2 border-[#E74627] border-t-transparent rounded-full animate-spin" /> : <HiOutlineTrash className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

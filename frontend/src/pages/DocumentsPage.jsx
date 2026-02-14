import { useEffect, useState, useCallback, useRef } from 'react';
import { documentsApi, aiApi } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Upload,
  FileText,
  Trash2,
  Loader2,
  BrainCircuit,
  FolderOpen,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function DocumentsPage() {
  const { addToast } = useToast();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [extractingId, setExtractingId] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await documentsApi.list();
      setDocuments(res.data.documents);
    } catch {
      addToast('Failed to load documents', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleUpload = async (file) => {
    if (!file || file.type !== 'application/pdf') {
      addToast('Please upload a PDF file', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      addToast('File size must be under 10 MB', 'error');
      return;
    }
    setUploading(true);
    try {
      await documentsApi.upload(file);
      addToast('Document uploaded successfully!', 'success');
      fetchDocuments();
    } catch (err) {
      addToast(err.response?.data?.error || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await documentsApi.delete(id);
      addToast('Document deleted', 'success');
      setDocuments((prev) => prev.filter((d) => d._id !== id));
    } catch {
      addToast('Failed to delete document', 'error');
    }
  };

  const handleExtractTopics = async (id) => {
    setExtractingId(id);
    try {
      const res = await aiApi.extractTopics({ documentId: id });
      addToast(`Extracted ${res.data.topicNames?.length || 0} topics!`, 'success');
      fetchDocuments();
    } catch (err) {
      addToast(err.response?.data?.error || 'Topic extraction failed', 'error');
    } finally {
      setExtractingId(null);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const onFileInput = (e) => {
    const file = e.target.files[0];
    if (file) handleUpload(file);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Documents</h1>
        <p className="text-muted-foreground mt-1">Upload and manage your study materials</p>
      </div>

      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
              dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={onFileInput}
              className="hidden"
              disabled={uploading}
            />
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-medium mb-1">
              {uploading ? 'Uploading...' : 'Drag & drop a PDF here'}
            </p>
            <p className="text-xs text-muted-foreground mb-4">or click to browse (max 10 MB)</p>
            <span className="inline-flex items-center justify-center h-9 px-3 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
              {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Choose File
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Document List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-5 w-3/4 mb-3" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <FolderOpen className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No documents yet</p>
            <p className="text-sm text-muted-foreground">Upload your first PDF to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((doc) => (
            <Card key={doc._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <FileText className="h-6 w-6 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{doc.originalName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(doc.uploadedAt)}
                      {doc.fileSize && ` · ${(doc.fileSize / 1024 / 1024).toFixed(1)} MB`}
                    </p>
                    {doc.extractedTopics?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {doc.extractedTopics.slice(0, 4).map((topic) => (
                          <Badge key={topic} variant="secondary" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                        {doc.extractedTopics.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{doc.extractedTopics.length - 4}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleExtractTopics(doc._id)}
                      disabled={extractingId === doc._id}
                      title="Extract Topics"
                    >
                      {extractingId === doc._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <BrainCircuit className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(doc._id)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

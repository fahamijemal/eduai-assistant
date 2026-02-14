import { useEffect, useState, useRef } from 'react';
import { documentsApi, aiApi } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Send,
  Loader2,
  Bot,
  User,
  FileText,
  GitCompare,
  BookOpen,
  MessageSquare,
} from 'lucide-react';

export default function AIAssistantPage() {
  const { addToast } = useToast();
  const [documents, setDocuments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('chat');
  const messagesEndRef = useRef(null);

  // Compare state
  const [docA, setDocA] = useState('');
  const [docB, setDocB] = useState('');
  const [comparePrompt, setComparePrompt] = useState('');
  const [compareResult, setCompareResult] = useState('');

  // Summarize state
  const [summaryDoc, setSummaryDoc] = useState('');
  const [summaryResult, setSummaryResult] = useState('');

  useEffect(() => {
    documentsApi.list().then((res) => setDocuments(res.data.documents)).catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleDocToggle = (docId) => {
    setSelectedDocs((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId],
    );
  };

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim() || selectedDocs.length === 0) {
      addToast('Select at least one document and type a question', 'error');
      return;
    }

    const userMsg = { role: 'user', content: question };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion('');
    setLoading(true);

    try {
      const res = await aiApi.ask({ documentIds: selectedDocs, question: userMsg.content });
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.data.answer,
          responseTime: res.data.responseTimeMs,
        },
      ]);
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to get answer', 'error');
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async (e) => {
    e.preventDefault();
    if (!docA || !docB) {
      addToast('Select two documents to compare', 'error');
      return;
    }
    setLoading(true);
    setCompareResult('');
    try {
      const res = await aiApi.compareDocuments({
        documentIdA: docA,
        documentIdB: docB,
        prompt: comparePrompt,
      });
      setCompareResult(res.data.comparison);
    } catch (err) {
      addToast(err.response?.data?.error || 'Comparison failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (!summaryDoc) {
      addToast('Select a document to summarize', 'error');
      return;
    }
    setLoading(true);
    setSummaryResult('');
    try {
      const res = await aiApi.summarize({ documentId: summaryDoc });
      setSummaryResult(res.data.summary);
    } catch (err) {
      addToast(err.response?.data?.error || 'Summarization failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Assistant</h1>
        <p className="text-muted-foreground mt-1">Ask questions, compare documents, and get summaries</p>
      </div>

      <Tabs defaultValue="chat" value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="chat">
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="compare">
            <GitCompare className="h-4 w-4 mr-2" />
            Compare
          </TabsTrigger>
          <TabsTrigger value="summarize">
            <BookOpen className="h-4 w-4 mr-2" />
            Summarize
          </TabsTrigger>
        </TabsList>

        {/* Chat Tab */}
        <TabsContent value="chat">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Document Selector */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Select Documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {documents.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No documents uploaded</p>
                ) : (
                  documents.map((doc) => (
                    <label
                      key={doc._id}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary cursor-pointer text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDocs.includes(doc._id)}
                        onChange={() => handleDocToggle(doc._id)}
                        className="rounded"
                      />
                      <FileText className="h-4 w-4 text-red-500 shrink-0" />
                      <span className="truncate">{doc.originalName}</span>
                    </label>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Chat Area */}
            <Card className="lg:col-span-3">
              <CardContent className="p-0 flex flex-col h-[500px]">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <Bot className="h-12 w-12 text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground">
                        Select documents and ask a question to start learning
                      </p>
                    </div>
                  )}
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        {msg.responseTime && (
                          <p className="text-xs opacity-60 mt-1">
                            {(msg.responseTime / 1000).toFixed(1)}s
                          </p>
                        )}
                      </div>
                      {msg.role === 'user' && (
                        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  ))}
                  {loading && (
                    <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                      <div className="bg-secondary rounded-2xl px-4 py-2.5">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleAsk} className="border-t p-4 flex gap-2">
                  <Input
                    placeholder="Ask a question about your documents..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    disabled={loading}
                  />
                  <Button type="submit" size="icon" disabled={loading}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Compare Tab */}
        <TabsContent value="compare">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Document A</label>
                  <Select value={docA} onChange={(e) => setDocA(e.target.value)}>
                    <option value="">Select document...</option>
                    {documents.map((doc) => (
                      <option key={doc._id} value={doc._id}>{doc.originalName}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Document B</label>
                  <Select value={docB} onChange={(e) => setDocB(e.target.value)}>
                    <option value="">Select document...</option>
                    {documents.map((doc) => (
                      <option key={doc._id} value={doc._id}>{doc.originalName}</option>
                    ))}
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Comparison Focus (optional)</label>
                <Input
                  placeholder="e.g., Compare Chapter 3 from both notes"
                  value={comparePrompt}
                  onChange={(e) => setComparePrompt(e.target.value)}
                />
              </div>
              <Button onClick={handleCompare} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Compare Documents
              </Button>
              {compareResult && (
                <div className="mt-4 p-4 rounded-lg bg-secondary">
                  <p className="whitespace-pre-wrap text-sm">{compareResult}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Summarize Tab */}
        <TabsContent value="summarize">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Document</label>
                <Select value={summaryDoc} onChange={(e) => setSummaryDoc(e.target.value)}>
                  <option value="">Select document...</option>
                  {documents.map((doc) => (
                    <option key={doc._id} value={doc._id}>{doc.originalName}</option>
                  ))}
                </Select>
              </div>
              <Button onClick={handleSummarize} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Summary
              </Button>
              {summaryResult && (
                <div className="mt-4 p-4 rounded-lg bg-secondary">
                  <p className="whitespace-pre-wrap text-sm">{summaryResult}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useEffect, useState, useRef } from 'react';
import { documentsApi, aiApi } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BrainCircuit,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  Trophy,
  RotateCcw,
} from 'lucide-react';

export default function QuizzesPage() {
  const { addToast } = useToast();
  const [documents, setDocuments] = useState([]);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [count, setCount] = useState(5);

  const [phase, setPhase] = useState('setup'); // setup | quiz | results
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const timerRef = useRef(null);
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    documentsApi.list().then((res) => setDocuments(res.data.documents)).catch(() => {});
  }, []);

  useEffect(() => {
    if (phase === 'quiz' && startTime) {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [phase, startTime]);

  const handleDocToggle = (id) => {
    setSelectedDocs((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleGenerate = async () => {
    if (selectedDocs.length === 0) {
      addToast('Select at least one document', 'error');
      return;
    }
    setGenerating(true);
    try {
      const res = await aiApi.generateQuiz({
        documentIds: selectedDocs,
        topic: topic || undefined,
        difficulty,
        count,
      });
      setQuestions(res.data.questions);
      setAnswers([]);
      setCurrentQ(0);
      setPhase('quiz');
      setStartTime(Date.now());
      setElapsed(0);
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to generate quiz', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleAnswer = (option) => {
    const letter = option.charAt(0);
    const q = questions[currentQ];
    const newAnswers = [
      ...answers,
      {
        questionIndex: currentQ,
        selectedAnswer: letter,
        correctAnswer: q.correctAnswer,
        topic: q.topic || topic || 'General',
        responseTimeMs: Date.now() - startTime - elapsed * 1000 + elapsed * 1000,
      },
    ];
    setAnswers(newAnswers);

    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      submitQuiz(newAnswers);
    }
  };

  const submitQuiz = async (finalAnswers) => {
    clearInterval(timerRef.current);
    setSubmitting(true);
    try {
      const res = await aiApi.submitQuiz({
        topic: topic || questions[0]?.topic || 'General',
        difficulty,
        timeSpent: elapsed,
        answers: finalAnswers,
      });
      setResult(res.data);
      setPhase('results');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to submit quiz', 'error');
      setPhase('results');
      setResult({
        score: Math.round(
          (finalAnswers.filter((a) => a.selectedAnswer === a.correctAnswer).length /
            finalAnswers.length) *
            100,
        ),
        correctCount: finalAnswers.filter((a) => a.selectedAnswer === a.correctAnswer).length,
        totalQuestions: finalAnswers.length,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetQuiz = () => {
    setPhase('setup');
    setQuestions([]);
    setAnswers([]);
    setCurrentQ(0);
    setResult(null);
    setStartTime(null);
    setElapsed(0);
  };

  const formatTimer = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ── SETUP PHASE ──────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Adaptive Quizzes</h1>
          <p className="text-muted-foreground mt-1">AI-generated quizzes that target your weak areas</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Generate Quiz</CardTitle>
            <CardDescription>Select documents and configure your quiz</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Documents</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {documents.map((doc) => (
                  <label
                    key={doc._id}
                    className="flex items-center gap-2 p-3 rounded-lg border hover:bg-secondary cursor-pointer text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDocs.includes(doc._id)}
                      onChange={() => handleDocToggle(doc._id)}
                    />
                    {doc.originalName}
                  </label>
                ))}
              </div>
              {documents.length === 0 && (
                <p className="text-sm text-muted-foreground">Upload documents first</p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Topic (optional)</label>
                <Input
                  placeholder="Auto-detect from weak areas"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Difficulty</label>
                <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Questions</label>
                <Select value={count} onChange={(e) => setCount(Number(e.target.value))}>
                  <option value={3}>3 Questions</option>
                  <option value={5}>5 Questions</option>
                  <option value={10}>10 Questions</option>
                </Select>
              </div>
            </div>
            <Button onClick={handleGenerate} disabled={generating} className="w-full md:w-auto">
              {generating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <BrainCircuit className="mr-2 h-4 w-4" />
              )}
              Generate Quiz
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── QUIZ PHASE ───────────────────────────────────────
  if (phase === 'quiz') {
    const q = questions[currentQ];
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Quiz in Progress</h1>
            <p className="text-sm text-muted-foreground">
              Question {currentQ + 1} of {questions.length}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline">
              <Clock className="h-3 w-3 mr-1" />
              {formatTimer(elapsed)}
            </Badge>
            <Badge variant={difficulty === 'hard' ? 'destructive' : difficulty === 'easy' ? 'success' : 'default'}>
              {difficulty}
            </Badge>
          </div>
        </div>

        <Progress value={((currentQ + 1) / questions.length) * 100} />

        <Card>
          <CardContent className="p-6">
            <p className="text-lg font-medium mb-6">{q?.question}</p>
            <div className="space-y-3">
              {q?.options?.map((option, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(option)}
                  disabled={submitting}
                  className="w-full text-left p-4 rounded-lg border hover:bg-primary/5 hover:border-primary transition-colors cursor-pointer"
                >
                  <span className="text-sm">{option}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── RESULTS PHASE ────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardContent className="p-8 text-center">
          <Trophy
            className={`h-16 w-16 mx-auto mb-4 ${
              (result?.score || 0) >= 70 ? 'text-yellow-500' : 'text-muted-foreground'
            }`}
          />
          <h1 className="text-3xl font-bold mb-2">Quiz Complete!</h1>
          <p className="text-5xl font-bold text-primary mb-4">{result?.score || 0}%</p>
          <p className="text-muted-foreground">
            {result?.correctCount || 0} of {result?.totalQuestions || 0} correct
            {elapsed > 0 && ` · ${formatTimer(elapsed)}`}
          </p>
        </CardContent>
      </Card>

      {/* Question Review */}
      <div className="space-y-3">
        {questions.map((q, i) => {
          const userAnswer = answers[i];
          const isCorrect = userAnswer?.selectedAnswer === q.correctAnswer;
          return (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {isCorrect ? (
                    <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{q.question}</p>
                    {!isCorrect && (
                      <p className="text-xs text-destructive mt-1">
                        Your answer: {userAnswer?.selectedAnswer} | Correct: {q.correctAnswer}
                      </p>
                    )}
                    {q.explanation && (
                      <p className="text-xs text-muted-foreground mt-1">{q.explanation}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Mastery Updates */}
      {result?.masteryUpdates?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mastery Updated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {result.masteryUpdates.map((m) => (
                <div key={m.topic} className="flex items-center justify-between">
                  <span className="text-sm">{m.topic}</span>
                  <div className="flex items-center gap-2">
                    <Progress value={m.accuracy} className="w-24 h-2" />
                    <span className="text-sm font-medium w-12 text-right">{m.accuracy}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Button onClick={resetQuiz} className="w-full">
        <RotateCcw className="mr-2 h-4 w-4" />
        Take Another Quiz
      </Button>
    </div>
  );
}

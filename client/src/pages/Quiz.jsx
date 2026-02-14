import { useState } from 'react';
import { aiAPI } from '../services/api';
import DocumentSelector from '../components/DocumentSelector';
import toast from 'react-hot-toast';
import { HiOutlineAcademicCap, HiOutlineSparkles, HiOutlineRefresh, HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi';

export default function Quiz() {
  const [documentId, setDocumentId] = useState('');
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!documentId) { toast.error('Please select a document'); return; }
    setLoading(true); setQuiz(null); setAnswers({}); setShowResults(false);
    try { const res = await aiAPI.generateQuiz(documentId); setQuiz(res.data.quiz); toast.success('Quiz generated!'); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed to generate quiz'); }
    finally { setLoading(false); }
  };

  const selectAnswer = (qi, ai) => { if (!showResults) setAnswers((p) => ({ ...p, [qi]: ai })); };
  const score = quiz ? quiz.questions.filter((q, i) => answers[i] === q.correctAnswer).length : 0;
  const allAnswered = quiz ? Object.keys(answers).length === quiz.questions.length : false;
  const pct = quiz ? Math.round((score / quiz.questions.length) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#EFEBE9] dark:bg-[#7D2817]/15 rounded-xl flex items-center justify-center">
          <HiOutlineAcademicCap className="w-5 h-5 text-[#7D2817] dark:text-[#fdba74]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#1c1917] dark:text-white">Quiz Generator</h1>
          <p className="text-xs text-[#a8a29e] dark:text-[#78716c] mt-0.5">Test your knowledge with AI-generated quizzes</p>
        </div>
      </div>

      <div className="card p-6 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-[#78716c] dark:text-[#a8a29e] mb-2">Select Document</label>
          <DocumentSelector value={documentId} onChange={setDocumentId} />
        </div>
        <button onClick={handleGenerate} disabled={loading || !documentId} className="btn-primary">
          {loading ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating...</>) : (<><HiOutlineSparkles className="w-4 h-4" />Generate Quiz</>)}
        </button>
      </div>

      {loading && (
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#EFEBE9] dark:bg-[#7D2817]/15 rounded-lg flex items-center justify-center"><div className="w-4 h-4 border-2 border-[#F18F2E] border-t-transparent rounded-full animate-spin" /></div>
            <div><p className="text-sm font-medium text-[#1c1917] dark:text-white">Generating quiz...</p><p className="text-[11px] text-[#a8a29e] dark:text-[#78716c] mt-0.5">This may take a moment</p></div>
          </div>
        </div>
      )}

      {quiz && !loading && (
        <div className="space-y-4 stagger-children">
          {quiz.questions.map((q, qi) => {
            const answered = answers[qi] !== undefined;
            const isCorrect = answered && answers[qi] === q.correctAnswer;
            return (
              <div key={qi} className="card p-5">
                <div className="flex items-start gap-3 mb-4">
                  <span className="w-7 h-7 bg-[#FFF3E0] dark:bg-[#F18F2E]/10 text-[#F18F2E] rounded-lg text-xs font-bold flex items-center justify-center flex-shrink-0">{qi + 1}</span>
                  <p className="text-sm font-semibold text-[#1c1917] dark:text-white leading-relaxed">{q.question}</p>
                </div>
                <div className="grid gap-2 ml-10">
                  {q.options.map((opt, oi) => {
                    const isSelected = answers[qi] === oi;
                    const isThisCorrect = showResults && oi === q.correctAnswer;
                    const isThisWrong = showResults && isSelected && !isCorrect;
                    let cls = 'p-3 rounded-xl text-xs font-medium transition-all cursor-pointer border ';
                    if (isThisCorrect) cls += 'bg-[#E8F5E9] dark:bg-emerald-500/10 border-emerald-400/40 text-emerald-700 dark:text-emerald-400';
                    else if (isThisWrong) cls += 'bg-[#FFEBEE] dark:bg-red-500/10 border-red-400/40 text-red-700 dark:text-red-400';
                    else if (isSelected) cls += 'bg-[#FFF3E0] dark:bg-[#F18F2E]/10 border-[#F18F2E]/40 text-[#F18F2E]';
                    else cls += 'bg-[#f5f4f2] dark:bg-[#111110] border-[#e8e5e0] dark:border-[#252423] text-[#78716c] dark:text-[#a8a29e] hover:border-[#F18F2E]/40 hover:text-[#F18F2E]';
                    return (
                      <button key={oi} onClick={() => selectAnswer(qi, oi)} className={cls}>
                        <span className="flex items-center gap-2">
                          {showResults && isThisCorrect && <HiOutlineCheckCircle className="w-4 h-4" />}
                          {showResults && isThisWrong && <HiOutlineXCircle className="w-4 h-4" />}
                          {opt}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="flex items-center gap-3">
            {!showResults && (
              <button onClick={() => setShowResults(true)} disabled={!allAnswered} className="btn-primary">
                <HiOutlineCheckCircle className="w-4 h-4" />Submit Answers
              </button>
            )}
            {showResults && (
              <button onClick={handleGenerate} className="btn-primary"><HiOutlineRefresh className="w-4 h-4" />New Quiz</button>
            )}
          </div>

          {showResults && (
            <div className="card p-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#a8a29e] dark:text-[#78716c] uppercase tracking-wider mb-1">Your Score</p>
                  <p className="text-3xl font-bold text-[#1c1917] dark:text-white">{score}/{quiz.questions.length}</p>
                  <p className="text-sm text-[#a8a29e] dark:text-[#78716c] mt-1">{pct >= 80 ? 'Excellent work!' : pct >= 60 ? 'Good job!' : 'Keep studying!'}</p>
                </div>
                <div className="w-16 h-16 bg-[#F18F2E] rounded-2xl flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{pct}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

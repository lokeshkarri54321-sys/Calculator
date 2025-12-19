
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CalcMode, CalculationRecord, AiResponse } from './types';
import { solveMathProblem } from './services/geminiService';
import * as math from 'mathjs';

const App: React.FC = () => {
  const [mode, setMode] = useState<CalcMode>('standard');
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('');
  const [history, setHistory] = useState<CalculationRecord[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiExplain, setAiExplain] = useState<AiResponse | null>(null);
  
  // Ref for the AI input to handle focus
  const aiInputRef = useRef<HTMLTextAreaElement>(null);

  const handleClear = () => {
    setExpression('');
    setResult('');
    setAiExplain(null);
  };

  const handleBackspace = () => {
    setExpression(prev => prev.slice(0, -1));
  };

  const addToExpression = (val: string) => {
    setExpression(prev => prev + val);
  };

  const calculate = useCallback(() => {
    if (!expression) return;
    try {
      // Use mathjs for safe evaluation of expressions
      const res = math.evaluate(expression);
      const resStr = String(res);
      setResult(resStr);
      
      const newRecord: CalculationRecord = {
        id: crypto.randomUUID(),
        expression,
        result: resStr,
        timestamp: Date.now(),
      };
      setHistory(prev => [newRecord, ...prev].slice(0, 50));
    } catch (err) {
      setResult('Error');
    }
  }, [expression]);

  const handleAiSolve = async () => {
    if (!expression.trim()) return;
    setIsAiLoading(true);
    setAiExplain(null);
    
    try {
      const aiRes = await solveMathProblem(expression);
      setAiExplain(aiRes);
      setResult(aiRes.answer);
      
      const newRecord: CalculationRecord = {
        id: crypto.randomUUID(),
        expression,
        result: aiRes.answer,
        timestamp: Date.now(),
        isAi: true,
        explanation: aiRes.explanation
      };
      setHistory(prev => [newRecord, ...prev].slice(0, 50));
    } catch (error) {
      setResult('AI Error');
    } finally {
      setIsAiLoading(false);
    }
  };

  const onKeyPress = useCallback((e: KeyboardEvent) => {
    if (mode === 'ai') return; // Don't override AI text input
    
    if (e.key >= '0' && e.key <= '9') addToExpression(e.key);
    if (['+', '-', '*', '/', '(', ')', '.', '^'].includes(e.key)) addToExpression(e.key);
    if (e.key === 'Enter') calculate();
    if (e.key === 'Backspace') handleBackspace();
    if (e.key === 'Escape') handleClear();
  }, [calculate, mode]);

  useEffect(() => {
    window.addEventListener('keydown', onKeyPress);
    return () => window.removeEventListener('keydown', onKeyPress);
  }, [onKeyPress]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 md:p-8">
      {/* Header */}
      <div className="w-full max-w-4xl mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Gemini</span>
            Calculator
          </h1>
          <p className="text-slate-400 text-sm">Traditional precision meets AI intelligence.</p>
        </div>
        
        <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
          {(['standard', 'scientific', 'ai'] as CalcMode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); handleClear(); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === m 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Calculator Body */}
        <div className="lg:col-span-7 bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
          {/* Display Area */}
          <div className="p-6 bg-slate-900/50 border-b border-slate-700 min-h-[160px] flex flex-col justify-end items-end gap-2 text-right">
            <div className="text-slate-500 text-lg math-font break-all">
              {expression || '0'}
            </div>
            <div className="text-5xl font-bold text-blue-400 math-font truncate w-full">
              {isAiLoading ? (
                <span className="flex items-center justify-end gap-2 text-2xl">
                  <i className="fas fa-spinner fa-spin text-blue-500"></i>
                  Gemini is thinking...
                </span>
              ) : (
                result || '0'
              )}
            </div>
          </div>

          {/* Controls Area */}
          <div className="p-6">
            {mode === 'ai' ? (
              <div className="flex flex-col gap-4">
                <textarea
                  ref={aiInputRef}
                  value={expression}
                  onChange={(e) => setExpression(e.target.value)}
                  placeholder="Type a word problem, e.g., 'If a car travels 60 miles in 1.5 hours, what is its average speed?'"
                  className="w-full h-40 bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none placeholder:text-slate-600"
                />
                <button
                  onClick={handleAiSolve}
                  disabled={isAiLoading || !expression}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <i className="fas fa-magic"></i>
                  Ask Gemini
                </button>
                
                {aiExplain && (
                  <div className="mt-4 p-4 bg-slate-900/80 border border-blue-500/30 rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <h3 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
                      <i className="fas fa-info-circle"></i> Explanation
                    </h3>
                    <p className="text-slate-300 text-sm mb-4 leading-relaxed">{aiExplain.explanation}</p>
                    <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Steps Taken:</h4>
                    <ul className="space-y-2">
                      {aiExplain.steps.map((step, idx) => (
                        <li key={idx} className="flex gap-3 text-sm text-slate-300">
                          <span className="text-blue-500 font-bold">{idx + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {/* Mode-specific scientific buttons */}
                {mode === 'scientific' && (
                  <>
                    <CalcButton label="sin" onClick={() => addToExpression('sin(')} variant="special" />
                    <CalcButton label="cos" onClick={() => addToExpression('cos(')} variant="special" />
                    <CalcButton label="tan" onClick={() => addToExpression('tan(')} variant="special" />
                    <CalcButton label="log" onClick={() => addToExpression('log10(')} variant="special" />
                    <CalcButton label="ln" onClick={() => addToExpression('log(')} variant="special" />
                    <CalcButton label="√" onClick={() => addToExpression('sqrt(')} variant="special" />
                    <CalcButton label="^" onClick={() => addToExpression('^')} variant="special" />
                    <CalcButton label="π" onClick={() => addToExpression('pi')} variant="special" />
                  </>
                )}

                <CalcButton label="AC" onClick={handleClear} variant="danger" />
                <CalcButton label="(" onClick={() => addToExpression('(')} variant="operator" />
                <CalcButton label=")" onClick={() => addToExpression(')')} variant="operator" />
                <CalcButton label="/" onClick={() => addToExpression('/')} variant="operator" icon="fa-divide" />

                <CalcButton label="7" onClick={() => addToExpression('7')} />
                <CalcButton label="8" onClick={() => addToExpression('8')} />
                <CalcButton label="9" onClick={() => addToExpression('9')} />
                <CalcButton label="×" onClick={() => addToExpression('*')} variant="operator" icon="fa-times" />

                <CalcButton label="4" onClick={() => addToExpression('4')} />
                <CalcButton label="5" onClick={() => addToExpression('5')} />
                <CalcButton label="6" onClick={() => addToExpression('6')} />
                <CalcButton label="-" onClick={() => addToExpression('-')} variant="operator" icon="fa-minus" />

                <CalcButton label="1" onClick={() => addToExpression('1')} />
                <CalcButton label="2" onClick={() => addToExpression('2')} />
                <CalcButton label="3" onClick={() => addToExpression('3')} />
                <CalcButton label="+" onClick={() => addToExpression('+')} variant="operator" icon="fa-plus" />

                <CalcButton label="0" onClick={() => addToExpression('0')} span2 />
                <CalcButton label="." onClick={() => addToExpression('.')} />
                <CalcButton label="=" onClick={calculate} variant="primary" />
              </div>
            )}
          </div>
        </div>

        {/* History Panel */}
        <div className="lg:col-span-5 h-full max-h-[800px] flex flex-col gap-4">
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-3xl p-6 flex flex-col flex-grow overflow-hidden shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center justify-between">
              <span>History</span>
              <button 
                onClick={() => setHistory([])}
                className="text-xs text-slate-500 hover:text-red-400 transition-colors"
              >
                Clear All
              </button>
            </h2>
            <div className="flex-grow overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3">
                  <i className="fas fa-history text-4xl opacity-20"></i>
                  <p className="text-sm">No calculations yet.</p>
                </div>
              ) : (
                history.map((record) => (
                  <div 
                    key={record.id} 
                    className="group bg-slate-900/50 hover:bg-slate-900 p-4 rounded-2xl border border-slate-700/50 transition-all cursor-pointer"
                    onClick={() => {
                      setExpression(record.expression);
                      setResult(record.result);
                    }}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs text-slate-500">
                        {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {record.isAi && (
                        <span className="text-[10px] px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30 uppercase font-bold tracking-tighter">
                          AI SOLVED
                        </span>
                      )}
                    </div>
                    <div className="text-slate-400 text-sm math-font mb-1 truncate group-hover:text-slate-200 transition-colors">
                      {record.expression}
                    </div>
                    <div className="text-lg font-bold text-white math-font text-right">
                      {record.result}
                    </div>
                    {record.explanation && (
                      <div className="mt-2 pt-2 border-t border-slate-700 text-xs text-slate-400 line-clamp-2">
                        {record.explanation}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Quick Tip Card */}
          <div className="bg-gradient-to-br from-indigo-900/40 to-blue-900/40 border border-blue-500/20 rounded-2xl p-4">
            <h4 className="text-blue-300 text-sm font-semibold mb-1 flex items-center gap-2">
              <i className="fas fa-lightbulb"></i> Pro Tip
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Use <span className="text-blue-400 font-mono">AI Mode</span> for complex word problems, unit conversions, or step-by-step calculus explanations.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 text-slate-600 text-xs flex flex-col items-center gap-2">
        <div className="flex gap-4">
          <span className="hover:text-slate-400 transition-colors">Precision Engine: math.js</span>
          <span className="text-slate-800">|</span>
          <span className="hover:text-slate-400 transition-colors">Intelligence: Gemini 3 Pro</span>
        </div>
      </footer>
    </div>
  );
};

interface CalcButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'operator' | 'primary' | 'danger' | 'special';
  icon?: string;
  span2?: boolean;
}

const CalcButton: React.FC<CalcButtonProps> = ({ label, onClick, variant = 'default', icon, span2 }) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'operator':
        return 'bg-slate-700 text-blue-400 hover:bg-slate-600 active:bg-blue-600 active:text-white';
      case 'primary':
        return 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-500/20 shadow-lg active:scale-95';
      case 'danger':
        return 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white';
      case 'special':
        return 'bg-slate-700/50 text-indigo-300 text-xs uppercase font-bold hover:bg-slate-600';
      default:
        return 'bg-slate-800 text-slate-200 hover:bg-slate-700 active:bg-slate-600';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`
        ${span2 ? 'col-span-2' : 'col-span-1'}
        ${getVariantStyles()}
        h-14 md:h-16 rounded-2xl font-bold transition-all duration-150 flex items-center justify-center gap-1
        ${variant === 'special' ? 'text-[10px]' : 'text-xl'}
      `}
    >
      {icon ? <i className={`fas ${icon}`}></i> : label}
    </button>
  );
};

export default App;

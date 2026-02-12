
import React, { useState, useEffect, useRef } from 'react';
import { Constraint, ConstraintType } from './types';
import { generateSeatingChart } from './utils/seatingLogic';
import { 
  RotateCcw, Eye, EyeOff, Trash2, 
  HelpCircle, UserPlus, MinusCircle, ChevronDown, Plus, MousePointer2, Hash, X,
  Download, User, Settings2, BookOpen, Coffee, Heart
} from 'lucide-react';

// --- Donation Modal Component (최종 수정본) ---
const DonationModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 relative flex flex-col items-center" onClick={e => e.stopPropagation()}>
        
        {/* 닫기 버튼 */}
        <button onClick={onClose} className="absolute top-4 right-4 bg-slate-100 p-1 rounded-full text-slate-400 hover:bg-slate-200 transition-colors">
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-slate-800 mt-2 mb-1">개발자에게 커피 쏘기 ☕</h3>
        <p className="text-sm text-slate-500 mb-6 text-center">
          선생님의 따뜻한 커피 한 잔이<br/>
          더 좋은 서비스를 만듭니다!
        </p>

        {/* 1. 카카오페이 QR 코드 영역 (가장 눈에 띄게) */}
        <div className="bg-yellow-400 p-5 rounded-3xl shadow-lg mb-6 w-full flex flex-col items-center transform transition-transform hover:scale-105 duration-300 cursor-pointer" onClick={() => alert('스마트폰 기본 카메라를 켜서 QR코드를 비춰보세요!')}>
          <div className="bg-white p-2 rounded-2xl shadow-sm mb-2 w-full flex justify-center overflow-hidden">
            {/* 실제 파일(kakao_qr.png)이 public 폴더에 있다고 가정하고 이미지 태그 사용 */}
            <img 
              src="/kakao_qr.png" 
              alt="카카오페이 QR 송금 - Secret Seat" 
              className="w-full h-auto max-h-64 object-contain"
            />
          </div>
          <p className="text-yellow-900 font-bold text-sm bg-yellow-300 px-3 py-1 rounded-full">
            📷 카메라만 켜면 3초 완료! (3,900원)
          </p>
        </div>
        
        <p className="text-[10px] text-slate-300 mt-4 text-center">
          * 보내시는 분의 실명은 저에게만 표시되며,<br/> 
          어디에도 공개되지 않습니다. 안심하세요! ❤️
        </p>

      </div>
    </div>
  );
};

// --- UI Components ---
const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'gray' | 'silver' }> = 
  ({ className, variant = 'primary', ...props }) => {
  const baseStyle = "transition-all duration-200 active:scale-95 flex items-center justify-center font-bold disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-[#a5b4fc] text-white hover:bg-[#818cf8] shadow-sm rounded-full px-6 py-2.5", 
    secondary: "bg-blue-500 text-white hover:bg-blue-600 shadow-md rounded-xl px-6 py-3", 
    outline: "bg-white text-blue-500 border border-blue-200 hover:bg-blue-50 rounded-full px-5 py-2",
    danger: "bg-white text-red-500 border border-red-200 hover:bg-red-50 rounded-full px-6 py-2.5",
    silver: "bg-[#cbd5e1] text-white hover:bg-[#94a3b8] rounded-full px-6 py-2.5", 
    ghost: "bg-transparent text-slate-400 hover:text-slate-600 p-1",
    gray: "bg-[#e5e7eb] text-slate-600 hover:bg-[#d1d5db] rounded-xl px-6 py-3",
  };
  
  const finalClass = `${baseStyle} ${variants[variant]} ${className}`;
  return <button className={finalClass} {...props} />;
};

// --- Ad Placeholder Component ---
// 나중에 구글 애드센스 코드로 교체할 때 이 컴포넌트 내부를 수정하면 됩니다.
const AdPlaceholder: React.FC<{ className?: string, text?: string }> = ({ className, text = "광고 영역" }) => {
  return (
    <div className={`bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-300 text-xs font-medium overflow-hidden relative ${className}`}>
       <span className="z-10">{text}</span>
       <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]"></div>
    </div>
  );
};

const App: React.FC = () => {
  // State
  const [rows, setRows] = useState(6);
  const [cols, setCols] = useState(5);
  
  // Student List State (Array based now)
  const [students, setStudents] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');

  const [constraints, setConstraints] = useState<Constraint[]>([]);
  const [disabledIndices, setDisabledIndices] = useState<number[]>([]);
  const [resultChart, setResultChart] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'POSTING' | 'TEACHER'>('POSTING');
  const [secretMode, setSecretMode] = useState(true); 
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSelectingSeat, setIsSelectingSeat] = useState(false);

  // Modals
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showDonation, setShowDonation] = useState(false);

  // New Condition Form State
  const [isAdding, setIsAdding] = useState(false);
  const [newType, setNewType] = useState<ConstraintType>('NEGATION');
  const [newStudentA, setNewStudentA] = useState('');
  const [newStudentB, setNewStudentB] = useState('');
  const [newSeatIdx, setNewSeatIdx] = useState<number | undefined>();

  // Handlers
  const handleAddStudent = () => {
    if (!inputValue.trim()) return;
    setStudents([...students, inputValue.trim()]);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddStudent();
  };

  const handleRemoveStudent = (index: number) => {
    const newStudents = [...students];
    newStudents.splice(index, 1);
    setStudents(newStudents);
  };

  const handleReset = () => {
    // 1. Core Data
    setStudents([]); 
    setConstraints([]); 
    setResultChart([]);
    setDisabledIndices([]);
    
    // 2. Settings & UI State
    setRows(6); 
    setCols(5); 
    setError(null); 
    setIsEditMode(false);
    setInputValue(''); // Clear input field
    setIsGenerating(false); // Stop generation
    setCountdown(null); // Stop countdown

    // 3. Reset Constraint Form State
    setIsAdding(false); 
    setNewType('NEGATION'); 
    setNewStudentA(''); 
    setNewStudentB(''); 
    setNewSeatIdx(undefined); 
    setIsSelectingSeat(false);
    
    // 4. View Reset
    setViewMode('POSTING');
    setSecretMode(true);
  };

  const handleNumberFill = () => {
    const availableCount = (rows * cols) - disabledIndices.length;
    if (availableCount <= 0) {
      setError('배치 가능한 자리가 없습니다.');
      return;
    }
    const numbers = Array.from({ length: availableCount }, (_, i) => `${i + 1}`);
    setStudents(numbers);
    setResultChart([]);
    setError(null);
  };

  const handleRegisterCondition = () => {
    if (!newStudentA) { alert('학생을 선택해주세요.'); return; }
    const newConstraint: Constraint = {
      type: newType,
      studentA: newStudentA,
      studentB: (newType === 'NEGATION' || newType === 'TOGETHER') ? newStudentB : undefined,
      seatIndex: newType === 'FIXED_SEAT' ? newSeatIdx : undefined,
    };
    setConstraints([...constraints, newConstraint]);
    resetForm();
  };

  const resetForm = () => {
    setIsAdding(false); setNewStudentA(''); setNewStudentB(''); 
    setNewSeatIdx(undefined); setIsSelectingSeat(false);
  };

  const startGeneration = () => {
    if (students.length === 0) { setError('학생 명단을 입력해주세요.'); return; }
    const maxSeats = (rows * cols) - disabledIndices.length;
    if (students.length > maxSeats) { setError(`자리가 부족합니다 (가용:${maxSeats}석)`); return; }
    setError(null); setIsGenerating(true); setCountdown(3); setIsEditMode(false);
  };

  const handleDownloadHWP = () => {
    if (resultChart.length === 0) return;

    // --- HTML Template for HWP ---
    const tableStyle = `
      border-collapse: collapse; 
      width: 100%; 
      text-align: center; 
      margin: 0 auto;
    `;
    
    // Calculate percentage width for columns to ensure they are evenly distributed
    const colWidth = 100 / cols;

    const cellStyle = `
      border: 1px solid #000; 
      height: 80px; 
      font-size: 16pt; 
      font-weight: bold;
      font-family: 'Malgun Gothic', 'Batang', sans-serif;
      vertical-align: middle;
      text-align: center;
      width: ${colWidth}%;
    `;
    const containerStyle = `
      text-align: center; 
      font-family: 'Malgun Gothic', 'Batang', sans-serif;
      padding: 20px;
    `;
    const titleStyle = `
      font-size: 24pt; 
      font-weight: bold; 
      margin-bottom: 20px; 
      text-decoration: underline;
    `;
    const deskStyle = `
      border: 1px solid black; 
      display: inline-block; 
      padding: 10px 40px; 
      font-size: 16pt; 
      font-weight: bold;
      margin: 20px auto;
      text-align: center;
    `;

    // Function to generate table rows
    const buildTableRows = (isReversed: boolean) => {
      let html = '';
      for (let r = 0; r < rows; r++) {
        html += '<tr>';
        for (let c = 0; c < cols; c++) {
          let idx;
          if (isReversed) {
             // Teacher view: visually rotated 180 degrees
             // This corresponds to reading the array from the end
             idx = (rows * cols) - 1 - (r * cols + c);
          } else {
             // Posting view: standard order
             idx = r * cols + c;
          }
          
          const isMissed = disabledIndices.includes(idx);
          const name = resultChart[idx] || '';
          const content = isMissed ? 'X' : name;
          
          html += `<td align="center" style="${cellStyle}">${content}</td>`;
        }
        html += '</tr>';
      }
      return html;
    };

    let contentBody = '';

    if (viewMode === 'POSTING') {
      contentBody = `
        <div style="${titleStyle}">자리배치도 (게시용)</div>
        <br/>
        <div align="center"><div style="${deskStyle}">교 탁</div></div>
        <br/><br/>
        <table border="1" cellspacing="0" cellpadding="0" style="${tableStyle}">
          ${buildTableRows(false)}
        </table>
      `;
    } else {
      contentBody = `
        <div style="${titleStyle}">자리배치도 (교탁용)</div>
        <br/><br/>
        <table border="1" cellspacing="0" cellpadding="0" style="${tableStyle}">
          ${buildTableRows(true)}
        </table>
        <br/>
        <div align="center"><div style="${deskStyle}">교 탁</div></div>
      `;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>자리배치도</title>
      </head>
      <body style="${containerStyle}">
        ${contentBody}
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/vnd.hancom.hwp' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `자리배치도_${viewMode === 'POSTING' ? '게시용' : '교탁용'}_${new Date().toLocaleDateString()}.hwp`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (countdown === 0) {
      setTimeout(() => {
        const result = generateSeatingChart(students, constraints, rows, cols, disabledIndices);
        if (result.success) setResultChart(result.chart); else setError(result.error);
        setIsGenerating(false); setCountdown(null);
      }, 100);
    } else if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, students, constraints, rows, cols, disabledIndices]);

  return (
    <div className="min-h-screen bg-[#f0f9ff] font-sans text-slate-800 pb-20 selection:bg-blue-100 flex flex-col">
      
      {/* --- Top Area --- */}
      <div className="text-center pt-10 pb-6 px-4 relative">
        <h1 className="text-4xl md:text-5xl font-black text-[#1e3a8a] mb-8 tracking-tight">
          시크릿 <span className="text-blue-500">{rows * cols}자리</span> 뽑기
        </h1>

        {/* View Mode Toggle */}
        <div className="flex justify-center mb-8">
           <div className="inline-flex bg-white p-1 rounded-lg border border-blue-100 shadow-sm">
             <button onClick={() => setViewMode('POSTING')} className={`px-6 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'POSTING' ? 'bg-[#3b82f6] text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>게시용</button>
             <button onClick={() => setViewMode('TEACHER')} className={`px-6 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'TEACHER' ? 'bg-[#3b82f6] text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>교탁용</button>
           </div>
        </div>
        
        {/* Sliders Card */}
        <div className="max-w-xl mx-auto bg-white rounded-[2rem] shadow-sm border border-blue-50 px-8 py-6 mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="w-16 font-bold text-blue-600 text-sm whitespace-nowrap">열 {cols}개</span>
              <input type="range" min="2" max="8" value={cols} onChange={e=>setCols(Number(e.target.value))} className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-500" />
            </div>
            <div className="flex items-center gap-4">
              <span className="w-16 font-bold text-blue-600 text-sm whitespace-nowrap">행 {rows}개</span>
              <input type="range" min="2" max="8" value={rows} onChange={e=>setRows(Number(e.target.value))} className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-500" />
            </div>
          </div>
        </div>

        {/* Action Buttons Area - Custom Styles matching the request */}
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 mb-8">
          {/* 1. Missing Seat Settings */}
          <button 
            onClick={() => {
              setIsEditMode(!isEditMode);
              setIsSelectingSeat(false); // Disable seat selection when entering edit mode to avoid conflict
            }} 
            className={`px-8 py-3 rounded-full font-bold text-sm transition-all border-2 
              ${isEditMode 
                ? 'bg-blue-50 border-blue-400 text-blue-600 shadow-inner' 
                : 'bg-white border-blue-200 text-blue-500 hover:bg-blue-50 hover:border-blue-300'
              }`}
          >
            {isEditMode ? '설정 완료' : '없는 자리 설정'}
          </button>
          
          {/* 2. Pick Seats (Large Circular Button) */}
          <button 
            onClick={startGeneration} 
            disabled={students.length === 0}
            className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-300 to-indigo-500 text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all font-black text-xl flex items-center justify-center z-10 mx-2 border-4 border-white ring-4 ring-blue-50 disabled:opacity-50 disabled:grayscale"
          >
             자리 뽑기!
          </button>
          
          {/* 3. Reset Button */}
          <button 
            onClick={handleReset} 
            className="px-8 py-3 rounded-full font-bold text-sm transition-all bg-white border-2 border-slate-800 text-red-500 hover:bg-red-50 flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> 초기화
          </button>
          
          {/* 4. HWP Download Button */}
          <button 
            onClick={handleDownloadHWP}
            disabled={resultChart.length === 0}
            className={`px-8 py-3 rounded-full font-bold text-sm transition-all flex items-center gap-2 shadow-md
              ${resultChart.length > 0 
                ? 'bg-[#a5b4fc] text-white hover:bg-[#818cf8]' // Active: Periwinkle/Purple
                : 'bg-slate-200 text-slate-400 cursor-not-allowed' // Disabled: Gray
              }`}
          >
            <Download className="w-4 h-4" /> HWP 다운로드 ({viewMode === 'POSTING' ? '게시용' : '교탁용'})
          </button>
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-6 mb-20">
        
        {/* --- Left Column: Student List --- */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 h-[600px] flex flex-col">
            <h2 className="text-lg font-bold text-blue-600 mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5"/> 학생 명단 ({students.length})
            </h2>
            
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="이름 입력"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200 transition-all placeholder:text-slate-400"
              />
              <button 
                onClick={handleAddStudent}
                className="bg-[#3b82f6] text-white rounded-xl w-11 flex items-center justify-center hover:bg-blue-600 transition-colors shadow-sm"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mb-4 space-y-2">
              {students.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-3 opacity-60">
                  <User className="w-12 h-12" />
                  <span className="text-xs">학생을 추가해주세요</span>
                </div>
              ) : (
                students.map((name, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm group hover:border-blue-300 transition-colors">
                    <span className="font-bold text-slate-700 text-sm">{idx + 1}. {name}</span>
                    <button onClick={() => handleRemoveStudent(idx)} className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <button 
              onClick={handleNumberFill} 
              className="w-full py-3 border border-dashed border-blue-300 text-blue-400 rounded-xl text-xs font-bold hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
            >
              <Hash className="w-3.5 h-3.5" /> 번호로 샘플 채우기
            </button>
          </div>
          
          {/* [Ad Space 1] Left Sidebar Bottom */}
          <AdPlaceholder className="h-32 rounded-[1.5rem]" text="광고 영역 (사이드바)" />

          {/* Secret Mode Toggle Area */}
          <div className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-slate-100 flex items-center justify-between">
             <span className="text-xs font-bold text-slate-400 flex items-center gap-2">
               <Settings2 className="w-3.5 h-3.5" /> SECRET MODE
             </span>
             <button onClick={() => setSecretMode(!secretMode)} className="text-slate-400 hover:text-blue-500 transition-colors">
                {secretMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
             </button>
          </div>

          {/* Condition Settings (Visible when Secret Mode is OFF) */}
          {!secretMode && (
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 animate-in fade-in slide-in-from-top-2">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-slate-600">제약 조건 설정</h3>
               </div>
               
               {isAdding ? (
                  <div className="space-y-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                    <div className="flex bg-white rounded-lg p-1 shadow-sm border border-blue-50">
                      {(['NEGATION', 'TOGETHER', 'FIXED_SEAT'] as const).map(type => (
                        <button 
                          key={type} 
                          onClick={() => setNewType(type)}
                          className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${newType === type ? 'bg-blue-500 text-white' : 'text-slate-400 hover:bg-slate-50'}`}
                        >
                          {type === 'NEGATION' ? '따로' : type === 'TOGETHER' ? '함께' : '고정'}
                        </button>
                      ))}
                    </div>

                    <select value={newStudentA} onChange={e => setNewStudentA(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-300">
                        <option value="">학생 선택</option>
                        {students.map(name => <option key={name} value={name}>{name}</option>)}
                    </select>

                    {(newType === 'NEGATION' || newType === 'TOGETHER') && (
                       <select value={newStudentB} onChange={e => setNewStudentB(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-300">
                          <option value="">대상 학생 선택</option>
                          {students.filter(n => n !== newStudentA).map(name => <option key={name} value={name}>{name}</option>)}
                       </select>
                    )}

                    {newType === 'FIXED_SEAT' && (
                      <button 
                        onClick={() => {
                          setIsSelectingSeat(true);
                          setIsEditMode(false); // Force turn off edit mode to prevent conflict
                        }} 
                        className={`w-full py-2 bg-white border rounded-lg text-xs ${newSeatIdx !== undefined ? 'border-blue-400 text-blue-500' : 'border-slate-200 text-slate-400'}`}
                      >
                        {newSeatIdx !== undefined ? `${newSeatIdx + 1}번 자리 선택됨` : '고정석 선택하기'}
                      </button>
                    )}

                    <div className="flex gap-2">
                      <button onClick={resetForm} className="flex-1 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-500">취소</button>
                      <button onClick={handleRegisterCondition} className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-xs font-bold">추가</button>
                    </div>
                  </div>
               ) : (
                  <div className="space-y-2">
                    <button onClick={() => setIsAdding(true)} className="w-full py-3 border border-dashed border-blue-200 rounded-xl text-blue-400 text-xs font-bold hover:bg-blue-50 transition-colors">
                      + 조건 추가하기
                    </button>
                    <div className="max-h-32 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                      {constraints.map((c, i) => (
                        <div key={i} className="flex justify-between items-center bg-white border border-slate-100 px-3 py-2 rounded-lg">
                           <span className="text-xs text-slate-600">
                             <span className={`font-bold mr-1 ${c.type === 'NEGATION' ? 'text-red-400' : 'text-blue-400'}`}>
                               {c.type === 'NEGATION' ? '따로' : c.type === 'TOGETHER' ? '함께' : '고정'}
                             </span>
                             {c.studentA} {c.studentB ? `& ${c.studentB}` : ''}
                           </span>
                           <button onClick={() => setConstraints(constraints.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-red-400"><X className="w-3 h-3"/></button>
                        </div>
                      ))}
                    </div>
                  </div>
               )}
            </div>
          )}
        </div>

        {/* --- Right Column: Seating Grid --- */}
        <div className="lg:col-span-9 flex flex-col gap-6">
          <section className="bg-[#dbeafe] rounded-[2rem] p-8 shadow-inner min-h-[600px] flex flex-col relative overflow-hidden border border-blue-100">
             {/* Overlay for Countdown/Selection */}
            {isGenerating && (
               <div className="absolute inset-0 z-40 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-[2rem]">
                 <div className="text-8xl font-black text-blue-500 animate-pulse">{countdown}</div>
               </div>
            )}
            {isSelectingSeat && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-blue-600 text-white px-6 py-2 rounded-full shadow-lg font-bold text-sm animate-bounce">
                원하는 자리를 클릭하세요!
              </div>
            )}

            {/* Posting Mode - Teacher's Desk at TOP */}
            {viewMode === 'POSTING' && (
              <div className="flex justify-center mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="bg-white text-blue-400 px-12 py-3 rounded-2xl font-bold text-lg shadow-sm tracking-widest border border-blue-100">
                    교 탁
                </div>
              </div>
            )}

            {/* Grid Area */}
            <div className="flex-1 flex items-start justify-center overflow-x-auto overflow-y-auto custom-scrollbar p-4">
               <div className="flex gap-4">
                  {/* Row Numbers (Side) */}
                  <div className="flex flex-col gap-4 pt-2">
                     {/* Row indices can be added here if needed, keeping it simple as per screenshot focus on large cells */}
                  </div>

                  {/* Main Grid */}
                  <div 
                    className="grid gap-4 transition-all duration-700 ease-in-out p-2" 
                    style={{ 
                      gridTemplateColumns: `repeat(${cols}, minmax(160px, 1fr))`, // Increased min-width for landscape feel
                      transform: viewMode === 'TEACHER' ? 'rotate(180deg)' : 'none' 
                    }}
                  >
                    {Array.from({ length: rows * cols }).map((_, idx) => {
                      const name = resultChart[idx];
                      const disabled = disabledIndices.includes(idx);
                      const isBeingSelected = isSelectingSeat && newSeatIdx === idx;
                      
                      return (
                        <div 
                          key={idx} 
                          onClick={() => {
                            if (isEditMode) {
                              setDisabledIndices(disabled ? disabledIndices.filter(i=>i!==idx) : [...disabledIndices, idx]);
                            } else if (isSelectingSeat) {
                              setNewSeatIdx(idx);
                              setIsSelectingSeat(false);
                            }
                          }} 
                          className={`
                            aspect-[16/9] rounded-2xl flex flex-col items-center justify-center p-2 shadow-sm transition-all duration-300 relative select-none
                            ${disabled ? 'bg-slate-100/50 border-2 border-dashed border-slate-200' : 
                              name ? 'bg-white border-[3px] border-blue-100 shadow-md' : 
                              isBeingSelected ? 'bg-blue-50 border-2 border-blue-400 ring-4 ring-blue-200 z-10' :
                              (isEditMode || isSelectingSeat) ? 'bg-white border-2 border-dashed border-blue-300 cursor-pointer hover:bg-blue-50' : 
                              'bg-white border border-transparent'}
                          `}
                          style={{ transform: viewMode === 'TEACHER' ? 'rotate(-180deg)' : 'none' }}
                        >
                          {disabled ? (
                            <span className="text-slate-300 text-5xl font-black opacity-30 select-none">X</span>
                          ) : (
                            <>
                               {/* Name or Placeholder */}
                               {name ? (
                                 <span className="font-bold text-slate-800 text-2xl break-keep text-center leading-tight tracking-tight">
                                   {name}
                                 </span>
                               ) : (
                                 <span className="text-slate-200 text-4xl font-black opacity-20">?</span>
                               )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
               </div>
            </div>

            {/* Teacher Mode - Teacher's Desk at BOTTOM */}
             {viewMode === 'TEACHER' && (
               <div className="flex justify-center mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div className="bg-white text-blue-500 px-12 py-3 rounded-2xl font-bold text-lg shadow-sm border border-blue-100 tracking-widest">
                    교 탁
                 </div>
              </div>
            )}

          </section>

           {/* [Ad Space 2] Below Seating Chart */}
           <AdPlaceholder className="h-24 w-full rounded-[2rem]" text="광고 영역 (가로 배너)" />
        </div>
      </main>

      {/* Floating Guide Button */}
      <button 
        onClick={() => setShowGuide(true)} 
        className="fixed bottom-6 left-6 z-40 bg-white text-blue-600 px-5 py-3 rounded-full shadow-xl border border-blue-100 font-bold text-sm flex items-center gap-2 hover:bg-blue-50 hover:scale-105 active:scale-95 transition-all animate-in slide-in-from-left-6"
      >
        <BookOpen className="w-5 h-5" /> 사용 가이드
      </button>

      {/* Floating Donation Button (Right side) - Opens Modal */}
      <button 
        onClick={() => setShowDonation(true)} 
        className="fixed bottom-6 right-6 z-40 bg-[#FFDD00] text-[#5F4500] px-5 py-3 rounded-full shadow-xl border border-yellow-200 font-bold text-sm flex items-center gap-2 hover:bg-[#ffe135] hover:scale-105 active:scale-95 transition-all animate-in slide-in-from-right-6"
      >
        <Coffee className="w-5 h-5" /> 개발자에게 커피쏘기
      </button>

      {/* Footer */}
      <footer className="mt-auto py-8 text-center border-t border-slate-100 bg-white">
        <div className="flex items-center justify-center gap-6 mb-2">
            <button onClick={() => setShowTerms(true)} className="text-slate-400 hover:text-blue-500 text-xs font-medium">이용약관</button>
            <div className="w-px h-3 bg-slate-200"></div>
            <button onClick={() => setShowPrivacy(true)} className="text-slate-400 hover:text-blue-500 text-xs font-medium">개인정보처리방침</button>
        </div>
        <p className="text-[10px] text-slate-300">© 2024 Class Seat Picker</p>
      </footer>

      {/* Separate Donation Modal Rendering */}
      {showDonation && <DonationModal onClose={() => setShowDonation(false)} />}

      {/* Other Modals (Terms & Privacy & Guide) */}
      {(showTerms || showPrivacy || showGuide) && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" 
          onClick={() => {
            setShowTerms(false); 
            setShowPrivacy(false); 
            setShowGuide(false);
          }}
        >
          <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl p-8 relative animate-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => {
                setShowTerms(false); 
                setShowPrivacy(false); 
                setShowGuide(false);
              }} 
              className="absolute top-6 right-6 text-slate-300 hover:text-slate-500"
            >
              <X className="w-6 h-6" />
            </button>
            
            {showGuide ? (
              <div className="text-slate-800">
                <h3 className="text-2xl font-black text-blue-600 mb-8 flex items-center gap-2 border-b-2 border-blue-100 pb-4">
                  <BookOpen className="w-7 h-7" /> 사용 설명서
                </h3>
                <div className="space-y-10">
                  <div className="space-y-3">
                    <h4 className="flex items-center gap-3 text-lg font-bold text-slate-700">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-black">1</span>
                      교실 구조 (열과 행) 설정
                    </h4>
                    <p className="pl-11 text-slate-600 leading-relaxed text-sm">
                      상단의 <span className="font-bold text-blue-500">슬라이더</span>를 조절하여 우리 반 교실의 가로(열)와 세로(행) 칸 수를 맞춥니다.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="flex items-center gap-3 text-lg font-bold text-slate-700">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-black">2</span>
                      학생 명단 등록
                    </h4>
                    <p className="pl-11 text-slate-600 leading-relaxed text-sm">
                      좌측의 입력창에 학생 이름을 입력하고 <span className="inline-block bg-blue-500 text-white rounded px-1.5 py-0.5 text-xs font-bold">+</span> 버튼을 누르거나, 
                      <span className="font-bold text-blue-500"> '번호로 샘플 채우기'</span> 버튼을 눌러 번호(1, 2, 3...)로 명단을 빠르게 채울 수 있습니다.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="flex items-center gap-3 text-lg font-bold text-slate-700">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-black">3</span>
                      없는 자리 설정
                    </h4>
                    <p className="pl-11 text-slate-600 leading-relaxed text-sm">
                      <span className="font-bold text-blue-500">'없는 자리 설정'</span> 버튼을 누른 후, 화면의 좌석을 클릭하면 해당 자리가 
                      <span className="font-bold text-slate-400"> X 표시</span>와 함께 비활성화됩니다. 다시 클릭하면 해제됩니다. 설정이 끝나면 '설정 완료'를 눌러주세요.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="flex items-center gap-3 text-lg font-bold text-slate-700">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-black">4</span>
                      조건 설정 및 자리 뽑기
                    </h4>
                    <div className="pl-11 text-slate-600 leading-relaxed text-sm space-y-2">
                      <p>좌측 하단의 <span className="font-bold text-slate-500">눈 모양 아이콘</span>(SECRET MODE)을 끄면 제약 조건을 추가할 수 있습니다.</p>
                      <ul className="list-disc pl-5 space-y-1 text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                         <li><span className="text-red-400 font-bold">따로:</span> 두 학생을 떨어뜨려 놓습니다.</li>
                         <li><span className="text-blue-400 font-bold">함께:</span> 두 학생을 짝꿍으로 만듭니다.</li>
                         <li><span className="text-indigo-400 font-bold">고정:</span> 특정 학생을 특정 자리에 고정합니다.</li>
                      </ul>
                      <p className="mt-2">모든 설정이 끝났다면 중앙의 <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600">자리 뽑기!</span> 버튼을 눌러보세요.</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Content for Terms/Privacy
              <>
                <h3 className="text-xl font-black text-slate-800 mb-4">{showTerms ? '이용 약관' : '개인정보 처리방침'}</h3>
                <div className="space-y-3 text-slate-600 text-sm max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                   <p className="leading-relaxed">
                     본 서비스는 서버에 어떠한 데이터도 저장하지 않습니다. 모든 처리 과정은 사용자의 브라우저 내에서 이루어지며, 
                     페이지를 닫으면 데이터는 즉시 삭제됩니다. 안심하고 사용하세요.
                   </p>
                   <p className="leading-relaxed text-xs text-slate-400 mt-4">
                     * 결과물에 대한 책임은 사용자에게 있으며, 본 서비스는 교육 편의를 위해 제공되는 무료 도구입니다.
                   </p>
                </div>
              </>
            )}
            
            <div className="mt-8 flex justify-end border-t border-slate-100 pt-6">
              <button 
                onClick={() => {
                  setShowTerms(false); 
                  setShowPrivacy(false); 
                  setShowGuide(false);
                }} 
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-xl text-sm shadow-md transition-all"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
         <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-full shadow-lg z-50 font-bold text-sm flex items-center gap-3 animate-in slide-in-from-bottom-10">
           <span>⚠️ {error}</span>
           <button onClick={() => setError(null)} className="ml-2 hover:opacity-80"><X className="w-4 h-4"/></button>
         </div>
      )}
    </div>
  );
};

export default App;

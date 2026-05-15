import React, { useState, useEffect, useMemo } from "react";
import { 
  Calculator, 
  Trash2, 
  Download, 
  Info, 
  GraduationCap, 
  RotateCcw,
  BookOpen,
  Filter,
  User,
  Hash,
  School,
  History,
  LayoutDashboard,
  ShieldCheck,
  Award,
  Zap,
  TrendingUp
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  Tooltip as ReTooltip, 
  ResponsiveContainer, 
  Cell,
  LineChart,
  Line
} from "recharts";
import { Course, getLetterAnd4Point, GRADE_SCALE } from "./types";
import { cn } from "./lib/utils";

const STORAGE_KEY = "ftu_gpa_data_v3";
const TRAINING_STORAGE_KEY = "ftu_training_data_v1";

type TrainingRecord = {
  semester: number;
  points: number;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'gpa' | 'training' | 'dashboard'>('gpa');
  const [courses, setCourses] = useState<Course[]>([]);
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>(() => {
    return Array.from({ length: 8 }, (_, i) => ({ semester: i + 1, points: 0 }));
  });
  
  const [newCourse, setNewCourse] = useState({
    code: "",
    name: "",
    credits: 3,
    grade10: 8.5
  });
  
  const [currentSemester, setCurrentSemester] = useState(1);
  const [filterSemester, setFilterSemester] = useState<number | 'all'>('all');

  useEffect(() => {
    const savedCourses = localStorage.getItem(STORAGE_KEY);
    const savedTraining = localStorage.getItem(TRAINING_STORAGE_KEY);
    
    if (savedCourses) {
      try { setCourses(JSON.parse(savedCourses)); } catch (e) { console.error(e); }
    }
    if (savedTraining) {
      try { setTrainingRecords(JSON.parse(savedTraining)); } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem(TRAINING_STORAGE_KEY, JSON.stringify(trainingRecords));
  }, [trainingRecords]);

  const addCourse = () => {
    if (!newCourse.name.trim()) return;
    
    const { letter, gpa } = getLetterAnd4Point(newCourse.grade10);
    const course = {
      id: crypto.randomUUID(),
      code: newCourse.code,
      name: newCourse.name,
      credits: Number(newCourse.credits),
      grade10: Number(newCourse.grade10),
      letterGrade: letter,
      grade4: gpa,
      semester: currentSemester
    };

    setCourses([...courses, course as any]);
    setNewCourse({ ...newCourse, code: "", name: "" });
  };

  const removeCourse = (id: string) => {
    setCourses(courses.filter(c => c.id !== id));
  };

  const updateTrainingPoint = (semester: number, points: number) => {
    setTrainingRecords(prev => prev.map(r => r.semester === semester ? { ...r, points: Math.min(100, Math.max(0, points)) } : r));
  };

  const resetAll = () => {
    if (confirm("Xác nhận xóa toàn bộ dữ liệu?")) {
      setCourses([]);
      setTrainingRecords(Array.from({ length: 8 }, (_, i) => ({ semester: i + 1, points: 0 })));
    }
  };

  const filteredCourses = useMemo(() => {
    if (filterSemester === 'all') return courses;
    return courses.filter(c => (c as any).semester === filterSemester);
  }, [courses, filterSemester]);

  const stats = useMemo(() => {
    const calc = (list: Course[], mode: 'semester' | 'cumulative' = 'semester') => {
      const filteredList = mode === 'cumulative' 
        ? list.filter(c => c.grade4 >= 1.0) 
        : list;

      const totalCredits = filteredList.reduce((sum, c) => sum + c.credits, 0);
      if (totalCredits === 0) return { gpa4: 0, gpa10: 0, totalCredits: 0 };
      
      const totalPoints4 = filteredList.reduce((sum, c) => sum + (c.grade4 * c.credits), 0);
      const totalPoints10 = filteredList.reduce((sum, c) => sum + (c.grade10 * c.credits), 0);
      
      return {
        gpa4: Number((totalPoints4 / totalCredits).toFixed(2)),
        gpa10: Number((totalPoints10 / totalCredits).toFixed(2)),
        totalCredits
      };
    };
    
    return {
      semester: calc(filteredCourses, 'semester'),
      cumulative: calc(courses, 'cumulative'),
      overall: calc(courses, 'semester')
    };
  }, [courses, filteredCourses]);

  const avgTrainingScore = useMemo(() => {
    const recordsWithPoints = trainingRecords.filter(r => r.points > 0);
    if (recordsWithPoints.length === 0) return 0;
    return Math.round(recordsWithPoints.reduce((sum, r) => sum + r.points, 0) / recordsWithPoints.length);
  }, [trainingRecords]);

  const gradeDistribution = useMemo(() => {
    const dist = GRADE_SCALE.map(s => ({
      name: s.letter,
      count: courses.filter(c => c.letterGrade === s.letter).length,
      color: s.gpa >= 3.5 ? "#8B0000" : s.gpa >= 2.5 ? "#D42A2A" : "#cbd5e1"
    })).reverse();
    return dist;
  }, [courses]);

  const getAcademicStatus = (val: number) => {
    const caps = [
      { min: 3.6, text: "Xuất sắc", color: "text-amber-400" },
      { min: 3.2, text: "Giỏi", color: "text-yellow-400" },
      { min: 2.5, text: "Khá", color: "text-blue-400" },
      { min: 2.2, text: "Trung bình khá", color: "text-slate-400" },
      { min: 2.0, text: "Trung bình", color: "text-slate-500" },
    ];
    return caps.find(c => val >= c.min) || { text: "Yếu / Kém", color: "text-slate-400" };
  };

  const getTrainingStatus = (val: number) => {
    if (val >= 90) return { text: "Xuất sắc", color: "text-amber-500" };
    if (val >= 80) return { text: "Tốt", color: "text-green-500" };
    if (val >= 65) return { text: "Khá", color: "text-blue-500" };
    if (val >= 50) return { text: "Trung bình", color: "text-slate-500" };
    return { text: "Yếu / Kém", color: "text-red-500" };
  };

  const academicStatus = getAcademicStatus(stats.cumulative.gpa4);
  const trainingStatus = getTrainingStatus(avgTrainingScore);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-12 print:bg-white print:pb-0">
      {/* Professional Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-50 shadow-sm print:relative print:shadow-none print:py-4">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-maroon rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-maroon/20">F</div>
            <div>
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight leading-none uppercase">FTU Academic Hub</h1>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">Foreign Trade University • {activeTab === 'gpa' ? 'GPA' : activeTab === 'training' ? 'Rèn luyện' : 'Tổng quan'}</p>
            </div>
          </div>
          
          {/* Main Tab Navigation */}
          <nav className="flex bg-slate-100 p-1 rounded-2xl print:hidden">
            {[
              { id: 'gpa', label: 'Học tập', icon: GraduationCap },
              { id: 'training', label: 'Rèn luyện', icon: ShieldCheck },
              { id: 'dashboard', label: 'Tổng kết', icon: LayoutDashboard }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all",
                  activeTab === tab.id 
                    ? "bg-white text-maroon shadow-sm ring-1 ring-slate-200" 
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
          
          <div className="flex items-center gap-4 print:hidden">
            <button 
              onClick={resetAll}
              className="p-2.5 text-slate-400 hover:text-maroon transition-all hover:bg-maroon/5 rounded-xl"
              title="Làm mới trình tính"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button 
              onClick={() => window.print()}
              className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-slate-900/10 active:scale-95"
            >
              <Download className="w-4 h-4" />
              Xuất PDF
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-8 mt-8">
        <AnimatePresence mode="wait">
          {activeTab === 'gpa' && (
            <motion.div 
              key="gpa"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-12 gap-8"
            >
              {/* GPA Content */}
              <div className="col-span-12 lg:col-span-8 flex flex-col gap-8">
                <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Calculator className="w-4 h-4 text-maroon" />
                      </div>
                      <h2 className="font-black text-slate-700 uppercase text-xs tracking-widest">Thêm học phần mới</h2>
                    </div>
                    <div className="flex bg-slate-200/50 p-1 rounded-xl">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                        <button 
                          key={s}
                          onClick={() => setCurrentSemester(s)}
                          className={cn(
                            "w-8 h-8 text-[10px] font-black rounded-lg transition-all",
                            currentSemester === s ? "bg-white text-maroon shadow-sm" : "text-slate-400 hover:text-slate-600"
                          )}
                        >
                          K{s}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-8">
                    <form onSubmit={(e) => { e.preventDefault(); addCourse(); }} className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div className="md:col-span-2">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-3 tracking-wider pl-1">
                          <Hash className="w-3 h-3" />
                          Mã HP
                        </label>
                        <input 
                          type="text" 
                          placeholder="Mã..."
                          value={newCourse.code}
                          onChange={(e) => setNewCourse({...newCourse, code: e.target.value.toUpperCase()})}
                          className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-maroon/5 focus:border-maroon outline-none transition-all placeholder:text-slate-300 font-semibold text-sm"
                        />
                      </div>
                      <div className="md:col-span-4">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-3 tracking-wider pl-1">
                          <BookOpen className="w-3 h-3" />
                          Tên học phần
                        </label>
                        <input 
                          type="text" 
                          placeholder="Nhập tên môn học..."
                          value={newCourse.name}
                          onChange={(e) => setNewCourse({...newCourse, name: e.target.value})}
                          className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-maroon/5 focus:border-maroon outline-none transition-all placeholder:text-slate-300 font-semibold text-sm"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-3 tracking-wider pl-1">
                          <Zap className="w-3 h-3" />
                          Tín chỉ
                        </label>
                        <input 
                          type="number"
                          min="0"
                          max="20"
                          value={newCourse.credits}
                          onChange={(e) => setNewCourse({...newCourse, credits: Number(e.target.value)})}
                          className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-maroon/5 focus:border-maroon outline-none transition-all font-bold text-slate-700 text-sm"
                        />
                      </div>
                      <div className="md:col-span-4">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-3 tracking-wider pl-1">
                          <GraduationCap className="w-3 h-3" />
                          Điểm (Hệ 10)
                        </label>
                        <div className="flex gap-3">
                          <input 
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            value={newCourse.grade10}
                            onChange={(e) => setNewCourse({...newCourse, grade10: Number(e.target.value)})}
                            className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-maroon/5 focus:border-maroon outline-none transition-all font-bold text-slate-700 font-mono text-sm"
                          />
                          <button type="submit" className="bg-maroon hover:bg-maroon-dark text-white px-8 py-3 rounded-xl font-bold uppercase text-xs tracking-widest transition-all shadow-lg shadow-maroon/20 active:scale-95 flex-shrink-0">Thêm</button>
                        </div>
                      </div>
                    </form>
                  </div>
                </section>

                <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col print:border-slate-300">
                  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="font-black text-slate-700 uppercase text-xs tracking-widest">Chi tiết học phần ({courses.length})</h2>
                    <div className="flex items-center gap-4">
                      <select 
                        value={filterSemester}
                        onChange={(e) => setFilterSemester(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        className="text-xs font-black uppercase tracking-widest text-slate-600 bg-transparent outline-none cursor-pointer"
                      >
                        <option value="all">Toàn bộ kỳ</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Kỳ {s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="bg-slate-50/50 text-slate-500 text-[10px] uppercase font-bold tracking-widest border-b border-slate-100">
                          <th className="px-6 py-5">Mã HP</th>
                          <th className="px-6 py-5">Học phần</th>
                          <th className="px-6 py-5 text-center">TC</th>
                          <th className="px-6 py-5 text-center">Hệ 10</th>
                          <th className="px-6 py-5 text-center">Hệ 4</th>
                          <th className="px-6 py-5 text-center">Hạng</th>
                          <th className="px-6 py-5 print:hidden"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 italic">
                        {filteredCourses.map((course) => (
                          <motion.tr key={course.id} className="group hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-5">
                              <span className="text-[11px] font-bold text-slate-500 tabular-nums uppercase">{course.code || "---"}</span>
                            </td>
                            <td className="px-6 py-5">
                              <p className="font-bold text-slate-900 tracking-tight text-sm mb-1 leading-snug">{course.name}</p>
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide bg-slate-100/50 px-1.5 py-0.5 rounded italic">Kỳ {(course as any).semester}</span>
                            </td>
                            <td className="px-6 py-5 text-center text-slate-600 font-bold text-sm italic">{course.credits}</td>
                            <td className="px-6 py-5 text-center text-slate-400 font-mono font-medium text-sm italic">{course.grade10.toFixed(1)}</td>
                            <td className="px-6 py-5 text-center font-extrabold text-slate-900 text-sm font-mono italic">
                              {course.grade4.toFixed(2)}
                            </td>
                            <td className="px-6 py-5 text-center">
                              <span className={cn(
                                "px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-widest uppercase italic",
                                course.grade4 >= 3.0 ? "text-maroon bg-maroon/10" : "text-slate-500 bg-slate-100"
                              )}>
                                {course.letterGrade}
                              </span>
                            </td>
                            <td className="px-6 py-5 text-right print:hidden">
                              <button onClick={() => removeCourse(course.id)} className="p-2 text-slate-200 hover:text-red-500 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>

              <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
                <div className="bg-maroon rounded-2xl p-8 text-white shadow-2xl shadow-maroon/20 relative overflow-hidden group">
                  <p className="text-white/60 text-[11px] font-bold uppercase tracking-[0.2em] mb-4">GPA Tích lũy (Hệ 4)</p>
                  <h3 className="text-6xl font-black mb-6 italic tracking-tighter leading-none">{stats.cumulative.gpa4.toFixed(2)}</h3>
                  <div className="bg-white/10 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest border border-white/5 backdrop-blur-sm">
                    Xếp loại: <span className={cn("ml-1", academicStatus.color)}>{academicStatus.text}</span>
                  </div>
                  <GraduationCap className="absolute top-8 right-8 w-12 h-12 text-white/5 rotate-12" />
                </div>
                
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                  <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-6">Phân bổ học phần</h3>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={gradeDistribution}>
                        <XAxis dataKey="name" fontSize={10} fontWeight={900} axisLine={false} tickLine={false} />
                        <ReTooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {gradeDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'training' && (
            <motion.div 
              key="training"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-12 gap-8"
            >
              <div className="col-span-12 lg:col-span-8">
                <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-4 h-4 text-maroon" />
                      <h2 className="font-black text-slate-700 uppercase text-xs tracking-widest">Điểm rèn luyện qua các kỳ</h2>
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lưu tự động vào trình duyệt</span>
                  </div>
                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {trainingRecords.map((record) => (
                      <div key={record.semester} className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Học kỳ {record.semester}</label>
                          <span className={cn("text-xs font-black uppercase tracking-tight", getTrainingStatus(record.points).color)}>
                            {getTrainingStatus(record.points).text}
                          </span>
                        </div>
                        <div className="flex gap-4 items-center">
                          <input 
                            type="range"
                            min="0"
                            max="100"
                            value={record.points}
                            onChange={(e) => updateTrainingPoint(record.semester, Number(e.target.value))}
                            className="flex-1 accent-maroon h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                          />
                          <input 
                            type="number"
                            min="0"
                            max="100"
                            value={record.points === 0 ? "" : record.points}
                            onChange={(e) => updateTrainingPoint(record.semester, Number(e.target.value))}
                            placeholder="0"
                            className="w-16 px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-center font-black text-slate-700 text-sm focus:border-maroon transition-colors"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
              <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
                <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden group">
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Điểm RL Trung bình</p>
                  <h3 className="text-7xl font-black mb-6 italic tracking-tighter leading-none">{avgTrainingScore}</h3>
                  <div className="bg-white/5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-white/5 backdrop-blur-sm">
                    Xếp loại: <span className={cn("ml-1", trainingStatus.color)}>{trainingStatus.text}</span>
                  </div>
                  <ShieldCheck className="absolute top-8 right-8 w-12 h-12 text-white/5 rotate-12" />
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                  <div className="flex items-center gap-2 mb-6 text-maroon font-black text-[10px] uppercase tracking-widest">
                    <Info className="w-3.5 h-3.5" />
                    <span>Hạng mục đánh giá</span>
                  </div>
                  <div className="space-y-4">
                    {[
                      { l: "Ý thức học tập", p: "0 - 20" },
                      { l: "Ý thức chấp hành quy định", p: "0 - 25" },
                      { l: "Tham gia hoạt động", p: "0 - 20" },
                      { l: "Ý thức công dân", p: "0 - 25" },
                      { l: "Tham gia cán bộ lớp/đoàn", p: "0 - 10" },
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                        <span>{item.l}</span>
                        <span className="text-slate-900">{item.p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col gap-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm ring-1 ring-slate-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-50 rounded-lg"><Calculator className="w-4 h-4 text-blue-600" /></div>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-none">GPA Tích lũy (10)</p>
                  </div>
                  <h4 className="text-3xl font-black text-slate-900 tabular-nums italic">{stats.cumulative.gpa10.toFixed(2)}</h4>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm ring-1 ring-slate-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-amber-50 rounded-lg"><Award className="w-4 h-4 text-amber-600" /></div>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-none">GPA Tích lũy (4)</p>
                  </div>
                  <h4 className="text-3xl font-black text-slate-900 tabular-nums italic">{stats.cumulative.gpa4.toFixed(2)}</h4>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm ring-1 ring-slate-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-50 rounded-lg"><Zap className="w-4 h-4 text-green-600" /></div>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-none">Tín chỉ tích lũy</p>
                  </div>
                  <h4 className="text-3xl font-black text-slate-900 tabular-nums italic">{stats.cumulative.totalCredits}</h4>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm ring-1 ring-slate-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-maroon/5 rounded-lg"><ShieldCheck className="w-4 h-4 text-maroon" /></div>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-none">Rèn luyện trung bình</p>
                  </div>
                  <h4 className="text-3xl font-black text-slate-900 tabular-nums italic">{avgTrainingScore}</h4>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-8">
                <div className="col-span-12 lg:col-span-8 space-y-8">
                  <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-8">Dự báo tiến độ tốt nghiệp</h3>
                    <div className="space-y-8">
                      {[
                        { 
                          title: "Điều kiện tích lũy tín chỉ", 
                          desc: "Số tín chỉ thực tế so với mục tiêu chuẩn 130 tín", 
                          progress: Math.min(100, (stats.cumulative.totalCredits / 130) * 100),
                          status: stats.cumulative.totalCredits >= 130 ? "Đạt" : "Đang thực hiện"
                        },
                        { 
                          title: "Điểm trung bình (GPA >= 2.0)", 
                          desc: "Điều kiện tối thiểu để được xét tốt nghiệp đại học", 
                          progress: Math.min(100, (stats.cumulative.gpa4 / 2.0) * 100),
                          status: stats.cumulative.gpa4 >= 2.0 ? "Đạt" : "Chưa đạt"
                        },
                        { 
                          title: "Rèn luyện (>= 50)", 
                          desc: "Điểm rèn luyện phải đạt từ mức Trung bình trở lên", 
                          progress: avgTrainingScore,
                          status: avgTrainingScore >= 50 ? "Đạt" : "Chưa đạt"
                        }
                      ].map((item, idx) => (
                        <div key={idx} className="group">
                          <div className="flex justify-between items-center mb-3">
                            <div>
                              <p className="text-sm font-bold text-slate-900 tracking-tight">{item.title}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-tight italic">{item.desc}</p>
                            </div>
                            <span className={cn(
                              "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest italic",
                              item.status === 'Đạt' ? "bg-green-50 text-green-600" : "bg-slate-50 text-slate-400"
                            )}>{item.status}</span>
                          </div>
                          <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-0.5">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${item.progress}%` }}
                              className={cn(
                                "h-full rounded-full transition-all duration-1000",
                                item.status === 'Đạt' ? "bg-green-500 shadow-sm" : "bg-maroon shadow-sm"
                              )}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Target Simulation Section */}
                  <section className="bg-slate-50 rounded-2xl border border-slate-200 border-dashed p-8">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-200">
                          <TrendingUp className="w-4 h-4 text-maroon" />
                        </div>
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Phân tích lộ trình Xuất sắc (3.6)</h3>
                      </div>
                      <span className="text-[10px] bg-maroon/10 text-maroon px-2 py-1 rounded font-bold uppercase italic">Khóa luận: 9 Tín</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Kịch bản đạt 3.60:</p>
                        {(() => {
                          const totalTarget = 130;
                          const currentCredits = stats.cumulative.totalCredits;
                          const currentGpa = stats.cumulative.gpa4;
                          const remainingCredits = Math.max(0, totalTarget - currentCredits);
                          const remainingThesis = 9;
                          const remainingOther = Math.max(0, remainingCredits - remainingThesis);
                          
                          if (remainingCredits === 0) return <p className="text-xs italic text-slate-400">Bạn đã hoàn thành đủ tín chỉ.</p>;
                          
                          const targetTotalPoints = totalTarget * 3.6;
                          const currentTotalPoints = currentCredits * currentGpa;
                          const neededPoints = targetTotalPoints - currentTotalPoints;
                          
                          // Simulation: If thesis is A (4.0)
                          const thesisA = 9 * 4.0;
                          const neededAfterThesisA = neededPoints - thesisA;
                          const avgNeededOther = neededAfterThesisA / remainingOther;
                          
                          // Case where impossible even with all A
                          if (avgNeededOther > 4.0) {
                            return <div className="p-4 bg-red-50 rounded-xl border border-red-100"><p className="text-xs font-bold text-red-600 italic">Mục tiêu 3.6 (Xuất sắc) hiện tại rất khó đạt được. Hãy tập trung giữ vững mức Giỏi.</p></div>;
                          }

                          // Calculate mix of A and B
                          // A*x + B*(rem - x) = neededAfterThesisA
                          // 4x + 3(rem - x) = needed
                          // 4x + 3rem - 3x = needed
                          // x = needed - 3rem
                          let numA = Math.ceil(neededAfterThesisA - (3 * remainingOther));
                          numA = Math.max(0, numA);
                          const numB = Math.max(0, Math.ceil(remainingOther - numA));

                          return (
                            <div className="space-y-4">
                              <div className="bg-white p-4 rounded-xl border border-slate-200">
                                <p className="text-[10px] text-slate-400 font-bold mb-2 uppercase italic tracking-wide">Nếu Khóa luận đạt A (4.0):</p>
                                <ul className="space-y-2">
                                  <li className="flex justify-between text-sm italic">
                                    <span className="text-slate-600">Cần thêm các học phần A:</span>
                                    <span className="font-bold text-slate-900">~{numA} tín chỉ</span>
                                  </li>
                                  <li className="flex justify-between text-sm italic">
                                    <span className="text-slate-600">Có thể chấp nhận B tối đa:</span>
                                    <span className="font-bold text-slate-500">~{numB} tín chỉ</span>
                                  </li>
                                </ul>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col justify-center">
                        <p className="text-[10px] text-slate-400 font-bold mb-4 uppercase text-center italic">Chiến lược đề xuất</p>
                        <div className="flex justify-center gap-4">
                           <div className="text-center">
                             <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-2 mx-auto">
                               <TrendingUp className="w-5 h-5 text-blue-600" />
                             </div>
                             <p className="text-[9px] font-bold text-slate-500 uppercase italic">Ưu tiên<br/>Môn 3 TC</p>
                           </div>
                           <div className="text-center">
                             <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mb-2 mx-auto">
                               <Award className="w-5 h-5 text-amber-600" />
                             </div>
                             <p className="text-[9px] font-bold text-slate-500 uppercase italic">Khóa luận<br/>Phải đạt A</p>
                           </div>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
                  <section className="bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden">
                    <h5 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                       <Award className="w-4 h-4 text-amber-400" />
                       Hạng tốt nghiệp dự kiến
                    </h5>
                    <div className="relative z-10">
                      <p className={cn("text-3xl font-black italic tracking-tighter mb-4", academicStatus.color)}>{academicStatus.text}</p>
                      <div className="p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                         <p className="text-[9px] font-bold text-white/60 leading-relaxed uppercase tracking-tight">
                           Cố gắng duy trì GPA & Rèn luyện tốt để đảm bảo điều kiện tốt nghiệp Xuất sắc/Giỏi (không kỷ luật/vượt quá hồi kỳ quá mức quy định).
                         </p>
                      </div>
                    </div>
                  </section>
                  
                  <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Thông báo hệ thống</h5>
                    <div className="space-y-4">
                      <div className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 items-start">
                        <div className="p-2 bg-white rounded-lg shadow-sm"><Info className="w-3 h-3 text-maroon" /></div>
                        <p className="text-[10px] font-bold text-slate-500 leading-normal uppercase">Dữ liệu được lưu trữ cục bộ trên trình duyệt của bạn (Local Storage).</p>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="bg-slate-900 text-slate-500 py-6 px-12 mt-12 text-[10px] flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
        <div className="font-black uppercase tracking-[0.1em] opacity-30">© 2026 FTU Student Portal • Professional Edition</div>
        <div className="flex gap-8 uppercase tracking-[0.2em] font-black">
          <a href="#" className="hover:text-white transition-colors">Về FTU GPA</a>
          <a href="#" className="hover:text-white transition-colors">Quy chế đào tạo</a>
          <a href="#" className="hover:text-maroon-light transition-colors">Hướng dẫn</a>
        </div>
      </footer>
    </div>
  );
}

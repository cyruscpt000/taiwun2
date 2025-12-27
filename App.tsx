
import React, { useState, useEffect } from 'react';
import { TabType, ItineraryItem, Expense, PackingItem } from './types';
import { MEMBERS, INITIAL_PACKING_LIST, MOCK_ITINERARY } from './constants';
import { 
  Calendar, 
  Info, 
  Wallet, 
  CheckSquare, 
  Users, 
  Plus, 
  MapPin, 
  Plane, 
  Bus, 
  Utensils, 
  Camera,
  Search,
  CloudSun,
  CloudLightning,
  RefreshCw
} from 'lucide-react';
import { getTaipeiSuggestions } from './geminiService';
import { db } from './firebase';
import { collection, onSnapshot, doc, updateDoc, addDoc, setDoc } from 'firebase/firestore';

// --- Sub-components ---

const TabIcon: React.FC<{ type: TabType; active: boolean }> = ({ type, active }) => {
  const color = active ? 'text-blue-500' : 'text-gray-400';
  const bgColor = active ? 'bg-blue-100' : 'bg-transparent';
  
  switch (type) {
    case TabType.ITINERARY: return (
      <div className={`p-2 rounded-2xl ${bgColor} transition-all duration-300`}>
        <Calendar className={color} size={24} />
      </div>
    );
    case TabType.INFO: return (
      <div className={`p-2 rounded-2xl ${bgColor} transition-all duration-300`}>
        <Info className={color} size={24} />
      </div>
    );
    case TabType.LEDGER: return (
      <div className={`p-2 rounded-2xl ${bgColor} transition-all duration-300`}>
        <Wallet className={color} size={24} />
      </div>
    );
    case TabType.PREP: return (
      <div className={`p-2 rounded-2xl ${bgColor} transition-all duration-300`}>
        <CheckSquare className={color} size={24} />
      </div>
    );
    case TabType.MEMBERS: return (
      <div className={`p-2 rounded-2xl ${bgColor} transition-all duration-300`}>
        <Users className={color} size={24} />
      </div>
    );
  }
};

const TimelineCard: React.FC<{ item: ItineraryItem }> = ({ item }) => {
  const Icon = () => {
    switch (item.type) {
      case 'FLIGHT': return <Plane className="text-blue-500" size={20} />;
      case 'TRANSPORT': return <Bus className="text-blue-500" size={20} />;
      case 'FOOD': return <Utensils className="text-orange-400" size={20} />;
      case 'SIGHT': return <Camera className="text-green-500" size={20} />;
      default: return <MapPin className="text-blue-500" size={20} />;
    }
  };

  return (
    <div className="relative flex gap-4 mb-8">
      <div className="flex flex-col items-center">
        <div className="z-10 w-4 h-4 rounded-full bg-blue-300 border-4 border-white shadow-sm mt-1"></div>
        <div className="text-[10px] text-gray-400 font-medium mt-1">{item.time}</div>
      </div>
      
      <div className="flex-1 bg-white p-4 rounded-3xl shadow-sm border border-slate-50">
        <div className="flex justify-between items-start mb-1">
          <div className="p-2 bg-blue-50 rounded-xl mb-2">
            <Icon />
          </div>
        </div>
        <h3 className="font-bold text-slate-800 text-lg">{item.title}</h3>
        {item.subtitle && <p className="text-sm text-slate-500 mb-2">{item.subtitle}</p>}
        {item.details && (
          <div className="space-y-1">
            {item.details.map((d, i) => (
              <p key={i} className="text-xs text-slate-400 flex items-center gap-1">
                <span className="w-1 h-1 bg-slate-300 rounded-full"></span> {d}
              </p>
            ))}
          </div>
        )}
        {item.location && (
          <div className="flex items-center gap-1 mt-3 text-blue-500 text-xs font-medium">
            <MapPin size={12} /> {item.location}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main App Component ---

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>(TabType.ITINERARY);
  const [activeDay, setActiveDay] = useState<number>(1);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [packingList, setPackingList] = useState<PackingItem[]>(INITIAL_PACKING_LIST);
  const [aiSuggestion, setAiSuggestion] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // --- Firebase Real-time Sync Logic ---
  useEffect(() => {
    if (!db) return;

    setIsSyncing(true);
    // 監聽準備清單
    const unsubPacking = onSnapshot(collection(db, "packingList"), (snapshot) => {
      const items: PackingItem[] = [];
      snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() } as PackingItem));
      if (items.length > 0) setPackingList(items);
      setIsSyncing(false);
    });

    // 監聽支出紀錄
    const unsubExpenses = onSnapshot(collection(db, "expenses"), (snapshot) => {
      const items: Expense[] = [];
      snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() } as Expense));
      setExpenses(items);
    });

    return () => {
      unsubPacking();
      unsubExpenses();
    };
  }, []);

  // AI 建議
  useEffect(() => {
    const fetchAi = async () => {
      setLoadingAi(true);
      const res = await getTaipeiSuggestions("Taipei first timers, visiting Ximending and 101");
      setAiSuggestion(res);
      setLoadingAi(false);
    };
    fetchAi();
  }, []);

  const togglePackingItem = async (id: string) => {
    const item = packingList.find(i => i.id === id);
    if (!item) return;

    // 先本地更新 (爽快感)
    const newStatus = !item.completed;
    setPackingList(prev => prev.map(i => i.id === id ? { ...i, completed: newStatus } : i));

    // 同步到 Firebase
    if (db) {
      try {
        await setDoc(doc(db, "packingList", id), { ...item, completed: newStatus }, { merge: true });
      } catch (e) {
        console.error("Sync failed:", e);
      }
    }
  };

  const addExpense = async () => {
    const newExp = { 
      amount: 150, 
      category: 'Food', 
      description: '豪大大雞排', 
      paidBy: '大哥', 
      date: `Day ${activeDay}` 
    };

    if (db) {
      await addDoc(collection(db, "expenses"), newExp);
    } else {
      setExpenses([...expenses, { id: Date.now().toString(), ...newExp }]);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case TabType.ITINERARY:
        return (
          <div className="pb-24 px-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">當日行程</h2>
              <button className="flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full text-sm font-semibold">
                <Plus size={16} /> 新增
              </button>
            </div>
            
            <div className="relative timeline-line">
              {MOCK_ITINERARY[activeDay]?.map(item => (
                <TimelineCard key={item.id} item={item} />
              ))}
            </div>

            <div className="mt-4 p-5 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-3xl border border-blue-100 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-indigo-500 p-1.5 rounded-lg">
                  <Search size={14} className="text-white" />
                </div>
                <span className="text-sm font-bold text-indigo-900">小媛嘅 AI 旅遊靈感</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed italic">
                {loadingAi ? "正在為大哥和小媛構思中..." : aiSuggestion}
              </p>
            </div>
          </div>
        );

      case TabType.PREP:
        return (
          <div className="px-6 pb-24">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">準備清單</h2>
            <div className="space-y-3">
              {packingList.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => togglePackingItem(item.id)}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                    item.completed ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-100 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${
                      item.completed ? 'bg-green-500 border-green-500' : 'bg-white border-slate-200'
                    }`}>
                      {item.completed && <CheckSquare className="text-white" size={14} />}
                    </div>
                    <span className={`font-medium ${item.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                      {item.name}
                    </span>
                  </div>
                  {item.assignedTo && (
                    <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold">
                      {item.assignedTo}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case TabType.LEDGER:
        const total = expenses.reduce((acc, curr) => acc + curr.amount, 0);
        return (
          <div className="px-6 pb-24">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">開支統計</h2>
            <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-lg shadow-indigo-200 mb-8">
              <p className="text-indigo-100 text-sm mb-1 opacity-80">總支出 (TWD)</p>
              <h3 className="text-3xl font-bold">$ {total.toLocaleString()}</h3>
            </div>
            
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-slate-700">最近交易</span>
              <button 
                onClick={addExpense}
                className="text-indigo-600 text-sm font-bold flex items-center gap-1"
              >
                <Plus size={14} /> 新增紀錄
              </button>
            </div>

            {expenses.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Wallet size={48} className="mx-auto mb-4 opacity-20" />
                <p>仲未有開支紀錄喎</p>
              </div>
            ) : (
              <div className="space-y-4">
                {expenses.map(exp => (
                  <div key={exp.id} className="bg-white p-4 rounded-2xl border border-slate-50 shadow-sm flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800">{exp.description}</p>
                      <p className="text-xs text-slate-400">{exp.paidBy} 支付 • {exp.date}</p>
                    </div>
                    <p className="font-bold text-rose-500">-${exp.amount}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case TabType.MEMBERS:
        return (
          <div className="px-6 pb-24">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">冒險成員</h2>
            <div className="grid grid-cols-2 gap-4">
              {MEMBERS.map(member => (
                <div key={member.name} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-center">
                  <div className="relative inline-block mb-3">
                    <img src={member.avatar} alt={member.name} className="w-20 h-20 rounded-full border-4 border-blue-50 shadow-sm object-cover mx-auto" />
                    <div className="absolute -bottom-1 -right-1 bg-green-500 w-5 h-5 rounded-full border-4 border-white"></div>
                  </div>
                  <h3 className="font-bold text-slate-800">{member.name}</h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-1">{member.role}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case TabType.INFO:
        return (
          <div className="px-6 pb-24">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">重要資訊</h2>
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                <h4 className="font-bold text-slate-700 flex items-center gap-2 mb-3">
                  <MapPin className="text-blue-500" size={18} /> 酒店地址
                </h4>
                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl">
                  台北市萬華區武昌街二段 72 號<br/>
                  <span className="text-xs text-slate-400 mt-1 block">西門町核心地段</span>
                </p>
              </div>
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                <h4 className="font-bold text-slate-700 flex items-center gap-2 mb-3">
                  <Bus className="text-blue-500" size={18} /> 緊急電話
                </h4>
                <ul className="text-sm space-y-2 text-slate-600">
                  <li className="flex justify-between"><span>緊急救護</span> <span className="font-bold">119</span></li>
                  <li className="flex justify-between"><span>報警專線</span> <span className="font-bold">110</span></li>
                </ul>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen relative flex flex-col bg-slate-50 overflow-x-hidden">
      {/* --- Header Section --- */}
      <header className="pt-10 pb-6 px-6 bg-white rounded-b-[40px] shadow-sm mb-6 sticky top-0 z-30">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Taipei 2024</h1>
              {/* 同步狀態指示燈 */}
              <div className={`w-2 h-2 rounded-full ${db ? 'bg-green-500 sync-active' : 'bg-rose-400 opacity-50'}`} title={db ? "Cloud Synced" : "Local Mode"}></div>
            </div>
            <p className="text-slate-400 text-sm font-medium">Day {activeDay} - 台北遊</p>
          </div>
          <div className="flex gap-2">
            <div className="p-2 bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 hover:text-blue-500 cursor-pointer transition-colors relative">
              <CloudSun size={20} />
              {isSyncing && <RefreshCw size={10} className="absolute -top-1 -right-1 text-blue-500 animate-spin" />}
            </div>
            <img src={MEMBERS[0].avatar} className="w-10 h-10 rounded-2xl object-cover border-2 border-slate-100" alt="Profile" />
          </div>
        </div>

        {/* Day Selector */}
        <div className="flex gap-4 overflow-x-auto custom-scrollbar py-2">
          {[1, 2, 3, 4, 5].map(day => (
            <div 
              key={day} 
              onClick={() => setActiveDay(day)}
              className={`flex-shrink-0 flex flex-col items-center justify-center w-[72px] h-[92px] rounded-[28px] transition-all duration-300 cursor-pointer ${
                activeDay === day 
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-100 scale-105' 
                : 'bg-white text-slate-400 border border-slate-100'
              }`}
            >
              <span className={`text-[10px] uppercase font-bold mb-1 ${activeDay === day ? 'text-blue-100' : 'text-slate-300'}`}>Day {day}</span>
              <span className="text-xl font-bold">{13 + day}</span>
              <span className="text-[10px] font-medium opacity-80">週{['一','二','三','四','五','六','日'][(day+2)%7]}</span>
            </div>
          ))}
        </div>

        {/* City Info Bar */}
        <div className="mt-6 flex items-center justify-between bg-slate-50 p-4 rounded-3xl border border-slate-100">
          <div className="flex items-center gap-3">
             <div className="bg-white p-2.5 rounded-2xl shadow-sm text-blue-500">
               <MapPin size={18} />
             </div>
             <div>
               <p className="font-bold text-slate-800">Taipei City</p>
               <p className="text-[10px] text-slate-400 font-medium">Cloudy • 22°C</p>
             </div>
          </div>
          <div className="text-slate-300 hover:text-slate-500 cursor-pointer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </div>
      </header>

      {/* --- Main Content Section --- */}
      <main className="flex-1 overflow-y-auto">
        {renderContent()}
      </main>

      {/* --- Persistent Bottom Navigation --- */}
      <nav className="fixed bottom-6 left-6 right-6 h-20 bg-white/80 backdrop-blur-xl rounded-[32px] border border-white/50 shadow-2xl z-40 flex items-center justify-around px-4">
        {[
          { type: TabType.ITINERARY, label: '行程' },
          { type: TabType.INFO, label: '資訊' },
          { type: TabType.LEDGER, label: '記帳' },
          { type: TabType.PREP, label: '準備' },
          { type: TabType.MEMBERS, label: '成員' }
        ].map((tab) => (
          <button 
            key={tab.type} 
            onClick={() => setActiveTab(tab.type)}
            className="flex flex-col items-center gap-1.5 transition-all active:scale-90"
          >
            <TabIcon type={tab.type} active={activeTab === tab.type} />
            <span className={`text-[10px] font-bold tracking-wide transition-colors ${
              activeTab === tab.type ? 'text-blue-600' : 'text-slate-400'
            }`}>
              {tab.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;

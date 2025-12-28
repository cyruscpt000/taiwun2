
import React, { useState, useEffect } from 'react';
import { TabType, ItineraryItem, Expense, PackingItem } from './types';
import { MEMBERS, INITIAL_PACKING_LIST, TRAVEL_DATES } from './constants';
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
  RefreshCw,
  Edit2,
  X,
  Save
} from 'lucide-react';
import { getTaipeiSuggestions } from './geminiService';
import { db } from './firebase';
import { collection, onSnapshot, doc, updateDoc, addDoc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';

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

const TimelineCard: React.FC<{ item: ItineraryItem; onEdit: (item: ItineraryItem) => void }> = ({ item, onEdit }) => {
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
      
      <div className="flex-1 bg-white p-4 rounded-3xl shadow-sm border border-slate-50 relative group">
        <button 
          onClick={() => onEdit(item)}
          className="absolute top-4 right-4 p-2 text-slate-300 hover:text-blue-500 transition-colors"
        >
          <Edit2 size={14} />
        </button>
        
        <div className="flex justify-between items-start mb-1">
          <div className="p-2 bg-blue-50 rounded-xl mb-2">
            <Icon />
          </div>
        </div>
        <h3 className="font-bold text-slate-800 text-lg pr-8">{item.title}</h3>
        {item.subtitle && <p className="text-sm text-slate-500 mb-2">{item.subtitle}</p>}
        {item.details && item.details.length > 0 && (
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
  const [itineraryItems, setItineraryItems] = useState<ItineraryItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [packingList, setPackingList] = useState<PackingItem[]>(INITIAL_PACKING_LIST);
  const [aiSuggestion, setAiSuggestion] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<ItineraryItem> | null>(null);

  // --- Firebase Real-time Sync ---
  useEffect(() => {
    if (!db) return;
    setIsSyncing(true);

    const unsubItinerary = onSnapshot(query(collection(db, "itinerary"), orderBy("time")), (snapshot) => {
      const items: ItineraryItem[] = [];
      snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() } as ItineraryItem));
      setItineraryItems(items);
      setIsSyncing(false);
    });

    const unsubPacking = onSnapshot(collection(db, "packingList"), (snapshot) => {
      const items: PackingItem[] = [];
      snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() } as PackingItem));
      if (items.length > 0) setPackingList(items);
    });

    const unsubExpenses = onSnapshot(collection(db, "expenses"), (snapshot) => {
      const items: Expense[] = [];
      snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() } as Expense));
      setExpenses(items);
    });

    return () => {
      unsubItinerary();
      unsubPacking();
      unsubExpenses();
    };
  }, []);

  // AI 靈感
  useEffect(() => {
    const fetchAi = async () => {
      setLoadingAi(true);
      const res = await getTaipeiSuggestions("Taipei New Year 2024-2025, Ximending, 101 Fireworks");
      setAiSuggestion(res);
      setLoadingAi(false);
    };
    fetchAi();
  }, [activeDay]);

  const togglePackingItem = async (id: string) => {
    const item = packingList.find(i => i.id === id);
    if (!item) return;
    const newStatus = !item.completed;
    if (db) await setDoc(doc(db, "packingList", id), { ...item, completed: newStatus }, { merge: true });
  };

  const handleOpenAdd = () => {
    setEditingItem({ day: activeDay, time: '12:00', type: 'SIGHT', title: '', subtitle: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ItineraryItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const saveItinerary = async () => {
    if (!editingItem || !editingItem.title) return;
    
    if (db) {
      if (editingItem.id) {
        await updateDoc(doc(db, "itinerary", editingItem.id), editingItem);
      } else {
        await addDoc(collection(db, "itinerary"), editingItem);
      }
    }
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const deleteItinerary = async () => {
    if (editingItem?.id && db) {
      await deleteDoc(doc(db, "itinerary", editingItem.id));
      setIsModalOpen(false);
    }
  };

  const filteredItinerary = itineraryItems.filter(i => i.day === activeDay);

  const renderContent = () => {
    switch (activeTab) {
      case TabType.ITINERARY:
        return (
          <div className="pb-32 px-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">當日行程</h2>
              <button 
                onClick={handleOpenAdd}
                className="flex items-center gap-1 bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-md shadow-blue-100"
              >
                <Plus size={16} /> 新增
              </button>
            </div>
            
            <div className="relative timeline-line">
              {filteredItinerary.length === 0 ? (
                <div className="py-10 text-center text-slate-400">
                  <p>呢日仲未有行程，撳「新增」加返啦！</p>
                </div>
              ) : (
                filteredItinerary.map(item => (
                  <TimelineCard key={item.id} item={item} onEdit={handleOpenEdit} />
                ))
              )}
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
          <div className="px-6 pb-32">
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
                </div>
              ))}
            </div>
          </div>
        );

      case TabType.LEDGER:
        const total = expenses.reduce((acc, curr) => acc + curr.amount, 0);
        return (
          <div className="px-6 pb-32">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">開支統計</h2>
            <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-lg shadow-indigo-200 mb-8">
              <p className="text-indigo-100 text-sm mb-1 opacity-80">總支出 (TWD)</p>
              <h3 className="text-3xl font-bold">$ {total.toLocaleString()}</h3>
            </div>
            
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-slate-700">最近交易</span>
              <button 
                onClick={() => alert('請去 Firebase 增加紀錄功能（或等待下次更新）')}
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

      default:
        return <div className="p-10 text-center text-slate-400">功能開發中...</div>;
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen relative flex flex-col bg-slate-50 overflow-x-hidden">
      {/* --- Modal for Add/Edit --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">{editingItem?.id ? '修改行程' : '新增行程'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-500"><X size={20}/></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 ml-2 mb-1 block">時間</label>
                <input 
                  type="time" 
                  value={editingItem?.time} 
                  onChange={e => setEditingItem({...editingItem!, time: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-slate-700 font-medium"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 ml-2 mb-1 block">行程標題</label>
                <input 
                  type="text" 
                  placeholder="例如：阿宗麵線"
                  value={editingItem?.title} 
                  onChange={e => setEditingItem({...editingItem!, title: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-slate-700 font-medium"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 ml-2 mb-1 block">類別</label>
                <select 
                  value={editingItem?.type}
                  onChange={e => setEditingItem({...editingItem!, type: e.target.value as any})}
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-slate-700 font-medium"
                >
                  <option value="SIGHT">景點</option>
                  <option value="FOOD">美食</option>
                  <option value="TRANSPORT">交通</option>
                  <option value="FLIGHT">航班</option>
                  <option value="HOTEL">酒店</option>
                </select>
              </div>
              
              <div className="flex gap-3 pt-4">
                {editingItem?.id && (
                  <button onClick={deleteItinerary} className="flex-1 bg-rose-50 text-rose-500 py-4 rounded-2xl font-bold">刪除</button>
                )}
                <button onClick={saveItinerary} className="flex-[2] bg-blue-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2">
                  <Save size={18}/> 儲存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Header --- */}
      <header className="pt-10 pb-6 px-6 bg-white rounded-b-[40px] shadow-sm mb-6 sticky top-0 z-30">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Taipei 2024</h1>
              <div className={`w-2 h-2 rounded-full ${db ? 'bg-green-500 sync-active' : 'bg-rose-400 opacity-50'}`}></div>
            </div>
            <p className="text-slate-400 text-sm font-medium">大哥 & 小媛 跨年之旅</p>
          </div>
          <div className="p-2 bg-slate-50 rounded-2xl border border-slate-100 text-slate-400">
            {isSyncing ? <RefreshCw size={20} className="animate-spin text-blue-500" /> : <CloudSun size={20} />}
          </div>
        </div>

        {/* Day Selector */}
        <div className="flex gap-4 overflow-x-auto custom-scrollbar py-2">
          {TRAVEL_DATES.map(date => (
            <div 
              key={date.day} 
              onClick={() => setActiveDay(date.day)}
              className={`flex-shrink-0 flex flex-col items-center justify-center w-[72px] h-[92px] rounded-[28px] transition-all duration-300 cursor-pointer ${
                activeDay === date.day 
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-100 scale-105' 
                : 'bg-white text-slate-400 border border-slate-100'
              }`}
            >
              <span className={`text-[10px] uppercase font-bold mb-1 ${activeDay === date.day ? 'text-blue-100' : 'text-slate-300'}`}>Day {date.day}</span>
              <span className="text-xl font-bold">{date.label.split('/')[1]}</span>
              <span className="text-[10px] font-medium opacity-80">週{date.weekday}</span>
            </div>
          ))}
        </div>
      </header>

      {/* --- Content --- */}
      <main className="flex-1 overflow-y-auto">
        {renderContent()}
      </main>

      {/* --- Navigation --- */}
      <nav className="fixed bottom-6 left-6 right-6 h-20 bg-white/80 backdrop-blur-xl rounded-[32px] border border-white/50 shadow-2xl z-40 flex items-center justify-around px-4">
        {[
          { type: TabType.ITINERARY, label: '行程' },
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

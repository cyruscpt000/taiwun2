
import React, { useState, useEffect, useMemo } from 'react';
import { TabType, ItineraryItem, Expense, PackingItem } from './types';
import { MEMBERS, INITIAL_PACKING_LIST, TRAVEL_DATES, DEFAULT_ITINERARY } from './constants';
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
  Save,
  Hotel,
  Navigation,
  Image as ImageIcon,
  Clock,
  ThermometerSun,
  RotateCcw,
  Trash2
} from 'lucide-react';
import { getTaipeiSuggestions } from './geminiService';
import { db } from './firebase';
import { collection, onSnapshot, doc, updateDoc, addDoc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';

// --- Sub-components ---

const CountdownTimer: React.FC = () => {
  const targetDate = new Date('2025-12-30T00:00:00');
  const [daysLeft, setDaysLeft] = useState(0);

  useEffect(() => {
    const calculate = () => {
      const diff = targetDate.getTime() - new Date().getTime();
      setDaysLeft(Math.ceil(diff / (1000 * 60 * 60 * 24)));
    };
    calculate();
    const timer = setInterval(calculate, 60000);
    return () => clearInterval(timer);
  }, []);

  if (daysLeft <= 0) return <span className="text-xs font-black text-emerald-500">旅程進行中！🔥</span>;
  return (
    <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-black tracking-widest flex items-center gap-1 shadow-md shadow-blue-100">
      <Clock size={12} /> 距離出發還有 {daysLeft} 天
    </div>
  );
};

const WeatherCard: React.FC<{ day: number }> = ({ day }) => {
  const weatherMap: Record<number, { temp: string, icon: string, desc: string, color: string }> = {
    1: { temp: '18-22°C', icon: '☁️', desc: '多雲時晴', color: 'from-blue-400 to-indigo-400' },
    2: { temp: '16-19°C', icon: '🌧️', desc: '跨年局部雨', color: 'from-slate-400 to-blue-500' },
    3: { temp: '17-21°C', icon: '☀️', desc: '晴朗舒適', color: 'from-orange-400 to-amber-400' },
    4: { temp: '17-22°C', icon: '☁️', desc: '多雲', color: 'from-blue-300 to-slate-400' },
    5: { temp: '19-23°C', icon: '🌤️', desc: '氣溫回升', color: 'from-sky-400 to-indigo-400' },
  };
  const weather = weatherMap[day] || weatherMap[1];
  return (
    <div className={`mt-4 mx-6 p-4 rounded-[32px] bg-gradient-to-br ${weather.color} text-white shadow-lg flex items-center justify-between`}>
      <div className="flex items-center gap-3">
        <span className="text-3xl">{weather.icon}</span>
        <div>
          <p className="text-[10px] font-black uppercase opacity-70 tracking-widest">Taipei Weather</p>
          <p className="font-bold text-sm">{weather.desc}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 bg-white/20 px-3 py-2 rounded-2xl backdrop-blur-sm">
        <ThermometerSun size={16} />
        <span className="font-black text-sm">{weather.temp}</span>
      </div>
    </div>
  );
};

const TabIcon: React.FC<{ type: TabType; active: boolean }> = ({ type, active }) => {
  const color = active ? 'text-blue-600' : 'text-slate-400';
  const size = 24;
  switch (type) {
    case TabType.ITINERARY: return <Calendar className={color} size={size} />;
    case TabType.LEDGER: return <Wallet className={color} size={size} />;
    case TabType.PREP: return <CheckSquare className={color} size={size} />;
    case TabType.MEMBERS: return <Users className={color} size={size} />;
    default: return <Info className={color} size={size} />;
  }
};

const TimelineCard: React.FC<{ item: ItineraryItem; onClick: (item: ItineraryItem) => void }> = ({ item, onClick }) => {
  const Icon = () => {
    switch (item.type) {
      case 'FLIGHT': return <Plane className="text-blue-500" size={20} />;
      case 'TRANSPORT': return <Bus className="text-blue-600" size={20} />;
      case 'FOOD': return <Utensils className="text-orange-500" size={20} />;
      case 'SIGHT': return <Camera className="text-emerald-500" size={20} />;
      case 'HOTEL': return <Hotel className="text-purple-500" size={20} />;
      default: return <MapPin className="text-blue-500" size={20} />;
    }
  };
  return (
    <div onClick={() => onClick(item)} className="relative flex gap-4 mb-8 group cursor-pointer active:scale-95 transition-all">
      <div className="flex flex-col items-center">
        <div className="z-10 w-4 h-4 rounded-full bg-blue-500 border-4 border-white shadow-md mt-1 transition-transform group-hover:scale-125"></div>
        <div className="text-[11px] text-slate-500 font-bold mt-2 bg-slate-100 px-2 py-0.5 rounded-full">{item.time}</div>
      </div>
      <div className="flex-1 bg-white p-5 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-50 relative">
        <div className="inline-flex p-2.5 bg-slate-50 rounded-2xl mb-3"><Icon /></div>
        <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1 pr-8">{item.title}</h3>
        {item.subtitle && <p className="text-sm text-slate-500 font-medium mb-2">{item.subtitle}</p>}
        {item.location && (
          <div className="flex items-start gap-1.5 mt-3 text-slate-400 text-xs">
            <MapPin size={14} className="text-blue-400 shrink-0 mt-0.5" />
            <span className="leading-snug truncate">{item.location}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>(TabType.ITINERARY);
  const [activeDay, setActiveDay] = useState<number>(1);
  const [itineraryItems, setItineraryItems] = useState<ItineraryItem[]>([]);
  const [packingList, setPackingList] = useState<PackingItem[]>(INITIAL_PACKING_LIST);
  const [aiSuggestion, setAiSuggestion] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPackingModalOpen, setIsPackingModalOpen] = useState(false);
  
  const [editingItem, setEditingItem] = useState<Partial<ItineraryItem> | null>(null);
  const [viewingItem, setViewingItem] = useState<ItineraryItem | null>(null);
  const [editingPackingItem, setEditingPackingItem] = useState<Partial<PackingItem> | null>(null);

  useEffect(() => {
    if (!db) return;
    setIsSyncing(true);
    const unsubItinerary = onSnapshot(query(collection(db, "itinerary"), orderBy("time")), (snapshot) => {
      const items: ItineraryItem[] = [];
      snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() } as ItineraryItem));
      setItineraryItems(items.length ? items : DEFAULT_ITINERARY);
      setIsSyncing(false);
    });
    const unsubPacking = onSnapshot(collection(db, "packingList"), (snapshot) => {
      const items: PackingItem[] = [];
      snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() } as PackingItem));
      if (items.length > 0) setPackingList(items);
    });
    return () => { unsubItinerary(); unsubPacking(); };
  }, []);

  useEffect(() => {
    const fetchAi = async () => {
      setLoadingAi(true);
      const res = await getTaipeiSuggestions(`Day ${activeDay} Taipei trip.`);
      setAiSuggestion(res);
      setLoadingAi(false);
    };
    if (activeTab === TabType.ITINERARY) fetchAi();
  }, [activeDay, activeTab]);

  const resetPackingList = async () => {
    if (!confirm("確定要清除現有清單並恢復為大哥預設的 27 項物資嗎？")) return;
    if (!db) { setPackingList(INITIAL_PACKING_LIST); return; }
    
    // Clear existing
    for (const item of packingList) {
      await deleteDoc(doc(db, "packingList", item.id));
    }
    // Seed new
    for (const item of INITIAL_PACKING_LIST) {
      await setDoc(doc(db, "packingList", item.id), item);
    }
    alert("已成功恢復 27 項物資！");
  };

  const togglePackingItem = async (id: string) => {
    const item = packingList.find(i => i.id === id);
    if (!item) return;
    const newStatus = !item.completed;
    if (db) await updateDoc(doc(db, "packingList", id), { completed: newStatus });
    else setPackingList(prev => prev.map(i => i.id === id ? { ...i, completed: newStatus } : i));
  };

  const saveItinerary = async () => {
    if (!editingItem?.title) return;
    if (db) {
      const data = { ...editingItem };
      if (data.id) { const id = data.id; delete data.id; await updateDoc(doc(db, "itinerary", id), data); }
      else { await addDoc(collection(db, "itinerary"), data); }
    }
    setIsModalOpen(false);
  };

  const savePackingItem = async () => {
    if (!editingPackingItem?.name) return;
    if (db) {
      const data = { ...editingPackingItem };
      if (data.id) { const id = data.id; delete data.id; await updateDoc(doc(db, "packingList", id), data); }
      else { await addDoc(collection(db, "packingList"), data); }
    } else {
      const newItem = { ...editingPackingItem, id: editingPackingItem.id || Date.now().toString(), completed: false } as PackingItem;
      setPackingList(prev => editingPackingItem.id ? prev.map(p => p.id === newItem.id ? newItem : p) : [...prev, newItem]);
    }
    setIsPackingModalOpen(false);
  };

  const deletePackingItem = async () => {
    if (editingPackingItem?.id && db) {
      await deleteDoc(doc(db, "packingList", editingPackingItem.id));
      setIsPackingModalOpen(false);
    }
  };

  const filteredItinerary = useMemo(() => 
    itineraryItems.filter(i => i.day === activeDay).sort((a, b) => a.time.localeCompare(b.time)),
    [itineraryItems, activeDay]
  );

  const renderContent = () => {
    switch (activeTab) {
      case TabType.ITINERARY:
        return (
          <div className="pb-32 px-6">
            <WeatherCard day={activeDay} />
            <div className="flex justify-between items-center mt-10 mb-6">
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">當日行程</h2>
              <button onClick={() => { setEditingItem({ day: activeDay, time: '12:00', type: 'SIGHT' }); setIsModalOpen(true); }} className="bg-blue-600 text-white px-5 py-2.5 rounded-2xl text-sm font-bold shadow-lg flex items-center gap-1">
                <Plus size={18} /> 新增
              </button>
            </div>
            <div className="relative timeline-line">
              {filteredItinerary.map(item => <TimelineCard key={item.id} item={item} onClick={(i) => { setViewingItem(i); setIsDetailOpen(true); }} />)}
            </div>
            <div className="mt-8 p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3"><div className="bg-indigo-600 p-1.5 rounded-xl"><Search size={14} className="text-white" /></div><span className="text-sm font-bold text-indigo-900">小媛嘅 AI 靈感</span></div>
              <p className="text-sm text-slate-600 italic">{loadingAi ? "構思中..." : aiSuggestion}</p>
            </div>
          </div>
        );
      case TabType.PREP:
        return (
          <div className="px-6 pb-32">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">準備清單</h2>
              <div className="flex gap-2">
                <button onClick={resetPackingList} className="bg-slate-100 text-slate-500 p-2.5 rounded-2xl hover:bg-slate-200 transition-all shadow-sm" title="重設預設清單">
                  <RotateCcw size={18} />
                </button>
                <button onClick={() => { setEditingPackingItem({ name: '', assignedTo: '大哥' }); setIsPackingModalOpen(true); }} className="bg-blue-600 text-white px-5 py-2.5 rounded-2xl text-sm font-bold shadow-lg flex items-center gap-1">
                  <Plus size={18} /> 新增
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {packingList.map(item => (
                <div key={item.id} className={`flex items-center justify-between p-5 rounded-3xl border ${item.completed ? 'bg-slate-50 opacity-60' : 'bg-white shadow-sm'}`}>
                  <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => togglePackingItem(item.id)}>
                    <div className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center ${item.completed ? 'bg-green-500 border-green-500' : 'border-slate-200'}`}>
                      {item.completed && <CheckSquare className="text-white" size={14} />}
                    </div>
                    <div>
                      <span className={`font-bold ${item.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>{item.name}</span>
                      <p className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${item.assignedTo === '大哥' ? 'text-blue-500' : 'text-pink-500'}`}>{item.assignedTo} 負責</p>
                    </div>
                  </div>
                  <button onClick={() => { setEditingPackingItem(item); setIsPackingModalOpen(true); }} className="p-2 text-slate-300 hover:text-blue-500"><Edit2 size={16}/></button>
                </div>
              ))}
            </div>
          </div>
        );
      default: return <div className="p-10 text-center text-slate-400">分頁開發中...</div>;
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen relative flex flex-col bg-slate-50 overflow-x-hidden">
      
      {/* Detail Modal */}
      {isDetailOpen && viewingItem && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[110] flex items-end justify-center">
          <div className="bg-white w-full rounded-t-[50px] p-8 pb-12 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black mb-2 inline-block">Day {viewingItem.day} • {viewingItem.time}</span>
                <h3 className="text-3xl font-black text-slate-900 leading-tight">{viewingItem.title}</h3>
                <p className="text-slate-500 font-bold mt-1">{viewingItem.subtitle}</p>
              </div>
              <button onClick={() => setIsDetailOpen(false)} className="p-3 bg-slate-100 rounded-2xl text-slate-500"><X size={20}/></button>
            </div>
            <div className="space-y-6">
              {viewingItem.location && (
                <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                  <div className="flex items-center gap-2 mb-2 text-slate-400 font-black text-[10px] uppercase tracking-widest"><MapPin size={14}/> 地點</div>
                  <p className="text-slate-800 font-bold mb-4">{viewingItem.location}</p>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(viewingItem.location)}`} target="_blank" rel="noreferrer" className="w-full bg-white text-blue-600 border border-blue-100 py-4 rounded-[24px] font-black flex items-center justify-center gap-2 shadow-sm">
                    <Navigation size={18}/> Google Maps 導航
                  </a>
                </div>
              )}
              <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                <div className="flex items-center gap-2 mb-4 text-slate-400 font-black text-[10px] uppercase tracking-widest"><ImageIcon size={14}/> 旅遊相簿</div>
                <button className="w-full aspect-video bg-slate-200 rounded-3xl flex flex-col items-center justify-center border-2 border-dashed border-slate-300 text-slate-400 hover:text-blue-500 transition-all">
                  <Plus size={32}/>
                  <span className="text-xs font-bold mt-2">上傳照片</span>
                </button>
              </div>
              <button onClick={() => { setEditingItem(viewingItem); setIsDetailOpen(false); setIsModalOpen(true); }} className="w-full bg-blue-600 text-white py-5 rounded-[24px] font-black shadow-xl shadow-blue-100 active:scale-95 transition-all">修改行程內容</button>
            </div>
          </div>
        </div>
      )}

      {/* Packing Modal */}
      {isPackingModalOpen && editingPackingItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[48px] p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">{editingPackingItem.id ? '修改物資' : '新增物資'}</h3>
              <button onClick={() => setIsPackingModalOpen(false)}><X size={24}/></button>
            </div>
            <div className="space-y-4">
              <input type="text" placeholder="物資名稱" value={editingPackingItem.name} onChange={e => setEditingPackingItem({...editingPackingItem, name: e.target.value})} className="w-full bg-slate-100 border-none rounded-2xl p-4 font-bold" />
              <div className="grid grid-cols-2 gap-2">
                {MEMBERS.map(m => (
                  <button key={m.name} onClick={() => setEditingPackingItem({...editingPackingItem, assignedTo: m.name})} className={`py-3 rounded-xl font-bold transition-all ${editingPackingItem.assignedTo === m.name ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>{m.name}</button>
                ))}
              </div>
              <div className="flex gap-2 pt-4">
                {editingPackingItem.id && <button onClick={deletePackingItem} className="flex-1 bg-rose-50 text-rose-500 py-4 rounded-2xl font-black"><Trash2 size={20} className="mx-auto"/></button>}
                <button onClick={savePackingItem} className="flex-[3] bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg">儲存</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Itinerary Edit Modal (Simplified) */}
      {isModalOpen && editingItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[48px] p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6"><h3 className="text-2xl font-black text-slate-800">編輯行程</h3><button onClick={() => setIsModalOpen(false)}><X size={24}/></button></div>
            <div className="space-y-4">
              <input type="time" value={editingItem.time} onChange={e => setEditingItem({...editingItem, time: e.target.value})} className="w-full bg-slate-100 border-none rounded-2xl p-4 font-bold" />
              <input type="text" placeholder="標題" value={editingItem.title || ''} onChange={e => setEditingItem({...editingItem, title: e.target.value})} className="w-full bg-slate-100 border-none rounded-2xl p-4 font-bold" />
              <input type="text" placeholder="地點" value={editingItem.location || ''} onChange={e => setEditingItem({...editingItem, location: e.target.value})} className="w-full bg-slate-100 border-none rounded-2xl p-4 font-bold" />
              <button onClick={saveItinerary} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl">儲存</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="pt-12 pb-8 px-6 bg-white rounded-b-[50px] shadow-sm mb-4 sticky top-0 z-30 ring-1 ring-slate-100">
        <div className="flex justify-between items-start mb-6">
          <div><div className="flex items-center gap-2 mb-2"><h1 className="text-3xl font-black text-slate-900 tracking-tighter">Taipei 2025</h1><div className={`w-2 h-2 rounded-full ${db ? 'bg-green-500 sync-active' : 'bg-slate-300'}`}></div></div><CountdownTimer /></div>
          <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">{isSyncing ? <RefreshCw size={20} className="animate-spin" /> : <CloudSun size={20} />}</div>
        </div>
        <div className="flex gap-4 overflow-x-auto custom-scrollbar py-2 -mx-6 px-6">
          {TRAVEL_DATES.map(date => (
            <div key={date.day} onClick={() => setActiveDay(date.day)} className={`flex-shrink-0 flex flex-col items-center justify-center w-[68px] h-[86px] rounded-[24px] transition-all duration-300 cursor-pointer ${activeDay === date.day ? 'bg-blue-600 text-white shadow-lg -translate-y-1' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
              <span className="text-[10px] font-black mb-1 opacity-70">D{date.day}</span>
              <span className="text-xl font-black leading-none mb-1">{date.label.split('/')[1]}</span>
              <span className="text-[10px] font-black">{date.weekday}</span>
            </div>
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">{renderContent()}</main>

      {/* Navigation */}
      <nav className="fixed bottom-8 left-8 right-8 h-20 bg-white/90 backdrop-blur-2xl rounded-[35px] border border-white/50 shadow-xl z-40 flex items-center justify-around px-6">
        {[TabType.ITINERARY, TabType.LEDGER, TabType.PREP, TabType.MEMBERS].map(type => (
          <button key={type} onClick={() => setActiveTab(type)} className="flex flex-col items-center gap-1 transition-all active:scale-75">
            <TabIcon type={type} active={activeTab === type} />
            <span className={`text-[10px] font-black uppercase ${activeTab === type ? 'text-blue-600' : 'text-slate-400'}`}>{type === TabType.ITINERARY ? '行程' : type === TabType.LEDGER ? '記帳' : type === TabType.PREP ? '清單' : '成員'}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;

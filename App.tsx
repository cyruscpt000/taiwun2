
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TabType, ItineraryItem, Expense, PackingItem, Member } from './types';
import { MEMBERS as INITIAL_MEMBERS, TRAVEL_DATES, DEFAULT_ITINERARY } from './constants';
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
  X,
  Save,
  Hotel,
  Navigation,
  CloudSun,
  Trash2,
  Calculator,
  ArrowRightLeft,
  ShieldAlert,
  Leaf,
  Flower2,
  Coins,
  TrendingUp,
  ExternalLink
} from 'lucide-react';
import { db } from './firebase';
import { collection, onSnapshot, doc, updateDoc, addDoc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';

// --- Sub-components ---

const CountdownTimer: React.FC = () => {
  const targetDate = new Date('2025-12-30T00:00:00');
  const [daysLeft, setDaysLeft] = useState(0);

  useEffect(() => {
    const calculate = () => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      setDaysLeft(Math.ceil(diff / (1000 * 60 * 60 * 24)));
    };
    calculate();
    const timer = setInterval(calculate, 60000);
    return () => clearInterval(timer);
  }, []);

  if (daysLeft < 0) return <span className="text-xs font-black text-emerald-600">正在享受台北中！🏕️</span>;
  if (daysLeft === 0) return <span className="text-xs font-black text-orange-500">今日出發啦！🛫</span>;
  
  return (
    <div className="text-[10px] font-black tracking-widest text-[#8D6E63] uppercase mt-1 flex items-center gap-1">
      <Leaf size={10} className="text-[#8DB359]" /> 距離出發仲有 <span className="text-sm text-[#8DB359] mx-0.5">{daysLeft}</span> 日
    </div>
  );
};

const WeatherCard: React.FC<{ day: number }> = ({ day }) => {
  const weatherMap: Record<number, { temp: string, icon: string, desc: string, color: string }> = {
    1: { temp: '18-22°C', icon: '☁️', desc: '多雲時晴', color: 'from-[#A5D6A7] to-[#81C784]' },
    2: { temp: '16-19°C', icon: '🌧️', desc: '跨年局部雨', color: 'from-[#81C784] to-[#66BB6A]' },
    3: { temp: '17-21°C', icon: '☀️', desc: '晴朗舒適', color: 'from-[#FFF176] to-[#FFEE58]' },
    4: { temp: '17-22°C', icon: '☁️', desc: '多雲', color: 'from-[#C5E1A5] to-[#AED581]' },
    5: { temp: '19-23°C', icon: '🌤️', desc: '氣溫回升', color: 'from-[#81C784] to-[#A5D6A7]' },
  };
  const weather = weatherMap[day] || weatherMap[1];
  return (
    <div className="mt-4 mx-6 p-6 rounded-[40px] bg-[#FFF9E5] border-2 border-[#EEDEB0] flex items-center justify-between group cursor-pointer hover:shadow-md transition-all">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-[#8DB359] rounded-2xl shadow-sm text-white">
           <MapPin size={20} />
        </div>
        <div>
          <h3 className="font-black text-[#4E342E] text-lg">台北市</h3>
          <p className="text-sm text-[#8D6E63] font-bold">{weather.desc} • {weather.temp}</p>
        </div>
      </div>
      <div className="text-[#8DB359] float-anim">
         <Flower2 size={24} />
      </div>
    </div>
  );
};

const TabIcon: React.FC<{ type: TabType; active: boolean }> = ({ type, active }) => {
  const color = active ? 'text-[#8DB359]' : 'text-[#D7CCC8]';
  const size = 26;
  switch (type) {
    case TabType.ITINERARY: return <Calendar className={color} size={size} />;
    case TabType.LEDGER: return <Wallet className={color} size={size} />;
    case TabType.PREP: return <CheckSquare className={color} size={size} />;
    case TabType.MEMBERS: return <Users className={color} size={size} />;
    case TabType.INFO: return <Info className={color} size={size} />;
    default: return <Info className={color} size={size} />;
  }
};

const TimelineCard: React.FC<{ item: ItineraryItem; onClick: (item: ItineraryItem) => void }> = ({ item, onClick }) => {
  const Icon = () => {
    switch (item.type) {
      case 'FLIGHT': return <Plane className="text-white" size={24} />;
      case 'TRANSPORT': return <Bus className="text-white" size={24} />;
      case 'FOOD': return <Utensils className="text-white" size={24} />;
      case 'SIGHT': return <Camera className="text-white" size={24} />;
      case 'HOTEL': return <Hotel className="text-white" size={24} />;
      default: return <MapPin className="text-white" size={24} />;
    }
  };

  const handleMapClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 防止觸發編輯視窗
    if (item.location) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}`, '_blank');
    }
  };

  return (
    <div onClick={() => onClick(item)} className="relative flex gap-6 mb-10 group cursor-pointer transition-all active:scale-95">
      <div className="flex flex-col items-center">
        <div className="text-lg font-black text-[#4E342E] tabular-nums">{item.time}</div>
        <div className="z-10 w-4 h-4 rounded-full bg-[#8DB359] border-[4px] border-[#FCF6E5] shadow-sm mt-2"></div>
      </div>
      <div className="flex-1 bg-[#FFFDF7] p-6 rounded-[35px] shadow-[0_8px_0_rgba(238,222,176,0.5)] border-2 border-[#EEDEB0] relative hover:translate-y-[-2px] transition-all">
        <div className="inline-flex p-3 bg-[#8DB359] rounded-2xl mb-4 shadow-sm"><Icon /></div>
        <h3 className="font-black text-[#4E342E] text-xl leading-tight mb-1">{item.title}</h3>
        {item.subtitle && <p className="text-sm text-[#8D6E63] font-bold">{item.subtitle}</p>}
        {item.location && (
          <div 
            onClick={handleMapClick}
            className="flex items-center gap-1.5 mt-4 text-[#8DB359] text-xs font-bold bg-[#E8F5E9] py-2 px-4 rounded-full w-fit hover:bg-[#8DB359] hover:text-white transition-colors"
          >
            <MapPin size={12} className="shrink-0" />
            <span className="truncate max-w-[150px]">{item.location}</span>
            <ExternalLink size={10} />
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main App ---

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>(TabType.ITINERARY);
  const [activeDay, setActiveDay] = useState<number>(1);
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [currentMemberName, setCurrentMemberName] = useState<string>(INITIAL_MEMBERS[0].name);
  
  const currentUser = useMemo(() => members.find(m => m.name === currentMemberName) || members[0], [members, currentMemberName]);
  
  const [itineraryItems, setItineraryItems] = useState<ItineraryItem[]>([]);
  const [packingList, setPackingList] = useState<PackingItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals
  const [isItineraryModalOpen, setIsItineraryModalOpen] = useState(false);
  const [editingItinerary, setEditingItinerary] = useState<Partial<ItineraryItem> | null>(null);
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    amount: 0,
    category: '食飯',
    description: '',
    paidBy: currentUser.name,
    date: new Date().toISOString().split('T')[0]
  });

  // Sync Logic
  useEffect(() => {
    if (!db) return;
    setIsSyncing(true);

    const unsubMembers = onSnapshot(collection(db, "members"), (snapshot) => {
      const items: Member[] = [];
      snapshot.forEach(doc => items.push({ ...doc.data() } as Member));
      if (items.length) {
        setMembers(items);
      } else {
        INITIAL_MEMBERS.forEach(m => setDoc(doc(db, "members", m.name), m));
      }
    });

    const unsubItinerary = onSnapshot(query(collection(db, "itinerary"), orderBy("time")), (snapshot) => {
      const items: ItineraryItem[] = [];
      snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() } as ItineraryItem));
      // Fallback if DB empty
      setItineraryItems(items.length ? items : DEFAULT_ITINERARY);
      setIsSyncing(false);
    });

    const unsubPacking = onSnapshot(collection(db, "packingList"), (snapshot) => {
      const items: PackingItem[] = [];
      snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() } as PackingItem));
      setPackingList(items);
    });

    const unsubExpenses = onSnapshot(query(collection(db, "expenses"), orderBy("date", "desc")), (snapshot) => {
      const items: Expense[] = [];
      snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() } as Expense));
      setExpenses(items);
    });

    return () => { unsubMembers(); unsubItinerary(); unsubPacking(); unsubExpenses(); };
  }, []);

  useEffect(() => {
    setNewExpense(prev => ({ ...prev, paidBy: currentUser.name }));
  }, [currentUser]);

  // Currency Converter
  const [twdInput, setTwdInput] = useState<string>("100");
  const [hkdOutput, setHkdOutput] = useState<string>("");
  const [rate, setRate] = useState<number>(4.1);

  useEffect(() => {
    const twd = parseFloat(twdInput) || 0;
    setHkdOutput((twd / rate).toFixed(2));
  }, [twdInput, rate]);

  const totalTwd = useMemo(() => expenses.reduce((sum, e) => sum + (e.amount || 0), 0), [expenses]);
  const totalHkd = useMemo(() => (totalTwd / rate).toFixed(1), [totalTwd, rate]);

  // Actions
  const saveExpense = async () => {
    if (!newExpense.amount || !newExpense.description) return;
    if (db) {
      await addDoc(collection(db, "expenses"), {
        ...newExpense,
        amount: Number(newExpense.amount),
        createdAt: new Date()
      });
    }
    setIsExpenseModalOpen(false);
    setNewExpense({ amount: 0, category: '食飯', description: '', paidBy: currentUser.name, date: new Date().toISOString().split('T')[0] });
  };

  const saveItinerary = async () => {
    if (!editingItinerary?.title || !editingItinerary?.time) return;
    if (db) {
      const itemData = {
        ...editingItinerary,
        day: activeDay,
        updatedAt: new Date()
      };
      if (editingItinerary.id) {
        await updateDoc(doc(db, "itinerary", editingItinerary.id), itemData);
      } else {
        await addDoc(collection(db, "itinerary"), itemData);
      }
    }
    setIsItineraryModalOpen(false);
    setEditingItinerary(null);
  };

  const deleteItinerary = async () => {
    if (editingItinerary?.id && db) {
      if (confirm("真係要刪除呢個行程？")) {
        await deleteDoc(doc(db, "itinerary", editingItinerary.id));
        setIsItineraryModalOpen(false);
        setEditingItinerary(null);
      }
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      if (db) {
        await updateDoc(doc(db, "members", currentUser.name), { avatar: base64String });
      }
    };
    reader.readAsDataURL(file);
  };

  const deleteExpense = async (id: string) => {
    if (db && confirm("確定要刪除呢筆數？")) {
      await deleteDoc(doc(db, "expenses", id));
    }
  };

  const togglePackingItem = async (id: string) => {
    const item = packingList.find(i => i.id === id);
    if (!item) return;
    const newStatus = !item.completed;
    if (db) await updateDoc(doc(db, "packingList", id), { completed: newStatus });
  };

  const filteredItinerary = useMemo(() => 
    itineraryItems.filter(i => i.day === activeDay).sort((a, b) => a.time.localeCompare(b.time)),
    [itineraryItems, activeDay]
  );

  return (
    <div className="max-w-md mx-auto min-h-screen relative flex flex-col bg-[#FCF6E5] overflow-x-hidden font-sans paper-texture pb-32">
      
      <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />

      {/* Currency Modal */}
      {isCurrencyModalOpen && (
        <div className="fixed inset-0 bg-[#4E342E]/40 backdrop-blur-sm z-[150] flex items-center justify-center p-6">
          <div className="bg-white w-full rounded-[50px] p-8 shadow-[0_20px_0_#EEDEB0] border-4 border-[#EEDEB0] animate-in zoom-in-95 duration-200">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-[#4E342E] tracking-tight text-center w-full">快速換算 💰</h3>
                <button onClick={() => setIsCurrencyModalOpen(false)} className="absolute right-10 p-2 bg-[#F5F5F5] rounded-full hover:bg-rose-50 transition-colors"><X size={20}/></button>
             </div>
             <div className="space-y-6">
                <div className="bg-[#FFF9E5] p-6 rounded-[35px] border-2 border-[#EEDEB0]">
                   <p className="text-[10px] font-black uppercase text-[#A1887F] mb-2 tracking-widest text-center">台幣 TWD</p>
                   <input type="number" inputMode="decimal" value={twdInput} onChange={e => setTwdInput(e.target.value)} className="bg-transparent border-none p-0 text-3xl font-black text-[#4E342E] w-full focus:ring-0 text-center" />
                </div>
                <div className="flex justify-center -my-3 relative z-10"><div className="bg-[#8DB359] text-white p-3 rounded-full shadow-lg border-4 border-white"><ArrowRightLeft size={20} /></div></div>
                <div className="bg-[#F1F8E9] p-6 rounded-[35px] border-2 border-[#C5E1A5]">
                   <p className="text-[10px] font-black uppercase text-[#689F38] mb-2 tracking-widest text-center">港幣 HKD</p>
                   <div className="text-3xl font-black text-[#689F38] text-center">$ {hkdOutput}</div>
                </div>
             </div>
             <button onClick={() => setIsCurrencyModalOpen(false)} className="w-full bg-[#4E342E] text-white py-5 rounded-[30px] font-black mt-8 shadow-lg active:translate-y-1 transition-all">好啦！</button>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-[#4E342E]/50 backdrop-blur-sm z-[150] flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="bg-white w-full max-w-md rounded-t-[50px] sm:rounded-[50px] p-8 border-t-4 sm:border-4 border-[#EEDEB0] shadow-2xl animate-in slide-in-from-bottom duration-300">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-[#4E342E]">新增消費 🖊️</h3>
                <button onClick={() => setIsExpenseModalOpen(false)} className="p-2 bg-slate-50 rounded-full hover:bg-rose-50 transition-colors"><X size={20}/></button>
             </div>
             <div className="space-y-5">
                <div className="bg-[#FFF9E5] p-5 rounded-[30px] border-2 border-[#EEDEB0]">
                   <label className="text-[10px] font-black uppercase text-[#A1887F] mb-1 block">金額 (TWD)</label>
                   <input type="number" inputMode="decimal" value={newExpense.amount || ''} onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})} placeholder="0" className="bg-transparent border-none p-0 text-3xl font-black text-[#4E342E] w-full focus:ring-0" />
                </div>
                <div className="bg-white p-5 rounded-[30px] border-2 border-[#EEDEB0]">
                   <label className="text-[10px] font-black uppercase text-[#A1887F] mb-1 block">項目描述</label>
                   <input type="text" value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} placeholder="例如：大稻埕魯肉飯" className="bg-transparent border-none p-0 text-lg font-bold text-[#4E342E] w-full focus:ring-0" />
                </div>
             </div>
             <button onClick={saveExpense} className="w-full bg-[#8DB359] text-white py-5 rounded-[30px] font-black mt-8 shadow-lg active:scale-95 transition-all">記低佢！🌿</button>
          </div>
        </div>
      )}

      {/* Itinerary Modal (Add/Edit) */}
      {isItineraryModalOpen && (
        <div className="fixed inset-0 bg-[#4E342E]/50 backdrop-blur-sm z-[150] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[50px] p-8 border-4 border-[#EEDEB0] shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-[#4E342E]">{editingItinerary?.id ? '修改行程 ✍️' : '新增冒險 🗺️'}</h3>
                <button onClick={() => { setIsItineraryModalOpen(false); setEditingItinerary(null); }} className="p-2 bg-slate-50 rounded-full hover:bg-rose-50 transition-colors"><X size={20}/></button>
             </div>
             <div className="space-y-4">
                <div className="bg-[#FFF9E5] p-5 rounded-[30px] border-2 border-[#EEDEB0]">
                   <label className="text-[10px] font-black uppercase text-[#A1887F] mb-1 block">標題</label>
                   <input type="text" value={editingItinerary?.title || ''} onChange={e => setEditingItinerary({...editingItinerary, title: e.target.value})} placeholder="要去邊度？" className="bg-transparent border-none p-0 text-xl font-black text-[#4E342E] w-full focus:ring-0" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-[25px] border-2 border-[#EEDEB0]">
                     <label className="text-[10px] font-black uppercase text-[#A1887F] mb-2 block">時間</label>
                     <input type="time" value={editingItinerary?.time || ''} onChange={e => setEditingItinerary({...editingItinerary, time: e.target.value})} className="bg-transparent border-none p-0 text-lg font-bold text-[#4E342E] w-full focus:ring-0" />
                  </div>
                  <div className="bg-white p-4 rounded-[25px] border-2 border-[#EEDEB0]">
                     <label className="text-[10px] font-black uppercase text-[#A1887F] mb-2 block">類別</label>
                     <select value={editingItinerary?.type || 'SIGHT'} onChange={e => setEditingItinerary({...editingItinerary, type: e.target.value as any})} className="w-full bg-transparent border-none p-0 text-sm font-bold text-[#4E342E] focus:ring-0 outline-none">
                        <option value="SIGHT">📸 景點</option>
                        <option value="FOOD">🍱 嘢食</option>
                        <option value="TRANSPORT">🚌 交通</option>
                        <option value="FLIGHT">✈️ 飛機</option>
                        <option value="HOTEL">🏨 住宿</option>
                     </select>
                  </div>
                </div>
                <div className="bg-white p-5 rounded-[30px] border-2 border-[#EEDEB0]">
                   <label className="text-[10px] font-black uppercase text-[#A1887F] mb-1 block">地址 (Google Map 用)</label>
                   <input type="text" value={editingItinerary?.location || ''} onChange={e => setEditingItinerary({...editingItinerary, location: e.target.value})} placeholder="詳細地址" className="bg-transparent border-none p-0 text-base font-bold text-[#4E342E] w-full focus:ring-0" />
                </div>
                <div className="bg-white p-5 rounded-[30px] border-2 border-[#EEDEB0]">
                   <label className="text-[10px] font-black uppercase text-[#A1887F] mb-1 block">備註 / 副標題</label>
                   <input type="text" value={editingItinerary?.subtitle || ''} onChange={e => setEditingItinerary({...editingItinerary, subtitle: e.target.value})} placeholder="例如：要付訂金" className="bg-transparent border-none p-0 text-base font-bold text-[#4E342E] w-full focus:ring-0" />
                </div>
             </div>
             <div className="flex gap-4 mt-8">
                {editingItinerary?.id && (
                   <button onClick={deleteItinerary} className="flex-1 bg-rose-50 text-rose-500 py-5 rounded-[30px] font-black shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-rose-100"><Trash2 size={20} /> 刪除</button>
                )}
                <button onClick={saveItinerary} className="flex-[2] bg-[#8DB359] text-white py-5 rounded-[30px] font-black shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-[#689F38]"><Save size={20} /> 儲存</button>
             </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="pt-16 pb-8 px-8 bg-[#FCF6E5]/90 sticky top-0 z-40">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-black text-[#4E342E] tracking-tighter flex items-center gap-2">Taipei 2025 <Leaf className="text-[#8DB359]" fill="#8DB359" size={24} /></h1>
            <CountdownTimer />
          </div>
          <div className="flex gap-3">
             <button onClick={() => setIsCurrencyModalOpen(true)} className="p-3 bg-white text-[#8DB359] rounded-[22px] shadow-[0_4px_0_#EEDEB0] border-2 border-[#EEDEB0] active:translate-y-1 active:shadow-none transition-all hover:bg-green-50"><Calculator size={22} /></button>
             <button className="p-3 bg-white text-[#FBC02D] rounded-[22px] shadow-[0_4px_0_#EEDEB0] border-2 border-[#EEDEB0]"><CloudSun size={22} /></button>
             <div onClick={() => setActiveTab(TabType.MEMBERS)} className="w-12 h-12 rounded-[22px] overflow-hidden border-4 border-white shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-all"><img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" /></div>
          </div>
        </div>
        {activeTab === TabType.ITINERARY && (
          <div className="flex gap-6 overflow-x-auto custom-scrollbar py-6 -mx-8 px-8 mt-4">
            {TRAVEL_DATES.map(date => (
              <div key={date.day} onClick={() => setActiveDay(date.day)} className={`flex-shrink-0 flex flex-col items-center justify-center w-[76px] h-[100px] rounded-[35px] transition-all duration-300 cursor-pointer ${
                activeDay === date.day ? 'bg-[#8DB359] text-white shadow-[0_6px_0_#689F38] -translate-y-1' : 'text-[#D7CCC8] bg-white border-2 border-[#EEDEB0] hover:border-[#8DB359] hover:text-[#8DB359]'
              }`}>
                <span className="text-[10px] font-black mb-1 opacity-80 uppercase tracking-tighter">Day {date.day}</span>
                <span className="text-2xl font-black leading-none mb-1">{date.label.split('/')[1]}</span>
                <span className="text-[10px] font-black opacity-80">週{date.weekday}</span>
              </div>
            ))}
          </div>
        )}
      </header>

      <main className="flex-1">
        {activeTab === TabType.ITINERARY ? (
          <div className="pb-8">
            <WeatherCard day={activeDay} />
            <div className="flex justify-between items-center px-8 mt-12 mb-8">
              <h2 className="text-2xl font-black text-[#4E342E] flex items-center gap-3"><div className="w-2 h-8 bg-[#8DB359] rounded-full"></div>今日冒險</h2>
              <button onClick={() => { setEditingItinerary({ time: '12:00', type: 'SIGHT' }); setIsItineraryModalOpen(true); }} className="bg-white text-[#8DB359] px-5 py-3 rounded-[24px] text-sm font-black flex items-center gap-1 shadow-[0_4px_0_#EEDEB0] border-2 border-[#EEDEB0] active:translate-y-1 active:shadow-none transition-all hover:bg-green-50"><Plus size={18} /> 新增</button>
            </div>
            <div className="relative px-8">{filteredItinerary.map(item => <TimelineCard key={item.id} item={item} onClick={(i) => { setEditingItinerary(i); setIsItineraryModalOpen(true); }} />)}</div>
          </div>
        ) : activeTab === TabType.LEDGER ? (
          <div className="px-8 pb-12 pt-4">
             <div className="grid grid-cols-2 gap-4 mb-10">
                <div className="bg-white rounded-[40px] p-6 border-4 border-[#EEDEB0] shadow-[0_8px_0_#EEDEB0]">
                   <div className="flex items-center gap-2 mb-2"><Coins className="text-[#8DB359]" size={16} /><span className="text-[10px] font-black text-[#A1887F] uppercase tracking-widest">總台幣</span></div>
                   <p className="text-2xl font-black text-[#4E342E] tabular-nums">{totalTwd.toLocaleString()}</p>
                </div>
                <div className="bg-[#F1F8E9] rounded-[40px] p-6 border-4 border-[#C5E1A5] shadow-[0_8px_0_#C5E1A5]">
                   <div className="flex items-center gap-2 mb-2"><TrendingUp className="text-[#689F38]" size={16} /><span className="text-[10px] font-black text-[#689F38] uppercase tracking-widest">折合港幣</span></div>
                   <p className="text-2xl font-black text-[#4E342E] tabular-nums">$ {totalHkd}</p>
                </div>
             </div>
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-[#4E342E] flex items-center gap-3">收支明細</h2>
                <button onClick={() => setIsExpenseModalOpen(true)} className="bg-[#8DB359] text-white px-5 py-3 rounded-[24px] text-sm font-black shadow-lg flex items-center gap-1 active:scale-90 transition-all hover:bg-[#689F38]"><Plus size={18} /> 記帳</button>
             </div>
             <div className="space-y-4">{expenses.map(exp => (
                <div key={exp.id} className="bg-white rounded-[35px] p-6 border-2 border-[#EEDEB0] shadow-[0_6px_0_rgba(238,222,176,0.3)] relative group">
                   <div className="flex justify-between items-start">
                      <div className="flex gap-4">
                         <div className="w-12 h-12 bg-[#FFF9E5] rounded-2xl flex items-center justify-center text-xl shadow-sm">{exp.category === '食飯' ? '🍱' : '🎒'}</div>
                         <div><h4 className="font-black text-[#4E342E]">{exp.description}</h4><span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">{exp.paidBy} 畀錢</span></div>
                      </div>
                      <div className="text-right"><p className="text-lg font-black text-[#4E342E] tabular-nums">{exp.amount} TWD</p></div>
                   </div>
                   <button onClick={() => deleteExpense(exp.id)} className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600"><X size={12}/></button>
                </div>
             ))}</div>
          </div>
        ) : activeTab === TabType.MEMBERS ? (
          <div className="px-8 pb-8 pt-4">
             <div className="flex items-center gap-5 mb-10">
                <div className="bg-[#E8F5E9] p-5 rounded-[30px] text-[#8DB359] shadow-inner"><Users size={32} /></div>
                <div><h2 className="text-3xl font-black text-[#4E342E]">Trip Members</h2><p className="text-xs font-bold text-[#A1887F]">Collaborators for Taipei 2025</p></div>
             </div>
             <div className="grid grid-cols-2 gap-6">
                {members.map(member => (
                  <div key={member.name} onClick={() => setCurrentMemberName(member.name)} className={`bg-white rounded-[45px] p-6 text-center border-4 transition-all active:scale-95 cursor-pointer relative ${currentUser.name === member.name ? 'border-[#8DB359] shadow-[0_12px_0_#E8F5E9]' : 'border-white shadow-[0_12px_0_rgba(78,52,46,0.05)]'}`}>
                     <div className="relative mx-auto w-24 h-24 mb-5 group">
                        <img src={member.avatar} alt={member.name} className={`w-full h-full object-cover rounded-full border-4 shadow-sm ${currentUser.name === member.name ? 'border-[#8DB359]' : 'border-[#F5F5F5]'}`} />
                        {currentUser.name === member.name && (
                           <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="absolute bottom-0 right-0 bg-[#4E342E] text-white p-2.5 rounded-full border-2 border-white shadow-xl hover:bg-[#8DB359] transition-colors"><Camera size={14} /></button>
                        )}
                     </div>
                     <h3 className="text-xl font-black text-[#4E342E] mb-1">{member.name}</h3>
                     <p className="text-[10px] font-bold text-[#A1887F] uppercase tracking-wider mb-4 leading-relaxed">{member.role}</p>
                     {currentUser.name === member.name && <div className="inline-block bg-[#E8F5E9] text-[#8DB359] text-[10px] font-black px-5 py-1.5 rounded-full uppercase tracking-widest border border-[#8DB359]/20">YOU</div>}
                  </div>
                ))}
             </div>
          </div>
        ) : activeTab === TabType.PREP ? (
          <div className="px-8 pb-8 pt-4">
             <h2 className="text-2xl font-black text-[#4E342E] mb-8">準備清單 🎒</h2>
             <div className="space-y-4">{packingList.map(item => (
                <div key={item.id} className={`flex items-center justify-between p-6 rounded-[35px] border-2 transition-all ${item.completed ? 'bg-[#F5F5F5] border-[#E0E0E0] opacity-50' : 'bg-white border-[#EEDEB0] shadow-[0_6px_0_#EEDEB0]'}`}>
                  <div className="flex items-center gap-5 flex-1 cursor-pointer" onClick={() => togglePackingItem(item.id)}>
                    <div className={`w-8 h-8 rounded-2xl border-2 flex items-center justify-center transition-all ${item.completed ? 'bg-[#8DB359] border-[#8DB359]' : 'border-[#EEDEB0] bg-[#FFF9E5]'}`}>
                      {item.completed && <CheckSquare className="text-white" size={18} />}
                    </div>
                    <div><span className={`text-lg font-black ${item.completed ? 'line-through text-[#A1887F]' : 'text-[#4E342E]'}`}>{item.name}</span></div>
                  </div>
                </div>
             ))}</div>
          </div>
        ) : activeTab === TabType.INFO ? (
          <div className="px-8 pb-8 pt-4">
             <h2 className="text-2xl font-black text-[#4E342E] mb-6"><MapPin className="text-[#8DB359]" size={28} /> 旅行資訊</h2>
             <a href="tel:110" className="bg-white rounded-[40px] p-8 text-center border-4 border-[#EEDEB0] shadow-[0_8px_0_#EEDEB0] block mb-6 active:translate-y-1 transition-all">
                <p className="text-[10px] font-black text-[#A1887F] uppercase mb-3">報警 (110)</p>
                <p className="text-5xl font-black text-rose-500">110</p>
             </a>
             <a href="tel:119" className="bg-white rounded-[40px] p-8 text-center border-4 border-[#EEDEB0] shadow-[0_8px_0_#EEDEB0] block active:translate-y-1 transition-all">
                <p className="text-[10px] font-black text-[#A1887F] uppercase mb-3">救護 (119)</p>
                <p className="text-5xl font-black text-rose-500">119</p>
             </a>
          </div>
        ) : null}
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-10 left-6 right-6 h-24 bg-[#FFFDF7]/95 backdrop-blur-xl rounded-[45px] border-4 border-[#EEDEB0] shadow-[0_15px_35px_rgba(78,52,46,0.15)] z-40 flex items-center justify-around px-4">
        {[TabType.ITINERARY, TabType.INFO, TabType.LEDGER, TabType.PREP, TabType.MEMBERS].map(type => (
          <button key={type} onClick={() => setActiveTab(type)} className="flex flex-col items-center gap-1 transition-all active:scale-75 group">
             <div className={`p-2.5 rounded-2xl transition-all ${activeTab === type ? 'bg-[#8DB359] text-white shadow-lg -translate-y-2' : 'bg-transparent'}`}>
               <TabIcon type={type} active={activeTab === type} />
             </div>
             <span className={`text-[10px] font-black tracking-tighter ${activeTab === type ? 'text-[#8DB359]' : 'text-[#D7CCC8]'}`}>
               {type === TabType.ITINERARY ? '行程' : type === TabType.INFO ? '資訊' : type === TabType.LEDGER ? '記帳' : type === TabType.PREP ? '準備' : '成員'}
             </span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;


import React, { useState, useEffect, useMemo } from 'react';
import { TabType, ItineraryItem, Expense, PackingItem, Member, PrepCategory } from './types';
import { MEMBERS as INITIAL_MEMBERS, TRAVEL_DATES, INITIAL_PACKING_LIST } from './constants';
import { 
  Calendar, 
  Wallet, 
  CheckSquare, 
  Users, 
  Plus, 
  MapPin, 
  Plane, 
  Bus, 
  Utensils, 
  Camera,
  Hotel,
  Trash2,
  RefreshCw,
  Edit3,
  Loader2,
  Heart,
  Star,
  ShoppingBag,
  Info,
  Map as MapIcon,
  CloudRain,
  Navigation,
  X,
  StickyNote,
  Zap
} from 'lucide-react';
import { db } from './firebase';
import { collection, onSnapshot, doc, updateDoc, setDoc, deleteDoc, query, orderBy, getDocs } from 'firebase/firestore';
import { fetchFlightStatus } from './geminiService';

// --- Sub-components ---

const TimelineCard: React.FC<{ item: ItineraryItem, onDelete: (id: string) => void, onEdit: (item: ItineraryItem) => void }> = ({ item, onDelete, onEdit }) => {
  const Icon = () => {
    switch (item.type) {
      case 'FLIGHT': return <Plane className="text-white" size={20} />;
      case 'TRANSPORT': return <Bus className="text-white" size={20} />;
      case 'FOOD': return <Utensils className="text-white" size={20} />;
      case 'SIGHT': return <Camera className="text-white" size={20} />;
      case 'HOTEL': return <Hotel className="text-white" size={20} />;
      default: return <MapPin className="text-white" size={20} />;
    }
  };

  return (
    <div className="relative flex gap-4 mb-8 group">
      <div className="flex flex-col items-center">
        <div className="text-sm font-black text-[#4E342E] tabular-nums">{item.time}</div>
        <div className="z-10 w-3 h-3 rounded-full bg-[#8DB359] border-2 border-[#FCF6E5] mt-1 shadow-sm"></div>
      </div>
      <div className="flex-1 bg-white p-5 rounded-[30px] shadow-sm border-2 border-[#EEDEB0] relative group-hover:border-[#8DB359] transition-all">
        <div className="flex justify-between items-start">
            <div className="inline-flex p-2.5 bg-[#8DB359] rounded-xl mb-3 shadow-sm"><Icon /></div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => onEdit(item)} className="p-2 text-[#8DB359] hover:bg-[#8DB359]/10 rounded-full transition-colors">
                    <Edit3 size={16} />
                </button>
                <button onClick={() => onDelete(item.id)} className="p-2 text-[#D7CCC8] hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors">
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
        <h3 className="font-black text-[#4E342E] text-lg leading-tight">{item.title}</h3>
        {item.location && (
          <p className="text-[10px] text-[#8DB359] font-black uppercase mt-2 flex items-center gap-1">
            <MapPin size={10} /> {item.location}
          </p>
        )}
        {item.notes && (
          <div className="mt-3 p-3 bg-[#FDFBF3] rounded-2xl border border-[#EEDEB0]/50">
            <p className="text-[11px] text-[#8D6E63] flex gap-2">
              <StickyNote size={12} className="flex-shrink-0 mt-0.5" />
              {item.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>(TabType.ITINERARY);
  const [activeDay, setActiveDay] = useState<number>(1);
  const [activePrepCategory, setActivePrepCategory] = useState<PrepCategory>('TODO');
  const [members] = useState<Member[]>(INITIAL_MEMBERS);
  const [currentMemberName, setCurrentMemberName] = useState<string>(INITIAL_MEMBERS[0].name);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingFlight, setIsUpdatingFlight] = useState<string | null>(null);
  
  const [itineraryItems, setItineraryItems] = useState<ItineraryItem[]>([]);
  const [packingList, setPackingList] = useState<PackingItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Itinerary Form states
  const [editingItinId, setEditingItinId] = useState<string | null>(null);
  const [newItinTime, setNewItinTime] = useState('');
  const [newItinTitle, setNewItinTitle] = useState('');
  const [newItinLocation, setNewItinLocation] = useState('');
  const [newItinNotes, setNewItinNotes] = useState('');
  const [newItinType, setNewItinType] = useState<ItineraryItem['type']>('SIGHT');
  
  // Trip Config
  const firstDay = TRAVEL_DATES[0].day;
  const lastDay = TRAVEL_DATES[TRAVEL_DATES.length - 1].day;

  // Sync Data
  useEffect(() => {
    if (!db) { setIsLoading(false); return; }
    const unsubItinerary = onSnapshot(query(collection(db, "itinerary"), orderBy("time")), (snapshot) => {
      const items: ItineraryItem[] = [];
      snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() } as ItineraryItem));
      setItineraryItems(items);
      setIsLoading(false);
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
    return () => { unsubItinerary(); unsubPacking(); unsubExpenses(); };
  }, []);

  const countdown = useMemo(() => {
    const target = new Date('2025-12-30').getTime();
    const now = new Date().getTime();
    const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }, []);

  const totalTwd = useMemo(() => expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0), [expenses]);
  const currentDayLocations = useMemo(() => itineraryItems.filter(i => i.day === activeDay && i.location).map(i => i.location), [itineraryItems, activeDay]);
  const currentDayFlights = useMemo(() => itineraryItems.filter(i => i.day === activeDay && i.type === 'FLIGHT'), [itineraryItems, activeDay]);
  const currentDayOtherItems = useMemo(() => itineraryItems.filter(i => i.day === activeDay && i.type !== 'FLIGHT'), [itineraryItems, activeDay]);

  // Actions
  const saveItinerary = async () => {
    if (!newItinTitle.trim() || !newItinTime.trim() || !db || isSaving) return;
    setIsSaving(true);
    try {
      const id = editingItinId || `itin-${Date.now()}`;
      await setDoc(doc(db, "itinerary", id), { 
        id, 
        time: newItinTime, 
        title: newItinTitle, 
        location: newItinLocation, 
        notes: newItinNotes,
        type: newItinType, 
        day: activeDay 
      }, { merge: true });
      resetItinForm();
    } finally { setIsSaving(false); }
  };

  const resetItinForm = () => {
    setEditingItinId(null);
    setNewItinTitle('');
    setNewItinLocation('');
    setNewItinTime('');
    setNewItinNotes('');
    setNewItinType('SIGHT');
  };

  const handleEditItin = (item: ItineraryItem) => {
    setEditingItinId(item.id);
    setNewItinTime(item.time);
    setNewItinTitle(item.title);
    setNewItinLocation(item.location || '');
    setNewItinNotes(item.notes || '');
    setNewItinType(item.type);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteItinerary = async (id: string) => {
    if (!db || !window.confirm("確定刪除？")) return;
    await deleteDoc(doc(db, "itinerary", id));
  };

  const autoUpdateFlight = async (flight: ItineraryItem) => {
    if (!db || isUpdatingFlight) return;
    setIsUpdatingFlight(flight.id);
    try {
      const dateStr = TRAVEL_DATES.find(d => d.day === flight.day)?.label || "today";
      const result = await fetchFlightStatus(flight.title, dateStr);
      
      // 簡單提取資訊 (因為 Gemini 返回的是純文本)
      const eta = result.match(/ETA: ([^,]+)/)?.[1] || "";
      const terminal = result.match(/Terminal: ([^,]+)/)?.[1] || "";
      const gate = result.match(/Gate: ([^,]+)/)?.[1] || "";

      await updateDoc(doc(db, "itinerary", flight.id), {
        arrivalTime: eta.trim(),
        terminal: terminal.trim(),
        gate: gate.trim(),
        notes: `AI 於 ${new Date().toLocaleTimeString()} 更新: ${result}`
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdatingFlight(null);
    }
  };

  const addExpense = async () => {
    const amount = parseFloat(newExpenseAmount);
    if (!newExpenseDesc.trim() || isNaN(amount) || !db || isSaving) return;
    setIsSaving(true);
    try {
      const newId = `expense-${Date.now()}`;
      await setDoc(doc(db, "expenses", newId), { id: newId, description: newExpenseDesc, amount, category: newExpenseCategory, paidBy: currentMemberName, date: new Date().toISOString() });
      setNewExpenseDesc(''); setNewExpenseAmount('');
    } finally { setIsSaving(false); }
  };

  const [newExpenseDesc, setNewExpenseDesc] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newExpenseCategory, setNewExpenseCategory] = useState('FOOD');
  const [newPrepItemName, setNewPrepItemName] = useState('');

  const openGoogleMapsRoute = () => {
    if (currentDayLocations.length === 0) return;
    const url = `https://www.google.com/maps/dir/${currentDayLocations.map(encodeURIComponent).join('/')}`;
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-md mx-auto min-h-screen relative flex flex-col bg-[#FDFBF3] overflow-x-hidden pb-40">
      
      {isLoading && (
        <div className="fixed inset-0 bg-[#FDFBF3] z-[200] flex flex-col items-center justify-center">
          <RefreshCw className="text-[#8DB359] animate-spin mb-4" size={40} />
          <p className="font-black text-[#4E342E] uppercase text-xs">同步中...</p>
        </div>
      )}

      {/* Header */}
      <header className="pt-10 pb-6 px-8 bg-[#FDFBF3] sticky top-0 z-40">
        <div className="flex justify-between items-start mb-4">
            <div className="flex flex-col">
                <h1 className="text-3xl font-black text-[#85C2A2] tracking-tighter drop-shadow-sm">小媛族</h1>
                <div className="flex gap-2 mt-1">
                    <span className="bg-[#8DB359] text-white px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                        <Calendar size={10} /> 倒數 {countdown} 天
                    </span>
                    <span className="bg-[#EEDEB0] text-[#8D6E63] px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                        <CloudRain size={10} /> 台北 18°C 陰
                    </span>
                </div>
            </div>
            <div className="flex -space-x-3">
                {members.map(m => (
                    <div key={m.name} onClick={() => setCurrentMemberName(m.name)} className={`w-12 h-12 rounded-full border-2 border-white overflow-hidden shadow-md cursor-pointer transition-all ${currentMemberName === m.name ? 'ring-2 ring-[#8DB359] scale-110 z-10' : 'opacity-40 hover:opacity-100'}`}>
                        <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                    </div>
                ))}
            </div>
        </div>
      </header>

      <main className="flex-1 px-6">
        {/* Day Selector */}
        {(activeTab === TabType.ITINERARY || activeTab === TabType.MAP) && (
            <div className="flex gap-4 overflow-x-auto custom-scrollbar mb-8 py-2">
                {TRAVEL_DATES.map(date => (
                <div key={date.day} onClick={() => setActiveDay(date.day)} className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-3xl transition-all ${
                    activeDay === date.day ? 'bg-[#8DB359] text-white shadow-lg scale-105' : 'bg-white border-2 border-[#EEDEB0] text-[#8DB359]'
                }`}>
                    <span className="text-[10px] font-black">{date.label}</span>
                    <span className="text-lg font-black">{date.weekday}</span>
                </div>
                ))}
            </div>
        )}

        {activeTab === TabType.ITINERARY ? (
          <div className="pb-8">
            {/* Form */}
            <div className={`bg-white rounded-[40px] p-6 border-4 shadow-sm mb-10 transition-all ${editingItinId ? 'border-[#8DB359]' : 'border-[#E8F1E7]'}`}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-black text-[#4E342E] flex items-center gap-2 text-sm">
                        {editingItinId ? <Edit3 size={16} className="text-[#8DB359]" /> : <Plus size={16} />}
                        {editingItinId ? `修改行程` : `新增行程`}
                    </h3>
                    {editingItinId && <button onClick={resetItinForm} className="text-[#D7CCC8] hover:text-[#4E342E]"><X size={18}/></button>}
                </div>
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <input type="time" value={newItinTime} onChange={e => setNewItinTime(e.target.value)} className="bg-[#FDFBF3] p-3 rounded-2xl border-none font-black text-xs w-28" />
                        <input type="text" value={newItinTitle} onChange={e => setNewItinTitle(e.target.value)} placeholder="機件號/行程名" className="flex-1 bg-[#FDFBF3] p-3 rounded-2xl border-none font-black text-xs" />
                    </div>
                    <input type="text" value={newItinLocation} onChange={e => setNewItinLocation(e.target.value)} placeholder="地點 (可選)" className="w-full bg-[#FDFBF3] p-3 rounded-2xl border-none font-black text-xs" />
                    <textarea value={newItinNotes} onChange={e => setNewItinNotes(e.target.value)} placeholder="備註" className="w-full bg-[#FDFBF3] p-3 rounded-2xl border-none font-black text-xs min-h-[60px] resize-none" />
                    <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                        {[{ id: 'FLIGHT', label: '飛機', icon: <Plane size={14}/> }, { id: 'FOOD', label: '食嘢', icon: <Utensils size={14}/> }, { id: 'TRANSPORT', label: '交通', icon: <Bus size={14}/> }, { id: 'SIGHT', label: '景點', icon: <Camera size={14}/> }, { id: 'HOTEL', label: '酒店', icon: <Hotel size={14}/> }].map(type => (
                          <button key={type.id} onClick={() => setNewItinType(type.id as any)} className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black transition-all ${newItinType === type.id ? 'bg-[#8DB359] text-white' : 'bg-[#FDFBF3] text-[#8DB359]'}`}>
                            {type.icon} {type.label}
                          </button>
                        ))}
                    </div>
                    <button onClick={saveItinerary} disabled={isSaving || !newItinTitle} className="w-full py-3 bg-[#8DB359] text-white rounded-2xl font-black shadow-lg flex items-center justify-center gap-2 text-sm">
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : editingItinId ? '更新行程' : '增加行程'}
                    </button>
                </div>
            </div>

            {/* Flight Board Display */}
            {(activeDay === firstDay || activeDay === lastDay) && currentDayFlights.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-3">
                  <Plane size={18} className="text-[#8DB359]" />
                  <h4 className="font-black text-[#4E342E] text-sm uppercase tracking-widest">航班看板</h4>
                </div>
                <div className="space-y-4">
                  {currentDayFlights.map(flight => (
                    <div key={flight.id} className="bg-[#1A1A1A] text-white p-6 rounded-[35px] shadow-2xl relative overflow-hidden border-t-4 border-[#8DB359]">
                      <div className="flex justify-between items-start mb-6 relative z-10">
                        <div>
                          <p className="text-[10px] font-black text-[#8DB359] uppercase tracking-[0.2em] mb-1">Flight Number</p>
                          <h3 className="text-2xl font-black font-mono">{flight.title}</h3>
                        </div>
                        <button 
                          onClick={() => autoUpdateFlight(flight)}
                          disabled={isUpdatingFlight === flight.id}
                          className="flex items-center gap-2 px-3 py-1.5 bg-[#8DB359] text-black rounded-full text-[10px] font-black active:scale-95 transition-all disabled:opacity-50"
                        >
                          {isUpdatingFlight === flight.id ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} fill="currentColor" />}
                          AI 更新
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-6 relative z-10 border-y border-white/10 py-4">
                        <div className="text-center">
                          <p className="text-[9px] font-black opacity-40 uppercase mb-1">Departure</p>
                          <p className="text-lg font-black font-mono">{flight.time}</p>
                        </div>
                        <div className="text-center border-x border-white/10">
                          <p className="text-[9px] font-black opacity-40 uppercase mb-1">Arrival</p>
                          <p className="text-lg font-black font-mono text-[#8DB359]">{flight.arrivalTime || '--:--'}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[9px] font-black opacity-40 uppercase mb-1">Status</p>
                          <p className="text-[10px] font-black text-green-400 mt-1 uppercase tracking-tighter">On Time</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center relative z-10 px-2">
                        <div className="flex gap-8">
                          <div>
                            <p className="text-[9px] font-black opacity-40 uppercase mb-0.5">Terminal</p>
                            <p className="text-xl font-black font-mono">{flight.terminal || '-'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black opacity-40 uppercase mb-0.5">Gate</p>
                            <p className="text-xl font-black font-mono text-[#EEDEB0]">{flight.gate || '-'}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleEditItin(flight)} className="p-2 bg-white/5 rounded-full"><Edit3 size={14}/></button>
                          <button onClick={() => deleteItinerary(flight.id)} className="p-2 bg-white/5 rounded-full text-rose-400"><Trash2 size={14}/></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="space-y-2 relative timeline-line pl-2">
                {currentDayOtherItems.map(item => (
                    <TimelineCard key={item.id} item={item} onDelete={deleteItinerary} onEdit={handleEditItin} />
                ))}
            </div>
          </div>
        ) : activeTab === TabType.MAP ? (
            <div className="pb-8">
                <div className="bg-white rounded-[40px] p-8 border-4 border-[#E8F1E7] shadow-sm mb-10 text-center">
                    <MapIcon size={40} className="mx-auto mb-4 text-[#8DB359]" />
                    <h3 className="text-xl font-black text-[#4E342E] mb-2">Day {activeDay} 路線圖</h3>
                    <button onClick={openGoogleMapsRoute} className="w-full py-5 bg-[#8DB359] text-white rounded-3xl font-black shadow-lg flex items-center justify-center gap-3">
                        <Navigation size={24} /> Google Maps 完整導航
                    </button>
                </div>
                <div className="space-y-4">
                    {itineraryItems.filter(i => i.day === activeDay && i.location).map((item, idx) => (
                        <div key={item.id} className="flex items-center gap-4 bg-white p-5 rounded-[30px] border-2 border-[#EEDEB0] shadow-sm">
                            <div className="w-10 h-10 bg-[#8DB359] text-white rounded-full flex items-center justify-center font-black text-sm">{idx + 1}</div>
                            <div className="flex-1"><p className="font-black text-[#4E342E]">{item.title}</p></div>
                            <button onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location || '')}`, '_blank')} className="p-3 text-[#8DB359] bg-[#FDFBF3] rounded-2xl"><MapPin size={20} /></button>
                        </div>
                    ))}
                </div>
            </div>
        ) : activeTab === TabType.LEDGER ? (
            <div className="pt-4 pb-8">
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-[#8DB359] p-6 rounded-[35px] shadow-lg text-white">
                        <p className="text-[10px] font-black uppercase opacity-80">總額 (TWD)</p>
                        <p className="text-3xl font-black tabular-nums">{totalTwd}</p>
                    </div>
                    <div className="bg-white p-6 rounded-[35px] border-4 border-[#EEDEB0]">
                        <p className="text-[10px] font-black text-[#8D6E63] uppercase">約港幣 (HKD)</p>
                        <p className="text-2xl font-black tabular-nums">${(totalTwd / 4.1).toFixed(1)}</p>
                    </div>
                </div>
                <div className="bg-white rounded-[40px] p-6 border-4 border-[#E8F1E7] mb-10">
                    <h3 className="font-black text-[#4E342E] mb-4 flex items-center gap-2 text-sm"><Wallet size={16} /> 快速記帳</h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <input type="text" value={newExpenseDesc} onChange={e => setNewExpenseDesc(e.target.value)} placeholder="買左咩？" className="bg-[#FDFBF3] p-3 rounded-2xl border-none font-black text-xs" />
                            <input type="number" value={newExpenseAmount} onChange={e => setNewExpenseAmount(e.target.value)} placeholder="台幣？" className="bg-[#FDFBF3] p-3 rounded-2xl border-none font-black text-xs" />
                        </div>
                        <button onClick={addExpense} className="w-full py-3 bg-[#8DB359] text-white rounded-2xl font-black shadow-lg flex items-center justify-center gap-2">記低佢</button>
                    </div>
                </div>
                <div className="space-y-4">
                    {expenses.map(e => (
                        <div key={e.id} className="bg-white p-5 rounded-[30px] border-2 border-[#EEDEB0] flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#FDFBF3] rounded-2xl flex items-center justify-center text-[#8DB359]">
                                    {e.category === 'FOOD' ? <Utensils size={20}/> : e.category === 'SHOPPING' ? <ShoppingBag size={20}/> : <Info size={20}/>}
                                </div>
                                <div><p className="font-black text-[#4E342E] text-sm">{e.description}</p><p className="text-[9px] font-bold text-[#8DB359] uppercase">{e.paidBy} 畀咗</p></div>
                            </div>
                            <div className="flex items-center gap-3"><p className="text-lg font-black text-[#4E342E] tabular-nums">{e.amount}</p><button onClick={() => deleteDoc(doc(db, "expenses", e.id))} className="p-2 text-[#D7CCC8] hover:text-rose-500"><Trash2 size={16}/></button></div>
                        </div>
                    ))}
                </div>
            </div>
        ) : activeTab === TabType.PREP ? (
            <div className="pb-8">
                <div className="grid grid-cols-4 gap-2 mb-8 bg-[#E9F3E8] p-1.5 rounded-[30px]">
                    {['TODO', 'LUGGAGE', 'WANT', 'BUY'].map(cat => (
                        <button key={cat} onClick={() => setActivePrepCategory(cat as PrepCategory)} className={`py-3 rounded-[24px] text-[12px] font-black transition-all ${activePrepCategory === cat ? 'bg-[#8DB359] text-white shadow-md' : 'text-[#8DB359]/60'}`}>
                            {cat === 'TODO' ? '待辦' : cat === 'LUGGAGE' ? '行李' : cat === 'WANT' ? '想去' : '採購'}
                        </button>
                    ))}
                </div>
                <div className="relative mb-8">
                    <input type="text" value={newPrepItemName} onChange={e => setNewPrepItemName(e.target.value)} placeholder={`新增項目...`} className="w-full bg-white rounded-[35px] border-4 border-[#E8F1E7] px-8 py-6 shadow-sm font-black outline-none" />
                    <button onClick={async () => {
                        if (!newPrepItemName.trim()) return;
                        const newId = `prep-${Date.now()}`;
                        await setDoc(doc(db, "packingList", newId), { id: newId, name: newPrepItemName, completedBy: [], category: activePrepCategory });
                        setNewPrepItemName('');
                    }} className="absolute right-2 bottom-2 w-14 h-14 bg-[#8DB359] rounded-[24px] flex items-center justify-center text-white shadow-lg"><Plus size={28} /></button>
                </div>
                <div className="space-y-4">
                    {packingList.filter(i => i.category === activePrepCategory).map(item => (
                        <div key={item.id} className="bg-white p-6 rounded-[35px] border-4 border-[#E8F1E7] shadow-sm">
                            <div className="flex items-center justify-between mb-4"><span className="text-lg font-black text-[#5E4E42]">{item.name}</span><button onClick={() => deleteDoc(doc(db, "packingList", item.id))} className="text-[#D7CCC8] hover:text-rose-500"><Trash2 size={18} /></button></div>
                            <div className="flex gap-2">
                                {members.map(m => {
                                    const isDone = (item.completedBy || []).includes(m.name);
                                    return (
                                        <button key={m.name} onClick={async () => {
                                            let n = [...(item.completedBy || [])];
                                            n = n.includes(m.name) ? n.filter(x => x !== m.name) : [...n, m.name];
                                            await updateDoc(doc(db, "packingList", item.id), { completedBy: n });
                                        }} className={`px-4 py-2 rounded-full text-[10px] font-black border-2 ${isDone ? 'bg-[#8DB359] border-[#8DB359] text-white shadow-sm' : 'bg-white border-[#E8F1E7] text-[#8DB359]'}`}>
                                            {m.name} {isDone && '✓'}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        ) : activeTab === TabType.MEMBERS ? (
          <div className="pt-4 pb-8">
            <h2 className="text-2xl font-black text-[#4E342E] mb-6 flex items-center gap-2"><Users size={24} className="text-[#8DB359]" /> 旅行伙伴</h2>
            <div className="space-y-6">
              {members.map(member => (
                <div key={member.name} className={`bg-white rounded-[40px] p-8 border-4 border-[#E8F1E7] shadow-sm flex flex-col items-center relative transition-all ${currentMemberName === member.name ? 'ring-4 ring-[#8DB359]/30 scale-[1.02]' : ''}`}>
                  <div className="w-32 h-32 rounded-full border-8 border-[#FDFBF3] overflow-hidden shadow-xl mb-6 ring-4 ring-[#E8F1E7]"><img src={member.avatar} className="w-full h-full object-cover" /></div>
                  <h3 className="text-2xl font-black text-[#4E342E] mb-1">{member.name}</h3>
                  <button onClick={() => setCurrentMemberName(member.name)} className={`w-full py-4 rounded-[25px] font-black transition-all flex items-center justify-center gap-2 ${currentMemberName === member.name ? 'bg-[#8DB359] text-white shadow-md' : 'bg-[#FDFBF3] text-[#8DB359] border-2 border-[#E8F1E7]'}`}>
                    {currentMemberName === member.name ? <Star size={18} fill="currentColor" /> : <Heart size={18} />} {currentMemberName === member.name ? '已切換為此身分' : '切換為此身分'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </main>

      <nav className="fixed bottom-8 left-4 right-4 h-24 bg-white/95 backdrop-blur-md rounded-[40px] border-4 border-[#E8F1E7] shadow-xl z-50 flex items-center justify-around px-2">
        {[{ type: TabType.ITINERARY, label: '行程', icon: <Calendar size={20}/> }, { type: TabType.MAP, label: '地圖', icon: <MapIcon size={20}/> }, { type: TabType.LEDGER, label: '記帳', icon: <Wallet size={20}/> }, { type: TabType.PREP, label: '準備', icon: <CheckSquare size={20}/> }, { type: TabType.MEMBERS, label: '成員', icon: <Users size={20}/> }].map(n => (
          <button key={n.label} onClick={() => setActiveTab(n.type as TabType)} className={`flex flex-col items-center gap-1 transition-all ${activeTab === n.type ? 'text-[#8DB359] -translate-y-2' : 'text-[#D7CCC8]'}`}>
            {n.icon} <span className="text-[9px] font-black">{n.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;

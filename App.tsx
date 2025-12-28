
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
  X,
  Hotel,
  Trash2,
  RefreshCw,
  Edit3,
  Loader2,
  Heart,
  Star,
  ShoppingBag,
  Info
} from 'lucide-react';
import { db } from './firebase';
import { collection, onSnapshot, doc, updateDoc, setDoc, deleteDoc, query, orderBy, getDocs } from 'firebase/firestore';

// --- Sub-components ---

const TimelineCard: React.FC<{ item: ItineraryItem }> = ({ item }) => {
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

  return (
    <div className="relative flex gap-6 mb-10 group transition-all">
      <div className="flex flex-col items-center">
        <div className="text-lg font-black text-[#4E342E] tabular-nums">{item.time}</div>
        <div className="z-10 w-4 h-4 rounded-full bg-[#8DB359] border-[4px] border-[#FCF6E5] mt-2"></div>
      </div>
      <div className="flex-1 bg-white p-6 rounded-[35px] shadow-sm border-2 border-[#EEDEB0] relative">
        <div className="inline-flex p-3 bg-[#8DB359] rounded-2xl mb-4 shadow-sm"><Icon /></div>
        <h3 className="font-black text-[#4E342E] text-xl leading-tight mb-1">{item.title}</h3>
        {item.location && <p className="text-[10px] text-[#8DB359] font-black uppercase mt-2">{item.location}</p>}
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const [itineraryItems, setItineraryItems] = useState<ItineraryItem[]>([]);
  const [packingList, setPackingList] = useState<PackingItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Form states
  const [newPrepItemName, setNewPrepItemName] = useState('');
  const [newExpenseDesc, setNewExpenseDesc] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newExpenseCategory, setNewExpenseCategory] = useState('FOOD');

  // 強化數據同步
  useEffect(() => {
    if (!db) {
        setIsLoading(false);
        return;
    }

    const syncCloud = async () => {
      try {
        const packSnap = await getDocs(collection(db, "packingList"));
        if (packSnap.empty || packSnap.size < 5) {
          const batchPromises = INITIAL_PACKING_LIST.map(item => 
            setDoc(doc(db, "packingList", item.id), item)
          );
          await Promise.all(batchPromises);
        }
      } catch (e) {
        console.error("Cloud seed failed:", e);
      }
    };

    syncCloud();

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

  const filteredPrepList = useMemo(() => {
    return packingList
      .filter(item => item.category === activePrepCategory)
      .sort((a, b) => a.id.includes('custom') ? -1 : 1);
  }, [packingList, activePrepCategory]);

  const totalTwd = useMemo(() => expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0), [expenses]);

  // Actions
  const toggleMemberCompletion = async (itemId: string, memberName: string) => {
    if (!db) return;
    const item = packingList.find(i => i.id === itemId);
    if (!item) return;

    let newCompletedBy = [...(item.completedBy || [])];
    if (newCompletedBy.includes(memberName)) {
      newCompletedBy = newCompletedBy.filter(name => name !== memberName);
    } else {
      newCompletedBy.push(memberName);
    }
    
    await updateDoc(doc(db, "packingList", itemId), { completedBy: newCompletedBy });
  };

  const addPrepItem = async () => {
    const name = newPrepItemName.trim();
    if (!name || !db || isSaving) return;
    setIsSaving(true);
    try {
      const newId = `custom-${Date.now()}`;
      await setDoc(doc(db, "packingList", newId), {
        id: newId,
        name: name,
        completedBy: [],
        category: activePrepCategory
      });
      setNewPrepItemName('');
    } catch (e) { alert("儲存失敗"); } finally { setIsSaving(false); }
  };

  const deletePrepItem = async (id: string) => {
    if (!db || deletingId) return;
    setDeletingId(id);
    try { await deleteDoc(doc(db, "packingList", id)); } finally { setDeletingId(null); }
  };

  const addExpense = async () => {
    const desc = newExpenseDesc.trim();
    const amount = parseFloat(newExpenseAmount);
    if (!desc || isNaN(amount) || !db || isSaving) return;
    
    setIsSaving(true);
    try {
      const newId = `expense-${Date.now()}`;
      await setDoc(doc(db, "expenses", newId), {
        id: newId,
        description: desc,
        amount: amount,
        category: newExpenseCategory,
        paidBy: currentMemberName,
        date: new Date().toISOString()
      });
      setNewExpenseDesc('');
      setNewExpenseAmount('');
    } catch (e) { alert("記帳失敗"); } finally { setIsSaving(false); }
  };

  const deleteExpense = async (id: string) => {
    if (!db) return;
    try { await deleteDoc(doc(db, "expenses", id)); } catch (e) { alert("刪除失敗"); }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen relative flex flex-col bg-[#FDFBF3] overflow-x-hidden pb-40">
      
      {isLoading && (
        <div className="fixed inset-0 bg-[#FDFBF3] z-[200] flex flex-col items-center justify-center">
          <RefreshCw className="text-[#8DB359] animate-spin mb-4" size={40} />
          <p className="font-black text-[#4E342E] uppercase tracking-widest text-xs">小媛族正在連線...</p>
        </div>
      )}

      {/* Header */}
      <header className="pt-12 pb-6 px-8 bg-[#FDFBF3] sticky top-0 z-40">
        <div className="flex justify-between items-center mb-2">
            <div className="flex flex-col">
                <h1 className="text-3xl font-black text-[#85C2A2] tracking-tighter drop-shadow-sm">小媛族</h1>
                <p className="text-[10px] font-bold text-[#8DB359] flex items-center gap-1 uppercase tracking-wider">✈️ 2025 TAIPEI TRIP</p>
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
        {activeTab === TabType.ITINERARY ? (
          <div className="pb-8">
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
            <div className="space-y-4">
                {itineraryItems.filter(i => i.day === activeDay).map(item => <TimelineCard key={item.id} item={item} />)}
            </div>
          </div>
        ) : activeTab === TabType.PREP ? (
          <div className="pb-8">
             <div className="grid grid-cols-4 gap-2 mb-8 bg-[#E9F3E8] p-1.5 rounded-[30px]">
                {['TODO', 'LUGGAGE', 'WANT', 'BUY'].map(cat => (
                  <button key={cat} onClick={() => setActivePrepCategory(cat as PrepCategory)} className={`py-3 rounded-[24px] text-[13px] font-black transition-all ${activePrepCategory === cat ? 'bg-[#8DB359] text-white shadow-md' : 'text-[#8DB359]/60'}`}>
                    {cat === 'TODO' ? '待辦' : cat === 'LUGGAGE' ? '行李' : cat === 'WANT' ? '想去' : '採購'}
                  </button>
                ))}
             </div>
             <div className="relative mb-10">
                <div className="bg-white rounded-[35px] border-4 border-[#E8F1E7] px-8 py-6 shadow-sm flex items-center min-h-[100px]">
                   <input type="text" value={newPrepItemName} onChange={e => setNewPrepItemName(e.target.value)} placeholder={`新增項目...`} className="flex-1 bg-transparent border-none focus:ring-0 font-black text-[#5E4E42] text-xl outline-none" />
                </div>
                <button onClick={addPrepItem} disabled={isSaving || !newPrepItemName.trim()} className="absolute right-2 bottom-2 w-16 h-16 bg-[#8DB359] rounded-[24px] flex items-center justify-center text-white shadow-lg active:scale-90 transition-all"><Plus size={36} /></button>
             </div>
             <div className="space-y-6">
                {filteredPrepList.map(item => (
                    <div key={item.id} className="flex flex-col p-6 rounded-[35px] border-4 bg-white shadow-sm border-[#E8F1E7]">
                      <div className="flex items-center justify-between mb-4">
                         <span className="text-xl font-black text-[#5E4E42]">{item.name}</span>
                         <button onClick={() => deletePrepItem(item.id)} className="p-3 text-[#D7CCC8] hover:text-rose-500 transition-colors"><Trash2 size={20} /></button>
                      </div>
                      <div className="flex gap-3">
                        {members.map(m => {
                          const isDone = (item.completedBy || []).includes(m.name);
                          return (
                            <button key={m.name} onClick={() => toggleMemberCompletion(item.id, m.name)} className={`px-5 py-3 rounded-full text-[11px] font-black flex items-center gap-2 border-2 ${isDone ? 'bg-[#8DB359] border-[#8DB359] text-white' : 'bg-white border-[#E8F1E7] text-[#8DB359]'}`}>
                              <img src={m.avatar} className="w-5 h-5 rounded-full object-cover" /> {m.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                ))}
             </div>
          </div>
        ) : activeTab === TabType.LEDGER ? (
            <div className="pt-4 pb-8">
                {/* Total Summary */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-[#8DB359] p-6 rounded-[35px] shadow-lg text-white">
                        <p className="text-[10px] font-black uppercase opacity-80">總額 (TWD)</p>
                        <p className="text-3xl font-black tabular-nums">{totalTwd}</p>
                    </div>
                    <div className="bg-white p-6 rounded-[35px] border-4 border-[#EEDEB0] shadow-sm">
                        <p className="text-[10px] font-black text-[#8D6E63] uppercase">約港幣 (HKD)</p>
                        <p className="text-2xl font-black tabular-nums">${(totalTwd / 4.1).toFixed(1)}</p>
                    </div>
                </div>

                {/* Input Area */}
                <div className="bg-white rounded-[40px] p-6 border-4 border-[#E8F1E7] shadow-sm mb-10">
                    <h3 className="font-black text-[#4E342E] mb-4 flex items-center gap-2"><Edit3 size={18} /> 快速記帳</h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <input type="text" value={newExpenseDesc} onChange={e => setNewExpenseDesc(e.target.value)} placeholder="項目名 (例: 魯肉飯)" className="bg-[#FDFBF3] p-4 rounded-2xl border-none font-black focus:ring-2 ring-[#8DB359] text-[#4E342E]" />
                            <input type="number" value={newExpenseAmount} onChange={e => setNewExpenseAmount(e.target.value)} placeholder="金額 (TWD)" className="bg-[#FDFBF3] p-4 rounded-2xl border-none font-black focus:ring-2 ring-[#8DB359] text-[#4E342E]" />
                        </div>
                        <div className="flex gap-2">
                            {['FOOD', 'TRANSPORT', 'SHOPPING', 'OTHER'].map(cat => (
                                <button key={cat} onClick={() => setNewExpenseCategory(cat)} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${newExpenseCategory === cat ? 'bg-[#8DB359] text-white' : 'bg-[#FDFBF3] text-[#8DB359]'}`}>
                                    {cat === 'FOOD' ? '餐飲' : cat === 'TRANSPORT' ? '交通' : cat === 'SHOPPING' ? '購物' : '其他'}
                                </button>
                            ))}
                        </div>
                        <button onClick={addExpense} disabled={isSaving} className="w-full py-4 bg-[#8DB359] text-white rounded-2xl font-black shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all">
                           {isSaving ? <Loader2 className="animate-spin" /> : <><Plus size={20} /> 記低佢</>}
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="space-y-4">
                    {expenses.map(e => (
                        <div key={e.id} className="bg-white p-6 rounded-[30px] border-2 border-[#EEDEB0] flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-[#FDFBF3] rounded-2xl flex items-center justify-center text-[#8DB359]">
                                    {e.category === 'FOOD' ? <Utensils size={24}/> : e.category === 'SHOPPING' ? <ShoppingBag size={24}/> : e.category === 'TRANSPORT' ? <Bus size={24}/> : <Info size={24}/>}
                                </div>
                                <div>
                                    <p className="font-black text-[#4E342E]">{e.description}</p>
                                    <p className="text-[10px] font-bold text-[#8DB359] uppercase">{e.paidBy} 畀咗</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <p className="text-xl font-black text-[#4E342E]">{e.amount} <span className="text-[10px]">TWD</span></p>
                                <button onClick={() => deleteExpense(e.id)} className="p-2 text-[#D7CCC8] hover:text-rose-500"><Trash2 size={18}/></button>
                            </div>
                        </div>
                    ))}
                    {expenses.length === 0 && <p className="text-center opacity-20 font-black italic py-10">暫時未有開支</p>}
                </div>
            </div>
        ) : activeTab === TabType.MEMBERS ? (
          <div className="pt-4 pb-8">
            <h2 className="text-2xl font-black text-[#4E342E] mb-6 px-2 flex items-center gap-2"><Users size={24} className="text-[#8DB359]" /> 旅行伙伴</h2>
            <div className="space-y-6">
              {members.map(member => (
                <div key={member.name} className={`bg-white rounded-[40px] p-8 border-4 border-[#E8F1E7] shadow-sm flex flex-col items-center relative transition-all ${currentMemberName === member.name ? 'ring-4 ring-[#8DB359]/30 scale-[1.02]' : ''}`}>
                  <div className="w-32 h-32 rounded-full border-8 border-[#FDFBF3] overflow-hidden shadow-xl mb-6 ring-4 ring-[#E8F1E7]"><img src={member.avatar} className="w-full h-full object-cover" /></div>
                  <h3 className="text-2xl font-black text-[#4E342E] mb-1">{member.name}</h3>
                  <p className="text-[#8DB359] font-black uppercase text-xs tracking-widest mb-6">{member.role}</p>
                  <button onClick={() => setCurrentMemberName(member.name)} className={`w-full py-4 rounded-[25px] font-black transition-all flex items-center justify-center gap-2 ${currentMemberName === member.name ? 'bg-[#8DB359] text-white' : 'bg-[#FDFBF3] text-[#8DB359] border-2 border-[#E8F1E7]'}`}>
                    {currentMemberName === member.name ? <Star size={18} fill="currentColor" /> : <Heart size={18} />} {currentMemberName === member.name ? '已切換為此身分' : '切換為此身分'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </main>

      <nav className="fixed bottom-8 left-4 right-4 h-24 bg-white/95 backdrop-blur-md rounded-[40px] border-4 border-[#E8F1E7] shadow-xl z-50 flex items-center justify-around px-4">
        {[
          { type: TabType.ITINERARY, label: '行程', icon: <Calendar size={24}/> },
          { type: TabType.LEDGER, label: '記帳', icon: <Wallet size={24}/> },
          { type: TabType.PREP, label: '準備', icon: <CheckSquare size={24}/> },
          { type: TabType.MEMBERS, label: '成員', icon: <Users size={24}/> }
        ].map(n => (
          <button key={n.label} onClick={() => setActiveTab(n.type as TabType)} className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${activeTab === n.type ? 'text-[#8DB359] -translate-y-2' : 'text-[#D7CCC8]'}`}>
            {n.icon} <span className="text-[10px] font-black">{n.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;


import React, { useState, useEffect } from 'react';
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
  Trash2
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
      case 'TRANSPORT': return <Bus className="text-blue-600" size={20} />;
      case 'FOOD': return <Utensils className="text-orange-500" size={20} />;
      case 'SIGHT': return <Camera className="text-emerald-500" size={20} />;
      case 'HOTEL': return <Hotel className="text-purple-500" size={20} />;
      default: return <MapPin className="text-blue-500" size={20} />;
    }
  };

  return (
    <div className="relative flex gap-4 mb-8 group">
      <div className="flex flex-col items-center">
        <div className="z-10 w-4 h-4 rounded-full bg-blue-500 border-4 border-white shadow-md mt-1 transition-transform group-hover:scale-125"></div>
        <div className="text-[11px] text-slate-500 font-bold mt-2 bg-slate-100 px-2 py-0.5 rounded-full">{item.time}</div>
      </div>
      
      <div className="flex-1 bg-white p-5 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-50 relative">
        <button 
          onClick={() => onEdit(item)}
          className="absolute top-4 right-4 p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-all"
        >
          <Edit2 size={14} />
        </button>
        
        <div className="inline-flex p-2.5 bg-slate-50 rounded-2xl mb-3">
          <Icon />
        </div>
        
        <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1 pr-8">{item.title}</h3>
        {item.subtitle && <p className="text-sm text-slate-500 font-medium mb-2">{item.subtitle}</p>}
        
        {item.location && (
          <div className="flex items-start gap-1.5 mt-3 text-slate-400 text-xs">
            <MapPin size={14} className="text-blue-400 shrink-0 mt-0.5" />
            <span className="leading-snug">{item.location}</span>
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
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [packingList, setPackingList] = useState<PackingItem[]>(INITIAL_PACKING_LIST);
  const [aiSuggestion, setAiSuggestion] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<ItineraryItem> | null>(null);
  
  const [isPackingModalOpen, setIsPackingModalOpen] = useState(false);
  const [editingPackingItem, setEditingPackingItem] = useState<Partial<PackingItem> | null>(null);

  // --- Firebase Real-time Sync ---
  useEffect(() => {
    if (!db) {
      setItineraryItems(DEFAULT_ITINERARY);
      setPackingList(INITIAL_PACKING_LIST);
      return;
    }
    setIsSyncing(true);

    const unsubItinerary = onSnapshot(query(collection(db, "itinerary"), orderBy("time")), (snapshot) => {
      const items: ItineraryItem[] = [];
      snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() } as ItineraryItem));
      
      if (items.length === 0) {
        setItineraryItems(DEFAULT_ITINERARY);
      } else {
        setItineraryItems(items);
      }
      setIsSyncing(false);
    });

    const unsubPacking = onSnapshot(collection(db, "packingList"), (snapshot) => {
      const items: PackingItem[] = [];
      snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() } as PackingItem));
      if (items.length > 0) {
        setPackingList(items);
      } else {
        // Initial seed if empty
        INITIAL_PACKING_LIST.forEach(async (item) => {
          await setDoc(doc(db, "packingList", item.id), item);
        });
      }
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

  // AI Inspiration
  useEffect(() => {
    const fetchAi = async () => {
      setLoadingAi(true);
      const res = await getTaipeiSuggestions(`Day ${activeDay} of Taipei trip in Dec/Jan 2024-2025. Currently focused on local food and shopping.`);
      setAiSuggestion(res);
      setLoadingAi(false);
    };
    if (activeTab === TabType.ITINERARY) {
      fetchAi();
    }
  }, [activeDay, activeTab]);

  const togglePackingItem = async (id: string) => {
    const item = packingList.find(i => i.id === id);
    if (!item) return;
    const newStatus = !item.completed;
    if (db) {
      await updateDoc(doc(db, "packingList", id), { completed: newStatus });
    } else {
      setPackingList(prev => prev.map(i => i.id === id ? { ...i, completed: newStatus } : i));
    }
  };

  const handleOpenAdd = () => {
    setEditingItem({ day: activeDay, time: '12:00', type: 'SIGHT', title: '', subtitle: '', location: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ItineraryItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const saveItinerary = async () => {
    if (!editingItem || !editingItem.title) return;
    
    if (db) {
      const dataToSave = { ...editingItem };
      if (dataToSave.id) {
        const id = dataToSave.id;
        delete dataToSave.id;
        await updateDoc(doc(db, "itinerary", id), dataToSave);
      } else {
        await addDoc(collection(db, "itinerary"), dataToSave);
      }
    } else {
      const newItem = { ...editingItem, id: editingItem.id || Math.random().toString() } as ItineraryItem;
      setItineraryItems(prev => editingItem.id ? prev.map(i => i.id === editingItem.id ? newItem : i) : [...prev, newItem]);
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

  // --- Packing Functions ---
  const handleOpenAddPacking = () => {
    setEditingPackingItem({ name: '', assignedTo: '大哥', completed: false });
    setIsPackingModalOpen(true);
  };

  const handleOpenEditPacking = (item: PackingItem) => {
    setEditingPackingItem(item);
    setIsPackingModalOpen(true);
  };

  const savePackingItem = async () => {
    if (!editingPackingItem || !editingPackingItem.name) return;
    
    if (db) {
      const dataToSave = { ...editingPackingItem };
      if (dataToSave.id) {
        const id = dataToSave.id;
        delete dataToSave.id;
        await updateDoc(doc(db, "packingList", id), dataToSave);
      } else {
        await addDoc(collection(db, "packingList"), dataToSave);
      }
    } else {
      const newItem = { ...editingPackingItem, id: editingPackingItem.id || Math.random().toString() } as PackingItem;
      setPackingList(prev => editingPackingItem.id ? prev.map(i => i.id === editingPackingItem.id ? newItem : i) : [...prev, newItem]);
    }
    setIsPackingModalOpen(false);
    setEditingPackingItem(null);
  };

  const deletePackingItem = async () => {
    if (editingPackingItem?.id && db) {
      await deleteDoc(doc(db, "packingList", editingPackingItem.id));
      setIsPackingModalOpen(false);
    }
  };

  const filteredItinerary = itineraryItems
    .filter(i => i.day === activeDay)
    .sort((a, b) => a.time.localeCompare(b.time));

  const renderContent = () => {
    switch (activeTab) {
      case TabType.ITINERARY:
        return (
          <div className="pb-32 px-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">當日行程</h2>
              <button 
                onClick={handleOpenAdd}
                className="flex items-center gap-1 bg-blue-600 text-white px-5 py-2.5 rounded-2xl text-sm font-bold shadow-lg shadow-blue-200 active:scale-95 transition-all"
              >
                <Plus size={18} /> 新增
              </button>
            </div>
            
            <div className="relative timeline-line">
              {filteredItinerary.length === 0 ? (
                <div className="py-20 text-center text-slate-400">
                  <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar size={24} className="opacity-20" />
                  </div>
                  <p className="font-medium">呢日仲未有行程喎</p>
                  <p className="text-xs opacity-60">撳「新增」加返啦！</p>
                </div>
              ) : (
                filteredItinerary.map(item => (
                  <TimelineCard key={item.id} item={item} onEdit={handleOpenEdit} />
                ))
              )}
            </div>

            <div className="mt-8 p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
              <div className="flex items-center gap-2 mb-3 relative z-10">
                <div className="bg-indigo-600 p-1.5 rounded-xl">
                  <Search size={14} className="text-white" />
                </div>
                <span className="text-sm font-bold text-indigo-900">小媛嘅 AI 靈感</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed italic relative z-10">
                {loadingAi ? "正在為大哥和小媛構思中..." : aiSuggestion}
              </p>
            </div>
          </div>
        );

      case TabType.PREP:
        return (
          <div className="px-6 pb-32">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">準備清單</h2>
              <button 
                onClick={handleOpenAddPacking}
                className="flex items-center gap-1 bg-blue-600 text-white px-5 py-2.5 rounded-2xl text-sm font-bold shadow-lg shadow-blue-200 active:scale-95 transition-all"
              >
                <Plus size={18} /> 新增項目
              </button>
            </div>
            
            <div className="space-y-3">
              {packingList.map(item => (
                <div 
                  key={item.id} 
                  className={`flex items-center justify-between p-5 rounded-3xl border transition-all ${
                    item.completed ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-100 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => togglePackingItem(item.id)}>
                    <div className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all ${
                      item.completed ? 'bg-green-500 border-green-500 scale-110' : 'bg-white border-slate-200'
                    }`}>
                      {item.completed && <CheckSquare className="text-white" size={14} />}
                    </div>
                    <div>
                      <span className={`font-bold block ${item.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                        {item.name}
                      </span>
                      {item.assignedTo && (
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${item.assignedTo === '大哥' ? 'text-blue-500' : 'text-pink-500'}`}>
                          {item.assignedTo} 負責
                        </span>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleOpenEditPacking(item)}
                    className="p-3 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-2xl transition-all"
                  >
                    <Edit2 size={16} />
                  </button>
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
            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-[40px] text-white shadow-xl shadow-indigo-100 mb-10">
              <p className="text-indigo-100 text-sm mb-1 opacity-80 font-medium">總支出 (TWD)</p>
              <h3 className="text-4xl font-extrabold">$ {total.toLocaleString()}</h3>
            </div>
            
            <div className="flex justify-between items-center mb-6">
              <span className="font-bold text-slate-700 text-lg">最近交易</span>
              <button 
                onClick={() => alert('此功能即將推出！')}
                className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100 text-indigo-600 text-sm font-bold flex items-center gap-1.5"
              >
                <Plus size={16} /> 新增紀錄
              </button>
            </div>

            {expenses.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-slate-200">
                <Wallet size={48} className="mx-auto mb-4 text-slate-200" />
                <p className="text-slate-400 font-medium">仲未有任何開支</p>
              </div>
            ) : (
              <div className="space-y-4">
                {expenses.map(exp => (
                  <div key={exp.id} className="bg-white p-5 rounded-[28px] border border-slate-50 shadow-sm flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800">{exp.description}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{exp.paidBy} • {exp.date}</p>
                    </div>
                    <p className="font-extrabold text-rose-500">-${exp.amount}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case TabType.MEMBERS:
        return (
          <div className="px-6 pb-32">
             <h2 className="text-2xl font-bold text-slate-800 mb-6">旅遊成員</h2>
             <div className="grid grid-cols-1 gap-4">
               {MEMBERS.map(member => (
                 <div key={member.name} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4">
                   <img src={member.avatar} alt={member.name} className="w-16 h-16 rounded-3xl object-cover ring-4 ring-slate-50" />
                   <div>
                     <h3 className="text-lg font-bold text-slate-800">{member.name}</h3>
                     <p className="text-sm text-blue-500 font-bold">{member.role}</p>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen relative flex flex-col bg-slate-50 overflow-x-hidden">
      {/* --- Modal for Itinerary --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[48px] p-8 shadow-2xl animate-in slide-in-from-bottom duration-500">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">{editingItem?.id ? '修改行程' : '新增行程'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-100 rounded-2xl text-slate-500 hover:bg-slate-200 transition-colors"><X size={20}/></button>
            </div>
            
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] uppercase font-black text-slate-400 ml-2 mb-2 block tracking-widest">時間</label>
                  <input 
                    type="time" 
                    value={editingItem?.time} 
                    onChange={e => setEditingItem({...editingItem!, time: e.target.value})}
                    className="w-full bg-slate-100 border-none rounded-2xl px-5 py-4 text-slate-800 font-bold focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase font-black text-slate-400 ml-2 mb-2 block tracking-widest">類別</label>
                  <select 
                    value={editingItem?.type}
                    onChange={e => setEditingItem({...editingItem!, type: e.target.value as any})}
                    className="w-full bg-slate-100 border-none rounded-2xl px-5 py-4 text-slate-800 font-bold focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="SIGHT">景點</option>
                    <option value="FOOD">美食</option>
                    <option value="TRANSPORT">交通</option>
                    <option value="FLIGHT">航班</option>
                    <option value="HOTEL">酒店</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase font-black text-slate-400 ml-2 mb-2 block tracking-widest">行程標題</label>
                <input 
                  type="text" 
                  placeholder="例如：大腕燒肉"
                  value={editingItem?.title} 
                  onChange={e => setEditingItem({...editingItem!, title: e.target.value})}
                  className="w-full bg-slate-100 border-none rounded-2xl px-5 py-4 text-slate-800 font-bold focus:ring-2 focus:ring-blue-500 placeholder:text-slate-300"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase font-black text-slate-400 ml-2 mb-2 block tracking-widest">地點 / 地址</label>
                <input 
                  type="text" 
                  placeholder="輸入地址或座標"
                  value={editingItem?.location || ''} 
                  onChange={e => setEditingItem({...editingItem!, location: e.target.value})}
                  className="w-full bg-slate-100 border-none rounded-2xl px-5 py-4 text-slate-800 font-bold focus:ring-2 focus:ring-blue-500 placeholder:text-slate-300"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase font-black text-slate-400 ml-2 mb-2 block tracking-widest">備註 / 訂金</label>
                <input 
                  type="text" 
                  placeholder="例如：已付訂金 $2000"
                  value={editingItem?.subtitle || ''} 
                  onChange={e => setEditingItem({...editingItem!, subtitle: e.target.value})}
                  className="w-full bg-slate-100 border-none rounded-2xl px-5 py-4 text-slate-800 font-bold focus:ring-2 focus:ring-blue-500 placeholder:text-slate-300"
                />
              </div>
              
              <div className="flex gap-4 pt-6">
                {editingItem?.id && (
                  <button onClick={deleteItinerary} className="flex-1 bg-rose-50 text-rose-500 py-5 rounded-[24px] font-black tracking-wide active:scale-95 transition-all">刪除</button>
                )}
                <button onClick={saveItinerary} className="flex-[2] bg-blue-600 text-white py-5 rounded-[24px] font-black tracking-wide shadow-xl shadow-blue-100 flex items-center justify-center gap-2 active:scale-95 transition-all">
                  <Save size={20}/> 儲存行程
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Modal for Packing --- */}
      {isPackingModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[48px] p-8 shadow-2xl animate-in slide-in-from-bottom duration-500">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">{editingPackingItem?.id ? '修改物資' : '新增物資'}</h3>
              <button onClick={() => setIsPackingModalOpen(false)} className="p-3 bg-slate-100 rounded-2xl text-slate-500 hover:bg-slate-200 transition-colors"><X size={20}/></button>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="text-[11px] uppercase font-black text-slate-400 ml-2 mb-2 block tracking-widest">物品名稱</label>
                <input 
                  type="text" 
                  placeholder="例如：悠遊卡"
                  value={editingPackingItem?.name} 
                  onChange={e => setEditingPackingItem({...editingPackingItem!, name: e.target.value})}
                  className="w-full bg-slate-100 border-none rounded-2xl px-5 py-4 text-slate-800 font-bold focus:ring-2 focus:ring-blue-500 placeholder:text-slate-300"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase font-black text-slate-400 ml-2 mb-2 block tracking-widest">負責人</label>
                <div className="grid grid-cols-2 gap-3">
                  {MEMBERS.map(m => (
                    <button 
                      key={m.name}
                      onClick={() => setEditingPackingItem({...editingPackingItem!, assignedTo: m.name})}
                      className={`py-4 rounded-2xl font-bold transition-all ${
                        editingPackingItem?.assignedTo === m.name 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                        : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-4 pt-6">
                {editingPackingItem?.id && (
                  <button onClick={deletePackingItem} className="flex-1 bg-rose-50 text-rose-500 py-5 rounded-[24px] font-black tracking-wide active:scale-95 transition-all">刪除</button>
                )}
                <button onClick={savePackingItem} className="flex-[2] bg-blue-600 text-white py-5 rounded-[24px] font-black tracking-wide shadow-xl shadow-blue-100 flex items-center justify-center gap-2 active:scale-95 transition-all">
                  <Save size={20}/> 儲存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Header --- */}
      <header className="pt-12 pb-8 px-6 bg-white rounded-b-[50px] shadow-sm mb-8 sticky top-0 z-30 ring-1 ring-slate-100">
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Taipei 2025</h1>
              <div className={`w-2.5 h-2.5 rounded-full ${db ? 'bg-green-500 sync-active' : 'bg-rose-400 opacity-50'}`}></div>
            </div>
            <p className="text-slate-400 text-sm font-bold flex items-center gap-1.5 uppercase tracking-widest">
              <Users size={14} /> 大哥 & 小媛
            </p>
          </div>
          <div className="flex flex-col items-end">
            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
              {isSyncing ? <RefreshCw size={24} className="animate-spin" /> : <CloudSun size={24} />}
            </div>
          </div>
        </div>

        {/* Day Selector */}
        <div className="flex gap-4 overflow-x-auto custom-scrollbar py-4 -mx-6 px-6">
          {TRAVEL_DATES.map(date => (
            <div 
              key={date.day} 
              onClick={() => setActiveDay(date.day)}
              className={`flex-shrink-0 flex flex-col items-center justify-center w-[72px] h-[92px] rounded-[28px] transition-all duration-300 cursor-pointer ${
                activeDay === date.day 
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 -translate-y-1 scale-105' 
                : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100'
              }`}
            >
              <span className={`text-[10px] uppercase font-black mb-1 ${activeDay === date.day ? 'text-blue-200' : 'text-slate-300'}`}>D{date.day}</span>
              <span className="text-2xl font-black leading-none mb-1">{date.label.split('/')[1]}</span>
              <span className="text-[10px] font-black opacity-80">{date.weekday}</span>
            </div>
          ))}
          <div className="flex-shrink-0 w-2 h-1"></div>
        </div>
      </header>

      {/* --- Content --- */}
      <main className="flex-1 overflow-y-auto">
        {renderContent()}
      </main>

      {/* --- Navigation --- */}
      <nav className="fixed bottom-8 left-8 right-8 h-20 bg-white/90 backdrop-blur-2xl rounded-[35px] border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-40 flex items-center justify-around px-6">
        {[
          { type: TabType.ITINERARY, label: '行程' },
          { type: TabType.LEDGER, label: '記帳' },
          { type: TabType.PREP, label: '清單' },
          { type: TabType.MEMBERS, label: '成員' }
        ].map((tab) => (
          <button 
            key={tab.type} 
            onClick={() => setActiveTab(tab.type)}
            className="flex flex-col items-center gap-1 transition-all active:scale-75"
          >
            <TabIcon type={tab.type} active={activeTab === tab.type} />
            <span className={`text-[10px] font-black tracking-tighter transition-colors uppercase ${
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


import { ItineraryItem, Member, PackingItem } from './types';

export const MEMBERS: Member[] = [
  { 
    name: '大哥', 
    role: '團長 / 財務擔當', 
    avatar: 'https://nagano-market.jp/cdn/shop/files/4571609381006_1.jpg?v=1765864713&width=1200' 
  },
  { 
    name: '小媛', 
    role: '攝影師 / 食評家', 
    avatar: 'https://megapx-assets.dcard.tw/images/41a4a28e-4ca8-4b34-be40-5ea56213916c/640.jpeg' 
  }
];

export const INITIAL_PACKING_LIST: PackingItem[] = [
  // 待辦
  { id: 'todo-1', name: '入台證', completedBy: [], category: 'TODO' },
  { id: 'todo-2', name: '換外幣', completedBy: [], category: 'TODO' },
  { id: 'todo-3', name: '尿袋插滿電', completedBy: [], category: 'TODO' },
  
  // 想去
  { id: 'want-1', name: '大稻埕', completedBy: [], category: 'WANT' },
  { id: 'want-2', name: '中山站行街', completedBy: [], category: 'WANT' },
  
  // 採購
  { id: 'buy-1', name: 'Nagano車車熊', completedBy: [], category: 'BUY' },
  { id: 'buy-2', name: '鴨舌', completedBy: [], category: 'BUY' },
  { id: 'buy-3', name: 'kavalan酒', completedBy: [], category: 'BUY' },

  // 行李
  ...[
    '護照', '轉插', '差電線', '落妝膏', '落妝水', '化妝棉', '底褲', '襪', '睡衣', 'Con', 
    'Con盒', 'Con水', '藥', '紙巾', '護膚品', '尿袋', '電髮夾', '牙箍片', 
    '牙箍盒', '牙膏', '牙刷', 'Iphone針', '眼鏡', '鬚刨', '橡筋', '毛巾', '洗面', '牙塞', 'Sim卡'
  ].map((item, index) => ({
    id: `luggage-${index}`,
    name: item,
    completedBy: [],
    category: 'LUGGAGE' as const
  }))
];

export const TRAVEL_DATES = [
  { day: 1, label: '12/30', weekday: '二' },
  { day: 2, label: '12/31', weekday: '三' },
  { day: 3, label: '01/01', weekday: '四' },
  { day: 4, label: '01/02', weekday: '五' },
  { day: 5, label: '01/03', weekday: '六' }
];

export const DEFAULT_ITINERARY: ItineraryItem[] = [
  { id: 'day1-1', time: '07:50', type: 'FLIGHT', title: '起飛 🛫 中華航空 CI922', day: 1 },
  { id: 'day1-2', time: '12:00', type: 'FOOD', title: '大稻埕魯肉飯', location: '台北市大同區長安西路220巷17號', day: 1 },
  { id: 'day1-3', time: '15:00', type: 'HOTEL', title: 'Hotel Check in 🔑', day: 1 }
];

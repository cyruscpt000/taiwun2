
import { ItineraryItem, Member, PackingItem } from './types';

export const MEMBERS: Member[] = [
  { name: '大哥', role: '團長 / 財務擔當', avatar: 'https://picsum.photos/seed/dage/100/100' },
  { name: '小媛', role: '攝影師 / 食評家', avatar: 'https://picsum.photos/seed/xiaoyuan/100/100' }
];

export const INITIAL_PACKING_LIST: PackingItem[] = [
  { id: 'p1', name: '悠遊卡', completed: false, assignedTo: '大哥' },
  { id: 'p2', name: '錢', completed: false, assignedTo: '大哥' },
  { id: 'p3', name: '轉插', completed: false, assignedTo: '大哥' },
  { id: 'p4', name: '差電線', completed: false, assignedTo: '小媛' },
  { id: 'p5', name: '落妝膏', completed: false, assignedTo: '小媛' },
  { id: 'p6', name: '化妝棉', completed: false, assignedTo: '小媛' },
  { id: 'p7', name: '洗面', completed: false, assignedTo: '小媛' },
  { id: 'p8', name: '化妝品', completed: false, assignedTo: '小媛' },
  { id: 'p9', name: '底褲', completed: false, assignedTo: '大哥' },
  { id: 'p10', name: '襪', completed: false, assignedTo: '大哥' },
  { id: 'p11', name: 'Con盒', completed: false, assignedTo: '小媛' },
  { id: 'p12', name: 'Con水', completed: false, assignedTo: '小媛' },
  { id: 'p13', name: '紙巾', completed: false, assignedTo: '大哥' },
  { id: 'p14', name: '藥', completed: false, assignedTo: '大哥' },
  { id: 'p15', name: '護膚品', completed: false, assignedTo: '小媛' },
  { id: 'p16', name: '睡衣', completed: false, assignedTo: '大哥' },
  { id: 'p17', name: 'passport', completed: false, assignedTo: '大哥' },
  { id: 'p18', name: '尿袋', completed: false, assignedTo: '大哥' },
  { id: 'p19', name: '台幣', completed: false, assignedTo: '大哥' },
  { id: 'p20', name: '電髮夾', completed: false, assignedTo: '小媛' },
  { id: 'p21', name: '牙cool片', completed: false, assignedTo: '小媛' },
  { id: 'p22', name: '牙cool盒', completed: false, assignedTo: '小媛' },
  { id: 'p23', name: '牙膏牙刷', completed: false, assignedTo: '大哥' },
  { id: 'p24', name: 'iphone針', completed: false, assignedTo: '大哥' },
  { id: 'p25', name: '眼鏡', completed: false, assignedTo: '大哥' },
  { id: 'p26', name: 'con', completed: false, assignedTo: '小媛' },
  { id: 'p27', name: '橡筋', completed: false, assignedTo: '小媛' }
];

export const TRAVEL_DATES = [
  { day: 1, label: '12/30', weekday: '二' },
  { day: 2, label: '12/31', weekday: '三' },
  { day: 3, label: '01/01', weekday: '四' },
  { day: 4, label: '01/02', weekday: '五' },
  { day: 5, label: '01/03', weekday: '六' }
];

export const DEFAULT_ITINERARY: ItineraryItem[] = [
  // Day 1 (12/30)
  { id: 'day1-1', time: '07:50', type: 'FLIGHT', title: '起飛 🛫 中華航空 CI922', subtitle: '09:30 到台北', day: 1 },
  { id: 'day1-2', time: '12:00', type: 'FOOD', title: '到台北車站：大稻埕魯肉飯', location: '台北市大同區長安西路220巷17號', day: 1 },
  { id: 'day1-3', time: '15:00', type: 'HOTEL', title: 'Hotel Check in 🔑', day: 1 },
  { id: 'day1-4', time: '16:00', type: 'SIGHT', title: 'MEIER.Q 南西店', location: '104臺北市中山區中山北路二段16巷12號4F', day: 1 },
  { id: 'day1-5', time: '18:30', type: 'FOOD', title: '大腕燒肉 (已卜 6:30)', subtitle: '已付台幣$2000訂金', location: '台北市敬業二路199號5樓', day: 1 },
  { id: 'day1-6', time: '21:00', type: 'FOOD', title: 'To Infinity & Beyond (已卜 9 點)', location: '大安區敦化南路一段160巷13號', day: 1 },

  // Day 2 (12/31)
  { id: 'day2-1', time: '08:30', type: 'FOOD', title: '阜杭豆漿', location: '台北市中正區忠孝東路一段108號2樓', day: 2 },
  { id: 'day2-2', time: '10:30', type: 'SIGHT', title: '買手信：犁記?', location: '台北市中山區長安東路二段67號', day: 2 },
  { id: 'day2-3', time: '12:30', type: 'FOOD', title: '黑武士特色老火鍋 (booked 12:30)', location: '台北市信義新天地A9店-6F', day: 2 },
  { id: 'day2-4', time: '15:30', type: 'SIGHT', title: '華山1914文化創意產業園區', location: '台北市中正區八德路一段1號', day: 2 },
  { id: 'day2-5', time: '18:15', type: 'FOOD', title: '濟安鮨 日本料理 (生日Omakase)', subtitle: 'Booked 18:15', location: '台北市大安區敦化南路一段161巷72號', day: 2 },
  { id: 'day2-6', time: '21:30', type: 'FOOD', title: '跨年夜 🎆 饒河夜市 / WA-SHU 和酒?', day: 2 },

  // Day 3 (01/01)
  { id: 'day3-1', time: '09:00', type: 'TRANSPORT', title: '葛瑪蘭客運 🚌 (台北轉運站上)', day: 3 },
  { id: 'day3-2', time: '10:30', type: 'TRANSPORT', title: '宜蘭勁好行 752', subtitle: '「員山農會成功分部」下車，步行5分鐘', day: 3 },
  { id: 'day3-3', time: '11:30', type: 'SIGHT', title: '金車噶瑪蘭威士忌酒廠', location: '宜蘭縣員山鄉員山路二段326號', day: 3 },
  { id: 'day3-4', time: '16:00', type: 'TRANSPORT', title: '回宜蘭轉運站', subtitle: '搭葛瑪蘭客運去「科技大樓站」', day: 3 },
  { id: 'day3-5', time: '18:30', type: 'FOOD', title: '大媛燒肉', day: 3 },
  { id: 'day3-6', time: '20:30', type: 'FOOD', title: '寧夏夜市', day: 3 },

  // Day 4 (01/02)
  { id: 'day4-1', time: '10:00', type: 'TRANSPORT', title: '出發去九份 🚌 (965 號巴士)', subtitle: '車程約 1 小時', day: 4 },
  { id: 'day4-2', time: '11:30', type: 'SIGHT', title: '九份食到 13:00', day: 4 },
  { id: 'day4-3', time: '13:30', type: 'SIGHT', title: '到猴硐貓村 🐈', day: 4 },
  { id: 'day4-4', time: '15:00', type: 'SIGHT', title: '到十分：放天燈 + 瀑布', day: 4 },
  { id: 'day4-5', time: '20:00', type: 'FOOD', title: '無老鍋火鍋 (Booked)', location: '台北市中山區中山北路二段36-1號', day: 4 },

  // Day 5 (01/03)
  { id: 'day5-1', time: '10:00', type: 'HOTEL', title: 'Check out 🔑', day: 5 },
  { id: 'day5-2', time: '11:00', type: 'SIGHT', title: '西門町行行 買老天祿 (10點開)', location: '台北市萬華區成都路56號', day: 5 },
  { id: 'day5-3', time: '14:00', type: 'FOOD', title: '青花驕火鍋 (Booked 11:00)', subtitle: '台北中山店', location: '台北市中山區中山北路二段42-1號', day: 5 },
  { id: 'day5-4', time: '15:30', type: 'SIGHT', title: '最後買手信 / 去機場', day: 5 },
  { id: 'day5-5', time: '16:55', type: 'FLIGHT', title: '返香港 🛫 中華航空 CI919', day: 5 },
  { id: 'day5-6', time: '19:00', type: 'TRANSPORT', title: '到香港 🏡', day: 5 }
];

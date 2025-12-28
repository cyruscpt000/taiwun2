
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
  { id: 'p19', name: '韓幣', completed: false, assignedTo: '大哥' },
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
  {
    id: 'day1-1',
    time: '07:50',
    type: 'FLIGHT',
    title: '起飛 🛫 中華航空 CI922',
    subtitle: '記得帶齊證件',
    day: 1
  },
  {
    id: 'day1-2',
    time: '09:30',
    type: 'TRANSPORT',
    title: '到達台北 🇹🇼',
    subtitle: '辦理入境及提取行李',
    day: 1
  },
  {
    id: 'day1-3',
    time: '12:00',
    type: 'FOOD',
    title: '台北車站：大稻埕魯肉飯',
    subtitle: '午餐時間',
    location: '台北車站附近',
    day: 1
  },
  {
    id: 'day1-4',
    time: '15:00',
    type: 'HOTEL',
    title: 'Check-in 酒店 🔑',
    subtitle: '放低行李休息吓',
    day: 1
  },
  {
    id: 'day1-5',
    time: '16:00',
    type: 'SIGHT',
    title: 'An 輕珠寶',
    subtitle: '行街睇飾物',
    location: '大安區大安路一段31巷5號1',
    day: 1
  },
  {
    id: 'day1-6',
    time: '18:30',
    type: 'FOOD',
    title: '大腕燒肉 (已預約)',
    subtitle: '已付台幣$2000訂金',
    location: '台北市敬業二路199號5樓',
    day: 1
  },
  {
    id: 'day1-7',
    time: '21:00',
    type: 'FOOD',
    title: 'To Infinity & Beyond (已預約)',
    subtitle: 'Chill 吓飲杯嘢',
    location: '大安區敦化南路一段160巷13號',
    day: 1
  },
  // Day 2 (12/31)
  {
    id: 'day2-1',
    time: '08:30',
    type: 'FOOD',
    title: '阜杭豆漿',
    subtitle: '超人氣早餐（需早排隊）',
    location: '台北市中正區忠孝東路一段108號2樓',
    day: 2
  },
  {
    id: 'day2-2',
    time: '10:30',
    type: 'SIGHT',
    title: '買手信：犁記',
    subtitle: '鳳梨酥名店',
    location: '台北市中山區長安東路二段67號',
    day: 2
  },
  {
    id: 'day2-3',
    time: '12:30',
    type: 'FOOD',
    title: '黑武士特色老火鍋 (已預約)',
    subtitle: '信義新天地 A9 門市',
    location: '台北市信義新天地A9店-6F',
    day: 2
  },
  {
    id: 'day2-4',
    time: '15:30',
    type: 'SIGHT',
    title: 'MEIER.Q 南西店',
    subtitle: '服飾購物時間',
    location: '104台灣台北市中山區中山北路二段16巷',
    day: 2
  },
  {
    id: 'day2-5',
    time: '18:15',
    type: 'FOOD',
    title: '濟安鮨 日本料理 (生日大餐)',
    subtitle: 'Omakase (已預約)',
    location: '台北市大安區敦化南路一段161巷72號',
    day: 2
  },
  {
    id: 'day2-6',
    time: '21:30',
    type: 'FOOD',
    title: '饒河夜市 / WA-SHU 和酒',
    subtitle: '跨年夜 Chill Time',
    location: '饒河街 / 大安路一段101巷39號',
    day: 2
  },
  // Day 3 (01/01)
  {
    id: 'day3-1',
    time: '09:00',
    type: 'TRANSPORT',
    title: '葛瑪蘭客運 🚌',
    subtitle: '前往宜蘭',
    location: '台北轉運站上車',
    day: 3
  },
  {
    id: 'day3-2',
    time: '10:30',
    type: 'TRANSPORT',
    title: '宜蘭勁好行 752',
    subtitle: '「員山農會成功分部」落車，步行5分鐘',
    location: '宜蘭轉運站 → 員山農會',
    day: 3
  },
  {
    id: 'day3-3',
    time: '11:30',
    type: 'SIGHT',
    title: '金車噶瑪蘭威士忌酒廠',
    subtitle: '參觀酒廠 & 品酒',
    location: '宜蘭縣員山鄉員山路二段326號',
    day: 3
  },
  {
    id: 'day3-4',
    time: '16:00',
    type: 'TRANSPORT',
    title: '回程台北',
    subtitle: '搭客運去「科技大樓站」落車，轉地鐵',
    location: '金車酒廠站 → 科技大樓站',
    day: 3
  },
  {
    id: 'day3-5',
    time: '18:30',
    type: 'FOOD',
    title: '大媛燒肉',
    subtitle: '晚餐時間',
    day: 3
  },
  {
    id: 'day3-6',
    time: '20:30',
    type: 'FOOD',
    title: '寧夏夜市',
    subtitle: '宵夜掃街',
    location: '台北市大同區寧夏路',
    day: 3
  },
  // Day 4 (01/02)
  {
    id: 'day4-1',
    time: '10:00',
    type: 'TRANSPORT',
    title: '出發去九份 🚌',
    subtitle: '搭 965 號巴士 (約1小時)',
    location: '捷運西門站或北門站上車',
    day: 4
  },
  {
    id: 'day4-2',
    time: '11:00',
    type: 'SIGHT',
    title: '九份老街',
    subtitle: '一路行一路食',
    day: 4
  },
  {
    id: 'day4-3',
    time: '13:30',
    type: 'SIGHT',
    title: '猴硐貓村 🐈',
    subtitle: '睇吓貓貓',
    day: 4
  },
  {
    id: 'day4-4',
    time: '15:00',
    type: 'SIGHT',
    title: '十分：放天燈 + 瀑布',
    subtitle: '許願時間',
    day: 4
  },
  {
    id: 'day4-5',
    time: '20:00',
    type: 'FOOD',
    title: '無老鍋火鍋 (已預約)',
    subtitle: '台北中山店',
    location: '台北市中山區中山北路二段36-1號',
    day: 4
  },
  // Day 5 (01/03)
  {
    id: 'day5-1',
    time: '10:00',
    type: 'HOTEL',
    title: 'Check out 🔑',
    subtitle: '西門町行行，買老天祿 (10點開)',
    location: '西門町',
    day: 5
  },
  {
    id: 'day5-2',
    time: '11:00',
    type: 'FOOD',
    title: '青花驕火鍋 (已預約)',
    subtitle: '最後衝刺大餐',
    location: '台北中山店',
    day: 5
  },
  {
    id: 'day5-3',
    time: '14:00',
    type: 'TRANSPORT',
    title: '出發去機場 ✈️',
    subtitle: '最後手信補完',
    day: 5
  },
  {
    id: 'day5-4',
    time: '16:55',
    type: 'FLIGHT',
    title: '返香港 🛫 中華航空 CI919',
    subtitle: '旅程圓滿結束',
    day: 5
  },
  {
    id: 'day5-5',
    time: '19:00',
    type: 'TRANSPORT',
    title: '抵達香港 🏡',
    day: 5
  }
];

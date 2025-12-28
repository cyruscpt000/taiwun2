
import { ItineraryItem, Member, PackingItem } from './types';

export const MEMBERS: Member[] = [
  { name: '大哥', role: '團長 / 財務擔當', avatar: 'https://picsum.photos/seed/dage/100/100' },
  { name: '小媛', role: '攝影師 / 食評家', avatar: 'https://picsum.photos/seed/xiaoyuan/100/100' }
];

export const INITIAL_PACKING_LIST: PackingItem[] = [
  { id: '1', name: '悠遊卡 (EasyCard)', completed: false, assignedTo: '大哥' },
  { id: '2', name: '入台證 (打印版)', completed: false, assignedTo: '小媛' },
  { id: '3', name: '轉換插頭', completed: false, assignedTo: '大哥' },
  { id: '4', name: '相機 & 電池', completed: false, assignedTo: '小媛' },
  { id: '5', name: '常備藥品', completed: false, assignedTo: '大哥' }
];

// 計算日期標籤
export const TRAVEL_DATES = [
  { day: 1, label: '12/30', weekday: '一' },
  { day: 2, label: '12/31', weekday: '二' },
  { day: 3, label: '01/01', weekday: '三' },
  { day: 4, label: '01/02', weekday: '四' },
  { day: 5, label: '01/03', weekday: '五' }
];

export const DEFAULT_ITINERARY: ItineraryItem[] = [
  {
    id: 'init-1',
    time: '11:00',
    type: 'FLIGHT',
    title: '到達桃園機場',
    subtitle: '國泰航空',
    day: 1
  }
];

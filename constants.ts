
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

export const MOCK_ITINERARY: Record<number, ItineraryItem[]> = {
  1: [
    {
      id: 'f1',
      time: '09:20',
      type: 'FLIGHT',
      title: 'HKG T1 ✈ TPE T1',
      subtitle: '國泰航空 CX494',
      details: ['座位: 42A, 42B', '行李: 23kg x 2'],
    },
    {
      id: 't1',
      time: '12:30',
      type: 'TRANSPORT',
      title: '國光客運 1819',
      subtitle: '桃園機場 -> 台北車站',
      details: ['車程約 55 分鐘'],
    },
    {
      id: 's1',
      time: '15:30',
      type: 'SIGHT',
      title: '西門町 漫步',
      subtitle: 'Check-in 後自由活動',
      location: '萬華區'
    },
    {
      id: 'food1',
      time: '18:30',
      type: 'FOOD',
      title: '阿宗麵線',
      subtitle: '必食老店',
    }
  ],
  2: [
    {
      id: 's2',
      time: '10:00',
      type: 'SIGHT',
      title: '台北 101',
      subtitle: '觀景台拍美照',
      location: '信義區'
    },
    {
      id: 'food2',
      time: '13:00',
      type: 'FOOD',
      title: '鼎泰豐 (信義店)',
      subtitle: '記得提早攞籌',
    }
  ]
};

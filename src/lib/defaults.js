export const DEFAULT_SESSIONS = [
  {
    id: 's1',
    name: 'Block 1',
    desc: 'DSA / System Design',
    timeStart: '06:30',
    timeEnd: '09:00',
    hours: 2.5,
    color: '#a78bfa',
    type: 'Deep Work',
  },
  {
    id: 's2',
    name: 'Block 2',
    desc: 'LeetCode / Projects',
    timeStart: '09:30',
    timeEnd: '13:00',
    hours: 3.5,
    color: '#818cf8',
    type: 'Deep Work',
  },
  {
    id: 's3',
    name: 'Block 3',
    desc: 'Job Applications',
    timeStart: '14:00',
    timeEnd: '17:00',
    hours: 3,
    color: '#60a5fa',
    type: 'Job Hunt',
  },
  {
    id: 's4',
    name: 'Block 4',
    desc: 'Review + GitHub',
    timeStart: '18:00',
    timeEnd: '20:00',
    hours: 2,
    color: '#34d399',
    type: 'Review',
  },
  {
    id: 's5',
    name: 'Block 5',
    desc: 'Light Study / Plan',
    timeStart: '21:00',
    timeEnd: '22:00',
    hours: 1,
    color: '#fbbf24',
    type: 'Wind Down',
  },
]

export const ACCENT_COLORS = [
  '#a78bfa', '#818cf8', '#60a5fa', '#34d399',
  '#fbbf24', '#f87171', '#fb923c', '#e879f9',
  '#22d3ee', '#4ade80',
]

export const SESSION_TYPES = [
  'Deep Work', 'Job Hunt', 'Review', 'Wind Down',
  'Practice', 'Reading', 'Project', 'Other',
]

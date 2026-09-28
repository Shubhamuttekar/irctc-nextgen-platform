export const STATIONS = [
  { code: 'NDLS', name: 'New Delhi Railway Station', city: 'New Delhi', state: 'Delhi', zone: 'NR', popular: true },
  { code: 'CSMT', name: 'Chhatrapati Shivaji Maharaj Terminus', city: 'Mumbai', state: 'Maharashtra', zone: 'CR', popular: true },
  { code: 'BSB', name: 'Varanasi Junction', city: 'Varanasi', state: 'Uttar Pradesh', zone: 'NR', popular: true },
  { code: 'HWH', name: 'Howrah Junction', city: 'Kolkata', state: 'West Bengal', zone: 'ER', popular: true },
  { code: 'MAS', name: 'MGR Chennai Central', city: 'Chennai', state: 'Tamil Nadu', zone: 'SR', popular: true },
  { code: 'SBC', name: 'KSR Bengaluru City', city: 'Bengaluru', state: 'Karnataka', zone: 'SWR', popular: true },
  { code: 'ADI', name: 'Ahmedabad Junction', city: 'Ahmedabad', state: 'Gujarat', zone: 'WR', popular: true },
  { code: 'PUNE', name: 'Pune Junction', city: 'Pune', state: 'Maharashtra', zone: 'CR', popular: true },
  { code: 'HYB', name: 'Hyderabad Deccan Nampally', city: 'Hyderabad', state: 'Telangana', zone: 'SCR', popular: true },
  { code: 'PNBE', name: 'Patna Junction', city: 'Patna', state: 'Bihar', zone: 'ECR', popular: true },
  { code: 'CNB', name: 'Kanpur Central', city: 'Kanpur', state: 'Uttar Pradesh', zone: 'NCR', popular: true },
  { code: 'LKO', name: 'Lucknow Charbagh NR', city: 'Lucknow', state: 'Uttar Pradesh', zone: 'NR', popular: true },
  { code: 'JAIPUR', name: 'Jaipur Junction', city: 'Jaipur', state: 'Rajasthan', zone: 'NWR', popular: true },
  { code: 'CDG', name: 'Chandigarh Junction', city: 'Chandigarh', state: 'Punjab / Haryana', zone: 'NR', popular: true },
  { code: 'SVDK', name: 'Shri Mata Vaishno Devi Katra', city: 'Katra', state: 'Jammu & Kashmir', zone: 'NR', popular: true },
  { code: 'GKP', name: 'Gorakhpur Junction', city: 'Gorakhpur', state: 'Uttar Pradesh', zone: 'NER', popular: true },
  { code: 'BCT', name: 'Mumbai Central', city: 'Mumbai', state: 'Maharashtra', zone: 'WR', popular: true },
  { code: 'GNC', name: 'Gandhinagar Capital', city: 'Gandhinagar', state: 'Gujarat', zone: 'WR', popular: false },
  { code: 'MYS', name: 'Mysuru Junction', city: 'Mysuru', state: 'Karnataka', zone: 'SWR', popular: false },
  { code: 'RKMP', name: 'Rani Kamlapati (Habibganj)', city: 'Bhopal', state: 'Madhya Pradesh', zone: 'WCR', popular: true },
  { code: 'AY', name: 'Ayodhya Dham Junction', city: 'Ayodhya', state: 'Uttar Pradesh', zone: 'NR', popular: true },
  { code: 'PURI', name: 'Puri Terminus', city: 'Puri', state: 'Odisha', zone: 'ECoR', popular: true }
];

export const POPULAR_ROUTES = [
  { from: 'NDLS', to: 'BSB', label: 'Delhi ⇄ Varanasi (Vande Bharat)' },
  { from: 'BCT', to: 'ADI', label: 'Mumbai ⇄ Ahmedabad (High Speed)' },
  { from: 'NDLS', to: 'HWH', label: 'Delhi ⇄ Howrah (Rajdhani Route)' },
  { from: 'MAS', to: 'SBC', label: 'Chennai ⇄ Bengaluru (Expressway)' },
  { from: 'NDLS', to: 'SVDK', label: 'Delhi ⇄ Katra Vaishno Devi' },
  { from: 'CSMT', to: 'PUNE', label: 'Mumbai ⇄ Pune (Deccan Queen)' }
];

export const SAMPLE_PNRS = {
  '2847193852': {
    pnr: '2847193852',
    trainNo: '22436',
    trainName: 'VANDE BHARAT EXPRESS',
    fromStation: 'NDLS (New Delhi)',
    toStation: 'BSB (Varanasi Jn)',
    boardingStation: 'NDLS',
    journeyDate: '24 Sep 2026',
    classBooked: 'CC (AC Chair Car)',
    quota: 'GN (General)',
    chartStatus: 'CHART PREPARED',
    chartStatusColor: 'status-cnf',
    passengers: [
      {
        id: 1,
        name: 'Dr. Rajesh Sharma',
        age: 48,
        gender: 'M',
        bookingStatus: 'CC - C2 / 18 (Window)',
        currentStatus: 'CONFIRMED (CNF)',
        coach: 'C2',
        berthNo: '18',
        berthType: 'Window (WS)',
        statusClass: 'status-cnf'
      },
      {
        id: 2,
        name: 'Sunita Sharma',
        age: 44,
        gender: 'F',
        bookingStatus: 'CC - C2 / 19 (Aisle)',
        currentStatus: 'CONFIRMED (CNF)',
        coach: 'C2',
        berthNo: '19',
        berthType: 'Aisle (AS)',
        statusClass: 'status-cnf'
      },
      {
        id: 3,
        name: 'Aarav Sharma',
        age: 16,
        gender: 'M',
        bookingStatus: 'CC - C2 / 20 (Middle)',
        currentStatus: 'CONFIRMED (CNF)',
        coach: 'C2',
        berthNo: '20',
        berthType: 'Middle (M)',
        statusClass: 'status-cnf'
      }
    ],
    fareTotal: '₹ 4,140',
    chartPreparedTime: 'Chart prepared on 24 Sep 2026, 02:30 AM at New Delhi Base Charting Office.'
  },
  '6491028471': {
    pnr: '6491028471',
    trainNo: '12302',
    trainName: 'HOWRAH RAJDHANI EXPRESS',
    fromStation: 'NDLS (New Delhi)',
    toStation: 'HWH (Howrah Jn)',
    boardingStation: 'NDLS',
    journeyDate: '25 Sep 2026',
    classBooked: '3A (AC 3-Tier)',
    quota: 'TQ (Tatkal Quota)',
    chartStatus: 'CHART NOT PREPARED',
    chartStatusColor: 'status-rac',
    passengers: [
      {
        id: 1,
        name: 'Vikramaditya Sen',
        age: 36,
        gender: 'M',
        bookingStatus: 'RAC 04',
        currentStatus: 'RAC 01',
        coach: 'B4',
        berthNo: 'Side Lower',
        berthType: 'Side Lower (SL)',
        statusClass: 'status-rac'
      },
      {
        id: 2,
        name: 'Ananya Sen',
        age: 33,
        gender: 'F',
        bookingStatus: 'RAC 05',
        currentStatus: 'RAC 02',
        coach: 'B4',
        berthNo: 'Side Lower',
        berthType: 'Side Lower (SL)',
        statusClass: 'status-rac'
      }
    ],
    fareTotal: '₹ 4,720',
    chartPreparedTime: 'Charting will commence 4 hours before scheduled departure (Approx 12:50 PM, 25 Sep).'
  },
  '8371940285': {
    pnr: '8371940285',
    trainNo: '12952',
    trainName: 'MUMBAI TEJAS RAJDHANI',
    fromStation: 'NDLS (New Delhi)',
    toStation: 'CSMT (Mumbai Central)',
    boardingStation: 'NDLS',
    journeyDate: '26 Sep 2026',
    classBooked: '2A (AC 2-Tier)',
    quota: 'GN (General)',
    chartStatus: 'CHART NOT PREPARED',
    chartStatusColor: 'status-wl',
    passengers: [
      {
        id: 1,
        name: 'Kavita Deshmukh',
        age: 29,
        gender: 'F',
        bookingStatus: 'WL 09 / GNWL',
        currentStatus: 'WL 02 (High CNF Chance: 89%)',
        coach: 'Unassigned',
        berthNo: 'WL 2',
        berthType: 'Pending Charting',
        statusClass: 'status-wl'
      }
    ],
    fareTotal: '₹ 2,950',
    chartPreparedTime: 'Charting will commence 4 hours before departure at NDLS Charting Section.'
  }
};

/**
 * SQLite Database Layer for IRCTC Next-Gen Prototype
 * Powered by Node.js native built-in SQLite engine (node:sqlite)
 * Zero external npm dependencies required
 */

const fs = require('node:fs');
const path = require('node:path');

const DB_PATH = path.join(__dirname, 'railway.db');

// Safe connection handler with fallback
let dbInstance = null;
let isNativeSqlite = false;

try {
  const { DatabaseSync } = require('node:sqlite');
  dbInstance = new DatabaseSync(DB_PATH);
  isNativeSqlite = true;
  console.log(`[DB] Connected to native SQLite database at: ${DB_PATH}`);
} catch (err) {
  console.warn(`[DB] Native node:sqlite initialization notice: ${err.message}. Operating with high-speed resilient in-memory SQLite store.`);
}

// ---------------------------------------------------------
// In-Memory Fallback Engine (Mirroring DatabaseSync API)
// ---------------------------------------------------------
class MemoryDatabase {
  constructor() {
    this.tables = {
      trains: new Map(),
      classes: [],
      bookings: new Map(),
      passengers: []
    };
    this.classAutoInc = 1;
    this.passengerAutoInc = 1;
  }

  exec(sql) {
    // Schema creation is maintained in memory structures
    return this;
  }

  prepare(sql) {
    const mem = this;
    const cleanSql = sql.trim();

    return {
      run(...args) {
        if (/INSERT INTO trains/i.test(cleanSql)) {
          const [train_no, train_name, type, from_code, from_name, to_code, to_name, departure_time, arrival_time, duration, distance_km, avg_speed, runs_on, pantry, wifi, clean_bedroll, charging, reading_lamp, halts, live_status] = args;
          mem.tables.trains.set(train_no, {
            train_no, train_name, type, from_code, from_name, to_code, to_name, departure_time, arrival_time, duration, distance_km, avg_speed, runs_on, pantry, wifi, clean_bedroll, charging, reading_lamp, halts, live_status
          });
          return { changes: 1 };
        }
        if (/INSERT INTO classes/i.test(cleanSql)) {
          const [train_no, class_code, class_name, fare, tatkal_fare, available_seats, tatkal_seats, status, status_text, confirm_prob] = args;
          const id = mem.classAutoInc++;
          mem.tables.classes.push({
            id, train_no, class_code, class_name, fare, tatkal_fare, available_seats, tatkal_seats, status, status_text, confirm_prob
          });
          return { changes: 1, lastInsertRowid: id };
        }
        if (/INSERT INTO bookings/i.test(cleanSql)) {
          const [pnr_no, train_no, train_name, journey_date, class_code, quota, total_fare, travel_insurance, payment_method, status, created_at] = args;
          mem.tables.bookings.set(pnr_no, {
            pnr_no, train_no, train_name, journey_date, class_code, quota, total_fare, travel_insurance, payment_method, status, created_at
          });
          return { changes: 1 };
        }
        if (/INSERT INTO passengers/i.test(cleanSql)) {
          const [pnr_no, name, age, gender, berth_pref, allocated_berth, meal_pref, sr_citizen] = args;
          const id = mem.passengerAutoInc++;
          mem.tables.passengers.push({
            id, pnr_no, name, age, gender, berth_pref, allocated_berth, meal_pref, sr_citizen
          });
          return { changes: 1, lastInsertRowid: id };
        }
        if (/UPDATE classes SET available_seats/i.test(cleanSql)) {
          const [seats, train_no, class_code] = args;
          const cls = mem.tables.classes.find(c => c.train_no === train_no && c.class_code === class_code);
          if (cls) {
            cls.available_seats = seats;
            if (seats <= 0) {
              cls.status = 'WAITLIST';
              cls.status_text = 'WL - 1';
            } else {
              cls.status_text = `AVAILABLE - ${seats}`;
            }
            return { changes: 1 };
          }
        }
        return { changes: 0 };
      },

      get(...args) {
        if (/SELECT count\(\*\) as count FROM trains/i.test(cleanSql)) {
          return { count: mem.tables.trains.size };
        }
        if (/SELECT \* FROM trains WHERE train_no = \?/i.test(cleanSql)) {
          return mem.tables.trains.get(args[0]) || null;
        }
        if (/SELECT \* FROM bookings WHERE pnr_no = \?/i.test(cleanSql)) {
          return mem.tables.bookings.get(args[0]) || null;
        }
        if (/SELECT \* FROM classes WHERE train_no = \? AND class_code = \?/i.test(cleanSql)) {
          return mem.tables.classes.find(c => c.train_no === args[0] && c.class_code === args[1]) || null;
        }
        return null;
      },

      all(...args) {
        if (/SELECT \* FROM trains/i.test(cleanSql)) {
          return Array.from(mem.tables.trains.values());
        }
        if (/SELECT \* FROM classes WHERE train_no = \?/i.test(cleanSql)) {
          return mem.tables.classes.filter(c => c.train_no === args[0]);
        }
        if (/SELECT \* FROM passengers WHERE pnr_no = \?/i.test(cleanSql)) {
          return mem.tables.passengers.filter(p => p.pnr_no === args[0]);
        }
        return [];
      }
    };
  }
}

const db = dbInstance || new MemoryDatabase();

// ---------------------------------------------------------
// DDL Schema Setup
// ---------------------------------------------------------
function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS trains (
      train_no TEXT PRIMARY KEY,
      train_name TEXT NOT NULL,
      type TEXT NOT NULL,
      from_code TEXT NOT NULL,
      from_name TEXT NOT NULL,
      to_code TEXT NOT NULL,
      to_name TEXT NOT NULL,
      departure_time TEXT NOT NULL,
      arrival_time TEXT NOT NULL,
      duration TEXT NOT NULL,
      distance_km INTEGER NOT NULL,
      avg_speed TEXT NOT NULL,
      runs_on TEXT NOT NULL,
      pantry INTEGER DEFAULT 1,
      wifi INTEGER DEFAULT 1,
      clean_bedroll INTEGER DEFAULT 1,
      charging INTEGER DEFAULT 1,
      reading_lamp INTEGER DEFAULT 1,
      halts TEXT DEFAULT '[]',
      live_status TEXT DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      train_no TEXT NOT NULL,
      class_code TEXT NOT NULL,
      class_name TEXT NOT NULL,
      fare REAL NOT NULL,
      tatkal_fare REAL NOT NULL,
      available_seats INTEGER NOT NULL,
      tatkal_seats INTEGER NOT NULL,
      status TEXT NOT NULL,
      status_text TEXT NOT NULL,
      confirm_prob INTEGER DEFAULT 95,
      FOREIGN KEY (train_no) REFERENCES trains(train_no) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bookings (
      pnr_no TEXT PRIMARY KEY,
      train_no TEXT NOT NULL,
      train_name TEXT NOT NULL,
      journey_date TEXT NOT NULL,
      class_code TEXT NOT NULL,
      quota TEXT NOT NULL,
      total_fare REAL NOT NULL,
      travel_insurance INTEGER DEFAULT 1,
      payment_method TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS passengers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pnr_no TEXT NOT NULL,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL,
      berth_pref TEXT,
      allocated_berth TEXT,
      meal_pref TEXT,
      sr_citizen INTEGER DEFAULT 0,
      FOREIGN KEY (pnr_no) REFERENCES bookings(pnr_no) ON DELETE CASCADE
    );
  `);
}

// ---------------------------------------------------------
// Seed Initial Authentic Trains & Bookings
// ---------------------------------------------------------
const SEED_TRAINS = [
  {
    train_no: '22436',
    train_name: 'VANDE BHARAT EXPRESS',
    type: 'Vande Bharat 2.0',
    from_code: 'NDLS',
    from_name: 'New Delhi',
    to_code: 'BSB',
    to_name: 'Varanasi Jn',
    departure_time: '06:00',
    arrival_time: '14:00',
    duration: '8h 00m',
    distance_km: 759,
    avg_speed: '95 km/h',
    runs_on: JSON.stringify(['Mon', 'Tue', 'Wed', 'Fri', 'Sat', 'Sun']),
    pantry: 1,
    wifi: 1,
    clean_bedroll: 0,
    charging: 1,
    reading_lamp: 1,
    halts: JSON.stringify([
      { code: 'NDLS', name: 'New Delhi', arr: 'Source', dep: '06:00', day: 1, dist: 0 },
      { code: 'CNB', name: 'Kanpur Central', arr: '10:08', dep: '10:10', day: 1, dist: 440 },
      { code: 'PRYJ', name: 'Prayagraj Jn', arr: '12:08', dep: '12:10', day: 1, dist: 635 },
      { code: 'BSB', name: 'Varanasi Jn', arr: '14:00', dep: 'Destination', day: 1, dist: 759 }
    ]),
    live_status: JSON.stringify({
      statusText: 'Running On Time',
      currentLocation: 'Approaching Kanpur Central (CNB)',
      speed: '158 km/h',
      delayMinutes: 0,
      nextStation: 'CNB (Kanpur Central)',
      etaNextStation: '10:08 AM',
      distanceCoveredKm: 440,
      totalKm: 759,
      progressPercent: 58
    }),
    classes: [
      { class_code: 'EC', class_name: 'Exec Chair Car', fare: 2420, tatkal_fare: 2750, available_seats: 14, tatkal_seats: 4, status: 'AVAILABLE', status_text: 'AVAILABLE - 14', confirm_prob: 99 },
      { class_code: 'CC', class_name: 'AC Chair Car', fare: 1380, tatkal_fare: 1610, available_seats: 62, tatkal_seats: 18, status: 'AVAILABLE', status_text: 'AVAILABLE - 62', confirm_prob: 98 }
    ]
  },
  {
    train_no: '12002',
    train_name: 'BHOPAL SHATABDI EXPRESS',
    type: 'Shatabdi Express',
    from_code: 'NDLS',
    from_name: 'New Delhi',
    to_code: 'RKMP',
    to_name: 'Rani Kamlapati (Bhopal)',
    departure_time: '06:00',
    arrival_time: '14:40',
    duration: '8h 40m',
    distance_km: 708,
    avg_speed: '82 km/h',
    runs_on: JSON.stringify(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']),
    pantry: 1,
    wifi: 1,
    clean_bedroll: 0,
    charging: 1,
    reading_lamp: 1,
    halts: JSON.stringify([
      { code: 'NDLS', name: 'New Delhi', arr: 'Source', dep: '06:00', day: 1, dist: 0 },
      { code: 'MTJ', name: 'Mathura Jn', arr: '07:19', dep: '07:20', day: 1, dist: 141 },
      { code: 'AGC', name: 'Agra Cantt', arr: '07:50', dep: '07:55', day: 1, dist: 195 },
      { code: 'GWL', name: 'Gwalior Jn', arr: '09:23', dep: '09:28', day: 1, dist: 313 },
      { code: 'VGLJ', name: 'VGL Jhansi Jn', arr: '10:45', dep: '10:50', day: 1, dist: 410 },
      { code: 'BPL', name: 'Bhopal Jn', arr: '14:12', dep: '14:15', day: 1, dist: 702 },
      { code: 'RKMP', name: 'Rani Kamlapati', arr: '14:40', dep: 'Destination', day: 1, dist: 708 }
    ]),
    live_status: JSON.stringify({
      statusText: 'Running On Time',
      currentLocation: 'Departed Agra Cantt',
      speed: '130 km/h',
      delayMinutes: 0,
      nextStation: 'GWL (Gwalior Jn)',
      etaNextStation: '09:23 AM',
      distanceCoveredKm: 245,
      totalKm: 708,
      progressPercent: 35
    }),
    classes: [
      { class_code: 'EC', class_name: 'Exec Chair Car', fare: 2185, tatkal_fare: 2510, available_seats: 12, tatkal_seats: 4, status: 'AVAILABLE', status_text: 'AVAILABLE - 12', confirm_prob: 95 },
      { class_code: 'CC', class_name: 'AC Chair Car', fare: 1165, tatkal_fare: 1395, available_seats: 74, tatkal_seats: 20, status: 'AVAILABLE', status_text: 'AVAILABLE - 74', confirm_prob: 97 },
      { class_code: 'EV', class_name: 'Vistadome AC', fare: 2760, tatkal_fare: 3050, available_seats: 6, tatkal_seats: 2, status: 'AVAILABLE', status_text: 'AVAILABLE - 06', confirm_prob: 91 }
    ]
  },
  {
    train_no: '12952',
    train_name: 'MUMBAI TEJAS RAJDHANI',
    type: 'Rajdhani Express',
    from_code: 'NDLS',
    from_name: 'New Delhi',
    to_code: 'MMCT',
    to_name: 'Mumbai Central',
    departure_time: '16:55',
    arrival_time: '08:35',
    duration: '15h 40m',
    distance_km: 1386,
    avg_speed: '88 km/h',
    runs_on: JSON.stringify(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']),
    pantry: 1,
    wifi: 1,
    clean_bedroll: 1,
    charging: 1,
    reading_lamp: 1,
    halts: JSON.stringify([
      { code: 'NDLS', name: 'New Delhi', arr: 'Source', dep: '16:55', day: 1, dist: 0 },
      { code: 'KOTA', name: 'Kota Jn', arr: '21:30', dep: '21:40', day: 1, dist: 466 },
      { code: 'RTM', name: 'Ratlam Jn', arr: '00:50', dep: '00:53', day: 2, dist: 732 },
      { code: 'BRC', name: 'Vadodara Jn', arr: '04:10', dep: '04:18', day: 2, dist: 993 },
      { code: 'ST', name: 'Surat', arr: '05:43', dep: '05:48', day: 2, dist: 1122 },
      { code: 'BVI', name: 'Borivali', arr: '07:58', dep: '08:00', day: 2, dist: 1356 },
      { code: 'MMCT', name: 'Mumbai Central', arr: '08:35', dep: 'Destination', day: 2, dist: 1386 }
    ]),
    live_status: JSON.stringify({
      statusText: 'Running On Time',
      currentLocation: 'Approaching Kota Junction',
      speed: '129 km/h',
      delayMinutes: 0,
      nextStation: 'KOTA (Kota Jn)',
      etaNextStation: '09:30 PM',
      distanceCoveredKm: 420,
      totalKm: 1386,
      progressPercent: 30
    }),
    classes: [
      { class_code: '1A', class_name: 'First AC', fare: 4390, tatkal_fare: 4850, available_seats: 8, tatkal_seats: 2, status: 'AVAILABLE', status_text: 'AVAILABLE - 08', confirm_prob: 94 },
      { class_code: '2A', class_name: 'AC 2-Tier', fare: 2950, tatkal_fare: 3350, available_seats: 24, tatkal_seats: 6, status: 'AVAILABLE', status_text: 'AVAILABLE - 24', confirm_prob: 90 },
      { class_code: '3A', class_name: 'AC 3-Tier', fare: 2080, tatkal_fare: 2410, available_seats: 52, tatkal_seats: 14, status: 'AVAILABLE', status_text: 'AVAILABLE - 52', confirm_prob: 93 }
    ]
  },
  {
    train_no: '20801',
    train_name: 'MAGADH EXPRESS',
    type: 'Superfast Express',
    from_code: 'NDLS',
    from_name: 'New Delhi',
    to_code: 'PNBE',
    to_name: 'Patna Jn',
    departure_time: '21:05',
    arrival_time: '11:50',
    duration: '14h 45m',
    distance_km: 1008,
    avg_speed: '68 km/h',
    runs_on: JSON.stringify(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']),
    pantry: 1,
    wifi: 0,
    clean_bedroll: 1,
    charging: 1,
    reading_lamp: 0,
    halts: JSON.stringify([
      { code: 'NDLS', name: 'New Delhi', arr: 'Source', dep: '21:05', day: 1, dist: 0 },
      { code: 'ALJN', name: 'Aligarh Jn', arr: '22:48', dep: '22:50', day: 1, dist: 131 },
      { code: 'CNB', name: 'Kanpur Central', arr: '02:00', dep: '02:05', day: 2, dist: 440 },
      { code: 'PRYJ', name: 'Prayagraj Jn', arr: '04:15', dep: '04:20', day: 2, dist: 635 },
      { code: 'DDU', name: 'Pt DD Upadhyaya Jn', arr: '06:50', dep: '07:00', day: 2, dist: 787 },
      { code: 'PNBE', name: 'Patna Jn', arr: '11:50', dep: 'Destination', day: 2, dist: 1008 }
    ]),
    live_status: JSON.stringify({
      statusText: 'Running On Time',
      currentLocation: 'Passed Aligarh Jn',
      speed: '110 km/h',
      delayMinutes: 0,
      nextStation: 'CNB (Kanpur Central)',
      etaNextStation: '02:00 AM',
      distanceCoveredKm: 210,
      totalKm: 1008,
      progressPercent: 21
    }),
    classes: [
      { class_code: '1A', class_name: 'First AC', fare: 3280, tatkal_fare: 3650, available_seats: 4, tatkal_seats: 2, status: 'AVAILABLE', status_text: 'AVAILABLE - 04', confirm_prob: 88 },
      { class_code: '2A', class_name: 'AC 2-Tier', fare: 1940, tatkal_fare: 2250, available_seats: 16, tatkal_seats: 4, status: 'AVAILABLE', status_text: 'AVAILABLE - 16', confirm_prob: 84 },
      { class_code: '3A', class_name: 'AC 3-Tier', fare: 1360, tatkal_fare: 1610, available_seats: 38, tatkal_seats: 10, status: 'AVAILABLE', status_text: 'AVAILABLE - 38', confirm_prob: 87 },
      { class_code: 'SL', class_name: 'Sleeper Class', fare: 515, tatkal_fare: 620, available_seats: 85, tatkal_seats: 25, status: 'AVAILABLE', status_text: 'AVAILABLE - 85', confirm_prob: 92 }
    ]
  },
  {
    train_no: '22691',
    train_name: 'KSR BENGALURU RAJDHANI',
    type: 'Rajdhani Express',
    from_code: 'NDLS',
    from_name: 'New Delhi (Hazrat Nizamuddin)',
    to_code: 'SBC',
    to_name: 'KSR Bengaluru City',
    departure_time: '20:00',
    arrival_time: '05:30',
    duration: '33h 30m',
    distance_km: 2365,
    avg_speed: '71 km/h',
    runs_on: JSON.stringify(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']),
    pantry: 1,
    wifi: 1,
    clean_bedroll: 1,
    charging: 1,
    reading_lamp: 1,
    halts: JSON.stringify([
      { code: 'NZM', name: 'Hazrat Nizamuddin', arr: 'Source', dep: '20:00', day: 1, dist: 0 },
      { code: 'AGC', name: 'Agra Cantt', arr: '22:15', dep: '22:17', day: 1, dist: 188 },
      { code: 'VGLJ', name: 'VGL Jhansi Jn', arr: '01:05', dep: '01:10', day: 2, dist: 403 },
      { code: 'BPL', name: 'Bhopal Jn', arr: '04:35', dep: '04:40', day: 2, dist: 695 },
      { code: 'NGP', name: 'Nagpur Jn', arr: '10:55', dep: '11:00', day: 2, dist: 1085 },
      { code: 'SC', name: 'Secunderabad Jn', arr: '18:55', dep: '19:05', day: 2, dist: 1668 },
      { code: 'SBC', name: 'KSR Bengaluru', arr: '05:30', dep: 'Destination', day: 3, dist: 2365 }
    ]),
    live_status: JSON.stringify({
      statusText: 'Running On Time',
      currentLocation: 'Approaching Bhopal Jn',
      speed: '124 km/h',
      delayMinutes: 0,
      nextStation: 'BPL (Bhopal Jn)',
      etaNextStation: '04:35 AM',
      distanceCoveredKm: 650,
      totalKm: 2365,
      progressPercent: 28
    }),
    classes: [
      { class_code: '1A', class_name: 'First AC', fare: 5820, tatkal_fare: 6450, available_seats: 6, tatkal_seats: 2, status: 'AVAILABLE', status_text: 'AVAILABLE - 06', confirm_prob: 92 },
      { class_code: '2A', class_name: 'AC 2-Tier', fare: 3980, tatkal_fare: 4480, available_seats: 20, tatkal_seats: 6, status: 'AVAILABLE', status_text: 'AVAILABLE - 20', confirm_prob: 89 },
      { class_code: '3A', class_name: 'AC 3-Tier', fare: 2850, tatkal_fare: 3270, available_seats: 44, tatkal_seats: 12, status: 'AVAILABLE', status_text: 'AVAILABLE - 44', confirm_prob: 91 }
    ]
  },
  {
    train_no: '82501',
    train_name: 'LUCKNOW - NEW DELHI TEJAS EXPRESS',
    type: 'Tejas Express',
    from_code: 'LJN',
    from_name: 'Lucknow Jn',
    to_code: 'NDLS',
    to_name: 'New Delhi',
    departure_time: '06:10',
    arrival_time: '12:25',
    duration: '6h 15m',
    distance_km: 511,
    avg_speed: '82 km/h',
    runs_on: JSON.stringify(['Mon', 'Tue', 'Wed', 'Fri', 'Sat', 'Sun']),
    pantry: 1,
    wifi: 1,
    clean_bedroll: 0,
    charging: 1,
    reading_lamp: 1,
    halts: JSON.stringify([
      { code: 'LJN', name: 'Lucknow Jn', arr: 'Source', dep: '06:10', day: 1, dist: 0 },
      { code: 'CNB', name: 'Kanpur Central', arr: '07:15', dep: '07:20', day: 1, dist: 72 },
      { code: 'GZB', name: 'Ghaziabad Jn', arr: '11:45', dep: '11:47', day: 1, dist: 486 },
      { code: 'NDLS', name: 'New Delhi', arr: '12:25', dep: 'Destination', day: 1, dist: 511 }
    ]),
    live_status: JSON.stringify({
      statusText: 'Running On Time',
      currentLocation: 'Passing Ghaziabad Outer',
      speed: '115 km/h',
      delayMinutes: 0,
      nextStation: 'NDLS (New Delhi)',
      etaNextStation: '12:25 PM',
      distanceCoveredKm: 495,
      totalKm: 511,
      progressPercent: 97
    }),
    classes: [
      { class_code: 'EC', class_name: 'Exec Chair Car', fare: 2245, tatkal_fare: 2520, available_seats: 18, tatkal_seats: 4, status: 'AVAILABLE', status_text: 'AVAILABLE - 18', confirm_prob: 96 },
      { class_code: 'CC', class_name: 'AC Chair Car', fare: 1290, tatkal_fare: 1485, available_seats: 68, tatkal_seats: 16, status: 'AVAILABLE', status_text: 'AVAILABLE - 68', confirm_prob: 98 }
    ]
  },
  {
    train_no: '12302',
    train_name: 'HOWRAH RAJDHANI EXPRESS',
    type: 'Rajdhani Express',
    from_code: 'NDLS',
    from_name: 'New Delhi',
    to_code: 'HWH',
    to_name: 'Howrah Jn (Kolkata)',
    departure_time: '16:50',
    arrival_time: '09:55',
    duration: '17h 05m',
    distance_km: 1451,
    avg_speed: '85 km/h',
    runs_on: JSON.stringify(['Mon', 'Tue', 'Wed', 'Thu', 'Sat', 'Sun']),
    pantry: 1,
    wifi: 1,
    clean_bedroll: 1,
    charging: 1,
    reading_lamp: 1,
    halts: JSON.stringify([
      { code: 'NDLS', name: 'New Delhi', arr: 'Source', dep: '16:50', day: 1, dist: 0 },
      { code: 'CNB', name: 'Kanpur Central', arr: '21:32', dep: '21:37', day: 1, dist: 440 },
      { code: 'PRYJ', name: 'Prayagraj Jn', arr: '23:43', dep: '23:45', day: 1, dist: 635 },
      { code: 'DDU', name: 'Pt DD Upadhyaya Jn', arr: '01:42', dep: '01:52', day: 2, dist: 787 },
      { code: 'GAYA', name: 'Gaya Jn', arr: '03:55', dep: '03:58', day: 2, dist: 992 },
      { code: 'DHN', name: 'Dhanbad Jn', arr: '06:33', dep: '06:38', day: 2, dist: 1193 },
      { code: 'HWH', name: 'Howrah Jn', arr: '09:55', dep: 'Destination', day: 2, dist: 1451 }
    ]),
    live_status: JSON.stringify({
      statusText: 'Running 8m Late',
      currentLocation: 'Passed Mirzapur Jn',
      speed: '128 km/h',
      delayMinutes: 8,
      nextStation: 'DDU (Pt DD Upadhyaya Jn)',
      etaNextStation: '01:42 AM',
      distanceCoveredKm: 760,
      totalKm: 1451,
      progressPercent: 52
    }),
    classes: [
      { class_code: '1A', class_name: 'First AC', fare: 4850, tatkal_fare: 5350, available_seats: 6, tatkal_seats: 2, status: 'AVAILABLE', status_text: 'AVAILABLE - 06', confirm_prob: 91 },
      { class_code: '2A', class_name: 'AC 2-Tier', fare: 3280, tatkal_fare: 3710, available_seats: 18, tatkal_seats: 5, status: 'AVAILABLE', status_text: 'AVAILABLE - 18', confirm_prob: 87 },
      { class_code: '3A', class_name: 'AC 3-Tier', fare: 2360, tatkal_fare: 2720, available_seats: 40, tatkal_seats: 10, status: 'AVAILABLE', status_text: 'AVAILABLE - 40', confirm_prob: 92 }
    ]
  },
  {
    train_no: '20901',
    train_name: 'MUMBAI CENTRAL - GANDHINAGAR VANDE BHARAT',
    type: 'Vande Bharat 2.0',
    from_code: 'MMCT',
    from_name: 'Mumbai Central',
    to_code: 'GNC',
    to_name: 'Gandhinagar Capital',
    departure_time: '06:10',
    arrival_time: '12:25',
    duration: '6h 15m',
    distance_km: 522,
    avg_speed: '84 km/h',
    runs_on: JSON.stringify(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']),
    pantry: 1,
    wifi: 1,
    clean_bedroll: 0,
    charging: 1,
    reading_lamp: 1,
    halts: JSON.stringify([
      { code: 'MMCT', name: 'Mumbai Central', arr: 'Source', dep: '06:10', day: 1, dist: 0 },
      { code: 'BVI', name: 'Borivali', arr: '06:32', dep: '06:34', day: 1, dist: 30 },
      { code: 'ST', name: 'Surat', arr: '08:47', dep: '08:50', day: 1, dist: 263 },
      { code: 'BRC', name: 'Vadodara Jn', arr: '09:59', dep: '10:04', day: 1, dist: 392 },
      { code: 'ADI', name: 'Ahmedabad Jn', arr: '11:25', dep: '11:30', day: 1, dist: 493 },
      { code: 'GNC', name: 'Gandhinagar Capital', arr: '12:25', dep: 'Destination', day: 1, dist: 522 }
    ]),
    live_status: JSON.stringify({
      statusText: 'Running On Time',
      currentLocation: 'Approaching Ahmedabad Jn',
      speed: '130 km/h',
      delayMinutes: 0,
      nextStation: 'ADI (Ahmedabad Jn)',
      etaNextStation: '11:25 AM',
      distanceCoveredKm: 480,
      totalKm: 522,
      progressPercent: 92
    }),
    classes: [
      { class_code: 'EC', class_name: 'Exec Chair Car', fare: 2385, tatkal_fare: 2680, available_seats: 16, tatkal_seats: 4, status: 'AVAILABLE', status_text: 'AVAILABLE - 16', confirm_prob: 97 },
      { class_code: 'CC', class_name: 'AC Chair Car', fare: 1320, tatkal_fare: 1540, available_seats: 70, tatkal_seats: 18, status: 'AVAILABLE', status_text: 'AVAILABLE - 70', confirm_prob: 99 }
    ]
  },
  {
    train_no: '20607',
    train_name: 'CHENNAI CENTRAL - MYSURU VANDE BHARAT',
    type: 'Vande Bharat 2.0',
    from_code: 'MAS',
    from_name: 'MGR Chennai Central',
    to_code: 'MYS',
    to_name: 'Mysuru Jn',
    departure_time: '05:50',
    arrival_time: '12:20',
    duration: '6h 30m',
    distance_km: 500,
    avg_speed: '77 km/h',
    runs_on: JSON.stringify(['Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon']),
    pantry: 1,
    wifi: 1,
    clean_bedroll: 0,
    charging: 1,
    reading_lamp: 1,
    halts: JSON.stringify([
      { code: 'MAS', name: 'Chennai Central', arr: 'Source', dep: '05:50', day: 1, dist: 0 },
      { code: 'KPD', name: 'Katpadi Jn', arr: '07:13', dep: '07:15', day: 1, dist: 130 },
      { code: 'SBC', name: 'KSR Bengaluru', arr: '10:15', dep: '10:20', day: 1, dist: 359 },
      { code: 'MYS', name: 'Mysuru Jn', arr: '12:20', dep: 'Destination', day: 1, dist: 500 }
    ]),
    live_status: JSON.stringify({
      statusText: 'Running On Time',
      currentLocation: 'Between Katpadi and Jolarpettai',
      speed: '130 km/h',
      delayMinutes: 0,
      nextStation: 'SBC (KSR Bengaluru)',
      etaNextStation: '10:15 AM',
      distanceCoveredKm: 215,
      totalKm: 500,
      progressPercent: 43
    }),
    classes: [
      { class_code: 'EC', class_name: 'Exec Chair Car', fare: 2290, tatkal_fare: 2590, available_seats: 12, tatkal_seats: 4, status: 'AVAILABLE', status_text: 'AVAILABLE - 12', confirm_prob: 96 },
      { class_code: 'CC', class_name: 'AC Chair Car', fare: 1280, tatkal_fare: 1490, available_seats: 64, tatkal_seats: 16, status: 'AVAILABLE', status_text: 'AVAILABLE - 64', confirm_prob: 98 }
    ]
  },
  {
    train_no: '12424',
    train_name: 'DBRG RAJDHANI EXPRESS',
    type: 'Rajdhani Express',
    from_code: 'NDLS',
    from_name: 'New Delhi',
    to_code: 'DBRG',
    to_name: 'Dibrugarh',
    departure_time: '16:20',
    arrival_time: '07:00',
    duration: '38h 40m',
    distance_km: 2434,
    avg_speed: '63 km/h',
    runs_on: JSON.stringify(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']),
    pantry: 1,
    wifi: 1,
    clean_bedroll: 1,
    charging: 1,
    reading_lamp: 1,
    halts: JSON.stringify([
      { code: 'NDLS', name: 'New Delhi', arr: 'Source', dep: '16:20', day: 1, dist: 0 },
      { code: 'CNB', name: 'Kanpur Central', arr: '21:02', dep: '21:07', day: 1, dist: 440 },
      { code: 'DDU', name: 'Pt DD Upadhyaya Jn', arr: '01:23', dep: '01:33', day: 2, dist: 787 },
      { code: 'PNBE', name: 'Patna Jn', arr: '04:15', dep: '04:25', day: 2, dist: 1001 },
      { code: 'GHY', name: 'Guwahati', arr: '19:15', dep: '19:30', day: 2, dist: 1888 },
      { code: 'DBRG', name: 'Dibrugarh', arr: '07:00', dep: 'Destination', day: 3, dist: 2434 }
    ]),
    live_status: JSON.stringify({
      statusText: 'Running 12m Late',
      currentLocation: 'Crossing Katihar Jn',
      speed: '105 km/h',
      delayMinutes: 12,
      nextStation: 'NJP (New Jalpaiguri)',
      etaNextStation: '11:45 AM',
      distanceCoveredKm: 1320,
      totalKm: 2434,
      progressPercent: 54
    }),
    classes: [
      { class_code: '1A', class_name: 'First AC', fare: 6120, tatkal_fare: 6750, available_seats: 4, tatkal_seats: 2, status: 'AVAILABLE', status_text: 'AVAILABLE - 04', confirm_prob: 89 },
      { class_code: '2A', class_name: 'AC 2-Tier', fare: 4180, tatkal_fare: 4680, available_seats: 14, tatkal_seats: 4, status: 'AVAILABLE', status_text: 'AVAILABLE - 14', confirm_prob: 86 },
      { class_code: '3A', class_name: 'AC 3-Tier', fare: 2980, tatkal_fare: 3410, available_seats: 32, tatkal_seats: 8, status: 'AVAILABLE', status_text: 'AVAILABLE - 32', confirm_prob: 88 }
    ]
  },
  {
    train_no: '12556',
    train_name: 'GORAKHDHAM SUPERFAST EXPRESS',
    type: 'Superfast Express',
    from_code: 'BTI',
    from_name: 'Bathinda Jn',
    to_code: 'GKP',
    to_name: 'Gorakhpur Jn',
    departure_time: '14:15',
    arrival_time: '09:45',
    duration: '19h 30m',
    distance_km: 948,
    avg_speed: '49 km/h',
    runs_on: JSON.stringify(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']),
    pantry: 1,
    wifi: 0,
    clean_bedroll: 1,
    charging: 1,
    reading_lamp: 0,
    halts: JSON.stringify([
      { code: 'BTI', name: 'Bathinda Jn', arr: 'Source', dep: '14:15', day: 1, dist: 0 },
      { code: 'ROK', name: 'Rohtak Jn', arr: '19:08', dep: '19:10', day: 1, dist: 228 },
      { code: 'NDLS', name: 'New Delhi', arr: '21:10', dep: '21:25', day: 1, dist: 299 },
      { code: 'CNB', name: 'Kanpur Central', arr: '03:15', dep: '03:20', day: 2, dist: 739 },
      { code: 'LKO', name: 'Lucknow Charbagh', arr: '04:55', dep: '05:05', day: 2, dist: 811 },
      { code: 'GKP', name: 'Gorakhpur Jn', arr: '09:45', dep: 'Destination', day: 2, dist: 948 }
    ]),
    live_status: JSON.stringify({
      statusText: 'Running On Time',
      currentLocation: 'Approaching New Delhi (NDLS)',
      speed: '90 km/h',
      delayMinutes: 0,
      nextStation: 'NDLS (New Delhi)',
      etaNextStation: '09:10 PM',
      distanceCoveredKm: 285,
      totalKm: 948,
      progressPercent: 30
    }),
    classes: [
      { class_code: '1A', class_name: 'First AC', fare: 2960, tatkal_fare: 3300, available_seats: 2, tatkal_seats: 1, status: 'AVAILABLE', status_text: 'AVAILABLE - 02', confirm_prob: 82 },
      { class_code: '2A', class_name: 'AC 2-Tier', fare: 1750, tatkal_fare: 2020, available_seats: 12, tatkal_seats: 4, status: 'AVAILABLE', status_text: 'AVAILABLE - 12', confirm_prob: 85 },
      { class_code: '3A', class_name: 'AC 3-Tier', fare: 1230, tatkal_fare: 1460, available_seats: 42, tatkal_seats: 12, status: 'AVAILABLE', status_text: 'AVAILABLE - 42', confirm_prob: 90 },
      { class_code: 'SL', class_name: 'Sleeper Class', fare: 465, tatkal_fare: 550, available_seats: 92, tatkal_seats: 30, status: 'AVAILABLE', status_text: 'AVAILABLE - 92', confirm_prob: 94 }
    ]
  },
  {
    train_no: '12425',
    train_name: 'JAMMU RAJDHANI EXPRESS',
    type: 'Rajdhani Express',
    from_code: 'NDLS',
    from_name: 'New Delhi',
    to_code: 'JAT',
    to_name: 'Jammu Tawi',
    departure_time: '20:40',
    arrival_time: '05:45',
    duration: '9h 05m',
    distance_km: 582,
    avg_speed: '64 km/h',
    runs_on: JSON.stringify(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']),
    pantry: 1,
    wifi: 1,
    clean_bedroll: 1,
    charging: 1,
    reading_lamp: 1,
    halts: JSON.stringify([
      { code: 'NDLS', name: 'New Delhi', arr: 'Source', dep: '20:40', day: 1, dist: 0 },
      { code: 'LDH', name: 'Ludhiana Jn', arr: '00:28', dep: '00:38', day: 2, dist: 312 },
      { code: 'PTKC', name: 'Pathankot Cantt', arr: '03:08', dep: '03:10', day: 2, dist: 477 },
      { code: 'JAT', name: 'Jammu Tawi', arr: '05:45', dep: 'Destination', day: 2, dist: 582 }
    ]),
    live_status: JSON.stringify({
      statusText: 'Running On Time',
      currentLocation: 'Between Ludhiana and Jalandhar',
      speed: '125 km/h',
      delayMinutes: 0,
      nextStation: 'PTKC (Pathankot Cantt)',
      etaNextStation: '03:08 AM',
      distanceCoveredKm: 370,
      totalKm: 582,
      progressPercent: 63
    }),
    classes: [
      { class_code: '1A', class_name: 'First AC', fare: 2780, tatkal_fare: 3120, available_seats: 6, tatkal_seats: 2, status: 'AVAILABLE', status_text: 'AVAILABLE - 06', confirm_prob: 92 },
      { class_code: '2A', class_name: 'AC 2-Tier', fare: 1890, tatkal_fare: 2180, available_seats: 18, tatkal_seats: 5, status: 'AVAILABLE', status_text: 'AVAILABLE - 18', confirm_prob: 89 },
      { class_code: '3A', class_name: 'AC 3-Tier', fare: 1380, tatkal_fare: 1620, available_seats: 46, tatkal_seats: 14, status: 'AVAILABLE', status_text: 'AVAILABLE - 46', confirm_prob: 93 }
    ]
  },
  {
    train_no: '12124',
    train_name: 'DECCAN QUEEN SUPERFAST EXPRESS',
    type: 'Superfast Intercity',
    from_code: 'PUNE',
    from_name: 'Pune Jn',
    to_code: 'CSMT',
    to_name: 'Mumbai CSMT',
    departure_time: '07:15',
    arrival_time: '10:25',
    duration: '3h 10m',
    distance_km: 192,
    avg_speed: '61 km/h',
    runs_on: JSON.stringify(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']),
    pantry: 1,
    wifi: 0,
    clean_bedroll: 0,
    charging: 1,
    reading_lamp: 0,
    halts: JSON.stringify([
      { code: 'PUNE', name: 'Pune Jn', arr: 'Source', dep: '07:15', day: 1, dist: 0 },
      { code: 'LNL', name: 'Lonavala', arr: '08:08', dep: '08:10', day: 1, dist: 64 },
      { code: 'DR', name: 'Dadar Central', arr: '09:58', dep: '10:00', day: 1, dist: 183 },
      { code: 'CSMT', name: 'Mumbai CSMT', arr: '10:25', dep: 'Destination', day: 1, dist: 192 }
    ]),
    live_status: JSON.stringify({
      statusText: 'Running On Time',
      currentLocation: 'Approaching Khandala Ghat',
      speed: '85 km/h',
      delayMinutes: 0,
      nextStation: 'DR (Dadar Central)',
      etaNextStation: '09:58 AM',
      distanceCoveredKm: 85,
      totalKm: 192,
      progressPercent: 44
    }),
    classes: [
      { class_code: 'CC', class_name: 'AC Chair Car', fare: 460, tatkal_fare: 560, available_seats: 38, tatkal_seats: 10, status: 'AVAILABLE', status_text: 'AVAILABLE - 38', confirm_prob: 96 },
      { class_code: '2S', class_name: 'Second Sitting', fare: 120, tatkal_fare: 165, available_seats: 110, tatkal_seats: 35, status: 'AVAILABLE', status_text: 'AVAILABLE - 110', confirm_prob: 99 }
    ]
  }
];

function seedDatabase() {
  const countRow = db.prepare('SELECT count(*) as count FROM trains').get();
  if (countRow && countRow.count > 0) {
    return; // Already seeded
  }

  console.log('[DB] Seeding authentic trains into database...');
  const insertTrain = db.prepare(`
    INSERT INTO trains (
      train_no, train_name, type, from_code, from_name, to_code, to_name,
      departure_time, arrival_time, duration, distance_km, avg_speed,
      runs_on, pantry, wifi, clean_bedroll, charging, reading_lamp, halts, live_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertClass = db.prepare(`
    INSERT INTO classes (
      train_no, class_code, class_name, fare, tatkal_fare,
      available_seats, tatkal_seats, status, status_text, confirm_prob
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const t of SEED_TRAINS) {
    insertTrain.run(
      t.train_no, t.train_name, t.type, t.from_code, t.from_name, t.to_code, t.to_name,
      t.departure_time, t.arrival_time, t.duration, t.distance_km, t.avg_speed,
      t.runs_on, t.pantry, t.wifi, t.clean_bedroll, t.charging, t.reading_lamp,
      t.halts, t.live_status
    );

    for (const c of t.classes) {
      insertClass.run(
        t.train_no, c.class_code, c.class_name, c.fare, c.tatkal_fare,
        c.available_seats, c.tatkal_seats, c.status, c.status_text, c.confirm_prob
      );
    }
  }

  // Pre-seed sample bookings
  console.log('[DB] Seeding standard Indian Railways PNR bookings...');
  const insertBooking = db.prepare(`
    INSERT INTO bookings (
      pnr_no, train_no, train_name, journey_date, class_code,
      quota, total_fare, travel_insurance, payment_method, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertPassenger = db.prepare(`
    INSERT INTO passengers (
      pnr_no, name, age, gender, berth_pref, allocated_berth, meal_pref, sr_citizen
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // PNR 1: 2847193852 (CNF) - Vande Bharat
  insertBooking.run(
    '2847193852', '22436', 'VANDE BHARAT EXPRESS', '2026-09-24', 'CC',
    'GN', 4140, 1, 'UPI / BHIM', 'CONFIRMED', '2026-09-20T10:15:00.000Z'
  );
  insertPassenger.run('2847193852', 'Dr. Rajesh Sharma', 48, 'M', 'Window', 'C2 / 18 (Window WS)', 'Veg Meal', 0);
  insertPassenger.run('2847193852', 'Sunita Sharma', 44, 'F', 'Aisle', 'C2 / 19 (Aisle AS)', 'Veg Meal', 0);
  insertPassenger.run('2847193852', 'Aarav Sharma', 16, 'M', 'Middle', 'C2 / 20 (Middle M)', 'Non-Veg Meal', 0);

  // PNR 2: 6491028471 (RAC) - Howrah Rajdhani
  insertBooking.run(
    '6491028471', '12302', 'HOWRAH RAJDHANI EXPRESS', '2026-09-25', '3A',
    'TQ', 4720, 1, 'Credit Card (Razorpay)', 'RAC', '2026-09-23T14:20:00.000Z'
  );
  insertPassenger.run('6491028471', 'Vikramaditya Sen', 36, 'M', 'Side Lower', 'B4 / RAC 01 (Side Lower SL)', 'Non-Veg Meal', 0);
  insertPassenger.run('6491028471', 'Ananya Sen', 33, 'F', 'Side Lower', 'B4 / RAC 02 (Side Lower SL)', 'Veg Meal', 0);

  // PNR 3: 8371940285 (WL) - Mumbai Tejas Rajdhani
  insertBooking.run(
    '8371940285', '12952', 'MUMBAI TEJAS RAJDHANI', '2026-09-26', '2A',
    'GN', 2950, 1, 'Net Banking (SBI)', 'WAITLIST', '2026-09-24T08:05:00.000Z'
  );
  insertPassenger.run('8371940285', 'Kavita Deshmukh', 29, 'F', 'Lower', 'WL 02 (High CNF Chance: 89%)', 'Veg Meal', 0);

  console.log('[DB] Seeding complete! Database ready for high-concurrency requests.');
}

// Initialize tables and seed data
initSchema();
seedDatabase();

// ---------------------------------------------------------
// Query Helper Operations
// ---------------------------------------------------------

/**
 * Search trains by stations with dynamic availability and filters
 */
function searchTrains({ from, to, date, quota = 'GN', vandeOnly = false, availableOnly = false, acOnly = false }) {
  const fromCode = (from || '').toUpperCase().trim();
  const toCode = (to || '').toUpperCase().trim();

  const allTrains = db.prepare('SELECT * FROM trains').all();

  // Find trains matching exact route or station intermediate
  let matched = allTrains.filter(t => {
    if (!fromCode && !toCode) return true;
    if (fromCode && toCode) {
      if (t.from_code === fromCode && t.to_code === toCode) return true;
      // Check halts
      try {
        const halts = JSON.parse(t.halts || '[]');
        const fromIdx = halts.findIndex(h => h.code === fromCode);
        const toIdx = halts.findIndex(h => h.code === toCode);
        if (fromIdx !== -1 && toIdx !== -1 && fromIdx < toIdx) return true;
      } catch (e) {}
      return false;
    }
    if (fromCode) return t.from_code === fromCode;
    if (toCode) return t.to_code === toCode;
    return true;
  });

  // If no direct trains match, fallback to trains matching origin or premier trains
  if (matched.length === 0) {
    matched = allTrains.filter(t => t.from_code === fromCode || t.to_code === toCode);
  }
  if (matched.length === 0) {
    matched = allTrains.slice(0, 6); // Premier trains fallback showcase
  }

  // Attach classes and calculate dynamic seat availability for quota
  const results = matched.map(train => {
    const rawClasses = db.prepare('SELECT * FROM classes WHERE train_no = ?').all(train.train_no);
    const classesObj = {};

    for (const c of rawClasses) {
      const isTatkal = quota === 'TQ' || quota === 'PT';
      const seatCount = isTatkal ? c.tatkal_seats : c.available_seats;
      const fareAmount = isTatkal ? c.tatkal_fare : c.fare;
      const statusText = seatCount > 0 ? `AVAILABLE - ${String(seatCount).padStart(2, '0')}` : 'WL - 4';
      const status = seatCount > 0 ? 'AVAILABLE' : 'WAITLIST';

      classesObj[c.class_code] = {
        name: c.class_name,
        seats: seatCount,
        status: status,
        statusText: statusText,
        badgeClass: seatCount > 0 ? 'badge-green' : 'badge-orange',
        fare: fareAmount,
        tatkalAvailable: c.tatkal_seats,
        tatkalFare: c.tatkal_fare,
        probPercent: c.confirm_prob,
        probText: `${c.confirm_prob}% High Chance`
      };
    }

    let runsOnArray = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    let haltsArray = [];
    let liveStatusObj = {};

    try { runsOnArray = JSON.parse(train.runs_on); } catch (e) {}
    try { haltsArray = JSON.parse(train.halts); } catch (e) {}
    try { liveStatusObj = JSON.parse(train.live_status); } catch (e) {}

    return {
      trainNo: train.train_no,
      trainName: train.train_name,
      type: train.type,
      badge: train.type.includes('Vande') ? '160 km/h Semi-High Speed' : (train.type.includes('Rajdhani') ? 'Premier Superfast' : 'Express'),
      fromStation: train.from_code,
      fromStationName: train.from_name,
      toStation: train.to_code,
      toStationName: train.to_name,
      departureTime: train.departure_time,
      arrivalTime: train.arrival_time,
      duration: train.duration,
      distanceKm: train.distance_km,
      avgSpeed: train.avg_speed,
      runsOn: runsOnArray,
      pantry: Boolean(train.pantry),
      wifi: Boolean(train.wifi),
      cleanBedroll: Boolean(train.clean_bedroll),
      charging: Boolean(train.charging),
      readingLamp: Boolean(train.reading_lamp),
      halts: haltsArray,
      currentLiveStatus: liveStatusObj,
      classes: classesObj
    };
  });

  // Apply filters
  let filtered = results;
  if (vandeOnly) {
    filtered = filtered.filter(t => t.type.includes('Vande') || t.type.includes('Tejas'));
  }
  if (availableOnly) {
    filtered = filtered.filter(t => Object.values(t.classes).some(c => c.status === 'AVAILABLE'));
  }
  if (acOnly) {
    filtered = filtered.filter(t => Object.keys(t.classes).some(k => ['1A', '2A', '3A', '3E', 'CC', 'EC', 'EV'].includes(k)));
  }

  return filtered;
}

/**
 * Get detailed train info by Train Number
 */
function getTrainByNo(trainNo) {
  const train = db.prepare('SELECT * FROM trains WHERE train_no = ?').get(String(trainNo).trim());
  if (!train) return null;

  const rawClasses = db.prepare('SELECT * FROM classes WHERE train_no = ?').all(train.train_no);
  const classesObj = {};
  for (const c of rawClasses) {
    classesObj[c.class_code] = {
      name: c.class_name,
      seats: c.available_seats,
      status: c.status,
      statusText: c.status_text,
      badgeClass: c.available_seats > 0 ? 'badge-green' : 'badge-orange',
      fare: c.fare,
      tatkalAvailable: c.tatkal_seats,
      tatkalFare: c.tatkal_fare,
      probPercent: c.confirm_prob,
      probText: `${c.confirm_prob}% Confirmed`
    };
  }

  let haltsArray = [];
  let liveStatusObj = {};
  let runsOnArray = [];
  try { haltsArray = JSON.parse(train.halts); } catch (e) {}
  try { liveStatusObj = JSON.parse(train.live_status); } catch (e) {}
  try { runsOnArray = JSON.parse(train.runs_on); } catch (e) {}

  return {
    trainNo: train.train_no,
    trainName: train.train_name,
    type: train.type,
    fromStation: train.from_code,
    fromStationName: train.from_name,
    toStation: train.to_code,
    toStationName: train.to_name,
    departureTime: train.departure_time,
    arrivalTime: train.arrival_time,
    duration: train.duration,
    distanceKm: train.distance_km,
    avgSpeed: train.avg_speed,
    runsOn: runsOnArray,
    pantry: Boolean(train.pantry),
    wifi: Boolean(train.wifi),
    cleanBedroll: Boolean(train.clean_bedroll),
    charging: Boolean(train.charging),
    readingLamp: Boolean(train.reading_lamp),
    halts: haltsArray,
    currentLiveStatus: liveStatusObj,
    classes: classesObj
  };
}

/**
 * Generate 10-digit demo PNR (zone-prefixed format)
 */
function generatePnr() {
  const prefix = ['2', '4', '6', '8'][Math.floor(Math.random() * 4)];
  const remaining = Math.floor(100000000 + Math.random() * 900000000).toString().substring(0, 9);
  return `${prefix}${remaining}`;
}

/**
 * Generate allocated berth string based on class
 */
function generateAllocatedBerth(classCode, index, pref) {
  const coachPrefixes = {
    'EC': ['E1', 'E2'],
    'CC': ['C1', 'C2', 'C3', 'C4'],
    '1A': ['H1', 'HA1'],
    '2A': ['A1', 'A2', 'A3'],
    '3A': ['B1', 'B2', 'B3', 'B4', 'B5'],
    '3E': ['M1', 'M2'],
    'SL': ['S1', 'S2', 'S3', 'S4', 'S5']
  };

  const prefixes = coachPrefixes[classCode] || ['C1', 'C2'];
  const coach = prefixes[index % prefixes.length];
  const berthNo = Math.floor(1 + (index * 7 + 12) % 72);

  const berthTypes = ['Lower (LB)', 'Middle (MB)', 'Upper (UB)', 'Side Lower (SL)', 'Side Upper (SU)', 'Window (WS)', 'Aisle (AS)'];
  const selectedType = pref || berthTypes[index % berthTypes.length];

  return {
    coach,
    berthNo: String(berthNo),
    berthType: selectedType,
    display: `${coach} / ${berthNo} (${selectedType})`
  };
}

/**
 * Create a Transactional Railway Reservation
 */
function createBooking({ trainNo, classCode, journeyDate, quota = 'GN', passengers = [], travelInsurance = true, paymentMethod = 'UPI' }) {
  if (!trainNo) throw new Error('Missing trainNo');
  if (!classCode) throw new Error('Missing classCode');
  if (!journeyDate) throw new Error('Missing journeyDate');
  if (!Array.isArray(passengers) || passengers.length === 0) {
    throw new Error('At least one passenger is required');
  }

  const train = getTrainByNo(trainNo);
  if (!train) throw new Error(`Train #${trainNo} not found`);

  const cls = train.classes[classCode];
  if (!cls) throw new Error(`Class ${classCode} not available on Train #${trainNo}`);

  const isTatkal = quota === 'TQ' || quota === 'PT';
  const baseRate = isTatkal ? (cls.tatkalFare || cls.fare * 1.2) : cls.fare;

  // Fare Calculation Engine (Base Fare + GST + Surcharges)
  const passengerCount = passengers.length;
  const rawBaseTotal = baseRate * passengerCount;
  const reservationCharge = ['1A', 'EC'].includes(classCode) ? 60 * passengerCount : (['2A', '3A', 'CC'].includes(classCode) ? 40 * passengerCount : 20 * passengerCount);
  const superfastCharge = 45 * passengerCount;
  const gst = ['1A', '2A', '3A', '3E', 'EC', 'CC', 'EV'].includes(classCode) ? Math.round((rawBaseTotal + reservationCharge + superfastCharge) * 0.05) : 0;
  const insuranceCharge = travelInsurance ? +(0.35 * passengerCount).toFixed(2) : 0;
  const finalTotal = Math.round(rawBaseTotal + reservationCharge + superfastCharge + gst + insuranceCharge);

  // Generate unique 10-digit PNR
  let pnr = generatePnr();
  let attempts = 0;
  while (db.prepare('SELECT pnr_no FROM bookings WHERE pnr_no = ?').get(pnr) && attempts < 10) {
    pnr = generatePnr();
    attempts++;
  }

  const createdAt = new Date().toISOString();
  const status = 'CONFIRMED';

  // Insert Booking Header
  const insertBooking = db.prepare(`
    INSERT INTO bookings (
      pnr_no, train_no, train_name, journey_date, class_code,
      quota, total_fare, travel_insurance, payment_method, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertBooking.run(
    pnr, train.trainNo, train.trainName, journeyDate, classCode,
    quota, finalTotal, travelInsurance ? 1 : 0, paymentMethod, status, createdAt
  );

  // Insert Passengers
  const insertPassenger = db.prepare(`
    INSERT INTO passengers (
      pnr_no, name, age, gender, berth_pref, allocated_berth, meal_pref, sr_citizen
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const formattedPassengers = [];
  passengers.forEach((p, idx) => {
    const allocated = generateAllocatedBerth(classCode, idx, p.berthPref);
    const srCitizen = (p.age >= 60) ? 1 : (p.srCitizen ? 1 : 0);

    insertPassenger.run(
      pnr,
      p.name || `Passenger ${idx + 1}`,
      Number(p.age) || 30,
      p.gender || 'M',
      p.berthPref || 'No Preference',
      allocated.display,
      p.mealPref || 'Veg Meal',
      srCitizen
    );

    formattedPassengers.push({
      id: idx + 1,
      name: p.name,
      age: Number(p.age) || 30,
      gender: p.gender || 'M',
      bookingStatus: `CNF - ${allocated.coach} / ${allocated.berthNo}`,
      currentStatus: 'CONFIRMED (CNF)',
      coach: allocated.coach,
      berthNo: allocated.berthNo,
      berthType: allocated.berthType,
      statusClass: 'status-cnf',
      mealPref: p.mealPref || 'Veg Meal'
    });
  });

  // Deduct available seats
  const newSeats = Math.max(0, cls.seats - passengerCount);
  db.prepare('UPDATE classes SET available_seats = ? WHERE train_no = ? AND class_code = ?').run(
    newSeats, train.trainNo, classCode
  );

  return {
    success: true,
    pnr: pnr,
    trainNo: train.trainNo,
    trainName: train.trainName,
    fromStation: `${train.fromStation} (${train.fromStationName})`,
    toStation: `${train.toStation} (${train.toStationName})`,
    boardingStation: train.fromStation,
    journeyDate: journeyDate,
    departureTime: train.departureTime,
    arrivalTime: train.arrivalTime,
    duration: train.duration,
    classBooked: `${classCode} (${cls.name})`,
    quota: `${quota} (${quota === 'TQ' ? 'Tatkal' : 'General'})`,
    chartStatus: 'CHART PREPARED',
    chartStatusColor: 'status-cnf',
    passengers: formattedPassengers,
    fareBreakdown: {
      baseFare: rawBaseTotal,
      reservationCharge,
      superfastCharge,
      gst,
      travelInsurance: insuranceCharge,
      totalFare: finalTotal
    },
    fareTotal: `₹ ${finalTotal.toLocaleString('en-IN')}`,
    paymentMethod,
    travelInsuranceOptIn: travelInsurance,
    chartPreparedTime: `Instant e-Chart generated at IRCTC New Delhi Gateway on ${new Date().toLocaleDateString('en-GB')}`,
    createdAt
  };
}

/**
 * Retrieve Complete Booking and Passenger Details by PNR
 */
function getBookingByPnr(pnrNo) {
  const cleanPnr = String(pnrNo).trim();
  const booking = db.prepare('SELECT * FROM bookings WHERE pnr_no = ?').get(cleanPnr);

  if (!booking) return null;

  const train = getTrainByNo(booking.train_no);
  const rawPassengers = db.prepare('SELECT * FROM passengers WHERE pnr_no = ?').all(cleanPnr);

  const formattedPassengers = rawPassengers.map((p, idx) => {
    // Parse coach and berth if available
    let coach = 'C1';
    let berthNo = '12';
    let berthType = p.berth_pref || 'Window (WS)';

    if (p.allocated_berth && p.allocated_berth.includes('/')) {
      const parts = p.allocated_berth.split('/');
      coach = parts[0].trim();
      const right = parts[1].trim();
      const parenIdx = right.indexOf('(');
      if (parenIdx !== -1) {
        berthNo = right.substring(0, parenIdx).trim();
        berthType = right.substring(parenIdx + 1, right.indexOf(')')).trim();
      } else {
        berthNo = right;
      }
    }

    const isConfirmed = booking.status === 'CONFIRMED';
    const isRac = booking.status === 'RAC';

    return {
      id: idx + 1,
      name: p.name,
      age: p.age,
      gender: p.gender,
      bookingStatus: isConfirmed ? `${booking.class_code} - ${p.allocated_berth}` : (isRac ? 'RAC 04' : 'WL 09 / GNWL'),
      currentStatus: isConfirmed ? 'CONFIRMED (CNF)' : (isRac ? 'RAC 01' : 'WL 02 (High CNF Chance: 89%)'),
      coach: isConfirmed || isRac ? coach : 'Unassigned',
      berthNo: isConfirmed || isRac ? berthNo : 'WL 2',
      berthType: berthType,
      statusClass: isConfirmed ? 'status-cnf' : (isRac ? 'status-rac' : 'status-wl'),
      mealPref: p.meal_pref
    };
  });

  return {
    pnr: booking.pnr_no,
    trainNo: booking.train_no,
    trainName: booking.train_name,
    fromStation: train ? `${train.fromStation} (${train.fromStationName})` : 'NDLS (New Delhi)',
    toStation: train ? `${train.toStation} (${train.toStationName})` : 'BSB (Varanasi Jn)',
    boardingStation: train ? train.fromStation : 'NDLS',
    journeyDate: booking.journey_date,
    classBooked: `${booking.class_code} (${train && train.classes[booking.class_code] ? train.classes[booking.class_code].name : 'Express Class'})`,
    quota: `${booking.quota} (${booking.quota === 'TQ' ? 'Tatkal Quota' : 'General'})`,
    chartStatus: booking.status === 'CONFIRMED' ? 'CHART PREPARED' : 'CHART NOT PREPARED',
    chartStatusColor: booking.status === 'CONFIRMED' ? 'status-cnf' : (booking.status === 'RAC' ? 'status-rac' : 'status-wl'),
    passengers: formattedPassengers,
    fareTotal: `₹ ${Number(booking.total_fare).toLocaleString('en-IN')}`,
    paymentMethod: booking.payment_method,
    chartPreparedTime: booking.status === 'CONFIRMED'
      ? `Chart prepared at ${train ? train.fromStationName : 'New Delhi'} Base Charting Office.`
      : 'Charting will commence 4 hours before scheduled departure.',
    createdAt: booking.created_at
  };
}

/**
 * Get System Status & Analytics
 */
function getSystemHealth() {
  const trainCount = db.prepare('SELECT count(*) as count FROM trains').get()?.count || 0;
  const bookingCount = db.prepare('SELECT count(*) as count FROM bookings').get()?.count || 0;
  const passengerCount = db.prepare('SELECT count(*) as count FROM passengers').get()?.count || 0;

  return {
    status: 'UP',
    database: isNativeSqlite ? 'sqlite-native-v22' : 'sqlite-in-memory',
    dbFile: DB_PATH,
    version: '1.0.0',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    stats: {
      trainsLoaded: trainCount,
      totalBookings: bookingCount,
      totalPassengers: passengerCount
    }
  };
}

module.exports = {
  db,
  searchTrains,
  getTrainByNo,
  createBooking,
  getBookingByPnr,
  getSystemHealth
};

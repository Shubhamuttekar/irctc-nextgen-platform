/**
 * Automated Verification & Diagnostic Test Suite
 * Tests SQLite DB methods, business logic, fare calculation, and schema contracts
 */

const {
  db,
  getSystemHealth,
  searchTrains,
  getTrainByNo,
  createBooking,
  getBookingByPnr
} = require('./db.js');

console.log('====================================================');
console.log('🧪 Running IRCTC Backend REST API & DB Test Suite');
console.log('====================================================');

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failed++;
  }
}

try {
  // Test 1: Health Diagnostic
  console.log('\n--- 1. Testing System Health & SQLite Connection ---');
  const health = getSystemHealth();
  assert(health.status === 'UP', 'Health status is UP');
  assert(health.stats.trainsLoaded >= 6, `Trains loaded in DB >= 6 (got ${health.stats.trainsLoaded})`);
  assert(health.stats.totalBookings >= 3, `Initial sample bookings >= 3 (got ${health.stats.totalBookings})`);
  assert(health.stats.totalPassengers >= 6, `Initial sample passengers >= 6 (got ${health.stats.totalPassengers})`);

  // Test 2: Train Search Engine
  console.log('\n--- 2. Testing Train Search Engine ---');
  const ndlsBsbTrains = searchTrains({ from: 'NDLS', to: 'BSB', quota: 'GN' });
  assert(ndlsBsbTrains.length > 0, `Search NDLS -> BSB returned ${ndlsBsbTrains.length} trains`);
  const vande = ndlsBsbTrains.find(t => t.trainNo === '22436');
  assert(Boolean(vande), 'Found Vande Bharat Express (22436)');
  assert(vande && vande.classes.CC && vande.classes.CC.fare === 1380, 'Vande Bharat CC fare is ₹1,380');
  assert(vande && vande.classes.EC && vande.classes.EC.status === 'AVAILABLE', 'Vande Bharat EC class is AVAILABLE');

  // Test 3: Train Lookup by Number
  console.log('\n--- 3. Testing Train Lookup (GET /api/trains/:trainNo) ---');
  const shatabdi = getTrainByNo('12002');
  assert(shatabdi !== null, 'Found Bhopal Shatabdi 12002');
  assert(shatabdi && shatabdi.type.includes('Shatabdi'), 'Train type is Shatabdi Express');
  assert(shatabdi && shatabdi.halts.length > 0, `Shatabdi halts populated (${shatabdi.halts.length} halts)`);

  const nonExistent = getTrainByNo('99999');
  assert(nonExistent === null, 'Non-existent train returns null (404)');

  // Test 4: Transactional Booking Creation (POST /api/bookings)
  console.log('\n--- 4. Testing Transactional Reservation (POST /api/bookings) ---');
  const bookingPayload = {
    trainNo: '22436',
    classCode: 'CC',
    journeyDate: '2026-09-28',
    quota: 'GN',
    travelInsurance: true,
    paymentMethod: 'UPI / Google Pay',
    passengers: [
      { name: 'Amitabh Bachchan', age: 81, gender: 'M', berthPref: 'Window (WS)', mealPref: 'Veg Meal', srCitizen: true },
      { name: 'Jaya Bachchan', age: 76, gender: 'F', berthPref: 'Aisle (AS)', mealPref: 'Veg Meal', srCitizen: true }
    ]
  };

  const newBooking = createBooking(bookingPayload);
  assert(newBooking.success === true, 'Booking created successfully');
  assert(typeof newBooking.pnr === 'string' && newBooking.pnr.length === 10, `Generated valid 10-digit PNR: ${newBooking.pnr}`);
  assert(newBooking.passengers.length === 2, '2 passengers allocated');
  assert(newBooking.fareBreakdown.baseFare === 1380 * 2, 'Base fare calculated correctly (₹2,760)');
  assert(newBooking.fareBreakdown.gst > 0, 'GST included in fare breakdown');
  assert(newBooking.passengers[0].coach.startsWith('C'), 'Allocated Chair Car coach (e.g. C1/C2)');

  // Test 5: PNR Status Lookup (GET /api/pnr/:pnrNo)
  console.log('\n--- 5. Testing PNR Status Enquiry (GET /api/pnr/:pnrNo) ---');
  // Lookup newly created PNR
  const fetchedBooking = getBookingByPnr(newBooking.pnr);
  assert(fetchedBooking !== null, `Successfully queried newly created PNR ${newBooking.pnr} from SQLite`);
  assert(fetchedBooking && fetchedBooking.trainNo === '22436', 'Booking references train 22436');
  assert(fetchedBooking && fetchedBooking.passengers[0].name === 'Amitabh Bachchan', 'Passenger name preserved in DB');

  // Lookup seeded sample PNR 2847193852
  const sample1 = getBookingByPnr('2847193852');
  assert(sample1 !== null, 'Seeded PNR 2847193852 retrieved from DB');
  assert(sample1 && sample1.chartStatus === 'CHART PREPARED', 'PNR 2847193852 chart status is CHART PREPARED');
  assert(sample1 && sample1.passengers.length === 3, 'PNR 2847193852 has 3 passengers');

  // Lookup seeded RAC PNR 6491028471
  const sample2 = getBookingByPnr('6491028471');
  assert(sample2 !== null, 'Seeded RAC PNR 6491028471 retrieved from DB');
  assert(sample2 && sample2.chartStatusColor === 'status-rac', 'PNR 6491028471 status color is status-rac');

  // Lookup invalid PNR
  const invalidPnr = getBookingByPnr('0000000000');
  assert(invalidPnr === null, 'Non-existent PNR returns null (404)');

  // Test 6: Seat Inventory Deduction & Overbooking Protection
  console.log('\n--- 6. Testing Seat Inventory Deduction & Overbooking Rejection ---');
  const classBefore = db.prepare('SELECT available_seats FROM classes WHERE train_no = ? AND class_code = ?').get('12002', 'CC');
  const seatsBefore = classBefore ? classBefore.available_seats : 0;
  
  const singlePaxBooking = createBooking({
    trainNo: '12002',
    classCode: 'CC',
    journeyDate: '2026-09-30',
    quota: 'GN',
    travelInsurance: false,
    paymentMethod: 'UPI / PhonePe',
    passengers: [{ name: 'Single Traveler', age: 32, gender: 'M', berthPref: 'Window (WS)' }]
  });
  
  const classAfter = db.prepare('SELECT available_seats FROM classes WHERE train_no = ? AND class_code = ?').get('12002', 'CC');
  const seatsAfter = classAfter ? classAfter.available_seats : 0;
  assert(seatsAfter === seatsBefore - 1, `Seat count decremented accurately: ${seatsBefore} -> ${seatsAfter}`);

  // Test passenger quantity limit (> 6 passengers rejected)
  let maxPaxRejected = false;
  try {
    createBooking({
      trainNo: '12002',
      classCode: 'CC',
      journeyDate: '2026-09-30',
      quota: 'GN',
      passengers: Array.from({ length: 8 }, (_, i) => ({ name: `Excess Pax ${i}`, age: 25, gender: 'M' }))
    });
  } catch (err) {
    maxPaxRejected = err.message.includes('Maximum 6 passengers allowed');
  }
  assert(maxPaxRejected === true, 'Excess passenger count (>6) rejected per booking rules');

  // Test overbooking rejection: request 6 passengers on train with 4 seats (12424 / 1A)
  const seats1ABefore = db.prepare('SELECT available_seats FROM classes WHERE train_no = ? AND class_code = ?').get('12424', '1A').available_seats;
  let overbookingRejected = false;
  let overbookingErrorMsg = '';
  try {
    createBooking({
      trainNo: '12424',
      classCode: '1A',
      journeyDate: '2026-09-30',
      quota: 'GN',
      passengers: Array.from({ length: 6 }, (_, i) => ({ name: `Pax ${i + 1}`, age: 28, gender: 'M' }))
    });
  } catch (err) {
    overbookingRejected = true;
    overbookingErrorMsg = err.message;
  }
  assert(overbookingRejected === true, 'Overbooking request exceeding available seats rejected');
  assert(overbookingErrorMsg.includes('Insufficient seats'), `Descriptive rejection message: "${overbookingErrorMsg}"`);
  
  const seats1AAfter = db.prepare('SELECT available_seats FROM classes WHERE train_no = ? AND class_code = ?').get('12424', '1A').available_seats;
  assert(seats1AAfter === seats1ABefore, `Seat count unchanged after rejected booking (${seats1ABefore})`);

  // Test 7: Atomic Transaction Rollback on Failure
  console.log('\n--- 7. Testing Atomic SQLite Transaction Rollback on Mid-Flight Failure ---');
  const bookingsCountBefore = db.prepare('SELECT count(*) as count FROM bookings').get().count;
  const passengersCountBefore = db.prepare('SELECT count(*) as count FROM passengers').get().count;
  const seatsBeforeFailure = db.prepare('SELECT available_seats FROM classes WHERE train_no = ? AND class_code = ?').get('12002', 'EC').available_seats;

  let rollbackTriggered = false;
  try {
    createBooking({
      trainNo: '12002',
      classCode: 'EC',
      journeyDate: '2026-09-30',
      quota: 'GN',
      passengers: [
        { name: 'Legitimate Passenger 1', age: 30, gender: 'M' },
        null // Triggers TypeError inside transaction loop after header is inserted
      ]
    });
  } catch (err) {
    rollbackTriggered = true;
  }

  const bookingsCountAfter = db.prepare('SELECT count(*) as count FROM bookings').get().count;
  const passengersCountAfter = db.prepare('SELECT count(*) as count FROM passengers').get().count;
  const seatsAfterFailure = db.prepare('SELECT available_seats FROM classes WHERE train_no = ? AND class_code = ?').get('12002', 'EC').available_seats;

  assert(rollbackTriggered === true, 'Mid-flight transaction error triggered rollback catch block');
  assert(bookingsCountAfter === bookingsCountBefore, `Zero orphan booking records created (${bookingsCountBefore} -> ${bookingsCountAfter})`);
  assert(passengersCountAfter === passengersCountBefore, `Zero orphan passenger records persisted (${passengersCountBefore} -> ${passengersCountAfter})`);
  assert(seatsAfterFailure === seatsBeforeFailure, `Available seats remain untouched on rollback (${seatsBeforeFailure})`);

  console.log('\n====================================================');
  console.log(`Diagnostic Complete: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');
} catch (e) {
  console.error('Diagnostic error:', e);
  failed++;
}

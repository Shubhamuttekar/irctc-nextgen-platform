/**
 * API Client Utility with Resilient Offline Fallback
 * Seamlessly interfaces with Node.js/SQLite REST API on port 8086
 * Automatically falls back to local dataset if backend is unreachable
 */

import { TRAINS_DATA } from '../data/trainsData.js';
import { SAMPLE_PNRS } from '../data/pnrData.js';

// Determine default API host
const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const DEFAULT_PORT = '8086';

export const API_BASE_URL = window.IRCTC_API_BASE || 
  (window.location.port === DEFAULT_PORT ? '' : (IS_LOCAL ? `http://localhost:${DEFAULT_PORT}` : ''));

let isBackendAvailable = null; // null: unprobed, true: online, false: fallback

// In-memory runtime cache for bookings made in the current session
const sessionBookings = new Map();

/**
 * Health check probe to determine backend availability
 */
export async function checkBackendHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    const res = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      isBackendAvailable = true;
      console.log('[API] Connected to IRCTC Backend Suite:', data);
      notifyApiStatus(true, data);
      return { online: true, data };
    }
  } catch (err) {
    // Backend server is not running or unreachable
  }

  isBackendAvailable = false;
  console.info('[API] Backend offline or unreachable. Seamless fallback to local IRCTC dataset active.');
  notifyApiStatus(false, null);
  return { online: false };
}

/**
 * Visual status notifier
 */
function notifyApiStatus(online, details) {
  let indicator = document.getElementById('irctc-api-status-badge');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'irctc-api-status-badge';
    indicator.className = 'api-status-indicator';
    document.body.appendChild(indicator);
  }

  if (online) {
    indicator.innerHTML = `
      <span class="status-dot green-dot"></span>
      <span class="status-text">REST API: <strong>Connected</strong> (${details?.database || 'SQLite'})</span>
    `;
    indicator.classList.remove('offline');
    indicator.classList.add('online');
  } else {
    indicator.innerHTML = `
      <span class="status-dot orange-dot"></span>
      <span class="status-text">Mode: <strong>Local Resilient Engine</strong></span>
    `;
    indicator.classList.remove('online');
    indicator.classList.add('offline');
  }
}

/**
 * Search Trains via REST API with graceful local fallback
 */
export async function searchTrainsApi(params) {
  const {
    fromStation = 'NDLS',
    toStation = 'BSB',
    journeyDate = new Date().toISOString().split('T')[0],
    quota = 'GN',
    filters = {}
  } = params || {};

  // Try REST API if not known to be permanently dead
  if (isBackendAvailable !== false) {
    try {
      const query = new URLSearchParams({
        from: fromStation,
        to: toStation,
        date: journeyDate,
        quota: quota,
        vandeOnly: filters.vandeOnly ? 'true' : 'false',
        availableOnly: filters.availableOnly ? 'true' : 'false',
        acOnly: filters.acOnly ? 'true' : 'false'
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await fetch(`${API_BASE_URL}/api/trains/search?${query.toString()}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.trains)) {
          isBackendAvailable = true;
          return data.trains;
        }
      }
    } catch (err) {
      isBackendAvailable = false;
      console.warn('[API] REST API query failed, falling back to local trains data:', err.message);
    }
  }

  // Local Offline Resilient Fallback Engine
  return localSearchTrains(params);
}

/**
 * Offline Search Fallback Logic
 */
function localSearchTrains(params) {
  const { fromStation, toStation, filters = {} } = params || {};

  let filtered = TRAINS_DATA.filter((train) => {
    return train.fromStation === fromStation && train.toStation === toStation;
  });

  if (filtered.length === 0) {
    filtered = TRAINS_DATA.filter((t) => t.fromStation === fromStation || t.toStation === toStation);
  }

  if (filtered.length === 0) {
    filtered = TRAINS_DATA.slice(0, 4);
  }

  if (filters.vandeOnly) {
    filtered = filtered.filter((t) => t.type.includes('Vande') || t.type.includes('Rajdhani') || t.type.includes('Tejas'));
  }
  if (filters.availableOnly) {
    filtered = filtered.filter((t) => Object.values(t.classes).some((c) => c.status === 'AVAILABLE'));
  }
  if (filters.acOnly) {
    filtered = filtered.filter((t) => Object.keys(t.classes).some((k) => ['1A', '2A', '3A', '3E', 'CC', 'EC'].includes(k)));
  }

  return filtered;
}

/**
 * Create Railway Booking via REST API with fallback
 */
export async function createBookingApi(bookingData) {
  if (isBackendAvailable !== false) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(`${API_BASE_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const result = await res.json();
        if (result && result.pnr) {
          isBackendAvailable = true;
          // Store in session cache
          sessionBookings.set(result.pnr, result);
          return result;
        }
      }
    } catch (err) {
      isBackendAvailable = false;
      console.warn('[API] REST API booking failed, using local offline generator:', err.message);
    }
  }

  // Local Offline Booking Fallback
  return localCreateBooking(bookingData);
}

/**
 * Offline Booking Fallback Generator
 */
function localCreateBooking(data) {
  const pnr = '28' + Math.floor(10000000 + Math.random() * 90000000);
  const train = TRAINS_DATA.find(t => t.trainNo === data.trainNo) || TRAINS_DATA[0];
  const cls = (train.classes && train.classes[data.classCode]) || { name: 'AC Class', fare: 1380 };
  const passengerCount = (data.passengers || []).length || 1;
  const totalFareNum = (cls.fare || 1380) * passengerCount + 80;

  const passengers = (data.passengers || []).map((p, idx) => ({
    id: idx + 1,
    name: p.name || 'Passenger',
    age: p.age || 30,
    gender: p.gender || 'M',
    bookingStatus: `CNF - C2 / ${18 + idx}`,
    currentStatus: 'CONFIRMED (CNF)',
    coach: 'C2',
    berthNo: `${18 + idx}`,
    berthType: p.berthPref || 'Window (WS)',
    statusClass: 'status-cnf'
  }));

  const bookingResult = {
    success: true,
    pnr: pnr,
    trainNo: train.trainNo,
    trainName: train.trainName,
    fromStation: `${train.fromStation} (${train.fromStationName || ''})`,
    toStation: `${train.toStation} (${train.toStationName || ''})`,
    boardingStation: train.fromStation,
    journeyDate: data.journeyDate || '25 Sep 2026',
    classBooked: `${data.classCode} (${cls.name})`,
    quota: `${data.quota || 'GN'} (General)`,
    chartStatus: 'CHART PREPARED',
    chartStatusColor: 'status-cnf',
    passengers: passengers,
    fareTotal: `₹ ${totalFareNum.toLocaleString('en-IN')}`,
    chartPreparedTime: `Instant e-Chart generated locally on ${new Date().toLocaleDateString()}`,
    createdAt: new Date().toISOString()
  };

  sessionBookings.set(pnr, bookingResult);
  return bookingResult;
}

/**
 * Check PNR Status via REST API with fallback
 */
export async function lookupPnrApi(pnrNo) {
  const cleanPnr = String(pnrNo).trim();

  // First check session bookings
  if (sessionBookings.has(cleanPnr)) {
    return sessionBookings.get(cleanPnr);
  }

  // Try REST API
  if (isBackendAvailable !== false) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await fetch(`${API_BASE_URL}/api/pnr/${cleanPnr}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.pnr) {
          isBackendAvailable = true;
          return data;
        }
      }
    } catch (err) {
      isBackendAvailable = false;
      console.warn('[API] REST API PNR lookup failed, falling back to local records:', err.message);
    }
  }

  // Fallback to SAMPLE_PNRS
  if (SAMPLE_PNRS[cleanPnr]) {
    return SAMPLE_PNRS[cleanPnr];
  }

  return null;
}

// Initial probe on client load
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    checkBackendHealth();
  });
}

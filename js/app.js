/**
 * Main Application Orchestrator for IRCTC Redesign
 */

import { TRAINS_DATA } from './data/trainsData.js?v=5.0';
import { searchTrainsApi, checkBackendHealth } from './utils/apiClient.js';
import { TrainAnimation } from './motion/trainAnimation.js?v=5.0';
import { TatkalTimer } from './components/tatkalTimer.js?v=5.0';
import { SearchEngine } from './components/searchEngine.js?v=5.0';
import { AvailabilityMatrix } from './components/availabilityMatrix.js?v=5.0';
import { CoachVisualizer } from './components/coachVisualizer.js?v=5.0';
import { PnrTracker } from './components/pnrTracker.js?v=5.0';
import { LiveTrainTracker } from './components/liveTrainTracker.js?v=5.0';
import { BookingDrawer } from './components/bookingDrawer.js?v=5.0';
import { A11ySuite } from './components/a11ySuite.js?v=5.0';
import { HeaderCapsule } from './components/headerCapsule.js?v=5.0';

class IrctcApp {
  constructor() {
    this.headerCapsule = null;
    this.trainAnimation = null;
    this.tatkalTimer = null;
    this.searchEngine = null;
    this.availabilityMatrix = null;
    this.coachVisualizer = null;
    this.pnrTracker = null;
    this.liveTrainTracker = null;
    this.bookingDrawer = null;
    this.a11ySuite = null;

    this.activeTab = 'book'; // 'book', 'pnr', 'live', 'coach', 'tatkal'
    this.currentSearchParams = {
      fromStation: 'NDLS',
      toStation: 'BSB',
      journeyDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      quota: 'GENERAL',
      filters: { vandeOnly: false, availableOnly: false, acOnly: false }
    };

    this.selectedBerthPreference = null;
  }

  init() {
    // 1. Initialize Accessibility Suite
    this.a11ySuite = new A11ySuite();

    // 2. Initialize Vande Bharat 60fps Motion Graphic Canvas
    const canvas = document.getElementById('vande-bharat-canvas');
    if (canvas) {
      this.trainAnimation = new TrainAnimation(canvas, { defaultSpeed: 'highspeed' });
      this.bindSpeedToggle();
    }

    // 3. Initialize Tatkal Timer Hub
    const tatkalContainer = document.getElementById('tatkal-timer-container');
    if (tatkalContainer) {
      this.tatkalTimer = new TatkalTimer(tatkalContainer);
    }

    // 4. Initialize Coach Visualizer
    const coachContainer = document.getElementById('coach-visualizer-modal-root');
    this.coachVisualizer = new CoachVisualizer(coachContainer, (selectedBerth) => {
      this.selectedBerthPreference = selectedBerth;
      this.showToast(`Berth #${selectedBerth.number} (${selectedBerth.typeLabel}) selected as your preferred seat.`);
      if (this.activeTab === 'coach') {
        this.switchTab('book');
      }
    });

    // 5. Initialize Booking Drawer
    const bookingContainer = document.getElementById('booking-drawer-modal-root');
    this.bookingDrawer = new BookingDrawer(bookingContainer, (bookingResult) => {
      this.showToast(`Ticket Booked Successfully! PNR: ${bookingResult.pnr}`);
      if (this.pnrTracker && this.pnrTracker.addCustomPnr) {
        this.pnrTracker.addCustomPnr(bookingResult.pnr, `${bookingResult.trainNo} - ${bookingResult.classBooked?.split(' ')[0] || 'CNF'}`);
      }
    });

    // 6. Initialize Availability Matrix
    const matrixContainer = document.getElementById('trains-results-container');
    this.availabilityMatrix = new AvailabilityMatrix(
      matrixContainer,
      (train, clsKey, fare, searchParams) => {
        // Book Now Clicked
        this.bookingDrawer.open(train, clsKey, fare, searchParams, this.selectedBerthPreference);
      },
      (train, clsKey) => {
        // View Coach Layout Clicked
        this.coachVisualizer.show(train, clsKey);
      },
      (train) => {
        // Track Live Clicked -> Switch to live tracking tab
        this.switchTab('live');
        if (this.liveTrainTracker) {
          this.liveTrainTracker.setTrain(train.trainNo);
        }
      }
    );

    // 7. Initialize Search Engine
    const searchContainer = document.getElementById('search-engine-container');
    if (searchContainer) {
      this.searchEngine = new SearchEngine(searchContainer, (params) => {
        this.currentSearchParams = params;
        this.executeSearch(params);
      });
    }

    // 8. Initialize PNR Tracker
    const pnrContainer = document.getElementById('pnr-tracker-container');
    if (pnrContainer) {
      this.pnrTracker = new PnrTracker(pnrContainer);
    }

    // 9. Initialize Live Train Tracker
    const liveContainer = document.getElementById('live-tracker-container');
    if (liveContainer) {
      this.liveTrainTracker = new LiveTrainTracker(liveContainer);
    }

    // 10. Initialize Capsule Navigation Bar (HOME | TRAINS | MEALS | LOYALTY | E-WALLET | ALERTS | CONTACT US)
    const capsuleContainer = document.getElementById('capsule-nav-container');
    if (capsuleContainer) {
      this.headerCapsule = new HeaderCapsule(capsuleContainer, {
        onNavigate: (tabName) => {
          this.switchTab(tabName);
        }
      });
    }

    // Refresh translations across all dynamically mounted components
    if (this.a11ySuite) {
      this.a11ySuite.applyLanguage(this.a11ySuite.currentLang);
    }

    // 11. Bind User Login & Helpline Modals
    this.bindUserLogin();
    this.bindHelplineModal();
    this.bindNavTabs();

    // 12. Trigger Initial Search with default parameters
    this.executeSearch(this.currentSearchParams);
  }

  bindHelplineModal() {
    const helplineBtn = document.getElementById('btn-railway-helpline');
    if (helplineBtn) {
      helplineBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.headerCapsule) {
          this.headerCapsule.openInfoModal('RailMadad 139 - 24x7 Integrated Railway Helpline', `
            <div class="info-modal-body">
              <p>Indian Railways single-window <strong>RailMadad Helpline 139</strong> provides 24x7 round-the-clock emergency assistance, enquiry, and grievance redressal in 12 languages across all zones.</p>
              
              <div class="stat-highlight" style="margin: 14px 0;">
                <span><svg class="min-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;margin-right:4px;color:#dc2626;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>Emergency Hotline: 139 (Toll-Free)</span>
                <span><svg class="min-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;margin-right:4px;color:#0284c7;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>Security / RPF: Option 1</span>
                <span><svg class="min-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;margin-right:4px;color:#16a34a;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Medical Aid: Option 2</span>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 14px;">
                <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 8px; padding: 12px;">
                  <strong style="color: #dc2626; display: flex; align-items: center; gap: 6px; font-size: 0.9rem;">
                    <svg class="min-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> Medical Emergency on Train
                  </strong>
                  <p style="font-size: 0.8rem; margin-top: 6px; color: #475569;">
                    Press 2 on Dial 139 or alert TTE. Doctor attended at next station with critical care emergency kits.
                  </p>
                </div>
                <div style="background: rgba(14, 165, 233, 0.08); border: 1px solid rgba(14, 165, 233, 0.25); border-radius: 8px; padding: 12px;">
                  <strong style="color: #0284c7; display: flex; align-items: center; gap: 6px; font-size: 0.9rem;">
                    <svg class="min-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> RPF Passenger Security
                  </strong>
                  <p style="font-size: 0.8rem; margin-top: 6px; color: #475569;">
                    Press 1 on Dial 139 for immediate Railway Protection Force (RPF) and Meri Saheli women safety escort.
                  </p>
                </div>
              </div>

              <ul style="margin-top: 14px; padding-left: 18px; font-size: 0.85rem; color: #334155; line-height: 1.6;">
                <li><strong>SMS Complaint / Request:</strong> Send SMS to <code>139</code> with PNR and issue details for instant automated ticket lodging.</li>
                <li><strong>Yatri Mitra Seva:</strong> Wheelchair & porter assistance for Divyangjan, patients, and senior citizens bookable via 139.</li>
                <li><strong>Online RailMadad:</strong> Visit <em>railmadad.indianrailways.gov.in</em> or download RailMadad App for real-time tracking.</li>
              </ul>
            </div>
          `);
        }
      });
    }
  }

  bindUserLogin() {
    const loginBtn = document.getElementById('btn-user-profile');
    if (loginBtn) {
      loginBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.headerCapsule && this.headerCapsule.openLoginModal) {
          this.headerCapsule.openLoginModal();
        }
      });
    }
  }

  bindSpeedToggle() {
    const toggleBtn = document.getElementById('btn-toggle-train-speed');
    const speedValDisplay = document.getElementById('speed-toggle-val');

    if (toggleBtn && this.trainAnimation) {
      toggleBtn.addEventListener('click', () => {
        const res = this.trainAnimation.toggleSpeed();
        if (speedValDisplay) {
          speedValDisplay.textContent = `${res.speed} KM/H`;
        }
        toggleBtn.classList.toggle('active', res.mode === 'highspeed');
        this.showToast(`Vande Bharat Speed Set to ${res.speed} km/h (${res.mode === 'highspeed' ? 'Full Throttle' : 'Cruising Mode'})`);
      });
    }
  }

  bindNavTabs() {
    const navLinks = document.querySelectorAll('.main-nav-tab');
    navLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = link.dataset.tab;
        this.switchTab(tab);
      });
    });

    // Quick Direct links in hero, tatkal hub, or footer
    document.querySelectorAll('[data-goto-tab]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchTab(btn.dataset.gotoTab);
      });
    });
  }

  switchTab(tabName) {
    this.activeTab = tabName;

    // Update nav active states
    document.querySelectorAll('.main-nav-tab').forEach((link) => {
      const isTarget = link.dataset.tab === tabName;
      link.classList.toggle('active', isTarget);
      link.setAttribute('aria-selected', String(isTarget));
    });

    // Hide/show views
    const viewMap = {
      book: 'view-book-tickets',
      pnr: 'view-pnr-status',
      live: 'view-live-tracking',
      coach: 'view-coach-explorer',
      tatkal: 'view-tatkal-hub'
    };

    Object.entries(viewMap).forEach(([tabKey, elId]) => {
      const el = document.getElementById(elId);
      if (el) {
        if (tabKey === tabName) {
          el.classList.remove('hidden');
          el.classList.add('view-active');
        } else {
          el.classList.add('hidden');
          el.classList.remove('view-active');
        }
      }
    });

    // If switching to coach explorer tab
    if (tabName === 'coach') {
      const dummyTrain = TRAINS_DATA[0];
      this.coachVisualizer.show(dummyTrain, '3A');
    }

    // Scroll smoothly to primary content
    const mainSection = document.getElementById('primary-tab-viewport');
    if (mainSection && tabName !== 'book') {
      mainSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  async executeSearch(params) {
    try {
      const trains = await searchTrainsApi(params);
      if (Array.isArray(trains) && trains.length > 0) {
        this.availabilityMatrix.render(trains, params);
        return;
      }
    } catch (err) {
      console.warn('[App] REST API search error, falling back to local dataset:', err);
    }

    // Local fallback
    let filtered = TRAINS_DATA.filter((train) => {
      const fromMatch = train.fromStation === params.fromStation;
      const toMatch = train.toStation === params.toStation;
      return fromMatch && toMatch;
    });

    if (filtered.length === 0) {
      filtered = TRAINS_DATA.filter((t) => t.fromStation === params.fromStation || t.toStation === params.toStation);
    }

    if (filtered.length === 0) {
      filtered = TRAINS_DATA.slice(0, 4);
    }

    if (params.filters) {
      if (params.filters.vandeOnly) {
        filtered = filtered.filter((t) => t.type.includes('Vande Bharat') || t.type.includes('Rajdhani'));
      }
      if (params.filters.availableOnly) {
        filtered = filtered.filter((t) => {
          return Object.values(t.classes).some((c) => c.status === 'AVAILABLE');
        });
      }
      if (params.filters.acOnly) {
        filtered = filtered.filter((t) => {
          return Object.keys(t.classes).some((k) => ['1A', '2A', '3A', '3E', 'CC', 'EC'].includes(k));
        });
      }
    }

    this.availabilityMatrix.render(filtered, params);
  }

  showToast(message) {
    let toast = document.getElementById('irctc-live-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'irctc-live-toast';
      toast.className = 'irctc-toast-notification';
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add('show');

    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 3800);
  }
}

// Instantiate on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new IrctcApp();
  app.init();
  window.irctcApp = app;
});

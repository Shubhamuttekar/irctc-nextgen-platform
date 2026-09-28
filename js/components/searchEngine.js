import { STATIONS, POPULAR_ROUTES } from '../data/stationsData.js';

export class SearchEngine {
  constructor(containerElement, onSearchCallback) {
    this.container = containerElement;
    this.onSearch = onSearchCallback;
    this.fromStation = 'NDLS';
    this.toStation = 'BSB';
    this.quota = 'GENERAL';
    this.journeyDate = this.getDefaultDate();
    this.isSwapping = false;

    this.init();
  }

  getDefaultDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  init() {
    this.render();
    this.attachEvents();
  }

  render() {
    this.container.innerHTML = `
      <section class="search-widget-card irctc-unified-search-card" aria-label="Book Train Tickets">
        <!-- Popular Routes Quick Selector Strip -->
        <div class="popular-routes-bar" role="region" aria-label="Popular Vande Bharat & Rajdhani Routes">
          <span class="route-label">
            <span class="pulse-spark"><svg class="min-icon" viewBox="0 0 24 24" width="13" height="13" style="color: #ff671f;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></span> <span data-i18n="popular_routes">Popular Routes:</span>
          </span>
          <div class="route-chips-scroll">
            ${POPULAR_ROUTES.map((r) => `
              <button type="button" class="route-chip" data-from="${r.from}" data-to="${r.to}">
                ${r.label}
              </button>
            `).join('')}
          </div>
        </div>

        <form id="train-search-form" class="unified-search-layout" role="search">
          <!-- Main Search Grid (Left ~75%) -->
          <div class="search-main-column">
            <!-- Row 1: From Station, 180° Swap, To Station, Date -->
            <div class="search-row-1">
              <!-- From Station Pill Card -->
              <div class="field-pill-card field-from">
                <label for="from-station-input" class="pill-caption-label" data-i18n="from_station">From</label>
                <div class="pill-input-row">
                  <span class="pill-prefix-icon" aria-hidden="true"><svg class="min-icon" viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="7"/></svg></span>
                  <input 
                    type="text" 
                    id="from-station-input" 
                    class="form-input station-autocomplete" 
                    value="New Delhi (NDLS)" 
                    data-code="NDLS"
                    autocomplete="off"
                    placeholder="Enter Origin Station or City"
                    required
                    aria-haspopup="listbox"
                  />
                </div>
                <div id="from-station-dropdown" class="station-dropdown hidden" role="listbox"></div>
              </div>

              <!-- 180° Station Swap Interactive Button -->
              <button 
                type="button" 
                id="swap-stations-btn" 
                class="station-swap-circle-btn" 
                aria-label="Swap Origin and Destination Stations"
                title="Swap Stations (180°)"
              >
                <svg class="swap-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M7 16V4M7 4L3 8M7 4L11 8M17 8v12m0 0l4-4m-4 4l-4-4"/>
                </svg>
              </button>

              <!-- To Station Pill Card -->
              <div class="field-pill-card field-to">
                <label for="to-station-input" class="pill-caption-label" data-i18n="to_station">To</label>
                <div class="pill-input-row">
                  <span class="pill-prefix-icon" aria-hidden="true"><svg class="min-icon" viewBox="0 0 24 24" width="16" height="16"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></span>
                  <input 
                    type="text" 
                    id="to-station-input" 
                    class="form-input station-autocomplete" 
                    value="Varanasi Jn (BSB)" 
                    data-code="BSB"
                    autocomplete="off"
                    placeholder="Enter Destination Station or City"
                    required
                    aria-haspopup="listbox"
                  />
                </div>
                <div id="to-station-dropdown" class="station-dropdown hidden" role="listbox"></div>
              </div>

              <!-- Journey Date Pill Card -->
              <div class="field-pill-card field-date">
                <label for="journey-date-input" class="pill-caption-label" data-i18n="journey_date">Date</label>
                <div class="pill-input-row">
                  <span class="pill-prefix-icon" aria-hidden="true"><svg class="min-icon" viewBox="0 0 24 24" width="16" height="16"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></span>
                  <input 
                    type="date" 
                    id="journey-date-input" 
                    class="form-input" 
                    value="${this.journeyDate}" 
                    min="${new Date().toISOString().split('T')[0]}"
                    required
                  />
                </div>
                <div class="quick-date-chips">
                  <button type="button" class="quick-date-btn" data-days="0" data-i18n="date_today">Today</button>
                  <button type="button" class="quick-date-btn active" data-days="1" data-i18n="date_tomorrow">Tomorrow</button>
                  <button type="button" class="quick-date-btn" data-days="2" data-i18n="date_2days">In 2 Days</button>
                </div>
              </div>
            </div>

            <!-- Row 2: Quota, Concession, Search Trains CTA -->
            <div class="search-row-2">
              <!-- Quota Pill Card -->
              <div class="field-pill-card field-quota">
                <label for="quota-select" class="pill-caption-label" data-i18n="quota_label">Quota</label>
                <div class="pill-input-row">
                  <span class="pill-prefix-icon" aria-hidden="true"><svg class="min-icon" viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="9"/><polyline points="12 6 12 12 16 14"/></svg></span>
                  <select id="quota-select" class="form-select">
                    <option value="GENERAL" selected>General (GN)</option>
                    <option value="TATKAL">Tatkal (TQ)</option>
                    <option value="PREMIUM_TATKAL">Premium Tatkal (PT)</option>
                    <option value="LADIES">Ladies (LD)</option>
                    <option value="SENIOR_CITIZEN">Senior Citizen (SS)</option>
                    <option value="DIVYANGJAN">Divyangjan / Concession</option>
                  </select>
                  <span class="pill-caret" aria-hidden="true">⌄</span>
                </div>
              </div>

              <!-- Concession Pill Card -->
              <div class="field-pill-card field-concession">
                <label for="concession-select" class="pill-caption-label">Concession</label>
                <div class="pill-input-row">
                  <span class="pill-prefix-icon" aria-hidden="true"><svg class="min-icon" viewBox="0 0 24 24" width="16" height="16"><circle cx="6" cy="12" r="4"/><circle cx="18" cy="12" r="4"/><line x1="10" y1="12" x2="14" y2="12"/></svg></span>
                  <select id="concession-select" class="form-select">
                    <option value="NONE" selected>None / General Passenger</option>
                    <option value="DIVYANGJAN">Divyangjan Concession Card</option>
                    <option value="STUDENT">Student Pass / Concession</option>
                    <option value="DOCTOR">Allopathic Doctor (10% Concession)</option>
                  </select>
                  <span class="pill-caret" aria-hidden="true">⌄</span>
                </div>
              </div>

              <!-- Search Trains Primary CTA Button -->
              <button type="submit" id="search-trains-submit" class="btn-search-trains-primary">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <span data-i18n="find_trains">Search Trains</span>
              </button>
            </div>
          </div>

          <!-- Vertical Hairline Accent Divider -->
          <div class="search-vertical-divider" role="presentation"></div>

          <!-- Quick Utilities Column (Right ~25%) -->
          <div class="quick-utilities-column">
            <button type="button" class="utility-action-card" id="btn-quick-pnr" aria-label="Check PNR Status">
              <div class="u-icon-box"><svg class="min-icon" viewBox="0 0 24 24" width="20" height="20"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><line x1="13" y1="5" x2="13" y2="19" stroke-dasharray="2 2"/></svg></div>
              <div class="u-text-box">
                <strong class="u-title">Check PNR Status</strong>
                <span class="u-subtitle">Instant chart &amp; berth status</span>
              </div>
              <span class="u-arrow" aria-hidden="true"><svg class="min-icon" viewBox="0 0 24 24" width="16" height="16"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></span>
            </button>

            <button type="button" class="utility-action-card" id="btn-quick-live" aria-label="Track Your Train">
              <div class="u-icon-box"><svg class="min-icon" viewBox="0 0 24 24" width="20" height="20"><rect x="4" y="3" width="16" height="15" rx="3"/><line x1="4" y1="11" x2="20" y2="11"/><line x1="8" y1="15" x2="8.01" y2="15"/><line x1="16" y1="15" x2="16.01" y2="15"/><path d="m5 18-2 3M19 18l2 3"/></svg></div>
              <div class="u-text-box">
                <strong class="u-title">Track Your Train</strong>
                <span class="u-subtitle">Live GPS &amp; NTES telemetry</span>
              </div>
              <span class="u-arrow" aria-hidden="true"><svg class="min-icon" viewBox="0 0 24 24" width="16" height="16"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></span>
            </button>
          </div>
        </form>

        <!-- Search Filter Checkmarks Strip -->
        <div class="search-addons-bar search-filter-checkmarks-row">
          <label class="custom-checkbox">
            <input type="checkbox" id="chk-vande-bharat" />
            <span class="checkbox-indicator"></span>
            <span class="checkbox-text" data-i18n="filter_vande">Vande Bharat / Tejas Trains Only</span>
          </label>
          <label class="custom-checkbox">
            <input type="checkbox" id="chk-available-only" />
            <span class="checkbox-indicator"></span>
            <span class="checkbox-text" data-i18n="filter_confirmed">Confirmed Berths Only</span>
          </label>
          <label class="custom-checkbox">
            <input type="checkbox" id="chk-ac-only" />
            <span class="checkbox-indicator"></span>
            <span class="checkbox-text" data-i18n="filter_ac">AC Coaches Only (1A, 2A, 3A, CC)</span>
          </label>
        </div>
      </section>
    `;
  }

  attachEvents() {
    const form = document.getElementById('train-search-form');
    const swapBtn = document.getElementById('swap-stations-btn');
    const fromInput = document.getElementById('from-station-input');
    const toInput = document.getElementById('to-station-input');
    const fromDropdown = document.getElementById('from-station-dropdown');
    const toDropdown = document.getElementById('to-station-dropdown');
    const dateInput = document.getElementById('journey-date-input');
    const quotaSelect = document.getElementById('quota-select');
    const concessionSelect = document.getElementById('concession-select');
    const quickPnrBtn = document.getElementById('btn-quick-pnr');
    const quickLiveBtn = document.getElementById('btn-quick-live');

    // 180° Station Swap Micro-Interaction
    if (swapBtn && fromInput && toInput) {
      swapBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.isSwapping = !this.isSwapping;
        swapBtn.classList.toggle('rotated', this.isSwapping);

        const tempVal = fromInput.value;
        const tempCode = fromInput.dataset.code;

        fromInput.value = toInput.value;
        fromInput.dataset.code = toInput.dataset.code;

        toInput.value = tempVal;
        toInput.dataset.code = tempCode;

        this.fromStation = fromInput.dataset.code;
        this.toStation = toInput.dataset.code;

        this.triggerSearch();
      });
    }

    // Setup autocomplete for From & To
    if (fromInput && fromDropdown) this.setupAutocomplete(fromInput, fromDropdown);
    if (toInput && toDropdown) this.setupAutocomplete(toInput, toDropdown);

    // Quick Utility Actions
    if (quickPnrBtn) {
      quickPnrBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.irctcApp && window.irctcApp.switchTab) {
          window.irctcApp.switchTab('pnr');
        }
      });
    }

    if (quickLiveBtn) {
      quickLiveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.irctcApp && window.irctcApp.switchTab) {
          window.irctcApp.switchTab('live');
        }
      });
    }

    // Popular Route Chips
    const chips = this.container.querySelectorAll('.route-chip');
    chips.forEach((chip) => {
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        chips.forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');

        const fromCode = chip.dataset.from;
        const toCode = chip.dataset.to;

        const fromStn = STATIONS.find((s) => s.code === fromCode);
        const toStn = STATIONS.find((s) => s.code === toCode);

        if (fromStn && toStn) {
          fromInput.value = `${fromStn.name} (${fromStn.code})`;
          fromInput.dataset.code = fromStn.code;

          toInput.value = `${toStn.name} (${toStn.code})`;
          toInput.dataset.code = toStn.code;

          this.fromStation = fromStn.code;
          this.toStation = toStn.code;

          this.triggerSearch();
        }
      });
    });

    // Quick Date Chips
    const dateBtns = this.container.querySelectorAll('.quick-date-btn');
    dateBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        dateBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const daysAdd = parseInt(btn.dataset.days, 10);
        const target = new Date();
        target.setDate(target.getDate() + daysAdd);
        const iso = target.toISOString().split('T')[0];
        dateInput.value = iso;
        this.journeyDate = iso;
        this.triggerSearch();
      });
    });

    // Form Submit
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.fromStation = fromInput.dataset.code || 'NDLS';
        this.toStation = toInput.dataset.code || 'BSB';
        this.journeyDate = dateInput.value;
        this.quota = quotaSelect.value;
        this.triggerSearch();
      });
    }

    // Filter toggles
    ['chk-vande-bharat', 'chk-available-only', 'chk-ac-only'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', () => this.triggerSearch());
      }
    });
  }

  setupAutocomplete(inputEl, dropdownEl) {
    inputEl.addEventListener('input', () => {
      const q = inputEl.value.trim().toLowerCase();
      if (q.length === 0) {
        dropdownEl.classList.add('hidden');
        return;
      }

      const matches = STATIONS.filter(
        (s) =>
          s.code.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q)
      ).slice(0, 7);

      if (matches.length === 0) {
        dropdownEl.innerHTML = `<div class="station-dropdown-item no-match">No railway stations found for "${q}"</div>`;
      } else {
        dropdownEl.innerHTML = matches
          .map(
            (s) => `
          <div class="station-dropdown-item" data-code="${s.code}" data-label="${s.name} (${s.code})">
            <div class="stn-left">
              <span class="stn-code-badge">${s.code}</span>
              <span class="stn-name">${s.name}</span>
            </div>
            <div class="stn-right">
              <span class="stn-zone">${s.zone} Zone</span>
              <span class="stn-state">${s.state}</span>
            </div>
          </div>
        `
          )
          .join('');
      }

      dropdownEl.classList.remove('hidden');
    });

    dropdownEl.addEventListener('click', (e) => {
      const item = e.target.closest('.station-dropdown-item');
      if (item && item.dataset.code) {
        inputEl.value = item.dataset.label;
        inputEl.dataset.code = item.dataset.code;
        dropdownEl.classList.add('hidden');
        this.triggerSearch();
      }
    });

    document.addEventListener('click', (e) => {
      if (!inputEl.contains(e.target) && !dropdownEl.contains(e.target)) {
        dropdownEl.classList.add('hidden');
      }
    });
  }

  triggerSearch() {
    const chkVande = document.getElementById('chk-vande-bharat')?.checked || false;
    const chkAvail = document.getElementById('chk-available-only')?.checked || false;
    const chkAc = document.getElementById('chk-ac-only')?.checked || false;
    const concession = document.getElementById('concession-select')?.value || 'NONE';

    if (this.onSearch) {
      this.onSearch({
        fromStation: this.fromStation,
        toStation: this.toStation,
        journeyDate: this.journeyDate,
        quota: this.quota,
        concession: concession,
        filters: {
          vandeOnly: chkVande,
          availableOnly: chkAvail,
          acOnly: chkAc
        }
      });
    }
  }
}

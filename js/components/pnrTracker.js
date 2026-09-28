import { lookupPnrApi } from '../utils/apiClient.js';
import { SAMPLE_PNRS } from '../data/pnrData.js';

export class PnrTracker {
  constructor(containerElement) {
    this.container = containerElement;
    this.currentPnr = '2847193852'; // Default sample PNR
    this.currentRecord = SAMPLE_PNRS[this.currentPnr] || null;
    this.isLoading = false;
    this.customPnrs = [];

    this.init();
  }

  async init() {
    this.render();
    this.attachEvents();
    // Fetch initial from REST API
    await this.fetchPnr(this.currentPnr);
  }

  async fetchPnr(pnr) {
    this.currentPnr = pnr.trim();
    this.isLoading = true;
    this.renderLoading();

    try {
      const rec = await lookupPnrApi(this.currentPnr);
      this.currentRecord = rec;
    } catch (err) {
      console.warn('[PNR] Lookup failed, checking sample data:', err);
      this.currentRecord = SAMPLE_PNRS[this.currentPnr] || null;
    } finally {
      this.isLoading = false;
      this.render();
      this.attachEvents();
    }
  }

  addCustomPnr(pnr, label = 'New Booking - CNF') {
    if (!this.customPnrs.some(c => c.pnr === pnr)) {
      this.customPnrs.unshift({ pnr, label });
    }
    this.fetchPnr(pnr);
  }

  renderLoading() {
    const wrapper = this.container.querySelector('#pnr-result-card-wrapper');
    if (wrapper) {
      wrapper.innerHTML = `
        <div class="pnr-result-card" style="text-align: center; padding: 40px;">
          <div style="display: flex; align-items: center; justify-content: center; gap: 10px; color: var(--primary);">
            <svg class="min-icon spin-icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
            <span style="font-weight: 600; font-size: 1.05rem;">Querying reservation database for PNR ${this.currentPnr}...</span>
          </div>
        </div>
      `;
    }
  }

  render() {
    const record = this.currentRecord;

    this.container.innerHTML = `
      <section class="pnr-tracker-section" aria-label="PNR Status Enquiry">
        <!-- PNR Lookup Form Bar -->
        <div class="pnr-search-bar-card">
          <div class="pnr-search-header">
            <span class="pnr-icon"><svg class="min-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></span>
            <div>
              <h2 class="section-title">Passenger Name Record (PNR) Status Enquiry</h2>
              <p class="section-subtitle">Simulated Passenger Charting & SQLite Reservation Database Synchronization</p>
            </div>
          </div>

          <form id="pnr-lookup-form" class="pnr-input-row">
            <div class="pnr-input-wrapper">
              <span class="pnr-prefix-tag">PNR</span>
              <input 
                type="text" 
                id="pnr-number-input" 
                class="pnr-input" 
                maxlength="10" 
                placeholder="Enter 10-Digit PNR (e.g. 2847193852)" 
                value="${this.currentPnr}"
                pattern="[0-9]{10}"
                required
              />
              <button type="submit" class="btn-check-pnr">GET STATUS <svg class="min-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;margin-left:4px;"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></button>
            </div>
          </form>

          <!-- Quick Sample PNR Chips -->
          <div class="pnr-demo-chips">
            <span class="demo-label">Live SQLite PNRs:</span>
            ${this.customPnrs.map(c => `
              <button type="button" class="sample-pnr-chip ${this.currentPnr === c.pnr ? 'active' : ''}" data-pnr="${c.pnr}">
                <span class="status-dot-cnf"></span> ${c.pnr} (${c.label})
              </button>
            `).join('')}
            <button type="button" class="sample-pnr-chip ${this.currentPnr === '2847193852' ? 'active' : ''}" data-pnr="2847193852">
              <span class="status-dot-cnf"></span> 2847193852 (Vande Bharat - CNF)
            </button>
            <button type="button" class="sample-pnr-chip ${this.currentPnr === '6491028471' ? 'active' : ''}" data-pnr="6491028471">
              <span class="status-dot-rac"></span> 6491028471 (Rajdhani - RAC)
            </button>
            <button type="button" class="sample-pnr-chip ${this.currentPnr === '8371940285' ? 'active' : ''}" data-pnr="8371940285">
              <span class="status-dot-wl"></span> 8371940285 (Tejas - WL)
            </button>
          </div>
        </div>

        <!-- PNR Result Display Container -->
        <div id="pnr-result-card-wrapper">
          ${record ? this.renderPnrRecord(record) : this.renderNotFound()}
        </div>
      </section>
    `;
  }

  renderPnrRecord(rec) {
    const isChartPrepared = rec.chartStatus === 'CHART PREPARED';

    return `
      <div class="pnr-result-card animate-fade-in">
        <!-- Top Status Banner -->
        <div class="pnr-card-header">
          <div class="pnr-num-block">
            <span class="pnr-label-tiny">PNR NUMBER</span>
            <span class="pnr-big-code">${rec.pnr}</span>
          </div>

          <div class="charting-status-pill ${isChartPrepared ? 'chart-prepared' : 'chart-not-prepared'}">
            <span class="chart-status-dot"></span>
            <span class="chart-status-text">${rec.chartStatus}</span>
          </div>
        </div>

        <!-- Train & Journey Highlights Grid -->
        <div class="pnr-journey-grid">
          <div class="journey-item">
            <span class="j-label">TRAIN NO. & NAME</span>
            <span class="j-val text-bold">${rec.trainNo} - ${rec.trainName}</span>
          </div>
          <div class="journey-item">
            <span class="j-label">DATE OF JOURNEY</span>
            <span class="j-val text-bold">${rec.journeyDate}</span>
          </div>
          <div class="journey-item">
            <span class="j-label">FROM STATION</span>
            <span class="j-val">${rec.fromStation}</span>
          </div>
          <div class="journey-item">
            <span class="j-label">TO STATION</span>
            <span class="j-val">${rec.toStation}</span>
          </div>
          <div class="journey-item">
            <span class="j-label">CLASS BOOKED</span>
            <span class="j-val">${rec.classBooked}</span>
          </div>
          <div class="journey-item">
            <span class="j-label">QUOTA / TOTAL FARE</span>
            <span class="j-val">${rec.quota} • <strong>${rec.fareTotal}</strong></span>
          </div>
        </div>

        <!-- Passengers Breakdown Table / Cards -->
        <div class="pnr-passengers-container">
          <h4 class="passengers-header-title">PASSENGER DETAILS (${(rec.passengers || []).length} PASSENGERS)</h4>
          <div class="passenger-cards-grid">
            ${(rec.passengers || []).map((p) => `
              <div class="passenger-card-item">
                <div class="p-header">
                  <span class="p-num">Passenger ${p.id}</span>
                  <span class="p-status-badge ${p.statusClass || 'status-cnf'}">${p.currentStatus}</span>
                </div>
                <div class="p-name-row">
                  <span class="p-name">${p.name}</span>
                  <span class="p-meta">${p.age} Yrs • ${p.gender === 'M' ? 'Male' : (p.gender === 'F' ? 'Female' : 'Transgender')}</span>
                </div>
                <div class="p-status-details">
                  <div class="status-col">
                    <span class="col-lbl">Booking Status:</span>
                    <span class="col-val">${p.bookingStatus}</span>
                  </div>
                  <div class="status-col highlight">
                    <span class="col-lbl">Coach & Berth:</span>
                    <span class="col-val">${p.coach} / ${p.berthNo} (${p.berthType})</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Charting Notes & Actions Footer -->
        <div class="pnr-card-footer">
          <div class="chart-timestamp-note">
            <svg class="min-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;margin-right:4px;"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>${rec.chartPreparedTime || 'Simulated e-Chart generated for journey'}
          </div>
          <div class="pnr-actions">
            <button type="button" class="btn-secondary-pnr" id="btn-print-pnr"><svg class="min-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;margin-right:4px;"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>Print Journey Card</button>
            <button type="button" class="btn-secondary-pnr" id="btn-sms-pnr"><svg class="min-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;margin-right:4px;"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>Send SMS / WhatsApp</button>
          </div>
        </div>
      </div>
    `;
  }

  renderNotFound() {
    return `
      <div class="empty-search-state">
        <div class="empty-icon"><svg class="min-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:48px;height:48px;opacity:0.85;"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
        <h3>PNR Record Not Found</h3>
        <p>No journey record found in SQLite database for PNR <strong>${this.currentPnr}</strong>. Please check the 10-digit number on your ticket or try our sample PNRs above.</p>
      </div>
    `;
  }

  attachEvents() {
    const form = document.getElementById('pnr-lookup-form');
    const input = document.getElementById('pnr-number-input');
    const chips = this.container.querySelectorAll('.sample-pnr-chip');

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const val = input.value.trim();
        if (val.length === 10) {
          this.fetchPnr(val);
        } else {
          alert('Please enter a valid 10-digit PNR number.');
        }
      });
    }

    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const pnr = chip.dataset.pnr;
        if (input) input.value = pnr;
        this.fetchPnr(pnr);
      });
    });

    // Print Journey Card action
    const printBtn = document.getElementById('btn-print-pnr');
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        window.print();
      });
    }

    const smsBtn = document.getElementById('btn-sms-pnr');
    if (smsBtn) {
      smsBtn.addEventListener('click', () => {
        alert(`Simulated SMS notification dispatched for PNR ${this.currentPnr}.`);
      });
    }
  }
}

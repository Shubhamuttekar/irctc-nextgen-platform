export class AvailabilityMatrix {
  constructor(containerElement, onBookCallback, onViewCoachCallback, onTrackLiveCallback) {
    this.container = containerElement;
    this.onBook = onBookCallback;
    this.onViewCoach = onViewCoachCallback;
    this.onTrackLive = onTrackLiveCallback;
    this.selectedClassPerTrain = {};
  }

  render(trainsList, searchParams) {
    if (!trainsList || trainsList.length === 0) {
      this.container.innerHTML = `
        <div class="empty-search-state">
          <div class="empty-icon"><svg class="min-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:48px;height:48px;opacity:0.85;"><rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><circle cx="8" cy="15" r="1"/><circle cx="16" cy="15" r="1"/></svg></div>
          <h3>No Direct Trains Found For This Route</h3>
          <p>Try searching between major terminals like <strong>NDLS (Delhi)</strong> and <strong>BSB (Varanasi)</strong>, or <strong>BCT (Mumbai)</strong> and <strong>ADI (Ahmedabad)</strong>.</p>
          <button type="button" class="btn-reset-search" id="btn-reset-default-route">
            Load Popular Delhi - Varanasi Expresses
          </button>
        </div>
      `;

      const resetBtn = document.getElementById('btn-reset-default-route');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          const chip = document.querySelector('.route-chip');
          if (chip) chip.click();
        });
      }
      return;
    }

    const quotaLabel = searchParams?.quota ? searchParams.quota.replace('_', ' ') : 'GENERAL';

    const html = `
      <div class="train-results-header">
        <div class="results-count-title">
          <h2>Available Trains (${trainsList.length})</h2>
          <span class="results-route-tag">
            ${searchParams?.fromStation || 'ORIGIN'} <svg class="min-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;margin:0 4px;vertical-align:middle;"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg> ${searchParams?.toStation || 'DESTINATION'} • ${searchParams?.journeyDate || 'Selected Date'} • Quota: <strong class="text-saffron">${quotaLabel}</strong>
          </span>
        </div>
        <div class="matrix-legend-bar">
          <span class="legend-item"><span class="legend-dot dot-green"></span> Available / Confirmed</span>
          <span class="legend-item"><span class="legend-dot dot-amber"></span> RAC (Reservation Against Cancellation)</span>
          <span class="legend-item"><span class="legend-dot dot-rose"></span> Waitlist (WL)</span>
          <span class="legend-item"><span class="legend-dot dot-ai"></span> AI Probability</span>
        </div>
      </div>

      <div class="train-cards-list">
        ${trainsList.map((train) => this.renderTrainCard(train, searchParams)).join('')}
      </div>
    `;

    this.container.innerHTML = html;
    this.attachEvents(trainsList, searchParams);
  }

  renderTrainCard(train, searchParams) {
    const isVandeBharat = train.type.includes('Vande Bharat');
    const isRajdhani = train.type.includes('Rajdhani');
    const isTejas = train.type.includes('Tejas');

    let badgeClass = 'tag-express';
    if (isVandeBharat) badgeClass = 'tag-vande-bharat';
    else if (isRajdhani) badgeClass = 'tag-rajdhani';
    else if (isTejas) badgeClass = 'tag-tejas';

    // Get classes entries
    const classEntries = Object.entries(train.classes);
    // Default select first class if not already selected
    const currentClassKey = this.selectedClassPerTrain[train.trainNo] || classEntries[0][0];
    const currentClassData = train.classes[currentClassKey] || classEntries[0][1];

    const isTatkal = searchParams?.quota === 'TATKAL';
    const displayFare = isTatkal && currentClassData.tatkalFare ? currentClassData.tatkalFare : currentClassData.fare;

    return `
      <article class="train-card ${isVandeBharat ? 'card-vande-bharat' : ''}" data-train-no="${train.trainNo}" aria-label="${train.trainName}">
        <!-- Top Train Header Strip -->
        <div class="train-card-header">
          <div class="train-identity">
            <div class="train-name-row">
              <span class="train-number">${train.trainNo}</span>
              <h3 class="train-name">${train.trainName}</h3>
              <span class="train-badge ${badgeClass}">${train.badge || train.type}</span>
            </div>
            <div class="train-runs-on">
              <span class="runs-label">Runs On:</span>
              <div class="days-chips">
                ${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                  const runs = train.runsOn.includes(day);
                  return `<span class="day-chip ${runs ? 'runs' : 'not-runs'}">${day[0]}</span>`;
                }).join('')}
              </div>
            </div>
          </div>

          <!-- Quick Action Links -->
          <div class="train-quick-actions">
            <button type="button" class="btn-text-link btn-track-live" data-train-no="${train.trainNo}">
              <span class="pulse-green-dot"></span> Live Running Status
            </button>
            <button type="button" class="btn-text-link btn-view-coach" data-train-no="${train.trainNo}" data-class="${currentClassKey}">
              <svg class="min-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;margin-right:4px;"><path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"/><path d="M3 11v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z"/><path d="M5 18v2"/><path d="M19 18v2"/></svg>View Coach & Berths
            </button>
          </div>
        </div>

        <!-- Train Schedule & Route Bar -->
        <div class="train-schedule-strip">
          <div class="schedule-point origin">
            <span class="sched-time">${train.departureTime}</span>
            <span class="sched-code">${train.fromStation}</span>
            <span class="sched-name">${train.fromStationName}</span>
          </div>

          <div class="schedule-duration-bar">
            <span class="duration-text">${train.duration}</span>
            <div class="duration-line">
              <span class="line-dot start"></span>
              <span class="line-train-icon"><svg class="min-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><circle cx="8" cy="15" r="1"/><circle cx="16" cy="15" r="1"/></svg></span>
              <span class="line-dot end"></span>
            </div>
            <span class="distance-speed">${train.distanceKm} km • Avg ${train.avgSpeed}</span>
          </div>

          <div class="schedule-point destination">
            <span class="sched-time">${train.arrivalTime}</span>
            <span class="sched-code">${train.toStation}</span>
            <span class="sched-name">${train.toStationName}</span>
          </div>
        </div>

        <!-- Unified Seat Availability Matrix Across All Classes -->
        <div class="unified-availability-matrix" role="region" aria-label="Seat Availability Across Classes">
          <span class="matrix-title-label">UNIFIED SEAT AVAILABILITY MATRIX</span>
          <div class="matrix-grid">
            ${classEntries.map(([clsKey, cls]) => {
              const isSelected = clsKey === currentClassKey;
              const isTatkalQuota = searchParams?.quota === 'TATKAL';
              const seatCount = isTatkalQuota ? (cls.tatkalAvailable ?? cls.seats) : cls.seats;
              const fare = isTatkalQuota && cls.tatkalFare ? cls.tatkalFare : cls.fare;

              let statusColorClass = 'status-green';
              let statusText = cls.statusText;

              if (cls.status === 'RAC') {
                statusColorClass = 'status-amber';
              } else if (cls.status === 'WL') {
                statusColorClass = 'status-rose';
              }

              return `
                <button 
                  type="button" 
                  class="matrix-cell ${statusColorClass} ${isSelected ? 'selected' : ''}" 
                  data-train-no="${train.trainNo}" 
                  data-class="${clsKey}"
                  aria-pressed="${isSelected}"
                >
                  <div class="cell-top">
                    <span class="cell-class-code">${clsKey}</span>
                    <span class="cell-fare">₹${fare}</span>
                  </div>
                  <div class="cell-status">
                    <span class="cell-status-text">${statusText}</span>
                  </div>
                  <!-- AI Confirmation Probability Chip -->
                  <div class="cell-ai-prob" title="CRIS AI Historical Ticket Confirmation Model">
                    <span class="ai-spark"><svg class="min-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:11px;height:11px;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></span>
                    <span class="ai-text">${cls.probText}</span>
                  </div>
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Train Card Bottom Action Bar -->
        <div class="train-card-footer">
          <!-- Amenities Icons -->
          <div class="train-amenities-row" title="Onboard Amenities">
            ${train.charging ? `<span class="amenity-badge" title="Universal Charging Points"><img src="assets/icons/power_socket.svg" alt="" width="14" height="14"/> Charging</span>` : ''}
            ${train.pantry ? `<span class="amenity-badge" title="Pantry & Food"><img src="assets/icons/pantry_food.svg" alt="" width="14" height="14"/> Food Available</span>` : ''}
            ${train.wifi ? `<span class="amenity-badge" title="High-Speed Wi-Fi"><img src="assets/icons/wifi.svg" alt="" width="14" height="14"/> Wi-Fi</span>` : ''}
            ${train.cleanBedroll ? `<span class="amenity-badge" title="Clean Sanitized Bedroll"><img src="assets/icons/clean_bedroll.svg" alt="" width="14" height="14"/> Sanitized Bedroll</span>` : ''}
            ${train.readingLamp ? `<span class="amenity-badge" title="Reading Lamp"><img src="assets/icons/reading_lamp.svg" alt="" width="14" height="14"/> Reading Lamp</span>` : ''}
          </div>

          <!-- Price & Book Now CTA -->
          <div class="booking-cta-cluster">
            <div class="selected-fare-display">
              <span class="fare-subtext">${currentClassData.name} (${currentClassKey})</span>
              <span class="fare-amount">₹${displayFare}</span>
            </div>
            <button 
              type="button" 
              class="btn-book-now" 
              data-train-no="${train.trainNo}" 
              data-class="${currentClassKey}" 
              data-fare="${displayFare}"
            >
              BOOK TICKET NOW <svg class="min-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;margin-left:4px;"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      </article>
    `;
  }

  attachEvents(trainsList, searchParams) {
    // Class selection within matrix - clicking any class cell immediately pops open the booking details drawer!
    const matrixCells = this.container.querySelectorAll('.matrix-cell');
    matrixCells.forEach((cell) => {
      cell.addEventListener('click', (e) => {
        e.stopPropagation();
        const trainNo = cell.dataset.trainNo;
        const clsKey = cell.dataset.class;
        this.selectedClassPerTrain[trainNo] = clsKey;
        const train = trainsList.find((t) => t.trainNo === trainNo);
        if (train && train.classes && train.classes[clsKey]) {
          const isTatkalQuota = searchParams?.quota === 'TATKAL';
          const fare = isTatkalQuota && train.classes[clsKey].tatkalFare ? train.classes[clsKey].tatkalFare : train.classes[clsKey].fare;
          if (this.onBook) {
            this.onBook(train, clsKey, fare, searchParams);
          }
        }
      });
    });

    // Book Now button
    const bookBtns = this.container.querySelectorAll('.btn-book-now');
    bookBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const trainNo = btn.dataset.trainNo;
        const clsKey = btn.dataset.class;
        const fare = parseInt(btn.dataset.fare, 10);
        const train = trainsList.find((t) => t.trainNo === trainNo);
        if (train && this.onBook) {
          this.onBook(train, clsKey, fare, searchParams);
        }
      });
    });

    // View Coach & Berths button
    const coachBtns = this.container.querySelectorAll('.btn-view-coach');
    coachBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const trainNo = btn.dataset.trainNo;
        const clsKey = btn.dataset.class || '3A';
        const train = trainsList.find((t) => t.trainNo === trainNo);
        if (train && this.onViewCoach) {
          this.onViewCoach(train, clsKey);
        }
      });
    });

    // Track Live Running Status button
    const trackBtns = this.container.querySelectorAll('.btn-track-live');
    trackBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const trainNo = btn.dataset.trainNo;
        const train = trainsList.find((t) => t.trainNo === trainNo);
        if (train && this.onTrackLive) {
          this.onTrackLive(train);
        }
      });
    });
  }
}

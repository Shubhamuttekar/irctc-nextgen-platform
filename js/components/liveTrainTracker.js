import { TRAINS_DATA } from '../data/trainsData.js';

export class LiveTrainTracker {
  constructor(containerElement) {
    this.container = containerElement;
    this.selectedTrainNo = '22436'; // Default Vande Bharat Express
    this.init();
  }

  setTrain(trainNo) {
    this.selectedTrainNo = trainNo;
    this.render();
  }

  init() {
    this.render();
    this.attachEvents();
  }

  render() {
    const train = TRAINS_DATA.find((t) => t.trainNo === this.selectedTrainNo) || TRAINS_DATA[0];
    const live = train.currentLiveStatus;
    const isLate = live.delayMinutes > 0;

    this.container.innerHTML = `
      <section class="live-tracker-section" aria-label="Simulated Train Running Status">
        <!-- Live Tracker Header Bar -->
        <div class="live-header-card">
          <div class="live-title-row">
            <div class="live-tag-group">
              <span class="live-gps-pulse"></span>
              <span class="live-badge-pill">SIMULATED TRAIN STATUS TRACKER</span>
            </div>
            <div class="live-train-selector">
              <label for="live-train-select" class="selector-label">Select Train:</label>
              <select id="live-train-select" class="form-select live-select">
                ${TRAINS_DATA.map((t) => `
                  <option value="${t.trainNo}" ${t.trainNo === this.selectedTrainNo ? 'selected' : ''}>
                    ${t.trainNo} - ${t.trainName}
                  </option>
                `).join('')}
              </select>
            </div>
          </div>

          <!-- Train Name & Route Bar -->
          <div class="tracker-train-title">
            <h2>${train.trainNo} - ${train.trainName}</h2>
            <span class="route-subtitle">${train.fromStationName} (${train.fromStation}) <svg class="min-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;margin:0 4px;vertical-align:middle;"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg> ${train.toStationName} (${train.toStation})</span>
          </div>

          <!-- Simulated Telemetry Dashboard -->
          <div class="telemetry-dashboard-grid">
            <!-- Telemetry Box 1: Status & Delay -->
            <div class="telemetry-box ${isLate ? 'border-late' : 'border-ontime'}">
              <span class="tele-lbl">CURRENT RUNNING STATUS</span>
              <div class="tele-val-row">
                <span class="tele-dot ${isLate ? 'dot-late' : 'dot-ontime'}"></span>
                <span class="tele-status-text ${isLate ? 'text-late' : 'text-ontime'}">
                  ${live.statusText}
                </span>
              </div>
              <span class="tele-subtext">${live.delayMinutes === 0 ? 'Exact Right Time (0 min delay)' : `${live.delayMinutes} mins delay against schedule`}</span>
            </div>

            <!-- Telemetry Box 2: Current Simulated Position -->
            <div class="telemetry-box">
              <span class="tele-lbl">SIMULATED TRAIN LOCATION</span>
              <span class="tele-val-bold">${live.currentLocation}</span>
              <span class="tele-subtext">Next: <strong>${live.nextStation}</strong> (ETA: ${live.etaNextStation})</span>
            </div>

            <!-- Telemetry Box 3: Live Velocity -->
            <div class="telemetry-box speed-box">
              <span class="tele-lbl">CURRENT TRACTION SPEED</span>
              <div class="speed-number-wrap">
                <span class="speed-num">${live.speed.split(' ')[0]}</span>
                <span class="speed-unit">KM/H</span>
              </div>
              <span class="tele-subtext">KAVACH Collision Avoidance Enabled</span>
            </div>
          </div>

          <!-- Journey Distance Progress Bar -->
          <div class="journey-progress-wrap">
            <div class="progress-labels">
              <span>Origin: ${train.fromStation} (0 km)</span>
              <span><strong>${live.distanceCoveredKm} km</strong> Covered of ${live.totalKm} km (${live.progressPercent}%)</span>
              <span>Destination: ${train.toStation} (${live.totalKm} km)</span>
            </div>
            <div class="progress-track-bg">
              <div class="progress-track-fill" style="width: ${live.progressPercent}%">
                <span class="train-lead-indicator" title="Train Position"><svg class="min-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><circle cx="8" cy="15" r="1"/><circle cx="16" cy="15" r="1"/></svg></span>
              </div>
            </div>
          </div>
        </div>

        <!-- Station Halts Timeline -->
        <div class="halts-timeline-card">
          <div class="timeline-card-header">
            <h3 class="halts-title">Scheduled Station Halts & Telemetry Milestones</h3>
            <button type="button" class="btn-refresh-gps" id="btn-refresh-gps-ping">
              <svg class="min-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;margin-right:4px;"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>Refresh Simulation
            </button>
          </div>

          <div class="halts-timeline-list">
            ${train.halts.map((h, idx) => {
              const isDeparted = h.status.includes('Departed');
              const isCurrent = h.status.includes('Arriving') || h.status.includes('At Station');
              const isUpcoming = h.status.includes('Upcoming');

              let itemStateClass = 'halt-upcoming';
              let badgeState = 'badge-muted';
              if (isDeparted) {
                itemStateClass = 'halt-departed';
                badgeState = 'badge-green';
              } else if (isCurrent) {
                itemStateClass = 'halt-current pulse-border';
                badgeState = 'badge-amber';
              }

              return `
                <div class="timeline-station-node ${itemStateClass}">
                  <!-- Left: Timeline Marker -->
                  <div class="node-marker-col">
                    <span class="marker-dot ${isDeparted ? 'marker-passed' : isCurrent ? 'marker-active' : 'marker-future'}">
                      ${isDeparted ? '✓' : isCurrent ? '●' : (idx + 1)}
                    </span>
                    ${idx < train.halts.length - 1 ? '<span class="marker-line"></span>' : ''}
                  </div>

                  <!-- Center: Station Info -->
                  <div class="node-station-details">
                    <div class="station-code-name">
                      <span class="halt-code-pill">${h.code}</span>
                      <strong class="halt-name">${h.name}</strong>
                    </div>
                    <span class="halt-distance">${h.dist} km from origin • Day ${h.day}</span>
                  </div>

                  <!-- Right: Timing & Delay Status -->
                  <div class="node-timings-details">
                    <div class="time-block">
                      <span class="time-lbl">Arr / Dep</span>
                      <span class="time-val">${h.arr} / ${h.dep}</span>
                    </div>
                    <span class="node-status-tag ${badgeState}">
                      ${h.status}
                    </span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </section>
    `;

    this.attachEvents();
  }

  attachEvents() {
    const selectEl = document.getElementById('live-train-select');
    const refreshBtn = document.getElementById('btn-refresh-gps-ping');

    if (selectEl) {
      selectEl.addEventListener('change', () => {
        this.selectedTrainNo = selectEl.value;
        this.render();
      });
    }

    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        refreshBtn.innerHTML = '<svg class="min-icon spin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;margin-right:4px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>Updating Simulation...';
        refreshBtn.disabled = true;
        setTimeout(() => {
          refreshBtn.innerHTML = '<svg class="min-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;margin-right:4px;color:var(--status-green);"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>Simulation Updated Just Now';
          setTimeout(() => {
            if (document.getElementById('btn-refresh-gps-ping')) {
              refreshBtn.innerHTML = '<svg class="min-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;margin-right:4px;"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>Refresh Simulation';
              refreshBtn.disabled = false;
            }
          }, 1800);
        }, 600);
      });
    }
  }
}

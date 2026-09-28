/**
 * Tatkal Countdown Hub & Clock
 * Synchronizes to configured 10:00 AM (AC Tatkal) and 11:00 AM (Non-AC Tatkal) opening times
 */

export class TatkalTimer {
  constructor(containerElement) {
    this.container = containerElement;
    this.timerInterval = null;
    this.init();
  }

  init() {
    this.render();
    this.updateClock();
    this.timerInterval = setInterval(() => this.updateClock(), 1000);
  }

  destroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  updateClock() {
    const now = new Date();
    
    // Target today 10:00:00 AM (AC Tatkal)
    const acTarget = new Date();
    acTarget.setHours(10, 0, 0, 0);

    // Target today 11:00:00 AM (Non-AC Tatkal)
    const nonAcTarget = new Date();
    nonAcTarget.setHours(11, 0, 0, 0);

    // Calculate diffs
    const diffAc = acTarget.getTime() - now.getTime();
    const diffNonAc = nonAcTarget.getTime() - now.getTime();

    // Determine status for AC Tatkal
    let acStatus = '';
    let acBadge = '';
    let acCountdown = '';

    if (diffAc > 0) {
      acStatus = 'Opens at 10:00 AM';
      acBadge = 'badge-amber';
      acCountdown = this.formatTime(diffAc);
    } else if (diffAc <= 0 && diffAc > -3600000) { // Within 1 hour
      acStatus = 'TATKAL BOOKING LIVE';
      acBadge = 'badge-green pulse-badge';
      acCountdown = 'BOOKING ACTIVE';
    } else {
      acStatus = 'Window Closed (Next: Tomorrow 10:00 AM)';
      acBadge = 'badge-muted';
      // Time until tomorrow 10am
      const tomorrowAc = new Date(acTarget.getTime() + 86400000);
      acCountdown = this.formatTime(tomorrowAc.getTime() - now.getTime());
    }

    // Determine status for Non-AC Tatkal
    let nonAcStatus = '';
    let nonAcBadge = '';
    let nonAcCountdown = '';

    if (diffNonAc > 0) {
      nonAcStatus = 'Opens at 11:00 AM';
      nonAcBadge = 'badge-amber';
      nonAcCountdown = this.formatTime(diffNonAc);
    } else if (diffNonAc <= 0 && diffNonAc > -3600000) {
      nonAcStatus = 'TATKAL BOOKING LIVE';
      nonAcBadge = 'badge-green pulse-badge';
      nonAcCountdown = 'BOOKING ACTIVE';
    } else {
      nonAcStatus = 'Window Closed (Next: Tomorrow 11:00 AM)';
      nonAcBadge = 'badge-muted';
      const tomorrowNonAc = new Date(nonAcTarget.getTime() + 86400000);
      nonAcCountdown = this.formatTime(tomorrowNonAc.getTime() - now.getTime());
    }

    // Update DOM
    const acCountdownEl = document.getElementById('ac-tatkal-countdown');
    const acBadgeEl = document.getElementById('ac-tatkal-badge');
    const nonAcCountdownEl = document.getElementById('nonac-tatkal-countdown');
    const nonAcBadgeEl = document.getElementById('nonac-tatkal-badge');
    const liveServerClockEl = document.getElementById('live-server-clock');

    if (acCountdownEl) acCountdownEl.textContent = acCountdown;
    if (acBadgeEl) {
      acBadgeEl.textContent = acStatus;
      acBadgeEl.className = `tatkal-status-badge ${acBadge}`;
    }

    if (nonAcCountdownEl) nonAcCountdownEl.textContent = nonAcCountdown;
    if (nonAcBadgeEl) {
      nonAcBadgeEl.textContent = nonAcStatus;
      nonAcBadgeEl.className = `tatkal-status-badge ${nonAcBadge}`;
    }

    if (liveServerClockEl) {
      const timeStr = now.toLocaleTimeString('en-IN', { hour12: false });
      const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      liveServerClockEl.innerHTML = `<span class="clock-live-dot"></span> CURRENT DEMO TIME: <strong>${timeStr} IST</strong> (${dateStr})`;
    }
  }

  formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}h : ${String(minutes).padStart(2, '0')}m : ${String(seconds).padStart(2, '0')}s`;
  }

  render() {
    this.container.innerHTML = `
      <div class="tatkal-card">
        <div class="tatkal-header">
          <div class="tatkal-title-group">
            <span class="tatkal-icon" aria-hidden="true"><svg class="min-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></span>
            <div>
              <h3 class="tatkal-title" data-i18n="tatkal_heading">Tatkal Reservation Countdown Hub</h3>
              <p class="tatkal-subtitle">Simulated AC and Non-AC Tatkal Booking Windows</p>
            </div>
          </div>
          <div id="live-server-clock" class="server-clock-badge" aria-live="polite">
            <span class="clock-live-dot"></span> CURRENT DEMO TIME: --:--:-- IST
          </div>
        </div>

        <div class="tatkal-grid">
          <!-- AC Tatkal Card -->
          <div class="tatkal-slot-card">
            <div class="slot-badge-bar">
              <span class="slot-class-tag">AC CLASSES (1A, 2A, 3A, 3E, CC, EC)</span>
              <span id="ac-tatkal-badge" class="tatkal-status-badge badge-amber">Checking...</span>
            </div>
            <div class="slot-content">
              <div class="slot-timing">
                <span class="timing-label">Opening Time:</span>
                <span class="timing-value">10:00 AM IST</span>
              </div>
              <div class="slot-countdown-box">
                <span class="countdown-label">Time Remaining Until Window Opens</span>
                <div id="ac-tatkal-countdown" class="countdown-digits">00h : 00m : 00s</div>
              </div>
            </div>
            <div class="slot-footer">
              <span class="tip-text"><svg class="min-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;margin-right:4px;vertical-align:middle;"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>Tip: Keep Master Passenger List pre-filled for 1-click tatkal checkout</span>
            </div>
          </div>

          <!-- Non-AC Tatkal Card -->
          <div class="tatkal-slot-card">
            <div class="slot-badge-bar">
              <span class="slot-class-tag">NON-AC CLASSES (SL, 2S, FC)</span>
              <span id="nonac-tatkal-badge" class="tatkal-status-badge badge-amber">Checking...</span>
            </div>
            <div class="slot-content">
              <div class="slot-timing">
                <span class="timing-label">Opening Time:</span>
                <span class="timing-value">11:00 AM IST</span>
              </div>
              <div class="slot-countdown-box">
                <span class="countdown-label">Time Remaining Until Window Opens</span>
                <div id="nonac-tatkal-countdown" class="countdown-digits">00h : 00m : 00s</div>
              </div>
            </div>
            <div class="slot-footer">
              <span class="tip-text"><svg class="min-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;margin-right:4px;vertical-align:middle;"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>Tip: Use UPI AutoPay / IRCTC iMudra for 5x faster payment clearance</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

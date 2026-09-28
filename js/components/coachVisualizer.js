/**
 * Interactive Coach & Berth Visualizer
 * Renders authentic 2D architectural blueprints of Indian Railways coaches:
 * 3A (AC 3-Tier), 2A (AC 2-Tier), SL (Sleeper Class), and CC (AC Chair Car)
 */

export class CoachVisualizer {
  constructor(containerElement, onSelectBerthCallback) {
    this.container = containerElement;
    this.onSelectBerth = onSelectBerthCallback;
    this.activeClass = '3A';
    this.activeCoachNo = 'B2';
    this.selectedBerth = null;
    this.currentTrain = null;
  }

  show(train, preferredClass = '3A') {
    this.currentTrain = train;
    // If train doesn't have 3A, pick first available class
    if (train && train.classes) {
      if (train.classes[preferredClass]) {
        this.activeClass = preferredClass;
      } else {
        this.activeClass = Object.keys(train.classes)[0];
      }
    } else {
      this.activeClass = preferredClass;
    }

    this.activeCoachNo = this.getDefaultCoachName(this.activeClass);
    this.selectedBerth = null;

    const modal = this.ensureShell();

    requestAnimationFrame(() => {
      if (modal) {
        modal.classList.remove('is-closing');
        modal.classList.add('is-open');
      }
    });

    this.render();
  }

  getDefaultCoachName(cls) {
    switch (cls) {
      case '1A': return 'H1';
      case '2A': return 'A1';
      case '3A': return 'B2';
      case '3E': return 'M1';
      case 'CC': return 'C2';
      case 'EC': return 'E1';
      case 'SL': return 'S3';
      default: return 'B1';
    }
  }

  closeModal() {
    if (this.handleKeyDown) {
      document.removeEventListener('keydown', this.handleKeyDown);
      this.handleKeyDown = null;
    }
    const modal = this.container.querySelector('.coach-visualizer-modal');
    if (modal) {
      modal.classList.remove('is-open');
      modal.classList.add('is-closing');
      setTimeout(() => {
        this.container.innerHTML = '';
      }, 260);
    } else {
      this.container.innerHTML = '';
    }
  }

  ensureShell() {
    let modal = this.container.querySelector('.coach-visualizer-modal');
    if (!modal) {
      const trainTitle = this.currentTrain ? `${this.currentTrain.trainNo} - ${this.currentTrain.trainName}` : '22436 - VANDE BHARAT EXPRESS';
      this.container.innerHTML = `
        <div class="coach-visualizer-modal" id="coach-visualizer-modal" role="dialog" aria-modal="true" aria-labelledby="coach-modal-title">
          <div class="coach-modal-backdrop" id="coach-modal-backdrop"></div>
          <div class="coach-modal-content" id="coach-modal-content-shell">
            <!-- Modal Header -->
            <div class="coach-modal-header">
              <div class="modal-title-group">
                <span class="modal-icon"><svg class="min-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"/><path d="M3 11v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z"/><path d="M5 18v2"/><path d="M19 18v2"/></svg></span>
                <div>
                  <h2 id="coach-modal-title" class="modal-title">Interactive Coach & Berth Visualizer</h2>
                  <p class="modal-subtitle" id="coach-modal-subtitle">${trainTitle} • Interactive Coach Blueprint</p>
                </div>
              </div>
              <button type="button" class="btn-modal-close" id="btn-close-coach-modal" aria-label="Close Visualizer">✕</button>
            </div>

            <!-- Interior Content (Tabs, Legend, Blueprint, Action Bar) -->
            <div id="coach-modal-interior" style="display: flex; flex-direction: column; flex: 1; overflow: hidden;"></div>
          </div>
        </div>
      `;
      modal = this.container.querySelector('.coach-visualizer-modal');
      this.attachShellEvents();
    }
    return modal;
  }

  render() {
    this.ensureShell();

    const subtitle = this.container.querySelector('#coach-modal-subtitle');
    if (subtitle && this.currentTrain) {
      subtitle.textContent = `${this.currentTrain.trainNo} - ${this.currentTrain.trainName} • Interactive Coach Blueprint`;
    }

    const interior = this.container.querySelector('#coach-modal-interior');
    if (!interior) return;

    interior.innerHTML = `
      <!-- Coach Class Selector Tabs -->
      <div class="coach-class-tabs" role="tablist">
        ${['1A', '2A', '3A', 'SL', 'CC', 'EC'].map((cls) => {
          const isActive = cls === this.activeClass;
          return `
            <button type="button" class="coach-tab-btn ${isActive ? 'active' : ''}" data-class="${cls}" role="tab" aria-selected="${isActive}">
              ${cls} Class
            </button>
          `;
        }).join('')}
      </div>

      <!-- Berth Legend & Info Strip -->
      <div class="berth-legend-row">
        <div class="legend-pills">
          <span class="berth-legend-item"><span class="berth-sample lb"></span> Lower (LB)</span>
          <span class="berth-legend-item"><span class="berth-sample mb"></span> Middle (MB)</span>
          <span class="berth-legend-item"><span class="berth-sample ub"></span> Upper (UB)</span>
          <span class="berth-legend-item"><span class="berth-sample sl"></span> Side Lower (SL)</span>
          <span class="berth-legend-item"><span class="berth-sample su"></span> Side Upper (SU)</span>
          <span class="berth-legend-item"><span class="berth-sample ws"></span> Window (WS)</span>
          <span class="berth-legend-item"><span class="berth-sample as"></span> Aisle (AS)</span>
          <span class="berth-legend-item"><span class="berth-sample selected"></span> Selected</span>
        </div>
        <div class="coach-selected-indicator">
          Coach: <strong>${this.activeCoachNo}</strong> (${this.activeClass})
        </div>
      </div>

      <!-- 2D Coach Blueprint Container -->
      <div class="coach-blueprint-scroll">
        <div class="coach-exterior-shell">
          <!-- Left Vestibule & Restroom Section -->
          <div class="coach-vestibule">
            <div class="vestibule-col-header">
              <span class="vestibule-tag">VESTIBULE</span>
              <span class="vestibule-subtag">GANGWAY</span>
            </div>
            <div class="lavatory-box">
              <span class="facility-icon"><svg class="min-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><circle cx="12" cy="7" r="4"/><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg></span>
              <span class="facility-label">TOILET</span>
            </div>
            <div class="lavatory-box">
              <span class="facility-icon"><svg class="min-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><path d="M9 12h6"/><path d="M12 9v6"/><circle cx="12" cy="12" r="9"/><path d="M12 17a2 2 0 0 0 2-2c0-1.5-2-3-2-3s-2 1.5-2 3a2 2 0 0 0 2 2z"/></svg></span>
              <span class="facility-label">WASHBASIN</span>
            </div>
          </div>

          <!-- Main Passenger Bays Section -->
          <div class="coach-bays-layout" id="coach-bays-container">
            ${this.generateCoachLayoutHTML(this.activeClass)}
          </div>

          <!-- Right Vestibule & Restroom Section -->
          <div class="coach-vestibule right">
            <div class="vestibule-col-header emergency">
              <span class="vestibule-tag">EMERGENCY</span>
              <span class="vestibule-subtag">EXIT</span>
            </div>
            <div class="lavatory-box">
              <span class="facility-icon"><svg class="min-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><path d="M9 12h6"/><path d="M12 9v6"/><circle cx="12" cy="12" r="9"/><path d="M12 17a2 2 0 0 0 2-2c0-1.5-2-3-2-3s-2 1.5-2 3a2 2 0 0 0 2 2z"/></svg></span>
              <span class="facility-label">WASHBASIN</span>
            </div>
            <div class="lavatory-box">
              <span class="facility-icon"><svg class="min-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><circle cx="12" cy="7" r="4"/><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg></span>
              <span class="facility-label">TOILET</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Active Selection Summary Card & Confirm Action -->
      <div class="berth-selection-bar">
        <div class="selected-berth-info">
          ${this.selectedBerth ? `
            <span class="info-label">Selected Berth:</span>
            <span class="info-value">Berth #${this.selectedBerth.number} • Coach ${this.activeCoachNo} (${this.selectedBerth.typeLabel})</span>
          ` : `
            <span class="info-label">No Berth Selected</span>
            <span class="info-hint">Click any available berth in the layout above to set your travel preference.</span>
          `}
        </div>
        <button 
          type="button" 
          class="btn-apply-berth" 
          id="btn-apply-berth-selection"
          ${!this.selectedBerth ? 'disabled' : ''}
        >
          Set As Preference In Booking <svg class="min-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;margin-left:4px;"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </button>
      </div>
    `;

    this.attachInteriorEvents();
  }

  generateCoachLayoutHTML(cls) {
    if (cls === '1A') {
      return this.generate1ALayout();
    } else if (cls === '3A' || cls === 'SL') {
      return this.generate3ALayout();
    } else if (cls === '2A') {
      return this.generate2ALayout();
    } else {
      return this.generateCCLayout();
    }
  }

  generate1ALayout() {
    return `
      <div class="coach-bay bay-1a" data-bay="1">
        <div class="bay-header-label">COUPE A (Luxury 2-Berth)</div>
        <div class="bay-main-compartment">
          <div class="berth-row upper-row">
            ${this.renderBerthItem(2, 'UB', 'Upper Berth')}
          </div>
          <div class="berth-row lower-row">
            ${this.renderBerthItem(1, 'LB', 'Lower Berth')}
          </div>
        </div>
        <div class="bay-aisle-divider">
          <span class="aisle-text">CARPETED CORRIDOR</span>
        </div>
      </div>

      <div class="coach-bay bay-1a" data-bay="2">
        <div class="bay-header-label">CABIN B (Luxury 4-Berth)</div>
        <div class="bay-main-compartment">
          <div class="berth-row upper-row">
            ${this.renderBerthItem(4, 'UB', 'Upper Berth')}
            ${this.renderBerthItem(6, 'UB', 'Upper Berth')}
          </div>
          <div class="berth-row lower-row">
            ${this.renderBerthItem(3, 'LB', 'Lower Berth')}
            ${this.renderBerthItem(5, 'LB', 'Lower Berth')}
          </div>
        </div>
        <div class="bay-aisle-divider">
          <span class="aisle-text">CARPETED CORRIDOR</span>
        </div>
      </div>

      <div class="coach-bay bay-1a" data-bay="3">
        <div class="bay-header-label">CABIN C (Luxury 4-Berth)</div>
        <div class="bay-main-compartment">
          <div class="berth-row upper-row">
            ${this.renderBerthItem(8, 'UB', 'Upper Berth')}
            ${this.renderBerthItem(10, 'UB', 'Upper Berth')}
          </div>
          <div class="berth-row lower-row">
            ${this.renderBerthItem(7, 'LB', 'Lower Berth')}
            ${this.renderBerthItem(9, 'LB', 'Lower Berth')}
          </div>
        </div>
        <div class="bay-aisle-divider">
          <span class="aisle-text">CARPETED CORRIDOR</span>
        </div>
      </div>

      <div class="coach-bay bay-1a" data-bay="4">
        <div class="bay-header-label">COUPE D (Luxury 2-Berth)</div>
        <div class="bay-main-compartment">
          <div class="berth-row upper-row">
            ${this.renderBerthItem(12, 'UB', 'Upper Berth')}
          </div>
          <div class="berth-row lower-row">
            ${this.renderBerthItem(11, 'LB', 'Lower Berth')}
          </div>
        </div>
        <div class="bay-aisle-divider">
          <span class="aisle-text">CARPETED CORRIDOR</span>
        </div>
      </div>
    `;
  }

  generate3ALayout() {
    // 8 Bays of 8 berths = 64 berths displayed (typical visible rake segment)
    let baysHtml = '';
    const bayCount = 6;

    for (let bay = 0; bay < bayCount; bay++) {
      const baseNum = bay * 8;
      // Main compartment (6 berths: 2 lower, 2 middle, 2 upper)
      // Side aisle (2 berths: 1 side lower, 1 side upper)
      baysHtml += `
        <div class="coach-bay" data-bay="${bay + 1}">
          <div class="bay-header-label">BAY ${bay + 1}</div>
          
          <div class="bay-main-compartment">
            <!-- Top bunk row: Upper (3, 6) -->
            <div class="berth-row upper-row">
              ${this.renderBerthItem(baseNum + 3, 'UB', 'Upper Berth')}
              ${this.renderBerthItem(baseNum + 6, 'UB', 'Upper Berth')}
            </div>
            <!-- Middle bunk row: Middle (2, 5) -->
            <div class="berth-row middle-row">
              ${this.renderBerthItem(baseNum + 2, 'MB', 'Middle Berth')}
              ${this.renderBerthItem(baseNum + 5, 'MB', 'Middle Berth')}
            </div>
            <!-- Lower bunk row: Lower (1, 4) -->
            <div class="berth-row lower-row">
              ${this.renderBerthItem(baseNum + 1, 'LB', 'Lower Berth')}
              ${this.renderBerthItem(baseNum + 4, 'LB', 'Lower Berth')}
            </div>
          </div>

          <!-- Aisle Walkway -->
          <div class="bay-aisle-divider">
            <span class="aisle-text">AISLE WALKWAY</span>
          </div>

          <!-- Side Compartment (Side Lower, Side Upper) -->
          <div class="bay-side-compartment">
            ${this.renderBerthItem(baseNum + 7, 'SL', 'Side Lower')}
            ${this.renderBerthItem(baseNum + 8, 'SU', 'Side Upper')}
          </div>
        </div>
      `;
    }

    return baysHtml;
  }

  generate2ALayout() {
    let baysHtml = '';
    const bayCount = 6;

    for (let bay = 0; bay < bayCount; bay++) {
      const baseNum = bay * 6;
      baysHtml += `
        <div class="coach-bay bay-2a" data-bay="${bay + 1}">
          <div class="bay-header-label">BAY ${bay + 1} (Spacious 2A)</div>
          
          <div class="bay-main-compartment">
            <div class="berth-row upper-row">
              ${this.renderBerthItem(baseNum + 2, 'UB', 'Upper Berth')}
              ${this.renderBerthItem(baseNum + 4, 'UB', 'Upper Berth')}
            </div>
            <div class="berth-row lower-row">
              ${this.renderBerthItem(baseNum + 1, 'LB', 'Lower Berth')}
              ${this.renderBerthItem(baseNum + 3, 'LB', 'Lower Berth')}
            </div>
          </div>

          <div class="bay-aisle-divider">
            <span class="aisle-text">CURTAINED AISLE</span>
          </div>

          <div class="bay-side-compartment">
            ${this.renderBerthItem(baseNum + 5, 'SL', 'Side Lower')}
            ${this.renderBerthItem(baseNum + 6, 'SU', 'Side Upper')}
          </div>
        </div>
      `;
    }

    return baysHtml;
  }

  generateCCLayout() {
    // Chair car: 3x2 seating with 8 rows
    let rowsHtml = '';
    const rowCount = 7;

    for (let r = 0; r < rowCount; r++) {
      const base = r * 5;
      rowsHtml += `
        <div class="cc-row" data-row="${r + 1}">
          <div class="cc-row-label">R${r + 1}</div>
          <!-- 3-seat side: Window, Middle, Aisle -->
          <div class="cc-triplet">
            ${this.renderBerthItem(base + 1, 'WS', 'Window Seat (Left)')}
            ${this.renderBerthItem(base + 2, 'MB', 'Middle Seat')}
            ${this.renderBerthItem(base + 3, 'AS', 'Aisle Seat')}
          </div>

          <!-- Central Walkway -->
          <div class="cc-aisle-gap"><svg class="min-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;opacity:0.6;"><line x1="12" y1="2" x2="12" y2="22" stroke-dasharray="3 3"/></svg></div>

          <!-- 2-seat side: Aisle, Window -->
          <div class="cc-pair">
            ${this.renderBerthItem(base + 4, 'AS', 'Aisle Seat')}
            ${this.renderBerthItem(base + 5, 'WS', 'Window Seat (Right)')}
          </div>
        </div>
      `;
    }

    return `<div class="cc-layout-grid">${rowsHtml}</div>`;
  }

  renderBerthItem(number, typeCode, typeLabel) {
    const isSelected = this.selectedBerth && this.selectedBerth.number === number;
    // Deterministic pseudo-reserved seats for authentic realism
    const isOccupied = (number % 7 === 2 || number % 11 === 0);

    return `
      <button 
        type="button" 
        class="berth-cell type-${typeCode.toLowerCase()} ${isSelected ? 'selected' : ''} ${isOccupied ? 'occupied' : 'available'}" 
        data-number="${number}"
        data-type="${typeCode}"
        data-label="${typeLabel}"
        ${isOccupied ? 'disabled title="Berth #' + number + ' already booked"' : 'title="Berth #' + number + ' - ' + typeLabel + ' (Available)"'}
      >
        <span class="berth-number">${number}</span>
        <span class="berth-type-tag">${typeCode}</span>
      </button>
    `;
  }

  attachShellEvents() {
    const closeBtn = this.container.querySelector('#btn-close-coach-modal');
    const backdrop = this.container.querySelector('#coach-modal-backdrop');

    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeModal();
      });
    }

    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeModal();
      });
    }

    if (this.handleKeyDown) {
      document.removeEventListener('keydown', this.handleKeyDown);
    }
    this.handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        this.closeModal();
      }
    };
    document.addEventListener('keydown', this.handleKeyDown);
  }

  attachInteriorEvents() {
    // Coach Class Tabs
    const tabs = this.container.querySelectorAll('.coach-tab-btn');
    tabs.forEach((tab) => {
      tab.addEventListener('click', (e) => {
        e.stopPropagation();
        this.activeClass = tab.dataset.class;
        this.activeCoachNo = this.getDefaultCoachName(this.activeClass);
        this.selectedBerth = null;
        this.render();
      });
    });

    // Berth Cell Click
    const berths = this.container.querySelectorAll('.berth-cell:not(.occupied)');
    berths.forEach((b) => {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        const num = parseInt(b.dataset.number, 10);
        const type = b.dataset.type;
        const label = b.dataset.label;

        this.selectedBerth = {
          number: num,
          type: type,
          typeLabel: label,
          coach: this.activeCoachNo,
          class: this.activeClass
        };

        this.render();
      });
    });

    // Apply Berth Selection CTA
    const applyBtn = this.container.querySelector('#btn-apply-berth-selection');
    if (applyBtn) {
      applyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.selectedBerth && this.onSelectBerth) {
          this.onSelectBerth(this.selectedBerth);
        }
        this.closeModal();
      });
    }
  }
}

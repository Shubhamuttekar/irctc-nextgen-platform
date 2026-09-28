import { generateQRCodeSVG } from '../utils/qrGenerator.js';
import { createBookingApi } from '../utils/apiClient.js';

export class BookingDrawer {
  constructor(containerElement, onBookingCompleteCallback) {
    this.container = containerElement;
    this.onBookingComplete = onBookingCompleteCallback;

    this.isOpen = false;
    this.step = 1; // 1: Passengers, 2: Review & Insurance, 3: Payment, 4: e-Ticket
    this.train = null;
    this.selectedClass = 'CC';
    this.baseFare = 1380;
    this.searchParams = null;
    
    // Passengers list
    this.passengers = [
      {
        id: 1,
        name: 'Rajesh Kumar Sharma',
        age: 34,
        gender: 'M',
        berthPref: 'Window (WS)',
        mealPref: 'Veg Meal',
        srCitizen: false
      }
    ];

    this.travelInsuranceOptIn = true;
    this.selectedPaymentMethod = 'upi';
    this.confirmedPnr = null;
    this.bookingTimestamp = null;
  }

  open(train, selectedClass, fare, searchParams, preferredBerth = null) {
    this.train = train;
    this.selectedClass = selectedClass;
    this.baseFare = fare;
    this.searchParams = searchParams;
    this.step = 1;
    this.isOpen = true;

    // Apply preferred berth if provided from visualizer
    if (preferredBerth && this.passengers.length > 0) {
      this.passengers[0].berthPref = `${preferredBerth.typeLabel} (${preferredBerth.type})`;
    }

    const overlay = this.ensureShell();

    requestAnimationFrame(() => {
      if (overlay) {
        overlay.classList.remove('is-closing');
        overlay.classList.add('is-open');
      }
    });

    this.render();
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    if (this.handleKeyDown) {
      document.removeEventListener('keydown', this.handleKeyDown);
      this.handleKeyDown = null;
    }
    const overlay = this.container.querySelector('.booking-drawer-overlay');
    if (overlay) {
      overlay.classList.remove('is-open');
      overlay.classList.add('is-closing');
      setTimeout(() => {
        this.container.innerHTML = '';
      }, 300);
    } else {
      this.container.innerHTML = '';
    }
  }

  ensureShell() {
    let overlay = this.container.querySelector('.booking-drawer-overlay');
    if (!overlay) {
      const trainTitle = this.train ? `${this.train.trainNo} - ${this.train.trainName}` : 'Express';
      this.container.innerHTML = `
        <div class="booking-drawer-overlay" id="booking-drawer-overlay" aria-modal="true" role="dialog">
          <div class="booking-drawer" id="booking-drawer-panel">
            <!-- Drawer Header -->
            <div class="drawer-header" id="booking-drawer-header">
              <div class="drawer-title-group">
                <span class="drawer-icon"><svg class="min-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg></span>
                <div>
                  <h2 class="drawer-title">Instant Railway Reservation</h2>
                  <p class="drawer-subtitle" id="drawer-header-subtitle">
                    ${trainTitle} • Class: <strong>${this.selectedClass}</strong>
                  </p>
                </div>
              </div>
              <button type="button" class="btn-drawer-close" id="btn-close-drawer" aria-label="Close Booking Drawer">✕</button>
            </div>

            <!-- Step Wizard Progress Bar Container -->
            <div id="drawer-wizard-container"></div>

            <!-- Drawer Body Depending on Current Step -->
            <div class="drawer-body" id="drawer-body-container"></div>

            <!-- Drawer Footer Action Bar -->
            <div id="drawer-footer-container"></div>
          </div>
        </div>
      `;
      overlay = this.container.querySelector('.booking-drawer-overlay');
      this.attachShellEvents();
    }
    return overlay;
  }

  savePassengerInputs() {
    const formCards = this.container.querySelectorAll('.passenger-form-card');
    formCards.forEach((card, i) => {
      if (this.passengers[i]) {
        const name = card.querySelector('.inp-p-name')?.value;
        const age = parseInt(card.querySelector('.inp-p-age')?.value, 10);
        const gender = card.querySelector('.inp-p-gender')?.value;
        const berthPref = card.querySelector('.inp-p-berth')?.value;
        const mealPref = card.querySelector('.inp-p-meal')?.value;
        const srCitizen = card.querySelector('.inp-p-srcitizen')?.checked;

        if (name !== undefined && name.trim() !== '') this.passengers[i].name = name.trim();
        if (!isNaN(age)) this.passengers[i].age = age;
        if (gender) this.passengers[i].gender = gender;
        if (berthPref) this.passengers[i].berthPref = berthPref;
        if (mealPref) this.passengers[i].mealPref = mealPref;
        if (srCitizen !== undefined) this.passengers[i].srCitizen = srCitizen;
      }
    });
  }

  render() {
    if (!this.isOpen) {
      this.container.innerHTML = '';
      return;
    }

    this.ensureShell();

    // Update header subtitle if train/class available
    const subtitle = this.container.querySelector('#drawer-header-subtitle');
    if (subtitle && this.train) {
      subtitle.innerHTML = `${this.train.trainNo} - ${this.train.trainName} • Class: <strong>${this.selectedClass}</strong>`;
    }

    // Update Step Wizard Progress Bar
    const wizardContainer = this.container.querySelector('#drawer-wizard-container');
    if (wizardContainer) {
      wizardContainer.innerHTML = `
        <div class="step-wizard-bar">
          <div class="wizard-step ${this.step >= 1 ? 'active' : ''} ${this.step > 1 ? 'completed' : ''}">
            <span class="step-num">1</span>
            <span class="step-name">Passengers</span>
          </div>
          <div class="wizard-connector ${this.step > 1 ? 'completed' : ''}"></div>
          <div class="wizard-step ${this.step >= 2 ? 'active' : ''} ${this.step > 2 ? 'completed' : ''}">
            <span class="step-num">2</span>
            <span class="step-name">Review & Add-ons</span>
          </div>
          <div class="wizard-connector ${this.step > 2 ? 'completed' : ''}"></div>
          <div class="wizard-step ${this.step >= 3 ? 'active' : ''} ${this.step > 3 ? 'completed' : ''}">
            <span class="step-num">3</span>
            <span class="step-name">Simulated Pay</span>
          </div>
        </div>
      `;
    }

    // Update Drawer Body Content
    const bodyContainer = this.container.querySelector('#drawer-body-container');
    if (bodyContainer) {
      bodyContainer.innerHTML = this.renderStepContent();
    }

    // Update Drawer Footer Action Bar
    const footerContainer = this.container.querySelector('#drawer-footer-container');
    if (footerContainer) {
      footerContainer.innerHTML = this.step < 4 ? `
        <div class="drawer-footer">
          <div class="fare-total-pill">
            <span class="fare-lbl">Total Fare:</span>
            <span class="fare-sum">₹${this.calculateTotalFare()}</span>
          </div>
          <div class="footer-btn-actions">
            ${this.step > 1 ? `
              <button type="button" class="btn-drawer-back" id="btn-step-back">← Back</button>
            ` : ''}
            <button type="button" class="btn-drawer-next" id="btn-step-next">
              ${this.step === 1 ? 'Continue to Review <svg class="min-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;margin-left:4px;"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>' : this.step === 2 ? 'Proceed to Instant Pay <svg class="min-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;margin-left:4px;"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>' : '<svg class="min-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;margin-right:6px;"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Confirm & Authorize Payment'}
            </button>
          </div>
        </div>
      ` : '';
    }

    this.attachStepEvents();
  }

  calculateTotalFare() {
    const passengerCount = this.passengers.length;
    const baseTotal = this.baseFare * passengerCount;
    const reservationFee = 40 * passengerCount;
    const superfastCharge = 45 * passengerCount;
    const gst = Math.round(baseTotal * 0.05);
    const insurance = this.travelInsuranceOptIn ? Math.round(0.45 * passengerCount) : 0;
    return baseTotal + reservationFee + superfastCharge + gst + insurance;
  }

  renderStepContent() {
    switch (this.step) {
      case 1:
        return this.renderStep1Passengers();
      case 2:
        return this.renderStep2Review();
      case 3:
        return this.renderStep3Payment();
      case 4:
        return this.renderStep4Ticket();
      default:
        return '';
    }
  }

  renderStep1Passengers() {
    return `
      <div class="step-content step-1">
        <div class="step-intro-banner">
          <span>Please enter passenger details exactly as stated on official Government Photo Identity cards.</span>
        </div>

        <div class="passengers-input-list">
          ${this.passengers.map((p, idx) => `
            <div class="passenger-form-card" data-idx="${idx}">
              <div class="card-top-row">
                <span class="passenger-index-tag">PASSENGER #${idx + 1}</span>
                ${this.passengers.length > 1 ? `
                  <button type="button" class="btn-remove-passenger" data-idx="${idx}" title="Remove Passenger"><svg class="min-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;margin-right:4px;"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>Remove</button>
                ` : ''}
              </div>

              <div class="passenger-grid-inputs">
                <div class="form-group span-2">
                  <label class="form-label">FULL NAME (AS PER AADHAAR / VOTER ID)</label>
                  <input type="text" class="form-input inp-p-name" value="${p.name}" placeholder="e.g. Rajesh Kumar Sharma" required/>
                </div>

                <div class="form-group">
                  <label class="form-label">AGE</label>
                  <input type="number" class="form-input inp-p-age" value="${p.age}" min="1" max="110" required/>
                </div>

                <div class="form-group">
                  <label class="form-label">GENDER</label>
                  <select class="form-select inp-p-gender">
                    <option value="M" ${p.gender === 'M' ? 'selected' : ''}>Male (M)</option>
                    <option value="F" ${p.gender === 'F' ? 'selected' : ''}>Female (F)</option>
                    <option value="T" ${p.gender === 'T' ? 'selected' : ''}>Transgender (T)</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">BERTH PREFERENCE</label>
                  <select class="form-select inp-p-berth">
                    <option value="No Preference">No Preference</option>
                    <option value="Lower Berth (LB)" ${p.berthPref.includes('Lower') && !p.berthPref.includes('Side') ? 'selected' : ''}>Lower Berth (LB)</option>
                    <option value="Middle Berth (MB)" ${p.berthPref.includes('Middle') ? 'selected' : ''}>Middle Berth (MB)</option>
                    <option value="Upper Berth (UB)" ${p.berthPref.includes('Upper') && !p.berthPref.includes('Side') ? 'selected' : ''}>Upper Berth (UB)</option>
                    <option value="Side Lower (SL)" ${p.berthPref.includes('Side Lower') ? 'selected' : ''}>Side Lower (SL)</option>
                    <option value="Side Upper (SU)" ${p.berthPref.includes('Side Upper') ? 'selected' : ''}>Side Upper (SU)</option>
                    <option value="Window (WS)" ${p.berthPref.includes('Window') ? 'selected' : ''}>Window Seat (WS)</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">ONBOARD MEAL PREFERENCE</label>
                  <select class="form-select inp-p-meal">
                    <option value="Veg Meal" ${p.mealPref === 'Veg Meal' ? 'selected' : ''}>Vegetarian (North Indian Thali)</option>
                    <option value="Non-Veg Meal" ${p.mealPref === 'Non-Veg Meal' ? 'selected' : ''}>Non-Vegetarian (Chicken Curry)</option>
                    <option value="Jain Meal" ${p.mealPref === 'Jain Meal' ? 'selected' : ''}>Jain Special (No Onion/Garlic)</option>
                    <option value="No Food" ${p.mealPref === 'No Food' ? 'selected' : ''}>Opt Out (No Food)</option>
                  </select>
                </div>
              </div>

              <div class="card-bottom-options">
                <label class="custom-checkbox">
                  <input type="checkbox" class="inp-p-srcitizen" ${p.srCitizen ? 'checked' : ''}/>
                  <span class="checkbox-indicator"></span>
                  <span class="checkbox-text">Senior Citizen Concession (Men 60+ / Women 58+)</span>
                </label>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="add-passenger-row">
          <button type="button" class="btn-add-passenger" id="btn-add-passenger" ${this.passengers.length >= 4 ? 'disabled' : ''}>
            + Add Another Passenger (Max 4 for Tatkal)
          </button>
        </div>

        <div class="contact-details-box">
          <h4 class="box-title">Ticket Notification & Contact Information</h4>
          <div class="contact-grid">
            <div class="form-group">
              <label class="form-label">MOBILE NUMBER (FOR IRCTC SMS & WHATSAPP)</label>
              <div class="input-with-icon phone-input-wrap">
                <span class="input-prefix-icon"><svg class="min-icon" viewBox="0 0 24 16" width="16" height="11" style="border-radius:2px;overflow:hidden;vertical-align:middle;margin-right:4px;"><rect width="24" height="5.33" fill="#FF9933"/><rect y="5.33" width="24" height="5.33" fill="#FFFFFF"/><rect y="10.66" width="24" height="5.33" fill="#138808"/><circle cx="12" cy="8" r="2.2" fill="none" stroke="#000080" stroke-width="0.7"/></svg>+91</span>
                <input type="tel" class="form-input" id="inp-contact-phone" value="9876543210" pattern="[0-9]{10}" required/>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">EMAIL ADDRESS (FOR DIGITAL e-TICKET PDF)</label>
              <input type="email" class="form-input" id="inp-contact-email" value="passenger@irctc.gov.in" required/>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderStep2Review() {
    const passengerCount = this.passengers.length;
    const baseTotal = this.baseFare * passengerCount;
    const reservationFee = 40 * passengerCount;
    const superfastCharge = 45 * passengerCount;
    const gst = Math.round(baseTotal * 0.05);
    const insurance = this.travelInsuranceOptIn ? Math.round(0.45 * passengerCount) : 0;
    const grandTotal = baseTotal + reservationFee + superfastCharge + gst + insurance;

    const isVandeBharat = this.train.type.includes('Vande Bharat');
    const isRajdhani = this.train.type.includes('Rajdhani');
    const isTejas = this.train.type.includes('Tejas');
    let badgeClass = 'tag-express';
    if (isVandeBharat) badgeClass = 'tag-vande-bharat';
    else if (isRajdhani) badgeClass = 'tag-rajdhani';
    else if (isTejas) badgeClass = 'tag-tejas';

    return `
      <div class="step-content step-2">
        <!-- Journey Summary Card -->
        <div class="review-journey-card">
          <div class="review-top-bar">
            <div class="train-badge-wrap">
              <span class="train-badge ${badgeClass}">${this.train.badge || this.train.type}</span>
              <strong class="t-title">${this.train.trainNo} - ${this.train.trainName}</strong>
            </div>
            <span class="quota-pill">${this.searchParams?.quota || 'GENERAL'} QUOTA</span>
          </div>

          <div class="review-route-line">
            <div class="r-point">
              <span class="r-time">${this.train.departureTime}</span>
              <span class="r-code">${this.train.fromStation}</span>
              <span class="r-name">${this.train.fromStationName}</span>
            </div>
            <div class="r-middle">
              <span class="r-dur">${this.train.duration}</span>
              <div class="r-arrow"><svg class="min-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></div>
              <span class="r-date">${this.searchParams?.journeyDate || 'Tomorrow'}</span>
            </div>
            <div class="r-point">
              <span class="r-time">${this.train.arrivalTime}</span>
              <span class="r-code">${this.train.toStation}</span>
              <span class="r-name">${this.train.toStationName}</span>
            </div>
          </div>
        </div>

        <!-- Passengers List Review -->
        <div class="review-passengers-card">
          <h4 class="card-section-title">Passenger Manifest (${this.passengers.length})</h4>
          <div class="manifest-list">
            ${this.passengers.map((p, i) => `
              <div class="manifest-item">
                <span class="m-index">#${i + 1}</span>
                <div class="m-info">
                  <strong class="m-name">${p.name}</strong>
                  <span class="m-meta">${p.age} Yrs • ${p.gender === 'M' ? 'Male' : 'Female'} • ${p.berthPref} • ${p.mealPref}</span>
                </div>
                <span class="m-status-pill">CONFIRMED (CNF)</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- IRCTC Travel Insurance Opt-In -->
        <div class="review-insurance-card">
          <div class="insurance-content-row">
            <div class="ins-icon"><svg class="min-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
            <div class="ins-text">
              <strong>Official IRCTC Travel Insurance (Accidental cover up to ₹10 Lakhs)</strong>
              <p>Nominal premium of only ₹0.45 per passenger. Highly recommended by Ministry of Railways.</p>
            </div>
            <label class="custom-toggle">
              <input type="checkbox" id="chk-insurance-opt" ${this.travelInsuranceOptIn ? 'checked' : ''}/>
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>

        <!-- Detailed Fare Breakdown Table -->
        <div class="review-fare-card fare-breakup-card">
          <h4 class="card-section-title">Detailed Fare Breakup (CRIS Tariff Rules)</h4>
          <div class="fare-rows detailed-fare-breakup">
            <div class="fare-row">
              <span class="f-label">Base Fare (${this.passengers.length} × ₹${this.baseFare})</span>
              <span class="f-amount">₹${baseTotal}</span>
            </div>
            <div class="fare-row">
              <span class="f-label">Reservation Charge (CRIS)</span>
              <span class="f-amount">₹${reservationFee}</span>
            </div>
            <div class="fare-row">
              <span class="f-label">Superfast Surcharge</span>
              <span class="f-amount">₹${superfastCharge}</span>
            </div>
            <div class="fare-row">
              <span class="f-label">Goods & Services Tax (GST @ 5% on AC)</span>
              <span class="f-amount">₹${gst}</span>
            </div>
            <div class="fare-row">
              <span class="f-label">Travel Insurance Premium</span>
              <span class="f-amount">₹${insurance}</span>
            </div>
            <div class="fare-row total-row grand-total-row">
              <strong class="f-label">Total Amount Payable</strong>
              <strong class="text-saffron total-amount f-amount">₹${grandTotal}</strong>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderStep3Payment() {
    const totalAmount = this.calculateTotalFare();

    return `
      <div class="step-content step-3">
        <div class="pay-amount-banner">
          <div class="pay-banner-left">
            <span class="pay-lbl">TOTAL AMOUNT TO PAY</span>
            <span class="pay-price">₹${totalAmount}</span>
          </div>
          <div class="pay-banner-right">
            <span class="secure-badge"><svg class="min-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;margin-right:4px;"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>SIMULATED DEMO PAYMENT FLOW</span>
          </div>
        </div>

        <div class="payment-tabs-layout">
          <!-- Left: Payment Methods Selector -->
          <div class="pay-methods-nav">
            <button type="button" class="pay-nav-btn ${this.selectedPaymentMethod === 'upi' ? 'active' : ''}" data-method="upi">
              <span class="m-icon"><svg class="min-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></span>
              <span>Instant UPI / QR Scan</span>
            </button>
            <button type="button" class="pay-nav-btn ${this.selectedPaymentMethod === 'imudra' ? 'active' : ''}" data-method="imudra">
              <span class="m-icon"><svg class="min-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg></span>
              <span>IRCTC iMudra Wallet</span>
            </button>
            <button type="button" class="pay-nav-btn ${this.selectedPaymentMethod === 'cards' ? 'active' : ''}" data-method="cards">
              <span class="m-icon"><svg class="min-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/><circle cx="7" cy="15" r="1"/></svg></span>
              <span>Credit / Debit Cards</span>
            </button>
            <button type="button" class="pay-nav-btn ${this.selectedPaymentMethod === 'netbanking' ? 'active' : ''}" data-method="netbanking">
              <span class="m-icon"><svg class="min-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><line x1="9" x2="9" y1="22" y2="12"/><line x1="15" x2="15" y1="12" y2="22"/><line x1="4" x2="20" y1="9" y2="9"/></svg></span>
              <span>Net Banking (SBI / HDFC)</span>
            </button>
          </div>

          <!-- Right: Payment Method Form Container -->
          <div class="pay-method-panel">
            ${this.renderSelectedPaymentPanel(totalAmount)}
          </div>
        </div>
      </div>
    `;
  }

  renderSelectedPaymentPanel(totalAmount) {
    if (this.selectedPaymentMethod === 'upi') {
      return `
        <div class="upi-pay-panel">
          <h4 class="panel-heading">Scan UPI QR Code to Pay</h4>
          <p class="panel-desc">Open any UPI App (BHIM, Google Pay, PhonePe, Paytm) and scan this dynamic QR code.</p>
          
          <div class="upi-qr-display-box">
            ${generateQRCodeSVG(`upi://pay?pa=irctc@icici&pn=IRCTC%20RAILWAYS&am=${totalAmount}&cu=INR&tn=TRAIN_TICKET`, 170)}
            <span class="qr-timer-pulse"><svg class="min-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;margin-right:4px;"><path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/></svg>QR Active for 04:59 mins</span>
          </div>

          <div class="upi-vpa-manual">
            <span class="or-divider">─── OR ENTER UPI ID / VPA ───</span>
            <div class="vpa-input-wrap">
              <input type="text" class="form-input" id="inp-vpa-id" placeholder="username@okhdfcbank" value="passenger@upi"/>
              <button type="button" class="btn-verify-vpa">Verify & Pay</button>
            </div>
          </div>
        </div>
      `;
    } else if (this.selectedPaymentMethod === 'imudra') {
      return `
        <div class="imudra-pay-panel">
          <div class="imudra-header">
            <span class="imudra-logo">IRCTC iMudra</span>
            <span class="imudra-bal">Balance: ₹12,450.00</span>
          </div>
          <p>Instant zero-convenience fee checkout with authorized IRCTC digital wallet.</p>
          <div class="form-group">
            <label class="form-label">ENTER 4-DIGIT TRANSACTION PIN</label>
            <input type="password" class="form-input imudra-pin" maxlength="4" value="9876" placeholder="● ● ● ●"/>
          </div>
          <span class="imudra-perk"><svg class="min-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;margin-right:4px;color:var(--status-green);"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>Instant auto-refund within 2 hours in case of cancellation.</span>
        </div>
      `;
    } else if (this.selectedPaymentMethod === 'cards') {
      return `
        <div class="cards-pay-panel">
          <h4 class="panel-heading">Credit / Debit Card</h4>
          <div class="form-group">
            <label class="form-label">CARD NUMBER</label>
            <input type="text" class="form-input" placeholder="4532 •••• •••• 8892" value="4532 8912 3456 8892"/>
          </div>
          <div class="card-inline-grid">
            <div class="form-group">
              <label class="form-label">EXPIRY</label>
              <input type="text" class="form-input" placeholder="MM/YY" value="09/29"/>
            </div>
            <div class="form-group">
              <label class="form-label">CVV / CVC</label>
              <input type="password" class="form-input" maxlength="3" placeholder="•••" value="882"/>
            </div>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="netbanking-pay-panel">
          <h4 class="panel-heading">Select Bank For Net Banking</h4>
          <div class="bank-chips-grid">
            <button type="button" class="bank-chip active">State Bank of India (SBI)</button>
            <button type="button" class="bank-chip">HDFC Bank</button>
            <button type="button" class="bank-chip">ICICI Bank</button>
            <button type="button" class="bank-chip">Punjab National Bank</button>
            <button type="button" class="bank-chip">Bank of Baroda</button>
            <button type="button" class="bank-chip">Axis Bank</button>
          </div>
        </div>
      `;
    }
  }

  renderStep4Ticket() {
    const pnr = this.confirmedPnr || '2948172940';
    const totalFare = this.calculateTotalFare();
    const qrData = `IRCTC-ERS|PNR:${pnr}|TRAIN:${this.train.trainNo}|CLASS:${this.selectedClass}|DATE:${this.searchParams?.journeyDate || '2026-09-24'}|AUTH:CRIS_SHA256_VERIFIED`;
    const coachAssigned = this.selectedClass === 'CC' ? 'C2' : this.selectedClass === 'EC' ? 'E1' : 'B3';

    return `
      <div class="step-content step-4 ticket-screen-view">
        <!-- Booking Success Confirmation Alert -->
        <div class="ticket-success-alert animate-scale-up">
          <div class="success-icon-wrap">✓</div>
          <div>
            <h3 class="success-title">Booking Confirmed Successfully!</h3>
            <p class="success-msg">Your Electronic Reservation Slip (ERS) has been generated and sent via SMS and Email.</p>
          </div>
        </div>

        <!-- Official IRCTC Digital e-Ticket (Printable & Downloadable ERS) -->
        <div class="official-ers-ticket" id="official-ers-printable-ticket">
          <!-- Ticket Header with Authentic Insignias -->
          <div class="ers-header-row">
            <div class="ers-logo-left">
              <img src="assets/icons/lion_capital.svg" alt="Lion Capital Emblem" class="ers-emblem-img"/>
              <div class="ers-gov-text">
                <strong>GOVERNMENT OF INDIA</strong>
                <span>MINISTRY OF RAILWAYS</span>
                <span class="ers-tag-hindi">भारतीय रेल • INDIAN RAILWAYS</span>
              </div>
            </div>

            <div class="ers-logo-center">
              <img src="assets/icons/indian_railways_seal.svg" alt="Indian Railways Seal" class="ers-seal-img"/>
            </div>

            <div class="ers-logo-right">
              <img src="assets/icons/irctc_logo.svg" alt="IRCTC Logo" class="ers-irctc-img"/>
            </div>
          </div>

          <!-- Tricolor Divider Ribbon -->
          <div class="ers-tricolor-divider"></div>

          <!-- Main ERS Ticket Title Strip -->
          <div class="ers-title-strip">
            <span class="ers-doc-name">ELECTRONIC RESERVATION SLIP (ERS) - CONFIRMED</span>
            <span class="ers-rules-ref">IRCTC / CRIS e-Ticketing System (Rule 1989 Section 53)</span>
          </div>

          <!-- Core PNR & Security Matrix Row -->
          <div class="ers-pnr-security-row">
            <div class="ers-pnr-col">
              <span class="ers-lbl">PNR NUMBER</span>
              <span class="ers-pnr-digits">${pnr}</span>
              <span class="ers-subtext">Transaction ID: IRCTC${Date.now().toString().slice(-8)}</span>
            </div>

            <div class="ers-qr-col">
              ${generateQRCodeSVG(qrData, 130)}
              <span class="qr-verify-caption">CRIS SECURE QR</span>
            </div>

            <div class="ers-quota-col">
              <span class="ers-lbl">CLASS & QUOTA</span>
              <span class="ers-val-big">${this.selectedClass} • ${this.searchParams?.quota || 'GENERAL'}</span>
              <span class="ers-subtext">Booked On: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>

          <!-- Train Journey Details Table -->
          <div class="ers-journey-table">
            <div class="ers-j-col">
              <span class="j-col-head">Train No. & Name</span>
              <strong class="j-col-body">${this.train.trainNo} / ${this.train.trainName}</strong>
            </div>
            <div class="ers-j-col">
              <span class="j-col-head">From (Station Code)</span>
              <strong class="j-col-body">${this.train.fromStationName} (${this.train.fromStation})</strong>
            </div>
            <div class="ers-j-col">
              <span class="j-col-head">To (Station Code)</span>
              <strong class="j-col-body">${this.train.toStationName} (${this.train.toStation})</strong>
            </div>
            <div class="ers-j-col">
              <span class="j-col-head">Departure Time</span>
              <strong class="j-col-body">${this.train.departureTime} IST</strong>
            </div>
            <div class="ers-j-col">
              <span class="j-col-head">Arrival Time</span>
              <strong class="j-col-body">${this.train.arrivalTime} IST</strong>
            </div>
            <div class="ers-j-col">
              <span class="j-col-head">Date of Journey</span>
              <strong class="j-col-body">${this.searchParams?.journeyDate || 'Tomorrow'}</strong>
            </div>
          </div>

          <!-- Passenger Manifest Table -->
          <div class="ers-passengers-section">
            <span class="ers-section-title">PASSENGER DETAILS & BERTH ALLOCATION</span>
            <table class="ers-table" role="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Passenger Name</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Booking Status</th>
                  <th>Current Status</th>
                  <th>Coach / Berth / Quota</th>
                </tr>
              </thead>
              <tbody>
                ${this.passengers.map((p, idx) => `
                  <tr>
                    <td>${idx + 1}</td>
                    <td><strong>${p.name}</strong></td>
                    <td>${p.age}</td>
                    <td>${p.gender}</td>
                    <td><span class="badge-green-clean">CNF</span></td>
                    <td><strong class="text-green">CONFIRMED</strong></td>
                    <td><strong>Coach: ${coachAssigned} / Seat: ${18 + idx * 2} (${p.berthPref})</strong></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Fare Breakdown & Payment Confirmation -->
          <div class="ers-fare-strip">
            <div class="ers-fare-item">
              <span class="f-lbl">Ticket Fare:</span>
              <span class="f-val">₹${this.baseFare * this.passengers.length}</span>
            </div>
            <div class="ers-fare-item">
              <span class="f-lbl">IRCTC Convenience Fee:</span>
              <span class="f-val">₹15.00</span>
            </div>
            <div class="ers-fare-item">
              <span class="f-lbl">Travel Insurance:</span>
              <span class="f-val">${this.travelInsuranceOptIn ? `₹${(0.45 * this.passengers.length).toFixed(2)}` : 'N/A'}</span>
            </div>
            <div class="ers-fare-item total">
              <span class="f-lbl">Total Paid:</span>
              <span class="f-val text-saffron">₹${totalFare}</span>
            </div>
            <div class="ers-fare-item status">
              <span class="f-lbl">Payment Status:</span>
              <span class="badge-paid">PAID (SUCCESS)</span>
            </div>
          </div>

          <!-- Statutory Advisory Notes -->
          <div class="ers-footer-rules">
            <p><strong>IMPORTANT PASSENGER INSTRUCTIONS:</strong></p>
            <ol>
              <li>One of the passengers booked on this E-ticket must carry an original valid Govt. photo identity card (Aadhaar, Passport, Voter ID, Driving Licence) during the journey.</li>
              <li>Valid with Indian Railways Train Ticket Examiner (TTE) digital handheld terminal verification.</li>
              <li>Chart preparation will take place 4 hours before the departure of the train from source station.</li>
            </ol>
          </div>
        </div>

        <!-- Action CTAs: Print / Download e-Ticket -->
        <div class="ticket-actions-bar">
          <button type="button" class="btn-print-ticket" id="btn-print-ers-ticket">
            <svg class="min-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;margin-right:6px;"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>Print / Save PDF Ticket
          </button>
          <button type="button" class="btn-new-booking" id="btn-start-new-booking">
            + Book Another Ticket
          </button>
        </div>
      </div>
    `;
  }

  attachShellEvents() {
    const overlay = this.container.querySelector('#booking-drawer-overlay');
    const closeBtn = this.container.querySelector('#btn-close-drawer');

    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.close();
      });
    }

    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          e.stopPropagation();
          this.close();
        }
      });
    }

    if (this.handleKeyDown) {
      document.removeEventListener('keydown', this.handleKeyDown);
    }
    this.handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        this.close();
      }
    };
    document.addEventListener('keydown', this.handleKeyDown);
  }

  attachStepEvents() {
    const nextBtn = document.getElementById('btn-step-next');
    const backBtn = document.getElementById('btn-step-back');

    // Step 1: Add passenger
    const addPassengerBtn = document.getElementById('btn-add-passenger');
    if (addPassengerBtn) {
      addPassengerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.passengers.length < 4) {
          this.savePassengerInputs();
          this.passengers.push({
            id: this.passengers.length + 1,
            name: `Passenger ${this.passengers.length + 1}`,
            age: 30,
            gender: 'M',
            berthPref: 'No Preference',
            mealPref: 'Veg Meal',
            srCitizen: false
          });
          this.render();
        }
      });
    }

    // Step 1: Remove passenger
    const removeBtns = this.container.querySelectorAll('.btn-remove-passenger');
    removeBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.savePassengerInputs();
        const idx = parseInt(btn.dataset.idx, 10);
        if (this.passengers.length > 1) {
          this.passengers.splice(idx, 1);
          this.render();
        }
      });
    });

    // Step 2: Insurance toggle
    const insuranceToggle = document.getElementById('chk-insurance-opt');
    if (insuranceToggle) {
      insuranceToggle.addEventListener('change', (e) => {
        e.stopPropagation();
        this.travelInsuranceOptIn = insuranceToggle.checked;
        this.render();
      });
    }

    // Step 3: Payment method nav
    const payNavBtns = this.container.querySelectorAll('.pay-nav-btn');
    payNavBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectedPaymentMethod = btn.dataset.method;
        this.render();
      });
    });

    // Step 4: Print ticket
    const printTicketBtn = document.getElementById('btn-print-ers-ticket');
    if (printTicketBtn) {
      printTicketBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.print();
      });
    }

    // Step 4: Book another ticket
    const newBookingBtn = document.getElementById('btn-start-new-booking');
    if (newBookingBtn) {
      newBookingBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.close();
      });
    }

    // Wizard Next Button
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.step === 1) {
          this.savePassengerInputs();
          this.step = 2;
          this.render();
        } else if (this.step === 2) {
          this.step = 3;
          this.render();
        } else if (this.step === 3) {
          nextBtn.disabled = true;
          nextBtn.innerHTML = '<svg class="min-icon spin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;margin-right:6px;"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Authorizing & Reserving in SQLite PRS...';

          (async () => {
            try {
              const res = await createBookingApi({
                trainNo: this.train.trainNo,
                classCode: this.selectedClass,
                journeyDate: this.searchParams?.journeyDate || '2026-09-25',
                quota: this.searchParams?.quota || 'GN',
                passengers: this.passengers,
                travelInsurance: this.travelInsuranceOptIn,
                paymentMethod: this.selectedPaymentMethod === 'upi' ? 'UPI / BHIM' : (this.selectedPaymentMethod === 'card' ? 'Debit/Credit Card' : 'IRCTC NetBanking')
              });

              this.confirmedPnr = res.pnr;
              this.bookingResult = res;
              this.bookingTimestamp = res.createdAt || new Date().toISOString();
              this.step = 4;
              this.render();

              if (this.onBookingComplete) {
                this.onBookingComplete(res);
              }
            } catch (err) {
              console.error('Booking failed:', err);
              alert('Booking error: ' + err.message);
              nextBtn.disabled = false;
              nextBtn.innerHTML = 'Pay & Book Ticket';
            }
          })();
        }
      });
    }

    // Wizard Back Button
    if (backBtn) {
      backBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.step > 1) {
          this.step -= 1;
          this.render();
        }
      });
    }
  }
}

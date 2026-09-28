/**
 * IRCTC Capsule Navigation Bar Component (Reconstructed & Rebuilt)
 * UI/UX Pro Max Edition:
 * [ HOME | TRAINS | MEALS | LOYALTY | E-WALLET | ALERTS | CONTACT US ]
 * - Full ARIA accessibility, 26x26px fixed-dimension icon badges, hover bridge flyouts
 * - Hover-Intent Grace Buffer (300ms debounce delay) eliminating vanishing menu bug
 * - Content-hugging adaptive width & warm saffron/amber palette
 * - All official IRCTC services including Wheelchair, Boarding Change, Luggage, Pets, and Aadhaar Linking
 * - Keyboard navigation (Arrow Up/Down/Left/Right, Enter, Escape, Home, End)
 */

export class HeaderCapsule {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.onNavigate = options.onNavigate || (() => {});
    this.activeItem = 'home';
    this.openDropdown = null;
    this.hoverTimeout = null; // 300ms hover-intent buffer timer

    this.init();
  }

  init() {
    this.render();
    this.attachEvents();
    this.renderModals();
  }

  render() {
    this.container.innerHTML = `
      <div class="capsule-nav-bar" role="menubar" aria-label="Official Railway Navigation">
        <div class="capsule-pill">
          <!-- 1. HOME -->
          <button type="button" class="capsule-btn ${this.activeItem === 'home' ? 'active' : ''}" role="menuitem" data-nav="home" id="capsule-btn-home">
            <span data-i18n="nav_home">HOME</span>
          </button>

          <!-- 2. TRAINS (Dropdown List) -->
          <div class="capsule-dropdown-wrap" data-menu="trains">
            <button 
              type="button" 
              class="capsule-btn has-dropdown ${this.activeItem === 'trains' ? 'active' : ''}" 
              role="menuitem"
              aria-haspopup="true" 
              aria-expanded="false" 
              id="capsule-btn-trains"
              aria-controls="dropdown-menu-trains"
              data-nav="trains"
            >
              <span data-i18n="nav_trains">TRAINS</span>
              <span class="capsule-caret" aria-hidden="true">▾</span>
            </button>
            <div 
              class="capsule-dropdown-menu dropdown-list-menu" 
              id="dropdown-menu-trains" 
              role="menu" 
              aria-labelledby="capsule-btn-trains" 
              aria-label="Trains Menu"
            >
              <!-- Section 1: Ticketing & Reservations -->
              <div class="dropdown-section-header" role="presentation">TICKETING &amp; BOOKING</div>
              
              <a href="#" class="dropdown-list-item" data-action="book-tickets" role="menuitem" tabindex="-1">
                <span class="d-icon-badge"><svg class="d-icon-svg" viewBox="0 0 24 24"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><line x1="13" y1="5" x2="13" y2="19" stroke-dasharray="2 2"/></svg></span>
                <span class="d-text" data-i18n="action_book_ticket">Book Ticket</span>
              </a>
              <a href="#" class="dropdown-list-item" data-action="foreign-tourist" role="menuitem" tabindex="-1">
                <span class="d-icon-badge"><svg class="d-icon-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></span>
                <span class="d-text" data-i18n="action_foreign_tourist">Foreign Tourist Booking</span>
              </a>
              <a href="#" class="dropdown-list-item" data-action="connecting-journey" role="menuitem" tabindex="-1">
                <span class="d-icon-badge"><svg class="d-icon-svg" viewBox="0 0 24 24"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l6.73-1.19"/></svg></span>
                <span class="d-text" data-i18n="action_connecting">Connecting Journey Booking</span>
              </a>
              
              <!-- Sub-Flyout: IRCTC Trains with Hover Bridge -->
              <div class="dropdown-subitem-wrap">
                <a href="#" class="dropdown-list-item has-flyout" data-action="irctc-trains" role="menuitem" aria-haspopup="true" aria-expanded="false" tabindex="-1">
                  <span class="d-icon-badge"><svg class="d-icon-svg" viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="15" rx="3"/><line x1="4" y1="11" x2="20" y2="11"/><line x1="8" y1="15" x2="8.01" y2="15"/><line x1="16" y1="15" x2="16.01" y2="15"/><path d="m5 18-2 3M19 18l2 3"/></svg></span>
                  <span class="d-text">IRCTC Trains</span>
                  <span class="d-arrow" aria-hidden="true">›</span>
                </a>
                <div class="dropdown-flyout-sublist" role="menu" aria-label="IRCTC Trains Submenu">
                  <div class="dropdown-section-header" role="presentation">PREMIER EXPRESS SERVICES</div>
                  <a href="#" class="flyout-item" data-action="vande-bharat-trains" role="menuitem" tabindex="-1">
                    <span class="d-icon-badge"><svg class="d-icon-svg" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></span>
                    <span class="d-text">Vande Bharat 2.0 Express</span>
                  </a>
                  <a href="#" class="flyout-item" data-action="tejas-trains" role="menuitem" tabindex="-1">
                    <span class="d-icon-badge"><svg class="d-icon-svg" viewBox="0 0 24 24"><path d="m12 3 1.91 5.09L19 10l-5.09 1.91L12 17l-1.91-5.09L5 10l5.09-1.91Z"/><path d="M19 16l.95 2.05L22 19l-2.05.95L19 22l-.95-2.05L16 19l2.05-.95Z"/></svg></span>
                    <span class="d-text">Tejas Corporate Express</span>
                  </a>
                  <a href="#" class="flyout-item" data-action="amrit-bharat-trains" role="menuitem" tabindex="-1">
                    <span class="d-icon-badge"><svg class="d-icon-svg" viewBox="0 0 24 24"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg></span>
                    <span class="d-text">Amrit Bharat Express</span>
                  </a>
                </div>
              </div>

              <a href="#" class="dropdown-list-item" data-action="group-booking" role="menuitem" tabindex="-1">
                <span class="d-icon-badge"><svg class="d-icon-svg" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
                <span class="d-text">Group Booking</span>
              </a>

              <div class="dropdown-divider" role="separator"></div>

              <!-- Section 2: Enquiry & Live Services -->
              <div class="dropdown-section-header" role="presentation">ENQUIRY &amp; SPECIAL SERVICES</div>

              <a href="#" class="dropdown-list-item" data-action="pnr-status" role="menuitem" tabindex="-1">
                <span class="d-icon-badge"><svg class="d-icon-svg" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
                <span class="d-text">PNR Enquiry</span>
              </a>
              <a href="#" class="dropdown-list-item" data-action="track-train" role="menuitem" tabindex="-1">
                <span class="d-icon-badge"><svg class="d-icon-svg" viewBox="0 0 24 24"><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1"/></svg></span>
                <span class="d-text">Track Your Train (NTES Live GPS)</span>
              </a>
              <a href="#" class="dropdown-list-item" data-action="train-schedule" role="menuitem" tabindex="-1">
                <span class="d-icon-badge"><svg class="d-icon-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span>
                <span class="d-text">Train Schedule &amp; Timetable</span>
              </a>
              <a href="#" class="dropdown-list-item" data-action="coach-layouts" role="menuitem" tabindex="-1">
                <span class="d-icon-badge"><svg class="d-icon-svg" viewBox="0 0 24 24"><path d="M4 18v3M20 18v3M6 18h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2zM6 6V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"/></svg></span>
                <span class="d-text">Coach Layouts (3A, 2A, SL, CC)</span>
              </a>
              <a href="#" class="dropdown-list-item" data-action="wheelchair-booking" role="menuitem" tabindex="-1">
                <span class="d-icon-badge"><svg class="d-icon-svg" viewBox="0 0 24 24"><circle cx="9" cy="4" r="2"/><path d="M9 7v6h4l3 5"/><path d="m15 13-3-3H7"/><circle cx="9" cy="17" r="4"/></svg></span>
                <span class="d-text" data-i18n="action_wheelchair">Book Wheelchair / Divyangjan Assistant</span>
              </a>

              <div class="dropdown-divider" role="separator"></div>

              <!-- Section 3: Modifications, Luggage & Cancellation -->
              <div class="dropdown-section-header" role="presentation">MODIFICATIONS, LUGGAGE &amp; CLAIMS</div>

              <a href="#" class="dropdown-list-item" data-action="change-boarding" role="menuitem" tabindex="-1">
                <span class="d-icon-badge"><svg class="d-icon-svg" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></span>
                <span class="d-text" data-i18n="action_boarding_change">Change Boarding Point Status</span>
              </a>
              <a href="#" class="dropdown-list-item" data-action="cancel-ticket" role="menuitem" tabindex="-1">
                <span class="d-icon-badge"><svg class="d-icon-svg" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span>
                <span class="d-text">Cancel E-Ticket</span>
              </a>
              <a href="#" class="dropdown-list-item" data-action="counter-ticket" role="menuitem" tabindex="-1">
                <span class="d-icon-badge"><svg class="d-icon-svg" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></span>
                <span class="d-text">Counter Ticket Cancellation</span>
              </a>
              <a href="#" class="dropdown-list-item" data-action="luggage-booking" role="menuitem" tabindex="-1">
                <span class="d-icon-badge"><svg class="d-icon-svg" viewBox="0 0 24 24"><rect x="6" y="7" width="12" height="14" rx="2"/><path d="M9 7V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v3"/><line x1="12" y1="11" x2="12" y2="17"/></svg></span>
                <span class="d-text" data-i18n="action_luggage">Luggage Booking</span>
              </a>
              <a href="#" class="dropdown-list-item" data-action="pets-booking" role="menuitem" tabindex="-1">
                <span class="d-icon-badge"><svg class="d-icon-svg" viewBox="0 0 24 24"><circle cx="7" cy="8" r="2"/><circle cx="17" cy="8" r="2"/><circle cx="12" cy="5" r="2"/><path d="M12 12c-3 0-5 2-5 5 0 2 2 4 5 4s5-2 5-4c0-3-2-5-5-5z"/></svg></span>
                <span class="d-text" data-i18n="action_pets">Pets (Dog / Cat) Booking</span>
              </a>
              <a href="#" class="dropdown-list-item" data-action="insurance-claim" role="menuitem" tabindex="-1">
                <span class="d-icon-badge"><svg class="d-icon-svg" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></span>
                <span class="d-text">Travel Insurance Claim</span>
              </a>
              <a href="#" class="dropdown-list-item" data-action="ftr-charter" role="menuitem" tabindex="-1">
                <span class="d-icon-badge"><svg class="d-icon-svg" viewBox="0 0 24 24"><path d="m20.59 13.41-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg></span>
                <span class="d-text">FTR Coach / Train Booking</span>
              </a>
            </div>
          </div>

          <!-- 3. MEALS (Dropdown List) -->
          <div class="capsule-dropdown-wrap" data-menu="meals">
            <button 
              type="button" 
              class="capsule-btn has-dropdown ${this.activeItem === 'meals' ? 'active' : ''}" 
              role="menuitem"
              aria-haspopup="true" 
              aria-expanded="false" 
              id="capsule-btn-meals"
              aria-controls="dropdown-menu-meals"
              data-nav="meals"
            >
              <span data-i18n="nav_meals">MEALS</span>
              <span class="capsule-caret" aria-hidden="true">▾</span>
            </button>
            <div 
              class="capsule-dropdown-menu dropdown-list-menu" 
              id="dropdown-menu-meals" 
              role="menu" 
              aria-labelledby="capsule-btn-meals" 
              aria-label="Meals Menu"
            >
              <div class="dropdown-section-header" role="presentation">ON-TRACK CATERING</div>
              <a href="#" class="dropdown-list-item" data-action="order-ecatering" role="menuitem" tabindex="-1">
                <span class="d-icon-badge"><svg class="d-icon-svg" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="12" y1="12" x2="12" y2="20"/><circle cx="7.5" cy="8" r="1.5"/></svg></span>
                <span class="d-text">Order Food – E-Catering (Seat Delivery)</span>
              </a>
              <a href="#" class="dropdown-list-item" data-action="book-epantry" role="menuitem" tabindex="-1">
                <span class="d-icon-badge"><svg class="d-icon-svg" viewBox="0 0 24 24"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg></span>
                <span class="d-text">Book Food – E-Pantry</span>
              </a>
              <div class="dropdown-divider" role="separator"></div>
              <div class="dropdown-section-header" role="presentation">TARIFF &amp; POLICIES</div>
              <a href="#" class="dropdown-list-item" data-action="cooked-food-menu" role="menuitem" tabindex="-1">
                <span class="d-icon-badge"><svg class="d-icon-svg" viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg></span>
                <span class="d-text">Cooked Food Menu &amp; Standard Tariff</span>
              </a>
            </div>
          </div>

          <!-- 4. LOYALTY (Dropdown List) -->
          <div class="capsule-dropdown-wrap" data-menu="loyalty">
            <button 
              type="button" 
              class="capsule-btn has-dropdown ${this.activeItem === 'loyalty' ? 'active' : ''}" 
              role="menuitem"
              aria-haspopup="true" 
              aria-expanded="false" 
              id="capsule-btn-loyalty"
              aria-controls="dropdown-menu-loyalty"
              data-nav="loyalty"
            >
              <span data-i18n="nav_loyalty">LOYALTY</span>
              <span class="capsule-caret" aria-hidden="true">▾</span>
            </button>
            <div 
              class="capsule-dropdown-menu dropdown-list-menu" 
              id="dropdown-menu-loyalty" 
              role="menu" 
              aria-labelledby="capsule-btn-loyalty" 
              aria-label="Loyalty Menu"
            >
              <div class="dropdown-section-header" role="presentation">PROGRAM DETAILS</div>
              <a href="#" class="dropdown-list-item" data-action="loyalty-about" role="menuitem" tabindex="-1">
                <span class="d-icon-badge"><svg class="d-icon-svg" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg></span>
                <span class="d-text">About IRCTC Loyalty Program</span>
              </a>
              <a href="#" class="dropdown-list-item" data-action="loyalty-compare" role="menuitem" tabindex="-1">
                <span class="d-icon-badge"><svg class="d-icon-svg" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></span>
                <span class="d-text">Compare Co-Brand Cards</span>
              </a>
              <div class="dropdown-divider" role="separator"></div>
              <div class="dropdown-section-header" role="presentation">CO-BRANDED CREDIT CARDS</div>
              <a href="#" class="dropdown-list-item" data-action="card-sbi" role="menuitem" tabindex="-1">
                <span class="d-icon-badge"><svg class="d-icon-svg" viewBox="0 0 24 24"><polygon points="12 2 22 12 12 22 2 12 12 2"/></svg></span>
                <span class="d-text">IRCTC SBI RuPay Credit Card</span>
              </a>
              <a href="#" class="dropdown-list-item" data-action="card-bob" role="menuitem" tabindex="-1">
                <span class="d-icon-badge"><svg class="d-icon-svg" viewBox="0 0 24 24"><polygon points="12 2 22 12 12 22 2 12 12 2"/></svg></span>
                <span class="d-text">IRCTC Bank of Baroda Credit Card</span>
              </a>
              <a href="#" class="dropdown-list-item" data-action="card-hdfc" role="menuitem" tabindex="-1">
                <span class="d-icon-badge"><svg class="d-icon-svg" viewBox="0 0 24 24"><polygon points="12 2 22 12 12 22 2 12 12 2"/></svg></span>
                <span class="d-text">IRCTC HDFC Bank Credit Card</span>
              </a>
              <a href="#" class="dropdown-list-item" data-action="card-rbl" role="menuitem" tabindex="-1">
                <span class="d-icon-badge"><svg class="d-icon-svg" viewBox="0 0 24 24"><polygon points="12 2 22 12 12 22 2 12 12 2"/></svg></span>
                <span class="d-text">IRCTC RBL Bank Credit Card</span>
              </a>
              <div class="dropdown-divider" role="separator"></div>
              <div class="dropdown-section-header" role="presentation">ACCOUNT MANAGEMENT</div>
              <a href="#" class="dropdown-list-item" data-action="link-loyalty" role="menuitem" tabindex="-1">
                <span class="d-icon-badge"><svg class="d-icon-svg" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></span>
                <span class="d-text">Add / Link Loyalty Account</span>
              </a>
              <a href="#" class="dropdown-list-item" data-action="link-aadhaar" role="menuitem" tabindex="-1">
                <span class="d-icon-badge"><svg class="d-icon-svg" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><line x1="15" y1="9" x2="17" y2="9"/><line x1="15" y1="13" x2="17" y2="13"/><path d="M6 16c0-1.5 1.5-2.5 3-2.5s3 1 3 2.5"/></svg></span>
                <span class="d-text" data-i18n="action_aadhaar">Link Your Aadhaar</span>
              </a>
            </div>
          </div>

          <!-- 5. E-WALLET (Dropdown List) -->
          <div class="capsule-dropdown-wrap" data-menu="ewallet">
            <button 
              type="button" 
              class="capsule-btn has-dropdown ${this.activeItem === 'ewallet' ? 'active' : ''}" 
              role="menuitem"
              aria-haspopup="true" 
              aria-expanded="false" 
              id="capsule-btn-ewallet"
              aria-controls="dropdown-menu-ewallet"
              data-nav="ewallet"
            >
              <span data-i18n="nav_ewallet">E-WALLET</span>
              <span class="capsule-caret" aria-hidden="true">▾</span>
            </button>
            <div 
              class="capsule-dropdown-menu dropdown-list-menu" 
              id="dropdown-menu-ewallet" 
              role="menu" 
              aria-labelledby="capsule-btn-ewallet" 
              aria-label="E-Wallet Menu"
            >
              <div class="dropdown-section-header" role="presentation">INSTANT WALLET RESERVATION</div>
              <a href="#" class="dropdown-list-item" data-action="ewallet-about" role="menuitem" tabindex="-1">
                <span class="d-icon-badge"><svg class="d-icon-svg" viewBox="0 0 24 24"><path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/><path d="M16 12h5a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-5a2 2 0 0 1-2-2v0a2 2 0 0 1 2-2z"/></svg></span>
                <span class="d-text">About IRCTC eWallet</span>
              </a>
              <a href="#" class="dropdown-list-item" data-action="ewallet-guide" role="menuitem" tabindex="-1">
                <span class="d-icon-badge"><svg class="d-icon-svg" viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></span>
                <span class="d-text">IRCTC eWallet User Guide &amp; FAQs</span>
              </a>
              <a href="#" class="dropdown-list-item" data-action="link-aadhaar" role="menuitem" tabindex="-1">
                <span class="d-icon-badge"><svg class="d-icon-svg" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><line x1="15" y1="9" x2="17" y2="9"/><line x1="15" y1="13" x2="17" y2="13"/><path d="M6 16c0-1.5 1.5-2.5 3-2.5s3 1 3 2.5"/></svg></span>
                <span class="d-text" data-i18n="action_aadhaar">Link Your Aadhaar</span>
              </a>
              <div class="dropdown-divider" role="separator"></div>
              <div class="dropdown-section-header" role="presentation">BALANCE &amp; PASSBOOK</div>
              <a href="#" class="dropdown-list-item" data-action="ewallet-history" role="menuitem" tabindex="-1">
                <span class="d-icon-badge"><svg class="d-icon-svg" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></span>
                <span class="d-text">Deposit History &amp; Balance</span>
              </a>
            </div>
          </div>

          <!-- 6. ALERTS -->
          <button type="button" class="capsule-btn ${this.activeItem === 'alerts' ? 'active' : ''}" role="menuitem" data-nav="alerts" id="capsule-btn-alerts">
            <span data-i18n="nav_alerts">ALERTS</span>
          </button>

          <!-- 7. CONTACT US -->
          <button type="button" class="capsule-btn ${this.activeItem === 'contact' ? 'active' : ''}" role="menuitem" data-nav="contact" id="capsule-btn-contact">
            <span data-i18n="nav_contact">CONTACT US</span>
          </button>
        </div>
      </div>
    `;
  }

  attachEvents() {
    // 1. Direct item clicks (Home, Alerts, Contact)
    const directBtns = this.container.querySelectorAll('.capsule-btn:not(.has-dropdown)');
    directBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const navTarget = btn.dataset.nav;
        this.closeAllDropdowns();
        this.setActive(navTarget);
        this.handleNavAction(navTarget);
      });
    });

    // 2. Dropdown triggers with 180ms Hover-Intent Grace Buffer (Fixes Vanishing Menu)
    const dropdownWraps = this.container.querySelectorAll('.capsule-dropdown-wrap');
    dropdownWraps.forEach((wrap) => {
      const triggerBtn = wrap.querySelector('.capsule-btn.has-dropdown');
      const dropdownMenu = wrap.querySelector('.capsule-dropdown-menu');

      // Click toggle
      triggerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.hoverTimeout) {
          clearTimeout(this.hoverTimeout);
          this.hoverTimeout = null;
        }
        const isOpen = wrap.classList.contains('open');
        this.closeAllDropdowns();
        if (!isOpen) {
          this.openMenu(wrap);
        }
      });

      // Hover enter: cancel any pending close timer and open menu
      const handleMouseEnter = () => {
        if (window.innerWidth > 992) {
          if (this.hoverTimeout) {
            clearTimeout(this.hoverTimeout);
            this.hoverTimeout = null;
          }
          if (this.openDropdown !== wrap) {
            this.closeAllDropdowns();
            this.openMenu(wrap);
          }
        }
      };

      // Hover leave: grace buffer of 300ms before closing
      const handleMouseLeave = () => {
        if (window.innerWidth > 992) {
          if (this.hoverTimeout) clearTimeout(this.hoverTimeout);
          this.hoverTimeout = setTimeout(() => {
            this.closeMenu(wrap);
            this.hoverTimeout = null;
          }, 300);
        }
      };

      triggerBtn.addEventListener('mouseenter', handleMouseEnter);
      triggerBtn.addEventListener('mouseleave', handleMouseLeave);
      wrap.addEventListener('mouseenter', handleMouseEnter);
      wrap.addEventListener('mouseleave', handleMouseLeave);
      dropdownMenu?.addEventListener('mouseenter', handleMouseEnter);
      dropdownMenu?.addEventListener('mouseleave', handleMouseLeave);

      // Sub-flyout hover protection
      const flyoutWraps = wrap.querySelectorAll('.dropdown-subitem-wrap');
      flyoutWraps.forEach((subwrap) => {
        subwrap.addEventListener('mouseenter', () => {
          if (window.innerWidth > 992) {
            if (this.hoverTimeout) {
              clearTimeout(this.hoverTimeout);
              this.hoverTimeout = null;
            }
            subwrap.classList.add('flyout-open');
            const parentItem = subwrap.querySelector('.dropdown-list-item.has-flyout');
            parentItem?.setAttribute('aria-expanded', 'true');
          }
        });
        subwrap.addEventListener('mouseleave', () => {
          if (window.innerWidth > 992) {
            subwrap.classList.remove('flyout-open');
            const parentItem = subwrap.querySelector('.dropdown-list-item.has-flyout');
            parentItem?.setAttribute('aria-expanded', 'false');
          }
        });
      });
    });

    // 3. Dropdown items click (List items & Flyout sub-items)
    const menuItems = this.container.querySelectorAll('.dropdown-list-item, .flyout-item');
    menuItems.forEach((item) => {
      item.addEventListener('click', (e) => {
        // Mobile tap on flyout parent
        if (item.classList.contains('has-flyout') && window.innerWidth <= 992) {
          e.preventDefault();
          const subwrap = item.closest('.dropdown-subitem-wrap');
          const isFlyOpen = subwrap?.classList.contains('flyout-open');
          subwrap?.classList.toggle('flyout-open', !isFlyOpen);
          item.setAttribute('aria-expanded', String(!isFlyOpen));
          return;
        }

        e.preventDefault();
        const action = item.dataset.action;
        this.closeAllDropdowns();
        if (action) {
          this.handleDropdownAction(action);
        }
      });
    });

    // 4. Keyboard Navigation (Full ARIA compliance)
    this.container.addEventListener('keydown', (e) => this.handleKeyboardNav(e));

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        this.closeAllDropdowns();
      }
    });

    // Close on Escape globally
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.openDropdown) {
        const trigger = this.openDropdown.querySelector('.capsule-btn.has-dropdown');
        this.closeAllDropdowns();
        trigger?.focus();
      }
    });

    // Listen for language changes and translate capsule menu items
    window.addEventListener('irctc-language-change', (e) => {
      const dict = e.detail?.dict;
      if (dict) {
        this.container.querySelectorAll('[data-i18n]').forEach((el) => {
          const key = el.getAttribute('data-i18n');
          if (dict[key]) {
            el.textContent = dict[key];
          }
        });
      }
    });
  }

  openMenu(wrap) {
    wrap.classList.add('open');
    const trigger = wrap.querySelector('.capsule-btn.has-dropdown');
    if (trigger) trigger.setAttribute('aria-expanded', 'true');
    this.openDropdown = wrap;
  }

  closeMenu(wrap) {
    wrap.classList.remove('open');
    const trigger = wrap.querySelector('.capsule-btn.has-dropdown');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
    // Also reset any flyout
    wrap.querySelectorAll('.dropdown-subitem-wrap').forEach((sw) => {
      sw.classList.remove('flyout-open');
      const flyTrigger = sw.querySelector('.has-flyout');
      if (flyTrigger) flyTrigger.setAttribute('aria-expanded', 'false');
    });
    if (this.openDropdown === wrap) {
      this.openDropdown = null;
    }
  }

  closeAllDropdowns() {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }
    this.container.querySelectorAll('.capsule-dropdown-wrap').forEach((w) => {
      this.closeMenu(w);
    });
  }

  handleKeyboardNav(e) {
    const activeEl = document.activeElement;
    const isTriggerBtn = activeEl?.classList.contains('capsule-btn');
    const isDropdownItem = activeEl?.classList.contains('dropdown-list-item');
    const isFlyoutItem = activeEl?.classList.contains('flyout-item');

    // Arrow Down
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (isTriggerBtn) {
        const wrap = activeEl.closest('.capsule-dropdown-wrap');
        if (wrap) {
          this.closeAllDropdowns();
          this.openMenu(wrap);
          const firstItem = wrap.querySelector('.dropdown-list-item');
          firstItem?.focus();
        }
      } else if (isDropdownItem) {
        const menu = activeEl.closest('.capsule-dropdown-menu');
        const items = Array.from(menu.querySelectorAll('.dropdown-list-item'));
        const idx = items.indexOf(activeEl);
        const next = items[(idx + 1) % items.length];
        next?.focus();
      } else if (isFlyoutItem) {
        const flyout = activeEl.closest('.dropdown-flyout-sublist');
        const items = Array.from(flyout.querySelectorAll('.flyout-item'));
        const idx = items.indexOf(activeEl);
        const next = items[(idx + 1) % items.length];
        next?.focus();
      }
    }

    // Arrow Up
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (isDropdownItem) {
        const menu = activeEl.closest('.capsule-dropdown-menu');
        const items = Array.from(menu.querySelectorAll('.dropdown-list-item'));
        const idx = items.indexOf(activeEl);
        if (idx === 0) {
          // Return to trigger
          const wrap = activeEl.closest('.capsule-dropdown-wrap');
          wrap?.querySelector('.capsule-btn.has-dropdown')?.focus();
        } else {
          const prev = items[(idx - 1 + items.length) % items.length];
          prev?.focus();
        }
      } else if (isFlyoutItem) {
        const flyout = activeEl.closest('.dropdown-flyout-sublist');
        const items = Array.from(flyout.querySelectorAll('.flyout-item'));
        const idx = items.indexOf(activeEl);
        const prev = items[(idx - 1 + items.length) % items.length];
        prev?.focus();
      }
    }

    // Arrow Right
    else if (e.key === 'ArrowRight') {
      if (isTriggerBtn) {
        e.preventDefault();
        const btns = Array.from(this.container.querySelectorAll('.capsule-btn'));
        const idx = btns.indexOf(activeEl);
        const nextBtn = btns[(idx + 1) % btns.length];
        nextBtn?.focus();
        if (this.openDropdown) {
          this.closeAllDropdowns();
          const wrap = nextBtn.closest('.capsule-dropdown-wrap');
          if (wrap) this.openMenu(wrap);
        }
      } else if (isDropdownItem && activeEl.classList.contains('has-flyout')) {
        e.preventDefault();
        const wrap = activeEl.closest('.dropdown-subitem-wrap');
        wrap?.classList.add('flyout-open');
        activeEl.setAttribute('aria-expanded', 'true');
        const firstFlyout = wrap?.querySelector('.flyout-item');
        firstFlyout?.focus();
      }
    }

    // Arrow Left
    else if (e.key === 'ArrowLeft') {
      if (isTriggerBtn) {
        e.preventDefault();
        const btns = Array.from(this.container.querySelectorAll('.capsule-btn'));
        const idx = btns.indexOf(activeEl);
        const prevBtn = btns[(idx - 1 + btns.length) % btns.length];
        prevBtn?.focus();
        if (this.openDropdown) {
          this.closeAllDropdowns();
          const wrap = prevBtn.closest('.capsule-dropdown-wrap');
          if (wrap) this.openMenu(wrap);
        }
      } else if (isFlyoutItem) {
        e.preventDefault();
        const subwrap = activeEl.closest('.dropdown-subitem-wrap');
        subwrap?.classList.remove('flyout-open');
        const parentItem = subwrap?.querySelector('.dropdown-list-item.has-flyout');
        parentItem?.setAttribute('aria-expanded', 'false');
        parentItem?.focus();
      } else if (isDropdownItem) {
        e.preventDefault();
        const wrap = activeEl.closest('.capsule-dropdown-wrap');
        const trigger = wrap?.querySelector('.capsule-btn.has-dropdown');
        this.closeAllDropdowns();
        trigger?.focus();
      }
    }

    // Home / End
    else if (e.key === 'Home') {
      if (isDropdownItem) {
        e.preventDefault();
        const menu = activeEl.closest('.capsule-dropdown-menu');
        menu?.querySelector('.dropdown-list-item')?.focus();
      }
    } else if (e.key === 'End') {
      if (isDropdownItem) {
        e.preventDefault();
        const menu = activeEl.closest('.capsule-dropdown-menu');
        const items = menu?.querySelectorAll('.dropdown-list-item');
        if (items && items.length) items[items.length - 1].focus();
      }
    }
  }

  setActive(navKey) {
    this.activeItem = navKey;
    this.container.querySelectorAll('.capsule-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.nav === navKey);
    });
  }

  handleNavAction(navKey) {
    switch (navKey) {
      case 'home':
        this.onNavigate('book');
        document.getElementById('primary-tab-viewport')?.scrollIntoView({ behavior: 'smooth' });
        break;
      case 'alerts':
        this.openAlertsModal();
        break;
      case 'contact':
        this.openContactModal();
        break;
      default:
        break;
    }
  }

  handleDropdownAction(action) {
    switch (action) {
      case 'book-tickets':
        this.setActive('trains');
        this.onNavigate('book');
        document.getElementById('from-station-input')?.focus();
        break;
      case 'vande-bharat-trains':
      case 'tejas-trains':
      case 'amrit-bharat-trains':
      case 'irctc-trains':
        this.setActive('trains');
        this.onNavigate('book');
        const vandeFilter = document.getElementById('chk-vande-bharat');
        if (vandeFilter) {
          vandeFilter.checked = true;
          vandeFilter.dispatchEvent(new Event('change'));
        }
        window.irctcApp?.showToast('Showing Premier Vande Bharat & Tejas Express Services');
        break;
      case 'foreign-tourist':
        this.openInfoModal('Foreign Tourist Quota Booking', `
          <div class="info-modal-body">
            <p>International tourists and Non-Resident Indians (NRIs) can book train berths up to <strong>365 days in advance</strong> in First AC (1A), AC 2-Tier (2A), and Executive Class (EC).</p>
            <p>Registration requires a valid foreign passport and international credit card authorization.</p>
          </div>
        `);
        break;
      case 'connecting-journey':
        this.openInfoModal('Connecting Journey Booking Rules', `
          <div class="info-modal-body">
            <p>Passengers can link two connecting train tickets on IRCTC. If the first train is delayed and the passenger misses the connecting train, the second ticket is refunded with <strong>zero cancellation fee</strong> as per Railway Board guidelines.</p>
          </div>
        `);
        break;
      case 'group-booking':
        this.openInfoModal('Bulk & Group Booking (20+ Passengers)', `
          <div class="info-modal-body">
            <p>Group booking for marriage parties, student tours, or corporate travel can be reserved through the Chief Commercial Manager (CCM) or online group booking application on IRCTC.</p>
          </div>
        `);
        break;
      case 'pnr-status':
        this.setActive('trains');
        this.onNavigate('pnr');
        break;
      case 'track-train':
      case 'train-schedule':
        this.setActive('trains');
        this.onNavigate('live');
        break;
      case 'coach-layouts':
        this.setActive('trains');
        this.onNavigate('coach');
        break;
      case 'wheelchair-booking':
        this.openInfoModal('Divyangjan Wheelchair & Yatri Mitra Assistance', `
          <div class="info-modal-body">
            <p>Indian Railways provides complimentary wheelchair and porter/assistant (Yatri Mitra) facilities at major stations (NDLS, CSMT, HWH, BSB, MAS, SBC, etc.) for Divyangjan passengers, senior citizens, and patients.</p>
            <div class="stat-highlight">
              <span>Advance Booking: Up to 4 hours before departure</span>
              <span>Helpline: Dial 139 / Yatri Mitra Seva</span>
            </div>
            <ul style="margin-top: 10px; padding-left: 18px;">
              <li>Battery Operated Carts (BOC) available on platforms for seamless coach transfer.</li>
              <li>Accessible ramps, Braille tactile floorings, and dedicated Divyangjan coach berths in SL &amp; 3A rakes.</li>
              <li>Escort pass concession provided as per Railway Board Divyangjan guidelines.</li>
            </ul>
          </div>
        `);
        break;
      case 'change-boarding':
        this.openInfoModal('Change Boarding Station Online (PRS / E-Ticket)', `
          <div class="info-modal-body">
            <p>Passengers holding valid confirmed, RAC, or waitlisted e-tickets can change their boarding point online through the IRCTC portal.</p>
            <div class="stat-highlight">
              <span>Time Limit: At least 4 hours before train departure from origin</span>
              <span>Fee: Nil (Zero Charge)</span>
            </div>
            <ul style="margin-top: 10px; padding-left: 18px;">
              <li>Boarding station can be changed only once per PNR.</li>
              <li>Once boarding point is altered, passenger forfeits right to board from the original station.</li>
              <li>If passenger boards from original station without authorization, penalty and difference of fare will be collected.</li>
            </ul>
          </div>
        `);
        break;
      case 'luggage-booking':
        this.openInfoModal('Railway Parcel & Heavy Luggage Booking', `
          <div class="info-modal-body">
            <p>Every passenger is allowed a specified free luggage allowance according to their travel class:</p>
            <div class="stat-highlight">
              <span>1A: 70 kg free (150 kg max)</span>
              <span>2A: 50 kg free (100 kg max)</span>
              <span>3A/CC: 40 kg free</span>
              <span>SL: 35 kg free</span>
            </div>
            <ul style="margin-top: 10px; padding-left: 18px;">
              <li>Luggage exceeding free allowance must be pre-booked at station parcel offices at least 30 minutes before departure.</li>
              <li>Unbooked excess luggage detected during transit attracts a <strong>6x penalty</strong> on the standard luggage tariff scale.</li>
              <li>Bicycles, motorbikes, and commercial packages must be booked through Railway Parcel Booking System.</li>
            </ul>
          </div>
        `);
        break;
      case 'pets-booking':
        this.openInfoModal('Traveling with Pets (Dogs & Cats) in Trains', `
          <div class="info-modal-body">
            <p>Pets (dogs and cats) can be carried on Indian Railways trains under strict Railway Board pet travel regulations:</p>
            <div class="stat-highlight">
              <span>Eligible Class: AC First Class (1A) only</span>
              <span>Booking Requirement: Entire 2-berth Coupe or 4-berth Cabin</span>
            </div>
            <ul style="margin-top: 10px; padding-left: 18px;">
              <li>A full coupe (2 berths) or cabin (4 berths) must be reserved under a single PNR by the passenger traveling with the pet.</li>
              <li>A valid Veterinary Health Certificate &amp; anti-rabies vaccination certificate (issued 24–48 hours prior) is mandatory.</li>
              <li>Small pets in cages can also travel in the Brake Van (Luggage / Dog Box) by booking at the parcel counter before departure.</li>
            </ul>
          </div>
        `);
        break;
      case 'link-aadhaar':
        this.openInfoModal('Link Aadhaar with IRCTC User Account', `
          <div class="info-modal-body">
            <p>Verify and link your 12-digit Aadhaar number with your IRCTC User Profile to unlock enhanced booking privileges:</p>
            <div class="stat-highlight">
              <span>Standard User Limit: 12 tickets / month</span>
              <span>Aadhaar-Verified Limit: 24 tickets / month</span>
            </div>
            <ul style="margin-top: 10px; padding-left: 18px;">
              <li>Immediate KYC verification via UIDAI OTP sent to registered mobile number.</li>
              <li>Mandatory for booking Tatkal tickets during peak opening minutes (10:00 AM / 11:00 AM).</li>
              <li>Enables instant activation of IRCTC eWallet without submitting physical documents.</li>
            </ul>
          </div>
        `);
        break;
      case 'order-ecatering':
      case 'book-epantry':
      case 'cooked-food-menu':
        this.openMealsModal(action);
        break;
      case 'loyalty-about':
      case 'loyalty-compare':
      case 'card-sbi':
      case 'card-bob':
      case 'card-hdfc':
      case 'card-rbl':
      case 'link-loyalty':
        this.openLoyaltyModal(action);
        break;
      case 'ewallet-about':
      case 'ewallet-guide':
      case 'ewallet-history':
        this.openEwalletModal(action);
        break;
      case 'cancel-ticket':
      case 'counter-ticket':
        this.openInfoModal('Ticket Cancellation Rules & Procedure', `
          <div class="info-modal-body">
            <p><strong>E-Ticket Cancellation:</strong> You can cancel fully confirmed, RAC, or waitlisted e-tickets online up to chart preparation time (4 hours before train departure from source station).</p>
            <p><strong>PRS Counter Tickets:</strong> Counter paper tickets can be cancelled online provided mobile number was given at booking time. Passenger must surrender original counter ticket at station counter to claim refund.</p>
            <div class="stat-highlight">
              <span>Clerkage Charge on WL: ₹60 + GST</span>
              <span>Cancellation on Confirmed: As per Railway Board Rules</span>
            </div>
          </div>
        `);
        break;
      case 'insurance-claim':
        this.openInfoModal('IRCTC Optional Travel Insurance (₹0.45)', `
          <div class="info-modal-body">
            <p>All passengers opting for travel insurance at ₹0.45 are insured with accidental death and permanent total disability cover up to <strong>₹10,00,000</strong>.</p>
            <p>In case of train accident, claims can be lodged with the designated insurance provider along with PNR and medical documentation.</p>
          </div>
        `);
        break;
      case 'ftr-charter':
        this.openInfoModal('Full Tariff Rate (FTR) Charters', `
          <div class="info-modal-body">
            <p>Passengers and tour operators can charter an entire train rake (18-24 coaches) or individual coach (AC 1A, 2A, 3A, Sleeper) for weddings, tours, or pilgrimage charters through FTR portal.</p>
            <p>Registration requires a security deposit with Indian Railways Commercial Branch.</p>
          </div>
        `);
        break;
      default:
        this.onNavigate('book');
        break;
    }
  }

  /* ==========================================================================
     MODALS FOR INFORMATIVE LINKS
     ========================================================================== */
  renderModals() {
    let modalRoot = document.getElementById('capsule-modals-root');
    if (!modalRoot) {
      modalRoot = document.createElement('div');
      modalRoot.id = 'capsule-modals-root';
      document.body.appendChild(modalRoot);
    }
  }

  openAlertsModal() {
    this.openInfoModal('Indian Railways Operational Alerts & Advisories', `
      <div class="info-modal-body alerts-body">
        <div class="alert-item high-priority">
          <span class="alert-tag">IMPORTANT</span>
          <strong>Daily Tatkal Opening Windows:</strong>
          <p>AC Classes (1A, 2A, 3A, 3E, CC, EC) open daily at <strong>10:00 AM IST</strong>. Non-AC Classes (SL, 2S) open at <strong>11:00 AM IST</strong>, exactly one day prior to journey date.</p>
        </div>
        <div class="alert-item info">
          <span class="alert-tag">Vande Bharat</span>
          <strong>Kavach Automatic Train Protection (ATP):</strong>
          <p>Over 80+ Vande Bharat and Amrit Bharat services now operate under Kavach Collision Protection across Golden Quadrilateral routes.</p>
        </div>
        <div class="alert-item notice">
          <span class="alert-tag">ADVISORY</span>
          <strong>Carry Original Photo ID:</strong>
          <p>Passengers must carry at least one original valid Government Photo ID card (Aadhaar, Voter ID, Driving Licence, Passport) during journey for TTE digital verification.</p>
        </div>
      </div>
    `);
  }

  openContactModal() {
    this.openInfoModal('Customer Care & Official Railway Helpdesk', `
      <div class="info-modal-body contact-body">
        <div class="contact-card primary-helpline">
          <div class="c-icon"><svg class="min-icon" viewBox="0 0 24 24" width="28" height="28"><rect x="4" y="3" width="16" height="15" rx="3"/><line x1="4" y1="11" x2="20" y2="11"/><line x1="8" y1="15" x2="8.01" y2="15"/><line x1="16" y1="15" x2="16.01" y2="15"/><path d="m5 18-2 3M19 18l2 3"/></svg></div>
          <div>
            <h3>24x7 RailMadad All-in-One Helpline</h3>
            <p class="big-phone">Dial 139 (Toll-Free Across India)</p>
            <span class="c-desc">For medical emergencies, security, punctuality, cleaning & coach enquiries.</span>
          </div>
        </div>

        <div class="contact-grid-2">
          <div class="c-subcard">
            <h4>Ticketing Support Email</h4>
            <p><strong>etickets@irctc.co.in</strong></p>
            <span>Response within 2-4 hours for online transaction issues.</span>
          </div>
          <div class="c-subcard">
            <h4>Customer Care Desk</h4>
            <p><strong>care@irctc.co.in</strong></p>
            <span>General passenger enquiries & refund queries.</span>
          </div>
          <div class="c-subcard">
            <h4>Co-Brand SBI Card Desk</h4>
            <p><strong>1800 180 1290 / 39020202</strong></p>
            <span>SBI railway credit card points redemption.</span>
          </div>
          <div class="c-subcard">
            <h4>e-Catering Food On Track</h4>
            <p><strong>Dial 1323 (Toll Free)</strong></p>
            <span>Live food delivery status at railway stations.</span>
          </div>
        </div>
      </div>
    `);
  }

  openMealsModal(action) {
    this.openInfoModal('IRCTC Meals & E-Catering (Food On Track)', `
      <div class="info-modal-body meals-body">
        <p>Order fresh, hygienic meals from top restaurant partners delivered directly to your train berth at upcoming junction stations.</p>
        <div class="meals-partner-strip">
          <span class="m-partner">Haldiram's</span>
          <span class="m-partner">Domino's Pizza</span>
          <span class="m-partner">Bikanervala</span>
          <span class="m-partner">RailRestro</span>
          <span class="m-partner">Behrouz Biryani</span>
        </div>
        <div class="standard-rates-table">
          <h4>Railway Board Standard Tariff:</h4>
          <table>
            <thead>
              <tr><th>Item</th><th>Type</th><th>Standard Rate</th></tr>
            </thead>
            <tbody>
              <tr><td>Standard Breakfast (Veg)</td><td>Bread &amp; Cutlet / Idli Vada</td><td>₹40.00</td></tr>
              <tr><td>Standard Breakfast (Non-Veg)</td><td>Bread &amp; Egg Omelette</td><td>₹50.00</td></tr>
              <tr><td>Standard Thali (Veg Lunch/Dinner)</td><td>Rice, Dal, 2 Rotis, Paneer Sabzi, Curd</td><td>₹80.00</td></tr>
              <tr><td>Standard Thali (Non-Veg)</td><td>Rice, Dal, 2 Rotis, Chicken Curry</td><td>₹130.00</td></tr>
              <tr><td>Packaged Rail Neer Water</td><td>1000 ml Chilled Bottle</td><td>₹15.00</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `);
  }

  openLoyaltyModal(action) {
    this.openInfoModal('IRCTC Co-Branded Loyalty Credit Cards', `
      <div class="info-modal-body loyalty-body">
        <p>Save up to 10% on your Indian Railways train bookings with official co-branded RuPay cards:</p>
        <div class="cards-grid">
          <div class="card-feature-box">
            <h4>IRCTC SBI RuPay Card</h4>
            <ul>
              <li>10% valueback as reward points on AC1, AC2, AC3, CC booking</li>
              <li>1% transaction fee waiver on IRCTC website</li>
              <li>4 complimentary railway lounge visits per year</li>
            </ul>
          </div>
          <div class="card-feature-box">
            <h4>IRCTC BoB RuPay Card</h4>
            <ul>
              <li>Up to 40 reward points per ₹100 spent on IRCTC portal</li>
              <li>1% fuel surcharge waiver across all Indian petrol pumps</li>
              <li>Complimentary accidental insurance up to ₹15 Lakhs</li>
            </ul>
          </div>
          <div class="card-feature-box">
            <h4>IRCTC HDFC Bank Card</h4>
            <ul>
              <li>Accelerated reward points on Vande Bharat &amp; Tejas booking</li>
              <li>₹500 welcome voucher upon card activation</li>
              <li>Seamless UPI linkage via RuPay network</li>
            </ul>
          </div>
        </div>
      </div>
    `);
  }

  openEwalletModal(action) {
    this.openInfoModal('IRCTC eWallet — Zero Latency Booking', `
      <div class="info-modal-body ewallet-body">
        <div class="ewallet-feature-row">
          <div class="ew-icon"><svg class="min-icon" viewBox="0 0 24 24" width="24" height="24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></div>
          <div>
            <h4>Why Use IRCTC eWallet for Tatkal?</h4>
            <p>No waiting for bank SMS OTPs or third-party payment gateway redirects. Transactions complete in <strong>under 2 seconds</strong>, dramatically maximizing your Tatkal ticket confirmation chances.</p>
          </div>
        </div>
        <div class="ewallet-steps">
          <h4>How to Register &amp; Use:</h4>
          <ol>
            <li>Verify your Aadhaar or PAN card in your IRCTC profile.</li>
            <li>Top up your eWallet balance using NetBanking or UPI.</li>
            <li>Select 'IRCTC eWallet' during ticket checkout for 1-click payment authorization.</li>
          </ol>
        </div>
      </div>
    `);
  }

  openInfoModal(title, bodyHTML) {
    const root = document.getElementById('capsule-modals-root');
    if (!root) return;

    root.innerHTML = `
      <div class="capsule-modal-overlay" id="capsule-info-overlay" role="dialog" aria-modal="true">
        <div class="capsule-modal-panel">
          <div class="capsule-modal-header">
            <h3 class="capsule-modal-title">${title}</h3>
            <button type="button" class="btn-capsule-modal-close" id="btn-close-info-modal" aria-label="Close Dialog">✕</button>
          </div>
          <div class="capsule-modal-content-area">
            ${bodyHTML}
          </div>
          <div class="capsule-modal-footer">
            <button type="button" class="btn-capsule-modal-ok" id="btn-capsule-modal-ok">Close Window</button>
          </div>
        </div>
      </div>
    `;

    const overlay = document.getElementById('capsule-info-overlay');
    const closeBtn = document.getElementById('btn-close-info-modal');
    const okBtn = document.getElementById('btn-capsule-modal-ok');

    requestAnimationFrame(() => {
      if (overlay) {
        overlay.classList.remove('is-closing');
        overlay.classList.add('is-open');
      }
    });

    let isClosing = false;
    let onKeyDown = null;

    const closeModal = () => {
      if (isClosing || !overlay) return;
      isClosing = true;
      if (onKeyDown) {
        document.removeEventListener('keydown', onKeyDown);
        onKeyDown = null;
      }
      overlay.classList.remove('is-open');
      overlay.classList.add('is-closing');
      setTimeout(() => {
        root.innerHTML = '';
      }, 250);
    };

    onKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeModal();
      });
    }
    if (okBtn) {
      okBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeModal();
      });
    }
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          e.stopPropagation();
          closeModal();
        }
      });
    }
  }

  openLoginModal() {
    const root = document.getElementById('capsule-modals-root');
    if (!root) return;

    root.innerHTML = `
      <div class="capsule-modal-overlay" id="irctc-login-overlay" role="dialog" aria-modal="true" aria-labelledby="login-dialog-title">
        <div class="capsule-modal-panel irctc-login-dialog">
          <!-- Header Banner: Authentic Vande Bharat train visual with Official Seals & Close Button -->
          <div class="login-dialog-banner">
            <img src="assets/images/vande_bharat_login_banner_clean.png" alt="Vande Bharat Express - Indian Railways & IRCTC" class="login-banner-bg-img" />
            <div class="login-banner-overlay-content">
              <div class="login-brand-logos">
                <img src="assets/icons/indian_railways_seal.svg" alt="Indian Railways Crest" class="login-seal-img" />
                <div class="brand-divider-login" aria-hidden="true"></div>
                <img src="assets/icons/irctc_logo.svg" alt="IRCTC Corporate Logo" class="login-irctc-img" />
              </div>
            </div>
            <button type="button" class="btn-login-close-round" id="btn-close-login-modal" aria-label="Close Login Dialog" title="Close">✕</button>
          </div>

          <!-- Login Tabs: USER LOGIN vs AGENT LOGIN -->
          <div class="login-tabs-row" role="tablist">
            <button type="button" class="login-tab-btn active" id="tab-user-login" data-tab="user" role="tab" aria-selected="true">
              <svg class="tab-icon-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span class="tab-text">USER LOGIN</span>
              <span class="tab-active-indicator"></span>
            </button>
            <button type="button" class="login-tab-btn" id="tab-agent-login" data-tab="agent" role="tab" aria-selected="false">
              <svg class="tab-icon-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1"/></svg>
              <span class="tab-text">AGENT LOGIN</span>
              <span class="tab-active-indicator"></span>
            </button>
          </div>

          <!-- Form Body -->
          <form id="irctc-auth-form" class="login-form-body">
            <!-- Username Pill Input -->
            <div class="auth-input-pill" id="group-username">
              <label class="auth-pill-label" for="inp-login-username" id="lbl-login-username">Username</label>
              <div class="auth-pill-inner">
                <input 
                  type="text" 
                  id="inp-login-username" 
                  class="auth-text-field" 
                  placeholder="Enter Username" 
                  value="indian_rail_traveller" 
                  required 
                  autocomplete="username"
                />
                <span class="auth-field-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </span>
              </div>
            </div>

            <!-- Password Pill Input with Interactive Eye Toggle -->
            <div class="auth-input-pill" id="group-password">
              <label class="auth-pill-label" for="inp-login-password">Password</label>
              <div class="auth-pill-inner">
                <input 
                  type="password" 
                  id="inp-login-password" 
                  class="auth-text-field" 
                  placeholder="Enter Password" 
                  value="SecurePass2026!" 
                  required 
                  autocomplete="current-password"
                />
                <button type="button" class="btn-toggle-eye" id="btn-toggle-password-eye" aria-label="Toggle Password Visibility" title="Show/Hide Password">
                  <svg id="eye-icon-open" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  <svg id="eye-icon-closed" class="hidden" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="2" x2="23" y2="23"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Forgot Account Details Link -->
            <div class="auth-forgot-row">
              <a href="#" class="auth-forgot-link" id="link-forgot-creds">Forgot account details?</a>
            </div>

            <!-- Primary Royal Blue CTA -->
            <button type="submit" class="btn-auth-primary" id="btn-submit-login">
              <span class="btn-arrow-circle"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></span>
              <span class="btn-auth-text">LOGIN</span>
            </button>

            <!-- Divider -->
            <div class="auth-or-divider">
              <span class="divider-line"></span>
              <span class="divider-text">OR</span>
              <span class="divider-line"></span>
            </div>

            <!-- Secondary Sign-Up Pill Button -->
            <button type="button" class="btn-auth-secondary" id="btn-sign-up-action">
              Don't have an account? <strong>Sign Up</strong>
            </button>
          </form>
        </div>
      </div>
    `;

    const overlay = document.getElementById('irctc-login-overlay');
    const closeBtn = document.getElementById('btn-close-login-modal');
    const userTab = document.getElementById('tab-user-login');
    const agentTab = document.getElementById('tab-agent-login');
    const usernameInput = document.getElementById('inp-login-username');
    const usernameLabel = document.getElementById('lbl-login-username');
    const passwordInput = document.getElementById('inp-login-password');
    const eyeToggleBtn = document.getElementById('btn-toggle-password-eye');
    const eyeIconOpen = document.getElementById('eye-icon-open');
    const eyeIconClosed = document.getElementById('eye-icon-closed');
    const forgotLink = document.getElementById('link-forgot-creds');
    const signUpBtn = document.getElementById('btn-sign-up-action');
    const form = document.getElementById('irctc-auth-form');

    requestAnimationFrame(() => {
      if (overlay) {
        overlay.classList.remove('is-closing');
        overlay.classList.add('is-open');
      }
    });

    let isClosing = false;
    let onKeyDown = null;

    const closeModal = () => {
      if (isClosing || !overlay) return;
      isClosing = true;
      if (onKeyDown) {
        document.removeEventListener('keydown', onKeyDown);
        onKeyDown = null;
      }
      overlay.classList.remove('is-open');
      overlay.classList.add('is-closing');
      setTimeout(() => {
        root.innerHTML = '';
      }, 250);
    };

    onKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeModal();
      });
    }

    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          e.stopPropagation();
          closeModal();
        }
      });
    }

    // Tab switching: USER vs AGENT
    if (userTab && agentTab) {
      userTab.addEventListener('click', (e) => {
        e.stopPropagation();
        userTab.classList.add('active');
        userTab.setAttribute('aria-selected', 'true');
        agentTab.classList.remove('active');
        agentTab.setAttribute('aria-selected', 'false');
        if (usernameLabel) usernameLabel.textContent = 'Username';
        if (usernameInput) {
          usernameInput.placeholder = 'Enter Username';
          usernameInput.value = 'indian_rail_traveller';
        }
      });

      agentTab.addEventListener('click', (e) => {
        e.stopPropagation();
        agentTab.classList.add('active');
        agentTab.setAttribute('aria-selected', 'true');
        userTab.classList.remove('active');
        userTab.setAttribute('aria-selected', 'false');
        if (usernameLabel) usernameLabel.textContent = 'Agent ID';
        if (usernameInput) {
          usernameInput.placeholder = 'Enter IRCTC Authorized Agent ID';
          usernameInput.value = 'AGNT_DLH_88421';
        }
      });
    }

    // Interactive eye toggle
    if (eyeToggleBtn && passwordInput) {
      eyeToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        if (eyeIconOpen && eyeIconClosed) {
          eyeIconOpen.classList.toggle('hidden', isPassword);
          eyeIconClosed.classList.toggle('hidden', !isPassword);
        }
      });
    }

    // Forgot details link
    if (forgotLink) {
      forgotLink.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.irctcApp && window.irctcApp.showToast) {
          window.irctcApp.showToast('Password recovery OTP sent to registered mobile/email.');
        }
      });
    }

    // Sign up button
    if (signUpBtn) {
      signUpBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.irctcApp && window.irctcApp.showToast) {
          window.irctcApp.showToast('IRCTC User Registration form opened.');
        }
      });
    }

    // Form submit
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isAgent = agentTab?.classList.contains('active');
        const role = isAgent ? 'Authorized Agent' : 'Verified Passenger';
        if (window.irctcApp && window.irctcApp.showToast) {
          window.irctcApp.showToast(`Logged in successfully as IRCTC ${role}!`);
        }
        closeModal();
      });
    }
  }
}

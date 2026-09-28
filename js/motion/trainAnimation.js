/**
 * Vande Bharat Express 2.0 Dynamic Canvas Motion Graphic
 * 60 FPS Parallax Simulation with OHE Catenary, Speed Streaks, Pantograph Sparks, and Interactive Speed Toggle
 */

export class TrainAnimation {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.container = this.canvas.parentElement;
    
    this.isRunning = false;
    this.animationFrameId = null;
    this.lastTime = 0;
    
    // Speed mode: 'cruising' (130 km/h) or 'highspeed' (160 km/h)
    this.speedMode = options.defaultSpeed || 'highspeed';
    this.targetSpeedKmH = this.speedMode === 'highspeed' ? 160 : 130;
    this.currentSpeedKmH = this.targetSpeedKmH;
    
    // Parallax scroll offsets
    this.skyOffset = 0;
    this.mountainsOffset = 0;
    this.treesOffset = 0;
    this.polesOffset = 0;
    this.trackOffset = 0;
    this.sparkTimer = 0;
    this.sparks = [];
    this.speedLines = [];
    
    // Check reduced motion
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    this.init();
  }

  init() {
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());
    
    // Listen for reduced motion preference changes
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.prefersReducedMotion = e.matches;
    });

    // Initialize speed lines
    this.initSpeedLines();
    this.start();
  }

  setSpeedMode(mode) {
    this.speedMode = mode;
    this.targetSpeedKmH = mode === 'highspeed' ? 160 : 130;
  }

  toggleSpeed() {
    const nextMode = this.speedMode === 'highspeed' ? 'cruising' : 'highspeed';
    this.setSpeedMode(nextMode);
    return {
      mode: this.speedMode,
      speed: this.targetSpeedKmH
    };
  }

  handleResize() {
    const rect = this.container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    
    this.width = rect.width || 1200;
    this.height = Math.max(rect.height || 420, 360);
    
    this.canvas.width = Math.floor(this.width * dpr);
    this.canvas.height = Math.floor(this.height * dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    
    this.ctx.scale(dpr, dpr);
  }

  initSpeedLines() {
    this.speedLines = [];
    const count = 35;
    for (let i = 0; i < count; i++) {
      this.speedLines.push({
        x: Math.random() * (this.width || 1200),
        y: 40 + Math.random() * ((this.height || 420) - 120),
        length: 60 + Math.random() * 160,
        speedMultiplier: 1.2 + Math.random() * 0.8,
        alpha: 0.15 + Math.random() * 0.45,
        strokeWidth: 1 + Math.random() * 2
      });
    }
  }

  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.lastTime = performance.now();
      this.loop(this.lastTime);
    }
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  loop(currentTime) {
    if (!this.isRunning) return;

    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    // Smooth speed interpolation
    this.currentSpeedKmH += (this.targetSpeedKmH - this.currentSpeedKmH) * 4 * dt;
    const speedRatio = this.currentSpeedKmH / 160;
    const velocityScale = this.prefersReducedMotion ? 0.05 : 1.0;

    // Update parallax layers
    const baseSpeed = 800 * speedRatio * velocityScale;
    this.skyOffset += baseSpeed * 0.03 * dt;
    this.mountainsOffset += baseSpeed * 0.08 * dt;
    this.treesOffset += baseSpeed * 0.25 * dt;
    this.polesOffset += baseSpeed * 0.85 * dt;
    this.trackOffset += baseSpeed * 1.35 * dt;

    // Update speed lines
    for (let line of this.speedLines) {
      line.x -= baseSpeed * 1.5 * line.speedMultiplier * dt;
      if (line.x + line.length < 0) {
        line.x = this.width + Math.random() * 200;
        line.y = 40 + Math.random() * (this.height - 130);
      }
    }

    // Pantograph electric sparks generator at high speed
    if (!this.prefersReducedMotion && this.speedMode === 'highspeed') {
      this.sparkTimer += dt;
      if (this.sparkTimer > (0.6 + Math.random() * 1.2)) {
        this.sparkTimer = 0;
        this.createSparks();
      }
    }

    // Update sparks
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const p = this.sparks[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.sparks.splice(i, 1);
      }
    }

    this.render();

    this.animationFrameId = requestAnimationFrame((t) => this.loop(t));
  }

  createSparks() {
    const pantographX = this.width * 0.46;
    const pantographY = this.height * 0.42;
    for (let i = 0; i < 16; i++) {
      const angle = Math.PI * 0.6 + (Math.random() - 0.5) * 1.5;
      const speed = 120 + Math.random() * 240;
      this.sparks.push({
        x: pantographX,
        y: pantographY,
        vx: Math.cos(angle) * speed - 220,
        vy: Math.sin(angle) * speed,
        size: 1.5 + Math.random() * 2.5,
        life: 0.2 + Math.random() * 0.35,
        maxLife: 0.5,
        color: Math.random() > 0.3 ? '#67e8f9' : '#ffffff'
      });
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Scenic Sky Backdrop (Modern Dawn / Twilight Azure with Golden Sunrise Glow)
    this.drawSky(ctx, w, h);

    // 2. Distant Himalayan Foothills & Mountains Parallax
    this.drawMountains(ctx, w, h);

    // 3. Rolling Lush Fields & Indian Flora
    this.drawMidground(ctx, w, h);

    // 4. Overhead Catenary Wires & High-Tension Transmission
    this.drawCatenaryWires(ctx, w, h);

    // 5. Catenary OHE Traction Masts
    this.drawCatenaryPoles(ctx, w, h);

    // 6. Modern Ballast Bed & Dual Gauge Concrete Sleepers
    this.drawRailwayTrack(ctx, w, h);

    // 7. Vande Bharat Express 2.0 Aerodynamic Train Rake
    this.drawTrain(ctx, w, h);

    // 8. Pantograph Sparks
    this.drawSparks(ctx);

    // 9. Aerodynamic Speed Wind Lines & Motion Blur
    this.drawSpeedLines(ctx, w, h);

    // 10. Digital Cab Telemetry & Speed Indicator HUD
    this.drawSpeedHud(ctx, w, h);
  }

  drawSky(ctx, w, h) {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.7);
    skyGrad.addColorStop(0, '#06162d');     // Deep navy night
    skyGrad.addColorStop(0.35, '#0c2d54');  // IRCTC deep blue
    skyGrad.addColorStop(0.65, '#1e40af');  // Dawn royal blue
    skyGrad.addColorStop(0.85, '#ff8a3d');  // Saffron morning dawn
    skyGrad.addColorStop(1, '#ffc078');     // Warm horizon glow

    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Distant soft Sun / Dawn radiance
    const sunGrad = ctx.createRadialGradient(w * 0.78, h * 0.38, 5, w * 0.78, h * 0.38, 140);
    sunGrad.addColorStop(0, 'rgba(255, 243, 205, 0.9)');
    sunGrad.addColorStop(0.3, 'rgba(255, 178, 92, 0.4)');
    sunGrad.addColorStop(0.7, 'rgba(255, 107, 43, 0.15)');
    sunGrad.addColorStop(1, 'rgba(255, 107, 43, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(w * 0.78, h * 0.38, 140, 0, Math.PI * 2);
    ctx.fill();
  }

  drawMountains(ctx, w, h) {
    const horizonY = h * 0.62;
    ctx.save();
    
    // Distant Mountain Ridge 1
    ctx.fillStyle = 'rgba(12, 35, 64, 0.45)';
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    const m1Step = 90;
    const m1Offset = (this.mountainsOffset * 0.4) % m1Step;
    for (let x = -m1Step; x <= w + m1Step; x += m1Step) {
      const peakY = horizonY - 45 - Math.sin((x + this.mountainsOffset * 0.3) * 0.015) * 35;
      ctx.lineTo(x - m1Offset, peakY);
    }
    ctx.lineTo(w, horizonY);
    ctx.lineTo(0, horizonY);
    ctx.closePath();
    ctx.fill();

    // Closer Mountain Ridge 2
    ctx.fillStyle = 'rgba(16, 52, 92, 0.65)';
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    const m2Step = 70;
    const m2Offset = (this.mountainsOffset * 0.8) % m2Step;
    for (let x = -m2Step; x <= w + m2Step; x += m2Step) {
      const peakY = horizonY - 25 - Math.sin((x + this.mountainsOffset * 0.5) * 0.02) * 22;
      ctx.lineTo(x - m2Offset, peakY);
    }
    ctx.lineTo(w, horizonY);
    ctx.lineTo(0, horizonY);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  drawMidground(ctx, w, h) {
    const groundY = h * 0.64;
    
    // Rolling green plateau
    const greenGrad = ctx.createLinearGradient(0, groundY - 15, 0, groundY + 40);
    greenGrad.addColorStop(0, '#15803d');
    greenGrad.addColorStop(0.4, '#166534');
    greenGrad.addColorStop(1, '#0f3d24');
    ctx.fillStyle = greenGrad;
    ctx.beginPath();
    ctx.moveTo(0, groundY - 10);
    ctx.quadraticCurveTo(w * 0.3, groundY - 22, w * 0.6, groundY - 8);
    ctx.quadraticCurveTo(w * 0.85, groundY - 2, w, groundY - 12);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Mustard flower yellow fields patches (Indian countryside characteristic)
    ctx.fillStyle = 'rgba(234, 179, 8, 0.35)';
    ctx.beginPath();
    ctx.ellipse(w * 0.25, groundY + 4, 120, 10, 0, 0, Math.PI * 2);
    ctx.ellipse(w * 0.72, groundY + 8, 160, 12, -0.05, 0, Math.PI * 2);
    ctx.fill();
  }

  drawCatenaryWires(ctx, w, h) {
    const contactWireY = h * 0.42;  // Contact wire (touches pantograph)
    const messengerWireY = h * 0.32; // Messenger wire above
    
    ctx.save();
    // Droppers and catenary wire sag
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.6)';
    ctx.lineWidth = 1.2;

    // Overhead messenger wire with subtle catenary curves between poles
    const poleSpacing = 280;
    const poleShift = this.polesOffset % poleSpacing;

    ctx.beginPath();
    for (let x = -poleSpacing; x <= w + poleSpacing; x += poleSpacing) {
      const startX = x - poleShift;
      const endX = startX + poleSpacing;
      ctx.moveTo(startX, messengerWireY);
      ctx.quadraticCurveTo((startX + endX) / 2, messengerWireY + 12, endX, messengerWireY);
      
      // Vertical dropper wires
      for (let d = 1; d <= 4; d++) {
        const dropX = startX + (poleSpacing / 5) * d;
        const sagY = messengerWireY + Math.sin((d / 5) * Math.PI) * 11;
        ctx.moveTo(dropX, sagY);
        ctx.lineTo(dropX, contactWireY);
      }
    }
    ctx.stroke();

    // Continuous taut horizontal contact wire
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, contactWireY);
    ctx.lineTo(w, contactWireY);
    ctx.stroke();

    ctx.restore();
  }

  drawCatenaryPoles(ctx, w, h) {
    const poleSpacing = 280;
    const shift = this.polesOffset % poleSpacing;
    const contactWireY = h * 0.42;
    const trackY = h * 0.74;

    ctx.save();
    for (let x = -poleSpacing; x <= w + poleSpacing; x += poleSpacing) {
      const poleX = x - shift;
      if (poleX < -40 || poleX > w + 40) continue;

      // Steel girder OHE Mast (Official Indian Railways Mast Grey / Galvanized Silver)
      const mastGrad = ctx.createLinearGradient(poleX - 6, 0, poleX + 6, 0);
      mastGrad.addColorStop(0, '#94a3b8');
      mastGrad.addColorStop(0.5, '#f1f5f9');
      mastGrad.addColorStop(1, '#64748b');

      ctx.fillStyle = mastGrad;
      ctx.fillRect(poleX - 5, contactWireY - 40, 10, trackY - (contactWireY - 40));

      // Concrete foundation plinth
      ctx.fillStyle = '#475569';
      ctx.fillRect(poleX - 8, trackY - 14, 16, 18);

      // Cantilever arm & porcelain insulator assembly
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(poleX, contactWireY - 35);
      ctx.lineTo(poleX + 38, contactWireY - 18);
      ctx.lineTo(poleX + 38, contactWireY);
      ctx.stroke();

      // Red porcelain high-voltage insulator bracket
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(poleX + 35, contactWireY - 14, 6, 10);
      // Yellow danger diamond warning plate
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(poleX, contactWireY + 40);
      ctx.lineTo(poleX + 7, contactWireY + 47);
      ctx.lineTo(poleX, contactWireY + 54);
      ctx.lineTo(poleX - 7, contactWireY + 47);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  drawRailwayTrack(ctx, w, h) {
    const trackTopY = h * 0.69;
    const trackBottomY = h * 0.78;

    ctx.save();

    // 1. Granite Ballast Stone Bed
    const ballastGrad = ctx.createLinearGradient(0, trackTopY - 4, 0, trackBottomY + 12);
    ballastGrad.addColorStop(0, '#334155');
    ballastGrad.addColorStop(0.4, '#1e293b');
    ballastGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = ballastGrad;
    ctx.fillRect(0, trackTopY - 4, w, trackBottomY - trackTopY + 22);

    // Ballast stone texture speckles
    ctx.fillStyle = 'rgba(148, 163, 184, 0.25)';
    for (let i = 0; i < 40; i++) {
      const bx = (i * 37 + (this.trackOffset * 1.2)) % w;
      const by = trackTopY + 2 + ((i * 17) % 24);
      ctx.fillRect(bx, by, 3, 2);
    }

    // 2. Prestressed Concrete Sleepers (PSC)
    const sleeperSpacing = 38;
    const sleeperShift = this.trackOffset % sleeperSpacing;

    ctx.fillStyle = '#cbd5e1';
    for (let x = -sleeperSpacing; x <= w + sleeperSpacing; x += sleeperSpacing) {
      const sx = x - sleeperShift;
      ctx.fillRect(sx, trackTopY + 2, 14, trackBottomY - trackTopY + 6);
      // Fastening clips
      ctx.fillStyle = '#f97316'; // Pandrol clips orange
      ctx.fillRect(sx + 3, trackTopY + 6, 8, 3);
      ctx.fillRect(sx + 3, trackBottomY - 2, 8, 3);
      ctx.fillStyle = '#cbd5e1';
    }

    // 3. Continuous Welded UIC 60 kg High Speed Rails
    // Top Rail
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(0, trackTopY + 7, w, 5);
    ctx.fillStyle = '#ffffff'; // Specular railhead reflection
    ctx.fillRect(0, trackTopY + 7, w, 1.5);

    // Bottom Rail
    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, trackBottomY - 1, w, 5);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, trackBottomY - 1, w, 1.5);

    ctx.restore();
  }

  drawTrain(ctx, w, h) {
    ctx.save();

    // Position of the train on the track
    // Lead aerodynamic driver car + coach section
    const trainWidth = Math.min(w * 0.72, 840);
    const trainStartX = w * 0.18;
    const trainHeight = 88;
    const trainY = h * 0.53;

    // Train Body Gradient (Pristine Pearl White with dynamic reflections)
    const bodyGrad = ctx.createLinearGradient(0, trainY, 0, trainY + trainHeight);
    bodyGrad.addColorStop(0, '#f8fafc');
    bodyGrad.addColorStop(0.2, '#ffffff');
    bodyGrad.addColorStop(0.65, '#f1f5f9');
    bodyGrad.addColorStop(0.85, '#e2e8f0');
    bodyGrad.addColorStop(1, '#0c2340'); // Dark aerodynamic lower skirt

    // 1. Aerodynamic Nose & Coach Outline
    ctx.beginPath();
    ctx.moveTo(trainStartX, trainY + 12);
    // Roof slope
    ctx.lineTo(trainStartX + trainWidth - 90, trainY + 12);
    // Bullet nose curve (Vande Bharat 2.0 distinctive sharp wedge nose)
    ctx.bezierCurveTo(
      trainStartX + trainWidth - 30, trainY + 14,
      trainStartX + trainWidth - 8, trainY + 36,
      trainStartX + trainWidth, trainY + 54
    );
    // Lower nose cowcatcher slope
    ctx.bezierCurveTo(
      trainStartX + trainWidth - 4, trainY + 72,
      trainStartX + trainWidth - 25, trainY + trainHeight,
      trainStartX + trainWidth - 60, trainY + trainHeight
    );
    // Coach bottom line
    ctx.lineTo(trainStartX, trainY + trainHeight);
    ctx.closePath();

    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 2. Signature Indian Tricolor Racing Stripes (Saffron, White, Green)
    const stripeY = trainY + trainHeight * 0.58;
    // Saffron Stripe
    ctx.fillStyle = '#ff671f';
    ctx.fillRect(trainStartX, stripeY, trainWidth - 42, 5);
    // White Gap with IRCTC Blue Accent
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(trainStartX, stripeY + 5, trainWidth - 36, 2.5);
    // India Green Stripe
    ctx.fillStyle = '#138808';
    ctx.fillRect(trainStartX, stripeY + 7.5, trainWidth - 30, 5);

    // 3. Driver Cab Windshield (Continuous aerodynamic wraparound cockpit)
    const cabX = trainStartX + trainWidth - 110;
    const cabY = trainY + 18;
    ctx.beginPath();
    ctx.moveTo(cabX, cabY);
    ctx.lineTo(trainStartX + trainWidth - 46, cabY + 14);
    ctx.bezierCurveTo(
      trainStartX + trainWidth - 28, cabY + 20,
      trainStartX + trainWidth - 22, cabY + 32,
      trainStartX + trainWidth - 26, cabY + 38
    );
    ctx.lineTo(cabX, cabY + 32);
    ctx.closePath();
    
    // Windshield glass gradient
    const glassGrad = ctx.createLinearGradient(cabX, cabY, cabX + 80, cabY + 30);
    glassGrad.addColorStop(0, '#0f172a');
    glassGrad.addColorStop(0.4, '#0369a1');
    glassGrad.addColorStop(1, '#0284c7');
    ctx.fillStyle = glassGrad;
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Driver silhouette
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.arc(cabX + 32, cabY + 22, 5, 0, Math.PI * 2);
    ctx.fill();

    // 4. Passenger Continuous Tinted Panoramic Windows
    const winY = trainY + 24;
    const winHeight = 22;
    const winCount = 7;
    const winWidth = (trainWidth - 170) / (winCount + 0.5);

    for (let i = 0; i < winCount; i++) {
      const wx = trainStartX + 18 + i * (winWidth + 10);
      
      // Window tint
      const winGrad = ctx.createLinearGradient(wx, winY, wx, winY + winHeight);
      winGrad.addColorStop(0, '#091524');
      winGrad.addColorStop(0.5, '#132e4d');
      winGrad.addColorStop(1, '#0b1b2b');
      ctx.fillStyle = winGrad;
      ctx.beginPath();
      ctx.roundRect(wx, winY, winWidth, winHeight, 4);
      ctx.fill();
      
      // Inner warm ambient lighting passenger silhouettes
      ctx.fillStyle = 'rgba(254, 240, 138, 0.45)';
      ctx.fillRect(wx + 4, winY + 3, winWidth - 8, 3);
      
      // Window frame highlight
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    // 5. Vande Bharat LED High-Intensity Headlamps (Glowing amber/white beams)
    const headlampX = trainStartX + trainWidth - 28;
    const headlampY = trainY + 54;
    
    // Headlamp fixture
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(headlampX, headlampY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Forward Light Projection Cone
    const lightGrad = ctx.createRadialGradient(headlampX, headlampY, 2, headlampX + 160, headlampY + 10, 180);
    lightGrad.addColorStop(0, 'rgba(254, 240, 138, 0.7)');
    lightGrad.addColorStop(0.3, 'rgba(254, 240, 138, 0.25)');
    lightGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = lightGrad;
    ctx.beginPath();
    ctx.moveTo(headlampX, headlampY - 2);
    ctx.lineTo(w, headlampY - 25);
    ctx.lineTo(w, headlampY + 45);
    ctx.lineTo(headlampX, headlampY + 4);
    ctx.closePath();
    ctx.fill();

    // 6. Aerodynamic High-Voltage Pantograph on Roof
    const pantoBaseX = trainStartX + trainWidth * 0.35;
    const pantoBaseY = trainY + 12;
    const contactY = h * 0.42;

    ctx.strokeStyle = '#dc2626'; // High-voltage red structure
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    // Lower diamond arm
    ctx.moveTo(pantoBaseX, pantoBaseY);
    ctx.lineTo(pantoBaseX + 14, pantoBaseY - 18);
    // Upper articulated arm
    ctx.lineTo(pantoBaseX + 32, contactY);
    // Pantograph contact collector shoe
    ctx.stroke();

    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(pantoBaseX + 20, contactY);
    ctx.lineTo(pantoBaseX + 44, contactY);
    ctx.stroke();

    // 7. Bogies & Wheels under the train
    const bogieY = trainY + trainHeight + 2;
    this.drawBogie(ctx, trainStartX + 50, bogieY);
    this.drawBogie(ctx, trainStartX + trainWidth - 110, bogieY);

    // 8. Coach Branding: "VANDE BHARAT" & "IRCTC" Typography on Train
    ctx.fillStyle = '#0c2340';
    ctx.font = 'bold 9px "Inter", sans-serif';
    ctx.letterSpacing = '1px';
    ctx.fillText('VANDE BHARAT 2.0', trainStartX + 24, stripeY - 4);

    ctx.fillStyle = '#ff671f';
    ctx.font = 'bold 8px "Inter", sans-serif';
    ctx.fillText('160 km/h SEMI HIGH SPEED', trainStartX + 140, stripeY - 4);

    ctx.restore();
  }

  drawBogie(ctx, bx, by) {
    ctx.save();
    // Bogie frame
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(bx - 26, by - 6, 52, 10);

    // Wheels
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(bx - 16, by + 4, 10, 0, Math.PI * 2);
    ctx.arc(bx + 16, by + 4, 10, 0, Math.PI * 2);
    ctx.fill();

    // Wheel rims & hubs
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(bx - 16, by + 4, 4, 0, Math.PI * 2);
    ctx.arc(bx + 16, by + 4, 4, 0, Math.PI * 2);
    ctx.fill();

    // Red brake disc accent
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(bx - 8, by - 2, 16, 4);

    ctx.restore();
  }

  drawSparks(ctx) {
    ctx.save();
    for (let p of this.sparks) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawSpeedLines(ctx, w, h) {
    ctx.save();
    for (let line of this.speedLines) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${line.alpha})`;
      ctx.lineWidth = line.strokeWidth;
      ctx.beginPath();
      ctx.moveTo(line.x, line.y);
      ctx.lineTo(line.x + line.length, line.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawSpeedHud(ctx, w, h) {
    ctx.save();
    // Modern Glassmorphism Telemetry Box in top right
    const hudWidth = 230;
    const hudHeight = 72;
    const hudX = w - hudWidth - 20;
    const hudY = 114;

    ctx.fillStyle = 'rgba(12, 35, 64, 0.78)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(hudX, hudY, hudWidth, hudHeight, 8);
    ctx.fill();
    ctx.stroke();

    // Speed display
    const speedInt = Math.round(this.currentSpeedKmH);
    ctx.fillStyle = '#38bdf8';
    ctx.font = '700 10px "Inter", monospace';
    ctx.letterSpacing = '1px';
    ctx.fillText('LIVE TRAIN TELEMETRY', hudX + 14, hudY + 20);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 24px "Inter", monospace';
    ctx.fillText(`${speedInt}`, hudX + 14, hudY + 48);

    ctx.fillStyle = '#ff671f';
    ctx.font = '700 11px "Inter", sans-serif';
    ctx.fillText('KM/H', hudX + 66, hudY + 46);

    // Status pill
    const is160 = speedInt >= 150;
    ctx.fillStyle = is160 ? 'rgba(5, 150, 105, 0.25)' : 'rgba(217, 119, 6, 0.25)';
    ctx.strokeStyle = is160 ? '#10b981' : '#f59e0b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(hudX + 115, hudY + 28, 100, 24, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = is160 ? '#34d399' : '#fbbf24';
    ctx.font = '700 9.5px "Inter", sans-serif';
    ctx.letterSpacing = '0.5px';
    ctx.fillText(is160 ? '● MAX SPEED' : '● CRUISING', hudX + 125, hudY + 44);

    // OHE Traction indicator line at bottom of HUD
    ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
    ctx.font = '600 8.5px "Inter", monospace';
    ctx.fillText('25 kV AC 50Hz • KAVACH ACTIVE', hudX + 14, hudY + 63);

    ctx.restore();
  }
}

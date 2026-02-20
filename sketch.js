// ===== Colors =====
const COL_BG = "#F7F4EE";
const COL_CARD = "#FFFDF8";
const COL_CARD_SHADOW = "rgba(0,0,0,0.12)";
const COL_TEXT = "#2A2A28";

let step = 0;
const TOTAL_STEPS = 6;

// Card geometry (computed each frame)
let cardX, cardY, cardW, cardH;

// Inputs grouped by step
let stepInputs = [[], [], [], [], [], []];

// Step 0 inputs
let occasionSelect, dateInput, timeInput;

// Navigation buttons
let nextBtn, backBtn;

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Create inputs for each step
  createStep0Inputs();

  // Create nav buttons (shared across steps)
  createNavButtons();
}

function draw() {
  background(COL_BG);

  computeCardGeometry();
  drawCard();
  drawStepHeader();
  drawStepContent();
  positionNavButtons();
}

// ===== Responsive card geometry =====
function computeCardGeometry() {
  // Card scales as a percentage of canvas (A2-a)
  cardW = width * 0.8;
  let desiredH = height * 0.85;
  cardH = Math.min(desiredH, 700); // T2: cap height
  cardX = (width - cardW) / 2;
  cardY = (height - cardH) / 2;
}

// ===== Card drawing =====
function drawCard() {
  push();
  noStroke();

  // Shadow
  fill(COL_CARD_SHADOW);
  rect(cardX + 8, cardY + 8, cardW, cardH, 18);

  // Main card
  fill(COL_CARD);
  rect(cardX, cardY, cardW, cardH, 18);
  pop();
}

// ===== Step header text =====
function drawStepHeader() {
  fill(COL_TEXT);
  textAlign(RIGHT, TOP);
  textSize(14);
  text(`Step ${step + 1} of ${TOTAL_STEPS}`, cardX + cardW - 20, cardY + 20);

  textAlign(LEFT, TOP);
  textSize(22);

  let title = "";
  let subtitle = "This helps us understand the vibe and timing of your gathering.";

  if (step === 0) title = "Tell us about your event";
  else if (step === 1) title = "Guest count & flow";
  else if (step === 2) title = "Food & beverage details";
  else if (step === 3) title = "Activities & add-ons";
  else if (step === 4) title = "Logistics & timing";
  else if (step === 5) title = "Contact & confirmation";

  text(title, cardX + 24, cardY + 48);

  textSize(13);
  fill(0, 0, 0, 180);
  text(
    subtitle,
    cardX + 24,
    cardY + 48 + 30
  );
}

// ===== Step router =====
function drawStepContent() {
  hideAllInputs();

  if (step === 0) drawStep0();
  else if (step === 1) drawStep1();
  else if (step === 2) drawStep2();
  else if (step === 3) drawStep3();
  else if (step === 4) drawStep4();
  else if (step === 5) drawStep5();
}

// ===== Helper: place input relative to card =====
// relX, relY, relW, relH are 0–1 percentages of card
function placeInput(el, relX, relY, relW, relH = 0.06) {
  const x = cardX + cardW * relX;
  const y = cardY + cardH * relY;
  const w = cardW * relW;
  const h = cardH * relH;

  el.position(x, y);
  el.size(w, h);
  el.show();

  // Responsive font size and padding
  const fontSize = Math.max(14, Math.min(22, Math.floor(cardH * 0.025)));
  el.style('font-size', fontSize + 'px');
  el.style('padding', Math.max(6, Math.floor(cardH * 0.012)) + 'px ' + Math.max(10, Math.floor(cardW * 0.02)) + 'px');
  el.style('border-radius', Math.max(6, Math.floor(cardH * 0.01)) + 'px');
  el.style('width', w + 'px');
  el.style('height', h + 'px');
}

// Hide all inputs each frame, then show only the current step's
function hideAllInputs() {
  for (let s = 0; s < stepInputs.length; s++) {
    for (let el of stepInputs[s]) {
      el.hide();
    }
  }
}

// =========================
// STEP 0: Occasion, Date, Time
// =========================
function createStep0Inputs() {
  occasionSelect = createSelect();
  occasionSelect.option("Bridal Shower");
  occasionSelect.option("Baby Shower");
  occasionSelect.option("Birthday");
  occasionSelect.option("Corporate Event");
  occasionSelect.option("Other");

  dateInput = createInput("");
  dateInput.attribute("type", "date");

  timeInput = createInput("");
  timeInput.attribute("type", "time");

  stepInputs[0].push(occasionSelect, dateInput, timeInput);
}

function drawStep0() {
  fill(COL_TEXT);
  textAlign(LEFT, TOP);
  textSize(13);

  const labelX = cardX + cardW * 0.08;
  let y = cardY + cardH * 0.24;

  text("Occasion *", labelX, y);
  y += cardH * 0.08;
  text("Preferred Date *", labelX, y);
  y += cardH * 0.08;
  text("Preferred Time * (between 9:00 AM and 7:00 PM)", labelX, y);

  // Inputs
  placeInput(occasionSelect, 0.08, 0.28, 0.4);
  placeInput(dateInput, 0.08, 0.36, 0.25);
  placeInput(timeInput, 0.08, 0.44, 0.25);

  // Small note
  fill(0, 0, 0, 160);
  textSize(11);
  text(
    "*Your requested date will be approved by staff to prevent double-bookings.\nAvailability is not guaranteed until first deposit is paid.",
    labelX,
    cardY + cardH * 0.56
  );
}

// =========================
// STEP 1–5: placeholders
// =========================

function drawStep1() {
  fill(COL_TEXT);
  textAlign(LEFT, TOP);
  textSize(18);
  text("Step 2 content goes here", cardX + 24, cardY + cardH * 0.25);
}

function drawStep2() {
  fill(COL_TEXT);
  textAlign(LEFT, TOP);
  textSize(18);
  text("Step 3 content goes here", cardX + 24, cardY + cardH * 0.25);
}

function drawStep3() {
  fill(COL_TEXT);
  textAlign(LEFT, TOP);
  textSize(18);
  text("Step 4 content goes here", cardX + 24, cardY + cardH * 0.25);
}

function drawStep4() {
  fill(COL_TEXT);
  textAlign(LEFT, TOP);
  textSize(18);
  text("Step 5 content goes here", cardX + 24, cardY + cardH * 0.25);
}

function drawStep5() {
  fill(COL_TEXT);
  textAlign(LEFT, TOP);
  textSize(18);
  text("Step 6 content goes here", cardX + 24, cardY + cardH * 0.25);
}

// =========================
// Navigation buttons
// =========================
function createNavButtons() {
  nextBtn = createButton("Next");
  backBtn = createButton("Back");

  nextBtn.mousePressed(() => {
    if (step < TOTAL_STEPS - 1) step++;
  });

  backBtn.mousePressed(() => {
    if (step > 0) step--;
  });
}

function positionNavButtons() {
  const btnY = cardY + cardH - 60;
  const padding = 24;

  // Next on the right
  const nextW = 100;
  nextBtn.position(cardX + cardW - nextW - padding, btnY);
  nextBtn.size(nextW, 34);
  nextBtn.show();

  // Back on the left (hidden on first step)
  const backW = 80;
  if (step > 0) {
    backBtn.position(cardX + padding, btnY);
    backBtn.size(backW, 34);
    backBtn.show();
  } else {
    backBtn.hide();
  }
}

// =========================
// Handle window resize
// =========================
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
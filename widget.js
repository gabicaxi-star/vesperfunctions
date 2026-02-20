// Vesper Event Estimate Widget (vanilla JS)

// ====== CONFIG ======
const TAX_RATE = 0.0775;

// Studio location: 16089 San Dieguito Rd, Rancho Santa Fe, CA 92067
// Approx coordinates; replace if you want exact.
const STUDIO_LAT = 33.0187;
const STUDIO_LON = -117.2036;
const STUDIO_ZIP = "92067";

// Travel fee policy
const TRAVEL_BASE_FEE = 100;
const TRAVEL_INCLUDED_MILES = 10;
const TRAVEL_PER_MILE_OVER = 5;

// EmailJS (configured)
const EMAILJS_PUBLIC_KEY = "uLluCpNs5klM8XWml";
const EMAILJS_SERVICE_ID = "service_rkb7ozz";
const EMAILJS_TEMPLATE_ID = "template_trnx5um";

// ====== STATE ======
const steps = ["occasion", "location", "guests", "experience", "contact", "review"];

const state = {
  step: 0,

  // Step 1
  occasion: "",
  occasionOther: "",
  date: "",
  time: "",

  // Step 2
  location: "", // 'studio' | 'offsite'

  // Step 3
  guestCountStudio: "",   // "2" | "5" | "10" | "15" | "20"
  guestCountOffsite: "",  // "15".."60"

  // Step 4 (single craft choice)
  craftChoice: "",        // "candle" | "jewelry" | "soap" | "custom" | ""
  customCraft: "",

  // Studio add-ons
  goodieBags: false,
  decorations: false,

  // Studio catering
  catering: {
    brunch: false,
    lunch: false,
    dessert: false,
  },

  // Studio dietary meals (separate pricing)
  dietary: {
    glutenFree: { enabled: false, count: 0 },
    vegan: { enabled: false, count: 0 },
    vegetarian: { enabled: false, count: 0 },
  },

  // Off-site address
  addressStreet: "",
  addressCity: "",
  addressState: "",
  addressZip: "",

  // Step 5
  name: "",
  email: "",
  phone: "",
  notes: "",

  // Derived
  distanceMiles: 0,
  travelFee: 0,
  travelError: "",
  totals: null,
};

function money(n) { return `$${(n || 0).toFixed(2)}`; }
function clampInt(value, min, max) {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return null;
  return Math.max(min, Math.min(max, n));
}
function isValidUSZip(zip) { return /^\d{5}$/.test(zip); }
function validateEmail(email) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email); }
function roundTo1Decimal(n) { return Math.round(n * 10) / 10; }

function normalizePhone(phone) {
  // Keep digits + leading +
  const trimmed = (phone || "").trim();
  if (!trimmed) return "";
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/[^\d]/g, "");
  return hasPlus ? `+${digits}` : digits;
}
function validatePhone(phone) {
  // Accept 10 digits (US), or 11 digits starting with 1, or E.164-ish with +
  const norm = normalizePhone(phone);
  if (!norm) return false;
  if (norm.startsWith("+")) {
    const d = norm.slice(1);
    return d.length >= 10 && d.length <= 15;
  }
  if (norm.length === 10) return true;
  if (norm.length === 11 && norm.startsWith("1")) return true;
  return false;
}

// Date constraints:
// - at least 7 days from today
// - not past end of current year
function getMinDate() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split("T")[0];
}
function getMaxDate() {
  const d = new Date();
  d.setFullYear(d.getFullYear(), 11, 31);
  return d.toISOString().split("T")[0];
}

// ====== RENDER ROOT ======
window.addEventListener("DOMContentLoaded", () => {
  if (window.emailjs && EMAILJS_PUBLIC_KEY) {
    try { window.emailjs.init(EMAILJS_PUBLIC_KEY); } catch {}
  }
  render();
});

function render() {
  const root = document.getElementById("event-widget-root");
  root.innerHTML = "";

  const card = document.createElement("div");
  card.className = "widget-card";

  const header = document.createElement("div");
  header.className = "widget-header";

  const title = document.createElement("div");
  title.className = "widget-title";

  const h2 = document.createElement("h2");
  h2.textContent = stepTitle(state.step);

  const p = document.createElement("p");
  p.textContent = stepSubtitle(state.step);

  title.appendChild(h2);
  title.appendChild(p);

  const indicator = document.createElement("div");
  indicator.className = "step-indicator";
  indicator.textContent = `Step ${state.step + 1} of 6`;

  header.appendChild(title);
  header.appendChild(indicator);

  const body = document.createElement("div");
  body.className = "widget-body";
  body.appendChild(renderStep());

  card.appendChild(header);
  card.appendChild(body);

  root.appendChild(card);
}

function stepTitle(stepIdx) {
  switch (steps[stepIdx]) {
    case "occasion": return "Tell us about your event";
    case "location": return "Where will your event be held?";
    case "guests": return "How many guests are you expecting?";
    case "experience": return "Build your event experience";
    case "contact": return "How can we reach you?";
    case "review": return "Review your event request";
    default: return "Event Request";
  }
}
function stepSubtitle(stepIdx) {
  switch (steps[stepIdx]) {
    case "occasion":
      return "This helps us understand the vibe and timing of your gathering.";
    case "location":
      return "Choose whether you’d like to host in our studio or at your own location.";
    case "guests":
      return "This helps us size your setup, staffing, and materials.";
    case "experience":
      return "Choose one craft option and any add-ons. Catering is in-studio only (not guaranteed).";
    case "contact":
      return "We’ll review your request and follow up to confirm details and availability.";
    case "review":
      return "This is an estimate. We’ll confirm final details and pricing with you directly.";
    default:
      return "";
  }
}

function renderStep() {
  switch (steps[state.step]) {
    case "occasion": return renderOccasion();
    case "location": return renderLocation();
    case "guests": return renderGuests();
    case "experience": return renderExperience();
    case "contact": return renderContact();
    case "review": return renderReview();
    default: return document.createTextNode("");
  }
}

// ====== UI HELPERS ======
function field({ label, el, help, required }) {
  const wrap = document.createElement("div");
  wrap.className = "field";

  const lab = document.createElement("label");
  lab.textContent = required ? `${label} *` : label;

  wrap.appendChild(lab);
  wrap.appendChild(el);

  if (help) {
    const h = document.createElement("div");
    h.className = "help";
    h.textContent = help;
    wrap.appendChild(h);
  }
  return wrap;
}
function errorBox(text) {
  if (!text) return document.createTextNode("");
  const div = document.createElement("div");
  div.className = "error";
  div.textContent = text;
  return div;
}
function nav({ backLabel = "Back", nextLabel = "Next", showBack = true, onBack, onNext, nextDisabled = false }) {
  const nav = document.createElement("div");
  nav.className = "nav";

  const left = document.createElement("div");
  left.className = "nav-left";

  const right = document.createElement("div");
  right.className = "nav-right";

  if (showBack) {
    const back = document.createElement("button");
    back.className = "secondary";
    back.textContent = backLabel;
    back.onclick = (e) => { e.preventDefault(); onBack?.(); };
    left.appendChild(back);
  }

  const next = document.createElement("button");
  next.className = "primary";
  next.textContent = nextLabel;
  next.disabled = !!nextDisabled;
  next.onclick = (e) => { e.preventDefault(); onNext?.(); };
  right.appendChild(next);

  nav.appendChild(left);
  nav.appendChild(right);
  return nav;
}
function pillButton({ title, desc, selected, onClick }) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "pill-btn" + (selected ? " selected" : "");
  btn.onclick = (e) => { e.preventDefault(); onClick?.(); };

  const strong = document.createElement("strong");
  strong.textContent = title;

  const span = document.createElement("span");
  span.textContent = desc;

  btn.appendChild(strong);
  btn.appendChild(span);
  return btn;
}
function checkboxRow({ labelText, checked, onChange, extraRight }) {
  const row = document.createElement("div");
  row.className = "checkbox-row";

  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.checked = !!checked;
  cb.onchange = () => onChange?.(cb.checked);

  const label = document.createElement("div");
  label.textContent = labelText;

  row.appendChild(cb);

  const content = document.createElement("div");
  content.appendChild(label);

  if (extraRight) content.appendChild(extraRight);
  row.appendChild(content);

  return row;
}
function radioRow({ name, labelText, value, checked, onChange }) {
  const row = document.createElement("div");
  row.className = "radio-row";

  const rb = document.createElement("input");
  rb.type = "radio";
  rb.name = name;
  rb.value = value;
  rb.checked = !!checked;
  rb.onchange = () => onChange?.(rb.value);

  const label = document.createElement("div");
  label.textContent = labelText;

  row.appendChild(rb);
  row.appendChild(label);
  return row;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#039;");
}
function escapeHtmlAttr(s) {
  return escapeHtml(s).replaceAll("`", "&#096;");
}

// ====== STEP 1: OCCASION ======
function renderOccasion() {
  const frag = document.createDocumentFragment();

  const selectOcc = document.createElement("select");
  const occOptions = ["", "Birthday", "Baby Shower", "Bridal Shower", "Corporate Event", "Girls’ Night", "Family Gathering", "Friend Gathering", "Other"];
  selectOcc.innerHTML = occOptions.map(o => `<option value="${escapeHtmlAttr(o)}">${o ? o : "Select occasion"}</option>`).join("");
  selectOcc.value = state.occasion;
  selectOcc.onchange = () => { state.occasion = selectOcc.value; render(); };
  frag.appendChild(field({ label: "Occasion", el: selectOcc, required: true }));

  if (state.occasion === "Other") {
    const other = document.createElement("input");
    other.type = "text";
    other.value = state.occasionOther;
    other.oninput = () => state.occasionOther = other.value;
    frag.appendChild(field({ label: "Please describe the occasion", el: other, required: true }));
  }

  const grid = document.createElement("div");
  grid.className = "grid-2";

  const date = document.createElement("input");
  date.type = "date";
  date.value = state.date;

  // IMPORTANT: enforce via attributes AND validation
  date.min = getMinDate();
  date.max = getMaxDate();

  date.oninput = () => state.date = date.value;

  const time = document.createElement("input");
  time.type = "time";
  time.value = state.time;
  time.min = "09:00";
  time.max = "19:00";
  time.oninput = () => state.time = time.value;

  grid.appendChild(field({ label: "Preferred Date", el: date, required: true, help: "Must be at least 7 days out and within the current calendar year." }));
  grid.appendChild(field({ label: "Preferred Time (between 9:00 AM and 7:00 PM)", el: time, required: true }));

  frag.appendChild(grid);

  const note = document.createElement("div");
  note.className = "small-note";
  note.textContent =
    "*Your requested date will be approved by staff to prevent double-bookings. Availability is not guaranteed until the first deposit is paid.";
  frag.appendChild(note);

  frag.appendChild(nav({
    showBack: false,
    onNext: () => {
      if (!state.occasion) return alert("Please select an occasion.");
      if (state.occasion === "Other" && !state.occasionOther.trim()) return alert("Please describe the occasion.");

      if (!state.date) return alert("Please select a date.");
      if (!state.time) return alert("Please select a time.");

      // Validate date again (don’t rely only on min/max attributes)
      const min = getMinDate();
      const max = getMaxDate();
      if (state.date < min) return alert("Please choose a date at least 7 days from today.");
      if (state.date > max) return alert("Please choose a date within the current calendar year.");

      // Validate time range
      if (state.time < "09:00" || state.time > "19:00") {
        return alert("Please choose a time between 9:00 AM and 7:00 PM.");
      }

      state.step = 1;
      render();
    }
  }));

  return frag;
}

// ====== STEP 2: LOCATION ======
function renderLocation() {
  const frag = document.createDocumentFragment();

  const pills = document.createElement("div");
  pills.className = "pill-buttons";

  pills.appendChild(pillButton({
    title: "In-Studio Private Event",
    desc: "Best for up to 20 people if crafts are included.",
    selected: state.location === "studio",
    onClick: () => { state.location = "studio"; render(); }
  }));
  pills.appendChild(pillButton({
    title: "Off-Site Private Event",
    desc: "We’ll estimate travel fee using ZIP code distance from the studio.",
    selected: state.location === "offsite",
    onClick: () => { state.location = "offsite"; render(); }
  }));

  frag.appendChild(pills);

  const note = document.createElement("div");
  note.className = "small-note";
  note.textContent =
    "*Our studio can best accommodate up to 20 people if crafts are included. We recommend booking an off-site event for parties larger than 20.";
  frag.appendChild(note);

  frag.appendChild(nav({
    showBack: true,
    onBack: () => { state.step = 0; render(); },
    onNext: () => {
      if (!state.location) return alert("Please select a location.");
      state.step = 2;
      render();
    }
  }));

  return frag;
}

// ====== STEP 3: GUESTS ======
function renderGuests() {
  const frag = document.createDocumentFragment();

  const grid = document.createElement("div");
  grid.className = "grid-2";

  if (state.location === "studio") {
    const select = document.createElement("select");
    select.innerHTML = [
      `<option value="">Select guests</option>`,
      `<option value="2">2</option>`,
      `<option value="5">5</option>`,
      `<option value="10">10</option>`,
      `<option value="15">15</option>`,
      `<option value="20">20</option>`,
    ].join("");
    select.value = state.guestCountStudio;
    select.onchange = () => state.guestCountStudio = select.value;

    grid.appendChild(field({ label: "Guest count (In-Studio)", el: select, required: true }));
  } else if (state.location === "offsite") {
    const input = document.createElement("input");
    input.type = "number";
    input.min = "15";
    input.max = "60";
    input.placeholder = "15–60";
    input.value = state.guestCountOffsite;
    input.oninput = () => state.guestCountOffsite = input.value;

    grid.appendChild(field({ label: "Guest count (Off-Site)", el: input, required: true, help: "Minimum 15 guests for off-site events." }));
  } else {
    frag.appendChild(errorBox("Please choose a location first."));
  }

  frag.appendChild(grid);

  frag.appendChild(nav({
    showBack: true,
    onBack: () => { state.step = 1; render(); },
    onNext: () => {
      if (state.location === "studio") {
        if (!state.guestCountStudio) return alert("Please select a guest count.");
      }
      if (state.location === "offsite") {
        const g = clampInt(state.guestCountOffsite, 15, 60);
        if (g === null) return alert("Please enter a guest count between 15 and 60.");
        state.guestCountOffsite = String(g);
      }
      state.step = 3;
      render();
    }
  }));

  return frag;
}

// ====== PRICING TABLES (studio) ======
function getStudioTierGuests() {
  return parseInt(state.guestCountStudio, 10);
}
function studioRentalFee(g) {
  if (g === 2) return 100;
  if (g === 5) return 100;
  if (g === 10) return 250;
  if (g === 15) return 300;
  if (g === 20) return 350;
  return 0;
}
function studioCraftsIncludedFee(g) {
  if (g === 2) return 80;
  if (g === 5) return 150;
  if (g === 10) return 300;
  if (g === 15) return 450;
  if (g === 20) return 600;
  return 0;
}
function studioGoodieBagsFee(g) {
  if (g === 2) return 0; // not available for 2 guests
  if (g === 5) return 50;
  if (g === 10) return 100;
  if (g === 15) return 150;
  if (g === 20) return 200;
  return 0;
}
function studioDecorationsFee() { return 50; }
function studioCateringDeliveryFee(g) {
  if (g === 2) return 25;
  if (g === 5) return 25;
  if (g === 10) return 35;
  if (g === 15) return 50;
  if (g === 20) return 60;
  return 0;
}
function studioCateringBrunchFee(g) {
  if (g === 2) return 70;
  if (g === 5) return 70;
  if (g === 10) return 241;
  if (g === 15) return 241;
  if (g === 20) return 467;
  return 0;
}
function studioCateringLunchFee(g) {
  if (g === 2) return 139;
  if (g === 5) return 139;
  if (g === 10) return 204;
  if (g === 15) return 204;
  if (g === 20) return 304;
  return 0;
}
function studioCateringDessertFee(g) {
  if (g === 2) return 78;
  if (g === 5) return 78;
  if (g === 10) return 78;
  if (g === 15) return 141;
  if (g === 20) return 141;
  return 0;
}

// ====== STEP 4: EXPERIENCE ======
function renderExperience() {
  const frag = document.createDocumentFragment();

  // Craft selection (single choice for both studio + offsite)
  const craftBox = document.createElement("div");
  craftBox.className = "review";

  const craftH = document.createElement("h3");
  craftH.textContent = "Choose a craft (select one)";
  craftBox.appendChild(craftH);

  const craftHelp = document.createElement("div");
  craftHelp.className = "help";
  craftHelp.textContent = "Please select one craft option. Custom crafts are welcome but may require additional planning and cost.";
  craftBox.appendChild(craftHelp);

  craftBox.appendChild(radioRow({
    name: "craftChoice",
    labelText: "Candle Making",
    value: "candle",
    checked: state.craftChoice === "candle",
    onChange: (v) => { state.craftChoice = v; render(); }
  }));
  craftBox.appendChild(radioRow({
    name: "craftChoice",
    labelText: "Jewelry / Charm Making",
    value: "jewelry",
    checked: state.craftChoice === "jewelry",
    onChange: (v) => { state.craftChoice = v; render(); }
  }));
  craftBox.appendChild(radioRow({
    name: "craftChoice",
    labelText: "Soap Making",
    value: "soap",
    checked: state.craftChoice === "soap",
    onChange: (v) => { state.craftChoice = v; render(); }
  }));
  craftBox.appendChild(radioRow({
    name: "craftChoice",
    labelText: "Custom craft request",
    value: "custom",
    checked: state.craftChoice === "custom",
    onChange: (v) => { state.craftChoice = v; render(); }
  }));

  if (state.craftChoice === "custom") {
    const custom = document.createElement("textarea");
    custom.placeholder = "Describe your custom craft request…";
    custom.value = state.customCraft;
    custom.oninput = () => state.customCraft = custom.value;

    craftBox.appendChild(field({ label: "Custom craft request details", el: custom, required: true }));

    const customNote = document.createElement("div");
    customNote.className = "small-note";
    customNote.textContent =
      "We’re excited to accommodate custom craft requests. Custom crafts may require additional research and preparation time and may incur additional costs. Final pricing will be determined after our team creates the craft plan.";
    craftBox.appendChild(customNote);
  }

  frag.appendChild(craftBox);

  if (state.location === "studio") {
    const g = getStudioTierGuests();

    // Crafts included checkbox (this is the pricing line item for studio)
    frag.appendChild(checkboxRow({
      labelText: g ? `Crafts Included (in-studio) — tier price ${money(studioCraftsIncludedFee(g))}` : "Crafts Included (in-studio)",
      checked: state.craftChoice !== "" && state.craftChoice !== "custom", // by default treat craft selection as "included"? NO.
      onChange: () => {
        // We intentionally do NOT toggle craftChoice here.
        // Craft choice is separate from whether crafts are included in estimate.
      },
      extraRight: (() => {
        const help = document.createElement("div");
        help.className = "help";
        help.textContent = "Craft selection is separate; pricing is based on the studio tier if crafts are included.";
        return help;
      })()
    }));

    // Goodie bags: hide for 2 guests
    if (g !== 2) {
      frag.appendChild(checkboxRow({
        labelText: `Goodie Bags (in-studio) — tier price ${money(studioGoodieBagsFee(g))}`,
        checked: state.goodieBags,
        onChange: (v) => { state.goodieBags = v; }
      }));
    } else {
      state.goodieBags = false; // ensure off
      const gbNote = document.createElement("div");
      gbNote.className = "small-note";
      gbNote.textContent = "Goodie Bags are not available for 2‑guest events.";
      frag.appendChild(gbNote);
    }

    frag.appendChild(checkboxRow({
      labelText: `Decorations (in-studio) — ${money(studioDecorationsFee())}`,
      checked: state.decorations,
      onChange: (v) => { state.decorations = v; }
    }));

    // Catering (still mutually exclusive brunch/lunch in logic, but no helper text)
    const cateringBox = document.createElement("div");
    cateringBox.className = "review";

    const cH = document.createElement("h3");
    cH.textContent = "Catering options (in-studio only)";
    cateringBox.appendChild(cH);

    const cHelp = document.createElement("div");
    cHelp.className = "help";
    cHelp.textContent =
      "Catering is not guaranteed and is subject to the caterer’s availability and pricing. Dietary meals are priced separately and not included in the estimate.";
    cateringBox.appendChild(cHelp);

    cateringBox.appendChild(checkboxRow({
      labelText: `Brunch – French breakfast pastries (${money(studioCateringBrunchFee(g))})`,
      checked: state.catering.brunch,
      onChange: (v) => { if (v) state.catering.lunch = false; state.catering.brunch = v; }
    }));
    cateringBox.appendChild(checkboxRow({
      labelText: `Lunch – sandwiches & artisan cheese trays (${money(studioCateringLunchFee(g))})`,
      checked: state.catering.lunch,
      onChange: (v) => { if (v) state.catering.brunch = false; state.catering.lunch = v; }
    }));
    cateringBox.appendChild(checkboxRow({
      labelText: `French confection dessert (${money(studioCateringDessertFee(g))})`,
      checked: state.catering.dessert,
      onChange: (v) => { state.catering.dessert = v; }
    }));

    const anyCatering = state.catering.brunch || state.catering.lunch || state.catering.dessert;

    // Dietary section
    const dietaryWrap = document.createElement("div");
    dietaryWrap.className = "review";
    const dietTitle = document.createElement("h3");
    dietTitle.textContent = "Dietary meals (priced separately)";
    dietaryWrap.appendChild(dietTitle);

    const dietNote = document.createElement("div");
    dietNote.className = "help";
    dietNote.textContent =
      "These meals are purchased separately from our third-party caterer and are NOT included in the estimate.";
    dietaryWrap.appendChild(dietNote);

    dietaryWrap.appendChild(dietaryRow("Gluten-Free", "glutenFree", !anyCatering));
    dietaryWrap.appendChild(dietaryRow("Vegan", "vegan", !anyCatering));
    dietaryWrap.appendChild(dietaryRow("Vegetarian", "vegetarian", !anyCatering));

    if (!anyCatering) {
      const muted = document.createElement("div");
      muted.className = "help";
      muted.textContent = "Select at least one catering option above to enable dietary meal requests.";
      dietaryWrap.appendChild(muted);
    }

    frag.appendChild(cateringBox);
    frag.appendChild(dietaryWrap);
  }

  if (state.location === "offsite") {
    // Address fields
    const addrGrid = document.createElement("div");
    addrGrid.className = "grid-2";

    const street = document.createElement("input");
    street.type = "text";
    street.value = state.addressStreet;
    street.oninput = () => state.addressStreet = street.value;

    const city = document.createElement("input");
    city.type = "text";
    city.value = state.addressCity;
    city.oninput = () => state.addressCity = city.value;

    const st = document.createElement("input");
    st.type = "text";
    st.value = state.addressState;
    st.placeholder = "CA";
    st.oninput = () => state.addressState = st.value;

    const zip = document.createElement("input");
    zip.type = "text";
    zip.inputMode = "numeric";
    zip.maxLength = 5;
    zip.value = state.addressZip;
    zip.placeholder = "92067";
    zip.oninput = () => state.addressZip = zip.value.replace(/[^\d]/g, "").slice(0, 5);

    addrGrid.appendChild(field({ label: "Street", el: street, required: true }));
    addrGrid.appendChild(field({ label: "City", el: city, required: true }));
    addrGrid.appendChild(field({ label: "State", el: st, required: true }));
    addrGrid.appendChild(field({
      label: "ZIP",
      el: zip,
      required: true,
      help: "We’ll use ZIP code only to estimate crow‑flies distance and travel fee."
    }));

    frag.appendChild(addrGrid);
  }

  frag.appendChild(nav({
    showBack: true,
    onBack: () => { state.step = 2; render(); },
    onNext: async () => {
      if (!state.craftChoice) return alert("Please choose one craft option.");

      if (state.craftChoice === "custom" && !state.customCraft.trim()) {
        return alert("Please describe your custom craft request.");
      }

      if (state.location === "studio") {
        if (!state.guestCountStudio) return alert("Please select a guest count first (Step 3).");
      }

      if (state.location === "offsite") {
        if (!state.addressStreet.trim() || !state.addressCity.trim() || !state.addressState.trim()) {
          return alert("Please complete the off-site address (street, city, state).");
        }
        if (!isValidUSZip(state.addressZip)) {
          return alert("Please enter a valid 5-digit US ZIP code.");
        }
      }

      state.step = 4;
      render();
    }
  }));

  return frag;
}

function dietaryRow(labelText, key, disabled) {
  const right = document.createElement("div");
  right.className = "inline";
  right.style.marginTop = "8px";

  const count = document.createElement("input");
  count.type = "number";
  count.min = "0";
  count.placeholder = "Count";
  count.value = String(state.dietary[key].count || 0);
  count.disabled = disabled || !state.dietary[key].enabled;
  count.oninput = () => {
    const v = clampInt(count.value, 0, 9999);
    state.dietary[key].count = v ?? 0;
  };

  right.appendChild(count);

  return checkboxRow({
    labelText,
    checked: state.dietary[key].enabled,
    onChange: (v) => {
      state.dietary[key].enabled = v;
      if (!v) state.dietary[key].count = 0;
      render();
    },
    extraRight: right
  });
}

// ====== STEP 5: CONTACT ======
function renderContact() {
  const frag = document.createDocumentFragment();

  const grid = document.createElement("div");
  grid.className = "grid-2";

  const name = document.createElement("input");
  name.type = "text";
  name.value = state.name;
  name.oninput = () => state.name = name.value;

  const email = document.createElement("input");
  email.type = "email";
  email.value = state.email;
  email.oninput = () => state.email = email.value;

  const phone = document.createElement("input");
  phone.type = "tel";
  phone.placeholder = "(555) 555-5555";
  phone.value = state.phone;
  phone.oninput = () => state.phone = phone.value;

  const notes = document.createElement("textarea");
  notes.value = state.notes;
  notes.placeholder = "Anything else? (optional)";
  notes.oninput = () => state.notes = notes.value;

  grid.appendChild(field({ label: "Name", el: name, required: true }));
  grid.appendChild(field({ label: "Email", el: email, required: true }));
  grid.appendChild(field({ label: "Phone", el: phone, required: true, help: "Please enter a valid phone number." }));
  grid.appendChild(field({ label: "Notes (optional)", el: notes }));

  frag.appendChild(grid);

  frag.appendChild(nav({
    showBack: true,
    onBack: () => { state.step = 3; render(); },
    onNext: async () => {
      if (!state.name.trim()) return alert("Please enter your name.");
      if (!validateEmail(state.email)) return alert("Please enter a valid email.");
      if (!validatePhone(state.phone)) return alert("Please enter a valid phone number.");

      if (state.location === "offsite") {
        const ok = await calculateDistanceAndTravelFee();
        if (!ok) return;
      } else {
        state.distanceMiles = 0;
        state.travelFee = 0;
        state.travelError = "";
      }

      state.step = 5;
      render();
    }
  }));

  frag.appendChild(errorBox(state.travelError));

  return frag;
}

// ====== STEP 6: REVIEW ======
function renderReview() {
  const frag = document.createDocumentFragment();
  state.totals = calculateTotals();

  const banner = document.createElement("div");
  banner.className = "important-banner";
  banner.innerHTML = `<strong>Important:</strong> Your request is <b>not submitted</b> until you click <b>Submit</b> on the bottom right.`;
  frag.appendChild(banner);

  const review = document.createElement("div");
  review.className = "review";

  const h3 = document.createElement("h3");
  h3.textContent = "Summary";
  review.appendChild(h3);

  const ul = document.createElement("ul");
  ul.className = "review-list";

  const occasionText = state.occasion === "Other" ? state.occasionOther : state.occasion;

  ul.appendChild(li(`<b>Occasion:</b> ${escapeHtml(occasionText)}`));
  ul.appendChild(li(`<b>Date & Time:</b> ${escapeHtml(state.date)} at ${escapeHtml(state.time)}`));
  ul.appendChild(li(`<b>Location:</b> ${state.location === "studio" ? "In-Studio Private Event" : "Off-Site Private Event"}`));

  if (state.location === "studio") {
    ul.appendChild(li(`<b>Guest Count:</b> ${escapeHtml(state.guestCountStudio)}`));
  } else {
    ul.appendChild(li(`<b>Guest Count:</b> ${escapeHtml(state.guestCountOffsite)}`));
    ul.appendChild(li(`<b>Address:</b> ${escapeHtml(state.addressStreet)}, ${escapeHtml(state.addressCity)}, ${escapeHtml(state.addressState)} ${escapeHtml(state.addressZip)}`));
    ul.appendChild(li(`<b>Estimated Distance (ZIP-only):</b> ${roundTo1Decimal(state.distanceMiles).toFixed(1)} miles`));
    ul.appendChild(li(`<b>Travel Fee:</b> ${money(state.travelFee)}`));
  }

  ul.appendChild(li(`<b>Craft:</b> ${escapeHtml(craftLabel())}`));
  if (state.craftChoice === "custom") {
    ul.appendChild(li(`<b>Custom craft request:</b> ${escapeHtml(state.customCraft.trim())}`));
    ul.appendChild(li(`<i>Reminder:</i> custom crafts may require additional prep and cost to be determined later.`));
  }

  if (state.location === "studio") {
    if (parseInt(state.guestCountStudio, 10) !== 2) {
      ul.appendChild(li(`<b>Goodie Bags:</b> ${state.goodieBags ? "Yes" : "No"}`));
    }
    ul.appendChild(li(`<b>Decorations:</b> ${state.decorations ? "Yes" : "No"}`));

    const cateringSelected = state.catering.brunch || state.catering.lunch || state.catering.dessert;
    const cateringList = [
      state.catering.brunch ? "Brunch" : "",
      state.catering.lunch ? "Lunch" : "",
      state.catering.dessert ? "French confection dessert" : ""
    ].filter(Boolean).join(", ") || "None";

    ul.appendChild(li(`<b>Catering:</b> ${escapeHtml(cateringList)}`));

    if (cateringSelected) {
      const d = dietarySummary();
      if (d) {
        ul.appendChild(li(`<b>Dietary meals (separate pricing):</b> ${escapeHtml(d)}`));
        ul.appendChild(li(`<i>Reminder:</i> dietary meals are not included in this estimate and will be priced separately.`));
      }
    }
  }

  ul.appendChild(li(`<b>Name:</b> ${escapeHtml(state.name)}`));
  ul.appendChild(li(`<b>Email:</b> ${escapeHtml(state.email)}`));
  ul.appendChild(li(`<b>Phone:</b> ${escapeHtml(state.phone)}`));
  if (state.notes.trim()) ul.appendChild(li(`<b>Notes:</b> ${escapeHtml(state.notes.trim())}`));

  review.appendChild(ul);
  frag.appendChild(review);

  // Itemized estimate
  const totals = document.createElement("div");
  totals.className = "review";

  const h3t = document.createElement("h3");
  h3t.textContent = "Itemized Estimate";
  totals.appendChild(h3t);

  state.totals.breakdownLines.forEach(({ label, amount, taxable }) => {
    const kv = document.createElement("div");
    kv.className = "kv";
    const k = document.createElement("div");
    k.className = "k";
    k.textContent = taxable ? `${label} (taxable)` : label;
    const v = document.createElement("div");
    v.className = "v";
    v.textContent = money(amount);
    kv.appendChild(k);
    kv.appendChild(v);
    totals.appendChild(kv);
  });

  const divider = document.createElement("div");
  divider.className = "totals";
  divider.appendChild(kvLine("Taxable Subtotal", money(state.totals.taxableSubtotal)));
  divider.appendChild(kvLine("Non‑Taxable Subtotal", money(state.totals.nonTaxableSubtotal)));
  divider.appendChild(kvLine(`Estimated Tax (${(TAX_RATE * 100).toFixed(2)}%)`, money(state.totals.taxAmount)));

  const totalBox = document.createElement("div");
  totalBox.className = "total-box";
  totalBox.innerHTML = `<div class="label">Estimated Total</div><div class="amount">${money(state.totals.total)}</div>`;
  divider.appendChild(totalBox);

  totals.appendChild(divider);

  const notes = document.createElement("div");
  notes.className = "small-note";
  notes.textContent =
    "Important: Catering and dietary meals are subject to availability and pricing from our third-party caterer. Dietary meals are priced separately and are not included in this estimate.";
  totals.appendChild(notes);

  frag.appendChild(totals);

  const status = document.createElement("div");
  status.id = "submit-status";
  frag.appendChild(status);

  frag.appendChild(nav({
    showBack: true,
    nextLabel: "Submit Event Request",
    onBack: () => { state.step = 4; render(); },
    onNext: async () => { await submitEmail(); }
  }));

  return frag;
}

function li(html) {
  const li = document.createElement("li");
  li.innerHTML = html;
  return li;
}
function kvLine(kText, vText) {
  const kv = document.createElement("div");
  kv.className = "kv";
  kv.innerHTML = `<div class="k">${escapeHtml(kText)}</div><div class="v">${escapeHtml(vText)}</div>`;
  return kv;
}

// ====== TOTALS CALC ======
function calculateTotals() {
  const breakdownLines = [];
  let taxableSubtotal = 0;
  let nonTaxableSubtotal = 0;

  if (state.location === "studio") {
    const g = getStudioTierGuests();

    const rental = studioRentalFee(g);
    if (rental) {
      breakdownLines.push({ label: "Private Rental Fee", amount: rental, taxable: false });
      nonTaxableSubtotal += rental;
    }

    // Crafts Included is charged if ANY craft is selected (including custom request)
    // If you want custom crafts to NOT be included in estimate, tell me and I'll change this.
    const craftsIncluded = studioCraftsIncludedFee(g);
    if (craftsIncluded) {
      breakdownLines.push({ label: "Crafts Included", amount: craftsIncluded, taxable: true });
      taxableSubtotal += craftsIncluded;
    }

    if (parseInt(state.guestCountStudio, 10) !== 2 && state.goodieBags) {
      const gb = studioGoodieBagsFee(g);
      if (gb) {
        breakdownLines.push({ label: "Goodie Bags", amount: gb, taxable: true });
        taxableSubtotal += gb;
      }
    }

    if (state.decorations) {
      const deco = studioDecorationsFee();
      breakdownLines.push({ label: "Decorations", amount: deco, taxable: true });
      taxableSubtotal += deco;
    }

    const cateringSelected = state.catering.brunch || state.catering.lunch || state.catering.dessert;
    let cateringTotal = 0;
    if (state.catering.brunch) cateringTotal += studioCateringBrunchFee(g);
    if (state.catering.lunch) cateringTotal += studioCateringLunchFee(g);
    if (state.catering.dessert) cateringTotal += studioCateringDessertFee(g);

    if (cateringTotal) {
      breakdownLines.push({ label: "Catering", amount: cateringTotal, taxable: true });
      taxableSubtotal += cateringTotal;
    }

    if (cateringSelected) {
      const del = studioCateringDeliveryFee(g);
      breakdownLines.push({ label: "Delivery & Set-Up Fee", amount: del, taxable: false });
      nonTaxableSubtotal += del;
    }
  }

  if (state.location === "offsite") {
    const g = parseInt(state.guestCountOffsite, 10) || 0;

    // Off-site crafts estimate: $30 per guest (since one craft must be selected)
    if (g > 0) {
      const crafts = g * 30;
      breakdownLines.push({ label: "Crafts (off-site)", amount: crafts, taxable: true });
      taxableSubtotal += crafts;
    }

    if (state.travelFee > 0) {
      breakdownLines.push({ label: "Travel Fee", amount: state.travelFee, taxable: false });
      nonTaxableSubtotal += state.travelFee;
    }
  }

  const taxAmount = taxableSubtotal * TAX_RATE;
  const total = taxableSubtotal + nonTaxableSubtotal + taxAmount;

  return { breakdownLines, taxableSubtotal, nonTaxableSubtotal, taxAmount, total };
}

function craftLabel() {
  switch (state.craftChoice) {
    case "candle": return "Candle Making";
    case "jewelry": return "Jewelry / Charm Making";
    case "soap": return "Soap Making";
    case "custom": return "Custom craft request";
    default: return "—";
  }
}

function dietarySummary() {
  const parts = [];
  if (state.dietary.glutenFree.enabled && state.dietary.glutenFree.count > 0) parts.push(`Gluten‑Free: ${state.dietary.glutenFree.count}`);
  if (state.dietary.vegan.enabled && state.dietary.vegan.count > 0) parts.push(`Vegan: ${state.dietary.vegan.count}`);
  if (state.dietary.vegetarian.enabled && state.dietary.vegetarian.count > 0) parts.push(`Vegetarian: ${state.dietary.vegetarian.count}`);
  return parts.join(", ");
}

// ====== DISTANCE + TRAVEL FEE ======
async function calculateDistanceAndTravelFee() {
  state.travelError = "";

  if (!isValidUSZip(state.addressZip)) {
    state.travelError = "Please enter a valid 5-digit US ZIP code for off-site travel fee estimation.";
    render();
    return false;
  }

  try {
    const url = `https://api.zippopotam.us/us/${state.addressZip}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("ZIP not found");

    const data = await res.json();
    const place = data?.places?.[0];
    if (!place) throw new Error("ZIP not found");

    const lat = parseFloat(place.latitude);
    const lon = parseFloat(place.longitude);
    const miles = haversineMiles(STUDIO_LAT, STUDIO_LON, lat, lon);

    state.distanceMiles = miles;

    if (miles <= TRAVEL_INCLUDED_MILES) {
      state.travelFee = TRAVEL_BASE_FEE;
    } else {
      state.travelFee = TRAVEL_BASE_FEE + (miles - TRAVEL_INCLUDED_MILES) * TRAVEL_PER_MILE_OVER;
    }
    state.travelFee = Math.round(state.travelFee * 100) / 100;

    return true;
  } catch (e) {
    state.travelError = "We couldn't estimate distance from that ZIP code. Please double-check the ZIP and try again.";
    render();
    return false;
  }
}

function haversineMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.7613; // miles
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ====== SUBMIT EMAIL (EmailJS) ======
async function submitEmail() {
  const statusDiv = document.getElementById("submit-status");
  if (statusDiv) statusDiv.textContent = "Submitting...";

  if (!window.emailjs) {
    if (statusDiv) statusDiv.textContent = "EmailJS is not loaded (SDK missing).";
    return;
  }

  if (!EMAILJS_PUBLIC_KEY || !EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID) {
    if (statusDiv) statusDiv.textContent = "EmailJS is not fully configured.";
    return;
  }

  const totals = state.totals || calculateTotals();

  const payload = {
    to_email: "studio@vesperdesign.com",
    reply_to: state.email,
    from_name: state.name,
    
    name: state.name,
    email: state.email,
    phone: state.phone,
    notes: state.notes,

    occasion: state.occasion === "Other" ? state.occasionOther : state.occasion,
    date: state.date,
    time: state.time,
    location: state.location === "studio" ? "In-Studio Private Event" : "Off-Site Private Event",
    guests: state.location === "studio" ? state.guestCountStudio : state.guestCountOffsite,

    craft: craftLabel(),
    custom_craft_details: state.craftChoice === "custom" ? state.customCraft.trim() : "",

    address: state.location === "offsite"
      ? `${state.addressStreet}, ${state.addressCity}, ${state.addressState} ${state.addressZip}`
      : "",

    distance_miles: state.location === "offsite" ? roundTo1Decimal(state.distanceMiles).toFixed(1) : "",
    travel_fee: state.location === "offsite" ? money(state.travelFee) : "",

    taxable_subtotal: money(totals.taxableSubtotal),
    nontaxable_subtotal: money(totals.nonTaxableSubtotal),
    tax_amount: money(totals.taxAmount),
    total: money(totals.total),

    dietary_meals_note:
      "Dietary meals (gluten-free, vegan, vegetarian) are priced separately and are not included in this estimate.",
    dietary_meals_detail: dietarySummary(),

    summary_text: buildPlainTextSummary(totals),

    customer_copy_email: state.email,
  };

  try {
    await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, payload);
    if (statusDiv) statusDiv.textContent = "Thank you! Your request has been sent.";
  } catch (e) {
    if (statusDiv) statusDiv.textContent = "Submission failed. Please try again or contact us directly.";
  }
}

function buildPlainTextSummary(totals) {
  const lines = [];
  lines.push(`Occasion: ${state.occasion === "Other" ? state.occasionOther : state.occasion}`);
  lines.push(`Date/Time: ${state.date} @ ${state.time}`);
  lines.push(`Location: ${state.location === "studio" ? "In-Studio" : "Off-Site"}`);
  lines.push(`Guests: ${state.location === "studio" ? state.guestCountStudio : state.guestCountOffsite}`);
  lines.push(`Craft: ${craftLabel()}`);

  if (state.craftChoice === "custom" && state.customCraft.trim()) {
    lines.push(`Custom craft details: ${state.customCraft.trim()}`);
    lines.push(`Reminder: custom crafts may require additional prep and cost to be determined later.`);
  }

  if (state.location === "offsite") {
    lines.push(`Address: ${state.addressStreet}, ${state.addressCity}, ${state.addressState} ${state.addressZip}`);
    lines.push(`Estimated miles (ZIP-only): ${roundTo1Decimal(state.distanceMiles).toFixed(1)}`);
    lines.push(`Travel fee: ${money(state.travelFee)}`);
  } else {
    lines.push(`Goodie bags: ${parseInt(state.guestCountStudio, 10) === 2 ? "N/A" : (state.goodieBags ? "Yes" : "No")}`);
    lines.push(`Decorations: ${state.decorations ? "Yes" : "No"}`);
    lines.push(`Catering: ${
      [
        state.catering.brunch ? "Brunch" : "",
        state.catering.lunch ? "Lunch" : "",
        state.catering.dessert ? "Dessert" : "",
      ].filter(Boolean).join(", ") || "None"
    }`);
    const ds = dietarySummary();
    if (ds) {
      lines.push(`Dietary meals (separate pricing): ${ds}`);
      lines.push(`Reminder: dietary meals are not included in estimate.`);
    }
  }

  if (state.notes.trim()) lines.push(`Notes: ${state.notes.trim()}`);

  lines.push("");
  lines.push("Itemized estimate:");
  totals.breakdownLines.forEach(l => lines.push(`- ${l.label}: ${money(l.amount)}${l.taxable ? " (taxable)" : ""}`));
  lines.push(`Taxable subtotal: ${money(totals.taxableSubtotal)}`);
  lines.push(`Non-taxable subtotal: ${money(totals.nonTaxableSubtotal)}`);
  lines.push(`Estimated tax (7.75%): ${money(totals.taxAmount)}`);
  lines.push(`Estimated total: ${money(totals.total)}`);

  return lines.join("\n");
}


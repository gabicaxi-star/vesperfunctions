// Vesper Event Estimate Widget (vanilla JS)
// - 6-step flow
// - Studio vs off-site rules
// - Travel fee from ZIP via zippopotam.us + Haversine
// - Pricing table (studio) + off-site crafts pricing
// - Dietary meals are separate / not included
// - EmailJS optional submit

// ====== CONFIG ======
const TAX_RATE = 0.0775;

// Studio location: 16089 San Dieguito Rd, Rancho Santa Fe, CA 92067
// NOTE: These are approximate coordinates for that address area.
// If you want exact coordinates, replace these two values.
const STUDIO_LAT = 33.0187;
const STUDIO_LON = -117.2036;
const STUDIO_ZIP = "92067";

// Travel fee policy
const TRAVEL_BASE_FEE = 100;     // dollars
const TRAVEL_INCLUDED_MILES = 10; // miles
const TRAVEL_PER_MILE_OVER = 5;   // dollars per mile (over included miles)

// EmailJS (fill these in if you want email sending)
const EMAILJS_PUBLIC_KEY = "uLluCpNs5klM8XWml"; // public is OK
const EMAILJS_SERVICE_ID = "YOUR_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID";

// ====== STATE ======
const steps = ["occasion", "location", "guests", "experience", "contact", "review"];

const state = {
  step: 0,

  // Step 1: occasion/time
  occasion: "",
  occasionOther: "",
  date: "",
  time: "",

  // Step 2: location
  location: "", // 'studio' | 'offsite'

  // Step 3: guests
  guestCountStudio: "",  // "2" | "5" | "10" | "15" | "20"
  guestCountOffsite: "", // number string

  // Step 4: experience
  crafts: {
    included: false,     // studio "Crafts Included" (tiered)
    candle: false,       // offsite only (still used for display)
    jewelry: false,
    soap: false,
  },
  customCraft: "",

  goodieBags: false,
  decorations: false,

  catering: {
    brunch: false,
    lunch: false,
    dessert: false,
  },

  dietary: {
    glutenFree: { enabled: false, count: 0 },
    vegan: { enabled: false, count: 0 },
    vegetarian: { enabled: false, count: 0 },
  },

  // Off-site address (collected but travel uses ZIP only)
  addressStreet: "",
  addressCity: "",
  addressState: "",
  addressZip: "",

  // Step 5: contact
  name: "",
  email: "",
  phone: "",
  notes: "",

  // Calculated
  distanceMiles: 0,
  travelFee: 0,
  travelError: "",

  totals: null, // computed on review
};

function money(n) {
  return `$${(n || 0).toFixed(2)}`;
}
function clampInt(value, min, max) {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return null;
  return Math.max(min, Math.min(max, n));
}
function isValidUSZip(zip) {
  return /^\d{5}$/.test(zip);
}
function validateEmail(email) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}
function roundTo1Decimal(n) {
  return Math.round(n * 10) / 10;
}

// One week from today; max end of year
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
  // EmailJS init is optional. If not configured, submit will show a helpful message.
  if (window.emailjs && EMAILJS_PUBLIC_KEY && EMAILJS_PUBLIC_KEY !== "YOUR_PUBLIC_KEY") {
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
      return "Select crafts and add-ons. Catering is available for in-studio events only (not guaranteed).";
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
  date.min = getMinDate();
  date.max = getMaxDate();
  date.oninput = () => state.date = date.value;

  const time = document.createElement("input");
  time.type = "time";
  time.value = state.time;
  time.min = "09:00";
  time.max = "19:00";
  time.oninput = () => state.time = time.value;

  grid.appendChild(field({ label: "Preferred Date", el: date, required: true }));
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
    const msg = document.createElement("div");
    msg.className = "help";
    msg.textContent = "Please choose a location first.";
    frag.appendChild(msg);
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

// Rental fee by tier (non-taxable)
function studioRentalFee(g) {
  if (g === 2) return 100;
  if (g === 5) return 100;
  if (g === 10) return 250;
  if (g === 15) return 300;
  if (g === 20) return 350;
  return 0;
}

// Crafts included price by tier (taxable)
function studioCraftsIncludedFee(g) {
  if (g === 2) return 80;
  if (g === 5) return 150;
  if (g === 10) return 300;
  if (g === 15) return 450;
  if (g === 20) return 600;
  return 0;
}

// Goodie bags by tier (taxable) - not included for 2 per your screenshot
function studioGoodieBagsFee(g) {
  if (g === 2) return 0;
  if (g === 5) return 50;
  if (g === 10) return 100;
  if (g === 15) return 150;
  if (g === 20) return 200;
  return 0;
}

// Decorations (taxable, flat)
function studioDecorationsFee() {
  return 50;
}

// Catering delivery & setup fee by tier (non-taxable)
function studioCateringDeliveryFee(g) {
  if (g === 2) return 25;
  if (g === 5) return 25;
  if (g === 10) return 35;
  if (g === 15) return 50;
  if (g === 20) return 60;
  return 0;
}

// Catering items (taxable)
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

  if (state.location === "studio") {
    const g = getStudioTierGuests();

    // Crafts included
    const craftsRow = checkboxRow({
      labelText: "Crafts Included (in-studio)",
      checked: state.crafts.included,
      onChange: (v) => { state.crafts.included = v; },
      extraRight: (() => {
        const help = document.createElement("div");
        help.className = "help";
        help.textContent = g ? `Tier price: ${money(studioCraftsIncludedFee(g))}` : "Select guest count first.";
        return help;
      })()
    });
    frag.appendChild(craftsRow);

    // Goodie bags
    frag.appendChild(checkboxRow({
      labelText: "Goodie Bags (in-studio)",
      checked: state.goodieBags,
      onChange: (v) => { state.goodieBags = v; },
      extraRight: (() => {
        const help = document.createElement("div");
        help.className = "help";
        help.textContent = g ? `Tier price: ${money(studioGoodieBagsFee(g))}` : "Select guest count first.";
        return help;
      })()
    }));

    // Decorations
    frag.appendChild(checkboxRow({
      labelText: `Decorations (in-studio) — ${money(studioDecorationsFee())}`,
      checked: state.decorations,
      onChange: (v) => { state.decorations = v; }
    }));

    // Catering section
    const cateringHeader = document.createElement("div");
    cateringHeader.className = "field";
    const cateringLabel = document.createElement("label");
    cateringLabel.textContent = "Catering options (in-studio only)";
    const cateringHelp = document.createElement("div");
    cateringHelp.className = "help";
    cateringHelp.textContent =
      "Catering is not guaranteed and is subject to the caterer’s availability and pricing. Dietary meals are priced separately and not included in the estimate.";
    cateringHeader.appendChild(cateringLabel);
    cateringHeader.appendChild(cateringHelp);
    frag.appendChild(cateringHeader);

    // Catering checkboxes
    frag.appendChild(checkboxRow({
      labelText: `Brunch – French breakfast pastries (${money(studioCateringBrunchFee(g))})`,
      checked: state.catering.brunch,
      onChange: (v) => { if (v) state.catering.lunch = false; state.catering.brunch = v; },
      extraRight: (() => {
        const note = document.createElement("div");
        note.className = "help";
        note.textContent = "Brunch and Lunch are mutually exclusive.";
        return note;
      })()
    }));
    frag.appendChild(checkboxRow({
      labelText: `Lunch – sandwiches & artisan cheese trays (${money(studioCateringLunchFee(g))})`,
      checked: state.catering.lunch,
      onChange: (v) => { if (v) state.catering.brunch = false; state.catering.lunch = v; },
      extraRight: (() => {
        const note = document.createElement("div");
        note.className = "help";
        note.textContent = "Brunch and Lunch are mutually exclusive.";
        return note;
      })()
    }));
    frag.appendChild(checkboxRow({
      labelText: `French confection dessert (${money(studioCateringDessertFee(g))})`,
      checked: state.catering.dessert,
      onChange: (v) => { state.catering.dessert = v; }
    }));

    // Dietary meals: only if any catering selected
    const anyCatering = state.catering.brunch || state.catering.lunch || state.catering.dessert;
    const dietaryWrap = document.createElement("div");
    dietaryWrap.className = "review";

    const dietTitle = document.createElement("h3");
    dietTitle.textContent = "Dietary meals (priced separately)";
    dietaryWrap.appendChild(dietTitle);

    const dietNote = document.createElement("div");
    dietNote.className = "help";
    dietNote.textContent =
      "If selected, we will coordinate with the caterer. These meals are purchased separately and are NOT included in the estimate.";
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

    frag.appendChild(dietaryWrap);

    // Custom craft request (optional text)
    const custom = document.createElement("textarea");
    custom.placeholder = "Custom craft request (optional)";
    custom.value = state.customCraft;
    custom.oninput = () => state.customCraft = custom.value;
    frag.appendChild(field({ label: "Custom craft request (optional)", el: custom }));

  } else if (state.location === "offsite") {
    // Off-site: crafts checkboxes (informational for estimate — any craft triggers $30/person)
    const craftWrap = document.createElement("div");
    craftWrap.className = "review";
    const h3 = document.createElement("h3");
    h3.textContent = "Crafts (off-site)";
    craftWrap.appendChild(h3);

    const help = document.createElement("div");
    help.className = "help";
    help.textContent = "Off-site crafts are estimated at $30 per guest if any craft is selected.";
    craftWrap.appendChild(help);

    craftWrap.appendChild(simpleCraftRow("Candle Making", "candle"));
    craftWrap.appendChild(simpleCraftRow("Jewelry / Charm Making", "jewelry"));
    craftWrap.appendChild(simpleCraftRow("Soap Making", "soap"));

    frag.appendChild(craftWrap);

    const custom = document.createElement("textarea");
    custom.placeholder = "Custom craft request (optional)";
    custom.value = state.customCraft;
    custom.oninput = () => state.customCraft = custom.value;
    frag.appendChild(field({ label: "Custom craft request (optional)", el: custom }));

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

  } else {
    frag.appendChild(errorBox("Please select a location first."));
  }

  frag.appendChild(nav({
    showBack: true,
    onBack: () => { state.step = 2; render(); },
    onNext: async () => {
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

function simpleCraftRow(labelText, key) {
  return checkboxRow({
    labelText,
    checked: state.crafts[key],
    onChange: (v) => { state.crafts[key] = v; },
  });
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
  phone.value = state.phone;
  phone.oninput = () => state.phone = phone.value;

  const notes = document.createElement("textarea");
  notes.value = state.notes;
  notes.placeholder = "Anything else? (optional)";
  notes.oninput = () => state.notes = notes.value;

  grid.appendChild(field({ label: "Name", el: name, required: true }));
  grid.appendChild(field({ label: "Email", el: email, required: true }));
  grid.appendChild(field({ label: "Phone", el: phone, required: true }));
  grid.appendChild(field({ label: "Notes (optional)", el: notes }));

  frag.appendChild(grid);

  frag.appendChild(nav({
    showBack: true,
    onBack: () => { state.step = 3; render(); },
    onNext: async () => {
      if (!state.name.trim()) return alert("Please enter your name.");
      if (!validateEmail(state.email)) return alert("Please enter a valid email.");
      if (!state.phone.trim()) return alert("Please enter a phone number.");

      // Pre-calc distance/travel for offsite (so review step can display it)
      if (state.location === "offsite") {
        const ok = await calculateDistanceAndTravelFee();
        if (!ok) return; // show error on screen
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

  // Compute totals (estimate)
  state.totals = calculateTotals();

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

  if (state.location === "studio") {
    ul.appendChild(li(`<b>Crafts Included:</b> ${state.crafts.included ? "Yes" : "No"}`));
    ul.appendChild(li(`<b>Goodie Bags:</b> ${state.goodieBags ? "Yes" : "No"}`));
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
  } else {
    const craftsChosen = offsiteCraftSummary();
    ul.appendChild(li(`<b>Crafts selected:</b> ${escapeHtml(craftsChosen)}`));
  }

  if (state.customCraft.trim()) {
    ul.appendChild(li(`<b>Custom craft request:</b> ${escapeHtml(state.customCraft.trim())}`));
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

  const itemLines = state.totals.breakdownLines;

  itemLines.forEach(({ label, amount, taxable }) => {
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
  const lbl = document.createElement("div");
  lbl.className = "label";
  lbl.textContent = "Estimated Total";
  const amt = document.createElement("div");
  amt.className = "amount";
  amt.textContent = money(state.totals.total);
  totalBox.appendChild(lbl);
  totalBox.appendChild(amt);

  divider.appendChild(totalBox);
  totals.appendChild(divider);

  const notes = document.createElement("div");
  notes.className = "small-note";
  notes.textContent =
    "Important: Catering and dietary meals are subject to availability and pricing from our third-party caterer. Dietary meals are priced separately and are not included in this estimate.";
  totals.appendChild(notes);

  frag.appendChild(totals);

  // Submit status
  const status = document.createElement("div");
  status.id = "submit-status";
  frag.appendChild(status);

  frag.appendChild(nav({
    showBack: true,
    nextLabel: "Submit Event Request",
    onBack: () => { state.step = 4; render(); },
    onNext: async () => {
      await submitEmail();
    }
  }));

  return frag;
}

function kvLine(kText, vText) {
  const kv = document.createElement("div");
  kv.className = "kv";
  const k = document.createElement("div");
  k.className = "k";
  k.textContent = kText;
  const v = document.createElement("div");
  v.className = "v";
  v.textContent = vText;
  kv.appendChild(k);
  kv.appendChild(v);
  return kv;
}

function li(html) {
  const li = document.createElement("li");
  li.innerHTML = html;
  return li;
}

function offsiteCraftSummary() {
  const chosen = [];
  if (state.crafts.candle) chosen.push("Candle Making");
  if (state.crafts.jewelry) chosen.push("Jewelry / Charm Making");
  if (state.crafts.soap) chosen.push("Soap Making");
  return chosen.length ? chosen.join(", ") : "None";
}

function dietarySummary() {
  const parts = [];
  if (state.dietary.glutenFree.enabled && state.dietary.glutenFree.count > 0) parts.push(`Gluten‑Free: ${state.dietary.glutenFree.count}`);
  if (state.dietary.vegan.enabled && state.dietary.vegan.count > 0) parts.push(`Vegan: ${state.dietary.vegan.count}`);
  if (state.dietary.vegetarian.enabled && state.dietary.vegetarian.count > 0) parts.push(`Vegetarian: ${state.dietary.vegetarian.count}`);
  return parts.join(", ");
}

// ====== TOTALS CALC ======
function calculateTotals() {
  const breakdownLines = [];
  let taxableSubtotal = 0;
  let nonTaxableSubtotal = 0;

  if (state.location === "studio") {
    const g = getStudioTierGuests();

    // Rental (non-taxable)
    const rental = studioRentalFee(g);
    if (rental) {
      breakdownLines.push({ label: "Private Rental Fee", amount: rental, taxable: false });
      nonTaxableSubtotal += rental;
    }

    // Crafts included (taxable)
    if (state.crafts.included) {
      const crafts = studioCraftsIncludedFee(g);
      if (crafts) {
        breakdownLines.push({ label: "Crafts Included", amount: crafts, taxable: true });
        taxableSubtotal += crafts;
      }
    }

    // Goodie bags (taxable)
    if (state.goodieBags) {
      const gb = studioGoodieBagsFee(g);
      if (gb) {
        breakdownLines.push({ label: "Goodie Bags", amount: gb, taxable: true });
        taxableSubtotal += gb;
      }
    }

    // Decorations (taxable)
    if (state.decorations) {
      const deco = studioDecorationsFee();
      breakdownLines.push({ label: "Decorations", amount: deco, taxable: true });
      taxableSubtotal += deco;
    }

    // Catering (taxable)
    const cateringSelected = state.catering.brunch || state.catering.lunch || state.catering.dessert;
    let cateringTotal = 0;
    if (state.catering.brunch) cateringTotal += studioCateringBrunchFee(g);
    if (state.catering.lunch) cateringTotal += studioCateringLunchFee(g);
    if (state.catering.dessert) cateringTotal += studioCateringDessertFee(g);

    if (cateringTotal) {
      breakdownLines.push({ label: "Catering", amount: cateringTotal, taxable: true });
      taxableSubtotal += cateringTotal;
    }

    // Catering delivery (non-taxable) if any catering selected
    if (cateringSelected) {
      const del = studioCateringDeliveryFee(g);
      breakdownLines.push({ label: "Delivery & Set-Up Fee", amount: del, taxable: false });
      nonTaxableSubtotal += del;
    }

    // Travel fee: not for studio
  }

  if (state.location === "offsite") {
    const g = parseInt(state.guestCountOffsite, 10) || 0;

    // Crafts: $30 per guest if any craft is selected
    const anyCraft = state.crafts.candle || state.crafts.jewelry || state.crafts.soap;
    if (anyCraft && g > 0) {
      const crafts = g * 30;
      breakdownLines.push({ label: "Crafts (off-site)", amount: crafts, taxable: true });
      taxableSubtotal += crafts;
    }

    // Travel fee (non-taxable)
    if (state.travelFee > 0) {
      breakdownLines.push({ label: "Travel Fee", amount: state.travelFee, taxable: false });
      nonTaxableSubtotal += state.travelFee;
    }
  }

  const taxAmount = taxableSubtotal * TAX_RATE;
  const total = taxableSubtotal + nonTaxableSubtotal + taxAmount;

  return { breakdownLines, taxableSubtotal, nonTaxableSubtotal, taxAmount, total };
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
    // keep cents stable
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

  // Validate config
  if (!window.emailjs) {
    if (statusDiv) statusDiv.textContent = "EmailJS is not loaded (SDK missing).";
    return;
  }
  if (!EMAILJS_PUBLIC_KEY || EMAILJS_PUBLIC_KEY === "YOUR_PUBLIC_KEY") {
    if (statusDiv) statusDiv.textContent = "EmailJS public key is not configured in widget.js.";
    return;
  }
  if (!EMAILJS_SERVICE_ID || EMAILJS_SERVICE_ID === "YOUR_SERVICE_ID" ||
      !EMAILJS_TEMPLATE_ID || EMAILJS_TEMPLATE_ID === "YOUR_TEMPLATE_ID") {
    if (statusDiv) statusDiv.textContent = "EmailJS service/template IDs are not configured in widget.js.";
    return;
  }

  // Ensure totals exist
  const totals = state.totals || calculateTotals();

  const payload = {
    // Contact
    name: state.name,
    email: state.email,
    phone: state.phone,
    notes: state.notes,

    // Event basics
    occasion: state.occasion === "Other" ? state.occasionOther : state.occasion,
    date: state.date,
    time: state.time,
    location: state.location === "studio" ? "In-Studio Private Event" : "Off-Site Private Event",

    // Guests
    guests: state.location === "studio" ? state.guestCountStudio : state.guestCountOffsite,

    // Address (offsite)
    address: state.location === "offsite"
      ? `${state.addressStreet}, ${state.addressCity}, ${state.addressState} ${state.addressZip}`
      : "",

    distance_miles: state.location === "offsite" ? roundTo1Decimal(state.distanceMiles).toFixed(1) : "",
    travel_fee: state.location === "offsite" ? money(state.travelFee) : "",

    // Totals
    taxable_subtotal: money(totals.taxableSubtotal),
    nontaxable_subtotal: money(totals.nonTaxableSubtotal),
    tax_amount: money(totals.taxAmount),
    total: money(totals.total),

    // Dietary disclaimer + detail (if applicable)
    dietary_meals_note:
      "Dietary meals (gluten-free, vegan, vegetarian) are priced separately and are not included in this estimate.",
    dietary_meals_detail: dietarySummary(),

    // A plain-text summary (handy for templates)
    summary_text: buildPlainTextSummary(totals),

    // Optional: if your template supports sending a copy to customer
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

  if (state.location === "offsite") {
    lines.push(`Address: ${state.addressStreet}, ${state.addressCity}, ${state.addressState} ${state.addressZip}`);
    lines.push(`Estimated miles (ZIP-only): ${roundTo1Decimal(state.distanceMiles).toFixed(1)}`);
    lines.push(`Travel fee: ${money(state.travelFee)}`);
    lines.push(`Crafts selected: ${offsiteCraftSummary()}`);
  } else {
    lines.push(`Crafts included: ${state.crafts.included ? "Yes" : "No"}`);
    lines.push(`Goodie bags: ${state.goodieBags ? "Yes" : "No"}`);
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

  if (state.customCraft.trim()) lines.push(`Custom craft request: ${state.customCraft.trim()}`);
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

// ====== SMALL UTILS ======
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

// ====== CONFIG ======

const STUDIO_LAT = 33.0165;
const STUDIO_LON = -117.2030;
const TAX_RATE = 0.0775;

const COL_BG = "#F7F4EE";
const COL_CARD = "#FAF8F2";
const COL_TEXT = "#2A2A28";
const COL_ACCENT = "#4A5A3D";
const COL_BORDER = "#D8D3C8";

let step = 0;

let form = {
  occasion: "",
  occasionOther: "",
  date: "",
  time: "",
  location: "",
  guestCountStudio: "",
  guestCountOffsite: 0,
  crafts: {
    candle: false,
    jewelry: false,
    soap: false
  },
  customCraft: "",
  goodieBags: false,
  decorations: false,
  catering: {
    brunch: false,
    lunch: false,
    dessert: false
  },
  extraDietaryCount: 0,
  addressStreet: "",
  addressCity: "",
  addressState: "",
  addressZip: "",
  name: "",
  email: "",
  phone: "",
  notes: "",
  distanceMiles: 0,
  travelFee: 0,
  taxableSubtotal: 0,
  nonTaxableSubtotal: 0,
  taxAmount: 0,
  total: 0,
  breakdown: {
    rental: 0,
    crafts: 0,
    goodieBags: 0,
    decorations: 0,
    catering: 0,
    cateringDelivery: 0,
    travel: 0
  }
};

let inputs = {};
let isCalculatingDistance = false;
let distanceError = "";

function setup() {
  let canvasH = Math.max(windowHeight, 600);
  if (windowWidth < 700) canvasH = windowHeight;
  let c = createCanvas(windowWidth, canvasH);
  c.parent("sketch-container");
  textFont("Lora");
  setupInputs();

  windowResized = function() {
    let canvasH = Math.max(windowHeight, 600);
    if (windowWidth < 700) canvasH = windowHeight;
    resizeCanvas(windowWidth, canvasH);
  };
}
function relX(percent) {
  return width * percent;
}

function relY(percent) {
  return height * percent;
}


function draw() {
  background(COL_BG);
  drawCard();
  drawStep();
}

// ====== INPUTS ======

function setupInputs() {
  // Occasion
  if (!inputs.occasion) {
    inputs.occasion = createSelect();
    inputs.occasion.option("Select occasion");
    ["Birthday","Baby Shower","Bridal Shower","Corporate Event","Girls’ Night","Family Gathering","Friend Gathering","Other"].forEach(o => inputs.occasion.option(o));
    inputs.occasion.changed(() => form.occasion = inputs.occasion.value());
  }
  if (!inputs.occasionOther) inputs.occasionOther = createInput();
  // Date / Time
  if (!inputs.date) {
    inputs.date = createInput("", "date");
    let today = new Date().toISOString().split("T")[0];
    inputs.date.attribute("min", today);
    let currentYear = new Date().getFullYear();
    let maxDate = `${currentYear}-12-31`;
    inputs.date.attribute("max", maxDate);
  }
  if (!inputs.time) {
    inputs.time = createInput("", "time");
    inputs.time.attribute("min", "09:00");
    inputs.time.attribute("max", "19:00");
  }

  // Guest counts
  inputs.guestCountStudio = createSelect();
  inputs.guestCountStudio.option("Select guests");
  [5,10,15,20].forEach(n => inputs.guestCountStudio.option(n));
  inputs.guestCountStudio.changed(() => form.guestCountStudio = inputs.guestCountStudio.value());

  inputs.guestCountOffsite = createInput("", "number");
  inputs.guestCountOffsite.attribute("min", "1");
  inputs.guestCountOffsite.attribute("max", "60");

  // Crafts (mutually exclusive)
  if (!inputs.craftCandle) inputs.craftCandle = createCheckbox("Candle Making", false);
  if (!inputs.craftJewelry) inputs.craftJewelry = createCheckbox("Jewelry / Charm Making", false);
  if (!inputs.craftSoap) inputs.craftSoap = createCheckbox("Soap Making", false);
  if (!inputs.customCraft) inputs.customCraft = createElement("textarea");
  // Mutually exclusive logic
  inputs.craftCandle.changed(() => {
    if (inputs.craftCandle.checked()) {
      inputs.craftJewelry.checked(false);
      inputs.craftSoap.checked(false);
    }
    form.crafts.candle = inputs.craftCandle.checked();
    form.crafts.jewelry = inputs.craftJewelry.checked();
    form.crafts.soap = inputs.craftSoap.checked();
  });
  inputs.craftJewelry.changed(() => {
    if (inputs.craftJewelry.checked()) {
      inputs.craftCandle.checked(false);
      inputs.craftSoap.checked(false);
    }
    form.crafts.candle = inputs.craftCandle.checked();
    form.crafts.jewelry = inputs.craftJewelry.checked();
    form.crafts.soap = inputs.craftSoap.checked();
  });
  inputs.craftSoap.changed(() => {
    if (inputs.craftSoap.checked()) {
      inputs.craftCandle.checked(false);
      inputs.craftJewelry.checked(false);
    }
    form.crafts.candle = inputs.craftCandle.checked();
    form.crafts.jewelry = inputs.craftJewelry.checked();
    form.crafts.soap = inputs.craftSoap.checked();
  });

  // Studio extras
  inputs.goodieBags = createCheckbox("Goodie Bags", false);
  inputs.decorations = createCheckbox("Decorations", false);
  inputs.cateringBrunch = createCheckbox("Brunch – French breakfast pastries", false);
  inputs.cateringLunch = createCheckbox("Lunch – sandwiches & artisan cheese trays", false);
  inputs.cateringDessert = createCheckbox("French confection dessert", false);

  // Make brunch/lunch mutually exclusive
  inputs.cateringBrunch.changed(() => {
    if (inputs.cateringBrunch.checked()) inputs.cateringLunch.checked(false);
  });
  inputs.cateringLunch.changed(() => {
    if (inputs.cateringLunch.checked()) inputs.cateringBrunch.checked(false);
  });

  // Dietary meals
  inputs.extraDietary = createInput();
  inputs.extraDietary.attribute("type", "number");
  inputs.extraDietary.attribute("min", "0");

  // Address
  inputs.addressStreet = createInput();
  inputs.addressCity = createInput();
  inputs.addressState = createInput();
  inputs.addressZip = createInput();

  // Contact
  inputs.name = createInput();
  inputs.email = createInput();
  inputs.phone = createInput();
  inputs.phone.attribute("type", "tel");
  inputs.phone.attribute("pattern", "[0-9]{10,}");
  inputs.phone.input(() => {
    // Remove non-numeric characters
    let val = inputs.phone.value().replace(/[^0-9]/g, "");
    inputs.phone.value(val);
  });
  inputs.notes = createElement("textarea");

  for (let key in inputs) inputs[key].hide();
}

function hideAllInputs() {
  for (let key in inputs) inputs[key].hide();
}

// ====== CARD FRAME ======

function drawCard() {
  push();
  translate(60, 40);
  noStroke();
  fill(0, 0, 0, 20);
  rect(8, 8, width - 120, height - 80, 18);
  fill(COL_CARD);
  rect(0, 0, width - 120, height - 80, 18);
  pop();

  fill(COL_TEXT);
  textSize(14);
  textAlign(RIGHT, TOP);
  text(`Step ${step + 1} of 6`, width - 80, 50);
}

// ====== STEP ROUTER ======

function drawStep() {
  hideAllInputs();
  fill(COL_TEXT);
  textAlign(LEFT, TOP);

  if (step === 0) drawStep0();
  else if (step === 1) drawStep1();
  else if (step === 2) drawStep2();
  else if (step === 3) drawStep3();
  else if (step === 4) drawStep4();
  else if (step === 5) drawStep5();
}

// ====== STEP 0 ======

function drawStep0() {
  // Responsive layout
  const marginX = width * 0.08;
  const marginY = height * 0.08;
  const colW = width * 0.28;
  const colGap = width * 0.04;
  let x = marginX, y = marginY;

  textSize(Math.max(20, height * 0.04));
  text("Tell us about your event", x, y);
  textSize(Math.max(12, height * 0.022));
  fill(80);
  text("This helps us understand the vibe and timing of your gathering.", x, y + height * 0.05);

  fill(COL_TEXT);
  textSize(Math.max(13, height * 0.022));
  text("Occasion *", x, y + height * 0.12);
  positionInput(inputs.occasion, x, y + height * 0.14, colW);

  if (form.occasion === "Other") {
    text("Please describe the occasion", x, y + height * 0.19);
    positionInput(inputs.occasionOther, x, y + height * 0.21, colW + colGap);
  }

  text("Preferred Date *", x, y + height * 0.28);
  positionInput(inputs.date, x, y + height * 0.30, colW * 0.7);

  text("Preferred Time * (between 9:00 AM and 7:00 PM)", x + colW + colGap, y + height * 0.28);
  positionInput(inputs.time, x + colW + colGap, y + height * 0.30, colW * 0.7);

  fill(90);
  textSize(Math.max(11, height * 0.018));
  text("*Your requested date will be approved by staff to prevent double-bookings.\nAvailability is not guaranteed until first deposit is paid.", x, y + height * 0.38);

  drawNavButtons({
    showBack: false,
    onNext: () => {
      if (!form.occasion || form.occasion === "Select occasion") {
        alert("Please select an occasion.");
        return;
      }
      if (!inputs.date.value()) {
        alert("Please select a date.");
        return;
      }

      // Enforce same-year rule and at least 7 days from today
      const selectedDate = new Date(inputs.date.value());
      const currentYear = new Date().getFullYear();
      const today = new Date();
      today.setHours(0,0,0,0);
      const minDate = new Date(today);
      minDate.setDate(today.getDate() + 7);
      if (selectedDate.getFullYear() !== currentYear) {
        alert("Please choose a date within the current calendar year.");
        return;
      }
      if (selectedDate < minDate) {
        alert("Please choose a date at least one week from today.");
        return;
      }

      if (!inputs.time.value()) {
        alert("Please select a time.");
        return;
      }
      const t = inputs.time.value();
      if (t < "09:00" || t > "19:00") {
        alert("Please choose a time between 9:00 AM and 7:00 PM.");
        return;
      }

      form.occasionOther = inputs.occasionOther.value();
      form.date = inputs.date.value();
      form.time = inputs.time.value();
      step = 1;
    }
  });
}

// ====== STEP 1 ======

function drawStep1() {
  let x = 90, y = 70;

  textSize(24);
  text("Where will your event be held?", x, y);
  textSize(13);
  fill(80);
  text("Choose whether you’d like to host in our studio or at your own location.", x, y + 32);

  let cardY = y + 110;
  let cardW = 320;
  let gap = 40;
  let totalWidth = cardW * 2 + gap;
  let startX = x + (width - 120 - totalWidth) / 2;

  drawLocationCard(startX, cardY, "In-Studio Private Event", "studio");
  drawLocationCard(startX + cardW + gap, cardY, "Off-Site Private Event", "offsite");

  fill(90);
  textSize(12);
  text("*Our studio can best accommodate up to 20 people if crafts are included.\nWe recommend booking an off-site event for parties larger than 20.", x, y + 230);

  drawNavButtons({
    showBack: true,
    onBack: () => step = 0,
    onNext: () => {
      if (!form.location) {
        alert("Please select a location.");
        return;
      }
      step = 2;
    }
  });
}

function drawLocationCard(x, y, label, value) {
  let w = 320, h = 90;
  let hovered = mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h;
  let selected = form.location === value;

  stroke(COL_BORDER);
  strokeWeight(1);
  fill(selected ? COL_ACCENT : hovered ? "#EEE9DD" : "#F3EFE6");
  rect(x, y, w, h, 16);

  noStroke();
  fill(selected ? "#FDFBF6" : COL_TEXT);
  textSize(15);
  textAlign(LEFT, TOP);
  text(label, x + 18, y + 18);
}

function mousePressed() {
  if (step === 1) {
    let x = 90, y = 70;
    let cardY = y + 110;
    let cardW = 320;
    let gap = 40;
    let totalWidth = cardW * 2 + gap;
    let startX = x + (width - 120 - totalWidth) / 2;

    if (mouseX > startX && mouseX < startX + cardW && mouseY > cardY && mouseY < cardY + 90) {
      form.location = "studio";
    }
    if (mouseX > startX + cardW + gap && mouseX < startX + cardW * 2 + gap && mouseY > cardY && mouseY < cardY + 90) {
      form.location = "offsite";
    }
  }
}

// ====== STEP 2 ======

function drawStep2() {
  let x = 90, y = 70;

  textSize(24);
  text("How many guests are you expecting?", x, y);
  textSize(13);
  fill(80);
  text("This helps us size your setup, staffing, and materials.", x, y + 32);

  fill(COL_TEXT);
  textSize(14);

  if (form.location === "studio") {
    text("Guest count (In-Studio) *", x, y + 90);
    positionInput(inputs.guestCountStudio, x, y + 110, 200);
  } else if (form.location === "offsite") {
    text("Guest count (Off-Site, up to 60) *", x, y + 90);
    positionInput(inputs.guestCountOffsite, x, y + 110, 200);
  }

  drawNavButtons({
    showBack: true,
    onBack: () => step = 1,
    onNext: () => {
      if (form.location === "studio") {
        if (!form.guestCountStudio || form.guestCountStudio === "Select guests") {
          alert("Please select a guest count.");
          return;
        }
      } else {
        if (!inputs.guestCountOffsite.value()) {
          alert("Please enter a guest count.");
          return;
        }
        form.guestCountOffsite = parseInt(inputs.guestCountOffsite.value());
        if (isNaN(form.guestCountOffsite) || form.guestCountOffsite < 1 || form.guestCountOffsite > 60) {
          alert("Please enter a guest count between 1 and 60.");
          return;
        }
      }
      step = 3;
    }
  });
}

// ====== STEP 3 ======

function drawStep3() {
  let x = 90, y = 70;

  fill(COL_TEXT);
  textSize(14);
  text("Crafts", x, y + 80);
  positionInput(inputs.craftCandle, x, y + 100);
  text("Candle Making", x + 30, y + 105);
  positionInput(inputs.craftJewelry, x, y + 130);
  text("Jewelry / Charm Making", x + 30, y + 135);
  positionInput(inputs.craftSoap, x, y + 160);
  text("Soap Making", x + 30, y + 165);

  text("Custom craft request (optional)", x, y + 200);
  positionInput(inputs.customCraft, x, y + 220, 320, 80);

  if (form.location === "studio") {
    text("Studio add-ons", x + 380, y + 80);
    positionInput(inputs.goodieBags, x + 380, y + 100);
    text("Goodie Bags", x + 410, y + 105);
    positionInput(inputs.decorations, x + 380, y + 130);
    text("Decorations", x + 410, y + 135);

    textSize(12);
    fill(90);
    text("Catering options:", x + 380, y + 160);
    fill(COL_TEXT);
    textSize(13);
    positionInput(inputs.cateringBrunch, x + 380, y + 180);
    text("Brunch – French breakfast pastries", x + 410, y + 185);
    positionInput(inputs.cateringLunch, x + 380, y + 210);
    text("Lunch – sandwiches & artisan cheese trays", x + 410, y + 215);
    positionInput(inputs.cateringDessert, x + 380, y + 240);
    text("French confection dessert", x + 410, y + 245);

    // Dietary checkboxes and number inputs (create only once)
    if (!inputs.dietVegan) inputs.dietVegan = createCheckbox("Vegan", false);
    if (!inputs.dietVeganCount) inputs.dietVeganCount = createInput("", "number");
    if (!inputs.dietGluten) inputs.dietGluten = createCheckbox("Gluten Free", false);
    if (!inputs.dietGlutenCount) inputs.dietGlutenCount = createInput("", "number");
    if (!inputs.dietVegetarian) inputs.dietVegetarian = createCheckbox("Vegetarian", false);
    if (!inputs.dietVegetarianCount) inputs.dietVegetarianCount = createInput("", "number");

    textSize(13);
    fill(COL_TEXT);
    text("Additional dietary meals", x + 380, y + 280);
    // Vegan
    positionInput(inputs.dietVegan, x + 380, y + 300);
    positionInput(inputs.dietVeganCount, x + 480, y + 300, 60);
    inputs.dietVeganCount.attribute("min", "0");
    inputs.dietVeganCount.attribute("disabled", !inputs.dietVegan.checked());
    inputs.dietVegan.changed(() => {
      inputs.dietVeganCount.attribute("disabled", !inputs.dietVegan.checked());
      if (!inputs.dietVegan.checked()) inputs.dietVeganCount.value("");
    });
    inputs.dietVeganCount.input(() => {
      let val = inputs.dietVeganCount.value().replace(/[^0-9]/g, "");
      inputs.dietVeganCount.value(val);
    });
    // Gluten Free
    positionInput(inputs.dietGluten, x + 380, y + 330);
    positionInput(inputs.dietGlutenCount, x + 480, y + 330, 60);
    inputs.dietGlutenCount.attribute("min", "0");
    inputs.dietGlutenCount.attribute("disabled", !inputs.dietGluten.checked());
    inputs.dietGluten.changed(() => {
      inputs.dietGlutenCount.attribute("disabled", !inputs.dietGluten.checked());
      if (!inputs.dietGluten.checked()) inputs.dietGlutenCount.value("");
    });
    inputs.dietGlutenCount.input(() => {
      let val = inputs.dietGlutenCount.value().replace(/[^0-9]/g, "");
      inputs.dietGlutenCount.value(val);
    });
    // Vegetarian
    positionInput(inputs.dietVegetarian, x + 380, y + 360);
    positionInput(inputs.dietVegetarianCount, x + 480, y + 360, 60);
    inputs.dietVegetarianCount.attribute("min", "0");
    inputs.dietVegetarianCount.attribute("disabled", !inputs.dietVegetarian.checked());
    inputs.dietVegetarian.changed(() => {
      inputs.dietVegetarianCount.attribute("disabled", !inputs.dietVegetarian.checked());
      if (!inputs.dietVegetarian.checked()) inputs.dietVegetarianCount.value("");
    });
    inputs.dietVegetarianCount.input(() => {
      let val = inputs.dietVegetarianCount.value().replace(/[^0-9]/g, "");
      inputs.dietVegetarianCount.value(val);
    });

    textSize(11);
    fill(90);
    text("*Not guaranteed and may incur additional cost not specified in this estimate,\n based on caterer pricing and availability.", x + 380, y + 395);
    textSize(11);
    fill(90);
    text("The studio does not provide cake or alcohol at this time.\nIf you would like to bring your own, please contact us to request accommodation.", x, height - 130);
  }

  // Require at least one craft
  if (!inputs.craftCandle.checked() && !inputs.craftJewelry.checked() && !inputs.craftSoap.checked()) {
    fill("#c00");
    textSize(13);
    text("Please select at least one craft option.", x, y + 190);
  }

    textSize(11);
    fill(90);
    text("The studio does not provide cake or alcohol at this time.\nIf you would like to bring your own, please contact us to request accommodation.", x, height - 130);
  }

  if (form.location === "offsite") {
    text("Event address (Off-Site)", x + 380, y + 80);
    textSize(12);
    fill(90);
    text("We’ll use your ZIP code to estimate travel distance and fee.", x + 380, y + 100);

    fill(COL_TEXT);
    textSize(13);
    text("Street", x + 380, y + 130);
    positionInput(inputs.addressStreet, x + 380, y + 150, 320);

    text("City", x + 380, y + 190);
    positionInput(inputs.addressCity, x + 380, y + 210, 200);

    text("State", x + 380, y + 250);
    positionInput(inputs.addressState, x + 380, y + 270, 80);

    text("ZIP", x + 380 + 120, y + 250);
    positionInput(inputs.addressZip, x + 380 + 120, y + 270, 80);
  }

  drawNavButtons({
    showBack: true,
    onBack: () => step = 2,
    onNext: () => {
      form.customCraft = inputs.customCraft.value();
      if (form.location === "offsite") {
        form.addressStreet = inputs.addressStreet.value();
        form.addressCity = inputs.addressCity.value();
        form.addressState = inputs.addressState.value();
        form.addressZip = inputs.addressZip.value().trim();
        if (!form.addressStreet || !form.addressCity || !form.addressState || !form.addressZip) {
          alert("Please complete the off-site address.");
          return;
        }
        // Only allow US, CA, and SD/LA counties
        const allowedCities = [
          // San Diego County
          "San Diego","Chula Vista","Oceanside","Escondido","Carlsbad","El Cajon","Vista","San Marcos","Encinitas","National City","La Mesa","Santee","Poway","Imperial Beach","Lemon Grove","Coronado","Solana Beach","Del Mar","San Diego County",
          // Los Angeles County
          "Los Angeles","Long Beach","Glendale","Santa Clarita","Lancaster","Palmdale","Pomona","Torrance","Pasadena","El Monte","Downey","Inglewood","West Covina","Norwalk","Burbank","Compton","South Gate","Carson","Santa Monica","Whittier","Hawthorne","Alhambra","Lakewood","Bellflower","Baldwin Park","Redondo Beach","Lakewood","Los Angeles County"
        ];
        const allowedStates = ["CA","California"];
        // Only US zip codes (5 digits)
        const usZip = /^\d{5}$/;
        if (!allowedStates.includes(form.addressState.trim())) {
          alert("Sorry, we only accept events in California (CA). Please enter a valid CA address.");
          return;
        }
        if (!usZip.test(form.addressZip)) {
          alert("Sorry, we only accept US addresses (5-digit ZIP codes).");
          return;
        }
        if (!allowedCities.some(city => form.addressCity.trim().toLowerCase() === city.toLowerCase())) {
          alert("Sorry, we only accept events in San Diego or Los Angeles County. Please enter a valid city.");
          return;
        }
      }
      if (form.location === "studio") {
        form.extraDietaryCount = parseInt(inputs.extraDietary.value() || "0");
        if (isNaN(form.extraDietaryCount) || form.extraDietaryCount < 0) form.extraDietaryCount = 0;
      }
      step = 4;
    }
  });


// ====== STEP 4 ======

function drawStep4() {
  let x = 90, y = 70;

  textSize(24);
  text("How can we reach you?", x, y);
  textSize(13);
  fill(80);
  text("We’ll review your request and follow up to confirm details and availability.", x, y + 32);

  fill(COL_TEXT);
  textSize(14);

  // Crafts checkboxes and labels
  let craftsY = y + 60;
  text("Crafts", x, craftsY);
  craftsY += 20;
  positionInput(inputs.craftCandle, x, craftsY);
  text("Candle Making", x + 30, craftsY + 5);
  craftsY += 30;
  positionInput(inputs.craftJewelry, x, craftsY);
  text("Jewelry / Charm Making", x + 30, craftsY + 5);
  craftsY += 30;
  positionInput(inputs.craftSoap, x, craftsY);
  text("Soap Making", x + 30, craftsY + 5);

  // Contact info
  let contactY = y + 180;
  text("Name *", x, contactY);
  positionInput(inputs.name, x, contactY + 20, 260);

  text("Email *", x, contactY + 60);
  positionInput(inputs.email, x, contactY + 80, 260);

  text("Phone *", x, contactY + 120);
  positionInput(inputs.phone, x, contactY + 140, 260);

  text("Notes (optional)", x, contactY + 180);
  positionInput(inputs.notes, x, contactY + 200, 400, 80);

  drawNavButtons({
    showBack: true,
    onBack: () => step = 3,
    onNext: () => {
      form.name = inputs.name.value();
      form.email = inputs.email.value();
      form.phone = inputs.phone.value();
      form.notes = inputs.notes.value();

      if (!form.name || !form.email || !form.phone) {
        alert("Please fill in your name, email, and phone.");
        return;
      }
      // Email validation
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(form.email)) {
        alert("Please enter a valid email address.");
        return;
      }
      // Phone validation (10+ digits)
      if (!/^\d{10,}$/.test(form.phone)) {
        alert("Please enter a valid phone number (10+ digits).");
        return;
      }

      if (form.location === "offsite") {
        calculateDistanceFromZip(form.addressZip, () => {
          calculatePricing();
          step = 5;
        });
      } else {
        form.distanceMiles = 0;
        form.travelFee = 0;
        calculatePricing();
        step = 5;
      }
    }
  });
}

// ====== STEP 5 (SUMMARY) ======

function drawStep5() {
  let x = 90, y = 70;

  textSize(24);
  text("Review your event request", x, y);
  textSize(13);
  fill(80);
  text("This is an estimate. We’ll confirm details and final pricing with you directly.", x, y + 32);

  let lineY = y + 80;
  textSize(13);
  fill(COL_TEXT);

  text(`Occasion: ${form.occasion === "Other" ? form.occasionOther : form.occasion}`, x, lineY); lineY += 18;
  text(`Date & Time: ${form.date} at ${form.time}`, x, lineY); lineY += 18;
  text(`Location: ${form.location === "studio" ? "In-Studio Private Event" : "Off-Site Private Event"}`, x, lineY); lineY += 18;

  if (form.location === "studio") {
    text(`Guest Count: ${form.guestCountStudio}`, x, lineY); lineY += 18;
  } else {
    text(`Guest Count: ${form.guestCountOffsite}`, x, lineY); lineY += 18;
    text(`Address: ${form.addressStreet}, ${form.addressCity}, ${form.addressState} ${form.addressZip}`, x, lineY); lineY += 18;
    text(`Estimated Distance: ${form.distanceMiles.toFixed(1)} miles`, x, lineY); lineY += 18;
    text(`Travel Fee: $${form.travelFee.toFixed(2)}`, x, lineY); lineY += 18;
  }

  lineY += 10;
  text("Crafts:", x, lineY); lineY += 18;
  let craftsChosen = [];
  if (form.crafts.candle) craftsChosen.push("Candle Making");
  if (form.crafts.jewelry) craftsChosen.push("Jewelry / Charm");
  if (form.crafts.soap) craftsChosen.push("Soap Making");
  text(craftsChosen.length ? craftsChosen.join(", ") : "None selected", x + 20, lineY); lineY += 18;
  if (form.customCraft) {
    text(`Custom request: ${form.customCraft}`, x + 20, lineY); lineY += 18;
  }

  if (form.location === "studio") {
    lineY += 10;
    text("Studio add-ons:", x, lineY); lineY += 18;
    let addons = [];
    if (form.goodieBags) addons.push("Goodie Bags");
    if (form.decorations) addons.push("Decorations");
    if (form.catering.brunch) addons.push("Brunch – French breakfast pastries");
    if (form.catering.lunch) addons.push("Lunch – sandwiches & artisan cheese trays");
    if (form.catering.dessert) addons.push("French confection dessert");
    text(addons.length ? addons.join(", ") : "None selected", x + 20, lineY); lineY += 18;

    if (form.extraDietaryCount > 0) {
      text(`Additional dietary meals requested: ${form.extraDietaryCount}`, x + 20, lineY); lineY += 18;
      textSize(11);
      fill(90);
      text("Note: Additional dietary meals may incur extra cost not reflected in this estimate.", x + 20, lineY); 
      lineY += 18;
      textSize(13);
      fill(COL_TEXT);
    }
  }

  // ===== ITEMIZED ESTIMATE =====
  lineY += 10;
  text("Itemized Estimate:", x, lineY); lineY += 18;

  function line(label, amount) {
    textAlign(LEFT, TOP);
    text(label, x + 20, lineY);
    textAlign(RIGHT, TOP);
    text(`$${amount.toFixed(2)}`, x + 380, lineY);
    lineY += 18;
  }

  if (form.breakdown.rental) line("Rental Fee", form.breakdown.rental);
  if (form.breakdown.crafts) line("Crafts", form.breakdown.crafts);
  if (form.breakdown.goodieBags) line("Goodie Bags", form.breakdown.goodieBags);
  if (form.breakdown.decorations) line("Decorations", form.breakdown.decorations);
  if (form.breakdown.catering) line("Catering", form.breakdown.catering);
  if (form.breakdown.cateringDelivery) line("Catering Delivery", form.breakdown.cateringDelivery);
  if (form.breakdown.travel) line("Travel Fee", form.breakdown.travel);

  lineY += 10;
  textAlign(LEFT, TOP);
  text("Taxable Subtotal", x + 20, lineY);
  textAlign(RIGHT, TOP);
  text(`$${form.taxableSubtotal.toFixed(2)}`, x + 380, lineY); lineY += 18;

  textAlign(LEFT, TOP);
  text("Non-Taxable Subtotal", x + 20, lineY);
  textAlign(RIGHT, TOP);
  text(`$${form.nonTaxableSubtotal.toFixed(2)}`, x + 380, lineY); lineY += 18;

  textAlign(LEFT, TOP);
  text("Estimated Tax (7.75%)", x + 20, lineY);
  textAlign(RIGHT, TOP);
  text(`$${form.taxAmount.toFixed(2)}`, x + 380, lineY); lineY += 24;

  // ===== TOTAL BOX =====
  let totalBoxX = x + 260;
  let totalBoxY = lineY;
  let totalBoxW = 260;
  let totalBoxH = 50;

  noStroke();
  fill("#E9E3D5");
  rect(totalBoxX, totalBoxY, totalBoxW, totalBoxH, 10);
  fill(COL_TEXT);
  textAlign(LEFT, CENTER);
  textSize(14);
  text("Estimated Total", totalBoxX + 16, totalBoxY + totalBoxH / 2);
  textAlign(RIGHT, CENTER);
  textSize(18);
  text(`$${form.total.toFixed(2)}`, totalBoxX + totalBoxW - 16, totalBoxY + totalBoxH / 2);

  // Second column for Your Info
  let infoX = totalBoxX + totalBoxW + 40;
  let infoY = y + 80;
  textSize(13);
  textAlign(LEFT, TOP);
  text("Your Info:", infoX, infoY); infoY += 18;
  text(`Name: ${form.name}`, infoX + 20, infoY); infoY += 18;
  text(`Email: ${form.email}`, infoX + 20, infoY); infoY += 18;
  text(`Phone: ${form.phone}`, infoX + 20, infoY); infoY += 18;
  if (form.notes) {
    text(`Notes: ${form.notes}`, infoX + 20, infoY); infoY += 18;
  }

  drawNavButtons({
    showBack: true,
    nextLabel: "Submit Event Request",
    onBack: () => step = 4,
    onNext: () => {
      sendEmail();
    }
  });
}

// ====== PRICING LOGIC ======

function calculatePricing() {
  let taxable = 0;
  let nonTaxable = 0;

  form.breakdown = {
    rental: 0,
    crafts: 0,
    goodieBags: 0,
    decorations: 0,
    catering: 0,
    cateringDelivery: 0,
    travel: 0
  };

  if (form.location === "studio") {
    const g = parseInt(form.guestCountStudio);

    // Rental
    if (g === 5) form.breakdown.rental = 100;
    else if (g === 10) form.breakdown.rental = 250;
    else if (g === 15) form.breakdown.rental = 300;
    else if (g === 20) form.breakdown.rental = 350;
    nonTaxable += form.breakdown.rental;

    // Crafts
    let anyCraft = form.crafts.candle || form.crafts.jewelry || form.crafts.soap;
    if (anyCraft) {
      if (g === 5) form.breakdown.crafts = 150;
      else if (g === 10) form.breakdown.crafts = 300;
      else if (g === 15) form.breakdown.crafts = 450;
      else if (g === 20) form.breakdown.crafts = 600;
      taxable += form.breakdown.crafts;
    }

    // Goodie bags
    if (form.goodieBags) {
      if (g === 5) form.breakdown.goodieBags = 50;
      else if (g === 10) form.breakdown.goodieBags = 100;
      else if (g === 15) form.breakdown.goodieBags = 150;
      else if (g === 20) form.breakdown.goodieBags = 200;
      taxable += form.breakdown.goodieBags;
    }

    // Decorations
    if (form.decorations) {
      form.breakdown.decorations = 50;
      taxable += form.breakdown.decorations;
    }

    // Catering
    let cateringBase = 0;
    if (form.catering.brunch) {
      if (g === 5) cateringBase += 70;
      else if (g === 10) cateringBase += 241;
      else if (g === 15) cateringBase += 241;
      else if (g === 20) cateringBase += 467;
    }
    if (form.catering.lunch) {
      if (g === 5) cateringBase += 139;
      else if (g === 10) cateringBase += 204;
      else if (g === 15) cateringBase += 204;
      else if (g === 20) cateringBase += 304;
    }
    if (form.catering.dessert) {
      if (g === 5) cateringBase += 78;
      else if (g === 10) cateringBase += 78;
      else if (g === 15) cateringBase += 141;
      else if (g === 20) cateringBase += 141;
    }

    form.breakdown.catering = cateringBase;
    taxable += cateringBase;

    // Catering delivery fee
    if (cateringBase > 0) {
      if (g === 5) form.breakdown.cateringDelivery = 25;
      else if (g === 10) form.breakdown.cateringDelivery = 35;
      else if (g === 15) form.breakdown.cateringDelivery = 50;
      else if (g === 20) form.breakdown.cateringDelivery = 60;
      nonTaxable += form.breakdown.cateringDelivery;
    }

  } else if (form.location === "offsite") {
    // No rental fee

    // Crafts: $30 per person
    let anyCraft = form.crafts.candle || form.crafts.jewelry || form.crafts.soap;
    if (anyCraft) {
      form.breakdown.crafts = form.guestCountOffsite * 30;
      taxable += form.breakdown.crafts;
    }

    // No goodie bags, no decorations, no catering

    // Travel fee
    form.breakdown.travel = form.travelFee;
    nonTaxable += form.breakdown.travel;
  }

  form.taxableSubtotal = taxable;
  form.nonTaxableSubtotal = nonTaxable;
  form.taxAmount = taxable * TAX_RATE;
  form.total = taxable + nonTaxable + form.taxAmount;
}

// ====== DISTANCE ======

function calculateDistanceFromZip(zip, callback) {
  isCalculatingDistance = true;
  distanceError = "";

  const url = `https://api.zippopotam.us/us/${zip}`;
  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error("ZIP not found");
      return res.json();
    })
    .then(data => {
      const place = data.places[0];
      const lat = parseFloat(place.latitude);
      const lon = parseFloat(place.longitude);
      const d = haversineDistance(STUDIO_LAT, STUDIO_LON, lat, lon);
      form.distanceMiles = d;

      if (d <= 10) form.travelFee = 100;
      else form.travelFee = 100 + (d - 10) * 5;

      isCalculatingDistance = false;
      callback();
    })
    .catch(err => {
      console.error(err);
      distanceError = "We couldn’t estimate distance from that ZIP. We’ll confirm travel fee with you directly.";
      form.distanceMiles = 0;
      form.travelFee = 0;
      isCalculatingDistance = false;
      callback();
    });
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const toRad = angle => angle * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// ====== NAV BUTTONS ======

function drawNavButtons({ showBack = true, onBack = null, onNext = null, nextLabel = "Next" }) {
  let backX = 90;
  let nextX = width - 220;
  let y = height - 80;
  let w = 120;
  let h = 40;

  textAlign(CENTER, CENTER);
  textSize(14);

  if (showBack) {
    drawButton(backX, y, w, h, "Back", () => {
      if (onBack) onBack();
    });
  }

  drawButton(nextX, y, w, h, nextLabel, () => {
    if (onNext) onNext();
  });
}

function drawButton(x, y, w, h, label, onClick) {
  let hovered = mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h;
  push();
  stroke(COL_ACCENT);
  strokeWeight(1);
  fill(hovered ? "#3C4A32" : COL_ACCENT);
  rect(x, y, w, h, 999);
  noStroke();
  fill("#FDFBF6");
  text(label, x + w / 2, y + h / 2);
  pop();

  if (mouseIsPressed && hovered && !drawButton._clicked) {
    drawButton._clicked = true;
    setTimeout(() => {
      drawButton._clicked = false;
      onClick();
    }, 150);
  }
}

// ====== INPUT POSITIONING ======

function positionInput(el, x, y, w = 200, h = 24) {
  el.show();
  // Minimum width/height for visibility
  const minW = 80, minH = 24;
  el.position(x, y);
  el.size(Math.max(w, minW), Math.max(h, minH));
}

// ====== EMAILJS ======

function sendEmail() {
  const payload = buildEmailPayload();

  emailjs.send("service_rkb7ozz", "template_trnx5um", {
    to_email: payload.to_email,
    subject: payload.subject,
    message: payload.body
  }).then(() => {
    alert("Your event request has been sent. We’ll be in touch soon.");
  }).catch(err => {
    console.error(err);
    alert("Something went wrong sending your request. Please try again or email us directly at studio@vesperdesign.com.");
  });
}

function buildEmailPayload() {
  let dietaryNote = "";
  if (form.location === "studio" && form.extraDietaryCount > 0) {
    dietaryNote = "\n\nDietary Note:\n- Additional dietary meals requested: " + form.extraDietaryCount +
      "\n- These may incur additional cost not reflected in this estimate, based on caterer pricing and availability.";
  }

  return {
    to_email: "studio@vesperdesign.com",
    subject: "New Private Event Request",
    body: `
Event Request Summary
---------------------

Occasion: ${form.occasion === "Other" ? form.occasionOther : form.occasion}
Date & Time: ${form.date} at ${form.time}
Location: ${form.location === "studio" ? "In-Studio Private Event" : "Off-Site Private Event"}

Guest Count: ${form.location === "studio" ? form.guestCountStudio : form.guestCountOffsite}
${form.location === "offsite" ? 
`Address: ${form.addressStreet}, ${form.addressCity}, ${form.addressState} ${form.addressZip}
Estimated Distance: ${form.distanceMiles.toFixed(1)} miles
Travel Fee: $${form.travelFee.toFixed(2)}
` 
: ""}

Crafts: ${
      (form.crafts.candle ? "Candle " : "") +
      (form.crafts.jewelry ? "Jewelry " : "") +
      (form.crafts.soap ? "Soap " : "") || "None"
    }
Custom Craft Request: ${form.customCraft || "None"}

Studio Add-ons: ${
      form.location === "studio"
        ? [
            form.goodieBags ? "Goodie Bags" : null,
            form.decorations ? "Decorations" : null,
            form.catering.brunch ? "Brunch – French breakfast pastries" : null,
            form.catering.lunch ? "Lunch – sandwiches & artisan cheese trays" : null,
            form.catering.dessert ? "French confection dessert" : null
          ].filter(Boolean).join(", ") || "None"
        : "N/A"
    }

Itemized Estimate:
- Rental Fee: $${form.breakdown.rental.toFixed(2)}
- Crafts: $${form.breakdown.crafts.toFixed(2)}
- Goodie Bags: $${form.breakdown.goodieBags.toFixed(2)}
- Decorations: $${form.breakdown.decorations.toFixed(2)}
- Catering: $${form.breakdown.catering.toFixed(2)}
- Catering Delivery: $${form.breakdown.cateringDelivery.toFixed(2)}
- Travel Fee: $${form.breakdown.travel.toFixed(2)}

Subtotals:
- Taxable Subtotal: $${form.taxableSubtotal.toFixed(2)}
- Non-Taxable Subtotal: $${form.nonTaxableSubtotal.toFixed(2)}
- Estimated Tax (7.75%): $${form.taxAmount.toFixed(2)}

Estimated Total: $${form.total.toFixed(2)}${dietaryNote}

Customer Info:
- Name: ${form.name}
- Email: ${form.email}
- Phone: ${form.phone}
- Notes: ${form.notes || "None"}
`
  };
}
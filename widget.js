// Utility: getMinDate (one week from today) and getMaxDate (end of current year)
function getMinDate() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
}
function getMaxDate() {
  const d = new Date();
  d.setFullYear(d.getFullYear(), 11, 31);
  return d.toISOString().split('T')[0];
}
// Ensure widget renders on page load
window.addEventListener('DOMContentLoaded', render);
// Event Quote Widget (no p5.js)
// Step and state management

const steps = [
  'occasion',
  'location',
  'guests',
  'experience',
  'contact',
  'review',
];

const state = {
  step: 0,
  // Step 1
  occasion: '',
  occasionOther: '',
  date: '',
  time: '',
  // Step 2
  location: '',
  // Step 3
  guestCountStudio: '',
  guestCountOffsite: '',
  // Step 4
  craft: '',
  customCraft: '',
  goodieBags: false,
  decorations: false,
  catering: '',
  dietary: {
    vegan: 0,
    gluten: 0,
    vegetarian: 0,
  },
  // Step 5
  name: '',
  email: '',
  phone: '',
  notes: '',
};

function render() {
  const root = document.getElementById('event-widget-root');
  root.innerHTML = '';
  const card = document.createElement('div');
  card.className = 'widget-card';
  card.appendChild(renderStepIndicator());
  card.appendChild(renderStepContent());
  root.appendChild(card);
}

function renderStepIndicator() {
  const div = document.createElement('div');
  div.className = 'step-indicator';
  div.textContent = `Step ${state.step + 1} of 6`;
  return div;
}

function renderStepContent() {
  switch (steps[state.step]) {
    case 'occasion': return renderStepOccasion();
    case 'location': return renderStepLocation();
    case 'guests': return renderStepGuests();
    case 'experience': return renderStepExperience();
    case 'contact': return renderStepContact();
    case 'review': return renderStepReview();
    default: return document.createTextNode('');
  }
}
// Step 6: Review and submit
function renderStepReview() {
  const frag = document.createDocumentFragment();
  const h2 = document.createElement('h2');
  h2.textContent = 'Review your request';
  frag.appendChild(h2);

  // Summary
  const ul = document.createElement('ul');
  ul.className = 'review-list';
  ul.innerHTML = `
    <li><b>Occasion:</b> ${state.occasion === 'Other' ? state.occasionOther : state.occasion}</li>
    <li><b>Date:</b> ${state.date}</li>
    <li><b>Time:</b> ${state.time}</li>
    <li><b>Location:</b> ${state.location === 'studio' ? 'Vesper Studio' : 'Offsite'}</li>
    <li><b>Guests:</b> ${state.location === 'studio' ? state.guestCountStudio : state.guestCountOffsite}</li>
    <li><b>Craft:</b> ${state.craft === 'Other' ? state.customCraft : state.craft}</li>
    <li><b>Add-ons:</b> ${[state.goodieBags ? 'Goodie Bags' : '', state.decorations ? 'Decorations' : ''].filter(Boolean).join(', ') || 'None'}</li>
    <li><b>Catering:</b> ${state.catering || 'None'}</li>
    ${state.catering ? `<li><b>Dietary:</b> Vegan: ${state.dietary.vegan}, Gluten: ${state.dietary.gluten}, Vegetarian: ${state.dietary.vegetarian}</li>` : ''}
    <li><b>Name:</b> ${state.name}</li>
    <li><b>Email:</b> ${state.email}</li>
    <li><b>Phone:</b> ${state.phone || '—'}</li>
    <li><b>Notes:</b> ${state.notes || '—'}</li>
  `;
  frag.appendChild(ul);

  // Navigation buttons
  const navDiv = document.createElement('div');
  navDiv.className = 'nav-buttons';
  const backBtn = document.createElement('button');
  backBtn.textContent = 'Back';
  backBtn.onclick = () => {
    state.step--;
    render();
  };
  navDiv.appendChild(backBtn);

  const submitBtn = document.createElement('button');
  submitBtn.textContent = 'Submit';
  submitBtn.onclick = submitForm;
  navDiv.appendChild(submitBtn);
  frag.appendChild(document.createElement('br'));
  frag.appendChild(navDiv);

  // Submission status
  const statusDiv = document.createElement('div');
  statusDiv.id = 'submit-status';
  frag.appendChild(statusDiv);

  return frag;
}

// EmailJS integration (user must provide their own config)
function submitForm() {
  const statusDiv = document.getElementById('submit-status');
  statusDiv.textContent = 'Submitting...';
  // EmailJS config (replace with your own)
  const serviceID = 'YOUR_SERVICE_ID';
  const templateID = 'YOUR_TEMPLATE_ID';
  const publicKey = 'YOUR_PUBLIC_KEY';
  if (!window.emailjs) {
    statusDiv.textContent = 'EmailJS not loaded. Please include EmailJS SDK.';
    return;
  }
  window.emailjs.init(publicKey);
  const templateParams = {
    occasion: state.occasion === 'Other' ? state.occasionOther : state.occasion,
    date: state.date,
    time: state.time,
    location: state.location === 'studio' ? 'Vesper Studio' : 'Offsite',
    guests: state.location === 'studio' ? state.guestCountStudio : state.guestCountOffsite,
    craft: state.craft === 'Other' ? state.customCraft : state.craft,
    goodieBags: state.goodieBags ? 'Yes' : 'No',
    decorations: state.decorations ? 'Yes' : 'No',
    catering: state.catering || 'None',
    dietary: state.catering ? `Vegan: ${state.dietary.vegan}, Gluten: ${state.dietary.gluten}, Vegetarian: ${state.dietary.vegetarian}` : '',
    name: state.name,
    email: state.email,
    phone: state.phone,
    notes: state.notes,
  };
  window.emailjs.send(serviceID, templateID, templateParams)
    .then(() => {
      statusDiv.textContent = 'Thank you! Your request has been sent.';
    }, err => {
      statusDiv.textContent = 'Submission failed. Please try again or email us directly.';
    });
}
// Step 5: Contact info
function renderStepContact() {
  const frag = document.createDocumentFragment();
  const h2 = document.createElement('h2');
  h2.textContent = 'Contact Information';
  frag.appendChild(h2);

  // Name
  const labelName = document.createElement('label');
  labelName.textContent = 'Your Name *';
  frag.appendChild(labelName);
  const inputName = document.createElement('input');
  inputName.type = 'text';
  inputName.value = state.name;
  inputName.oninput = e => {
    state.name = e.target.value;
  };
  frag.appendChild(inputName);

  // Email
  const labelEmail = document.createElement('label');
  labelEmail.textContent = 'Email *';
  frag.appendChild(labelEmail);
  const inputEmail = document.createElement('input');
  inputEmail.type = 'email';
  inputEmail.value = state.email;
  inputEmail.oninput = e => {
    state.email = e.target.value;
  };
  frag.appendChild(inputEmail);

  // Phone
  const labelPhone = document.createElement('label');
  labelPhone.textContent = 'Phone (optional)';
  frag.appendChild(labelPhone);
  const inputPhone = document.createElement('input');
  inputPhone.type = 'tel';
  inputPhone.value = state.phone;
  inputPhone.oninput = e => {
    state.phone = e.target.value;
  };
  frag.appendChild(inputPhone);

  // Notes
  const labelNotes = document.createElement('label');
  labelNotes.textContent = 'Anything else? (optional)';
  frag.appendChild(labelNotes);
  const inputNotes = document.createElement('textarea');
  inputNotes.value = state.notes;
  inputNotes.oninput = e => {
    state.notes = e.target.value;
  };
  frag.appendChild(inputNotes);

  // Navigation buttons
  const navDiv = document.createElement('div');
  navDiv.className = 'nav-buttons';
  const backBtn = document.createElement('button');
  backBtn.textContent = 'Back';
  backBtn.onclick = () => {
    state.step--;
    render();
  };
  navDiv.appendChild(backBtn);

  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Next';
  nextBtn.onclick = () => {
    if (!state.name.trim()) return alert('Please enter your name.');
    if (!validateEmail(state.email)) return alert('Please enter a valid email.');
    state.step++;
    render();
  };
  navDiv.appendChild(nextBtn);
  frag.appendChild(document.createElement('br'));
  frag.appendChild(navDiv);

  return frag;
}

function validateEmail(email) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}
// Step 4: Experience selection
function renderStepExperience() {
  const frag = document.createDocumentFragment();
  const h2 = document.createElement('h2');
  h2.textContent = 'What would you like to do?';
  frag.appendChild(h2);

  // Craft selection
  const labelCraft = document.createElement('label');
  labelCraft.textContent = 'Choose a craft *';
  frag.appendChild(labelCraft);
  const selectCraft = document.createElement('select');
  selectCraft.innerHTML = `<option value="">Select craft</option>
    <option>Floral Arranging</option><option>Candle Making</option><option>Terrariums</option><option>Jewelry</option><option>Other</option>`;
  selectCraft.value = state.craft;
  selectCraft.onchange = e => {
    state.craft = e.target.value;
    render();
  };
  frag.appendChild(selectCraft);

  if (state.craft === 'Other') {
    const labelCustom = document.createElement('label');
    labelCustom.textContent = 'Describe your custom craft';
    frag.appendChild(labelCustom);
    const inputCustom = document.createElement('input');
    inputCustom.type = 'text';
    inputCustom.value = state.customCraft;
    inputCustom.oninput = e => {
      state.customCraft = e.target.value;
    };
    frag.appendChild(inputCustom);
  }

  // Add-ons
  const addOnLabel = document.createElement('label');
  addOnLabel.textContent = 'Add-ons:';
  frag.appendChild(addOnLabel);
  frag.appendChild(document.createElement('br'));
  const goodie = document.createElement('input');
  goodie.type = 'checkbox';
  goodie.checked = state.goodieBags;
  goodie.onchange = e => {
    state.goodieBags = e.target.checked;
  };
  frag.appendChild(goodie);
  frag.appendChild(document.createTextNode(' Goodie Bags '));

  const deco = document.createElement('input');
  deco.type = 'checkbox';
  deco.checked = state.decorations;
  deco.onchange = e => {
    state.decorations = e.target.checked;
  };
  frag.appendChild(deco);
  frag.appendChild(document.createTextNode(' Decorations '));

  frag.appendChild(document.createElement('br'));

  // Catering
  const labelCatering = document.createElement('label');
  labelCatering.textContent = 'Catering (optional)';
  frag.appendChild(labelCatering);
  const selectCatering = document.createElement('select');
  selectCatering.innerHTML = `<option value="">No catering</option>
    <option>Charcuterie</option><option>Brunch</option><option>Desserts</option><option>Other</option>`;
  selectCatering.value = state.catering;
  selectCatering.onchange = e => {
    state.catering = e.target.value;
    render();
  };
  frag.appendChild(selectCatering);

  // Dietary restrictions (if catering selected)
  if (state.catering && state.catering !== '') {
    const dietLabel = document.createElement('label');
    dietLabel.textContent = 'Dietary restrictions (optional)';
    frag.appendChild(dietLabel);
    frag.appendChild(document.createElement('br'));
    ['vegan', 'gluten', 'vegetarian'].forEach(type => {
      const dietInput = document.createElement('input');
      dietInput.type = 'number';
      dietInput.min = 0;
      dietInput.value = state.dietary[type];
      dietInput.placeholder = type.charAt(0).toUpperCase() + type.slice(1);
      dietInput.oninput = e => {
        state.dietary[type] = parseInt(e.target.value, 10) || 0;
      };
      frag.appendChild(document.createTextNode(type.charAt(0).toUpperCase() + type.slice(1) + ': '));
      frag.appendChild(dietInput);
      frag.appendChild(document.createTextNode(' '));
    });
    frag.appendChild(document.createElement('br'));
  }

  // Navigation buttons
  const navDiv = document.createElement('div');
  navDiv.className = 'nav-buttons';
  const backBtn = document.createElement('button');
  backBtn.textContent = 'Back';
  backBtn.onclick = () => {
    state.step--;
    render();
  };
  navDiv.appendChild(backBtn);

  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Next';
  nextBtn.onclick = () => {
    if (!state.craft) return alert('Please select a craft.');
    if (state.craft === 'Other' && !state.customCraft) return alert('Please describe your custom craft.');
    state.step++;
    render();
  };
  navDiv.appendChild(nextBtn);
  frag.appendChild(document.createElement('br'));
  frag.appendChild(navDiv);

  return frag;
}
// Step 3: Guest count
function renderStepGuests() {
  const frag = document.createDocumentFragment();
  const h2 = document.createElement('h2');
  h2.textContent = 'How many guests?';
  frag.appendChild(h2);

  if (state.location === 'studio') {
    const label = document.createElement('label');
    label.textContent = 'Number of guests (max 16) *';
    frag.appendChild(label);
    const input = document.createElement('input');
    input.type = 'number';
    input.min = 1;
    input.max = 16;
    input.value = state.guestCountStudio;
    input.placeholder = '1-16';
    input.oninput = e => {
      state.guestCountStudio = e.target.value;
    };
    frag.appendChild(input);
  } else if (state.location === 'offsite') {
    const label = document.createElement('label');
    label.textContent = 'Number of guests (min 8) *';
    frag.appendChild(label);
    const input = document.createElement('input');
    input.type = 'number';
    input.min = 8;
    input.value = state.guestCountOffsite;
    input.placeholder = '8+';
    input.oninput = e => {
      state.guestCountOffsite = e.target.value;
    };
    frag.appendChild(input);
  }

  // Navigation buttons
  const navDiv = document.createElement('div');
  navDiv.className = 'nav-buttons';
  const backBtn = document.createElement('button');
  backBtn.textContent = 'Back';
  backBtn.onclick = () => {
    state.step--;
    render();
  };
  navDiv.appendChild(backBtn);

  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Next';
  nextBtn.onclick = () => {
    if (state.location === 'studio') {
      const n = parseInt(state.guestCountStudio, 10);
      if (!n || n < 1 || n > 16) return alert('Please enter 1-16 guests.');
    } else if (state.location === 'offsite') {
      const n = parseInt(state.guestCountOffsite, 10);
      if (!n || n < 8) return alert('Please enter 8 or more guests.');
    }
    state.step++;
    render();
  };
  navDiv.appendChild(nextBtn);
  frag.appendChild(document.createElement('br'));
  frag.appendChild(navDiv);

  return frag;
}
// Step 2: Location selection
function renderStepLocation() {
  const frag = document.createDocumentFragment();
  const h2 = document.createElement('h2');
  h2.textContent = 'Where will your event be?';
  frag.appendChild(h2);

  // Big button style selection
  const btnContainer = document.createElement('div');
  btnContainer.className = 'location-btn-container';

  const studioBtn = document.createElement('button');
  studioBtn.className = 'location-btn' + (state.location === 'studio' ? ' selected' : '');
  studioBtn.textContent = 'In-Studio Private Event';
  studioBtn.onclick = () => {
    state.location = 'studio';
    render();
  };
  btnContainer.appendChild(studioBtn);

  const offsiteBtn = document.createElement('button');
  offsiteBtn.className = 'location-btn' + (state.location === 'offsite' ? ' selected' : '');
  offsiteBtn.textContent = 'Off-Site Private Event';
  offsiteBtn.onclick = () => {
    state.location = 'offsite';
    render();
  };
  btnContainer.appendChild(offsiteBtn);

  frag.appendChild(btnContainer);

  // Disclaimer
  const disclaimer = document.createElement('div');
  disclaimer.textContent = '*Our studio can best accommodate up to 20 people if crafts are included. We recommend booking an off-site event for parties larger than 20.';
  disclaimer.style.color = '#888';
  disclaimer.style.fontSize = '0.85em';
  disclaimer.style.fontStyle = 'italic';
  disclaimer.style.marginTop = '1em';
  frag.appendChild(disclaimer);

  // Navigation buttons
  const navDiv = document.createElement('div');
  navDiv.className = 'nav-buttons';
  const backBtn = document.createElement('button');
  backBtn.textContent = 'Back';
  backBtn.onclick = () => {
    state.step--;
    render();
  };
  navDiv.appendChild(backBtn);

  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Next';
  nextBtn.onclick = () => {
    if (!state.location) return alert('Please select a location.');
    state.step++;
    render();
  };
  navDiv.appendChild(nextBtn);
  frag.appendChild(document.createElement('br'));
  frag.appendChild(navDiv);

  return frag;
}

function renderStepOccasion() {
  const frag = document.createDocumentFragment();
  const h2 = document.createElement('h2');
  h2.textContent = 'Tell us about your event';
  frag.appendChild(h2);

  // Error message area
  const errorDiv = document.createElement('div');
  errorDiv.id = 'step1-error';
  errorDiv.style.color = '#b00';
  errorDiv.style.fontSize = '0.95em';
  errorDiv.style.marginBottom = '0.5em';
  frag.appendChild(errorDiv);

  // Occasion
  const labelOcc = document.createElement('label');
  labelOcc.textContent = 'Occasion *';
  frag.appendChild(labelOcc);
  const selectOcc = document.createElement('select');
  selectOcc.innerHTML = `<option value="">Select occasion</option>
    <option>Birthday</option><option>Baby Shower</option><option>Bridal Shower</option><option>Corporate Event</option><option>Girls’ Night</option><option>Family Gathering</option><option>Friend Gathering</option><option>Other</option>`;
  selectOcc.value = state.occasion;
  selectOcc.onchange = e => {
    state.occasion = e.target.value;
    render();
  };
  frag.appendChild(selectOcc);

  if (state.occasion === 'Other') {
    const labelOther = document.createElement('label');
    labelOther.textContent = 'Please describe the occasion';
    frag.appendChild(labelOther);
    const inputOther = document.createElement('input');
    inputOther.type = 'text';
    inputOther.value = state.occasionOther;
    inputOther.oninput = e => {
      state.occasionOther = e.target.value;
    };
    frag.appendChild(inputOther);
  }

  // Date
  const labelDate = document.createElement('label');
  labelDate.textContent = 'Preferred Date *';
  frag.appendChild(labelDate);
  const inputDate = document.createElement('input');
  inputDate.type = 'date';
  inputDate.value = state.date;
  inputDate.min = getMinDate();
  inputDate.max = getMaxDate();
  inputDate.oninput = e => {
    state.date = e.target.value;
  };
  frag.appendChild(inputDate);

  // Time
  const labelTime = document.createElement('label');
  labelTime.textContent = 'Preferred Time * (between 9:00 AM and 7:00 PM)';
  frag.appendChild(labelTime);
  const inputTime = document.createElement('input');
  inputTime.type = 'time';
  inputTime.value = state.time;
  inputTime.min = '09:00';
  inputTime.max = '19:00';
  inputTime.oninput = e => {
    state.time = e.target.value;
  };
  frag.appendChild(inputTime);

  // Next button
  const btn = document.createElement('button');
  btn.textContent = 'Next';
  btn.onclick = () => {
    const errorDiv = document.getElementById('step1-error');
    if (errorDiv) errorDiv.textContent = '';
    // Validate occasion
    if (!state.occasion) {
      if (errorDiv) errorDiv.textContent = 'Please select an occasion.';
      return;
    }
    // Validate date
    if (!state.date) {
      if (errorDiv) errorDiv.textContent = 'Please select a date.';
      return;
    }
    const today = new Date();
    const selected = new Date(state.date);
    const min = new Date(getMinDate());
    const max = new Date(getMaxDate());
    if (selected < min) {
      if (errorDiv) errorDiv.textContent = 'Please choose a date at least one week from today.';
      return;
    }
    if (selected > max) {
      if (errorDiv) errorDiv.textContent = 'Please choose a date within the current year.';
      return;
    }
    // Validate time
    if (!state.time) {
      if (errorDiv) errorDiv.textContent = 'Please select a time.';
      return;
    }
    // Only allow between 09:00 and 19:00
    const [h, m] = state.time.split(':').map(Number);
    if (h < 9 || h > 19 || (h === 19 && m > 0)) {
      if (errorDiv) errorDiv.textContent = 'Please enter a time between 9:00 AM and 7:00 PM.';
      return;
    }
    state.step++;
    render();
  }
// Step 3: Guest count
function renderStepGuests() {
  const frag = document.createDocumentFragment();
  const h2 = document.createElement('h2');
  h2.textContent = 'How many guests?';
  frag.appendChild(h2);

  if (state.location === 'studio') {
    const label = document.createElement('label');
    label.textContent = 'Number of guests (2-20) *';
    frag.appendChild(label);
    const select = document.createElement('select');
    select.innerHTML = '<option value="">Select number</option>' +
      '<option value="5">5</option>' +
      '<option value="10">10</option>' +
      '<option value="15">15</option>' +
      '<option value="20">20</option>';
    select.value = state.guestCountStudio;
    select.onchange = e => {
      state.guestCountStudio = e.target.value;
    };
    frag.appendChild(select);
  } else if (state.location === 'offsite') {
    const label = document.createElement('label');
    label.textContent = 'Number of guests (20-60) *';
    frag.appendChild(label);
    const input = document.createElement('input');
    input.type = 'number';
    input.min = 20;
    input.max = 60;
    input.value = state.guestCountOffsite;
    input.placeholder = '20-60';
    input.oninput = e => {
      state.guestCountOffsite = e.target.value;
    };
    frag.appendChild(input);
  }

  // Navigation buttons
  const navDiv = document.createElement('div');
  navDiv.className = 'nav-buttons';
  const backBtn = document.createElement('button');
  backBtn.textContent = 'Back';
  backBtn.onclick = () => {
    state.step--;
    render();
  };
  navDiv.appendChild(backBtn);

  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Next';
  nextBtn.onclick = () => {
    if (state.location === 'studio') {
      const n = parseInt(state.guestCountStudio, 10);
      if (!n || ![5, 10, 15, 20].includes(n)) return alert('Please select 5, 10, 15, or 20 guests.');
    } else if (state.location === 'offsite') {
      const n = parseInt(state.guestCountOffsite, 10);
      if (!n || n < 20 || n > 60) return alert('Please enter a number of guests between 20 and 60.');
    }
    state.step++;
    render();
  };
  navDiv.appendChild(nextBtn);
  frag.appendChild(document.createElement('br'));
  frag.appendChild(navDiv);

  return frag;
}
}
// Full Multi-Step Event Quote Widget Implementation

// Pricing Rules 
const pricingRules = {
  studioTier: {
    basePrice: 500,
    guestPrice: 100,
    specialTwoGuestPrice: 300 // Special pricing for 2 guests
  },
  travelFees: {
    baseFee: 50,
    zipFeeMultiplier: 0.1 // Fee per ZIP code distance
  },
  taxRate: 0.0775 // 7.75% tax
};

// Function to calculate total price
function calculateTotalPrice(guestCount, locationZip) {
  let totalPrice = pricingRules.studioTier.basePrice;
  if (guestCount === 2) {
    totalPrice += pricingRules.studioTier.specialTwoGuestPrice;
  } else {
    totalPrice += (guestCount * pricingRules.studioTier.guestPrice);
  }
  totalPrice += calculateTravelFee(locationZip);
  return totalPrice + (totalPrice * pricingRules.taxRate);
}

// Function to calculate travel fee
function calculateTravelFee(zip) {
  // Assuming a simple calculation based on ZIP code distance
  return pricingRules.travelFees.baseFee + (zip.length * pricingRules.travelFees.zipFeeMultiplier);
}

// Dietary Preferences Input Options
const dietaryOptions = [{
  name: 'Vegetarian', checked: false,
},{
  name: 'Vegan', checked: false,
},{
  name: 'Gluten-Free', checked: false 
}];

// EmailJS Configuration
const emailjsConfig = {
  serviceID: 'service_rkb7ozz',
  templates: {
    studio: 'template_trnx5um',
    customer: 'template_oe0ue0z'
  },
  publicKey: 'uLluCpNs5klM8XWml'
};

// Function to send email using EmailJS
function sendEmail(receiverType, data) {
  const templateID = emailjsConfig.templates[receiverType];
  emailjs.send(emailjsConfig.serviceID, templateID, data, emailjsConfig.publicKey)
    .then(response => console.log('Email sent successfully:', response),
          error => console.log('Failed to send email:', error));
}

// Example usage
// let totalPrice = calculateTotalPrice(2, '90210');
// console.log('Total Price:', totalPrice);

// Join Dietary Preferences into selected options
function collectDietaryPreferences() {
  return dietaryOptions.filter(option => option.checked);
}

// Disclaimers
const disclaimers = 'Please note that the total price is subject to change based on final guest count and location.';

// All these functions need to be called in appropriate event handlers for the widget to work seamlessly.
// Multi-Step Event Quote Widget Implementation

// Date restrictions
const today = new Date();
const minDate = new Date();
minDate.setDate(today.getDate() + 7); // at least one week from today
const maxDate = new Date(today.getFullYear(), 11, 31); // end of current year

// Studio guest count options
const studioGuestCounts = [2, 5, 10, 15, 20];
const studioPricing = {
    "2": { rental: 100, catering: 100, decor: 100, crafts: 80, specialPricing: true },
    "5": { rental: 100, catering: 100, decor: 100, crafts: 80 },
    "10": { rental: 150, catering: 150, decor: 150, crafts: 80 },
    "15": { rental: 200, catering: 200, decor: 200, crafts: 80 },
    "20": { rental: 250, catering: 250, decor: 250, crafts: 80 }
};

// Offsite guest count input
const offsiteGuestCountRange = { min: 1, max: 60 };

// Pricing table (example values)
const pricingTable = [
    { item: "Rental", price: 100 },
    { item: "Catering", price: 100 },
    { item: "Decor", price: 100 },
    { item: "Crafts", price: 80 }
];

// Tax calculation
const taxRate = 0.0775;

// Offsite travel fee calculation
const studioCoordinates = { lat: 33.0165, lng: -117.2030 };
const calculateTravelFee = (zip) => {
    // Fetch ZIP details via zippopotam.us and calculate distance to studio
    // Example implementation
    // Placeholder for actual implementation using haversine formula
    return (distance <= 10) ? 100 : 100 + ((distance - 10) * 5);
};

// Dietary restrictions
const dietaryOptions = ["Vegan", "Gluten Free", "Vegetarian"]; // Available only in-studio

// EmailJS integration
const emailJSOptions = {
    serviceID: 'YOUR_SERVICE_ID',
    templateIDs: ['studio_template', 'customer_template'],
    publicKey: 'YOUR_PUBLIC_KEY',
    studioEmail: 'studio@vesperdesign.com'
};

// Submission status messages
const submissionStatusMessages = {
    success: "Your submission has been sent successfully!",
    failure: "There was an error sending your submission. Please try again later."
};

// Disclaimer
const dietaryDisclaimer = "Dietary meals are priced separately and not included.";

// Function to create itemized estimate
function createEstimate() {
    // Implement logic to create an itemized estimate based on inputs
}

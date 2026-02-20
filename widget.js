// Widget Skeleton

// Occasion Field
const occasionField = document.createElement('input');
occasionField.type = 'text';
occasionField.placeholder = 'Occasion';

// Location Fields
const streetField = document.createElement('input');
streetField.type = 'text';
streetField.placeholder = 'Street';
const cityField = document.createElement('input');
cityField.type = 'text';
cityField.placeholder = 'City';
const stateField = document.createElement('input');
stateField.type = 'text';
stateField.placeholder = 'State';
const zipField = document.createElement('input');
zipField.type = 'text';
zipField.placeholder = 'Zip Code';

// Guests Field
const guestsField = document.createElement('input');
guestsField.type = 'number';
guestsField.placeholder = 'Number of Guests';

// Experience Field
const experienceField = document.createElement('textarea');
experienceField.placeholder = 'Experience Description';

// Contact Field
const contactField = document.createElement('input');
contactField.type = 'text';
contactField.placeholder = 'Contact Information';

// Dietary Checkboxes with Disabled Count Inputs
const dietaryOptions = ['Vegan','Vegetarian','Gluten-Free'];
const dietaryCheckboxes = {}; // Object to hold dietary checkbox elements
for (const option of dietaryOptions) {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = option;
    checkbox.disabled = true; // Start as disabled

    const countInput = document.createElement('input');
    countInput.type = 'number';
    countInput.placeholder = 'Count';
    countInput.disabled = true; // Start as disabled

    checkbox.addEventListener('change', function() {
        countInput.disabled = !this.checked; // Enable count input when checked
    });

    dietaryCheckboxes[option] = { checkbox, countInput };
}

// Review Step with Placeholder for Estimate/Travel Fee
const reviewSection = document.createElement('div');
const estimateField = document.createElement('p');
estimateField.textContent = 'Estimate/Travel Fee: $_____'; // Placeholder for estimate
reviewSection.appendChild(estimateField);

// Function to assemble all fields into a form
function assembleWidget() {
    const form = document.createElement('form');
    form.append(occasionField, streetField, cityField, stateField, zipField, guestsField, experienceField, contactField);
    Object.values(dietaryCheckboxes).forEach(({ checkbox, countInput }) => {
        form.append(checkbox, countInput);
    });
    form.appendChild(reviewSection);
    return form;
}

// Call the function to create the widget
const widget = assembleWidget();
document.body.appendChild(widget);
// widget.js

const Widget = () => {
    return (
        <div className="widget">
            <h2>Event Widget</h2>
            <form>
                {/* Occasion */}
                <label htmlFor="occasion">Occasion:</label>
                <input type="text" id="occasion" name="occasion" required />

                {/* Location */}
                <label htmlFor="location">Location:</label>
                <input type="text" id="location" name="location" placeholder="Full Address" required />

                {/* Guests */}
                <label htmlFor="guests">Number of Guests:</label>
                <input type="number" id="guests" name="guests" min="1" required />

                {/* Experience */}
                <label htmlFor="experience">Experience:</label>
                <textarea id="experience" name="experience" placeholder="Describe the experience" required></textarea>

                {/* Contact Information */}
                <label htmlFor="contact">Contact Information:</label>
                <input type="email" id="contact" name="contact" placeholder="Email" required />

                {/* Review Section */}
                <label htmlFor="review">Review:</label>
                <textarea id="review" name="review" placeholder="Leave your review here"></textarea>

                {/* Dietary Preferences */}
                <fieldset>
                    <legend>Dietary Preferences:</legend>
                    <label><input type="checkbox" name="dietary[]" value="vegetarian" /> Vegetarian</label>
                    <label><input type="checkbox" name="dietary[]" value="vegan" /> Vegan</label>
                    <label><input type="checkbox" name="dietary[]" value="gluten-free" /> Gluten-Free</label>
                </fieldset>

                {/* Placeholders for Future Updates */}
                <div>
                    <p>Pricing: [Placeholder]</p>
                    <p>Travel Fee: [Placeholder]</p>
                    <p>Email Sending: [Placeholder]</p>
                </div>

                <button type="submit">Submit</button>
            </form>
        </div>
    );
};

export default Widget;
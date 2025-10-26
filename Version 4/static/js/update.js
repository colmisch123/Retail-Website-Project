// In /static/js/update.js

// Wait for the whole HTML page to load before running any script.
document.addEventListener("DOMContentLoaded", function() {

    // --- Timer Logic (remains mostly the same) ---
    let countdownElement = document.getElementById("countdown-timer");
    if (countdownElement) {
        // (Keep all the existing timer logic here)
        // ...
    }

    // --- START: New Cancel Order Logic ---
    let cancelButton = document.getElementById("cancel-order-button");
    let cancelMessageArea = document.getElementById("cancel-message-area");
    let orderManagementSection = document.querySelector(".flex-container#body-text:last-child"); // Get the parent div holding buttons/forms

    if (cancelButton && cancelMessageArea && countdownElement) { // Check if countdownElement exists too, we need its data
         cancelButton.addEventListener("click", function() {
            let orderId = countdownElement.getAttribute("data-order-id"); // Get ID from timer data

            if (!confirm("Are you sure you want to cancel order #" + orderId + "?")) {
                return; // Stop if user clicks Cancel
            }

            cancelMessageArea.textContent = "Processing cancellation..."; // Give feedback
            cancelMessageArea.style.color = "black";

            // Send the DELETE request
            fetch('/api/cancel_order', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json' // MUST send this header
                },
                // Body needs to be a JSON string containing the order_id
                body: JSON.stringify({ order_id: orderId }) 
            })
            .then(function(response) {
                if (response.status === 204) { // Success! (No Content)
                    cancelMessageArea.textContent = "Order #" + orderId + " successfully cancelled.";
                    cancelMessageArea.style.color = "green";
                    
                    // Update the page visually:
                    // 1. Update status message (if one exists)
                    let statusDisplay = document.querySelector(".flex-container#shipping-status p"); 
                    if(statusDisplay) statusDisplay.textContent = "This order has been cancelled.";
                    
                    // 2. Update countdown text
                    if(countdownElement) countdownElement.textContent = "Order Status: Cancelled";
                    
                    // 3. Remove update form and cancel button (if they exist)
                    let updateForm = document.querySelector('form[action="/update_shipping"]');
                    if(updateForm) updateForm.remove();
                    cancelButton.remove(); // Remove the button itself
                    
                } else if (response.status === 404) {
                     cancelMessageArea.textContent = "Error: Order #" + orderId + " not found or ID was invalid.";
                     cancelMessageArea.style.color = "red";
                } else if (response.status === 400) {
                     cancelMessageArea.textContent = "Error: Order #" + orderId + " cannot be cancelled (it may already be shipped or delivered).";
                     cancelMessageArea.style.color = "red";
                } else {
                     // Handle other unexpected errors
                     cancelMessageArea.textContent = "An unexpected error occurred (Status: " + response.status + "). Please try again.";
                     cancelMessageArea.style.color = "red";
                }
            })
            .catch(function(error) {
                // Handle network errors
                cancelMessageArea.textContent = "Network error: Could not cancel order. " + error;
                cancelMessageArea.style.color = "red";
                console.error("Fetch error:", error);
            });
        });
    }
    // --- END: New Cancel Order Logic ---
});
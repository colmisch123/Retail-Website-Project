// In /static/js/order.js

document.addEventListener("DOMContentLoaded", function() {
    // --- Get references to form elements ---
    var theForm = document.querySelector("#form-collection"); // Get the form itself
    var productSelect = document.getElementById("product");
    var quantityInput = document.getElementById("order_quantity");
    var totalCostDisplay = document.getElementById("total_cost");
    var quantityField = document.getElementById("quantity_field");
    var senderText = document.getElementById("sender");
    var recipientText = document.getElementById("recipient");
    var notesText = document.getElementById("notes"); // Get notes textarea
    var flatRateRadio = document.getElementById("flat");
    var groundRadio = document.getElementById("ground"); // Get other radios too
    var expeditedRadio = document.getElementById("expedited");
    var prefillButton = document.getElementById("prefill_button");
    var messageArea = document.getElementById("response-message"); // Get message div

    var PRICES = {
        "Angry stickman": 5.99,
        "Wobbly stickman": 7.50,
        "Pleased stickman": 6.25,
    };

    // --- Helper functions (updateTotalCost, toggleQuantityField) remain the same ---
    function updateTotalCost() { /* ... unchanged ... */ }
    function toggleQuantityField() { /* ... unchanged ... */ }

    // --- Event Listeners ---
    productSelect.addEventListener("change", function() {
        toggleQuantityField();
        updateTotalCost();
    });
    quantityInput.addEventListener("input", updateTotalCost);
    prefillButton.addEventListener("click", function() { /* ... unchanged ... */ });

    // --- START: New Fetch Logic ---
    theForm.addEventListener("submit", function(event) {
        event.preventDefault(); // Stop the default form submission!

        messageArea.textContent = ""; // Clear previous messages
        messageArea.style.color = "black"; // Reset color

        // 1. Get selected shipping option
        var selectedShipping = "";
        if (flatRateRadio.checked) {
            selectedShipping = flatRateRadio.value;
        } else if (groundRadio.checked) {
            selectedShipping = groundRadio.value;
        } else if (expeditedRadio.checked) {
            selectedShipping = expeditedRadio.value;
        }

        // 2. Construct the JSON data payload
        var orderData = {
            product: productSelect.value,
            quantity: parseInt(quantityInput.value) || 0, // Ensure it's a number
            from_name: senderText.value, // Map 'sender' to 'from_name'
            address: recipientText.value, // Map 'recipient' to 'address'
            shipping: selectedShipping,
            notes: notesText.value
        };

        // 3. Send the data using fetch
        fetch('/api/order', { // Use the new API endpoint
            method: 'POST',
            headers: {
                'Content-Type': 'application/json' // Set header to application/json
            },
            body: JSON.stringify(orderData), // Convert JS object to JSON string
            credentials: 'include'
        })
        .then(function(response) {
            // Check if response status is OK (2xx) or Created (201)
            // Need to parse JSON regardless to get error messages
            return response.json().then(function(data){
                return { ok: response.ok, status: response.status, data: data }; // Pass status along
            }); 
        })
        .then(function(result) {
            if (result.ok) { // Status was 2xx or 201
                 // Success! Display message and link
                 var orderId = result.data.order_id;
                 messageArea.innerHTML = 'Order placed successfully! Your Order ID is: <strong>' + orderId + '</strong>. ' +
                                         '<a href="/tracking/' + orderId + '">Track your order</a>';
                 messageArea.style.color = "green";
                 theForm.reset(); // Clear the form
                 toggleQuantityField(); // Hide quantity field again
                 updateTotalCost(); // Hide total cost
            } else {
                 // Error! Display error messages
                 var errorMessages = result.data.errors.join('<br>'); // Join errors with line breaks
                 messageArea.innerHTML = "<strong>Error placing order:</strong><br>" + errorMessages;
                 messageArea.style.color = "red";
                 console.error("Server returned error:", result.status, result.data.errors);
            }
        })
        .catch(function(error) {
            // Handle network errors or issues parsing JSON
            messageArea.textContent = "An error occurred: " + error;
            messageArea.style.color = "red";
            console.error("Fetch error:", error);
        });
    });
    // --- END: New Fetch Logic ---

    // Initial setup
    toggleQuantityField();
});
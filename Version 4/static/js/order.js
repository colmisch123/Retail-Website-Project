// In /static/js/order.js

document.addEventListener("DOMContentLoaded", function() {
    // --- Get references to form elements ---
    var theForm = document.querySelector("#form-collection"); 
    var productSelect = document.getElementById("product");
    var quantityInput = document.getElementById("order_quantity");
    var totalCostDisplay = document.getElementById("total_cost");
    var quantityField = document.getElementById("quantity_field");
    var senderText = document.getElementById("sender");
    var recipientText = document.getElementById("recipient");
    var notesText = document.getElementById("notes"); 
    var flatRateRadio = document.getElementById("flat");
    var groundRadio = document.getElementById("ground"); 
    var expeditedRadio = document.getElementById("expedited");
    var prefillButton = document.getElementById("prefill_button");
    var messageArea = document.getElementById("response-message"); 

    var PRICES = {
        "Angry stickman": 5.99,
        "Wobbly stickman": 7.50,
        "Pleased stickman": 6.25,
    };

    // --- Helper functions ---
    function updateTotalCost() {
        var selectedProduct = productSelect.value;
        var quantity = parseInt(quantityInput.value);

        if (selectedProduct && quantity > 0 && PRICES[selectedProduct]) {
            var total = (PRICES[selectedProduct] * quantity).toFixed(2);
            totalCostDisplay.textContent = "Total Cost: $" + total;
            totalCostDisplay.style.display = 'block';
        } else {
            totalCostDisplay.style.display = 'none';
        }
    }

    function toggleQuantityField() {
        if (productSelect.value) {
            quantityField.style.display = 'block'; // Or 'flex' if it's a flex item
        } else {
            quantityField.style.display = 'none';
            quantityInput.value = '';
            updateTotalCost();
        }
    }

    // --- Event Listeners ---
    productSelect.addEventListener("change", function() {
        toggleQuantityField();
        updateTotalCost();
    });

    quantityInput.addEventListener("input", updateTotalCost);
    
    prefillButton.addEventListener("click", function() { 
        productSelect.value = "Wobbly stickman";
        quantityInput.value = 3;
        senderText.value = "Test Customer";
        recipientText.value = "Test Recipient:\n123 Fake Street\nAnytown, USA 12345";
        flatRateRadio.checked = true; // Default to flat rate

        // Ensure notes are prefilled too, if desired
        notesText.value = "Prefilled test order notes."; 

        toggleQuantityField();
        updateTotalCost();
    });

    // --- Fetch Logic ---
    theForm.addEventListener("submit", function(event) {
        event.preventDefault(); 
        messageArea.textContent = ""; 
        messageArea.style.color = "black"; 

        var selectedShipping = "";
        if (flatRateRadio.checked) selectedShipping = flatRateRadio.value;
        else if (groundRadio.checked) selectedShipping = groundRadio.value;
        else if (expeditedRadio.checked) selectedShipping = expeditedRadio.value;

        var orderData = {
            product: productSelect.value,
            quantity: parseInt(quantityInput.value) || 0, 
            from_name: senderText.value, 
            address: recipientText.value, 
            shipping: selectedShipping,
            notes: notesText.value
        };

        fetch('/api/order', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData),
            credentials: 'omit' // Explicitly omit credentials if not needed yet for cookies
        })
        .then(function(response) {
             // Try to parse JSON even if status is not ok, for error messages
             return response.json().then(function(data){
                 return { ok: response.ok, status: response.status, data: data }; 
             }).catch(function(jsonError){
                 // Handle cases where response is not JSON (e.g., server crash -> HTML error)
                 console.error("JSON parsing error:", jsonError);
                 return { ok: false, status: response.status, data: { errors: ["Server returned a non-JSON response."] } };
             });
        })
        .then(function(result) {
            if (result.ok) { 
                 var orderId = result.data.order_id;
                 messageArea.innerHTML = 'Order placed successfully! Your Order ID is: <strong>' + orderId + '</strong>. ' +
                                         '<a href="/tracking/' + orderId + '">Track your order</a>';
                 messageArea.style.color = "green";
                 theForm.reset(); 
                 toggleQuantityField(); 
                 updateTotalCost(); 
            } else {
                 // Ensure result.data.errors exists and is an array before joining
                 var errorMessages = Array.isArray(result.data.errors) ? result.data.errors.join('<br>') : "Unknown error structure received from server.";
                 messageArea.innerHTML = "<strong>Error placing order:</strong><br>" + errorMessages;
                 messageArea.style.color = "red";
                 console.error("Server returned error:", result.status, result.data.errors);
            }
        })
        .catch(function(error) {
            messageArea.textContent = "An network error occurred: " + error;
            messageArea.style.color = "red";
            console.error("Fetch network error:", error);
        });
    });

    // --- Initial setup ---
    toggleQuantityField(); // Hide quantity initially
}); // REMOVED extra brace here
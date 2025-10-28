// In /static/js/order.js

document.addEventListener("DOMContentLoaded", function() {
    // --- Get references to form elements ---
    let theForm = document.querySelector("#form-collection"); 
    let productSelect = document.getElementById("product");
    let quantityInput = document.getElementById("order_quantity");
    let totalCostDisplay = document.getElementById("total_cost");
    let quantityField = document.getElementById("quantity_field");
    let senderText = document.getElementById("sender");
    let recipientText = document.getElementById("recipient");
    let notesText = document.getElementById("notes"); 
    let flatRateRadio = document.getElementById("flat");
    let groundRadio = document.getElementById("ground"); 
    let expeditedRadio = document.getElementById("expedited");
    let prefillButton = document.getElementById("prefill_button");
    let messageArea = document.getElementById("response-message"); 

    let PRICES = {
        "Angry stickman": 5.99,
        "Wobbly stickman": 7.50,
        "Pleased stickman": 6.25,
    };

    //helper function to dynamically display price
    function updateTotalCost() {
        let selectedProduct = productSelect.value;
        let quantity = parseInt(quantityInput.value);

        if (selectedProduct && quantity > 0 && PRICES[selectedProduct]) {
            let total = (PRICES[selectedProduct] * quantity);
            totalCostDisplay.textContent = "Total Cost: $" + total.toFixed(2); //referenced https://www.w3schools.com/jsref/jsref_tofixed.asp
            totalCostDisplay.style.display = 'block';
        } else {
            totalCostDisplay.style.display = 'none';
        }
    }

    //helper function to toggle visibilty of the item quantity selection
    function toggleQuantityField() {
        if (productSelect.value) {
            quantityField.style.display = 'block';
        } else {
            quantityField.style.display = 'none';
            quantityInput.value = '';
            updateTotalCost();
        }
    }

    //whole block for dynamic price display 
    productSelect.addEventListener("change", function() {
        toggleQuantityField();
        updateTotalCost();
    });

    //update price when quantity changes
    quantityInput.addEventListener("input", updateTotalCost);
    
    //function for the prefill form button
    prefillButton.addEventListener("click", function() { 
        productSelect.value = "Wobbly stickman";
        quantityInput.value = 3;
        senderText.value = "Test Customer";
        recipientText.value = "Test Recipient:\n123 Fake Street\nAnytown, USA 12345";
        flatRateRadio.checked = true;
        notesText.value = "Prefilled test order notes."; 
        toggleQuantityField();
        updateTotalCost();
    });

    //fetch logic when an order is submitted
    theForm.addEventListener("submit", function(event) {
        event.preventDefault(); 

        //reset top message
        messageArea.textContent = ""; 
        messageArea.style.color = "black";
        
        let rememberMeCheckbox = document.getElementById("remember_me");

        //collect all submitted data
        let selectedShipping = "";
        if (flatRateRadio.checked) selectedShipping = flatRateRadio.value;
        else if (groundRadio.checked) selectedShipping = groundRadio.value;
        else if (expeditedRadio.checked) selectedShipping = expeditedRadio.value;

        let orderData = {
            product: productSelect.value,
            quantity: parseInt(quantityInput.value) || 0, 
            from_name: senderText.value, 
            address: recipientText.value, 
            shipping: selectedShipping,
            notes: notesText.value,
            remember_me: rememberMeCheckbox.checked
        };

        fetch('/api/order', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData),
            credentials: 'include'
        })
        .then(function(response) {
            //try to parse JSON even if status is not ok, for error messages
            return response.json().then(function(data){
                return { ok: response.ok, status: response.status, data: data }; 
            }).catch(function(jsonError){
                //handle cases where response is not JSON (e.g., server crash -> HTML error)
                console.error("JSON parsing error:", jsonError);
                return { ok: false, status: response.status, data: { errors: ["Server returned a non-JSON response."] } };
            });
        })
        .then(function(result) {
            if (result.ok) { 
                var orderId = result.data.order_id;
                messageArea.innerHTML = 'Order placed successfully! Your Order ID is:&nbsp;<strong>' + orderId + '</strong>. &nbsp;' + '<a href="/tracking/' + orderId + '">Track your order</a>';
                messageArea.style.color = "green";
                messageArea.style.fontSize = "x-large";

                let submittedName = senderText.value; 
                let rememberMe = rememberMeCheckbox.checked;

                theForm.reset(); //clearing the form (referenced https://www.w3schools.com/jsref/met_form_reset.asp)

                if (rememberMe) {senderText.value = submittedName} //if remember was checked, manually put the submitted name back
                else {senderText.value = ""} //this may look redundant, but the name box would refill (even if you don't hit remember me) after placing an order (until refresh)
                
                toggleQuantityField(); 
                updateTotalCost(); 
            }
        });
    });

    toggleQuantityField(); //hide quantity until a product is chosen
});
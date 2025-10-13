document.addEventListener("DOMContentLoaded", function() {
    var productSelect = document.getElementById("product");
    var quantityInput = document.getElementById("order_quantity");
    var totalCostDisplay = document.getElementById("total_cost");
    var quantityField = document.getElementById("quantity_field");
    var senderText = document.getElementById("sender");
    var recipientText = document.getElementById("recipient");
    var flatRateRadio = document.getElementById("flat");
    var prefillButton = document.getElementById("prefill_button");

    //Used for price calculation tool
    var PRICES = {
        "Angry stickman": 5.99,
        "Wobbly stickman": 7.50,
        "Pleased stickman": 6.25,
    };

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
            quantityField.style.display = 'block';
        } else {
            quantityField.style.display = 'none';
            quantityInput.value = '';
            updateTotalCost();
        }
    }

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
        flatRateRadio.checked = true;

        toggleQuantityField();
        updateTotalCost();
    });

    toggleQuantityField();
});
//Wait for the whole HTML page to load before running any script.
document.addEventListener("DOMContentLoaded", function() {

    //Countdown / shipping logic
    let countdownElement = document.getElementById("countdown-timer");
    if (countdownElement) {

        //getting order info from the doc
        let orderStatus = countdownElement.getAttribute("data-order-status");
        let orderDateStr = countdownElement.getAttribute("data-order-date");
        let orderId = countdownElement.getAttribute("data-order-id");
        let shipTimeInMinutes = 1; //default time to ship once an order is placed

        if (orderStatus !== "placed") {
            let firstLetter = orderStatus.charAt(0).toUpperCase();
            let restOfWord = orderStatus.slice(1);
            countdownElement.textContent = "Order Status: " + firstLetter + restOfWord;
        } else {
            //start the timer
            let orderDate = new Date(orderDateStr);
            let shipDate = new Date(orderDate.getTime() + (shipTimeInMinutes * 60 * 1000));
            let hasShipped = false;

            //this function runs every second to update the timer.
            function updateTimer() {
                let now = new Date();
                let remainingTime = shipDate - now; //time left in ms.

                //every second we check if the timer is up, and if its at zero then we set ship the order
                if (remainingTime <= 0) {
                    countdownElement.textContent = "Order has shipped!";
                    clearInterval(timerInterval); //stop the timer
                    if (hasShipped == false) {
                        hasShipped = true;
                        //Referenced https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods/POST 
                        fetch('/ship_order', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: 'id=' + orderId
                        })
                    }
                } else {
                    let totalSecondsLeft = Math.floor(remainingTime / 1000);
                    countdownElement.textContent = "Time remaining until order ships: " + Math.floor(totalSecondsLeft / 60) + "m " + totalSecondsLeft % 60 + "s"; //display the timer
                }
            }
            updateTimer(); 
            var timerInterval = setInterval(updateTimer, 1000);
        }
    }

    //Cancel Order Logic
    let cancelButton = document.getElementById("cancel-order-button");
    let cancelMessageArea = document.getElementById("cancel-message-area");
    let orderManagementSection = document.querySelector(".flex-container#body-text:last-child"); // Get the parent div holding buttons/forms

    if (cancelButton && cancelMessageArea && countdownElement) { // Check if countdownElement exists too, we need its data
         cancelButton.addEventListener("click", function() {
            let orderId = countdownElement.getAttribute("data-order-id"); // Get ID from timer data
            
            //referenced https://www.w3schools.com/jsref/met_win_confirm.asp
            if (!confirm("Are you sure you want to cancel order #" + orderId + "?")) {
                return;
            } 

            clearInterval(timerInterval); //Cancel the timer

            //send the DELETE request
            fetch('/api/cancel_order', {
                method: 'DELETE',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({order_id:orderId}) 
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
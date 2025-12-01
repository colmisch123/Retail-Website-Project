//wait for the whole HTML page to load before running any script. Referenced https://oxylabs.io/resources/web-scraping-faq/javascript/wait-page-load 
document.addEventListener("DOMContentLoaded", function() {

    let timerInterval = null;
    let cancelButton = document.getElementById("cancel-order-button"); 
    let cancelMessageArea = document.getElementById("cancel-message-area"); //message area to tell if an order was successful (hidden by default)
    let countdownElement = document.getElementById("countdown-timer");
    if (countdownElement) {

        //getting order info from the doc
        let orderStatus = countdownElement.getAttribute("data-order-status");
        let orderId = countdownElement.getAttribute("data-order-id");
        let shipTimeInMinutes = 1; //default time to ship once an order is placed

        if (orderStatus !== "placed") {
            let firstLetter = orderStatus.charAt(0).toUpperCase();
            let restOfWord = orderStatus.slice(1);
            countdownElement.textContent = "Order Status: " + firstLetter + restOfWord;
        } else {
            //start the timer
            let orderDate = new Date(countdownElement.getAttribute("data-order-date"));
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
                        
                        //cleaning up the right side by removing order updating forms
                        let updateForm = document.querySelector('form[action="/update_shipping"]'); 
                        if(updateForm) updateForm.remove();
                        cancelButton.remove(); //remove the button itself

                        //editing top text in the left box when order ships
                        let statusDisplay = document.querySelector(".flex-container#shipping-status p"); 
                        if(statusDisplay) statusDisplay.textContent = "Your order is currently shipping.";

                        //edit the in-table text to change the order to say "shipped"
                        let tableStatusDisplay = document.querySelector("#current-status")
                        if (tableStatusDisplay) tableStatusDisplay.textContent = "Shipped"
                    }
                } else {
                    //timer isn't up so we continue to decrement it
                    let totalSecondsLeft = Math.floor(remainingTime / 1000);
                    countdownElement.textContent = "Time remaining until order ships: " + Math.floor(totalSecondsLeft / 60) + "m " + totalSecondsLeft % 60 + "s"; //display the timer
                }
            }
            updateTimer(); 
            timerInterval = setInterval(updateTimer, 1000);
        }
    }

    //cancel order logic
        cancelButton.addEventListener("click", function() {
        let orderId = countdownElement.getAttribute("data-order-id"); //get ID from timer data
        
        //referenced https://www.w3schools.com/jsref/met_win_confirm.asp for a confirm window
        if (!confirm("Are you sure you want to cancel order #" + orderId + "?")) {
            return;
        } 

        clearInterval(timerInterval); //cancel the timer since the order is cancelled

        //send the DELETE request
        fetch('/api/cancel_order', {
            method: 'DELETE',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({order_id:orderId}) 
        })
        .then(function(response) {
            if (response.status === 204) { //success in cancelling
                cancelMessageArea.textContent = "Order #" + orderId + " successfully cancelled.";
                cancelMessageArea.style.color = "green";

                //update the table
                let tableStatusDisplay = document.querySelector("#current-status");
                tableStatusDisplay.textContent = "Cancelled";
                //update status message
                let statusDisplay = document.querySelector(".flex-container#shipping-status p");
                if(statusDisplay) statusDisplay.textContent = "This order has been cancelled.";
                
                //update countdown text
                if(countdownElement) countdownElement.textContent = "Order Status: Cancelled";
                
                //remove update form and cancel button
                let updateForm = document.querySelector('form[action="/update_shipping"]');
                if(updateForm) updateForm.remove();
                cancelButton.remove();
                
            } else if (response.status === 404) {
                    cancelMessageArea.textContent = "Error: Order #" + orderId + " not found or ID was invalid.";
                    cancelMessageArea.style.color = "red";
            } else if (response.status === 400) {
                    cancelMessageArea.textContent = "Error: Order #" + orderId + " cannot be cancelled (it may already be shipped or delivered).";
                    cancelMessageArea.style.color = "red";
            }
        });
    });
});
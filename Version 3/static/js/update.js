// Wait for the whole HTML page to load before running any script.
document.addEventListener("DOMContentLoaded", function() {

    let countdownElement = document.getElementById("countdown-timer");
    if (countdownElement) {

        //getting order info from the doc (referenced https://www.w3schools.com/jsref/met_element_getattribute.asp)
        let orderStatus = countdownElement.getAttribute("data-order-status");
        let orderDateStr = countdownElement.getAttribute("data-order-date");
        let orderId = countdownElement.getAttribute("data-order-id");
        let shipTimeInMinutes = 1; //default time to ship once an order is placed

        if (orderStatus !== "placed") {
            let firstLetter = orderStatus.charAt(0).toUpperCase();
            let restOfWord = orderStatus.slice(1);
            countdownElement.textContent = "Order Status: " + firstLetter + restOfWord; //just show the status since the order status isn't "placed"
        } else {
            //start the timer
            let orderDate = new Date(orderDateStr);
            let shipDate = new Date(orderDate.getTime() + (shipTimeInMinutes * 60 * 1000));
            let hasShipped = false;

            //this function runs every second to update the timer.
            function updateTimer() {
                let now = new Date();
                let remainingTime = shipDate - now; //time left in ms.

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
                        }).then(function(response) {
                            if (response.ok) {
                                console.log("Order updated! Reloading the page.");
                                // Reload the page to show the new "Shipped" status.
                                window.location.reload(); 
                            } else {
                                console.log("Something went wrong while trying to update the order.");
                            }
                        });
                    }
                } else {
                    let totalSecondsLeft = Math.floor(remainingTime / 1000);
                    countdownElement.textContent = "Time remaining until order ships: " + Math.floor(totalSecondsLeft / 60) + "m " + totalSecondsLeft % 60 + "s"; //display the timer
                }
            }
            let timerInterval = setInterval(updateTimer, 1000);  //the beating heart of it all
        }
    }

});
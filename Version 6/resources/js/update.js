//Wait for the whole HTML page to load before running any script.
document.addEventListener("DOMContentLoaded", function() {

    let timerInterval = null;
    let cancelButton = document.getElementById("cancel-order-button");
    let cancelMessageArea = document.getElementById("cancel-message-area"); //message area to tell if an order was successful (hidden by default)
    let countdownElement = document.getElementById("countdown-timer");
    if (countdownElement) {

        //getting order info from the doc
        let orderStatus = countdownElement.getAttribute("data-order-status");
        let orderDateStr = countdownElement.getAttribute("data-order-date");
        let orderId = countdownElement.getAttribute("data-order-id");
        let shipTimeInMinutes = 2; //default time to ship once an order is placed

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
                        }).then(function(response) {
                            if (response.ok) {
                                //update Status Text
                                let statusDisplay = document.querySelector(".flex-container#shipping-status p");
                                if(statusDisplay) statusDisplay.textContent = "Your order is currently shipping.";

                                let tableStatusDisplay = document.querySelector("#current-status");
                                if (tableStatusDisplay) tableStatusDisplay.textContent = "Shipped";

                                //remove forms/buttons
                                let updateForm = document.querySelector('form[action="/update_shipping"]');
                                if(updateForm) updateForm.remove();
                                if(cancelButton) cancelButton.remove();

                                //add History Row
                                modifyHistoryRow("Shipped");

                            } else {
                                console.log("Something went wrong while trying to update the order.");
                            }
                        });
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

    //this is a lot of code for a specific edge case, but it basically updates the OrderHistory table dynamically
    //with the new shipping row when an order is shipped.
    function modifyHistoryRow(status) {
        let historyTable = document.getElementById("history-order") || null;

        if (historyTable) {
            let tbody = historyTable.querySelector("tbody");
            let newRow = document.createElement("tr");

            //grab current values from the main table to use in the new row
            let mainTable = document.getElementById("single-order") ;
            let currentShipping = mainTable.rows[8].cells[1].innerText || "N/A";
            let currentAddress = mainTable.rows[4].cells[1].innerHTML || "N/A";
            let currentNotes = mainTable.rows[6].cells[1].innerText || "N/A";

            //create cells
            let timeCell = document.createElement("td");
            //format the date to match what server.js would spit out
            let d = new Date();
            let dateStr = d.toLocaleDateString('en-US', {year:'numeric', month:'2-digit', day:'2-digit'});
            let timeStr = d.toLocaleTimeString('en-US', {hour12: false});
            timeCell.innerText = dateStr + " " + timeStr;

            let statusCell = document.createElement("td");
            statusCell.innerText = status;
            let shippingCell = document.createElement("td");
            shippingCell.innerText = currentShipping;
            let addressCell = document.createElement("td");
            addressCell.innerHTML = currentAddress; //innerHTML to preserve any <br>s
            let notesCell = document.createElement("td");
            notesCell.innerText = currentNotes;

            //prepare cell row
            newRow.appendChild(timeCell);
            newRow.appendChild(statusCell);
            newRow.appendChild(shippingCell);
            newRow.appendChild(addressCell);
            newRow.appendChild(notesCell);

            //insert at top of table
            if (tbody.firstChild) {
                tbody.insertBefore(newRow, tbody.firstChild);
            } else {
                tbody.appendChild(newRow);
            }
        }
    }

    //cancel order logic
    if(cancelButton) {
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
                        if(cancelMessageArea) {
                            cancelMessageArea.textContent = "Order #" + orderId + " successfully cancelled.";
                            cancelMessageArea.style.color = "green";
                        }

                        //update the table
                        let tableStatusDisplay = document.querySelector("#current-status");
                        if(tableStatusDisplay) tableStatusDisplay.textContent = "Cancelled";

                        //update status message
                        let statusDisplay = document.querySelector(".flex-container#shipping-status p");
                        if(statusDisplay) statusDisplay.textContent = "This order has been cancelled.";

                        //update countdown text
                        if(countdownElement) countdownElement.textContent = "Order Status: Cancelled";

                        //remove update form and cancel button
                        let updateForm = document.querySelector('form[action="/update_shipping"]');
                        if(updateForm) updateForm.remove();
                        if(cancelButton) cancelButton.remove();

                        //update history table
                        modifyHistoryRow("Cancelled");

                    } else if (response.status === 404) {
                        if(cancelMessageArea) {
                            cancelMessageArea.textContent = "Error: Order #" + orderId + " not found or ID was invalid.";
                            cancelMessageArea.style.color = "red";
                        }
                    } else if (response.status === 400) {
                        if(cancelMessageArea) {
                            cancelMessageArea.textContent = "Error: Order #" + orderId + " cannot be cancelled (it may already be shipped or delivered).";
                            cancelMessageArea.style.color = "red";
                        }
                    }
                });
        });
    }
});
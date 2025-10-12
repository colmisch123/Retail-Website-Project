// In static/js/update.js
document.addEventListener("DOMContentLoaded", () => {
    const countdownElement = document.getElementById("countdown-timer");
    if (!countdownElement) return;

    const orderStatus = countdownElement.dataset.orderStatus;
    const orderDateStr = countdownElement.dataset.orderDate;
    const orderId = countdownElement.dataset.orderId; // We need the ID for the POST
    
    const SHIP_TIME_MINUTES = 3; // Let's use a 3-minute timer

    if (orderStatus !== 'placed') {
        countdownElement.textContent = `Order status: ${orderStatus}`;
        return;
    }
    
    const orderDate = new Date(orderDateStr);
    const shipDate = new Date(orderDate.getTime() + SHIP_TIME_MINUTES * 60 * 1000);
    let hasShipped = false;

    const timerInterval = setInterval(() => {
        const now = new Date();
        const remainingTime = shipDate - now;

        if (remainingTime <= 0) {
            countdownElement.textContent = "Order has shipped!";
            clearInterval(timerInterval);
            
            // Send a POST request to the server to update the status
            if (!hasShipped) {
                hasShipped = true; // Prevents sending multiple requests
                fetch('/ship_order', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                    body: `id=${orderId}`
                }).then(response => {
                    if (response.ok) console.log("Order status updated successfully.");
                    else console.error("Failed to update order status.");
                });
            }
            return;
        }

        const minutes = Math.floor(remainingTime / (1000 * 60));
        const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
        countdownElement.textContent = `Time remaining until order ships: ${minutes}m ${seconds}s`;
    }, 1000);
});
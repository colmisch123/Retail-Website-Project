const express = require('express')
const app = express()
const port = 4131
const cookieParser = require('cookie-parser')
const db = require('./data')

app.set("view engine", "pug")
app.set("views", "templates")
app.use('/css', express.static('resources/css'))
app.use('/js', express.static('resources/js'))
app.use('/images', express.static('resources/images'))
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(cookieParser())

//this block runs any time a request is made to the server.
app.use(async (req, res, next) => {

    //call updateOrderStatuses with every request to the server
    let result = await db.updateOrderStatuses();
    if (result === -1){
        console.log("Error: Something went wrong when trying to call updateOrderStatuses() in data.js");
    }

    //print out server meta information (extra credit for hw 5), referenced https://stackoverflow.com/questions/11137648/how-do-i-capture-a-response-end-event-in-node-jsexpress)
    res.on('finish', async () => {
        console.log(`Method: ${req.method}   |   Url: ${req.originalUrl}   |   Status code: ${res.statusCode}   |   Total Orders: ${(await db.getOrders()).length}`);
    });

    next();
});


//constant values I either check against or for my personal reference
const shipping_statuses = ["Delivered", "Placed", "Shipped", "Cancelled"]
const valid_shipping_options = ["Flat rate", "Ground", "Expedited"]
const prices = {"Angry stickman": 5.99, "Wobbly stickman": 7.50, "Pleased stickman": 6.25}
const max_name_length = 64
const max_address_length = 1024


//typeset money, referenced https://expressjs.com/en/api.html to create a global function
app.locals.typeset_dollars = function(number) {
    try {
        if (typeof number !== 'number') {
            number = parseFloat(number);
        }
        return `$${number.toFixed(2)}`;
    } catch (error) {
        console.log("invalid input given to typeset_dollars: ", number);
        return 'Error: NaN';
    }
}

//function to take a stored date object and make it human-readable
app.locals.format_date = function(dateObject) {
    //check if input is a valid date object
    if (!dateObject || !(dateObject instanceof Date)) {
        return "N/A";
    }

    //referenced https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleString
    return dateObject.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).replace(',', ''); //clean up the format
}

//Referenced https://dev.to/gathoni/express-req-params-req-query-and-req-body-4lpc for pretty much anything with dynamic html
//GET functions

//Return 5 most recent orders for a given id
app.get("/api/order/:id/history", async (req, res) => {
    try {
        const history = await db.getOrderHistory(req.params.id);
        // Send the data as JSON, don't just return it
        res.status(200).json(history);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server Error" });
    }
});

//home page
app.get(["/", "/about"], (req, res) => {
    res.status(200)
    res.render('about.pug')
})

//place an order page
app.get("/order", (req, res) => {
    let customer_name = req.cookies.customer_name || "";
    res.status(200).render('order.pug', {
        customer_name: customer_name
    });
});

//order fail page
app.get("/order_fail", (req, res) => {
    res.status(200)
    res.render('order_fail.pug')
})

//Render the tracking page for an order given its ID
app.get('/tracking/:id', async (req, res) => {

    const order = await db.getOrder(req.params.id); //get order from db
    let updateHistory = await db.getOrderHistory(req.params.id);

    if (!order) { //no order found, render 404
        res.status(404).render('404.pug');
    }

    //create the message on the page that tells the user more about its status
    const orderStatus = order.status.toLowerCase();
    let statusMessage = "";
    switch (orderStatus) {
        case "delivered":
            statusMessage = "Your order has been completed!";
            break;
        case "shipped":
            statusMessage = "Your order is currently shipping.";
            break;
        case "placed":
            statusMessage = "Your order has been placed and is processing.";
            break;
        case "cancelled":
            statusMessage = "This order has been cancelled.";
            break;
    }

    //preparing text for the <textarea> (replacing <br> with newlines)
    const addressForTextarea = order.address ? order.address.replace(/<br>/g, "\n") : "";
    const notesForTextarea = order.notes ? order.notes.replace(/<br>/g, "\n") : "";
    //bools for checking the correct radio button
    const isFlat = order.shipping === "Flat rate";
    const isGround = order.shipping === "Ground";
    const isExpedited = order.shipping === "Expedited";
    //format the date
    const formattedOrderDate = new Date(order.order_date).toLocaleString('en-US');
    res.status(200).render('tracking.pug', {
        order: order,
        orderStatus: orderStatus,
        updateHistory: updateHistory,
        statusMessage: statusMessage,
        addressForTextarea: addressForTextarea,
        notesForTextarea: notesForTextarea,
        isFlat: isFlat,
        isGround: isGround,
        isExpedited: isExpedited,
        formattedOrderDate: formattedOrderDate
    });
});

app.get(['/orders', '/admin/orders'], async (req, res) => {

    //get all the filters from the query (pretty much the same as my python code)
    let order_number_raw = (req.query.order_number || "").trim();
    let status_raw = (req.query.status || "").trim();
    let sender_raw = (req.query.query || "").trim();

    let filtered_orders = [];
    let error_message = null;
    let search_message_parts = [];

    //user searched with a specific order number
    if (order_number_raw) {
        const order_id = parseInt(order_number_raw, 10);
        if (isNaN(order_id) || order_id < 0) {
            error_message = "Invalid order number.";
        } else {
            const found_order = await db.getOrder(order_id);
            if (found_order) {
                //order was found. Check if it also matches the other filters
                const status_match = !status_raw || found_order.status.toLowerCase() === status_raw.toLowerCase();
                const sender_match = !sender_raw || (found_order.from_name && found_order.from_name.toLowerCase().includes(sender_raw.toLowerCase()));

                if (status_match && sender_match) {
                    //if one order is found by ID i redirect to the tracking page for it. Referenced https://www.geeksforgeeks.org/web-tech/express-js-res-redirect-function/
                    return res.redirect(`/tracking/${order_id}`);
                }
                else {
                    error_message = "No order found with that ID matching all filters.";
                }
            }
            else {
                error_message = "No order found with that ID.";
            }
        }
    }
    //general search without order number, but includes filters
    else {
        //database call to get filtered list
        filtered_orders = await db.getOrders(sender_raw, status_raw);

        //build the "Currently filtering by..." string
        if (status_raw) search_message_parts.push(`status of <strong>${status_raw.toLowerCase()}</strong>`);
        if (sender_raw) search_message_parts.push(`sender containing <strong>${sender_raw}</strong>`);
    }

    //render the orders template with all the variables we've made so far
    res.render('orders.pug', {
        order_number_raw: order_number_raw,
        status_raw: status_raw,
        sender_raw: sender_raw,
        search_message: search_message_parts.join(' and '),
        filtered_orders: filtered_orders,
        error_message: error_message
    });
});



//POST functions

//update the shipping info of an order given input params for it.
app.post("/update_shipping", async (req, res) => {
    //extract update info from the request body
    let id = req.body.id;
    let shipping = req.body.shipping || null;
    let address = req.body.address || null;
    let notes = req.body.notes || null;

    if (await db.updateOrder(id, shipping, address, notes)) {
        res.status(200).render('order_updated', {
            order_id: req.body.id,
            change_method: "Updated"
        });
    } else {
        res.status(400).render('order_fail'); //failure
    }
});

app.post("/ship_order", async (req, res) => {
    //i put updateOrderStatuses at the top to be called before every single function in the server.
    //In theory, that means this route will call it

    order = await db.getOrder(req.body.id);
    if (order.status.toLowerCase() === "shipped"){
        //technically, can potentially return 200 for orders that are already shipped which isn't ideal.
        //But it should be good enough for the purposes of the server.
        res.status(200).end()
    }

});

app.post("/api/order", async (req, res) => {

    //check Content-Type header
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('application/json')) {
        res.status(400).json({
            status: "error",
            errors: ["Request header 'Content-Type' must be 'application/json'"]
        });
        return;
    }

    //validate data
    const data = req.body;
    let errors = [];
    const requiredFields = ["product", "from_name", "quantity", "address", "shipping"];

    //check for missing fields
    for (const field of requiredFields) {
        if (!data[field]) {
            errors.push(`Missing required field: ${field}`);
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({ status: "error", errors: errors });
    }

    //verify name/address lengths aren't too long
    const from_name = data.from_name || "";
    const address = data.address || "";
    const product = data.product;
    const quantity = parseInt(data.quantity, 10);
    const shipping = data.shipping;

    if (from_name.length >= max_name_length) {
        errors.push(`Sender name must be less than ${max_name_length} characters`)}
    if (address.length >= max_address_length) {
        errors.push(`Address must be less than ${max_address_length} characters`)}

    if (isNaN(quantity) || quantity <= 0) {
        errors.push("Quantity must be a positive integer")}
    if (!prices[product]) {
        errors.push("Unrecognized product")}
    if (!valid_shipping_options.includes(shipping)) {
        errors.push("Invalid shipping method")}

    //failure handling
    if (errors.length > 0) {
        let status_code = 400;
        let response_data = {};
        let lengthErrors = [];
        let otherErrors = [];

        for (let i = 0; i < errors.length; i++) {
            let error = errors[i];
            if (error.indexOf("characters") !== -1) {
                lengthErrors.push(error);
            } else {
                otherErrors.push(error);
            }
        }
        if (lengthErrors.length > 0) {
            status_code = 413;
            response_data = {"status": "error", "errors": lengthErrors};
        } else {
            response_data = {"status": "error", "errors": otherErrors};
        }
        return res.status(status_code).json(response_data);
    }

    const api_data = {
        product: product,
        from_name: from_name,
        status: "Placed",
        quantity: quantity,
        address: address.replace(/\n/g, "<br>"),
        shipping: shipping,
        notes: data.notes || "N/A",
        cost: prices[product] * quantity,
        //order_date is handled in addOrder or defaults to NOW()
    };

    //call database
    const new_id = await db.addOrder(api_data);

    if (new_id !== null) {
        const customer_name = from_name;
        const remember = data.remember_me || false;

        //cookie logic
        if (remember && customer_name) {
            const sanitized_name = customer_name.replace(/[^a-zA-Z0-9 ]/g, '');
            if (sanitized_name) {
                res.cookie('customer_name', sanitized_name, {
                    path: '/',
                    maxAge: 31536000000
                });
            }
        } else {
            if (req.cookies.customer_name) {
                res.clearCookie('customer_name', { path: '/' });
            }
        }

        //send 201 Created response
        res.status(201).json({
            status: "success",
            order_id: new_id
        });
    } else {
        res.status(500).json({ status: "error", errors: ["Database error"] });
    }
});



//DELETE requests

//I refactored this function a bit to have cleaner results with the database
app.delete("/api/cancel_order", async (req, res) => {

    //check Header
    if (!req.is('application/json')) {
        return res.status(400).send("Content-Type must be application/json");
    }

    //validate ID
    const orderId = parseInt(req.body.order_id);
    if (isNaN(orderId)) {
        return res.status(400).send("Invalid or missing order_id");
    }

    //most of the work here is done in the data.js function, this just gives the proper result.
    const result = await db.cancelOrder(orderId);
    if (result === "success") {
        res.status(204).end();
    } else if (result === "not_found") {
        res.status(404).send("Order not found");
    } else if (result === "not_cancellable") {
        res.status(400).send("Order cannot be cancelled");
    } else {
        res.status(500).send("Internal Server Error");
    }
});

//404 page is the default if nothing else works
app.use((req, res) => {
    res.status(404).render('404.pug');
});


app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}/`)
})

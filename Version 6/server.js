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

//Known bugs and whatnot
//TODO: New orders are immediately marked as shipped. I think ship_order is somehow being called immediately from like update.js or whatever.
//TODO: orders page shows a shipped order as "Placed."
//TODO: Maybe the order itself isn't getting updated, but the JS in the tracking page is only showing that it is?!?!

//TODO: Should find a way to implement all data.js functions, currently need updateOrder and getOrderHistory (and probably more usage of updateOrderStatuses idk)
//TODO: Get rid of old helper functions

//extra credit (referenced https://stackoverflow.com/questions/11137648/how-do-i-capture-a-response-end-event-in-node-jsexpress)
app.use((req, res, next) => {
    res.on('finish', () => {
        console.log(`Method: ${req.method}   |   Url: ${req.originalUrl}   |   Status code: ${res.statusCode}   |   Total Orders: ${db.getOrders().length})`);
    });
    next();
});


//constant values I either check against or for my personal reference
const shipping_statuses = ["Delivered", "Placed", "Shipped", "Cancelled"]
const valid_shipping_options = ["Flat rate", "Ground", "Expedited"]
const prices = {"Angry stickman": 5.99, "Wobbly stickman": 7.50, "Pleased stickman": 6.25}
const max_name_length = 64
const max_address_length = 1024


//TODO: delete and refactor this
//function to update the shipping info of an order with the input params
function update_shipping_info(params) {
    const order_id_str = params.id || "";

    //check if ID is a valid number
    const order_id = parseInt(order_id_str, 10);
    if (isNaN(order_id)) {
        return false;
    }

    //find the order by its ID
    const order = orders.find(o => o.id === order_id);
    if (!order) {
        return false; //order not found
    }

    //check status after finding the order
    if (order.status === "Placed") {
        order.shipping = params.shipping || order.shipping; //update shipping status
        if (params.address) { //update address if provided
            order.address = params.address.replace(/\n/g, "<br>");}
        if (params.notes) { //update notes if provided
            order.notes = params.notes.replace(/\n/g, "<br>");}
        return true;
    } else {
        return false; //found the order but can't edit it
    }
}

async function processApiOrder(data) {
    let errors = [];
    const requiredFields = ["product", "from_name", "quantity", "address", "shipping"];

    //check for missing fields
    for (const field of requiredFields) {
        if (!data[field]) { //check if field is missing or empty
            errors.push(`Missing required field: ${field}`);
        }
    }

    //verify name/address lengths aren't too long
    const from_name = data.from_name || "";
    const address = data.address || "";
    const product = data.product;
    const quantity = parseInt(data.quantity, 10);
    const shipping = data.shipping;

    if (from_name.length >= max_name_length) {
        errors.push(`Sender name must be less than ${max_name_length} characters`)
    }
    if (address.length >= max_address_length) {
        errors.push(`Address must be less than ${max_address_length} characters`)
    }

    if (isNaN(quantity) || quantity <= 0) {
        errors.push("Quantity must be a positive integer")
    }
    if (!prices[product]) {
        errors.push("Unrecognized product")
    }
    if (!valid_shipping_options.includes(shipping)) {
        errors.push("Invalid shipping method")
    }

    //return errors if any were found
    if (errors.length > 0) {
        return {success: false, errors: errors}
    }

    //create the order
    const order_date = new Date().toISOString();
    const new_order = {
        status: "Placed",
        cost: prices[product] * quantity,
        from_name: from_name,
        address: address.replace(/\n/g, "<br>"),
        product: `${quantity}x ${product.charAt(0).toUpperCase() + product.slice(1)}`,
        notes: data.notes || "N/A",
        order_date: order_date,
        shipping: shipping
    };
    let result = await db.addOrder(new_order);
    if (result === -1) {
        console.log("Failure to create order");
        return {success: false, id: -1}; //return success and the new ID
    } else{
        console.log(`Added new order with ID: ${result}`);
        return {success: true, id: result}; //return success and the new ID
    }
}

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

//function to take a stored date object and make it human readable
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

//GET methods

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

    await db.updateOrderStatuses(); //update all statuses

    const order = await db.getOrder(req.params.id); //get order from db

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
    // Call updateOrderStatuses to ensure data is fresh
    await db.updateOrderStatuses();

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
    if (await db.updateOrder(req.body)) {
        res.status(200).render('order_updated', {
            order_id: req.body.id,
            change_method: "Updated"
        });
    } else {
        res.status(400).render('order_fail'); //failure
    }
});

app.post("/ship_order", async (req, res) => {
    const id = parseInt(req.body.id);

    if (isNaN(id)) {
        return res.status(400).send("Invalid ID");
    }

    //call db
    const result = await db.shipOrder(id);
    if (result === 200) {
        res.status(200).send("Success");
    } else if (result === 404) {
        res.status(404).send("Order not found");
    } else if (result === 400) {
        res.status(400).send("Order cannot be shipped");
    } else {
        res.status(500).send("Server Error");
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

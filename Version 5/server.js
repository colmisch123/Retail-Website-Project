const express = require('express')
const app = express()
const port = 4131
const cookieParser = require('cookie-parser')

app.set("views", "resources/templates")
app.set("view engine", "pug")
app.use('/css', express.static('resources/css'))
app.use('/js', express.static('resources/js'))
app.use('/images', express.static('resources/images'))
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(cookieParser())

//TODO: Complete the extra credit

let orders = [
    {
        id: 0,
        status: "Delivered",
        cost: 19.79,
        from: "The Smashing Pumpkins",
        address: "Billy Corgan<br>123 Easy Street<br>Saint Paul, MN 55123",
        product: "Angry stickman",
        notes: "Gift wrapped",
        orderDate: new Date("2025-10-01T10:30:00.000Z"),
        shipping: "Ground"
    },
    {
        id: 1,
        status: "Shipped",
        cost: 42.50,
        from: "Radiohead",
        address: "Thom Yorke<br>456 Crescent Ave<br>Brooklyn, NY 11215",
        product: "Wobbly stickman",
        notes: "N/A",
        orderDate: new Date("2025-10-03T14:15:00.000Z"),
        shipping: "Expedited"
    },
    {
        id: 2,
        status: "Delivered",
        cost: 27.95,
        from: "Nirvana",
        address: "Kurt Cobain<br>789 River Rd<br>Seattle, WA 98109",
        product: "2x Pleased stickman",
        notes: "Wait he's alive?",
        orderDate: new Date("2025-10-10T09:00:00.000Z"),
        shipping: "Expedited"
    },
    {
        id: 3,
        status: "Delivered",
        cost: 8.99,
        from: "Fleetwood Mac",
        address: "Stevie Nicks<br>1550 Golden Rd<br>Los Angeles, CA 90026",
        product: "Angry stickman",
        notes: "Fast shipping please",
        orderDate: new Date("2025-09-15T11:45:00.000Z"),
        shipping: "Ground"
    },
    {
        id: 4,
        status: "Shipped",
        cost: 65.40,
        from: "Red Hot Chili Peppers",
        address: "Anthony Kiedis<br>900 Venice Blvd<br>Venice, CA 90291",
        product: "4x Wobbly stickman",
        notes: "N/A",
        orderDate: new Date("2025-10-09T16:20:00.000Z"),
        shipping: "Flat rate"
    },
    {
        id: 5,
        status: "Cancelled",
        cost: 12.35,
        from: "The Black Keys",
        address: "Dan Auerbach<br>4131 Rubber Factory Ln<br>Akron, OH 44304",
        product: "2x Angry stickman",
        notes: "Leave with neighbor if not home.",
        orderDate: new Date("2025-10-05T18:00:00.000Z"),
        shipping: "Ground"
    },
    {
        id: 6,
        status: "Shipped",
        cost: 33.00,
        from: "The White Stripes",
        address: "Jack White<br>777 Cass Corridor St<br>Detroit, MI 48201",
        product: "Pleased stickman",
        notes: "Birthday gift for sister.",
        orderDate: new Date("2025-09-20T12:10:00.000Z"),
        shipping: "Ground"
    },
    {
        id: 7,
        status: "Cancelled",
        cost: 14.55,
        from: "Tame Impala",
        address: "Kevin Parker<br>200 Lonerism Way<br>Perth, WA 6000, Australia",
        product: "3x Pleased stickman",
        notes: "N/A",
        orderDate: new Date("2025-10-20T12:10:00.000Z"),
        shipping: "Flat rate"
    }
];

//constant values I either check against or for my personal reference
const shipping_statuses = ["Delivered", "Placed", "Shipped", "Cancelled"]
const valid_shipping_options = ["Flat rate", "Ground", "Expedited"]
const prices = {"Angry stickman": 5.99, "Wobbly stickman": 7.50, "Pleased stickman": 6.25}
const max_name_length = 64
const max_address_length = 1024



//Helper functions

//function to mark an order as shipped once the countdown ends
function ship_order(orderID) {
    orderID = parseInt(orderID)
    if (typeof (orderID) !== "number"){
        return false;
    }
    for (let order of orders){
        if (orderID === order.id){
            if (order.status === "Placed") {
                order.status = "Shipped"
                return true //order has been updated from "placed" to "shipped" status successfully
            } else {
                return false //order found but cannot be shipped because of status
            }
        }
    }
    return false //order not found
}

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

function processApiOrder(data) {
    let errors = [];
    const requiredFields = ["product", "from_name", "quantity", "address", "shipping"];

    //check for missing fields
    for (const field of requiredFields) {
        if (!data[field]) { //check if field is missing or empty
            errors.push(`Missing required field: ${field}`);
        }
    }
    if (errors.length > 0) {
        return { success: false, errors: errors }; //stop if fields are missing
    }

    //verify name/address lengths aren't too long
    const from_name = data.from_name || "";
    const address = data.address || "";
    if (from_name.length >= max_name_length) {
        errors.push(`Sender name must be less than ${max_name_length} characters`)}
    if (address.length >= max_address_length) {
        errors.push(`Address must be less than ${max_address_length} characters`)}

    //other validation
    const product = data.product;
    const quantity = parseInt(data.quantity, 10);
    const shipping = data.shipping;

    if (isNaN(quantity) || quantity <= 0) {
        errors.append("Quantity must be a positive integer")}
    if (!prices[product]) {
        errors.push("Unrecognized product")}
    if (!valid_shipping_options.includes(shipping)) {
        errors.push("Invalid shipping method")}

    //return errors if any were found
    if (errors.length > 0) {
        return {success: false, errors: errors}}

    //create the order
    const new_id = orders.length;
    const order_date = new Date().toISOString();
    const new_order = {
        id: new_id,
        status: "Placed",
        cost: prices[product] * quantity,
        from: from_name,
        address: address.replace(/\n/g, "<br>"),
        product: `${quantity}x ${product.charAt(0).toUpperCase() + product.slice(1)}`,
        notes: data.notes || "N/A", //get notes if provided
        orderDate: order_date,
        shipping: shipping
    };
    orders.push(new_order);
    console.log(`API added new order with ID: ${new_id}`);
    return { success: true, id: new_id }; //return success and the new ID
}

function cancel_order_api(order_id_str) {
    //ensure digit is a number, referenced https://stackoverflow.com/questions/9011524/regex-to-check-whether-a-string-contains-only-numbers
    if (!/^\d+$/.test(order_id_str)) {
        return "not_found"; //invalid ID format
    }

    const order_id = parseInt(order_id_str, 10);
    const order = orders.find(o => o.id === order_id);

    if (order) {
        //order found, check if it can be cancelled
        if (order.status === "Placed") {
            order.status = "Cancelled";
            console.log(`API cancelled order ID: ${order_id}`);
            return "success";
        } else {
            //order found, but status isn't "placed" which is the only state it should be editable from
            console.log(`API: Order ${order_id} found but cannot be cancelled (status: ${order.status})`);
            return "not_cancellable";
        }
    }

    return "not_found"; //no order with input ID was found
}

//typeset money, referenced https://expressjs.com/en/api.html to create a global function
app.locals.typeset_dollars = function(number) {
    if (typeof number !== 'number') {
        console.log("invalid input given to typeset_dollars: ", number);
        return 'Error: NaN';
    }
    return `$${number.toFixed(2)}`;
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
app.get('/tracking/:id', (req, res) => {
    const order = orders.find(o => o.id == req.params.id);
    //if no order is found render 404
    if (!order) {
        res.status(404).render('404.pug');
        return;
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
    const formattedOrderDate = new Date(order.orderDate).toLocaleString('en-US');

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

app.get(['/orders', '/admin/orders'], (req, res) => {
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
            const found_order = orders.find(o => o.id === order_id);
            if (found_order) {
                //order was found. Check if it also matches the other filters
                const status_match = !status_raw || found_order.status.toLowerCase() === status_raw.toLowerCase();
                const sender_match = !sender_raw || (found_order.from && found_order.from.toLowerCase().includes(sender_raw.toLowerCase()));
                if (status_match && sender_match) {
                    //if one order is found by ID i redirect to the tracking page for it. Referenced https://www.geeksforgeeks.org/web-tech/express-js-res-redirect-function/
                    return res.redirect(`/tracking/${order_id}`);
                }
                else {
                    error_message = "No order found with that ID matching all filters."}
            }
            else {error_message = "No order found with that ID.";}
        }
    }
    //general search without order number, but includes filters
    else {
        //referenced https://www.w3schools.com/jsref/jsref_filter.asp
        filtered_orders = orders.filter(order => {
            const status_match = !status_raw || order.status.toLowerCase() === status_raw.toLowerCase();
            const sender_match = !sender_raw || (order.from && order.from.toLowerCase().includes(sender_raw.toLowerCase()));
            return status_match && sender_match;
        });
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
app.post("/update_shipping", (req, res) => {
    if (update_shipping_info(req.body)) {
        res.status(200).render('order_updated', {
            order_id: req.body.id,
            change_method: "Updated"
        });
    } else {
        res.status(400).render('order_fail'); //failure
    }
});

app.post("/ship_order", (req, res) => {
    console.log("ATTEMPTING TO SHIP ORDER: " + req.body.id)
    if (ship_order(req.body.id)) {
            res.status(200).end()
        }
    else {
        res.status(400).end() //failure
    }
});

app.post("/api/order", (req, res) => {

    //check Content-Type header
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('application/json')) {
        res.status(400).json({
            status: "error",
            errors: ["Request header 'Content-Type' must be 'application/json'"]
        });
        return;
    }

    const result = processApiOrder(req.body);

    //success
    if (result.success) {
        const order_id = result.id;
        const customer_name = req.body.from_name || "";
        const remember = req.body.remember_me || false;

        //cookie logic
        if (remember && customer_name) {
            //sanitize name
            const sanitized_name = customer_name.replace(/[^a-zA-Z0-9]/g, '');
            if (sanitized_name) {
                //set the cookie using res.cookie()
                res.cookie('customer_name', sanitized_name, {
                    path: '/',
                    maxAge: 31536000000 //1 year in milliseconds
                });
            }
        } else {
            //check if cookie exists to delete it
            if (req.cookies.customer_name) {
                //delete cookie (referenced https://www.geeksforgeeks.org/web-tech/express-js-res-clearcookie-function/)
                res.clearCookie('customer_name', { path: '/' });
            }
        }

        //send 201 Created response
        res.status(201).json({
            status: "success",
            order_id: order_id
        });

    //failure
    } else {
        const errors = result.errors;

        //check for length errors to return 413
        const lengthErrors = errors.filter(err => err.includes("characters"));
        if (lengthErrors.length > 0) {
            //return 413 Content Too Large
            res.status(413).json({
                status: "error",
                errors: lengthErrors
            });
        } else {
            //return 400 Bad Request for other validation errors
            const otherErrors = errors.filter(err => !err.includes("characters"));
            res.status(400).json({
                status: "error",
                errors: otherErrors
            });
        }
    }
});



//DELETE requests

app.delete("/api/cancel_order", (req, res) => {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('application/json')) {
        res.status(400).send("Content-Type must be application/json");
        return;
    }

    //convert to string in case the JSON sent it as a number
    const order_id_str = req.body.order_id ? String(req.body.order_id) : "";

    //validate inputted order id
    if (!order_id_str || !/^\d+$/.test(order_id_str)) {
        res.status(400).send("Invalid or missing order_id");
        return;
    }

    //verification steps passed, now we actually try to cancel the order
    const result = cancel_order_api(order_id_str);

    if (result === "success") {
        res.status(204).end(); //referenced https://api.jquery.com/end/
    } else if (result === "not_found") {
        res.status(404).send("Order not found");
    } else if (result === "not_cancellable") {
        res.status(400).send("Order cannot be cancelled");
    }
});

//404 page is the default if nothing else works
app.use((req, res) => {
    res.status(404).render('404.pug');
});

app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}/`)
})

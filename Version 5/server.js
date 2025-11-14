const express = require('express')
const app = express()
const port = 4131

app.set("views", "static/templates")
app.set("view engine", "pug")
app.use('/static', express.static('static'))

//TODO: Fix the customer_placeholder_name thing with order.pug

let orders = [
    {
        id: 0,
        status: "Delivered",
        cost: 19.79,
        from: "The Smashing Pumpkins",
        address: "Billy Corgan<br>123 Easy Street<br>Saint Paul, MN 55123",
        product: "Angry stickman",
        notes: "Gift wrapped",
        orderDate: "2025-10-01T10:30:00.000Z",
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
        orderDate: "2025-10-03T14:15:00.000Z",
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
        orderDate: "2025-10-10T09:00:00.000Z",
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
        orderDate: "2025-09-15T11:45:00.000Z",
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
        orderDate: "2025-10-09T16:20:00.000Z",
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
        orderDate: "2025-10-05T18:00:00.000Z",
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
        orderDate: "2025-09-20T12:10:00.000Z",
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
        orderDate: "2all-10-11T08:05:00.000Z",
        shipping: "Flat rate"
    }
]

//constant values I either check against or for my personal reference
shipping_statuses = ["Delivered", "Placed", "Shipped", "Cancelled"]
valid_shipping_options = ["Flat rate", "Ground", "Expedited"]
prices = {"Angry stickman": 5.99, "Wobbly stickman": 7.50, "Pleased stickman": 6.25}
max_name_length = 64
max_address_length = 1024


app.get(["/", "/about"], (req, res) => {
    res.status(200)
    res.render('about.pug')
})

app.get("/order", (req, res) => {
    res.status(404)
    res.render('order.pug')
})

app.get("/order_fail", (req, res) => {
    res.status(200)
    res.render('order.pug')
})

app.get("/404", (req, res) => {
    res.status(404)
    res.render('404.pug')
})


app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}/`)
})

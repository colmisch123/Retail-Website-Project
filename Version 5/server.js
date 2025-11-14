const express = require('express')
const app = express()
const port = 4131

//TODO: Fix the customer_placeholder_name thing with order.pug

app.set("views", "static/templates")
app.set("view engine", "pug")


app.use('/static', express.static('static'))

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

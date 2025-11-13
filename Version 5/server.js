const express = require('express')
const app = express()

app.set("views", "templates")
app.set("view engine", "pug")


app.use("/html", express.static("/static"))

app.get("/404", (req, res) => {
    res.status(404)
    res.render('404.pug')
})


app.listen(4131, () => {
    console.log('Listening on port ' + 4131)
})

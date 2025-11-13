const express = require('express')
const app = express()

app.set("views", "templates")
app.set("view engine", "pug")


//app.use("/html", express.static("some_dumb_files"))
app.use("/api", express.json())


app.listen(4131, () => {
    console.log('Listening on port ' + 4131)
})

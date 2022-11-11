const express = require('express');
const path = require("path");

const app = express();
const PORT = process.env.PORT || "3000";

app.use(express.static(path.join(__dirname, "public")));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.get('/', require('./routes/index'));
app.get('/login', require('./routes/login'));

app.listen(PORT, console.log('Server is running on port ' + PORT));
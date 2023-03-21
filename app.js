const express = require("express");
const ejs = require("ejs");

const app = express();
const PORT = 3000;

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

app.listen(PORT, () => {
	console.log(`Server started at port ${PORT}`);
});

require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const md5 = require("md5");
// const encrypt = require("mongoose-encryption");

const app = express();
const PORT = 3000;

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

main().catch((err) => console.log(err));

async function main() {
	const url = "mongodb://127.0.0.1:27017/userDB";
	await mongoose.connect(url, { useNewUrlParser: true });
}

const userSchema = new mongoose.Schema({
	email: String,
	password: String,
});

// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });

const User = new mongoose.model("User", userSchema);

app.get("/", (req, res) => {
	res.render("home");
});

app.get("/login", (req, res) => {
	res.render("login", { errMsg: "", username: "", password: "" });
});

app.get("/register", (req, res) => {
	res.render("register");
});

app.post("/register", (req, res) => {
	const newUser = new User({
		email: req.body.username,
		password: md5(req.body.password),
	});
	newUser
		.save()
		.then(() => res.render("secrets"))
		.catch((err) => console.log(err));
});

app.post("/login", (req, res) => {
	const username = req.body.username;
	const password = md5(req.body.password);
	User.findOne({ email: username })
		.then((foundUser) => {
			if (foundUser) {
				if (foundUser.password === password) {
					res.render("secrets");
				} else {
					res.render("login", {
						errMsg: "Invalid Credentials",
						username: username,
						password: password,
					});
				}
			} else {
				res.render("login", {
					errMsg: "Invalid Credentials",
					username: username,
					password: password,
				});
			}
		})
		.catch((err) => console.log(err));
});

app.listen(PORT, () => {
	console.log(`Server started at port ${PORT}`);
});

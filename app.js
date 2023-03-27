require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const md5 = require("md5");
// const encrypt = require("mongoose-encryption");
// const bcrypt = require("bcrypt"); // bcrypt is a hashing algorithm
const session = require("express-session"); // session is used to store cookies
const passport = require("passport"); // passport is used to authenticate users
const passportLocalMongoose = require("passport-local-mongoose"); // passport-local-mongoose is used to authenticate users with username and password
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");

const saltRounds = 10;
const app = express();
const PORT = 3000;

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

app.use(
	session({
		secret: "Our little secret.",
		resave: false,
		saveUninitialized: true,
	})
);

app.use(passport.initialize());
app.use(passport.session());

main().catch((err) => console.log(err));

async function main() {
	const url = "mongodb://127.0.0.1:27017/userDB";
	await mongoose.connect(url, { useNewUrlParser: true });
}

const userSchema = new mongoose.Schema({
	email: String,
	password: String,
	googleId: String,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
passport.serializeUser(function (user, done) {
	done(null, user.id);
});

passport.deserializeUser(function (id, done) {
	User.findById(id).then((user) => {
		done(null, user);
	});
});

passport.use(
	new GoogleStrategy(
		{
			clientID: process.env.CLIENT_ID,
			clientSecret: process.env.CLIENT_SECRET,
			callbackURL: "http://localhost:3000/auth/google/secrets",
			userProfileUrl: "https://www.googleapis.com/oauth2/v3/userinfo",
		},
		function (accessToken, refreshToken, profile, cb) {
			User.findOne({ googleId: profile.id }).then((user) => {
				if (user) {
					return cb(null, user);
				} else {
					return User.create({
						googleId: profile.id,
						username: profile.displayName,
					}).then((user) => {
						return cb(null, user);
					});
				}
			});
		}
	)
);

app.get("/", (req, res) => {
	res.render("home");
});

app.get(
	"/auth/google",
	passport.authenticate("google", { scope: ["profile"] })
);

app.get(
	"/auth/google/secrets",
	passport.authenticate("google", { failureRedirect: "/login" }),
	function (req, res) {
		// Successful authentication, redirect home.
		res.redirect("/secrets");
	}
);

app.get("/login", (req, res) => {
	res.render("login");
});

app.get("/register", (req, res) => {
	res.render("register");
});

app.get("/secrets", (req, res) => {
	if (req.isAuthenticated()) {
		res.render("secrets");
	} else {
		res.redirect("/login");
	}
});

app.get("/logout", (req, res) => {
	req.logout((err) => {
		if (err) {
			console.log(err);
		}
		res.redirect("/");
	});
});

app.post("/register", (req, res) => {
	User.register(
		{ username: req.body.username },
		req.body.password,
		(err, user) => {
			if (err) {
				console.log(err);
				res.redirect("/register");
			} else {
				passport.authenticate("local")(req, res, () => {
					res.redirect("/secrets");
				});
			}
		}
	);
});

app.post("/login", (req, res) => {
	const user = new User({
		username: req.body.username,
		password: req.body.password,
	});

	req.login(user, (err) => {
		if (err) {
			console.log(err);
		} else {
			passport.authenticate("local")(req, res, () => {
				res.redirect("/secrets");
			});
		}
	});
});

app.listen(PORT, () => {
	console.log(`Server started at port ${PORT}`);
});

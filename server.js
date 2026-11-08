const express = require("express");
const path = require("path");
const multer = require("multer");
const session = require("express-session");
const fs = require("fs");

const app = express();
const PORT = 3000;

// =========================
// BASIC MIDDLEWARE
// =========================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =========================
// SESSION
// =========================

app.use(
    session({
        secret: "new-portal-secret-key",
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true
        }
    })
);

// =========================
// UPLOAD FOLDER
// =========================

if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
}

// =========================
// IMAGE UPLOAD
// =========================

const storage = multer.diskStorage({

    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },

    filename: function (req, file, cb) {

        const uniqueName =
            Date.now() + "-" + file.originalname;

        cb(null, uniqueName);
    }

});

const upload = multer({
    storage: storage
});

// =========================
// SAMPLE NEWS
// =========================

let news = [

    {
        id: 1,
        title: "Welcome to New Portal",
        category: "Business",
        description:
            "Welcome to our professional news portal.",
        image: ""
    },

    {
        id: 2,
        title: "New Technology Trends",
        category: "Technology",
        description:
            "Latest technology trends around the world.",
        image: ""
    },

    {
        id: 3,
        title: "Education News Update",
        category: "Education",
        description:
            "Latest education news and important updates.",
        image: ""
    }
];

// =========================
// LOGIN PAGE
// =========================

app.get("/", (req, res) => {

    if (req.session.loggedIn) {

        return res.redirect("/index.html");

    }

    res.sendFile(
        path.join(__dirname, "public", "admin.html")
    );

});

// =========================
// LOGIN
// =========================

app.post("/api/login", (req, res) => {

    const { username, password } = req.body;

    if (
        username === "admin" &&
        password === "admin123"
    ) {

        req.session.loggedIn = true;
        req.session.username = username;

        return res.json({
            success: true,
            message: "Login successful"
        });

    }

    res.status(401).json({
        success: false,
        message: "Invalid username or password"
    });

});

// =========================
// AUTHENTICATION MIDDLEWARE
// =========================

function requireLogin(req, res, next) {

    if (req.session.loggedIn) {

        next();

    } else {

        res.redirect("/");

    }

}

// =========================
// PROTECT HOME PAGE
// =========================

app.get(
    "/index.html",
    requireLogin,
    (req, res) => {

        res.sendFile(
            path.join(__dirname, "public", "index.html")
        );

    }
);

// =========================
// LOGOUT
// =========================

app.get("/api/logout", (req, res) => {

    req.session.destroy(() => {

        res.redirect("/");

    });

});

// =========================
// NEWS API
// =========================

app.get(
    "/api/news",
    requireLogin,
    (req, res) => {

        res.json(news);

    }
);

// =========================
// ADD NEWS
// =========================

app.post(
    "/api/news",
    requireLogin,
    upload.single("image"),
    (req, res) => {

        const {
            title,
            category,
            description
        } = req.body;

        if (
            !title ||
            !category ||
            !description
        ) {

            return res.status(400).json({
                message: "Please fill all fields"
            });

        }

        const newNews = {

            id: Date.now(),

            title: title,

            category: category,

            description: description,

            image: req.file
                ? `/uploads/${req.file.filename}`
                : ""

        };

        news.push(newNews);

        res.status(201).json(newNews);

    }
);

// =========================
// DELETE NEWS
// =========================

app.delete(
    "/api/news/:id",
    requireLogin,
    (req, res) => {

        const id =
            Number(req.params.id);

        news = news.filter(
            item => item.id !== id
        );

        res.json({
            message:
                "News deleted successfully"
        });

    }
);

// =========================
// STATIC FILES
// =========================

// Upload images
app.use(
    "/uploads",
    express.static(
        path.join(__dirname, "uploads")
    )
);

// CSS, JS and admin.html
app.use(
    express.static(
        path.join(__dirname, "public"),
        {
            index: false
        }
    )
);

// =========================
// START SERVER
// =========================

app.listen(PORT, () => {

    console.log(
        `New Portal running at http://localhost:${PORT}`
    );

});
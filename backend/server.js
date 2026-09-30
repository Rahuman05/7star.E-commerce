const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const crypto = require("crypto");

// =========================
// ENV
// =========================

dotenv.config({
    path: path.join(__dirname, ".env")
});

// =========================
// APP SETUP
// =========================

const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors());

app.use(express.json());

// =========================
// IMAGE UPLOAD SETUP
// =========================

const imgFolder =
    path.join(__dirname, "img");

if (!fs.existsSync(imgFolder)) {
    fs.mkdirSync(imgFolder, {
        recursive: true
    });
}

app.use(
    "/img",
    express.static(imgFolder)
);

const storage =
    multer.diskStorage({

        destination: function (req, file, cb) {
            cb(null, imgFolder);
        },

        filename: function (req, file, cb) {

            const ext =
                path.extname(
                    file.originalname
                );

            const fileName =
                Date.now() +
                "-" +
                Math.round(
                    Math.random() * 1E9
                ) +
                ext;

            cb(null, fileName);
        }
    });

const fileFilter =
    function (req, file, cb) {

        const allowedTypes = [

            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
            "image/gif",
            "image/avif"

        ];

        if (
            allowedTypes.includes(
                file.mimetype
            )
        ) {

            cb(null, true);

        } else {

            cb(
                new Error(
                    "Only image files are allowed"
                )
            );
        }
    };

const upload =
    multer({

        storage: storage,

        fileFilter: fileFilter,

        limits: {
            fileSize:
                5 * 1024 * 1024
        }
    });

// =========================
// MONGODB
// =========================

const mongoURI =
    process.env.MONGO_URI?.trim();

console.log(
    "MongoDB URI loaded:",
    mongoURI ? "true" : "false"
);

if (!mongoURI) {

    console.log(
        "❌ MONGO_URI is missing in .env"
    );

    process.exit(1);
}

// MongoDB connection options

const mongoOptions = {

    serverSelectionTimeoutMS: 10000,

    connectTimeoutMS: 10000,

    socketTimeoutMS: 45000,

    family: 4
};

// MongoDB connection events

mongoose.connection.on(
    "connected",
    () => {

        console.log(
            "✅ MongoDB Connected Successfully"
        );
    }
);

mongoose.connection.on(
    "error",
    (error) => {

        console.log(
            "❌ MongoDB Connection Error:",
            error.message
        );
    }
);

mongoose.connection.on(
    "disconnected",
    () => {

        console.log(
            "⚠️ MongoDB Disconnected"
        );
    }
);

mongoose.connection.on(
    "reconnected",
    () => {

        console.log(
            "🔄 MongoDB Reconnected Successfully"
        );
    }
);

// Connect MongoDB

mongoose
    .connect(
        mongoURI,
        mongoOptions
    )
    .catch(
        (error) => {

            console.log(
                "❌ MongoDB Initial Connection Failed:"
            );

            console.log(
                error.message
            );
        }
    );

// =========================
// ADMIN SESSION
// =========================

let adminToken = null;

// =========================
// ADMIN LOGIN
// =========================

app.post(
    "/api/admin/login",
    (req, res) => {

        try {

            const {
                username,
                password
            } = req.body;

            const adminUsername =
                process.env.ADMIN_USERNAME;

            const adminPassword =
                process.env.ADMIN_PASSWORD;

            if (
                !adminUsername ||
                !adminPassword
            ) {

                return res.status(500).json({

                    success: false,

                    message:
                        "Admin credentials are not configured in .env"

                });
            }

            if (
                username === adminUsername &&
                password === adminPassword
            ) {

                adminToken =
                    crypto
                        .randomBytes(32)
                        .toString("hex");

                console.log(
                    "✅ Admin logged in"
                );

                return res.json({

                    success: true,

                    message:
                        "Admin login successful",

                    token:
                        adminToken
                });
            }

            console.log(
                "❌ Invalid admin login"
            );

            return res.status(401).json({

                success: false,

                message:
                    "Invalid username or password"

            });

        }
        catch (error) {

            console.log(
                "❌ Admin Login Error:",
                error.message
            );

            return res.status(500).json({

                success: false,

                message:
                    "Admin login failed"

            });
        }
    }
);

// =========================
// ADMIN AUTHENTICATION
// =========================

function adminOnly(
    req,
    res,
    next
) {

    const headerToken =
        req.headers["x-admin-token"];

    const authHeader =
        req.headers["authorization"];

    let bearerToken = null;

    if (
        authHeader &&
        authHeader.startsWith("Bearer ")
    ) {

        bearerToken =
            authHeader
                .substring(7)
                .trim();
    }

    const token =
        headerToken || bearerToken;

    console.log(
        "🔐 Admin auth check:",
        token
            ? "Token received"
            : "No token"
    );

    if (
        !token ||
        !adminToken ||
        token !== adminToken
    ) {

        console.log(
            "❌ Admin authentication failed"
        );

        return res.status(401).json({

            success: false,

            message:
                "Admin access required"

        });
    }

    console.log(
        "✅ Admin authentication successful"
    );

    next();
}

// =========================
// ADMIN LOGOUT
// =========================

app.post(
    "/api/admin/logout",
    adminOnly,
    (req, res) => {

        adminToken = null;

        console.log(
            "✅ Admin logged out"
        );

        res.json({

            success: true,

            message:
                "Admin logged out successfully"

        });
    }
);

// =========================
// CHECK ADMIN
// =========================

app.get(
    "/api/admin/check",
    adminOnly,
    (req, res) => {

        res.json({

            success: true,

            message:
                "Admin authenticated"

        });
    }
);

// =========================
// ORDER MODEL
// =========================

const orderSchema =
    new mongoose.Schema({

        fullName: {
            type: String,
            required: true
        },

        phone: {
            type: String,
            required: true
        },

        size: {
            type: String,
            required: true
        },

        quantity: {
            type: Number,
            required: true
        },

        address: {
            type: String,
            required: true
        },

        paymentMethod: {
            type: String,
            required: true
        },

        product: {
            type: String,
            default:
                "Premium Pants"
        },

        price: {
            type: Number,
            default: 1499
        },

        status: {

            type: String,

            enum: [
                "Pending",
                "Confirmed",
                "Shipped",
                "Delivered",
                "Cancelled"
            ],

            default:
                "Pending"
        },

        createdAt: {

            type: Date,

            default:
                Date.now
        }
    });

const Order =
    mongoose.model(
        "Order",
        orderSchema
    );

// =========================
// PRODUCT MODEL
// =========================

const productSchema =
    new mongoose.Schema({

        name: {
            type: String,
            required: true
        },

        category: {
            type: String,
            required: true
        },

        price: {
            type: Number,
            required: true
        },

        image: {
            type: String,
            required: true
        },

        description: {
            type: String,
            default: ""
        },

        sizes: {

            type: [String],

            default: [
                "S",
                "M",
                "L",
                "XL"
            ]
        },

        stock: {

            type: Number,

            default: 0
        },

        createdAt: {

            type: Date,

            default:
                Date.now
        }
    });

const Product =
    mongoose.model(
        "Product",
        productSchema
    );

// =========================
// NEWSLETTER SUBSCRIBER MODEL
// =========================

const subscriberSchema =
    new mongoose.Schema({

        email: {

            type: String,

            required: true,

            unique: true,

            lowercase: true,

            trim: true
        },

        createdAt: {

            type: Date,

            default:
                Date.now
        }
    });

const Subscriber =
    mongoose.model(
        "Subscriber",
        subscriberSchema
    );

// =========================
// VISITOR MODEL
// =========================

const visitorSchema =
    new mongoose.Schema({

        visitorId: {

            type: String,

            required: true
        },

        page: {

            type: String,

            default: "/"
        },

        visitedAt: {

            type: Date,

            default:
                Date.now
        }
    });

const Visitor =
    mongoose.model(
        "Visitor",
        visitorSchema
    );

// =========================
// VISITOR TRACKING API
// =========================

app.post(
    "/api/visitor",
    async (req, res) => {

        try {

            const {
                visitorId,
                page
            } = req.body;

            if (!visitorId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Visitor ID is required"

                });
            }

            const visitor =
                new Visitor({

                    visitorId:
                        visitorId,

                    page:
                        page || "/"

                });

            await visitor.save();

            console.log(
                "👤 Visitor Tracked:",
                visitorId,
                "| Page:",
                page || "/"
            );

            res.status(201).json({

                success: true,

                message:
                    "Visitor tracked"

            });

        }
        catch (error) {

            console.log(
                "❌ Visitor Tracking Error:",
                error.message
            );

            res.status(500).json({

                success: false,

                message:
                    "Unable to track visitor"

            });
        }
    }
);

// =========================
// VISITOR ANALYTICS API
// =========================

app.get(
    "/api/visitor-stats",
    adminOnly,
    async (req, res) => {

        try {

            // TOTAL VISITS

            const totalVisits =
                await Visitor.countDocuments();

            // TOTAL UNIQUE VISITORS

            const uniqueVisitors =
                await Visitor.distinct(
                    "visitorId"
                );

            // TODAY START

            const startOfToday =
                new Date();

            startOfToday.setHours(
                0,
                0,
                0,
                0
            );

            // TOMORROW START

            const startOfTomorrow =
                new Date(
                    startOfToday
                );

            startOfTomorrow.setDate(
                startOfTomorrow.getDate() + 1
            );

            // TODAY VISITS

            const todayVisits =
                await Visitor.countDocuments({

                    visitedAt: {

                        $gte:
                            startOfToday,

                        $lt:
                            startOfTomorrow
                    }

                });

            // TODAY UNIQUE VISITORS

            const todayUniqueVisitors =
                await Visitor.distinct(

                    "visitorId",

                    {

                        visitedAt: {

                            $gte:
                                startOfToday,

                            $lt:
                                startOfTomorrow
                        }

                    }
                );

            // THIS MONTH START

            const startOfMonth =
                new Date();

            startOfMonth.setDate(1);

            startOfMonth.setHours(
                0,
                0,
                0,
                0
            );

            // THIS MONTH VISITS

            const monthVisits =
                await Visitor.countDocuments({

                    visitedAt: {

                        $gte:
                            startOfMonth
                    }

                });

            // THIS MONTH UNIQUE VISITORS

            const monthUniqueVisitors =
                await Visitor.distinct(

                    "visitorId",

                    {

                        visitedAt: {

                            $gte:
                                startOfMonth
                        }

                    }
                );

            // SEND DATA

            res.json({

                success: true,

                totalVisits:
                    totalVisits,

                uniqueVisitors:
                    uniqueVisitors.length,

                todayVisits:
                    todayVisits,

                todayVisitors:
                    todayUniqueVisitors.length,

                monthVisits:
                    monthVisits,

                monthVisitors:
                    monthUniqueVisitors.length

            });

        }
        catch (error) {

            console.log(
                "❌ Visitor Stats Error:",
                error.message
            );

            res.status(500).json({

                success: false,

                message:
                    "Unable to get visitor statistics"

            });
        }
    }
);

// =========================
// MOST VISITED PAGES API
// =========================

app.get(
    "/api/visitor-pages",
    adminOnly,
    async (req, res) => {

        try {

            const pages =
                await Visitor.aggregate([

                    {

                        $group: {

                            _id:
                                "$page",

                            visits: {

                                $sum: 1
                            }
                        }
                    },

                    {

                        $sort: {

                            visits: -1
                        }
                    },

                    {

                        $limit: 10
                    }

                ]);

            res.json({

                success: true,

                pages:
                    pages

            });

        }
        catch (error) {

            console.log(
                "❌ Visitor Pages Error:",
                error.message
            );

            res.status(500).json({

                success: false,

                message:
                    "Unable to get visitor page statistics"

            });
        }
    }
);

// =========================
// 7 DAYS VISITOR ANALYTICS API
// =========================

app.get(
    "/api/visitor-7days",
    adminOnly,
    async (req, res) => {

        try {

            // TODAY START

            const today =
                new Date();

            today.setHours(
                0,
                0,
                0,
                0
            );

            // LAST 7 DAYS START

            const sevenDaysAgo =
                new Date(today);

            sevenDaysAgo.setDate(
                sevenDaysAgo.getDate() - 6
            );

            // GET VISITOR DATA

            const visitorData =
                await Visitor.aggregate([

                    {

                        $match: {

                            visitedAt: {

                                $gte:
                                    sevenDaysAgo
                            }
                        }
                    },

                    {

                        $group: {

                            _id: {

                                $dateToString: {

                                    format:
                                        "%Y-%m-%d",

                                    date:
                                        "$visitedAt",

                                    timezone:
                                        "Asia/Kolkata"
                                }
                            },

                            visits: {

                                $sum: 1
                            },

                            visitors: {

                                $addToSet:
                                    "$visitorId"
                            }
                        }
                    },

                    {

                        $sort: {

                            _id: 1
                        }
                    }

                ]);

            // CREATE 7 DAY RESULT

            const result = [];

            for (
                let i = 0;
                i < 7;
                i++
            ) {

                const date =
                    new Date(
                        sevenDaysAgo
                    );

                date.setDate(
                    sevenDaysAgo.getDate() + i
                );

                const year =
                    date.getFullYear();

                const month =
                    String(
                        date.getMonth() + 1
                    ).padStart(2, "0");

                const day =
                    String(
                        date.getDate()
                    ).padStart(2, "0");

                const dateString =
                    `${year}-${month}-${day}`;

                const found =
                    visitorData.find(
                        item =>
                            item._id ===
                            dateString
                    );

                result.push({

                    date:
                        dateString,

                    visits:
                        found
                            ? found.visits
                            : 0,

                    visitors:
                        found
                            ? found.visitors.length
                            : 0
                });
            }

            // SEND 7 DAYS DATA

            res.json({

                success: true,

                data:
                    result

            });

        }
        catch (error) {

            console.log(
                "❌ 7 Days Visitor Error:",
                error.message
            );

            res.status(500).json({

                success: false,

                message:
                    "Unable to get 7 days visitor statistics"

            });
        }
    }
);

// =========================
// UPLOAD PRODUCT IMAGE
// =========================

app.post(
    "/api/upload",
    adminOnly,
    upload.single("image"),
    (req, res) => {

        try {

            if (!req.file) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please select an image"

                });
            }

            const imagePath =
                "/img/" +
                req.file.filename;

            console.log(
                "✅ Image Uploaded:",
                req.file.filename
            );

            res.json({

                success: true,

                message:
                    "Image uploaded successfully!",

                image:
                    imagePath

            });

        }
        catch (error) {

            console.log(
                "❌ Image Upload Error:",
                error.message
            );

            res.status(500).json({

                success: false,

                message:
                    "Image upload failed"

            });
        }
    }
);

// =========================
// CREATE PRODUCT
// =========================

app.post(
    "/api/products",
    adminOnly,
    async (req, res) => {

        try {

            const {

                name,
                category,
                price,
                image,
                description,
                sizes,
                stock

            } = req.body;

            if (

                !name ||
                !category ||
                price === undefined ||
                !image

            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please fill all required product fields"

                });
            }

            const newProduct =
                new Product({

                    name,
                    category,
                    price,
                    image,
                    description,
                    sizes,
                    stock

                });

            const savedProduct =
                await newProduct.save();

            console.log(
                "✅ New Product Saved:",
                savedProduct._id
            );

            res.status(201).json({

                success: true,

                message:
                    "Product added successfully!",

                product:
                    savedProduct

            });

        }
        catch (error) {

            console.log(
                "❌ Product Error:",
                error.message
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to add product"

            });
        }
    }
);

// =========================
// NEWSLETTER SUBSCRIBE
// =========================

app.post(
    "/api/subscribe",
    async (req, res) => {

        try {

            const email =
                req.body.email
                    ?.trim()
                    .toLowerCase();

            // EMAIL EMPTY CHECK

            if (!email) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please enter your email"

                });
            }

            // EMAIL FORMAT CHECK

            const emailPattern =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (
                !emailPattern.test(email)
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please enter a valid email"

                });
            }

            // CHECK DUPLICATE EMAIL

            const existingSubscriber =
                await Subscriber.findOne({

                    email:
                        email

                });

            if (existingSubscriber) {

                return res.status(409).json({

                    success: false,

                    message:
                        "This email is already subscribed"

                });
            }

            // SAVE SUBSCRIBER

            const newSubscriber =
                new Subscriber({

                    email:
                        email

                });

            const savedSubscriber =
                await newSubscriber.save();

            console.log(
                "📧 New Subscriber Saved:",
                savedSubscriber._id
            );

            return res.status(201).json({

                success: true,

                message:
                    "Subscribed successfully!"

            });

        }
        catch (error) {

            console.log(
                "❌ Subscribe Error:",
                error.message
            );

            // DUPLICATE EMAIL SAFETY CHECK

            if (
                error.code === 11000
            ) {

                return res.status(409).json({

                    success: false,

                    message:
                        "This email is already subscribed"

                });
            }

            return res.status(500).json({

                success: false,

                message:
                    "Subscription failed"

            });
        }
    }
);

// =========================
// SEARCH PRODUCTS
// =========================

app.get(
    "/api/search",
    async (req, res) => {

        try {

            const search =
                req.query.q?.trim();

            if (!search) {

                return res.json({

                    success: true,

                    products: []

                });
            }

            const searchWords =
                search
                    .toLowerCase()
                    .split(/\s+/)
                    .filter(Boolean);

            const categoryMap = {

                shirt: "shirts",

                shirts: "shirts",

                pant: "pants",

                pants: "pants",

                shoe: "shoes",

                shoes: "shoes",

                hoodie: "hoodies",

                hoodies: "hoodies",

                accessory: "accessories",

                accessories: "accessories"

            };

            const categorySearch = [];

            searchWords.forEach(
                word => {

                    if (
                        categoryMap[word]
                    ) {

                        categorySearch.push(
                            categoryMap[word]
                        );
                    }
                }
            );

            let query = {

                $or: [

                    {

                        name: {

                            $regex: search,

                            $options: "i"

                        }
                    },

                    {

                        category: {

                            $regex: search,

                            $options: "i"

                        }
                    },

                    {

                        description: {

                            $regex: search,

                            $options: "i"

                        }
                    }

                ]
            };

            if (
                categorySearch.length > 0
            ) {

                query = {

                    category: {

                        $in:
                            categorySearch.map(
                                category =>
                                    new RegExp(
                                        `^${category}$`,
                                        "i"
                                    )
                            )

                    }
                };
            }

            const products =
                await Product.find(query)
                    .sort({

                        createdAt: -1

                    });

            res.json({

                success: true,

                count:
                    products.length,

                products

            });

        }
        catch (error) {

            console.log(
                "❌ Search Error:",
                error.message
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to search products"

            });
        }
    }
);

// =========================
// GET ALL PRODUCTS
// =========================

app.get(
    "/api/products",
    async (req, res) => {

        try {

            const products =
                await Product.find()
                    .sort({

                        createdAt: -1

                    });

            res.json({

                success: true,

                products

            });

        }
        catch (error) {

            console.log(
                "❌ Get Products Error:",
                error.message
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to fetch products"

            });
        }
    }
);

// =========================
// GET SHIRT PRODUCTS
// =========================

app.get(
    "/api/products/shirts",
    async (req, res) => {

        try {

            const products =
                await Product.find({

                    category: {

                        $regex:
                            /^shirts?$/i

                    }

                })
                .sort({

                    createdAt: -1

                });

            res.json({

                success: true,

                products

            });

        }
        catch (error) {

            console.log(
                "❌ Get Shirts Error:",
                error.message
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to fetch shirt products"

            });
        }
    }
);

// =========================
// GET PANT PRODUCTS
// =========================

app.get(
    "/api/products/pants",
    async (req, res) => {

        try {

            const products =
                await Product.find({

                    category: {

                        $regex:
                            /^pants?$/i

                    }

                })
                .sort({

                    createdAt: -1

                });

            res.json({

                success: true,

                products

            });

        }
        catch (error) {

            console.log(
                "❌ Get Pants Error:",
                error.message
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to fetch pant products"

            });
        }
    }
);

// =========================
// GET HOODIE PRODUCTS
// =========================

app.get(
    "/api/products/hoodies",
    async (req, res) => {

        try {

            const products =
                await Product.find({

                    category: {

                        $regex:
                            /^hoodies?$/i

                    }

                })
                .sort({

                    createdAt: -1

                });

            res.json({

                success: true,

                products

            });

        }
        catch (error) {

            console.log(
                "❌ Get Hoodies Error:",
                error.message
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to fetch hoodie products"

            });
        }
    }
);

// =========================
// GET SHOE PRODUCTS
// =========================

app.get(
    "/api/products/shoes",
    async (req, res) => {

        try {

            const products =
                await Product.find({

                    category: {

                        $regex:
                            /^shoes?$/i

                    }

                })
                .sort({

                    createdAt: -1

                });

            res.json({

                success: true,

                products

            });

        }
        catch (error) {

            console.log(
                "❌ Get Shoes Error:",
                error.message
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to fetch shoe products"

            });
        }
    }
);

// =========================
// UPDATE PRODUCT
// =========================

app.put(
    "/api/products/:id",
    adminOnly,
    async (req, res) => {

        try {

            const {

                name,
                category,
                price,
                image,
                description,
                sizes,
                stock

            } = req.body;

            if (

                !name ||
                !category ||
                price === undefined ||
                !image

            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please fill all required product fields"

                });
            }

            const updatedProduct =
                await Product.findByIdAndUpdate(

                    req.params.id,

                    {

                        name,
                        category,
                        price,
                        image,
                        description,
                        sizes,
                        stock

                    },

                    {

                        new: true,

                        runValidators: true

                    }
                );

            if (!updatedProduct) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Product not found"

                });
            }

            console.log(
                "✅ Product Updated:",
                updatedProduct._id
            );

            res.json({

                success: true,

                message:
                    "Product updated successfully!",

                product:
                    updatedProduct

            });

        }
        catch (error) {

            console.log(
                "❌ Product Update Error:",
                error.message
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to update product"

            });
        }
    }
);

// =========================
// DELETE PRODUCT
// =========================

app.delete(
    "/api/products/:id",
    adminOnly,
    async (req, res) => {

        try {

            const product =
                await Product.findById(
                    req.params.id
                );

            if (!product) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Product not found"

                });
            }

            await Product.findByIdAndDelete(
                req.params.id
            );

            console.log(
                "🗑️ Product Deleted:",
                product._id
            );

            res.json({

                success: true,

                message:
                    "Product deleted successfully!"

            });

        }
        catch (error) {

            console.log(
                "❌ Product Delete Error:",
                error.message
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to delete product"

            });
        }
    }
);

// =========================
// TEST ROUTE
// =========================

app.get(
    "/",
    (req, res) => {

        res.send(
            "TRENT CARD Backend is Running 🚀"
        );
    }
);

// =========================
// CREATE ORDER
// =========================

app.post(
    "/api/orders",
    async (req, res) => {

        try {

            const {

                fullName,
                phone,
                size,
                quantity,
                address,
                paymentMethod

            } = req.body;

            if (

                !fullName ||
                !phone ||
                !size ||
                !quantity ||
                !address ||
                !paymentMethod

            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please fill all fields"

                });
            }

            const newOrder =
                new Order({

                    fullName,
                    phone,
                    size,
                    quantity,
                    address,
                    paymentMethod

                });

            const savedOrder =
                await newOrder.save();

            console.log(
                "✅ New Order Saved:",
                savedOrder._id
            );

            res.status(201).json({

                success: true,

                message:
                    "Order placed successfully!",

                orderId:
                    savedOrder._id

            });

        }
        catch (error) {

            console.log(
                "❌ Order Error:",
                error.message
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to place order"

            });
        }
    }
);

// =========================
// GET ALL ORDERS
// =========================

app.get(
    "/api/orders",
    async (req, res) => {

        try {

            const orders =
                await Order.find()
                    .sort({

                        createdAt: -1

                    });

            res.json({

                success: true,

                orders

            });

        }
        catch (error) {

            console.log(
                "❌ Get Orders Error:",
                error.message
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to fetch orders"

            });
        }
    }
);

// =========================
// UPDATE ORDER STATUS
// =========================

app.patch(
    "/api/orders/:id/status",
    async (req, res) => {

        try {

            const {
                status
            } = req.body;

            const allowedStatuses = [

                "Pending",
                "Confirmed",
                "Shipped",
                "Delivered",
                "Cancelled"

            ];

            if (
                !allowedStatuses.includes(
                    status
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid order status"

                });
            }

            const updatedOrder =
                await Order.findByIdAndUpdate(

                    req.params.id,

                    {
                        status
                    },

                    {
                        new: true
                    }
                );

            if (!updatedOrder) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Order not found"

                });
            }

            res.json({

                success: true,

                message:
                    "Order status updated",

                order:
                    updatedOrder

            });

        }
        catch (error) {

            console.log(
                "❌ Status Update Error:",
                error.message
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to update order status"

            });
        }
    }
);

// =========================
// DELETE ORDER
// =========================

app.delete(
    "/api/orders/:id",
    adminOnly,
    async (req, res) => {

        try {

            const order =
                await Order.findById(
                    req.params.id
                );

            if (!order) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Order not found"
                });

            }

            await Order.findByIdAndDelete(
                req.params.id
            );

            console.log(
                "🗑️ Order Deleted:",
                order._id
            );

            res.json({
                success: true,
                message:
                    "Order deleted successfully!"
            });

        }
        catch (error) {

            console.log(
                "❌ Order Delete Error:",
                error.message
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to delete order"
            });

        }

    }
);

// =========================
// START SERVER
// =========================

app.listen(
    PORT,
    () => {

        console.log(
            `🚀 Server running on http://localhost:${PORT}`
        );

    }
);
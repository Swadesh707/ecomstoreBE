import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import path from "path"
import fs from "fs"
import multer from "multer"
import { connectDB } from "./config/db.js"
import userRoutes from "./routes/userRoutes.js"
import productRoutes from "./routes/productRoutes.js"
import categoryRoutes from "./routes/categoryRoutes.js"
import orderRoutes from "./routes/orderRoutes.js"
import couponRoutes from "./routes/couponRoutes.js"
import paymentRoutes from "./routes/paymentRoutes.js"
import wishlistRoutes from "./routes/wishlistRoutes.js"
import userCategoryRoutes from "./routes/userCategoryRoutes.js"
import collectedMailsRoutes from "./routes/collectedMailsRoutes.js"
import Product from "./model/Product.js"
import Category from "./model/Category.js"
import Coupon from "./model/Coupon.js"
import Order from "./model/Order.js"
import User from "./model/user.js"
import UserCategory, { DEFAULT_USER_CATEGORIES } from "./model/UserCategory.js"
import bcrypt from "bcrypt"

dotenv.config({ quiet: true })

const app = express()

app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ limit: "50mb", extended: true }))
app.use(
  cors({
    origin: true,
    credentials: true,
    maxAge: 86400,
  })
)

const uploadDir = path.join(process.cwd(), "uploads")
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

app.use(
  "/uploads",
  express.static(uploadDir, {
    maxAge: "7d",
    immutable: true,
  })
)

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || ".jpg"
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, "product-" + uniqueSuffix + ext)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
})

app.post("/upload", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" })
    }
    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
    res.json({ url: fileUrl, filename: req.file.filename })
  } catch (err) {
    console.error("Upload error:", err)
    res.status(500).json({ message: "Failed to upload image from device" })
  }
})

app.post("/upload-multiple", upload.array("images", 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No image files provided" })
    }
    const urls = req.files.map(
      (f) => `${req.protocol}://${req.get("host")}/uploads/${f.filename}`
    )
    res.json({ urls })
  } catch (err) {
    console.error("Multiple upload error:", err)
    res.status(500).json({ message: "Failed to upload images from device" })
  }
})

connectDB().then(async () => {
  try {
    const count = await Product.countDocuments()
    const hasOldItems = await Product.findOne({
      category: { $in: ["Electronics", "Wellness & Tech", "Workspace & Furniture", "Audio & Acoustics", "Culinary & Kitchen", "Photography & Gear", "Travel & Outdoor", "General"] }
    })

    if (count === 0 || hasOldItems) {
      if (hasOldItems) {
        await Product.deleteMany({})
      }

      await Product.insertMany([

        {
          title: "Bespoke Double-Breasted Cashmere Overcoat",
          description: "Meticulously hand-cut from 100% pure Scottish cashmere. Featuring peak lapels, horn buttons, and a structured sartorial silhouette.",
          price: 850.00,
          category: "Tailoring & Outerwear",
          image: "/uploads/product-1544441893-675973e31985.jpg",
          images: [
            "/uploads/product-1544441893-675973e31985.jpg",
            "/uploads/product-1539571696357-5a69c17a67c6.jpg",
            "/uploads/product-1516257984-b1b4d707412e.jpg"
          ],
          stock: 12,
        },
        {
          title: "Hand-Tailored Tweed Houndstooth Blazer",
          description: "Woven in heritage British mills with pure virgin wool. Unstructured shoulders, patch pockets, and timeless equestrian flair.",
          price: 590.00,
          category: "Tailoring & Outerwear",
          image: "/uploads/product-1507679799987-c73779587ccf.jpg",
          images: [
            "/uploads/product-1507679799987-c73779587ccf.jpg",
            "/uploads/product-1594938298603-c8148c4dae35.jpg",
            "/uploads/product-1593030761757-71fae45fa0e7.jpg"
          ],
          stock: 16,
        },
        {
          title: "Classic Cotton Gabardine Trench Coat",
          description: "Water-repellent double-breasted trench in timeless British khaki. Finished with D-ring storm flap and buffalo horn buckles.",
          price: 680.00,
          category: "Tailoring & Outerwear",
          image: "/uploads/product-1551028719-01c1eb562251.jpg",
          images: [
            "/uploads/product-1551028719-01c1eb562251.jpg",
            "/uploads/product-1544441893-675973e31985.jpg",
            "/uploads/product-1520975954732-35dd22299614.jpg"
          ],
          stock: 15,
        },
        {
          title: "Pleated Double-Faced Wool Trousers",
          description: "High-waisted tailored trousers with forward double pleats, side adjusters, and a clean drape in charcoal flannel.",
          price: 240.00,
          category: "Tailoring & Outerwear",
          image: "/uploads/product-1473966968600-fa801b869a1a.jpg",
          images: [
            "/uploads/product-1473966968600-fa801b869a1a.jpg",
            "/uploads/product-1624378439575-d8705ad7ae80.jpg",
            "/uploads/product-1506630448388-4e683c67ddb0.jpg"
          ],
          stock: 25,
        },

        {
          title: "Chunky Cable-Knit Fisherman Sweater",
          description: "Sumptuously heavy 6-ply Merino wool and cashmere cable-knit sweater in classic cream ivory.",
          price: 320.00,
          category: "Knitwear & Shirts",
          image: "/uploads/product-1620799140408-edc6dcb6d633.jpg",
          images: [
            "/uploads/product-1620799140408-edc6dcb6d633.jpg",
            "/uploads/product-1576566588028-4147f3842f27.jpg",
            "/uploads/product-1618354691373-d851c5c3a990.jpg"
          ],
          stock: 28,
        },
        {
          title: "Fine Gauge Cashmere Polo Knit",
          description: "Knitted from ultra-fine Mongolian cashmere with Mother-of-Pearl buttons and a ribbed collar.",
          price: 280.00,
          category: "Knitwear & Shirts",
          image: "/uploads/product-1618354691373-d851c5c3a990.jpg",
          images: [
            "/uploads/product-1618354691373-d851c5c3a990.jpg",
            "/uploads/product-1620799140408-edc6dcb6d633.jpg",
            "/uploads/product-1598033129183-c4f50c736f10.jpg"
          ],
          stock: 22,
        },
        {
          title: "Sea Island Cotton Oxford Shirt",
          description: "Crisp button-down collar shirt crafted from rare Sea Island cotton with single-needle tailoring.",
          price: 185.00,
          category: "Knitwear & Shirts",
          image: "/uploads/product-1598033129183-c4f50c736f10.jpg",
          images: [
            "/uploads/product-1598033129183-c4f50c736f10.jpg",
            "/uploads/product-1602810318383-e386cc2a3ccf.jpg",
            "/uploads/product-1618354691373-d851c5c3a990.jpg"
          ],
          stock: 45,
        },
        {
          title: "Pure Washed Linen Resort Shirt",
          description: "Breathable European flax linen with a camp collar, designed for relaxed coastal retreats and summer afternoons.",
          price: 165.00,
          category: "Knitwear & Shirts",
          image: "/uploads/product-1602810318383-e386cc2a3ccf.jpg",
          images: [
            "/uploads/product-1602810318383-e386cc2a3ccf.jpg",
            "/uploads/product-1598033129183-c4f50c736f10.jpg",
            "/uploads/product-1620799140408-edc6dcb6d633.jpg"
          ],
          stock: 35,
        },

        {
          title: "Goodyear-Welted Penny Loafers",
          description: "Full-grain calfskin leather hand-stitched in Tuscany. Features oak bark-tanned leather soles and glove leather lining.",
          price: 420.00,
          category: "Leather Shoes",
          image: "/uploads/product-1533867617858-e7b97e060509.jpg",
          images: [
            "/uploads/product-1533867617858-e7b97e060509.jpg",
            "/uploads/product-1614252235316-8c857d38b5f4.jpg",
            "/uploads/product-1582897103445-56545163b49c.jpg"
          ],
          stock: 20,
        },
        {
          title: "Hand-Burnished Oxford Dress Shoes",
          description: "Closed-laced formal oxfords with subtle brogue detailing on the toe medallion. Hand-patinated to deep antique cognac.",
          price: 460.00,
          category: "Leather Shoes",
          image: "/uploads/product-1614252235316-8c857d38b5f4.jpg",
          images: [
            "/uploads/product-1614252235316-8c857d38b5f4.jpg",
            "/uploads/product-1533867617858-e7b97e060509.jpg",
            "/uploads/product-1608256246200-53e635b5b65f.jpg"
          ],
          stock: 18,
        },
        {
          title: "Snuff Suede Tassel Loafers",
          description: "Rich French calf suede treated with water resistance, finished with classic tassels and Goodyear construction.",
          price: 395.00,
          category: "Leather Shoes",
          image: "/uploads/product-1582897103445-56545163b49c.jpg",
          images: [
            "/uploads/product-1582897103445-56545163b49c.jpg",
            "/uploads/product-1533867617858-e7b97e060509.jpg",
            "/uploads/product-1614252235316-8c857d38b5f4.jpg"
          ],
          stock: 15,
        },
        {
          title: "Double Monk Strap Leather Shoes",
          description: "Sleek double brass buckle monk shoes handcrafted from Italian box calf with a bevelled waistline.",
          price: 440.00,
          category: "Leather Shoes",
          image: "/uploads/product-1608256246200-53e635b5b65f.jpg",
          images: [
            "/uploads/product-1608256246200-53e635b5b65f.jpg",
            "/uploads/product-1614252235316-8c857d38b5f4.jpg",
            "/uploads/product-1582897103445-56545163b49c.jpg"
          ],
          stock: 14,
        },

        {
          title: "Full-Grain Italian Saddle Leather Belt",
          description: "Vegetable-tanned 32mm dress belt with beveled edge creasing and a solid brushed brass equestrian buckle.",
          price: 135.00,
          category: "Belts & Leather Goods",
          image: "/uploads/product-1624222247344-550fb60583dc.jpg",
          images: [
            "/uploads/product-1624222247344-550fb60583dc.jpg",
            "/uploads/product-1553062407-98eeb64c6a62.jpg",
            "/uploads/product-1627123424574-724758594e93.jpg"
          ],
          stock: 50,
        },
        {
          title: "Braided Calfskin Countryside Belt",
          description: "Hand-plaited supple calf leather with rich burnished edges and a polished English brass buckle.",
          price: 145.00,
          category: "Belts & Leather Goods",
          image: "/uploads/product-1553062407-98eeb64c6a62.jpg",
          images: [
            "/uploads/product-1553062407-98eeb64c6a62.jpg",
            "/uploads/product-1624222247344-550fb60583dc.jpg",
            "/uploads/product-1627123424574-724758594e93.jpg"
          ],
          stock: 35,
        },
        {
          title: "Vegetable-Tanned Leather Card Case",
          description: "Ultra-slim 6-pocket cardholder in deep British Racing Green, hand-buffed with natural beeswax.",
          price: 95.00,
          category: "Belts & Leather Goods",
          image: "/uploads/product-1627123424574-724758594e93.jpg",
          images: [
            "/uploads/product-1627123424574-724758594e93.jpg",
            "/uploads/product-1624222247344-550fb60583dc.jpg",
            "/uploads/product-1553062407-98eeb64c6a62.jpg"
          ],
          stock: 60,
        },

        {
          title: "Vintage Mechanical Chronometer Dress Watch",
          description: "Hand-wound mechanical movement with ivory enamel dial, blued Breguet hands, and brown alligator leather strap.",
          price: 1250.00,
          category: "Fine Accessories",
          image: "/uploads/product-1522335789203-aabd1fc54bc9.jpg",
          images: [
            "/uploads/product-1522335789203-aabd1fc54bc9.jpg",
            "/uploads/product-1572635196237-14b3f281503f.jpg",
            "/uploads/product-1596755094514-f87e34085b2c.jpg"
          ],
          stock: 8,
        },
        {
          title: "Hand-Rolled Mulberry Silk Pocket Square",
          description: "Printed in Como, Italy on heavyweight 16-momme silk twill with artisan hand-rolled edges.",
          price: 85.00,
          category: "Fine Accessories",
          image: "/uploads/product-1596755094514-f87e34085b2c.jpg",
          images: [
            "/uploads/product-1596755094514-f87e34085b2c.jpg",
            "/uploads/product-1608231387042-66d1773070a5.jpg",
            "/uploads/product-1522335789203-aabd1fc54bc9.jpg"
          ],
          stock: 40,
        },
        {
          title: "Tortoiseshell Horn-Trim Sunglasses",
          description: "Handmade Italian acetate frames with polarized mineral glass lenses and 24k gold-plated temple hardware.",
          price: 290.00,
          category: "Fine Accessories",
          image: "/uploads/product-1572635196237-14b3f281503f.jpg",
          images: [
            "/uploads/product-1572635196237-14b3f281503f.jpg",
            "/uploads/product-1522335789203-aabd1fc54bc9.jpg",
            "/uploads/product-1596755094514-f87e34085b2c.jpg"
          ],
          stock: 30,
        },
        {
          title: "Heritage Cashmere Scarf in Royal Stewart",
          description: "Pure combed Mongolian cashmere woven on traditional looms with water-wave ripple finish and delicate fringe.",
          price: 195.00,
          category: "Fine Accessories",
          image: "/uploads/product-1608231387042-66d1773070a5.jpg",
          images: [
            "/uploads/product-1608231387042-66d1773070a5.jpg",
            "/uploads/product-1596755094514-f87e34085b2c.jpg",
            "/uploads/product-1572635196237-14b3f281503f.jpg"
          ],
          stock: 25,
        },
      ])
    }

    const catCount = await Category.countDocuments()
    if (catCount === 0 || hasOldItems) {
      if (hasOldItems) {
        await Category.deleteMany({})
      }
      await Category.insertMany([
        { title: "Tailoring & Outerwear", description: "Bespoke cashmere overcoats, tweed blazers, and pleated trousers", status: true },
        { title: "Knitwear & Shirts", description: "Merino cable-knit sweaters, cashmere knits, and Oxford cotton shirts", status: true },
        { title: "Leather Shoes", description: "Goodyear-welted Tuscan calfskin loafers, oxfords, and boots", status: true },
        { title: "Belts & Leather Goods", description: "Full-grain saddle leather belts and handcrafted leather goods", status: true },
        { title: "Fine Accessories", description: "Horology mechanical dress watches, silk pocket squares, and cashmere scarves", status: true },
      ])
    }

    const couponCount = await Coupon.countDocuments()
    if (couponCount === 0) {
      await Coupon.create({
        code: "HERITAGE20",
        description: "Inaugural Patron Privilege: 20% off sartorial commissions",
        discountType: "percentage",
        discountValue: 20,
        minOrderAmount: 100,
        maxUses: 100,
        limitPerUser: 1,
        isActive: true,
      })
    }

    const userCatCount = await UserCategory.countDocuments()
    if (userCatCount === 0) {
      await UserCategory.insertMany(DEFAULT_USER_CATEGORIES)
    }

    const defaultAccounts = [
      {
        fullName: "admin",
        email: "admin@ecomstore.com",
        password: "password123",
        role: "admin",
        userCategory: "Admin",
      },
      {
        fullName: "salesperson",
        email: "sales@ecomstore.com",
        password: "password123",
        role: "salesperson",
        userCategory: "Salesperson",
      },
      {
        fullName: "logistics",
        email: "logistics@ecomstore.com",
        password: "password123",
        role: "logistics",
        userCategory: "Logistics",
      },
      {
        fullName: "user",
        email: "user@ecomstore.com",
        password: "password123",
        role: "user",
        userCategory: "User",
      },
    ]

    for (const acc of defaultAccounts) {
      const existing = await User.findOne({ email: acc.email })
      if (!existing) {
        const hashedPassword = await bcrypt.hash(acc.password, 10)
        await User.create({
          fullName: acc.fullName,
          email: acc.email,
          password: hashedPassword,
          role: acc.role,
          userCategory: acc.userCategory,
          status: "Active",
        })
      } else {
        existing.role = acc.role
        existing.userCategory = acc.userCategory
        await existing.save()
      }
    }

    try {
      await Order.collection.dropIndex("trackingNumber_1")
    } catch (e) {

    }
  } catch (err) {

  }

  const PORT = process.env.PORT || 8000
  app.listen(PORT, () => {
    console.log("Connected with the database and running on localhost:8000")
  })
})

app.use("/products", productRoutes)
app.use("/user", userRoutes)
app.use("/roles", userRoutes)
app.use("/category", categoryRoutes)
app.use("/orders", orderRoutes)
app.use("/order", orderRoutes)
app.use("/payments", paymentRoutes)
app.use("/payment", paymentRoutes)
app.use("/coupons", couponRoutes)
app.use("/wishlist", wishlistRoutes)
app.use("/wishlists", wishlistRoutes)
app.use("/user-category", userCategoryRoutes)
app.use("/user-categories", userCategoryRoutes)
app.use("/collected-mails", collectedMailsRoutes)
app.use("/collected-emails", collectedMailsRoutes)
app.use("/newsletter", collectedMailsRoutes)

app.get("/", (req, res) => {
  res.send("E-Commerce Backend API is running...")
})

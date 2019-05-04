const express = require("express");
const mysql = require("mysql");
const cors = require("cors");

const multer = require("multer");
const ejs = require("ejs");
const path = require("path");

const app = express();

// Create connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "restaurant",
  multipleStatements: true
});
// Connect
db.connect(err => {
  if (err) {
    return err;
  }
  console.log("MySql Connected...");
});

app.use(cors());

// Select posts
app.get("/food", (req, res) => {  //getfood
  let sql =
    "SELECT f.food_id AS id,f.food_name AS name,f.food_name_alt AS nameAlt,f.food_category_1 AS category1,f.food_category_2 AS category2,f.food_category_3 AS category3,f.food_price AS price,f.food_discount AS discount,f.food_img AS img FROM foods AS f";
  db.query(sql, (err, results) => {
    if (err) {
      return res.send(err);
    } else {
      const food = res.json({
        data: results
      });
      return food;
    }
  });
});
app.get("/tab", (req, res) => {//get table
  let { no } = req.query;
  let sql =
    "SELECT table_no AS number,table_status AS status,table_pin AS pin FROM tab WHERE table_no=" +
    no;
  db.query(sql, (err, results) => {
    if (err) {
      return res.send(err);
    } else {
      const tab = res.json({
        data: results
      });
      return tab;
    }
  });
});

app.get("/tab/add", (req, res) => { //add table
  let { no, status, pin } = req.query;
  let insert =
    "INSERT INTO tab_log (table_no,table_status) VALUES(" +no +"," +status +"); UPDATE tab SET table_pin = " +pin +",table_status = "+status+" WHERE table_no ="+ no;
  db.query(insert,[1,2], (err, results) => {
    if (err) {
      return res.send(err);
    } else {
      return res.send("successfully add");
    }
  });
});

app.get("/cart", (req, res) => { //get cart
  let { no } = req.query;
  let sql =
    "SELECT foods.food_img AS image,foods.food_name AS name,foods.food_price AS price,foods.food_id AS id,cart.order_quantity AS quantity,foods.food_category_1 AS category FROM foods INNER JOIN cart ON foods.food_id=cart.food_id WHERE table_no=" + no;
  db.query(sql, (err, results) => {
    if (err) {
      return res.send(err);
    } else {
      const tab = res.json({
        data: results
      });
      return tab;
    }
  });
});
app.get("/cart/add", (req, res) => { //add cart
  let { no, food, num } = req.query;
  let sql =
    "INSERT INTO cart (table_no,food_id,order_quantity) VALUES(" +no +"," +food +","+num+")";
  db.query(sql, (err, results) => {
    if (err) {
      return res.send(err);
    } else {
      const tab = res.json({
        data: results
      });
      return tab;
    }
  });
});

app.get("/cart/up", (req, res) => { //update cart
  let {  no, food, num } = req.query;
  let sql ="UPDATE cart SET order_quantity = "+num+" WHERE food_id ="+ food+" AND table_no ="+no;
  db.query(sql, (err, results) => {
    if (err) {
      return res.send(err);
    } else {
      const tab = res.json({
        data: results
      });
      return tab;
    }
  });
});
app.get("/cart/del", (req, res) => { //del cart
  let { no, food } = req.query;
  let sql =
    "DELETE FROM cart WHERE table_no=" +no +" AND food_id =" +food;
  db.query(sql, (err, results) => {
    if (err) {
      return res.send(err);
    } else {
      const tab = res.json({
        data: results
      });
      return tab;
    }
  });
});

app.get("/ord", (req, res) => { //get order
  let { no } = req.query;
  let sql =
    "SELECT table_no AS num,food_id AS food,order_quantity AS quantity FROM transaction WHERE table_no=" + no;
  db.query(sql, (err, results) => {
    if (err) {
      return res.send(err);
    } else {
      const tab = res.json({
        data: results
      });
      return tab;
    }
  });
});
app.get("/ord/add", (req, res) => { //add order
  let { no,food, num } = req.query;
  let sql =
  "INSERT INTO tran_log (food_id,order_quantity) VALUES(" +food +"," +num +"); UPDATE transaction SET food_id = " +food +",order_quantity = "+num+" WHERE table_no ="+ no;
  db.query(sql, (err, results) => {
    if (err) {
      return res.send(err);
    } else {
      const tab = res.json({
        data: results
      });
      return tab;
    }
  });
});
app.get("/ord/del", (req, res) => { //del cart
  let { no, food } = req.query;
  let sql =
    "DELETE FROM cart WHERE table_no=" +no;
  db.query(sql, (err, results) => {
    if (err) {
      return res.send(err);
    } else {
      const tab = res.json({
        data: results
      });
      return tab;
    }
  });
});

// Set The Storage Engine
const storage = multer.diskStorage({
  destination: "./public/uploads/",
  filename: function(req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  }
});

// Init Upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 },
  fileFilter: function(req, file, cb) {
    checkFileType(file, cb);
  }
}).single("myImage");

// Check File Type
function checkFileType(file, cb) {
  // Allowed ext
  const filetypes = /jpeg|jpg|png|gif/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb("Error: Images Only!");
  }
}

// EJS
app.set("view engine", "ejs");

// Public Folder
app.use(express.static("./public"));

app.get("/", (req, res) => res.render("senttodb"));

app.post("/upload", (req, res) => {
  upload(req, res, err => {
    if (err) {
      res.render("senttodb", {
        msg: err
      });
    } else {
      if (req.file == undefined) {
        res.render("senttodb", {
          msg: "Error: No File Selected!"
        });
      } else {
        res.render("senttodb", {
          msg: "File Uploaded!",
          file: `uploads/${req.file.filename}`
        });
      }
    }
  });
});

app.listen(3010, () => {
  console.log("to the port 3010");
});

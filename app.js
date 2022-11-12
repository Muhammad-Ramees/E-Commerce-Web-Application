var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const { engine: hbs } = require("express-handlebars");
var session = require("express-session");
const MongoStore = require("connect-mongo");
var userRouter = require("./routes/user");
var adminRouter = require("./routes/admin");
var superAdminRouter = require("./routes/superAdmin");
var fileUpload = require("express-fileupload");
var db = require("./config/connection");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");
app.use(express.static(path.join(__dirname, "public")));
app.engine(
  "hbs",
  hbs({
    extname: "hbs",
    defaultLayout: "layout",
    layoutsDir: __dirname + "/views/layout/",
    partialsDir: __dirname + "/views/partials/",
  })
);
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(fileUpload());

// app.use(
//   session({
//     secret: "key",
//     store: MongoStore.create({
//       mongoUrl: "mongodb://localhost:27017/shopping",
//       autoRemove: "interval",
//       autoRemoveInterval: 10, // In minutes. Default
//     }),
//   })
// );
app.use(session({ secret: "key", cookie: { maxAge: 60000000 } }));
db.connect((err) => {
  if (err) {
    console.log("Connection Error ========== " , err);
  } else {
    console.log("Database conected to port 27017");
  }
});
app.use("/", userRouter);
app.use("/admin", adminRouter);
app.use("/superAdmin", superAdminRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;

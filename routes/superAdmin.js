var express = require("express");
const { response } = require("../app");
var router = express.Router();
var productHelpers = require("../helper/product_helpers");
var userHelpers = require("../helper/user_helper");
// const verifyLogin = (req, res, next) => {
//   if (req.session.loggedIn) {
//     next();
//   } else {
//     res.redirect("/login");
//   }
// };

/* GET home page. */
router.get("/", function (req, res, next) {
  productHelpers.getAllProducts().then((products) => {
    res.render("superAdmin/admin-home", { products, superAdmin: true });
  });
});
router.get("/users-list", (req, res) => {
  res.render("superAdmin/users-list", { superAdmin: true });
});

//Get Login page
router.get("/login", (req, res, next) => {
  if (req.session.loggedIn) {
    res.redirect("/");
  } else {
    res.render("superAdmin/login", { loginErr: req.session.loginErr });
    req.session.loginErr = false;
  }
});

//Post Login page
router.post("/login", (req, res, next) => {
  userHelpers
    .doLogin(req.body)
    .then((response) => {
      console.log(req.body);
      if (response.status) {
        req.session.loggedIn = true;
        req.session.user = response.user;
        res.redirect("/");
      } else {
        req.session.loginErr = "Invalid username/email or password";
        res.redirect("/login");
      }
    })
    .catch((err) => {
      return next(err);
    });
});

//logout from home page
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

//Get Signup page
router.get("/signup", (req, res) => {
  res.render("user/signup");
});

//Post Signup page
router.post("/signup", (req, res, next) => {
  userHelpers
    .doSignup(req.body)
    .then((response) => {
      console.log(response);
      req.session.loggedIn = true;
      req.session.user = response;
      res.redirect("/");
    })
    .catch((err) => {
      return next(err);
    });
});

module.exports = router;

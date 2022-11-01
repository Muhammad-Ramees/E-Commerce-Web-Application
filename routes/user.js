var express = require("express");
var router = express.Router();
var productHelpers = require("../helper/product_helpers");
var userHelpers = require("../helper/user_helper");
const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next();
  } else {
    res.redirect("/login");
  }
};

/* GET home page. */
router.get("/", async (req, res) => {
  let user = req.session.user;
  let cart;
  if (req.session.user)
    cart = await userHelpers.getCartCount(req.session.user._id);

  productHelpers.getAllProducts().then((products) => {
    res.render("user/view-products", { products, user, cart });
    console.log(cart);
  });
});
//Get Login page
router.get("/login", (req, res, next) => {
  if (req.session.loggedIn) {
    res.redirect("/");
  } else {
    res.render("user/login", { loginErr: req.session.loginErr });
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
//GET CART PAGE
router.get("/cart", verifyLogin, async (req, res, next) => {
  let user = req.session.user;
  let products = await userHelpers.getCartProducts(req.session.user._id);
  console.log(products);
  res.render("user/cart", { user, products });
});

//Get Add to cart
router.get("/add-to-cart/:id", verifyLogin, (req, res, next) => {
  userHelpers
    .addToCart(req.params.id, req.session.user._id)
    .then(() => {
      res.redirect("/");
    })
    .catch((err) => {
      return next(err);
    });
});

module.exports = router;

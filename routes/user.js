var express = require("express");
const { response, routes } = require("../app");
var router = express.Router();
var productHelpers = require("../helper/product_helpers");
var userHelpers = require("../helper/user_helper");
var pincodeDirectory = require("india-pincode-lookup");
const { Db } = require("mongodb");

const verifyLogin = (req, res, next) => {
  if (req.session.LoggedIn) {
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
  });
});
//Get Login page
router.get("/login", (req, res, next) => {
  if (req.session.LoggedIn) {
    res.redirect("/");
  } else {
    res.render("user/login", { loginErr: req.session.LoginErr });
    req.session.LoginErr = false;
  }
});

//Post Login page
router.post("/login", (req, res, next) => {
  userHelpers
    .doLogin(req.body)
    .then((response) => {
      if (response.status) {
        req.session.LoggedIn = true;
        req.session.user = response.user;
        res.redirect("/");
      } else {
        req.session.LoginErr = "Invalid username/email or password";
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
router.post("/signup", (req, res) => {
  let image = req.files.image;
  userHelpers.doSignup(req.body).then((user) => {
    image.mv("./public/profile-img/" + user._id + ".jpg", (err, done) => {
      if (!err) {
        res.redirect("/login");
      } else {
        console.log(err);
      }
    });
  });
});
//GET CART PAGE
router.get("/cart", verifyLogin, async (req, res, next) => {
  let user = req.session.user;
  let userDetail = await userHelpers.getUserDetails(user);
  let totalPrice = await userHelpers.getTotalPrice(req.session.user._id);
  let products = await userHelpers.getCartProducts(req.session.user._id);
  res.render("user/cart", { products, user, totalPrice, userDetail });
});

//Get Add to cart
router.get("/add-to-cart/:id", (req, res, next) => {
  userHelpers
    .addToCart(req.params.id, req.session.user._id)
    .then(() => {
      res.json({ status: true });
    })
    .catch((err) => {
      return next(err);
    });
});

// CHANGE PRODUCT QUANTITY
router.post("/change-product-quantity", (req, res, next) => {
  userHelpers.changeProductQuantity(req.body).then(async (data) => {
    const total = await userHelpers.getTotalPrice(req.session.user._id);

    res.json({ data, total });
  });
});

//GET PROFILE PAGE
router.get("/profile", (req, res) => {
  let user = req.session.user;
  if (req.session.user) {
    res.render("user/profile", { user });
  }
});

//REM0VE PRODUCT FROM CART
router.post("/remove-product", (req, res) => {
  userHelpers.removeProduct(req.body).then((response) => {
    res.json(response);
  });
});
// GET STATE AND DISTRICT FROM PINCODE
router.get("/get-address", async (req, res) => {
  let pin,
    pincode = req._parsedOriginalUrl.query,
    pinDetails = {};

  pin = pincodeDirectory.lookup(pincode);
  if (pin.length > 0) {
    pinDetails.state = pin[0].stateName;
    pinDetails.district = pin[0].districtName;
  } else {
    console.log("invalid pincode");
  }

  let user = req.session.user;
  userHelpers.pushUserDetails(pinDetails, user).then(async (response) => {
    let userDetails = await userHelpers.getUserDetails(user);
    res.json(userDetails);
  });
});

router.get("/update-address", (req, res) => {
  let address = req._parsedOriginalUrl.query;
  let user = req.session.user;
  userHelpers.updateAddress(address, user).then(async (response) => {
    let userDetails = await userHelpers.getUserDetails(user);
    res.json(userDetails);
  });
});

router.post("/place-order", async (req, res) => {
  let total = await userHelpers.getTotalPrice(req.session.user._id);
  let user = req.session.user._id;
  let cartProducts = await userHelpers.getCartProductList(user);
  let order = req.body;
  order.userId = user;

  userHelpers.placeOrder(order, cartProducts).then((response) => {
    let orderDetails = response.ops[0];
    let orderId = response.insertedId;
    if (order.paymentMethod === "COD") {
      res.json({ COD_SUCCESS: true, orderId });
    } else if (order.paymentMethod === "ONLINE") {
      userHelpers
        .generateRazorPay(response.insertedId, total)
        .then((response) => {
          console.log(response, "response cl========================");
          response.COD_SUCCESS = false;
          res.json(response);
        });
    } else {
      console.log("Please submit a payment method ");
    }
  });
});
router.get("/order-approved/:id", async (req, res) => {
  let orderId = req.params.id;
  let ApprovedOrder = await userHelpers.getOrderApproved(orderId);
  res.render("user/order-success", { ApprovedOrder });
});

router.post("/verify-payment", (req, res) => {
  userHelpers.verifyRazorpayPayment(req.body).then(() => {
    console.log(
      req.body,
      "req.body+++++++++++++++++++++++++++++++++++++++++++++++"
    );
    userHelpers
      .chanmgePaymentStatus(req.body["order[receipt]"])
      .then(() => {
        console.log("Payment Successfull");
        res.json({ status: true });
      })
      .catch((err) => {
        console.log(err);
        res.json({ status: false, errMsg: "" });
      });
  });
});
// router.get("/order-success", (req, res) => {
// res.render
// });

router.get("/orders", async (req, res) => {
  let orders = await userHelpers.getOrders(req.session.user._id);
  res.render("user/orders", { user: req.session.user, orders });
});

module.exports = router;

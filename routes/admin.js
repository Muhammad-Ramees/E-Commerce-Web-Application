var express = require("express");
const { response } = require("../app");
const admin_helpers = require("../helper/admin_helpers");
var router = express.Router();
var productHelpers = require("../helper/product_helpers");

/* VERIFY LOGIN */
const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next();
  } else {
    res.redirect("/admin-login");
  }
};

/* GET users listing.================================ */
router.get("/", function (req, res, next) {
  productHelpers.getAllProducts().then((products) => {
    res.render("admin/view-product", { products, admin: true });
  });
});

/* GET Add-ProDuct PAGE========================================== */
router.get("/add-product", (req, res, next) => {
  res.render("admin/add-product");
});

/*POST ADD PRODUCT TO PRODUCTHELPERS =============================*/
router.post("/add-product", (req, res) => {
  let image = req.files.image;
  console.log(req.files.image);
  productHelpers.addProduct(req.body, (id) => {
    image.mv("./public/product-images/" + id + ".jpg", (err, done) => {
      if (!err) {
        res.render("admin/add-product", { admin: true });
      } else {
        console.log(err);
      }
    });
  });
});
/*DELETE PRODUCT===================================== */
router.get("/delete-product/:id", (req, res, next) => {
  let proId = req.params.id;
  productHelpers
    .deleteProduct(proId)
    .then((response) => {
      console.log(response);
      res.redirect("/admin");
    })
    .catch((err) => {
      return next(err);
    });
});

router.get("/edit-product/:id", async (req, res) => {
  let product = await productHelpers.getProductDetails(req.params.id);
  console.log(product);
  res.render("admin/edit-product", { product, admin: true });
});

router.post("/edit-product/:id", (req, res, next) => {
  console.log(req.params.id);
  let id = req.params.id;
  productHelpers
    .updateProduct(req.params.id, req.body)
    .then(() => {
      res.redirect("/admin");
      if (req.files.image) {
        let image = req.files.image;
        image.mv("./public/product-images/" + id + ".jpg");
      }
    })
    .catch((err) => {
      return next(err);
    });
});
router.get("/admin-signup", (req, res) => {
  res.render("user/admin-signup", { admin: true });
});

//Post Signup page
router.post("/admin-signup", (req, res, next) => {
  admin_helpers
    .doSignup(req.body)
    .then((response) => {
      console.log(response);
      req.session.loggedIn = true;
      req.session.user = response;
      res.redirect("/admin");
    })
    .catch((err) => {
      return next(err);
    });
});

//Get Login page
router.get("/admin-login", (req, res, next) => {
  if (req.session.loggedIn) {
    res.redirect("/admin");
  } else {
    res.render("admin/admin-login", {
      loginErr: req.session.loginErr,
      admin: true,
    });
    req.session.loginErr = false;
  }
});

//Post Login page
router.post("/admin-login", (req, res, next) => {
  adminHelpers
    .doLogin(req.body)
    .then((response) => {
      console.log(req.body);
      if (response.status) {
        req.session.loggedIn = true;
        req.session.user = response.user;
        res.redirect("/");
      } else {
        req.session.loginErr = "Invalid username/email or password";
        res.redirect("/admin-login");
      }
    })
    .catch((err) => {
      return next(err);
    });
});

//logout from home page
router.get("/admin-logout", (req, res) => {
  req.session.destroy();
  res.redirect("/admin-login");
});

module.exports = router;

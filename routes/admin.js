var express = require("express");
const { response } = require("../app");
const adminHelpers = require("../helper/admin_helpers");
var router = express.Router();
var productHelpers = require("../helper/product_helpers");

/* VERIFY LOGIN */
const verifyLogin = (req, res, next) => {
  if (req.session.adminLoggedIn) {
    next();
  } else {
    res.redirect("admin/admin-login");
  }
};

/* GET users listing.================================ */
router.get("/", verifyLogin, function (req, res, next) {
  let admin = req.session.admin;
  productHelpers.getAllProducts().then((products) => {
    res.render("admin/view-product", { products, admin, admins: true });
  });
});

/* GET Add-ProDuct PAGE========================================== */
router.get("/add-product", verifyLogin, (req, res, next) => {
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

//GET EDIT PAGE =================================
router.get("/edit-product/:id", verifyLogin, async (req, res) => {
  let product = await productHelpers.getProductDetails(req.params.id);
  console.log(product);
  res.render("admin/edit-product", { product, admin: true });
});

//EDIT PRODUCT BY ID =================================================
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
//ADMIN SIGNUP PAGE =================================================================

//ADMIN SIGNUP===================
// router.post("/admin-signup", (req, res, next) => {
//   adminHelpers
//     .doSignup(req.body)
//     .then((response) => {
//       console.log(response);
//       req.session.loggedIn = true;
//       req.session.admin = response;
//       res.redirect("/admin");
//     })
//     .catch((err) => {
//       return next(err);
//     });
// });

//Get Login page
router.get("/admin-login", (req, res) => {
  if (req.session.adminLoggedIn) {
    res.redirect("/");
  } else {
    res.render("admin/admin-login", {
      loginErr: req.session.adminLoginErr,
      admin: true,
    });
    req.session.adminLoginErr = false;
  }
});

//Post Login page
router.post("/admin-login", (req, res, next) => {
  adminHelpers
    .doLogin(req.body)
    .then((response) => {
      console.log(req.body);
      if (response.status) {
        req.session.adminLoggedIn = true;
        req.session.admin = response.admin;
        res.redirect("/admin");
      } else {
        req.session.adminLoginErr = "Invalid username/email or password";
        res.redirect("admin/admin-login");
      }
    })
    .catch((err) => {
      return next(err);
    });
});

//logout from home page
router.get("/admin-logout", (req, res) => {
  req.session.destroy();
  res.redirect("admin/admin-login");
});

module.exports = router;

var express = require("express");
const { response } = require("../app");
const adminHelpers = require("../helper/admin_helpers");
var router = express.Router();
var productHelpers = require("../helper/product_helpers");
var superAdminHelpers = require("../helper/superAdmin_helpers");

/* VERIFY LOGIN */
const verifyLogin = (req, res, next) => {
  if (req.session.LoggedIn) {
    next();
  } else {
    res.redirect("superAdmin/superAdmin-login");
  }
};

/* GET users listing.================================ */
router.get("/", verifyLogin, function (req, res, next) {
  let superAdmins = req.session.superAdmin;
  productHelpers.getAllProducts().then((products) => {
    res.render("superAdmin/view-product", {
      products,
      superAdmins,
      superAdmin: true,
    });
  });
});

/* GET Add-ProDuct PAGE========================================== */
router.get("/add-product", verifyLogin, (req, res, next) => {
  res.render("superAdmin/add-product");
});

/*POST ADD PRODUCT TO PRODUCTHELPERS =============================*/
router.post("/add-product", (req, res) => {
  let image = req.files.image;
  console.log(req.files.image);
  productHelpers.addProduct(req.body, (id) => {
    image.mv("./public/product-images/" + id + ".jpg", (err, done) => {
      if (!err) {
        res.render("superAdmin/add-product");
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
      res.redirect("/superAdmin");
    })
    .catch((err) => {
      return next(err);
    });
});

//GET EDIT PAGE =================================
router.get("/edit-product/:id", verifyLogin, async (req, res) => {
  let product = await productHelpers.getProductDetails(req.params.id);
  console.log(product);
  res.render("superAdmin/edit-product", { product, admin: true });
});

//EDIT PRODUCT BY ID =================================================
router.post("/edit-product/:id", (req, res, next) => {
  console.log(req.params.id);
  let id = req.params.id;
  productHelpers
    .updateProduct(req.params.id, req.body)
    .then(() => {
      res.redirect("/superAdmin");
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
router.get("/superAdmin-signup", (req, res) => {
  res.render("superAdmin/superAdmin-signup", { superAdmin: true });
});

//ADMIN SIGNUP===================
router.post("/admin-signup", (req, res, next) => {
  adminHelpers
    .doSignup(req.body)
    .then((response) => {
      console.log(response);
      req.session.LoggedIn = true;
      req.session.admin = response;
      res.redirect("/admin");
    })
    .catch((err) => {
      return next(err);
    });
});
// router.post("/superAdmin-signup", (req, res, next) => {
//   superAdminHelpers
//     .doSignup(req.body)
//     .then((response) => {
//       console.log(response);
//       req.session.superAdminLoggedIn = true;
//       req.session.superAdmin = response;
//       res.redirect("/admin");
//     })
//     .catch((err) => {
//       return next(err);
//     });
// });

//Get Login page
router.get("/superAdmin-login", (req, res) => {
  if (req.session.LoggedIn) {
    res.redirect("/superAdmin");
  } else {
    res.render("superAdmin/superAdmin-login", {
      LoginErr: req.session.LoginErr,
      superAdmin: true,
    });
    req.session.LoginErr = false;
  }
});

//Post Login page
router.post("/superAdmin-login", (req, res, next) => {
  superAdminHelpers
    .doLogin(req.body)
    .then((response) => {
      console.log(req.body);
      if (response.status) {
        req.session.LoggedIn = true;
        req.session.superAdmin = response.superAdmin;
        res.redirect("/superAdmin");
      } else {
        req.session.LoginErr = "Invalid username/email or password";
        res.redirect("superAdmin/superAdmin-login");
      }
    })
    .catch((err) => {
      return next(err);
    });
});

//logout from home page
router.get("/superAdmin-logout", (req, res) => {
  req.session.destroy();
  res.redirect("/superAdmin");
});

//Get USERS LIST
router.get("/users-list", (req, res) => {
  let superAdmins = req.session.superAdmin;
  superAdminHelpers.getUsers().then((users) => {
    res.render("superAdmin/users-list", {
      superAdmin: true,
      superAdmins,
      users,
    });
  });
});

module.exports = router;

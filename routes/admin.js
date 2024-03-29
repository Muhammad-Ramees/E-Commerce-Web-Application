var express = require("express");
const { response } = require("../app");
const adminHelpers = require("../helper/admin_helpers");
const userHelpers = require("../helper/user_helper");
var {
  RemoveBgResult,
  RemoveBgError,
  removeBackgroundFromImageBase64,
} = require("remove.bg");
var fs = require("fs");
var router = express.Router();
var productHelpers = require("../helper/product_helpers");

/* VERIFY LOGIN */
const verifyLogin = (req, res, next) => {
  if (req.session.LoggedIn) {
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
      const localFile = "./public/product-images/" + id + ".jpg";
      const base64img = fs.readFileSync(localFile, { encoding: "base64" });
      const outputFile = "./public/product-images/" + id + ".jpg";
      removeBackgroundFromImageBase64({
        base64img,
        apiKey: "yvWsrtPwdV2YqW2qWXjW2FRz",
        size: "regular",
        type: "product",
        outputFile,
      })
        .then((result) => {
          console.log(`File saved to ${outputFile}`);
          console.log(result, "resukt----------");
        })
        .catch((errors) => {
          console.log(JSON.stringify(errors));
        });

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
  if (req.session.LoggedIn) {
    res.redirect("/");
  } else {
    res.render("admin/admin-login", {
      LoginErr: req.session.LoginErr,
      admin: true,
    });
    req.session.LoginErr = false;
  }
});

//Post Login page
router.post("/admin-login", (req, res, next) => {
  adminHelpers
    .doLogin(req.body)
    .then((response) => {
      console.log(req.body);
      if (response.status) {
        req.session.LoggedIn = true;
        req.session.admin = response.admin;
        res.redirect("/admin");
      } else {
        req.session.LoginErr = "Invalid username/email or password";
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

router.get("/admin-orders", async (req, res) => {
  let orders = await adminHelpers.getAllOrders();
  res.render("admin/admin-orders", { orders });
});

router.get("/admin-users", async (req, res) => {
  let users = await adminHelpers.getAllUsers();
  res.render("admin/admin-users", { users, admin: true });
});

module.exports = router;

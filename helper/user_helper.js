const { Collection } = require("mongodb");
var objectId = require("mongodb").ObjectId;
const {
  USER_COLLECTION,
  CART_COLLECTION,
  PRODUCT_COLLECTION,
  ORDER_COLLECTION,
} = require("../config/collection");

const db = require("../config/connection");
const bcrypt = require("bcrypt");
const { response } = require("express");
const collection = require("../config/collection");
const Razorpay = require("razorpay");

var instance = new Razorpay({
  key_id: "rzp_test_VLp5PN2oRUJwLd",
  key_secret: "pvNAR1mz7SadK1oglIsLtTdA",
});

module.exports = {
  //SIGNUP=====================================
  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      userData.password = await bcrypt.hash(userData.password, 10);
      console.log(userData);

      db.get()
        .collection(USER_COLLECTION)
        .insertOne(userData)
        .then((data) => {
          console.log(userData);
          // userData._id = data.insertedId;
          resolve(userData);
        })
        .catch((err) => {
          console.log(err);
        });
    });
  },

  //LOGIN=====================================
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {};
      let user = await db
        .get()
        .collection(USER_COLLECTION)
        .findOne({ email: userData.email });
      if (user) {
        bcrypt.compare(userData.password, user.password).then((status) => {
          if (status) {
            response.user = user;
            response.status = true;
            resolve(response);
            console.log("Loginned Successfully");
          } else {
            console.log("Login failed");
            resolve({ status: false });
          }
        });
      } else {
        console.log("user not Found");
      }
    });
  },

  //ADD TO CART_COLLECTION======================================
  addToCart: (proId, userId) => {
    let proObject = {
      item: objectId(proId),
      quantity: 1,
    };
    return new Promise(async (resolve, reject) => {
      let userCart = await db
        .get()
        .collection(CART_COLLECTION)
        .findOne({ user: objectId(userId) });
      if (userCart) {
        let proExist = userCart.product.findIndex(
          (product) => product.item == proId
        );
        if (proExist != -1) {
          db.get()
            .collection(CART_COLLECTION)
            .updateOne(
              { user: objectId(userId), "product.item": objectId(proId) },
              {
                $inc: { "product.$.quantity": 1 },
              }
            )
            .then(() => {
              resolve();
            });
        } else {
          db.get()
            .collection(CART_COLLECTION)
            .updateOne(
              { user: objectId(userId) },
              {
                $push: { product: proObject },
              }
            )
            .then((response) => {
              resolve();
            })
            .catch((err) => {
              return reject(err);
            });
        }
      } else {
        let cartObj = {
          user: objectId(userId),
          product: [proObject],
        };
        console.log(cartObj);

        db.get()
          .collection(CART_COLLECTION)
          .insertOne(cartObj)
          .then(() => {
            resolve();
          })
          .catch((err) => {
            reject(err);
          });
      }
    });
  },

  //GET CART PRODUCTS  ==========================================
  getCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db
        .get()
        .collection(CART_COLLECTION)
        .aggregate([
          {
            $match: { user: objectId(userId) },
          },
          {
            $unwind: "$product",
          },
          {
            $project: {
              item: "$product.item",
              quantity: "$product.quantity",
            },
          },
          {
            $lookup: {
              from: PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
        ])
        .toArray();
      resolve(cartItems);
    });
  },

  //GET CART COUNT========================================
  getCartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let cart = await db
        .get()
        .collection(CART_COLLECTION)
        .findOne({ user: objectId(userId) });
      if (cart) {
        count = cart.product.length;
      }
      resolve(count);
    });
  },

  //CHANGE PRODUCT QUANTITY==============================
  changeProductQuantity: (details) => {
    details.count = parseInt(details.count);
    details.quantity = parseInt(details.quantity);
    return new Promise(async (resolve, reject) => {
      if (details.count == -1 && details.quantity == 1) {
        db.get()
          .collection(CART_COLLECTION)
          .updateOne(
            {
              _id: objectId(details.cart),
            },
            {
              $pull: {
                product: {
                  item: objectId(details.product),
                },
              },
            }
          )
          .then((response) => {
            resolve({ removeProduct: true, status: true });
          });
      } else {
        db.get()
          .collection(CART_COLLECTION)
          .findOneAndUpdate(
            {
              _id: objectId(details.cart),
              "product.item": objectId(details.product),
            },
            {
              $inc: {
                "product.$.quantity": details.count,
              },
            }
          )
          .then((response) => {
            const product = response.value.product.find((prod) =>
              objectId(prod.item).equals(objectId(details.product))
            );
            console.log(product);
            resolve(product, { status: true });
          });
      }
    });
  },
  getTotalPrice: (userId) => {
    return new Promise(async (resolve, reject) => {
      let total = await db
        .get()
        .collection(CART_COLLECTION)
        .aggregate([
          {
            $match: { user: objectId(userId) },
          },
          {
            $unwind: "$product",
          },
          {
            $project: {
              item: "$product.item",
              quantity: "$product.quantity",
            },
          },
          {
            $lookup: {
              from: PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
          {
            $group: {
              _id: null,
              total: {
                $sum: {
                  $multiply: [
                    { $toInt: "$quantity" },
                    { $toInt: "$product.price" },
                  ],
                },
              },
            },
          },
        ])
        .toArray();
      resolve(total[0]?.total);
    });
  },

  removeProduct: (details) => {
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(CART_COLLECTION)
        .updateOne(
          {
            _id: objectId(details.cart),
          },
          {
            $pull: {
              product: {
                item: objectId(details.product),
              },
            },
          }
        )
        .then((response) => {
          resolve({ removeProduct: true });
        });
    });
  },
  pushUserDetails: (pincode, userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(USER_COLLECTION)
        .updateOne(
          { _id: objectId(userId._id) },
          {
            $set: {
              stateName: pincode.state,
              districtName: pincode.district,
            },
          }
        )
        .then((response) => {
          console.log({ response });
          resolve();
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  getUserDetails: (userId) => {
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(USER_COLLECTION)
        .findOne({ _id: objectId(userId._id) });

      resolve(user);
    });
  },
  updateAddress: (address, userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(USER_COLLECTION)
        .updateOne(
          { _id: objectId(userId._id) },
          {
            $set: {
              address: address,
            },
          }
        )
        .then(() => {
          resolve();
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  placeOrder: (orderData, cartProducts) => {
    return new Promise(async (resolve, reject) => {
      // console.log(orderData.paymentMethod);
      let status = orderData.paymentMethod === "COD" ? "placed" : "pending";
      const date = new Date();
      let year = date.getFullYear();
      let month = ("0" + (date.getMonth() + 1)).slice(-2);
      let day = ("0" + date.getDate()).slice(-2);
      const orderObj = {
        deliveryDetails: {
          address: orderData.address,
        },
        userId: objectId(orderData.userId),
        paymentMethod: orderData.paymentMethod,
        products: cartProducts.product,
        status: status,
        totalPrice: orderData.totalPrice,
        date: day + "-" + month + "-" + year,
      };
      db.get()
        .collection(ORDER_COLLECTION)
        .insertOne(orderObj)
        .then((response) => {
          db.get()
            .collection(CART_COLLECTION)
            .deleteOne({ user: objectId(orderData.userId) });
          console.log(orderObj, "=========place order============");
          resolve(response);
        });
    });
  },
  getCartProductList: (userId) => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(CART_COLLECTION)
        .findOne({ user: objectId(userId) });
      resolve(products);
    });
  },
  getOrders: (userId) => {
    return new Promise(async (resolve, reject) => {
      console.log(userId);
      let orders = await db
        .get()
        .collection(ORDER_COLLECTION)
        .find({ userId: objectId(userId) })
        .toArray();
      resolve(orders);
    });
  },
  getAllOrder: () => {
    return new Promise(async (resolve, reject) => {
      let allOrders = await db.get().collection(ORDER_COLLECTION).toArray();
      resolve(allOrders);
    });
  },
  generateRazorPay: (orderId, totalPrice) => {
    console.log(totalPrice);

    return new Promise((resolve, reject) => {
      var options = {
        amount: totalPrice,
        currency: "INR",
        receipt: "" + orderId,
      };
      instance.orders.create(options, function (err, order) {
        if (err) {
          console.log(err);
        } else {
          console.log("New order", order);
          resolve(order);
        }
      });
    });
  },
  verifyRazorpayPayment: (details) => {
    return new Promise(async (resolve, reject) => {
      const crypto = require("crypto");
      let hmac = crypto.createHmac("sha256", "pvNAR1mz7SadK1oglIsLtTdA");
      hmac.update(
        details["payment[razorpay_order_id]"] +
          "|" +
          details["payment[razorpay_payment_id]"]
      );
      hmac = hmac.digest("hex");
      if (hmac == details["payment[razorpay_signature]"]) {
        resolve();
      } else {
        reject();
      }
    });
  },
  chanmgePaymentStatus: (orderId) => {
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(ORDER_COLLECTION)
        .updateOne({ _id: objectId(orderId) }, { $set: { status: "placed" } })
        .then(() => {
          resolve();
        });
    });
  },
  getOrderApproved: (orderId) => {
    return new Promise(async (resolve, reject) => {
      let orderData = await db
        .get()
        .collection(ORDER_COLLECTION)
        .findOne({ _id: objectId(orderId) });
      resolve(orderData);
    });
  },
};

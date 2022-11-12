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
          console.log(data);
          userData._id = data.insertedId;
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
      console.log(userCart + "hello");
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
      resolve(total[0].total);
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
  placeOrder:(orderData,cartProducts)=>{
    return new Promise(async (resolve, reject) => {
      
    });
  }
};

const { Collection } = require("mongodb");
var objectId = require("mongodb").ObjectId;
const {
  USER_COLLECTION,
  CART_COLLECTION,
  PRODUCT_COLLECTION,
} = require("../config/collection");

const db = require("../config/connection");
const bcrypt = require("bcrypt");
const { response } = require("express");

module.exports = {
  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      userData.password = await bcrypt.hash(userData.password, 10);
      db.get()
        .collection(USER_COLLECTION)
        .insertOne(userData)
        .then((data) => {
          userData._id = data.insertedId;
          resolve(userData);
        });
    });
  },
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
  addToCart: (proId, userId) => {
    return new Promise(async (resolve, reject) => {
      let userCart = await db
        .get()
        .collection(CART_COLLECTION)
        .findOne({ user: objectId(userId) });
      console.log(userCart + "hello");
      if (userCart) {
        db.get()
          .collection(CART_COLLECTION)
          .updateOne(
            { user: objectId(userId) },
            {
              $push: { product: objectId(proId) },
            }
          )
          .then((response) => {
            resolve();
          })
          .catch((err) => {
            return reject(err);
          });
      } else {
        let cartObj = {
          user: objectId(userId),
          product: [objectId(proId)],
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
            $lookup: {
              from: PRODUCT_COLLECTION,
              let: { prodLists: "$product" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $in: ["$_id", "$$prodLists"],
                    },
                  },
                },
              ],
              as: "cartItems",
            },
          },
        ])
        .toArray();
      resolve(cartItems[0].cartItems);
      console.log(cartItems);
    });
  },
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
};

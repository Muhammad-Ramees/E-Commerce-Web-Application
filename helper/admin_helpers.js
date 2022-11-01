var objectId = require("mongodb").ObjectId;
const {
  ADMIN_COLLECTION,
  USER_COLLECTION,
  CART_COLLECTION,
  PRODUCT_COLLECTION,
} = require("../config/collection");

const db = require("../config/connection");
const bcrypt = require("bcrypt");
const { response } = require("express");
const collection = require("../config/collection");

module.exports = {
  doSignup: (userData) => {
    return new Promise((resolve, reject) => {
      userData.password = bcrypt.hash(userData.password, 10);
      db.get()
        .collection(ADMIN_COLLECTION)
        .insertOne(userData)
        .then((data) => {
          userData._id = data.insertedId;
          resolve(userData);
        });
    });
  },
};

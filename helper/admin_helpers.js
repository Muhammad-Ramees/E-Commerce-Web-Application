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
  doSignup: (adminData) => {
    return new Promise(async (resolve, reject) => {
      adminData.password = await bcrypt.hash(adminData.password, 10);
      db.get()
        .collection(ADMIN_COLLECTION)
        .insertOne(adminData)
        .then((data) => {
          adminData._id = data.insertedId;
          resolve(adminData);
        });
    });
  },

  //LOGIN=====================================
  doLogin: (adminData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {};
      let admin = await db
        .get()
        .collection(ADMIN_COLLECTION)
        .findOne({ email: adminData.email });
      if (admin) {
        bcrypt.compare(adminData.password, admin.password).then((status) => {
          if (status) {
            response.admin = admin;
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
};

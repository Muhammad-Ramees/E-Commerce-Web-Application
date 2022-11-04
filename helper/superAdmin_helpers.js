var objectId = require("mongodb").ObjectId;
const {
  ADMIN_COLLECTION,
  USER_COLLECTION,
  CART_COLLECTION,
  PRODUCT_COLLECTION,
  SUPERADMIN_COLLECTION,
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
  doLogin: (superAdminData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {};
      let superAdmin = await db
        .get()
        .collection(SUPERADMIN_COLLECTION)
        // .find({ email: superAdminData.email   });
        .findOne({
          $or: [
            { email: superAdminData.email },
            { fullname: superAdminData.email },
          ],
        });
      if (superAdmin) {
        bcrypt
          .compare(superAdminData.password, superAdmin.password)
          .then((status) => {
            if (status) {
              response.superAdmin = superAdmin;
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
  getUsers: () => {
    return new Promise(async (resolve, reject) => {
      let users = await db.get().collection(USER_COLLECTION).find().toArray();
      resolve(users);
    });
  },
};

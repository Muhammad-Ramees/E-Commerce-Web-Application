const { PRODUCT_COLLECTION } = require("../config/collection");
const db = require("../config/connection");
var objectId = require("mongodb").ObjectId;
module.exports = {
  addProduct: (product, callback) => {
    console.log(product);
    db.get()
      .collection(PRODUCT_COLLECTION)
      .insertOne(product)
      .then((data) => {
        console.log(data);
        callback(data.insertedId);
      });
  },
  getAllProducts: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(PRODUCT_COLLECTION)
        .find()
        .toArray();
      resolve(products);
    });
  },
  deleteProduct: (proId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(PRODUCT_COLLECTION)
        .deleteOne({ _id: objectId(proId) })
        .then((response) => {
          resolve(response);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  getProductDetails: (proId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(PRODUCT_COLLECTION)
        .findOne({ _id: objectId(proId) })
        .then((product) => {
          resolve(product);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  updateProduct: (proId, proDetails) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(PRODUCT_COLLECTION)
        .updateOne(
          { _id: objectId(proId) },
          {
            $set: {
              name: proDetails.name,
              description: proDetails.description,
              category: proDetails.category,
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
};

const mongoClient = require("mongodb").MongoClient;
const state = {
  db: null,
};

function connect(done) {
  const url = "mongodb://127.0.0.1:27017";
  const dbname = "ECOMMERCE";

  mongoClient.connect(url, (err, data) => {
    if (err) return done(err);

    state.db = data.db(dbname);
    done();
  });
}

function get() {
  return state.db;
}

module.exports = {
  get,
  connect,
};

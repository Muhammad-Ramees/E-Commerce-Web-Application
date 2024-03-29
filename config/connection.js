const mongoClient = require("mongodb").MongoClient;
const state = {
  db: null,
};

function connect(done) {
  const url =
    "mongodb+srv://ADMIN_DB:AdminDb@124@cluster0.mq1ge5j.mongodb.net/?retryWrites=true&w=majority";
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

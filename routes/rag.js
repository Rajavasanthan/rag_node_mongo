var express = require('express');
var router = express.Router();
var mongoodb = require('mongodb');
/* GET home page. */
router.post('/', async function(req, res, next) {
  try {
    const connection = await mongoodb.MongoClient.connect(process.env.DB);
    const db = connection.db("rag");
    const collection = db.collection("rag_docs");
    const rag = await collection.insertOne({
        name: "Rag",
        age: 30,
        city: "Kolkata",
        });
    res.json(rag);
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;

var express = require("express");
var router = express.Router();
var mongoodb = require("mongodb");
var { OpenAI } = require("openai");
// import pdfjsLib from 'pdfjs-dist';
// const pdfjsLib = require("pdfjs-dist");
// import('pdfjs-dist')
// .then((res)=>{ console.log("Done") })
// .catch((err)=>{ console.log(err) });
const fs = require("fs");

var PDFParser = require("pdf2json");
const pdfParser = new PDFParser(this, 1);

const ai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

/* GET home page. */
router.post("/", async function (req, res, next) {
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

router.get("/doc", async function (req, res, next) {
  try {
    pdfParser.loadPDF("/Users/gridsandguides/RnD/rag_node/group.pdf");
    // let doc = await pdfjsLib.getDocument("./group.pdf").promise;
    res.json("Done");
  } catch (error) {
    console.log(error);
  }
});

router.get("/retrive", async function (req, res, next) {
  try {
    let text = "Hospital covered under the scheme";
    const connection = await mongoodb.MongoClient.connect(process.env.DB);
    const db = connection.db("rag");
    const collection = db.collection("rag_docs");

    const embeding = await ai.embeddings.create({
      input: text,
      model: "text-embedding-ada-002",
    });

    const searchResult = await collection.aggregate([
      {
        $vectorSearch: {
          index: "default",
          path: "embedding",
          queryVector: embeding.data[0].embedding,
          numCandidates: 150,
          limit: 10,
        },
      },
      {
        $project: {
          _id: 0,
          text: 1,
          score: {
            $meta: "vectorSearchScore",
          },
        },
      },
    ]);
    console.log(searchResult);
    let finalResult = [];
    await searchResult.forEach((doc) => finalResult.push(doc.text));

    let chatres = await ai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are a humble helper who can answer for questions asked by users from the given context.",
        },
        {
          role: "user",
          content: `${finalResult.map(
            (doc) => doc + "\n"
          )} From the above context, answer the following question: ${text}`,
        },
      ],
    });
    res.json(chatres.choices[0].message.content);
  } catch (error) {
    console.log(error);
  }
});

router.get("/embedd", async function (req, res, next) {
  try {
    let content = await fs.readFileSync("./content.txt", "utf8");
    let split = content.split("\n");

    const connection = await mongoodb.MongoClient.connect(process.env.DB);
    const db = connection.db("rag");
    const collection = db.collection("rag_docs");

    for (doc of split) {
      console.log(doc);
      const embeding = await ai.embeddings.create({
        input: doc,
        model: "text-embedding-ada-002",
      });

      // console.log(embeding.data[0].embedding);

      await collection.insertOne({
        text: doc,
        embedding: embeding.data[0].embedding,
      });
    }

    res.json(split.length);
  } catch (error) {
    console.log(error);
  }
});

pdfParser.on("pdfParser_dataError", (errData) =>
  console.error(errData.parserError)
);
pdfParser.on("pdfParser_dataReady", async (pdfData) => {
  console.log("Content is ready");
  // console.log(pdfData.Pages[0].Texts[0].R[0]);
  console.log(pdfParser.getRawTextContent());
  await fs.writeFileSync("./content.txt", pdfParser.getRawTextContent());
  console.log(pdfParser.getRawTextContent().split("\n"));
});

module.exports = router;

import express from "express";
import {MongoClient} from "mongodb";
import {MongoDBAtlasVectorSearch} from "langchain/vectorstores/mongodb_atlas";
import {OpenAIEmbeddings} from "langchain/embeddings/openai";
import "dotenv/config";

const router = express.Router();
const namespace = "grindery-vector.default";
const [dbName, collectionName] = namespace.split(".");

router.post("/", async (req, res) => {
  try {
    const {texts, ids} = req.body;
    const client = new MongoClient(process.env.MONGODB_ATLAS_URI || "");
    const collection = client.db(dbName).collection(collectionName);

    await MongoDBAtlasVectorSearch.fromTexts(
      texts,
      ids,
      new OpenAIEmbeddings(),
      {
        collection,
        indexName: "default", // The name of the Atlas search index. Defaults to "default"
        textKey: "text", // The name of the collection field containing the raw content. Defaults to "text"
        embeddingKey: "embedding", // The name of the collection field containing the embedded text. Defaults to "embedding"
      }
    );

    await client.close();
    return res.send();
  } catch (error) {
    console.log("Error: ", error);
  }

  return res.status(500).send();
});

router.get("/", async (req, res) => {
  try {
    const client = new MongoClient(process.env.MONGODB_ATLAS_URI || "");
    const collection = client.db(dbName).collection(collectionName);

    const vectorStore = new MongoDBAtlasVectorSearch(new OpenAIEmbeddings(), {
      collection,
      indexName: "default", // The name of the Atlas search index. Defaults to "default"
      textKey: "text", // The name of the collection field containing the raw content. Defaults to "text"
      embeddingKey: "embedding", // The name of the collection field containing the embedded text. Defaults to "embedding"
    });

    const resultOne = await vectorStore.similaritySearch("Hello world", 1);

    await client.close();
    return res.send(resultOne);
  } catch (error) {
    console.log("Error: ", error);
  }

  return res.status(500).send();
});

router.get("/vector-search/relevance", async (req, res) => {
  try {
    const {text} = req.body;

    const client = new MongoClient(process.env.MONGODB_ATLAS_URI || "");
    const collection = client.db(dbName).collection(collectionName);

    const vectorStore = new MongoDBAtlasVectorSearch(new OpenAIEmbeddings(), {
      collection,
      indexName: "default", // The name of the Atlas search index. Defaults to "default"
      textKey: "text", // The name of the collection field containing the raw content. Defaults to "text"
      embeddingKey: "embedding", // The name of the collection field containing the embedded text. Defaults to "embedding"
    });

    // Using MMR in a vector store retriever
    const retriever = vectorStore.asRetriever({
      searchType: "mmr",
      searchKwargs: {
        fetchK: 20,
        lambda: 0.1,
      },
    });
    const retrieverOutput = await retriever.getRelevantDocuments(text);

    await client.close();
    res.send(retrieverOutput);
  } catch (error) {
    console.log("Error: ", error);
  }

  return res.status(500).send();
});

export default router;

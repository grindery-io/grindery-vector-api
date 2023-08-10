import express from "express";
import {MongoClient} from "mongodb";
import {MongoDBAtlasVectorSearch} from "langchain/vectorstores/mongodb_atlas";
import {OpenAIEmbeddings} from "langchain/embeddings/openai";
import "dotenv/config";

import {CheerioWebBaseLoader} from "langchain/document_loaders/web/cheerio";
import {RecursiveCharacterTextSplitter} from "langchain/text_splitter";

import {ChatOpenAI} from "langchain/chat_models/openai";
import {RetrievalQAChain} from "langchain/chains";

const router = express.Router();
const namespace = "grindery-vector.default";
const [dbName, collectionName] = namespace.split(".");

router.post("/", async (req, res) => {
  try {
    const {metadata} = req.body;
    const client = new MongoClient(process.env.MONGODB_ATLAS_URI || "");
    const collection = client.db(dbName).collection(collectionName);
    const loader = new CheerioWebBaseLoader(metadata.url);
    const data = await loader.load();
    data.filter((data) => {
      data.metadata.agent = metadata.agent;
      data.metadata.tag = metadata.tag;
    });

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 0,
    });
    const splitDocs = await textSplitter.splitDocuments(data);

    await MongoDBAtlasVectorSearch.fromDocuments(
      splitDocs,
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

router.post("/vector-search", async (req, res) => {
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
    const model = new ChatOpenAI({modelName: "gpt-3.5-turbo"});
    const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever(), {
      returnSourceDocuments: true,
    });

    const response = await chain.call({
      query: text,
    });

    await client.close();
    return res.send(response);
  } catch (error) {
    console.log("Error: ", error);
  }

  return res.status(500).send();
});

router.post("/vector-search/relevance", async (req, res) => {
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

router.delete("/", async (req, res) => {
  try {
    const {text, id} = req.body;
    const client = new MongoClient(process.env.MONGODB_ATLAS_URI || "");
    const collection = client.db(dbName).collection(collectionName);

    const vectorStore = new MongoDBAtlasVectorSearch(new OpenAIEmbeddings(), {
      collection,
      indexName: "default", // The name of the Atlas search index. Defaults to "default"
      textKey: "text", // The name of the collection field containing the raw content. Defaults to "text"
      embeddingKey: "embedding", // The name of the collection field containing the embedded text. Defaults to "embedding"
    });

    const resultOne = await vectorStore.similaritySearch(text);

    await client.close();
    return res.send(resultOne);
  } catch (error) {
    console.log("Error: ", error);
  }

  return res.status(500).send();
});

export default router;

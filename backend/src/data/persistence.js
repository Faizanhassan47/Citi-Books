import { MongoClient, ServerApiVersion } from "mongodb";
import { env } from "../config/env.js";
import { db } from "./mockDb.js";
import { normalizeUserPasswords } from "../utils/passwords.js";

const collectionNames = [
  "users",
  "attendance",
  "tasks",
  "clients",
  "categories",
  "subcategories",
  "demands",
  "bills",
  "inventory",
  "logs"
];

let client;
let database;

function normalizeDocument(document) {
  const { _id, ...rest } = document;
  return rest;
}

function getCollection(name) {
  return database?.collection(name);
}

export async function initPersistence() {
  normalizeUserPasswords(db.users);

  client = new MongoClient(env.mongodbUri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true
    }
  });

  await client.connect();
  database = client.db(env.databaseName);
  await database.command({ ping: 1 });

  for (const name of collectionNames) {
    const collection = getCollection(name);
    const existingDocuments = await collection.find({}).toArray();

    if (existingDocuments.length === 0 && db[name].length > 0) {
      await collection.insertMany(db[name]);
    }

    const documents = await collection.find({}).toArray();
    db[name].splice(0, db[name].length, ...documents.map(normalizeDocument));

    if (name === "users" && normalizeUserPasswords(db.users)) {
      await collection.deleteMany({});
      await collection.insertMany(db.users);
    }
  }

  console.log(`MongoDB connected to database "${env.databaseName}"`);
}

export async function syncCollection(name) {
  const collection = getCollection(name);

  if (!collection) {
    return;
  }

  await collection.deleteMany({});

  if (db[name].length > 0) {
    await collection.insertMany(db[name]);
  }
}

export async function closePersistence() {
  if (client) {
    await client.close();
  }
}

// netlify/functions/utils/db.js  
const { MongoClient } = require('mongodb');  

// Shared database connection  
let cachedClient = null;  
let cachedDb = null;  

async function connectToDatabase() {  
  if (cachedClient && cachedDb) {  
    return { client: cachedClient, db: cachedDb };  
  }  

  try {  
    // Get MongoDB URI from environment variable  
    const MONGODB_URI = process.env.MONGODB_URI;  
    
    if (!MONGODB_URI) {  
      throw new Error('MONGODB_URI environment variable not set');  
    }  

    console.log("Connecting to MongoDB Atlas...");  
    const client = new MongoClient(MONGODB_URI, {  
      useNewUrlParser: true,  
      useUnifiedTopology: true,  
      serverSelectionTimeoutMS: 10000  
    });  

    await client.connect();  
    
    // Get database name from URI or default to 'wegrow'  
    const dbName = MONGODB_URI.includes('/') ?   
      MONGODB_URI.split('/').pop().split('?')[0] :   
      'wegrow';  
    
    const db = client.db(dbName);  
    console.log(`Connected to MongoDB database '${dbName}'`);  

    cachedClient = client;  
    cachedDb = db;  
    
    return { client, db };  
  } catch (err) {  
    console.error("MongoDB connection error:", err);  
    throw err;  
  }  
}  

module.exports = { connectToDatabase };  
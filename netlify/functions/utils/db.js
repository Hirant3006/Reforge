// utils/db.js  
const { MongoClient } = require('mongodb');  

let cachedDb = null;  

async function connectToDatabase() {  
  if (cachedDb) {  
    console.log('Using cached database connection');  
    return { db: cachedDb };  
  }  
  
  console.log('Creating new database connection');  
  
  const MONGODB_URI = process.env.MONGODB_URI;  
  console.log('Connection string (redacted):', MONGODB_URI.replace(/\/\/(.+?)@/, '//***:***@'));  
  
  const client = new MongoClient(MONGODB_URI, {  
    useNewUrlParser: true,  
    useUnifiedTopology: true,  
  });  
  
  await client.connect();  
  
  // Extract database name from URI or use default  
  const dbName = MONGODB_URI.includes('/') ?   
    MONGODB_URI.split('/').pop().split('?')[0] :   
    'wegrow';  
  
  console.log('Using database:', dbName);  
  
  const db = client.db(dbName);  
  cachedDb = db;  
  
  return { db };  
}  

module.exports = { connectToDatabase };  
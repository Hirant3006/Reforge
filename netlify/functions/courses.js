// netlify/functions/courses.js  
const { MongoClient } = require('mongodb');  

// Database connection handler  
let cachedClient = null;  
let cachedDb = null;  

async function connectToDatabase() {  
  if (cachedClient && cachedDb) {  
    return { client: cachedClient, db: cachedDb };  
  }  

  try {  
    console.log("Connecting to local MongoDB...");  
    
    // Connect to MongoDB on localhost  
    const client = new MongoClient("mongodb://localhost:27017", {  
      useNewUrlParser: true,  
      useUnifiedTopology: true  
    });  

    await client.connect();  
    console.log("Connected to MongoDB successfully");  
    
    // Use the wegrow database  
    const db = client.db('wegrow');  
    console.log("Using 'wegrow' database");  
    
    cachedClient = client;  
    cachedDb = db;  
    
    return { client, db };  
  } catch (err) {  
    console.error("MongoDB connection error:", err);  
    throw err;  
  }  
}  

exports.handler = async function(event, context) {  
  // Prevents connection pool from staying open  
  context.callbackWaitsForEmptyEventLoop = false;  
  
  try {  
    // Connect to database  
    const { db } = await connectToDatabase();  
    
    // Get all courses  
    console.log("Fetching courses...");  
    const courses = await db.collection('courses').find({}).sort({ title: 1 }).toArray();  
    console.log(`Found ${courses.length} courses`);  
    
    return {  
      statusCode: 200,  
      headers: {  
        'Access-Control-Allow-Origin': '*',  
        'Content-Type': 'application/json'  
      },  
      body: JSON.stringify(courses)  
    };  
  } catch (error) {  
    console.error('Courses function error:', error);  
    
    return {  
      statusCode: 500,  
      headers: {  
        'Access-Control-Allow-Origin': '*',  
        'Content-Type': 'application/json'  
      },  
      body: JSON.stringify({   
        error: 'Failed to fetch courses',  
        message: error.message,  
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined  
      })  
    };  
  }  
};  
// netlify/functions/local-db-check.js  
const { MongoClient } = require('mongodb');  

exports.handler = async function(event, context) {  
  context.callbackWaitsForEmptyEventLoop = false;  
  
  try {  
    console.log("Checking local MongoDB database...");  
    
    // Connect to MongoDB on localhost  
    const client = new MongoClient("mongodb://localhost:27017", {  
      useNewUrlParser: true,  
      useUnifiedTopology: true  
    });  
    
    await client.connect();  
    console.log("Connected to MongoDB successfully");  
    
    // Use the wegrow database  
    const db = client.db('wegrow');  
    
    // List all collections  
    const collections = await db.listCollections().toArray();  
    console.log("Collections in 'wegrow' database:", collections.map(c => c.name));  
    
    // Document counts for each collection  
    const collectionCounts = {};  
    for (const collection of collections) {  
      collectionCounts[collection.name] = await db.collection(collection.name).countDocuments();  
    }  
    
    // Sample documents from each collection  
    const sampleDocuments = {};  
    for (const collection of collections) {  
      const samples = await db.collection(collection.name).find().limit(1).toArray();  
      if (samples.length > 0) {  
        // Just get the field names to avoid large responses  
        sampleDocuments[collection.name] = {  
          fields: Object.keys(samples[0]),  
          sampleId: samples[0]._id  
        };  
      }  
    }  
    
    // Close the connection  
    await client.close();  
    
    return {  
      statusCode: 200,  
      headers: {  
        'Access-Control-Allow-Origin': '*',  
        'Content-Type': 'application/json'  
      },  
      body: JSON.stringify({  
        database: 'wegrow',  
        collections: collections.map(c => c.name),  
        collectionCounts,  
        sampleDocuments  
      }, null, 2)  
    };  
  } catch (error) {  
    console.error("Local database check error:", error);  
    
    return {  
      statusCode: 500,  
      headers: {  
        'Access-Control-Allow-Origin': '*',  
        'Content-Type': 'application/json'  
      },  
      body: JSON.stringify({  
        error: 'Local database check failed',  
        message: error.message,  
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined  
      })  
    };  
  }  
};  
// netlify/functions/roadmaps.js  
const { MongoClient } = require('mongodb');

// Database connection handler  
let cachedClient = null;  
let cachedDb = null;  

async function connectToDatabase() {  
  if (cachedClient && cachedDb) {  
    return { client: cachedClient, db: cachedDb };  
  }  

  try {  
    console.log("Connecting to MongoDB...");  

    // Get MongoDB URI from environment variable  
    const MONGODB_URI = process.env.MONGODB_URI;  
    
    if (!MONGODB_URI) {  
      throw new Error('MONGODB_URI environment variable is not set');  
    }  

    // Connect to MongoDB Atlas instead of localhost  
    const client = new MongoClient(MONGODB_URI, {  
      useNewUrlParser: true,  
      useUnifiedTopology: true  
    });  

    await client.connect();  
    console.log("Connected to MongoDB successfully");  

    // Get database name from URI or use default  
    const dbName = MONGODB_URI.includes('/') ?   
      MONGODB_URI.split('/').pop().split('?')[0] :   
      'wegrow';  
      
    const db = client.db(dbName);  
    console.log(`Using '${dbName}' database`);  

    cachedClient = client;  
    cachedDb = db;  

    return { client, db };  
  } catch (err) {  
    console.error("MongoDB connection error:", err);  
    throw err;  
  }  
}  
exports.handler = async function (event, context) {
  // Prevents connection pool from staying open  
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    // Connect to database  
    const { db } = await connectToDatabase();

    // Hardcoded roadmap categories based on the provided mapping  
    const roadmapCategories = [
      {
        _id: "2",
        title: "Product",
        slug: "product",
        shortDescription: "Product management and strategy courses"
      },
      {
        _id: "4",
        title: "Engineering",
        slug: "engineering",
        shortDescription: "Software engineering and technical leadership courses"
      },
      {
        _id: "3",
        title: "Marketing",
        slug: "marketing",
        shortDescription: "Marketing and growth courses"
      }
    ];

    // Get all courses  
    console.log("Fetching all courses...");
    const allCourses = await db.collection('courses').find({}).sort({ title: 1 }).toArray();

    console.log(`Found ${allCourses.length} courses total`);

    // Build roadmaps with courses  
    const roadmapsWithCourses = roadmapCategories.map(category => {
      // Find courses with matching apiCategoryID  
      const categoryCourses = allCourses.filter(course => {
        return   course.apiCategoryId.toString() === category._id
      }
      );

      console.log(`Found ${categoryCourses.length} courses for category ${category.title}`);

      // Structure the response to match the expected format  
      return {
        ...category,
        terms: [
          {
            _id: `term-${category._id}`,
            name: "All Courses",
            apiId: category._id,
            courses: categoryCourses
          }
        ]
      };
    });

    return {
      statusCode: 200,
      headers: {
'Access-Control-Allow-Origin': '*', // Or restrict to specific domains like 'https://hoccunghuy.netlify.app'  
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',  
    'Access-Control-Allow-Headers': 'Content-Type',  
    'Access-Control-Max-Age': '86400'  ,        'Content-Type': 'application/json'
      },
      body: JSON.stringify(roadmapsWithCourses)
    };
  } catch (error) {
    console.error('Roadmaps function error:', error);

    return {
      statusCode: 500,
      headers: {
'Access-Control-Allow-Origin': '*', // Or restrict to specific domains like 'https://hoccunghuy.netlify.app'  
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',  
    'Access-Control-Allow-Headers': 'Content-Type',  
    'Access-Control-Max-Age': '86400'  ,        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Failed to fetch roadmaps',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};  
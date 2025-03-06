// netlify/functions/lesson-detail.js  
const { MongoClient, ObjectId } = require('mongodb');  

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

  // Get the course slug and lesson slug from query parameters  
  const { courseSlug, lessonSlug } = event.queryStringParameters || {};  

  if (!courseSlug || !lessonSlug) {  
    return {  
      statusCode: 400,  
      headers: {  
        'Access-Control-Allow-Origin': '*',  
        'Content-Type': 'application/json'  
      },  
      body: JSON.stringify({  
        error: 'Missing course slug or lesson slug parameters'  
      })  
    };  
  }  

  try {  
    // Connect to database  
    const { db } = await connectToDatabase();  

    // Find the course first  
    console.log(`Fetching course with slug: ${courseSlug}`);  
    const course = await db.collection('courses').findOne({ slug: courseSlug });  

    if (!course) {  
      return {  
        statusCode: 404,  
        headers: {  
          'Access-Control-Allow-Origin': '*',  
          'Content-Type': 'application/json'  
        },  
        body: JSON.stringify({  
          error: 'Course not found'  
        })  
      };  
    }  

    // Initialize lesson variable  
    let lesson = null;  

    // Check if lessons are embedded in the course document  
    if (course.lessons && Array.isArray(course.lessons)) {  
      lesson = course.lessons.find(l => (l.slug === lessonSlug) || (l._id && l._id.toString() === lessonSlug));  
    }   
    
    // Check in sections if lessons not found  
    if (!lesson && course.sections && Array.isArray(course.sections)) {  
      lesson = course.sections.find(l => (l.slug === lessonSlug) || (l._id && l._id.toString() === lessonSlug));  
    }  

    // Check in modules if lessons not found  
    if (!lesson && course.modules && Array.isArray(course.modules)) {  
      for (const module of course.modules) {  
        if (module.lessons && Array.isArray(module.lessons)) {  
          const foundLesson = module.lessons.find(l =>   
            (l.slug === lessonSlug) || (l._id && l._id.toString() === lessonSlug)  
          );  
          
          if (foundLesson) {  
            lesson = { ...foundLesson, moduleName: module.name || module.title };  
            break;  
          }  
        }  
      }  
    }  

    // If lesson not found in course document, look for it in a separate collection  
    if (!lesson) {  
      console.log(`Lesson not found in course document, checking lessons collection...`);  
      
      // Try to match by ID if lessonSlug looks like an ObjectID  
      let query = { courseId: course._id.toString() };  
      
      if (lessonSlug.match(/^[0-9a-fA-F]{24}$/)) {  
        // It's an ObjectId  
        query = {   
          $or: [  
            { _id: new ObjectId(lessonSlug) },  
            { slug: lessonSlug }  
          ]  
        };  
      } else {  
        // It's a slug  
        query = { slug: lessonSlug };  
      }  
      
      lesson = await db.collection('lessons').findOne(query);  
    }  

    if (!lesson) {  
      return {  
        statusCode: 404,  
        headers: {  
          'Access-Control-Allow-Origin': '*',  
          'Content-Type': 'application/json'  
        },  
        body: JSON.stringify({  
          error: 'Lesson not found'  
        })  
      };  
    }  

    return {  
      statusCode: 200,  
      headers: {  
        'Access-Control-Allow-Origin': '*',  
        'Content-Type': 'application/json'  
      },  
      body: JSON.stringify({  
        lesson,  
        course  
      })  
    };  
  } catch (error) {  
    console.error('Lesson detail function error:', error);  

    return {  
      statusCode: 500,  
      headers: {  
        'Access-Control-Allow-Origin': '*',  
        'Content-Type': 'application/json'  
      },  
      body: JSON.stringify({  
        error: 'Failed to fetch lesson',  
        message: error.message  
      })  
    };  
  }  
}  
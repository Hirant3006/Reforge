const { MongoClient, ObjectId } = require('mongodb');  

// Database connection handler  
let cachedClient = null;  
let cachedDb = null;  

async function connectToDatabase() {  
  if (cachedClient && cachedDb) {  
    return { client: cachedClient, db: cachedDb };  
  }  
  
  // Connect to MongoDB  
  const client = new MongoClient(process.env.MONGODB_URI, {  
    useNewUrlParser: true,  
    useUnifiedTopology: true  
  });  

  await client.connect();  
  const db = client.db('reforge'); // Specify your database name here  
  
  cachedClient = client;  
  cachedDb = db;  
  
  return { client, db };  
}  

exports.handler = async function(event, context) {  
  // Prevents connection pool from staying open  
  context.callbackWaitsForEmptyEventLoop = false;  
  
  // Get course slug from the path parameter  
  const courseSlug = event.path.split('/').pop();  
  
  if (!courseSlug) {  
    return {  
      statusCode: 400,  
      headers: {  
'Access-Control-Allow-Origin': '*', // Or restrict to specific domains like 'https://hoccunghuy.netlify.app'  
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',  
    'Access-Control-Allow-Headers': 'Content-Type',  
    'Access-Control-Max-Age': '86400'  ,         },  
      body: JSON.stringify({ error: 'Course slug is required' })  
    };  
  }  
  
  try {  
    // Connect to database  
    const { db } = await connectToDatabase();  
    
    // Get the course  
    const course = await db.collection('courses').findOne({ slug: courseSlug });  
    
    if (!course) {  
      return {  
        statusCode: 404,  
        headers: {  
'Access-Control-Allow-Origin': '*', // Or restrict to specific domains like 'https://hoccunghuy.netlify.app'  
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',  
    'Access-Control-Allow-Headers': 'Content-Type',  
    'Access-Control-Max-Age': '86400'  ,           },  
        body: JSON.stringify({ error: 'Course not found' })  
      };  
    }  
    
    // Get sections for this course  
    const sections = await db.collection('sections')  
      .find({ courseId: new ObjectId(course._id) })  
      .sort({ order: 1 })  
      .toArray();  
    
    // For each section, get its lessons  
    const sectionsWithLessons = await Promise.all(sections.map(async (section) => {  
      const lessons = await db.collection('lessons')  
        .find({ sectionId: new ObjectId(section._id) })  
        .sort({ order: 1 })  
        .toArray();  
      
      return {  
        ...section,  
        lessons  
      };  
    }));  
    
    // Return the course with sections and lessons  
    return {  
      statusCode: 200,  
      headers: {  
'Access-Control-Allow-Origin': '*', // Or restrict to specific domains like 'https://hoccunghuy.netlify.app'  
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',  
    'Access-Control-Allow-Headers': 'Content-Type',  
    'Access-Control-Max-Age': '86400'  ,         },  
      body: JSON.stringify({  
        ...course,  
        sections: sectionsWithLessons  
      })  
    };  
  } catch (error) {  
    console.error('Error:', error);  
    
    return {  
      statusCode: 500,  
      headers: {  
'Access-Control-Allow-Origin': '*', // Or restrict to specific domains like 'https://hoccunghuy.netlify.app'  
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',  
    'Access-Control-Allow-Headers': 'Content-Type',  
    'Access-Control-Max-Age': '86400'  ,         },  
      body: JSON.stringify({ error: 'Failed to fetch course details' })  
    };  
  }  
};  
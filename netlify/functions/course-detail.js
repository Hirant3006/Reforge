// netlify/functions/course-detail.js  
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

  // Get the course slug from the query parameters  
  const { slug } = event.queryStringParameters || {};  

  if (!slug) {  
    return {  
      statusCode: 400,  
      headers: {  
        'Access-Control-Allow-Origin': '*',  
        'Content-Type': 'application/json'  
      },  
      body: JSON.stringify({  
        error: 'Missing course slug parameter'  
      })  
    };  
  }  

  try {  
    // Connect to database  
    const { db } = await connectToDatabase();  

    // Find the course by slug  
    console.log(`Fetching course with slug: ${slug}`);  
    const course = await db.collection('courses').findOne({ slug });  

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

    // Process sections  
    if (course.sections && Array.isArray(course.sections)) {  
      console.log("Found sections array in course data");  
      
      // Get all section IDs from the course  
      const sectionIds = course.sections.map(section => {  
        // Handle different section formats:  
        // 1. Section could be an ObjectId already  
        if (section instanceof ObjectId) {  
          return section;  
        }  
        // 2. Section could be a string ID  
        else if (typeof section === 'string' && section.match(/^[0-9a-fA-F]{24}$/)) {  
          return new ObjectId(section);  
        }  
        // 3. Section could be an object with _id property  
        else if (section && typeof section === 'object' && section._id) {  
          if (section._id instanceof ObjectId) {  
            return section._id;  
          } else if (typeof section._id === 'string') {  
            return new ObjectId(section._id);  
          }  
          return section._id;  
        }  
        
        console.log("Unrecognized section format:", section);  
        return null;  
      }).filter(id => id !== null);  
      
      console.log(`Found ${sectionIds.length} valid section IDs`);  
      
      // Fetch all section documents  
      if (sectionIds.length > 0) {  
        // Sort by showIndex, then order, then title as fallbacks  
        const fetchedSections = await db.collection('sections').find({  
          _id: { $in: sectionIds }  
        }).sort({ showIndex: 1, order: 1, title: 1 }).toArray();  
        
        console.log(`Retrieved ${fetchedSections.length} section documents`);  
        
        // Process each section to fetch its lessons  
        for (const section of fetchedSections) {  
          const sectionId = section._id.toString();  
          console.log(`Processing section "${section.title || 'Untitled'}" (${sectionId})`);  
          
          // If the section already has a lessons array with objects  
          if (section.lessons &&   
              Array.isArray(section.lessons) &&   
              section.lessons.length > 0 &&   
              typeof section.lessons[0] === 'object') {  
            console.log(`Section already has ${section.lessons.length} lesson objects`);  
            // Sort lessons by showIndex even if they're already loaded  
            section.lessons.sort((a, b) => {  
              // First by showIndex  
              const indexA = a.showIndex !== undefined ? a.showIndex : Number.MAX_SAFE_INTEGER;  
              const indexB = b.showIndex !== undefined ? b.showIndex : Number.MAX_SAFE_INTEGER;  
              if (indexA !== indexB) return indexA - indexB;  
              
              // Then by order  
              const orderA = a.order !== undefined ? a.order : Number.MAX_SAFE_INTEGER;  
              const orderB = b.order !== undefined ? b.order : Number.MAX_SAFE_INTEGER;  
              if (orderA !== orderB) return orderA - orderB;  
              
              // Finally by title  
              return (a.title || '').localeCompare(b.title || '');  
            });  
            continue;  
          }  
          
          // If the section has lesson IDs  
          let lessonIds = [];  
          if (section.lessons && Array.isArray(section.lessons)) {  
            lessonIds = section.lessons.map(lessonItem => {  
              if (lessonItem instanceof ObjectId) {  
                return lessonItem;  
              } else if (typeof lessonItem === 'string' && lessonItem.match(/^[0-9a-fA-F]{24}$/)) {  
                return new ObjectId(lessonItem);  
              } else if (lessonItem && typeof lessonItem === 'object' && lessonItem._id) {  
                return lessonItem._id instanceof ObjectId ?   
                       lessonItem._id :   
                       new ObjectId(lessonItem._id);  
              }  
              return null;  
            }).filter(id => id !== null);  
            
            console.log(`Found ${lessonIds.length} lesson IDs in section`);  
          }  
          
          // Fetch lessons by ID if available, or by sectionId  
          let fetchedLessons = [];  
          if (lessonIds.length > 0) {  
            // Sort by showIndex, then order, then title as fallbacks  
            fetchedLessons = await db.collection('lessons').find({  
              _id: { $in: lessonIds }  
            }).sort({ showIndex: 1, order: 1, title: 1 }).toArray();  
            
            console.log(`Found ${fetchedLessons.length} lessons by ID`);  
          } else {  
            // Try to find lessons by sectionId  
            // Sort by showIndex, then order, then title as fallbacks  
            fetchedLessons = await db.collection('lessons').find({  
              $or: [  
                { sectionId: sectionId },  
                { sectionId: new ObjectId(sectionId) }  
              ]  
            }).sort({ showIndex: 1, order: 1, title: 1 }).toArray();  
            
            console.log(`Found ${fetchedLessons.length} lessons by sectionId`);  
          }  
          
          // Update the section with the fetched lessons  
          section.lessons = fetchedLessons;  
        }  
        
        // Replace the course sections with the fetched sections  
        course.sections = fetchedSections;  
        
      } else {  
        console.log("No valid section IDs found");  
        course.sections = [];  
      }  
    } else {  
      console.log("Course has no sections array");  
      course.sections = [];  
    }  

    return {  
      statusCode: 200,  
      headers: {  
        'Access-Control-Allow-Origin': '*',  
        'Content-Type': 'application/json'  
      },  
      body: JSON.stringify({  
        course  
      })  
    };  
  } catch (error) {  
    console.error('Course detail function error:', error);  

    return {  
      statusCode: 500,  
      headers: {  
        'Access-Control-Allow-Origin': '*',  
        'Content-Type': 'application/json'  
      },  
      body: JSON.stringify({  
        error: 'Failed to fetch course',  
        message: error.message,  
        stack: error.stack  
      })  
    };  
  }  
};  
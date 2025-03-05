const mongoose = require('mongoose');  

// Define schema  
const courseSchema = new mongoose.Schema({  
  title: String,  
  slug: String,  
  shortDescription: String,  
  instructors: [{  
    displayName: String  
  }],  
  lessonsCount: Number,  
  updatedAt: Date  
});  

// Database connection handler  
let cachedDb = null;  
async function connectToDatabase() {  
  if (cachedDb) {  
    return cachedDb;  
  }  

  // Connect to MongoDB  
  const connection = await mongoose.connect(process.env.MONGODB_URI, {  
    useNewUrlParser: true,  
    useUnifiedTopology: true  
  });  
  
  // Define model  
  const Course = mongoose.model('Course', courseSchema);  
  
  cachedDb = {  
    connection,  
    Course  
  };  
  
  return cachedDb;  
}  

exports.handler = async function(event, context) {  
  // Prevents connection pool from staying open  
  context.callbackWaitsForEmptyEventLoop = false;  
  
  try {  
    // Connect to database  
    const db = await connectToDatabase();  
    
    // Get all courses  
    const courses = await db.Course.find({}).sort({ title: 1 }).lean();  
    
    return {  
      statusCode: 200,  
      body: JSON.stringify(courses)  
    };  
  } catch (error) {  
    console.error(error);  
    
    return {  
      statusCode: 500,  
      body: JSON.stringify({ error: 'Failed to fetch courses' })  
    };  
  }  
};  
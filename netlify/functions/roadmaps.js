const mongoose = require('mongoose');  

// Define schemas  
const roadmapSchema = new mongoose.Schema({  
  title: String,  
  slug: String,  
  shortDescription: String,  
  updatedAt: Date  
});  

const termSchema = new mongoose.Schema({  
  name: String,  
  apiId: String,  
  roadmapId: mongoose.Schema.Types.ObjectId  
});  

const courseSchema = new mongoose.Schema({  
  title: String,  
  slug: String,  
  shortDescription: String,  
  instructors: [{  
    displayName: String  
  }],  
  lessonsCount: Number  
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
  
  // Define models  
  const Roadmap = mongoose.model('Roadmap', roadmapSchema);  
  const Term = mongoose.model('Term', termSchema);  
  const Course = mongoose.model('Course', courseSchema);  
  
  cachedDb = {  
    connection,  
    Roadmap,  
    Term,  
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
    
    // Get all roadmaps  
    const roadmaps = await db.Roadmap.find({}).sort({ title: 1 }).lean();  
    
    // For each roadmap, get its terms and courses  
    const roadmapsWithTerms = await Promise.all(roadmaps.map(async (roadmap) => {  
      // Get terms for this roadmap  
      const terms = await db.Term.find({ roadmapId: roadmap._id }).sort({ name: 1 }).lean();  
      
      // For each term, get its courses  
      const termsWithCourses = await Promise.all(terms.map(async (term) => {  
        // This is a simplified approach - you would need to define the relationship between terms and courses in your actual data model  
        const courses = await db.Course.find({ termId: term._id }).sort({ title: 1 }).lean();  
        
        return {  
          ...term,  
          courses  
        };  
      }));  
      
      return {  
        ...roadmap,  
        terms: termsWithCourses  
      };  
    }));  
    
    return {  
      statusCode: 200,  
      body: JSON.stringify(roadmapsWithTerms)  
    };  
  } catch (error) {  
    console.error(error);  
    
    return {  
      statusCode: 500,  
      body: JSON.stringify({ error: 'Failed to fetch roadmaps' })  
    };  
  }  
};  
const mongoose = require('mongoose');  

// Define schemas  
const courseSchema = new mongoose.Schema({  
  title: String,  
  slug: String,  
  shortDescription: String,  
  longDescription: String,  
  instructors: [{  
    displayName: String,  
    bio: String  
  }],  
  updatedAt: Date  
});  

const sectionSchema = new mongoose.Schema({  
  title: String,  
  order: Number,  
  courseId: mongoose.Schema.Types.ObjectId  
});  

const lessonSchema = new mongoose.Schema({  
  title: String,  
  content: String,  
  videoUrl: String,  
  slidesUrl: String,  
  videoDuration: Number,  
  sectionId: mongoose.Schema.Types.ObjectId,  
  order: Number,  
  typeLesson: String,  
  tag: String  
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
  const Course = mongoose.model('Course', courseSchema);  
  const Section = mongoose.model('Section', sectionSchema);  
  const Lesson = mongoose.model('Lesson', lessonSchema);  
  
  cachedDb = {  
    connection,  
    Course,  
    Section,  
    Lesson  
  };  
  
  return cachedDb;  
}  

exports.handler = async function(event, context) {  
  // Prevents connection pool from staying open  
  context.callbackWaitsForEmptyEventLoop = false;  
  
  // Get course slug from the path parameter  
  const courseSlug = event.path.split('/').pop();  
  
  if (!courseSlug) {  
    return {  
      statusCode: 400,  
      body: JSON.stringify({ error: 'Course slug is required' })  
    };  
  }  
  
  try {  
    // Connect to database  
    const db = await connectToDatabase();  
    
    // Get the course  
    const course = await db.Course.findOne({ slug: courseSlug }).lean();  
    
    if (!course) {  
      return {  
        statusCode: 404,  
        body: JSON.stringify({ error: 'Course not found' })  
      };  
    }  
    
    // Get sections for this course  
    const sections = await db.Section.find({ courseId: course._id }).sort({ order: 1 }).lean();  
    
    // For each section, get its lessons  
    const sectionsWithLessons = await Promise.all(sections.map(async (section) => {  
      const lessons = await db.Lesson.find({ sectionId: section._id }).sort({ order: 1 }).lean();  
      
      return {  
        ...section,  
        lessons  
      };  
    }));  
    
    // Return the course with sections and lessons  
    return {  
      statusCode: 200,  
      body: JSON.stringify({  
        ...course,  
        sections: sectionsWithLessons  
      })  
    };  
  } catch (error) {  
    console.error(error);  
    
    return {  
      statusCode: 500,  
      body: JSON.stringify({ error: 'Failed to fetch course details' })  
    };  
  }  
};  
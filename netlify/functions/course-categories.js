// netlify/functions/course-categories.js  
const { MongoClient } = require('mongodb');  

exports.handler = async function(event, context) {  
  context.callbackWaitsForEmptyEventLoop = false;  
  
  try {  
    console.log("Testing course categories...");  
    
    const client = new MongoClient(process.env.MONGODB_URI, {  
      useNewUrlParser: true,  
      useUnifiedTopology: true  
    });  
    
    await client.connect();  
    console.log("Connected to MongoDB successfully");  
    
    const db = client.db('reforge');  
    
    // Get all courses  
    const courses = await db.collection('courses').find({}).toArray();  
    console.log(`Found ${courses.length} courses total`);  
    
    // Check apiCategoryID distribution  
    const categoryCount = {  
      "2": 0,  // Product  
      "3": 0,  // Marketing  
      "4": 0,  // Engineering  
      "other": 0,  
      "missing": 0  
    };  
    
    const samplesByCategory = {  
      "2": [],  
      "3": [],  
      "4": [],  
      "other": [],  
      "missing": []  
    };  
    
    courses.forEach(course => {  
      if (!course.apiCategoryID) {  
        categoryCount.missing++;  
        if (samplesByCategory.missing.length < 3) {  
          samplesByCategory.missing.push({  
            _id: course._id,  
            title: course.title,  
            fields: Object.keys(course)  
          });  
        }  
      } else {  
        const categoryId = course.apiCategoryID.toString();  
        if (["2", "3", "4"].includes(categoryId)) {  
          categoryCount[categoryId]++;  
          if (samplesByCategory[categoryId].length < 3) {  
            samplesByCategory[categoryId].push({  
              _id: course._id,  
              title: course.title,  
              apiCategoryID: course.apiCategoryID  
            });  
          }  
        } else {  
          categoryCount.other++;  
          if (samplesByCategory.other.length < 3) {  
            samplesByCategory.other.push({  
              _id: course._id,  
              title: course.title,  
              apiCategoryID: course.apiCategoryID  
            });  
          }  
        }  
      }  
    });  
    
    // Close the connection  
    await client.close();  
    
    return {  
      statusCode: 200,  
      headers: {  
'Access-Control-Allow-Origin': '*', // Or restrict to specific domains like 'https://hoccunghuy.netlify.app'  
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',  
    'Access-Control-Allow-Headers': 'Content-Type',  
    'Access-Control-Max-Age': '86400'  ,        'Content-Type': 'application/json'  
      },  
      body: JSON.stringify({  
        totalCourses: courses.length,  
        categoryCounts: categoryCount,  
        samples: samplesByCategory  
      })  
    };  
  } catch (error) {  
    console.error("Course categories test error:", error);  
    
    return {  
      statusCode: 500,  
      headers: {  
'Access-Control-Allow-Origin': '*', // Or restrict to specific domains like 'https://hoccunghuy.netlify.app'  
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',  
    'Access-Control-Allow-Headers': 'Content-Type',  
    'Access-Control-Max-Age': '86400'  ,        'Content-Type': 'application/json'  
      },  
      body: JSON.stringify({  
        error: 'Course categories test failed',  
        message: error.message,  
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined  
      })  
    };  
  }  
};  
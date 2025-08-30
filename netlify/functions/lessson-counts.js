// netlify/functions/lesson-counts.js  
const { MongoClient } = require('mongodb');  
const { connectToDatabase } = require('./utils/db');  


exports.handler = async function(event, context) {  
  context.callbackWaitsForEmptyEventLoop = false;  
  
  try {  
    const { db } = await connectToDatabase();  
    
    // Aggregate lesson counts for all courses  
    const lessonCounts = {};  
    
    // Option 1: If lessons are in a separate collection  
    const courseIds = await db.collection('courses').distinct('_id');  
    
    for (const courseId of courseIds) {  
      const count = await db.collection('lessons').countDocuments({ courseId });  
      lessonCounts[courseId] = count;  
    }  
    
    // Option 2: If using aggregation (more efficient for many courses)  
    /*  
    const results = await db.collection('lessons').aggregate([  
      { $group: { _id: '$courseId', count: { $sum: 1 } } }  
    ]).toArray();  
    
    results.forEach(item => {  
      lessonCounts[item._id] = item.count;  
    });  
    */  
    
    return {  
      statusCode: 200,  
      headers: {  
'Access-Control-Allow-Origin': '*', // Or restrict to specific domains like 'https://hoccunghuy.netlify.app'  
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',  
    'Access-Control-Allow-Headers': 'Content-Type',  
    'Access-Control-Max-Age': '86400'  ,        'Content-Type': 'application/json'  
      },  
      body: JSON.stringify(lessonCounts)  
    };  
  } catch (error) {  
    console.error('Lesson counts function error:', error);  
    
    return {  
      statusCode: 500,  
      headers: {  
'Access-Control-Allow-Origin': '*', // Or restrict to specific domains like 'https://hoccunghuy.netlify.app'  
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',  
    'Access-Control-Allow-Headers': 'Content-Type',  
    'Access-Control-Max-Age': '86400'  ,        'Content-Type': 'application/json'  
      },  
      body: JSON.stringify({  
        error: 'Failed to fetch lesson counts',  
        message: error.message  
      })  
    };  
  }  
};  
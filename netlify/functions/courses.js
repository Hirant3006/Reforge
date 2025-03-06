// netlify/functions/courses.js  
const { MongoClient } = require('mongodb');  
const { connectToDatabase } = require('./utils/db');  

// Database connection handler  
let cachedClient = null;  
let cachedDb = null;  


exports.handler = async function(event, context) {  
  // Prevents connection pool from staying open  
  context.callbackWaitsForEmptyEventLoop = false;  
  
  try {  
    // Connect to database  
    const { db } = await connectToDatabase();  
    
    // Get all courses  
    console.log("Fetching courses...");  
    const courses = await db.collection('courses').find({}).sort({ title: 1 }).toArray();  
    console.log(`Found ${courses.length} courses`);  
    
    return {  
      statusCode: 200,  
      headers: {  
'Access-Control-Allow-Origin': '*', // Or restrict to specific domains like 'https://hoccunghuy.netlify.app'  
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',  
    'Access-Control-Allow-Headers': 'Content-Type',  
    'Access-Control-Max-Age': '86400'  ,        'Content-Type': 'application/json'  
      },  
      body: JSON.stringify(courses)  
    };  
  } catch (error) {  
    console.error('Courses function error:', error);  
    
    return {  
      statusCode: 500,  
      headers: {  
'Access-Control-Allow-Origin': '*', // Or restrict to specific domains like 'https://hoccunghuy.netlify.app'  
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',  
    'Access-Control-Allow-Headers': 'Content-Type',  
    'Access-Control-Max-Age': '86400'  ,        'Content-Type': 'application/json'  
      },  
      body: JSON.stringify({   
        error: 'Failed to fetch courses',  
        message: error.message,  
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined  
      })  
    };  
  }  
};  
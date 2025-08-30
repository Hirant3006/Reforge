#!/usr/bin/env node

// Test the lesson loading logic directly without the web server

const fs = require('fs');
const path = require('path');

async function testLessonLogic() {
  console.log('🧪 Testing lesson loading logic...\n');
  
  // Test lesson parameters
  const courseId = 'AI Foundations';
  const subcategoryId = 'Base_ LLMs, Foundation Models, Base Capabilities';
  const lessonFile = 'AI_Foundation_Models.html';
  
  console.log(`📚 Testing lesson: ${courseId} > ${subcategoryId} > ${lessonFile}`);
  
  try {
    // Load the database (same as the server-side function)
    const dbPath = path.join(process.cwd(), 'courses_database.json');
    console.log(`📂 Database path: ${dbPath}`);
    
    if (!fs.existsSync(dbPath)) {
      console.error('❌ Database file not found!');
      return;
    }
    
    const dbContent = fs.readFileSync(dbPath, 'utf-8');
    const database = JSON.parse(dbContent);
    
    console.log(`✅ Database loaded with ${Object.keys(database.courses).length} courses`);
    console.log(`📋 Available courses: ${Object.keys(database.courses).join(', ')}`);
    
    // Find the course data
    const courseData = database.courses[courseId];
    if (!courseData) {
      console.error(`❌ Course not found: "${courseId}"`);
      return;
    }
    
    console.log(`✅ Course found with ${Object.keys(courseData).length} subcategories`);
    console.log(`📋 Available subcategories: ${Object.keys(courseData).map(k => `"${k}"`).join(', ')}`);
    
    // Find the subcategory data
    const subcategoryData = courseData[subcategoryId];
    if (!subcategoryData) {
      console.error(`❌ Subcategory not found: "${subcategoryId}"`);
      return;
    }
    
    console.log(`✅ Subcategory found with ${subcategoryData.length} lessons`);
    console.log(`📋 Available lessons: ${subcategoryData.map(l => l.f).join(', ')}`);
    
    // Find the lesson
    const lesson = subcategoryData.find(l => l.f === lessonFile);
    if (!lesson) {
      console.error(`❌ Lesson not found: "${lessonFile}"`);
      return;
    }
    
    console.log(`✅ Lesson found: "${lesson.t}"`);
    console.log(`📝 Content length: ${lesson.content?.length || 0} characters`);
    
    if (lesson.content && lesson.content.length > 100) {
      console.log('\n🎉 SUCCESS! Lesson has content and should display correctly');
      console.log(`📄 Content preview (first 200 chars):`);
      console.log(lesson.content.substring(0, 200) + '...');
    } else {
      console.log('\n❌ ISSUE: Lesson content is missing or too short');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testLessonLogic();
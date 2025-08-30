#!/usr/bin/env node

const http = require('http');

async function testServer() {
  console.log('🧪 Testing Next.js server...\n');
  
  // Test main page
  try {
    const response = await new Promise((resolve, reject) => {
      const req = http.get('http://127.0.0.1:3000/', {
        timeout: 5000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, data }));
      });
      
      req.on('error', reject);
      req.on('timeout', () => reject(new Error('Request timeout')));
    });
    
    console.log(`✅ Server responds with status: ${response.status}`);
    
    if (response.data.includes('Learning')) {
      console.log('✅ Learning Hub content found');
    } else {
      console.log('⚠️  Learning Hub content not found in response');
      console.log('📝 First 200 characters of response:');
      console.log(response.data.substring(0, 200));
    }
    
  } catch (error) {
    console.error('❌ Server test failed:', error.message);
  }

  // Test database endpoint
  try {
    const dbResponse = await new Promise((resolve, reject) => {
      const req = http.get('http://127.0.0.1:3000/courses_database.json', {
        timeout: 5000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, data }));
      });
      
      req.on('error', reject);
      req.on('timeout', () => reject(new Error('Request timeout')));
    });
    
    console.log(`✅ Database endpoint responds with status: ${dbResponse.status}`);
    
    if (dbResponse.status === 200) {
      try {
        const parsed = JSON.parse(dbResponse.data);
        console.log(`✅ Database contains ${Object.keys(parsed.courses).length} courses`);
      } catch (e) {
        console.log('❌ Database response is not valid JSON');
      }
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  }
}

testServer();
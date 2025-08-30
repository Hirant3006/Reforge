import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import LessonWrapper from './lesson-wrapper';

interface Lesson {
  id: string;
  t: string; // title
  f: string; // filename
  tr: string; // transcript
  content?: string; // main content
}

interface Database {
  courses: {
    [courseName: string]: {
      [subcategory: string]: Lesson[];
    };
  };
  stats: {
    total_courses: number;
    total_lessons: number;
    total_subcategories: number;
  };
}

// Server-side function to load lesson data
async function loadLessonData(courseId: string, subcategoryId: string, lessonFile: string): Promise<Lesson | null> {
  try {
    const dbPath = path.join(process.cwd(), 'courses_database.json');
    const dbContent = fs.readFileSync(dbPath, 'utf-8');
    const database: Database = JSON.parse(dbContent);
    
    const courseData = database.courses[courseId];
    if (!courseData) {
      console.log('Course not found:', courseId);
      return null;
    }
    
    const subcategoryData = courseData[subcategoryId];
    if (!subcategoryData) {
      console.log('Subcategory not found:', subcategoryId);
      return null;
    }
    
    const lesson = subcategoryData.find(l => l.f === lessonFile);
    if (!lesson) {
      console.log('Lesson not found:', lessonFile);
      return null;
    }
    
    return lesson;
  } catch (error) {
    console.error('Failed to load lesson:', error);
    return null;
  }
}

export default async function TestLessonPage({ 
  params 
}: { 
  params: Promise<{ slug: string[] }> 
}) {
  const { slug } = await params;
  const [courseId, subcategoryId, lessonFile] = slug.map(decodeURIComponent);
  
  console.log('Loading lesson:', { courseId, subcategoryId, lessonFile });
  
  const lesson = await loadLessonData(courseId, subcategoryId, lessonFile);
  
  if (!lesson) {
    notFound();
  }
  
  // Load the full database to show sidebar navigation
  const dbPath = path.join(process.cwd(), 'courses_database.json');
  const dbContent = fs.readFileSync(dbPath, 'utf-8');
  const database: Database = JSON.parse(dbContent);

  return (
    <LessonWrapper 
      lesson={lesson}
      database={database}
      courseId={courseId}
      subcategoryId={subcategoryId}
      lessonFile={lessonFile}
    />
  );
}
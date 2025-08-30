'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon, PlayIcon, ClockIcon } from '@heroicons/react/24/outline';
import { BookOpenIcon } from '@heroicons/react/24/solid';

// Types
interface Lesson {
  id: string;
  t: string; // title
  f: string; // filename
  tr: string; // transcript
  content?: string; // main content
}

interface Course {
  [subcategory: string]: Lesson[];
}

interface Database {
  courses: {
    [courseName: string]: Course;
  };
  stats: {
    total_courses: number;
    total_lessons: number;
    total_subcategories: number;
  };
}

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = decodeURIComponent(params.courseId as string);
  
  const [database, setDatabase] = useState<Database | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Load database on component mount
  useEffect(() => {
    const loadDatabase = async () => {
      try {
        const response = await fetch('/courses_database.json');
        const data: Database = await response.json();
        setDatabase(data);
      } catch (error) {
        console.error('Failed to load courses database:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDatabase();
  }, []);


  // Filter lessons based on search term
  const filterLessons = (lessons: Lesson[]) => {
    if (!searchTerm) return lessons;
    return lessons.filter(lesson =>
      lesson.t.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lesson.tr.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Get HTML content for a lesson
  const getHtmlContent = async (lesson: Lesson) => {
    try {
      const coursePath = encodeURIComponent(courseId);
      const subcategoryPath = Object.keys(database?.courses[courseId] || {}).find(subcat => 
        database?.courses[courseId][subcat].some(l => l.id === lesson.id)
      );
      
      if (subcategoryPath) {
        const response = await fetch(`/courses/${coursePath}/${encodeURIComponent(subcategoryPath)}/${lesson.f}`);
        if (response.ok) {
          return await response.text();
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to load HTML content:', error);
      return null;
    }
  };

  // Navigate to lesson content page
  const openLessonContent = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    
    // Find the subcategory for this lesson
    const subcategoryName = Object.keys(database?.courses[courseId] || {}).find(subcat => 
      database?.courses[courseId][subcat].some(l => l.id === lesson.id)
    );
    
    if (subcategoryName) {
      // Navigate to the lesson content page
      const lessonUrl = `/lesson/${encodeURIComponent(courseId)}/${encodeURIComponent(subcategoryName)}/${lesson.f}`;
      router.push(lessonUrl);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (!database || !database.courses[courseId]) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="text-center">
          <BookOpenIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Course Not Found</h2>
          <p className="text-gray-600 mb-4">The course "{courseId}" could not be found.</p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const courseData = database.courses[courseId];
  const totalLessons = Object.values(courseData).reduce((sum, lessons) => sum + lessons.length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to Learning Hub"
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <BookOpenIcon className="h-8 w-8 text-indigo-600" />
                  {courseId}
                </h1>
                <p className="mt-2 text-gray-600">
                  {Object.keys(courseData).length} categories • {totalLessons} lessons
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search lessons in this course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Lessons List */}
          <div className="lg:col-span-2 space-y-6">
            {Object.entries(courseData).map(([subcategoryName, lessons]) => {
              const filteredLessons = filterLessons(lessons);
              if (filteredLessons.length === 0 && searchTerm) return null;

              return (
                <div key={subcategoryName} className="bg-white rounded-xl shadow-sm border">
                  <div className="p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                      <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                      {subcategoryName}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {filteredLessons.length} lessons
                    </p>
                  </div>
                  
                  <div className="p-6 space-y-3">
                    {filteredLessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="group bg-gray-50 hover:bg-indigo-50 rounded-lg border transition-all duration-200 hover:border-indigo-200 hover:shadow-sm"
                      >
                        <div className="p-4 flex items-center gap-4">
                          {/* Content Icon */}
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                              <BookOpenIcon className="h-6 w-6 text-indigo-600" />
                            </div>
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 group-hover:text-indigo-900 mb-1">
                              {lesson.t}
                            </h4>
                            {lesson.tr && (
                              <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                                {lesson.tr.substring(0, 150)}...
                              </p>
                            )}
                          </div>
                          
                          {/* Action Button */}
                          <div className="flex-shrink-0">
                            <button
                              onClick={() => openLessonContent(lesson)}
                              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                            >
                              Read Content
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Course Info Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Course Overview
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-indigo-50 rounded-lg">
                    <div className="text-2xl font-bold text-indigo-600">{Object.keys(courseData).length}</div>
                    <div className="text-xs text-gray-600">Categories</div>
                  </div>
                  <div className="p-3 bg-indigo-50 rounded-lg">
                    <div className="text-2xl font-bold text-indigo-600">{totalLessons}</div>
                    <div className="text-xs text-gray-600">Lessons</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Categories</h4>
                  <div className="space-y-2">
                    {Object.entries(courseData).map(([subcategory, lessons]) => (
                      <div key={subcategory} className="flex justify-between text-sm">
                        <span className="text-gray-600 truncate mr-2">{subcategory}</span>
                        <span className="text-gray-500 flex-shrink-0">{lessons.length}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedLesson && (
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Last Selected</h4>
                    <p className="text-sm text-gray-600">{selectedLesson.t}</p>
                    {selectedLesson.tr && (
                      <p className="text-xs text-gray-500 mt-2 line-clamp-3">
                        {selectedLesson.tr.substring(0, 120)}...
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
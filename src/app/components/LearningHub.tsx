'use client';

import { useState, useEffect } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { BookOpenIcon, PlayIcon } from '@heroicons/react/24/solid';

// Types for our database structure
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
  version: string;
  created: string;
  updated: string;
  courses: {
    [courseName: string]: Course;
  };
  stats: {
    total_courses: number;
    total_lessons: number;
    total_subcategories: number;
  };
}

export default function LearningHub() {
  const [database, setDatabase] = useState<Database | null>(null);
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
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
        
        // Expand first course by default
        const firstCourse = Object.keys(data.courses)[0];
        if (firstCourse) {
          setExpandedCourses(new Set([firstCourse]));
        }
      } catch (error) {
        console.error('Failed to load courses database:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDatabase();
  }, []);

  // Toggle course expansion
  const toggleCourse = (courseName: string) => {
    const newExpanded = new Set(expandedCourses);
    if (newExpanded.has(courseName)) {
      newExpanded.delete(courseName);
    } else {
      newExpanded.add(courseName);
    }
    setExpandedCourses(newExpanded);
  };


  // Filter lessons based on search term
  const filterLessons = (lessons: Lesson[]) => {
    if (!searchTerm) return lessons;
    return lessons.filter(lesson =>
      lesson.t.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lesson.tr.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your learning journey...</p>
        </div>
      </div>
    );
  }

  if (!database) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="text-center">
          <BookOpenIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Courses</h2>
          <p className="text-gray-600">Please check that courses_database.json is available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <BookOpenIcon className="h-8 w-8 text-indigo-600" />
                Learning Hub
              </h1>
              <p className="mt-2 text-gray-600">
                Your comprehensive AI learning journey
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Last updated</div>
              <div className="text-lg font-medium text-gray-900">{database.updated.split('T')[0]}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Stats */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search lessons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-6 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{database.stats.total_courses}</div>
              <div className="text-gray-500">Courses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{database.stats.total_lessons}</div>
              <div className="text-gray-500">Lessons</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{database.stats.total_subcategories}</div>
              <div className="text-gray-500">Categories</div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Course List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border">
              {Object.entries(database.courses).map(([courseName, courseData]) => {
                const isExpanded = expandedCourses.has(courseName);
                
                return (
                  <div key={courseName} className="border-b last:border-b-0">
                    {/* Course Header */}
                    <div className="flex">
                      <button
                        onClick={() => toggleCourse(courseName)}
                        className="flex-1 flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900">{courseName}</h2>
                          <p className="text-sm text-gray-500 mt-1">
                            {Object.keys(courseData).length} categories • {' '}
                            {Object.values(courseData).reduce((sum, lessons) => sum + lessons.length, 0)} lessons
                          </p>
                        </div>
                        {isExpanded ? (
                          <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                      
                      {/* View Course Button */}
                      <div className="flex items-center p-6 border-l">
                        <a
                          href={`/course/${encodeURIComponent(courseName)}`}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                        >
                          View Course
                        </a>
                      </div>
                    </div>

                    {/* Course Content */}
                    {isExpanded && (
                      <div className="px-6 pb-6">
                        {Object.entries(courseData).map(([subcategoryName, lessons]) => {
                          const filteredLessons = filterLessons(lessons);
                          if (filteredLessons.length === 0 && searchTerm) return null;

                          return (
                            <div key={subcategoryName} className="mb-6 last:mb-0">
                              <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center gap-2">
                                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                                {subcategoryName}
                              </h3>
                              
                              <div className="grid gap-3">
                                {filteredLessons.map((lesson) => {
                                  const courseName = Object.keys(database?.courses || {}).find(course => 
                                    Object.values(database?.courses[course] || {}).some(lessons => 
                                      lessons.some(l => l.id === lesson.id)
                                    )
                                  );
                                  
                                  return (
                                    <div
                                      key={lesson.id}
                                      className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-indigo-50 rounded-lg transition-colors group"
                                    >
                                      <div 
                                        className="flex-1 flex items-center gap-4 cursor-pointer"
                                        onClick={() => setSelectedLesson(lesson)}
                                      >
                                        <div className="flex-shrink-0">
                                          <BookOpenIcon className="h-5 w-5 text-gray-400 group-hover:text-indigo-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <h4 className="text-sm font-medium text-gray-900 group-hover:text-indigo-900">
                                            {lesson.t}
                                          </h4>
                                          {lesson.tr && (
                                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                              {lesson.tr.substring(0, 100)}...
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex-shrink-0">
                                        <a
                                          href={`/lesson/${encodeURIComponent(courseName || '')}/${encodeURIComponent(subcategoryName)}/${lesson.f}`}
                                          className="px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-xs font-medium"
                                        >
                                          View Lesson
                                        </a>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lesson Detail Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-8">
              {selectedLesson ? (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {selectedLesson.t}
                  </h3>
                  
                  {selectedLesson.tr && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Content</h4>
                      <div className="text-sm text-gray-600 leading-relaxed max-h-96 overflow-y-auto">
                        <div 
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ 
                            __html: selectedLesson.tr.replace(/\n/g, '<br>') 
                          }}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-6">
                    <a
                      href={`/course/${encodeURIComponent(Object.keys(database?.courses || {}).find(course => 
                        Object.values(database?.courses[course] || {}).some(lessons => 
                          lessons.some(l => l.id === selectedLesson.id)
                        )
                      ) || '')}`}
                      className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <BookOpenIcon className="h-4 w-4" />
                      View Full Course
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <BookOpenIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Select a lesson to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
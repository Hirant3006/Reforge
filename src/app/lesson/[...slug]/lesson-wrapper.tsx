'use client';

import { useState } from 'react';
import { ArrowLeftIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

interface Lesson {
  id: string;
  t: string;
  f: string;
  tr: string;
  content?: string;
}

interface Database {
  courses: {
    [courseName: string]: {
      [subcategory: string]: Lesson[];
    };
  };
}

interface LessonWrapperProps {
  lesson: Lesson;
  database: Database;
  courseId: string;
  subcategoryId: string;
  lessonFile: string;
}

export default function LessonWrapper({ lesson, database, courseId, subcategoryId, lessonFile }: LessonWrapperProps) {
  const router = useRouter();
  const [sidebarVisible, setSidebarVisible] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to Course"
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
              <button
                onClick={() => setSidebarVisible(!sidebarVisible)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Toggle Navigation"
              >
                {sidebarVisible ? <XMarkIcon className="h-5 w-5 text-gray-600" /> : <Bars3Icon className="h-5 w-5 text-gray-600" />}
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {lesson.t}
                </h1>
                <p className="text-sm text-gray-500">
                  {courseId} • {subcategoryId}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`grid ${sidebarVisible ? 'lg:grid-cols-4' : 'grid-cols-1'} gap-8 transition-all duration-300`}>
          {/* Main Content */}
          <div className={sidebarVisible ? 'lg:col-span-3' : 'col-span-1'}>
            <div className="bg-white rounded-xl shadow-sm border p-8">
              {lesson.content ? (
                <div 
                  className="prose prose-lg prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-img:rounded-lg prose-img:shadow-md max-w-none lesson-content"
                  dangerouslySetInnerHTML={{ __html: lesson.content }}
                />
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600">No content available for this lesson.</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Navigation */}
          {sidebarVisible && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-24">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Course Navigation
                  </h3>
                  <button
                    onClick={() => setSidebarVisible(false)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title="Hide Navigation"
                  >
                    <XMarkIcon className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
                
                {database.courses[courseId] && (
                  <div className="space-y-4">
                    {Object.entries(database.courses[courseId]).map(([subcat, lessons]) => (
                      <div key={subcat}>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          {subcat}
                        </h4>
                        <div className="space-y-1">
                          {lessons.map((navLesson) => (
                            <a
                              key={navLesson.id}
                              href={`/lesson/${encodeURIComponent(courseId)}/${encodeURIComponent(subcat)}/${navLesson.f}`}
                              className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                                navLesson.f === lessonFile 
                                  ? 'bg-indigo-100 text-indigo-900 font-medium' 
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              }`}
                            >
                              {navLesson.t}
                            </a>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-6 pt-4 border-t">
                  <a
                    href="/"
                    className="block w-full text-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    Back to Learning Hub
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Floating toggle button */}
        {!sidebarVisible && (
          <button
            onClick={() => setSidebarVisible(true)}
            className="fixed right-6 top-24 bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition-colors z-20"
            title="Show Navigation"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
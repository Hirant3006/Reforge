'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon, ArrowRightIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { BookOpenIcon } from '@heroicons/react/24/solid';

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
}

export default function LessonContentPage() {
  const params = useParams();
  const router = useRouter();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [database, setDatabase] = useState<Database | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [sidebarVisible, setSidebarVisible] = useState(false);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    setSidebarVisible(!isMobile);
  }, []);

  // Extract slug parts: [courseId, subcategoryId, lessonFile]
  const slug = params.slug as string[];
  const [courseId, subcategoryId, lessonFile] = slug?.map(decodeURIComponent) || [];

  useEffect(() => {
    const loadLessonContent = async () => {
      try {
        setLoading(true);
        
        console.log('Loading database...', { courseId, subcategoryId, lessonFile });
        
        // Load the database to find lesson content
        const response = await fetch('/courses_database.json');
        
        console.log('Database response:', response.status);
        
        if (!response.ok) {
          throw new Error(`Failed to load database: ${response.status}`);
        }
        
        const database: Database = await response.json();
        console.log('Database loaded:', Object.keys(database.courses));
        setDatabase(database);
        
        // Find the lesson in the database
        const courseData = database.courses[courseId];
        console.log('Course data found:', !!courseData, Object.keys(courseData || {}));
        
        if (!courseData) {
          throw new Error(`Course not found: ${courseId}`);
        }
        
        const subcategoryData = courseData[subcategoryId];
        console.log('Subcategory data found:', !!subcategoryData, subcategoryData?.length);
        
        if (!subcategoryData) {
          throw new Error(`Subcategory not found: ${subcategoryId}`);
        }
        
        const foundLesson = subcategoryData.find(l => l.f === lessonFile);
        console.log('Lesson found:', !!foundLesson, foundLesson?.t);
        
        if (!foundLesson) {
          throw new Error(`Lesson not found: ${lessonFile}`);
        }
        
        console.log('Setting lesson with content length:', foundLesson.content?.length);
        setLesson(foundLesson);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load lesson content');
        console.error('Failed to load lesson:', err);
      } finally {
        setLoading(false);
      }
    };

    if (courseId && subcategoryId && lessonFile) {
      loadLessonContent();
    } else if (slug) {
      setError('Invalid lesson URL - missing parameters');
      setLoading(false);
    }
    // Don't set error if slug is not yet available (still loading)
  }, [courseId, subcategoryId, lessonFile, slug]);

  const { prevLesson, nextLesson } = (() => {
    if (!database || !courseId || !subcategoryId || !lessonFile) {
      return { prevLesson: null, nextLesson: null };
    }

    const subcategoryData = database.courses[courseId]?.[subcategoryId];
    if (!subcategoryData) {
      return { prevLesson: null, nextLesson: null };
    }

    const currentIndex = subcategoryData.findIndex(l => l.f === lessonFile);
    if (currentIndex === -1) {
      return { prevLesson: null, nextLesson: null };
    }

    const prevLesson = currentIndex > 0 ? subcategoryData[currentIndex - 1] : null;
    const nextLesson = currentIndex < subcategoryData.length - 1 ? subcategoryData[currentIndex + 1] : null;

    return { prevLesson, nextLesson };
  })();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lesson content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="text-center">
          <BookOpenIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Lesson</h2>
          <p className="text-gray-600 mb-4">{error}</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
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
                  {lesson?.t || lessonFile?.replace('.html', '').replace(/_/g, ' ')}
                </h1>
                <p className="text-sm text-gray-500">
                  {courseId} • {subcategoryId}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar for Mobile */}
      <div className={`fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity lg:hidden ${sidebarVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className={`fixed inset-y-0 left-0 w-80 bg-white shadow-lg transform transition-transform ${sidebarVisible ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Course Navigation</h3>
              <button
                onClick={() => setSidebarVisible(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Hide Navigation"
              >
                <XMarkIcon className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            {database && database.courses[courseId] && (
              <div className="space-y-4">
                {Object.entries(database.courses[courseId]).map(([subcat, lessons]) => (
                  <div key={subcat}>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">{subcat}</h4>
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
              <button
                onClick={() => router.push('/')}
                className="w-full text-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                Back to Learning Hub
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`grid ${sidebarVisible && window.innerWidth >= 1024 ? 'lg:grid-cols-4' : 'grid-cols-1'} gap-8 transition-all duration-300`}>
          {/* Main Content */}
          <div className={`${sidebarVisible && window.innerWidth >= 1024 ? 'lg:col-span-3' : 'col-span-1'}`}>
            <div className="bg-white rounded-xl shadow-sm border p-8">
              {lesson ? (
                <div className="space-y-8">
                  {/* Main Content Section */}
                  {lesson.content ? (
                    <div>
                      <div className="bg-white rounded-lg">
                        <div 
                          className="prose prose-lg prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-img:rounded-lg prose-img:shadow-md max-w-none lesson-content"
                          dangerouslySetInnerHTML={{ __html: lesson.content }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <BookOpenIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Content Available</h3>
                      <p className="text-gray-600 mb-4">
                        This lesson doesn&apos;t have extracted content yet.
                      </p>
                    </div>
                  )}
                  {/* Navigation Buttons */}
                  <div className="flex justify-between items-center pt-8 border-t">
                    {prevLesson ? (
                      <a href={`/lesson/${encodeURIComponent(courseId)}/${encodeURIComponent(subcategoryId)}/${prevLesson.f}`}>
                        <div className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition-colors">
                          <ArrowLeftIcon className="h-5 w-5" />
                          <span>Previous Lesson</span>
                        </div>
                      </a>
                    ) : <div />}
                    {nextLesson ? (
                      <a href={`/lesson/${encodeURIComponent(courseId)}/${encodeURIComponent(subcategoryId)}/${nextLesson.f}`}>
                        <div className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition-colors">
                          <span>Next Lesson</span>
                          <ArrowRightIcon className="h-5 w-5" />
                        </div>
                      </a>
                    ) : <div />}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpenIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Lesson content not found</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Navigation for Desktop */}
          {sidebarVisible && window.innerWidth >= 1024 && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-24">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Course Navigation</h3>
                  <button
                    onClick={() => setSidebarVisible(false)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title="Hide Navigation"
                  >
                    <XMarkIcon className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
                {database && database.courses[courseId] && (
                  <div className="space-y-4">
                    {Object.entries(database.courses[courseId]).map(([subcat, lessons]) => (
                      <div key={subcat}>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">{subcat}</h4>
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
                  <button
                    onClick={() => router.push('/')}
                    className="w-full text-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    Back to Learning Hub
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Floating toggle button for desktop */}
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
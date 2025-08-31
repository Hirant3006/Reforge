'use client';

import { useState, useEffect } from 'react';
import { ArrowLeftIcon, ArrowRightIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
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

interface CoursesOrder {
  title: string;
  sections: Array<{
    sectionTitle: string;
    lessons: Array<{
      title: string;
      url: string;
    }>;
  }>;
}

export default function LessonWrapper({ lesson, database, courseId, subcategoryId, lessonFile }: LessonWrapperProps) {
  const router = useRouter();
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [coursesOrder, setCoursesOrder] = useState<CoursesOrder[]>([]);

  // Load course order
  useEffect(() => {
    const loadCourseOrder = async () => {
      try {
        const response = await fetch('/courses.json');
        if (response.ok) {
          const orderData = await response.json();
          setCoursesOrder(orderData);
        }
      } catch (error) {
        console.error('Failed to load course order:', error);
      }
    };
    loadCourseOrder();
  }, []);

  // Normalize section names for matching (handle colon vs underscore differences)
  const normalizeSection = (sectionName: string) => {
    return sectionName.replace(/[_:]/g, '').replace(/\s+/g, ' ').trim();
  };

  // Get lesson order for a specific subcategory
  const getLessonOrder = (subcategoryName: string) => {
    const course = coursesOrder.find(c => c.title === courseId);
    if (!course) return null;
    
    const normalizedSubcat = normalizeSection(subcategoryName);
    const section = course.sections.find(s => 
      normalizeSection(s.sectionTitle) === normalizedSubcat
    );
    if (!section) return null;
    
    const orderMap: {[title: string]: number} = {};
    section.lessons.forEach((lesson, index) => {
      orderMap[lesson.title] = index;
    });
    
    return orderMap;
  };

  // Sort lessons based on courses.json order
  const sortLessons = (lessons: Lesson[], subcategoryName: string) => {
    const lessonOrder = getLessonOrder(subcategoryName);
    if (!lessonOrder) return lessons;
    
    return lessons.sort((a, b) => {
      const orderA = lessonOrder[a.t] ?? 999;
      const orderB = lessonOrder[b.t] ?? 999;
      return orderA - orderB;
    });
  };

  // Get section order from courses.json
  const getSectionOrder = (subcategoryName: string) => {
    if (!coursesOrder.length) return 999;
    
    const course = coursesOrder.find(c => c.title === courseId);
    if (!course) return 999;
    
    const normalizedSubcat = normalizeSection(subcategoryName);
    const sectionIndex = course.sections.findIndex(s => 
      normalizeSection(s.sectionTitle) === normalizedSubcat
    );
    
    return sectionIndex !== -1 ? sectionIndex : 999;
  };

  // Get all lessons from current course for navigation
  const getAllLessons = () => {
    const allLessons: Array<{lesson: Lesson, subcategory: string}> = [];
    
    // Sort sections first, then add lessons in order
    const sortedSections = Object.entries(database.courses[courseId] || {}).sort(([subcatA], [subcatB]) => {
      const orderA = getSectionOrder(subcatA);
      const orderB = getSectionOrder(subcatB);
      return orderA - orderB;
    });
    
    sortedSections.forEach(([subcat, lessons]) => {
      const sortedLessons = sortLessons(lessons, subcat);
      sortedLessons.forEach(lesson => {
        allLessons.push({ lesson, subcategory: subcat });
      });
    });
    return allLessons;
  };

  const allLessons = getAllLessons();
  const currentIndex = allLessons.findIndex(item => item.lesson.f === lessonFile);
  const previousLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/course/${encodeURIComponent(courseId)}`)}
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
            <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-8">
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

            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between items-center">
              {previousLesson ? (
                <button
                  onClick={() => router.push(`/lesson/${encodeURIComponent(courseId)}/${encodeURIComponent(previousLesson.subcategory)}/${previousLesson.lesson.f}`)}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  <div className="text-left">
                    <div className="text-xs text-gray-500">Previous</div>
                    <div className="text-sm font-medium">{previousLesson.lesson.t}</div>
                  </div>
                </button>
              ) : (
                <div></div>
              )}

              {nextLesson ? (
                <button
                  onClick={() => router.push(`/lesson/${encodeURIComponent(courseId)}/${encodeURIComponent(nextLesson.subcategory)}/${nextLesson.lesson.f}`)}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                  <div className="text-right">
                    <div className="text-xs text-indigo-200">Next</div>
                    <div className="text-sm font-medium">{nextLesson.lesson.t}</div>
                  </div>
                  <ArrowRightIcon className="h-4 w-4" />
                </button>
              ) : (
                <div></div>
              )}
            </div>
          </div>

          {/* Desktop Sidebar Navigation */}
          {sidebarVisible && (
            <div className="hidden lg:block lg:col-span-1">
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
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {Object.entries(database.courses[courseId]).sort(([subcatA], [subcatB]) => {
                      const orderA = getSectionOrder(subcatA);
                      const orderB = getSectionOrder(subcatB);
                      return orderA - orderB;
                    }).map(([subcat, lessons]) => (
                      <div key={subcat}>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          {subcat}
                        </h4>
                        <div className="space-y-1">
                          {sortLessons(lessons, subcat).map((navLesson) => (
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
                    onClick={() => router.push(`/course/${encodeURIComponent(courseId)}`)}
                    className="block w-full text-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    Back to Course
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Sidebar Navigation */}
          {sidebarVisible && (
            <div className="lg:hidden fixed inset-0 z-50">
              <div 
                className="absolute inset-0 bg-black bg-opacity-50"
                onClick={() => setSidebarVisible(false)}
              ></div>
              <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Course Navigation
                    </h3>
                    <button
                      onClick={() => setSidebarVisible(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Close Navigation"
                    >
                      <XMarkIcon className="h-5 w-5 text-gray-500" />
                    </button>
                  </div>
                  
                  {database.courses[courseId] && (
                    <div className="space-y-6">
                      {Object.entries(database.courses[courseId]).sort(([subcatA], [subcatB]) => {
                        const orderA = getSectionOrder(subcatA);
                        const orderB = getSectionOrder(subcatB);
                        return orderA - orderB;
                      }).map(([subcat, lessons]) => (
                        <div key={subcat}>
                          <h4 className="text-sm font-medium text-gray-700 mb-3 sticky top-0 bg-white py-2">
                            {subcat}
                          </h4>
                          <div className="space-y-2">
                            {sortLessons(lessons, subcat).map((navLesson) => (
                              <a
                                key={navLesson.id}
                                href={`/lesson/${encodeURIComponent(courseId)}/${encodeURIComponent(subcat)}/${navLesson.f}`}
                                className={`block px-4 py-3 text-sm rounded-lg transition-colors ${
                                  navLesson.f === lessonFile 
                                    ? 'bg-indigo-100 text-indigo-900 font-medium border border-indigo-200' 
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                                onClick={() => setSidebarVisible(false)}
                              >
                                {navLesson.t}
                              </a>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-8 pt-6 border-t sticky bottom-0 bg-white">
                    <button
                      onClick={() => {
                        setSidebarVisible(false);
                        router.push(`/course/${encodeURIComponent(courseId)}`);
                      }}
                      className="block w-full text-center px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                    >
                      Back to Course
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Floating toggle button */}
        {!sidebarVisible && (
          <button
            onClick={() => setSidebarVisible(true)}
            className="fixed right-4 bottom-6 bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition-colors z-20 lg:right-6 lg:top-24 lg:bottom-auto"
            title="Show Navigation"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
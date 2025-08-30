// Dynamic API endpoint based on environment  
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:8888/.netlify/functions'
  : 'https://hoccunghuy.netlify.app/.netlify/functions';

// Log which environment we're using  
console.log(`Running in ${window.location.hostname === 'localhost' ? 'development' : 'production'} environment`);
console.log(`Using API endpoint: ${API_BASE_URL}`);

function appData() {
  return {
    loading: true,
    roadmaps: [],
    allCourses: [],
    activeTab: 'roadmaps',
    error: null,

    async init() {
      this.loading = true;
      try {
        await Promise.all([
          this.fetchRoadmaps(),
          this.fetchAllCourses()
        ]);
        await this.fetchLessonCounts();

      } catch (err) {
        this.error = `Error fetching data: ${err.message}`;
        console.error(err);
      } finally {
        this.loading = false;
      }
    },
    
    getLessonCount(course) {
      console.log({ course })
      // If course has a lessons array, return its length  
      if (course.lessons && Array.isArray(course.lessons)) {
        return course.lessons.length;
      }

      // If course has a lessonCount property, return it  
      if (course.lessonCount !== undefined) {
        return course.lessonCount;
      }

      // If course has a modules array with lessons inside  
      if (course.modules && Array.isArray(course.modules)) {
        let count = 0;
        course.modules.forEach(module => {
          if (module.lessons && Array.isArray(module.lessons)) {
            count += module.lessons.length;
          }
        });
        return count;
      }
      // Fallback to 0 if no lesson information is available  
      return course.lessonsCount;
    },

    async fetchRoadmaps() {
      try {
        // Fix API endpoint to use the BASE_URL  
        const response = await fetch(`${API_BASE_URL}/roadmaps`);
        if (!response.ok) {
          throw new Error(`Roadmaps API error: ${response.status}`);
        }
        this.roadmaps = await response.json();
        console.log('Roadmaps loaded:', this.roadmaps);
      } catch (err) {
        console.error('Error fetching roadmaps:', err);
        throw err;
      }
    },
    async fetchLessonCounts() {
      try {
        const response = await fetch(`${API_BASE_URL}/lesson-counts`);
        if (!response.ok) {
          throw new Error(`Lesson counts API error: ${response.status}`);
        }

        const lessonCounts = await response.json();

        // Update course objects with lesson counts  
        this.allCourses.forEach(course => {
          if (lessonCounts[course._id]) {
            course.lessonCount = lessonCounts[course._id];
          }
        });

        console.log('Updated courses with lesson counts');
      } catch (err) {
        console.error('Error fetching lesson counts:', err);
      }
    },

    async fetchAllCourses() {
      try {
        // Fix API endpoint to use the BASE_URL  
        const response = await fetch(`${API_BASE_URL}/courses`);
        if (!response.ok) {
          throw new Error(`Courses API error: ${response.status}`);
        }
        this.allCourses = await response.json();
        console.log('All courses loaded:', this.allCourses);
      } catch (err) {
        console.error('Error fetching courses:', err);
        throw err;
      }
    },

    viewCourse(course) {
      if (!course || !course.slug) {
        console.error("Cannot view course: missing slug", course);
        return;
      }
      window.location.href = `/course/${course.slug}`;
    },

    getCategoryName(categoryId) {
      const categories = {
        '2': 'Product',
        '3': 'Marketing',
        '4': 'Engineering'
      };
      return categories[categoryId] || 'Uncategorized';
    },

    // NEW METHODS FOR CATEGORY GROUPING  

    // Get courses for specific roadmap category  
    // Update your existing getCoursesForRoadmap function  
    getCoursesForRoadmap(roadmap) {
      if (!roadmap || !roadmap.terms || roadmap.terms.length === 0) {
        console.log(`No terms found for roadmap: ${roadmap?.title}`);

        // Fallback: find courses with matching category ID if terms aren't available  
        const courses = this.allCourses.filter(course => {
          return course.apiCategoryId === roadmap._id ||
            course.apiCategoryId.toString() === roadmap._id;
        });

        // Sort by showIndex (ascending)  
        return this.sortCoursesByShowIndex(courses);
      }

      // Flatten all courses from all terms in this roadmap  
      let courses = [];
      roadmap.terms.forEach(term => {
        if (term.courses && term.courses.length) {
          courses.push(...term.courses);
        }
      });

      console.log(`Found ${courses.length} courses for roadmap: ${roadmap.title}`);

      // Sort by showIndex (ascending)  
      return this.sortCoursesByShowIndex(courses);
    },

    // Add a new helper function for sorting courses  
    // Update the helper function for sorting courses  
    sortCoursesByShowIndex(courses) {
      return [...courses].sort((a, b) => {
        // Handle missing showIndex values (put them at the end)  
        if (a.showIndex === undefined && b.showIndex === undefined) {
          // If neither has showIndex, sort alphabetically by title  
          return (a.title || '').localeCompare(b.title || '');
        }

        // If only one has showIndex, prioritize the one with showIndex  
        if (a.showIndex === undefined) return 1; // a goes after b  
        if (b.showIndex === undefined) return -1; // a goes before b  

        // If both have showIndex, sort by showIndex (DESCENDING - higher values first)  
        return b.showIndex - a.showIndex; // Changed from a - b to b - a for reverse order  
      });
    },

    // Get courses for a specific category ID  
    getCoursesForCategory(categoryId) {
      const courses = this.allCourses.filter(course => {
        return course.apiCategoryID === categoryId ||
          course.apiCategoryID === parseInt(categoryId);
      });

      console.log(`Found ${courses.length} courses for category ID: ${categoryId}`);
      return courses;
    },

    // Debugging function to help troubleshoot category issues  
    debugData() {
      console.log("DEBUG DATA:");
      console.log("Roadmaps:", this.roadmaps);
      console.log("All Courses:", this.allCourses);

      // Check if courses have apiCategoryID  
      const coursesWithCategory = this.allCourses.filter(c => c.apiCategoryID !== undefined);
      console.log(`Courses with apiCategoryID: ${coursesWithCategory.length} out of ${this.allCourses.length}`);

      // Show sample course data  
      if (this.allCourses.length > 0) {
        console.log("Sample course fields:", Object.keys(this.allCourses[0]));
        console.log("Sample course:", this.allCourses[0]);
      }

      // Check category distribution  
      const categoryCount = {};
      this.allCourses.forEach(course => {
        const catId = course.apiCategoryID || 'undefined';
        categoryCount[catId] = (categoryCount[catId] || 0) + 1;
      });
      console.log("Category distribution:", categoryCount);

      alert('Debug data logged to console');
    }
  };
}

// Register Alpine Component using alpine:init event (add this if you don't have it elsewhere)  
document.addEventListener('alpine:init', () => {
  Alpine.data('coursesApp', appData);
});  
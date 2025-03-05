// Your Netlify Functions API endpoint  
// Replace with your actual Netlify site URL  
const API_BASE_URL = 'https://your-netlify-site.netlify.app/api';  

function appData() {  
  return {  
    loading: true,  
    activeTab: 'roadmaps',  
    searchQuery: '',  
    searchResults: [],  
    roadmaps: [],  
    allCourses: [],  
    selectedCourse: null,  
    selectedSection: null,  
    selectedLesson: null,  
    courseSections: [],  
    sectionLessons: [],  
    lastRefreshed: new Date(),  
    stats: {  
      roadmaps: 0,  
      courses: 0,  
      lessons: 0  
    },  

    init() {  
      this.refreshData();  
    },  

    async refreshData() {  
      this.loading = true;  
      
      try {  
        // Get roadmaps with their terms and courses  
        const roadmapsResponse = await fetch(`${API_BASE_URL}/roadmaps`);  
        this.roadmaps = await roadmapsResponse.json();  
        
        // Get all courses  
        const coursesResponse = await fetch(`${API_BASE_URL}/courses`);  
        this.allCourses = await coursesResponse.json();  
        
        // Update stats  
        this.stats.roadmaps = this.roadmaps.length;  
        this.stats.courses = this.allCourses.length;  
        this.stats.lessons = this.allCourses.reduce((total, course) => total + (course.lessonsCount || 0), 0);  
        
        this.lastRefreshed = new Date();  
      } catch (error) {  
        console.error('Error fetching data:', error);  
        alert('Failed to load data. Please check the console for details.');  
      } finally {  
        this.loading = false;  
      }  
    },  

    async viewCourse(course) {  
      this.loading = true;  
      
      try {  
        // Fetch full course data with sections and lessons  
        const response = await fetch(`${API_BASE_URL}/course/${course.slug}`);  
        this.selectedCourse = await response.json();  
        
        // Set sections  
        this.courseSections = this.selectedCourse.sections || [];  
        
        // Select first section if available  
        if (this.courseSections.length > 0) {  
          this.toggleSection(this.courseSections[0]);  
        } else {  
          this.selectedSection = null;  
          this.sectionLessons = [];  
          this.selectedLesson = null;  
        }  
      } catch (error) {  
        console.error('Error fetching course details:', error);  
        alert('Failed to load course details.');  
      } finally {  
        this.loading = false;  
      }  
    },  

    toggleSection(section) {  
      this.selectedSection = section;  
      this.sectionLessons = section.lessons || [];  
      
      // Select first lesson in section  
      if (this.sectionLessons.length > 0) {  
        this.selectLesson(this.sectionLessons[0]);  
      } else {  
        this.selectedLesson = null;  
      }  
    },  

    selectLesson(lesson) {  
      this.selectedLesson = lesson;  
    },  

    performSearch() {  
      if (!this.searchQuery || this.searchQuery.trim().length < 2) {  
        this.searchResults = [];  
        return;  
      }  
      
      const query = this.searchQuery.toLowerCase();  
      
      this.searchResults = this.allCourses.filter(course => {  
        return (  
          course.title?.toLowerCase().includes(query) ||  
          course.shortDescription?.toLowerCase().includes(query)  
        );  
      });  
    },  

    formatDateTime(date) {  
      if (!date) return 'Unknown';  
      
      return date.toLocaleString();  
    }  
  };  
}  
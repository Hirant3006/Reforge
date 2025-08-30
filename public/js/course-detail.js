// Make sure the function is defined before Alpine loads
document.addEventListener('alpine:init', () => {
    Alpine.data('courseDetailApp', () => ({
        course: null,
        loading: true,
        error: null,
        courseSlug: '',
        openSections: {}, // Tracks which sections are expanded by ID  
        sectionLessons: {}, // Store lessons by section ID  
        sectionsLoading: {}, // Track which sections are loading lessons  
        sectionsFetched: {}, // Track which sections have attempted to fetch lessons  
        selectedLesson: null, // Currently selected lesson  
        allLessons: [], // Flat array of all lessons for navigation  
        API_BASE_URL: '', // Leave empty for relative URLs on the same domain  

        // Sidebar tabs  
        sidebarTab: 'contents', // 'contents' or 'courses'  

        // Roadmaps data (instead of categories)  
        roadmaps: [],
        loadingRoadmaps: false,
        roadmapsError: null,
        openRoadmaps: {},

        videoSource: null,
        minimizeVideo: false,
        sidebarHidden: localStorage.getItem('sidebarHidden') === 'true', // Get saved state
        videoOnLeft: localStorage.getItem('videoOnLeft') === 'true' || true, // Default to true if not set
        videoWidth: 400, // Default video width in pixels
        isResizing: false,
        startX: 0,
        startContentWidth: 0, // Add this to track initial width
        contentWidth: localStorage.getItem('contentWidth') || 50, // Default to 50%

        init() {
            // Extract course slug from URL  
            const pathSegments = window.location.pathname.split('/');
            const courseIndex = pathSegments.indexOf('course');

            if (courseIndex !== -1 && pathSegments.length > courseIndex + 1) {
                this.courseSlug = pathSegments[courseIndex + 1];
            } else {
                this.error = 'Invalid course URL';
                this.loading = false;
                return;
            }

            if (!this.courseSlug) {
                this.error = 'Invalid course URL';
                this.loading = false;
                return;
            }

            this.fetchCourseBySlug();
            this.fetchRoadmaps();

            // Add mouse event listeners for resizing
            window.addEventListener('mousemove', (e) => {
                if (!this.isResizing) return;
                e.preventDefault();
                
                const container = document.querySelector('.content-container');
                if (!container) return;

                const containerWidth = container.offsetWidth;
                const diff = e.clientX - this.startX;
                const percentageDiff = (diff / containerWidth) * 100;
                const newWidth = this.startContentWidth - percentageDiff;
                
                // Limit between 40% and 60%
                this.contentWidth = Math.min(Math.max(40, newWidth), 60);
                localStorage.setItem('contentWidth', this.contentWidth);
            });

            window.addEventListener('mouseup', () => {
                this.isResizing = false;
                document.body.style.cursor = 'default';
            });

            // Prevent text selection while resizing
            window.addEventListener('selectstart', (e) => {
                if (this.isResizing) {
                    e.preventDefault();
                }
            });

            // Save sidebar state whenever it changes
            this.$watch('sidebarHidden', (value) => {
                localStorage.setItem('sidebarHidden', value);
            });

            // Save video position whenever it changes
            this.$watch('videoOnLeft', (value) => {
                localStorage.setItem('videoOnLeft', value);
            });
        },

        async fetchCourseBySlug() {
            this.loading = true;
            this.error = null;

            try {
                const response = await fetch(`${this.API_BASE_URL}/.netlify/functions/course-detail?slug=${this.courseSlug}`);

                if (!response.ok) {
                    throw new Error(`Failed to fetch course. Status: ${response.status}`);
                }

                const data = await response.json();

                if (!data || !data.course) {
                    throw new Error('Course not found');
                }

                this.course = data.course;
                document.title = `${this.course.title} - WeGrow Learning Platform`;

                this.processCourseSections();

                if (this.course.sections && Array.isArray(this.course.sections) && this.course.sections.length > 0) {
                    const firstSection = this.getSortedSections()[0];
                    if (firstSection && firstSection._id) {
                        this.openSections[firstSection._id] = true;
                        this.fetchLessonsForSection(firstSection);
                    }
                }

            } catch (err) {
                console.error('Error fetching course:', err);
                this.error = err.message || 'Failed to load course';
            } finally {
                this.loading = false;
            }
        },

        processCourseSections() {
            if (!this.course.sections || !Array.isArray(this.course.sections)) {
                this.course.sections = [];
                return;
            }

            this.course.sections.forEach(section => {
                if (!section._id) {
                    section._id = section.id || `section-${Math.random().toString(36).substr(2, 9)}`;
                }

                if (section.lessons && Array.isArray(section.lessons) &&
                    section.lessons.length > 0 && typeof section.lessons[0] === 'object' &&
                    (section.lessons[0].title || section.lessons[0].name)) {
                    this.sectionLessons[section._id] = section.lessons;
                    this.sectionsFetched[section._id] = true;
                }

                console.log(`Section ${section.title || section.name}:`, {
                    _id: section._id,
                    showIndex: section.showIndex,
                    title: section.title || section.name,
                    lessons: section.lessons ? (Array.isArray(section.lessons) ?
                        `${section.lessons.length} items (${typeof section.lessons[0]})` : 'not array') : 'none'
                });
            });
        },

        async fetchLessonsForSection(section) {
            if (!section || !section._id) return;

            console.log(`Attempting to fetch lessons for section: ${section.title || section.name} (${section._id})`);
            console.log(`Section lessons:`, section.lessons);

            if (this.sectionsFetched[section._id] || this.sectionsLoading[section._id]) {
                console.log(`Section ${section._id} already fetched or loading.`);
                return;
            }

            this.sectionsLoading[section._id] = true;
            this.sectionsFetched[section._id] = true;

            try {
                const lessons = [];

                if (section.lessons && Array.isArray(section.lessons)) {
                    console.log(`Section has ${section.lessons.length} lessons to process`);

                    for (let i = 0; i < section.lessons.length; i++) {
                        const lessonRef = section.lessons[i];
                        let lessonId;

                        if (typeof lessonRef === 'string') {
                            lessonId = lessonRef;
                        } else if (lessonRef && lessonRef._id) {
                            if (lessonRef.title || lessonRef.name) {
                                lessons.push(lessonRef);
                                continue;
                            }
                            lessonId = lessonRef._id.toString();
                        } else if (lessonRef && lessonRef.id) {
                            lessonId = lessonRef.id.toString();
                        } else {
                            console.log(`Skipping invalid lesson reference at index ${i}:`, lessonRef);
                            continue;
                        }

                        try {
                            const response = await fetch(`${this.API_BASE_URL}/.netlify/functions/lesson-detail?courseSlug=${this.courseSlug}&lessonSlug=${lessonId}`);

                            if (response.ok) {
                                const data = await response.json();
                                if (data && data.lesson) {
                                    console.log(`Successfully fetched lesson: ${data.lesson.title || data.lesson.name}`);
                                    lessons.push(data.lesson);
                                } else {
                                    console.warn(`Lesson ${lessonId} returned no data`);
                                }
                            } else {
                                console.warn(`Failed to fetch lesson ${lessonId}: ${response.status}`);
                            }
                        } catch (err) {
                            console.error(`Error fetching lesson ${lessonId}:`, err);
                        }
                    }
                }

                this.sectionLessons[section._id] = lessons;
                this.updateAllLessons();
                this.sectionLessons = { ...this.sectionLessons };

                if (!this.selectedLesson && lessons.length > 0) {
                    const firstSectionId = this.getSortedSections()[0]?._id;
                    if (section._id === firstSectionId) {
                        this.selectLesson(lessons[0]);
                    }
                }

            } catch (err) {
                console.error(`Error fetching lessons for section ${section._id}:`, err);
            } finally {
                this.sectionsLoading[section._id] = false;
                this.sectionsLoading = { ...this.sectionsLoading };
            }
        },

        updateAllLessons() {
            const allLessons = [];
            const sortedSections = this.getSortedSections();

            sortedSections.forEach(section => {
                if (this.sectionLessons[section._id]) {
                    const sortedLessons = this.getSortedLessons(section);
                    allLessons.push(...sortedLessons);
                }
            });

            this.allLessons = allLessons;
            console.log(`Updated all lessons array with ${allLessons.length} lessons`);
        },

        async fetchRoadmaps() {
            this.loadingRoadmaps = true;
            this.roadmapsError = null;

            try {
                const response = await fetch(`${this.API_BASE_URL}/.netlify/functions/roadmasps`);

                if (!response.ok) {
                    throw new Error(`Failed to fetch roadmaps. Status: ${response.status}`);
                }

                const data = await response.json();

                if (!Array.isArray(data)) {
                    throw new Error('Invalid roadmaps data');
                }

                this.roadmaps = data;

                if (this.roadmaps.length > 0) {
                    const firstRoadmap = this.roadmaps[0];
                    this.openRoadmaps[firstRoadmap._id] = true;
                }

            } catch (err) {
                console.error('Error fetching roadmaps:', err);
                this.roadmapsError = err.message || 'Failed to load roadmaps';
            } finally {
                this.loadingRoadmaps = false;
            }
        },

        getSortedSections() {
            if (!this.course || !this.course.sections || !Array.isArray(this.course.sections)) {
                return [];
            }

            return [...this.course.sections].sort((a, b) => {
                const indexA = a.showIndex !== undefined ? Number(a.showIndex) : Number.MAX_SAFE_INTEGER;
                const indexB = b.showIndex !== undefined ? Number(b.showIndex) : Number.MAX_SAFE_INTEGER;

                if (indexA !== indexB) return indexA - indexB;

                const orderA = a.order !== undefined ? Number(a.order) : Number.MAX_SAFE_INTEGER;
                const orderB = b.order !== undefined ? Number(b.order) : Number.MAX_SAFE_INTEGER;
                if (orderA !== orderB) return orderA - orderB;

                return (a.title || '').localeCompare(b.title || '');
            });
        },

        getSortedLessons(section) {
            if (!section || !section._id) return [];

            if (!this.sectionsFetched[section._id]) {
                console.log(`getSortedLessons: triggering fetch for section ${section._id}`);
                this.fetchLessonsForSection(section);
                return [];
            }

            const lessons = this.sectionLessons[section._id];
            if (!Array.isArray(lessons) || lessons.length === 0) return [];

            return [...lessons].sort((a, b) => {
                const indexA = a.showIndex !== undefined ? Number(a.showIndex) : Number.MAX_SAFE_INTEGER;
                const indexB = b.showIndex !== undefined ? Number(b.showIndex) : Number.MAX_SAFE_INTEGER;

                if (indexA !== indexB) return indexA - indexB;

                const orderA = a.order !== undefined ? Number(a.order) : Number.MAX_SAFE_INTEGER;
                const orderB = b.order !== undefined ? Number(b.order) : Number.MAX_SAFE_INTEGER;
                if (orderA !== orderB) return orderA - orderB;

                return (a.title || '').localeCompare(b.title || '');
            });
        },

        toggleSection(sectionId) {
            if (!sectionId) return;

            console.log(`Toggling section: ${sectionId}`);
            this.openSections[sectionId] = !this.openSections[sectionId];
            this.openSections = { ...this.openSections };

            if (this.openSections[sectionId]) {
                console.log(`Section ${sectionId} is now open.`);
                const section = this.course.sections.find(s => s._id === sectionId);
                if (section) {
                    this.fetchLessonsForSection(section);
                }
            }
        },

        isSectionOpen(sectionId) {
            return !!this.openSections[sectionId];
        },

        toggleRoadmap(roadmapId) {
            if (!roadmapId) return;
            this.openRoadmaps[roadmapId] = !this.openRoadmaps[roadmapId];
            this.openRoadmaps = { ...this.openRoadmaps };
        },

        isRoadmapOpen(roadmapId) {
            return !!this.openRoadmaps[roadmapId];
        },

        selectLesson(lesson) {
            if (!lesson || !lesson._id) return;

            console.log(`Selecting lesson: ${lesson.title || lesson.name}`);
            
            // Reset video source
            this.videoSource = null;
            
            // Process content and extract video if available
            if (lesson.content) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = lesson.content;
                
                // Extract video
                const videoElements = tempDiv.getElementsByTagName('video');
                if (videoElements.length > 0) {
                    Array.from(videoElements).forEach(videoElement => {
                        const src = videoElement.getAttribute('src');
                        if (src) {
                            this.videoSource = src;
                        } else {
                            const sourceElement = videoElement.querySelector('source');
                            if (sourceElement && sourceElement.getAttribute('src')) {
                                this.videoSource = sourceElement.getAttribute('src');
                            }
                        }
                        videoElement.remove();
                    });
                }
                
                // Keep the original content
                lesson = {
                    ...lesson,
                    content: tempDiv.innerHTML
                };
            }
            
            this.selectedLesson = lesson;

            const sectionContainingLesson = this.findSectionForLesson(lesson);
            if (sectionContainingLesson && !this.isSectionOpen(sectionContainingLesson._id)) {
                this.openSections[sectionContainingLesson._id] = true;
                this.openSections = { ...this.openSections };
            }

            const url = `/course/${this.courseSlug}/lesson/${lesson.slug || lesson._id}`;
            window.history.pushState({ lessonId: lesson._id }, '', url);

            if (this.sidebarTab !== 'contents') {
                this.sidebarTab = 'contents';
            }
        },

        isLessonSelected(lesson) {
            return this.selectedLesson && lesson && this.selectedLesson._id === lesson._id;
        },

        findSectionForLesson(lesson) {
            if (!lesson || !lesson._id) return null;

            for (const section of this.course.sections) {
                if (this.sectionLessons[section._id]) {
                    const foundLesson = this.sectionLessons[section._id].find(l => l._id === lesson._id);
                    if (foundLesson) return section;
                }
            }

            return null;
        },

        hasPreviousLesson() {
            if (!this.selectedLesson) return false;
            const currentIndex = this.allLessons.findIndex(l => l._id === this.selectedLesson._id);
            return currentIndex > 0;
        },

        hasNextLesson() {
            if (!this.selectedLesson) return false;
            const currentIndex = this.allLessons.findIndex(l => l._id === this.selectedLesson._id);
            return currentIndex < this.allLessons.length - 1 && currentIndex >= 0;
        },

        navigateToPreviousLesson() {
            if (!this.hasPreviousLesson()) return;
            const currentIndex = this.allLessons.findIndex(l => l._id === this.selectedLesson._id);
            if (currentIndex > 0) {
                this.selectLesson(this.allLessons[currentIndex - 1]);
            }
        },

        navigateToNextLesson() {
            if (!this.hasNextLesson()) return;
            const currentIndex = this.allLessons.findIndex(l => l._id === this.selectedLesson._id);
            if (currentIndex >= 0 && currentIndex < this.allLessons.length - 1) {
                this.selectLesson(this.allLessons[currentIndex + 1]);
            }
        },

        startResize(e) {
            this.isResizing = true;
            this.startX = e.clientX;
            this.startContentWidth = this.contentWidth;
            document.body.style.cursor = 'ew-resize';
        },

        // Add new method to toggle video position
        toggleVideoPosition() {
            this.videoOnLeft = !this.videoOnLeft;
        }
    }));
});

function extractVideoSrc(htmlContent) {
    if (!htmlContent || typeof htmlContent !== 'string') {
        console.error('Invalid HTML content provided');
        return null;
    }

    // First, try to match the src attribute in the video tag  
    const videoSrcRegex = /<video[^>]*src=["']([^"']+)["'][^>]*>/i;
    const videoMatch = htmlContent.match(videoSrcRegex);

    if (videoMatch && videoMatch[1]) {
        console.log('Found video src:', videoMatch[1]);
        return videoMatch[1];
    }

    // If no src in video tag, try to find it in the source tag inside video  
    const sourceSrcRegex = /<video[^>]*>(?:\s*)<source[^>]*src=["']([^"']+)["'][^>]*>/i;
    const sourceMatch = htmlContent.match(sourceSrcRegex);

    if (sourceMatch && sourceMatch[1]) {
        console.log('Found source src:', sourceMatch[1]);
        return sourceMatch[1];
    }

    console.warn('No video source found in the provided HTML content');
    return null;
}

function estimateReadingTime(text) {
    // Average reading speed (words per minute)
    const wordsPerMinute = 150;
    // Average word length in characters
    const avgWordLength = 5;
    
    // Calculate approximate duration in seconds
    const words = text.length / avgWordLength;
    const minutes = words / wordsPerMinute;
    return Math.max(2, Math.round(minutes * 60));
} 
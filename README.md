# Interactive Quiz App

## Overview

QuizMaster is a fully responsive, interactive quiz application built entirely with HTML, CSS, and JavaScript. The app fetches trivia questions from the Open Trivia DB API and provides users with a comprehensive quiz experience including customizable settings, real-time feedback, gamification elements, and local data persistence. The application runs entirely in the browser with no backend dependencies.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Pure Vanilla JavaScript**: Uses ES6 classes and modern JavaScript features for a modular, object-oriented approach
- **Component-based Structure**: Organized around a main `QuizApp` class that manages all application state and UI interactions
- **Screen-based Navigation**: Multiple screens (setup, quiz, results, review) managed through CSS classes and JavaScript state
- **Event-driven Architecture**: Centralized event binding in the constructor with delegated event handling

### Styling and Theming
- **CSS Custom Properties**: Comprehensive theming system using CSS variables for light/dark mode support
- **Responsive Design**: Mobile-first approach using CSS Grid and Flexbox for layout
- **Modern CSS**: Utilizes contemporary CSS features including custom properties, transitions, and modern selectors
- **Theme Persistence**: Dark/light mode preferences stored in localStorage

### Data Management
- **Client-side State**: All application state managed in JavaScript class properties
- **Local Storage**: Persistent storage for user preferences, high scores, and leaderboard data
- **Session Management**: Quiz progress and answers tracked during active sessions

### API Integration
- **Open Trivia DB**: External API integration for fetching trivia questions
- **Async/Await Pattern**: Modern JavaScript for handling API requests
- **Error Handling**: Graceful degradation when API requests fail

### User Experience Features
- **Gamification**: Scoring system with streaks, badges, and leaderboards
- **Accessibility**: Semantic HTML structure with ARIA labels and keyboard navigation support
- **Progressive Enhancement**: Core functionality works with JavaScript disabled
- **Smooth Animations**: CSS transitions and animations for enhanced user experience

### Performance Considerations
- **Efficient DOM Manipulation**: Minimal DOM queries with cached element references
- **Memory Management**: Proper cleanup of timers and event listeners
- **Lazy Loading**: Questions fetched on-demand rather than preloading entire question sets

## External Dependencies

### APIs
- **Open Trivia DB API**: Primary data source for trivia questions
  - Endpoint: `https://opentdb.com/api.php`
  - Provides categorized questions with multiple difficulty levels
  - Returns JSON format with questions, answers, and metadata

### Fonts
- **Google Fonts**: Inter font family loaded via CDN
  - Multiple weights (300, 400, 500, 600, 700)
  - Optimized loading with preconnect hints

### Browser APIs
- **localStorage**: For persistent data storage (scores, preferences, leaderboard)
- **Fetch API**: For HTTP requests to trivia database
- **Timer APIs**: setTimeout/setInterval for quiz timing functionality
- **DOM APIs**: For dynamic content manipulation and user interaction handling

### No Framework Dependencies
- Application intentionally built without any JavaScript frameworks or libraries
- All functionality implemented using native web technologies
- No build tools or package managers required - runs directly in browser

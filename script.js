// Quiz Application JavaScript
class QuizApp {
    constructor() {
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.streak = 0;
        this.bestStreak = 0;
        this.startTime = null;
        this.questionStartTime = null;
        this.answers = [];
        this.timePerQuestion = 30;
        this.timer = null;
        this.timeRemaining = 0;
        this.isPaused = false;
        this.lifelinesUsed = 0;
        this.maxLifelines = 1;
        this.init();
    }
    init() {
        this.bindEvents();
        this.loadTheme();
        this.loadLeaderboard();
        this.showScreen('setupScreen');
    }
    // Event Binding
    bindEvents() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        // Setup form
        document.getElementById('setupForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.startQuiz();
        });
        // Quiz controls
        document.getElementById('pauseBtn').addEventListener('click', () => this.pauseQuiz());
        document.getElementById('skipBtn').addEventListener('click', () => this.skipQuestion());
        document.getElementById('fiftyFiftyBtn').addEventListener('click', () => this.useFiftyFifty());

        // Modal controls
        document.getElementById('resumeBtn').addEventListener('click', () => this.resumeQuiz());
        document.getElementById('quitBtn').addEventListener('click', () => this.quitQuiz());

        // Results actions
        document.getElementById('reviewBtn').addEventListener('click', () => this.showReview());
        document.getElementById('newQuizBtn').addEventListener('click', () => this.startNewQuiz());
        document.getElementById('leaderboardBtn').addEventListener('click', () => this.showLeaderboard());

        // Navigation
        document.getElementById('backToResultsBtn').addEventListener('click', () => this.showScreen('resultsScreen'));
        document.getElementById('backToResultsFromLeaderboardBtn').addEventListener('click', () => this.showScreen('resultsScreen'));
        document.getElementById('clearLeaderboardBtn').addEventListener('click', () => this.clearLeaderboard());

        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }
    // Theme Management
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('quiz-theme', newTheme);
        
        const themeIcon = document.querySelector('.theme-icon');
        themeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
        
        this.announce(`Switched to ${newTheme} theme`);
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('quiz-theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        const themeIcon = document.querySelector('.theme-icon');
        themeIcon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    }

    // Screen Management
    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        document.getElementById(screenId).classList.add('active');
        
        // Announce screen change
        const screenTitle = document.querySelector(`#${screenId} h2`)?.textContent || 'New screen';
        this.announce(`Navigated to ${screenTitle}`);
    }

    // Quiz Initialization
    async startQuiz() {
        const setupData = this.getSetupData();
        this.timePerQuestion = setupData.timeLimit;
        
        this.showScreen('loadingScreen');
        
        try {
            await this.fetchQuestions(setupData);
            this.resetQuizState();
            this.showScreen('quizScreen');
            this.startTime = Date.now();
            this.showQuestion();
        } catch (error) {
            console.error('Error starting quiz:', error);
            alert('Failed to load questions. Please check your internet connection and try again.');
            this.showScreen('setupScreen');
        }
    }

    getSetupData() {
        return {
            category: document.getElementById('categorySelect').value,
            difficulty: document.getElementById('difficultySelect').value,
            amount: parseInt(document.getElementById('questionCount').value),
            timeLimit: parseInt(document.getElementById('timeLimit').value)
        };
    }

    async fetchQuestions(setupData) {
        let url = `https://opentdb.com/api.php?amount=${setupData.amount}&type=multiple`;
        
        if (setupData.category) url += `&category=${setupData.category}`;
        if (setupData.difficulty) url += `&difficulty=${setupData.difficulty}`;

        const response = await fetch(url);
        const data = await response.json();
        
        if (data.response_code !== 0) {
            throw new Error('Failed to fetch questions from API');
        }

        this.questions = data.results.map(q => ({
            question: this.decodeHtml(q.question),
            correct_answer: this.decodeHtml(q.correct_answer),
            incorrect_answers: q.incorrect_answers.map(a => this.decodeHtml(a)),
            category: this.decodeHtml(q.category),
            difficulty: q.difficulty,
            all_answers: this.shuffleArray([
                this.decodeHtml(q.correct_answer),
                ...q.incorrect_answers.map(a => this.decodeHtml(a))
            ])
        }));
    }

    decodeHtml(html) {
        const txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    resetQuizState() {
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.streak = 0;
        this.bestStreak = 0;
        this.answers = [];
        this.lifelinesUsed = 0;
        this.isPaused = false;
        
        // Reset UI
        document.getElementById('fiftyFiftyBtn').disabled = false;
        document.getElementById('lifelinesRemaining').textContent = `${this.maxLifelines - this.lifelinesUsed} remaining`;
    }

    // Question Display
    showQuestion() {
        if (this.currentQuestionIndex >= this.questions.length) {
            this.endQuiz();
            return;
        }

        const question = this.questions[this.currentQuestionIndex];
        this.questionStartTime = Date.now();
        
        // Update UI
        document.getElementById('questionCounter').textContent = 
            `Question ${this.currentQuestionIndex + 1} of ${this.questions.length}`;
        document.getElementById('questionText').textContent = question.question;
        document.getElementById('questionCategory').textContent = question.category;
        document.getElementById('questionDifficulty').textContent = 
            question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1);

        // Update progress
        const progress = ((this.currentQuestionIndex) / this.questions.length) * 100;
        document.getElementById('progressFill').style.width = `${progress}%`;

        // Update streak
        document.querySelector('.streak-text').textContent = `Streak: ${this.streak}`;

        // Show answers
        this.displayAnswers(question.all_answers);

        // Start timer
        this.startTimer();

        // Announce question
        this.announce(`Question ${this.currentQuestionIndex + 1}: ${question.question}`);
    }

    displayAnswers(answers) {
        const answersGrid = document.getElementById('answersGrid');
        answersGrid.innerHTML = '';

        answers.forEach((answer, index) => {
            const button = document.createElement('button');
            button.className = 'answer-btn';
            button.textContent = answer;
            button.setAttribute('data-answer', answer);
            button.addEventListener('click', () => this.selectAnswer(answer));
            
            // Add keyboard support
            button.setAttribute('tabindex', '0');
            button.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.selectAnswer(answer);
                }
            });

            answersGrid.appendChild(button);
        });
    }

    // Timer Management
    startTimer() {
        this.timeRemaining = this.timePerQuestion;
        this.updateTimerDisplay();
        
        this.timer = setInterval(() => {
            if (!this.isPaused) {
                this.timeRemaining--;
                this.updateTimerDisplay();
                
                if (this.timeRemaining <= 0) {
                    this.timeUp();
                }
            }
        }, 1000);
    }

    updateTimerDisplay() {
        const timerText = document.getElementById('timerText');
        const timerProgress = document.getElementById('timerProgress');
        
        timerText.textContent = this.timeRemaining;
        
        // Calculate progress (inverted for countdown)
        const progress = (this.timeRemaining / this.timePerQuestion) * 283;
        timerProgress.style.strokeDashoffset = 283 - progress;
        
        // Update color based on time remaining
        timerProgress.classList.remove('warning', 'danger');
        if (this.timeRemaining <= 5) {
            timerProgress.classList.add('danger');
        } else if (this.timeRemaining <= 10) {
            timerProgress.classList.add('warning');
        }
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    timeUp() {
        this.stopTimer();
        this.selectAnswer(null); // No answer selected
    }

    // Answer Selection
    selectAnswer(selectedAnswer) {
        this.stopTimer();
        
        const question = this.questions[this.currentQuestionIndex];
        const isCorrect = selectedAnswer === question.correct_answer;
        const timeSpent = Math.round((Date.now() - this.questionStartTime) / 1000);
        
        // Record answer
        this.answers.push({
            question: question.question,
            selectedAnswer: selectedAnswer,
            correctAnswer: question.correct_answer,
            allAnswers: question.all_answers,
            isCorrect: isCorrect,
            timeSpent: timeSpent,
            category: question.category,
            difficulty: question.difficulty
        });

        // Update score and streak
        if (isCorrect) {
            this.score++;
            this.streak++;
            this.bestStreak = Math.max(this.bestStreak, this.streak);
        } else {
            this.streak = 0;
        }

        // Disable answer buttons
        const answerButtons = document.querySelectorAll('.answer-btn');
        answerButtons.forEach(btn => {
            btn.disabled = true;
            if (btn.getAttribute('data-answer') === question.correct_answer) {
                btn.classList.add('correct');
            } else if (btn.getAttribute('data-answer') === selectedAnswer && !isCorrect) {
                btn.classList.add('incorrect');
            }
        });

        // Show feedback
        this.showFeedback(isCorrect, timeSpent);

        // Move to next question after delay
        setTimeout(() => {
            this.currentQuestionIndex++;
            this.showQuestion();
        }, 2000);
    }

    showFeedback(isCorrect, timeSpent) {
        const modal = document.getElementById('feedbackModal');
        const icon = document.getElementById('feedbackIcon');
        const title = document.getElementById('feedbackTitle');
        const explanation = document.getElementById('feedbackExplanation');
        const timeDisplay = document.getElementById('feedbackTime');
        const streakDisplay = document.getElementById('feedbackStreak');

        icon.textContent = isCorrect ? '✓' : '✗';
        icon.className = `feedback-icon ${isCorrect ? 'correct' : 'incorrect'}`;
        title.textContent = isCorrect ? 'Correct!' : 'Incorrect';
        explanation.textContent = isCorrect ? 
            'Great job! Keep up the good work.' : 
            `The correct answer was: ${this.questions[this.currentQuestionIndex].correct_answer}`;
        timeDisplay.textContent = `Time: ${timeSpent}s`;
        streakDisplay.textContent = `Streak: ${this.streak}`;

        modal.classList.add('show');
        
        setTimeout(() => {
            modal.classList.remove('show');
        }, 1800);
    }

    // Lifelines
    useFiftyFifty() {
        if (this.lifelinesUsed >= this.maxLifelines) return;
        
        this.lifelinesUsed++;
        const question = this.questions[this.currentQuestionIndex];
        const answerButtons = document.querySelectorAll('.answer-btn');
        
        // Find incorrect answers to eliminate
        const incorrectButtons = Array.from(answerButtons).filter(btn => 
            btn.getAttribute('data-answer') !== question.correct_answer
        );
        
        // Randomly eliminate 2 incorrect answers
        const toEliminate = this.shuffleArray(incorrectButtons).slice(0, 2);
        toEliminate.forEach(btn => {
            btn.classList.add('eliminated');
            btn.disabled = true;
        });

        // Update UI
        document.getElementById('fiftyFiftyBtn').disabled = true;
        document.getElementById('lifelinesRemaining').textContent = 
            `${this.maxLifelines - this.lifelinesUsed} remaining`;
            
        this.announce('50:50 lifeline used. Two incorrect answers eliminated.');
    }

    // Quiz Controls
    pauseQuiz() {
        this.isPaused = true;
        document.getElementById('pauseModal').classList.add('show');
        this.announce('Quiz paused');
    }

    resumeQuiz() {
        this.isPaused = false;
        document.getElementById('pauseModal').classList.remove('show');
        this.announce('Quiz resumed');
    }

    skipQuestion() {
        if (confirm('Are you sure you want to skip this question?')) {
            this.selectAnswer(null);
        }
    }

    quitQuiz() {
        if (confirm('Are you sure you want to quit the quiz?')) {
            this.stopTimer();
            this.showScreen('setupScreen');
            this.announce('Quiz ended');
        }
    }

    // Quiz End
    endQuiz() {
        this.stopTimer();
        const totalTime = Math.round((Date.now() - this.startTime) / 1000);
        const averageTime = Math.round(totalTime / this.questions.length);
        const accuracy = Math.round((this.score / this.questions.length) * 100);

        // Update results display
        document.getElementById('finalScore').textContent = `${this.score}/${this.questions.length}`;
        document.getElementById('accuracyPercentage').textContent = `${accuracy}%`;
        document.getElementById('totalTime').textContent = this.formatTime(totalTime);
        document.getElementById('averageTime').textContent = `${averageTime}s`;
        document.getElementById('bestStreak').textContent = this.bestStreak.toString();

        // Award badge
        const badge = this.getBadge(accuracy);
        document.getElementById('badgeEarned').textContent = badge;

        // Show weak areas
        this.showWeakAreas();

        // Save to leaderboard
        this.saveToLeaderboard({
            score: this.score,
            total: this.questions.length,
            accuracy: accuracy,
            totalTime: totalTime,
            averageTime: averageTime,
            bestStreak: this.bestStreak,
            badge: badge,
            date: new Date().toLocaleDateString()
        });

        this.showScreen('resultsScreen');
        this.announce(`Quiz completed! You scored ${this.score} out of ${this.questions.length}`);
    }

    getBadge(accuracy) {
        if (accuracy >= 90) return '🏆 Perfect!';
        if (accuracy >= 80) return '🥇 Excellent';
        if (accuracy >= 70) return '🥈 Good';
        if (accuracy >= 60) return '🥉 Fair';
        return '📚 Keep Learning';
    }

    showWeakAreas() {
        const categoryStats = {};
        
        this.answers.forEach(answer => {
            if (!categoryStats[answer.category]) {
                categoryStats[answer.category] = { correct: 0, total: 0 };
            }
            categoryStats[answer.category].total++;
            if (answer.isCorrect) {
                categoryStats[answer.category].correct++;
            }
        });

        const weakAreas = Object.entries(categoryStats)
            .map(([category, stats]) => ({
                category,
                accuracy: (stats.correct / stats.total) * 100
            }))
            .filter(area => area.accuracy < 70)
            .sort((a, b) => a.accuracy - b.accuracy);

        const weakAreasContainer = document.getElementById('weakAreas');
        if (weakAreas.length === 0) {
            weakAreasContainer.innerHTML = '<p>Great job! No weak areas identified.</p>';
        } else {
            weakAreasContainer.innerHTML = `
                <p>Areas for improvement:</p>
                <ul>
                    ${weakAreas.map(area => 
                        `<li>${area.category}: ${Math.round(area.accuracy)}% accuracy</li>`
                    ).join('')}
                </ul>
            `;
        }
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // Review Mode
    showReview() {
        const reviewContent = document.getElementById('reviewContent');
        reviewContent.innerHTML = '';

        this.answers.forEach((answer, index) => {
            const reviewItem = document.createElement('div');
            reviewItem.className = 'review-item';
            
            reviewItem.innerHTML = `
                <div class="review-question">${index + 1}. ${answer.question}</div>
                <div class="review-answers">
                    ${answer.allAnswers.map(option => `
                        <div class="review-answer ${
                            option === answer.correctAnswer ? 'correct' : ''
                        } ${
                            option === answer.selectedAnswer && option !== answer.correctAnswer ? 'user-selected incorrect' : ''
                        } ${
                            option === answer.selectedAnswer && option === answer.correctAnswer ? 'user-selected' : ''
                        }">
                            ${option}
                            ${option === answer.correctAnswer ? ' ✓' : ''}
                            ${option === answer.selectedAnswer && option !== answer.correctAnswer ? ' ✗ (Your answer)' : ''}
                        </div>
                    `).join('')}
                </div>
                <div class="review-meta">
                    <span>Category: ${answer.category}</span>
                    <span>Time: ${answer.timeSpent}s</span>
                    <span class="${answer.isCorrect ? 'correct' : 'incorrect'}">
                        ${answer.isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                </div>
            `;
            
            reviewContent.appendChild(reviewItem);
        });

        this.showScreen('reviewScreen');
    }

    // Leaderboard
    saveToLeaderboard(result) {
        let leaderboard = JSON.parse(localStorage.getItem('quiz-leaderboard') || '[]');
        leaderboard.push(result);
        
        // Sort by score (descending), then by accuracy, then by average time
        leaderboard.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
            return a.averageTime - b.averageTime;
        });

        // Keep only top 5
        leaderboard = leaderboard.slice(0, 5);
        
        localStorage.setItem('quiz-leaderboard', JSON.stringify(leaderboard));
    }

    loadLeaderboard() {
        const leaderboard = JSON.parse(localStorage.getItem('quiz-leaderboard') || '[]');
        return leaderboard;
    }

    showLeaderboard() {
        const leaderboard = this.loadLeaderboard();
        const leaderboardList = document.getElementById('leaderboardList');
        
        if (leaderboard.length === 0) {
            leaderboardList.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--text-muted);">No scores yet. Be the first!</p>';
        } else {
            leaderboardList.innerHTML = leaderboard.map((entry, index) => `
                <div class="leaderboard-entry">
                    <div class="leaderboard-rank">#${index + 1}</div>
                    <div class="leaderboard-info">
                        <div class="leaderboard-score">${entry.score}/${entry.total} (${entry.accuracy}%)</div>
                        <div class="leaderboard-details">
                            ${entry.badge} • Avg: ${entry.averageTime}s • Streak: ${entry.bestStreak} • ${entry.date}
                        </div>
                    </div>
                </div>
            `).join('');
        }

        this.showScreen('leaderboardScreen');
    }

    clearLeaderboard() {
        if (confirm('Are you sure you want to clear the leaderboard?')) {
            localStorage.removeItem('quiz-leaderboard');
            this.showLeaderboard();
            this.announce('Leaderboard cleared');
        }
    }

    // New Quiz
    startNewQuiz() {
        this.stopTimer();
        this.showScreen('setupScreen');
        this.announce('Ready to start a new quiz');
    }

    // Keyboard Navigation
    handleKeyDown(e) {
        // Only handle keyboard events in quiz screen
        if (!document.getElementById('quizScreen').classList.contains('active')) return;

        // Number keys for answer selection
        if (e.key >= '1' && e.key <= '4') {
            e.preventDefault();
            const answerButtons = document.querySelectorAll('.answer-btn:not(:disabled)');
            const index = parseInt(e.key) - 1;
            if (answerButtons[index]) {
                answerButtons[index].click();
            }
        }

        // Space for pause
        if (e.key === ' ' && !e.target.matches('input, textarea, button')) {
            e.preventDefault();
            this.pauseQuiz();
        }

        // Escape for quit
        if (e.key === 'Escape') {
            this.quitQuiz();
        }
    }

    // Accessibility
    announce(message) {
        const announcements = document.getElementById('announcements');
        announcements.textContent = message;
        
        // Clear after a short delay
        setTimeout(() => {
            announcements.textContent = '';
        }, 1000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new QuizApp();
});

// Service Worker for offline functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
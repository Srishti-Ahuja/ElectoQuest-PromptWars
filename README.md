# ElectoQuest 🗳️✨

**ElectoQuest** is a responsive, interactive single-page application (SPA) designed to gamify the voter registration and preparation process. It transforms the civic duty of voting into a "Fantasy Quest," guiding users through essential steps while rewarding progress with experience points (XP) and digital badges.

## 🌟 Key Features

- **Interactive Quest Map**: A visual roadmap featuring sequential "Quest Nodes" that unlock as you progress.
- **Civic XP System**: Earn points for every step completed, from registration to candidate research.
- **Digital Rewards Armory**: A dedicated panel displaying your "Forged Badges," which shimmer as you achieve milestones.
- **Persistence**: Progress is automatically saved to your browser's local storage.
- **Gamified Cyber-Civic Aesthetic**: A sleek, dark theme with neon accents, glowing paths, and a top progress bar.
- **MCQ Engagement System**: Unlock quests by answering short election-based quizzes correctly.
- **Cloud Integrations**: Built with an Express.js backend integrating Google Cloud Logging for observability, and serving assets from a public Google Cloud Storage bucket.
- **Quality Assurance**: 100% E2E test coverage using Playwright.

## 🗺️ The Journey

- **Mock Authentication**: Secure your progress with a personalized account (Username/Password).
- **Expanded Quest Map**: An 8-node roadmap that guides users from registration to long-term civic engagement.

## 🧪 Testing

This project uses Playwright for comprehensive E2E testing to simulate user journeys, MCQ interactions, and progress updates.

To run the tests and view the report:
```bash
npm install
npx playwright install --with-deps chromium
npx playwright test
```
The test results are available in `test-report.html`.
- **Civic XP & Leaderboard**: Earn points and forge your identity as a "Guardian of Democracy."
- **Refined Aesthetics**: A simple yet attractive "Sleek Dark" theme with gold accents.

## 🗺️ The Journey (8 Nodes)

1.  **The Scroll of Registration**: Secure your place on the electoral roll.
2.  **The Map of Polling**: Find your assigned booth.
3.  **The Chronicle of Candidates**: Research platforms via MyNeta.
4.  **The Tome of Measures**: Study party manifestos.
5.  **The Pledge of the Polls**: Create your Election Day plan.
6.  **The Watcher's Duty**: Connect with your local BLO.
7.  **The Messenger's Wing**: Spread civic awareness to your community.
8.  **Pillar of Democracy**: Fulfill your ultimate duty as an informed voter.



## 🛠️ Technology Stack

- **HTML5**: Semantic structure.
- **Vanilla CSS3**: Custom design system with glassmorphism and animations.
- **Vanilla JavaScript**: State management and interactive logic.
- **Local Storage API**: Data persistence.

## 🚀 Getting Started

1.  Open application in any modern web browser.
2.  Enter your "Realm" (State) and Zip Code on the landing page.
3.  Click "Begin My Quest" to enter the dashboard.
4.  Complete quests sequentially to unlock new rewards and prepare for Election Day!

---
*Created with 💙 for the future of civic engagement.*
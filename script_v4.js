document.addEventListener('DOMContentLoaded', () => {
    console.log("ElectoQuest Core Engine v5.0 (Gamified) Booting...");

    // --- State & Storage ---
    let users = {};
    let currentUser = null;
    let state = { completedQuests: [], totalXP: 0, userLocation: { state: '', pincode: '' }, onboarded: false };
    let currentQuestId = null;

    try {
        const storedUsers = localStorage.getItem('electoquest_users');
        if (storedUsers) {
            users = JSON.parse(storedUsers);
        }
    } catch (e) {
        localStorage.removeItem('electoquest_users');
        users = {};
    }

    // --- Cloud Logging API Wrapper ---
    async function logEvent(eventName, details) {
        try {
            await fetch('/api/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ event: eventName, details })
            });
        } catch (e) {
            console.error("Logging failed", e);
        }
    }

    // --- Data Definitions (with MCQs) ---
    const QUESTS = {
        1: { 
            id: 1, title: "Registration", desc: "Verify your name in the electoral roll or register as a new voter.", 
            task: "Prove your knowledge to earn your badge.", xp: 100, badge: "badge_registration",
            questions: [
                { q: "What is the minimum age to vote in India?", options: ["16", "18", "21"], ans: 1 },
                { q: "Which form is used for new voter registration?", options: ["Form 6", "Form 8", "Form 7"], ans: 0 },
                { q: "What is the official ECI portal for voter services?", options: ["voters.eci.gov.in", "india.gov.in", "eci.com"], ans: 0 }
            ]
        },
        2: { 
            id: 2, title: "Polling Station", desc: "Identify your local polling booth.", task: "Answer to unlock.", xp: 200, badge: "badge_polling",
            questions: [
                { q: "What document is usually sent to your house before elections?", options: ["Voter Slip", "Aadhar Card", "Ration Card"], ans: 0 },
                { q: "Who manages the polling booth?", options: ["Police Officer", "Presiding Officer", "District Collector"], ans: 1 },
                { q: "How do you find your booth online?", options: ["Google Maps", "Electoral Search Portal", "Social Media"], ans: 1 }
            ]
        },
        3: { 
            id: 3, title: "Candidates", desc: "Research candidate affidavits.", task: "Test your knowledge.", xp: 300, badge: "badge_candidates",
            questions: [
                { q: "What is an affidavit?", options: ["A sworn statement", "A party ticket", "A voting machine"], ans: 0 },
                { q: "Which app shows candidate criminal records?", options: ["Voter Helpline App", "Know Your Candidate (KYC)", "WhatsApp"], ans: 1 },
                { q: "Candidates must disclose their assets.", options: ["True", "False", "Only if asked"], ans: 0 }
            ]
        },
        4: { 
            id: 4, title: "Manifestos", desc: "Study party manifestos.", task: "Complete to proceed.", xp: 400, badge: "badge_measures",
            questions: [
                { q: "What is a manifesto?", options: ["A legal contract", "A document of promises", "A voting list"], ans: 1 },
                { q: "When are manifestos usually released?", options: ["After voting", "On voting day", "Before elections"], ans: 2 },
                { q: "Can a party be sued for not fulfilling manifestos?", options: ["Yes", "No", "Only the ruling party"], ans: 1 }
            ]
        },
        5: { 
            id: 5, title: "Voting Plan", desc: "Decide when and how you'll go to the polls.", task: "Plan ahead.", xp: 500, badge: "badge_vote",
            questions: [
                { q: "What time do polls usually open?", options: ["7:00 AM", "10:00 AM", "12:00 PM"], ans: 0 },
                { q: "Can you vote if you don't have a Voter ID card?", options: ["No", "Yes, with alternative ID like Aadhar", "Only if the BLO allows"], ans: 1 },
                { q: "Are mobile phones allowed inside the voting compartment?", options: ["Yes", "No", "Only for photos"], ans: 1 }
            ]
        },
        6: { 
            id: 6, title: "BLO Connect", desc: "Know your Booth Level Officer.", task: "Understand your local hero.", xp: 600, badge: "badge_registration",
            questions: [
                { q: "What does BLO stand for?", options: ["Booth Level Officer", "Block Liaison Officer", "Base Level Operator"], ans: 0 },
                { q: "Can a BLO help correct name spellings?", options: ["Yes", "No", "Only the Election Commissioner"], ans: 0 },
                { q: "Who appoints the BLO?", options: ["Political Parties", "Election Commission", "Local Police"], ans: 1 }
            ]
        },
        7: { 
            id: 7, title: "Awareness", desc: "Help others understand the importance of their vote.", task: "Spread the word.", xp: 700, badge: "badge_polling",
            questions: [
                { q: "Which day is celebrated as National Voters' Day?", options: ["Jan 26", "Jan 25", "Aug 15"], ans: 1 },
                { q: "What is SVEEP?", options: ["A voting machine", "Voter education program", "A political party"], ans: 1 },
                { q: "Is proxy voting allowed for ordinary citizens?", options: ["Yes", "No", "Only for seniors"], ans: 1 }
            ]
        },
        8: { 
            id: 8, title: "Final Pillar", desc: "You are a fully informed voter.", task: "Final test.", xp: 1000, badge: "badge_vote",
            questions: [
                { q: "What is NOTA?", options: ["None of the Above", "New Output Testing Agency", "National Organization of Teachers"], ans: 0 },
                { q: "Which machine is used for casting votes?", options: ["ATM", "EVM", "VVPAT only"], ans: 1 },
                { q: "Voting is a...", options: ["Fundamental Right", "Constitutional Right", "Moral Duty"], ans: 1 }
            ]
        }
    };

    // --- DOM Elements ---
    const get = (id) => document.getElementById(id);
    const authSection = get('auth-section'), loginView = get('login-view'), signupView = get('signup-view');
    const landing = get('landing'), dashboard = get('dashboard'), displayUsername = get('display-username');
    const loginError = get('login-error'), signupError = get('signup-error');
    const loginUser = get('login-username'), loginPass = get('login-password');
    const signupUser = get('signup-username'), signupPass = get('signup-password');
    const btnLogin = get('btn-login'), btnSignup = get('btn-signup'), btnLogout = get('btn-logout'), btnBegin = get('btn-begin');
    
    const xpCounter = get('xp-counter'), topProgressBar = get('top-progress-bar');
    const modalOverlay = get('modal-overlay'), modalContent = get('modal-content'), modalClose = get('modal-close');
    const levelUpOverlay = get('level-up-overlay');

    // --- Core Logic ---
    function saveUsers() { localStorage.setItem('electoquest_users', JSON.stringify(users)); }

    function saveCurrentState() {
        if (currentUser && users[currentUser]) {
            users[currentUser].state = state;
            saveUsers();
        }
    }

    function showError(el, msg) {
        if (!el) return;
        el.innerText = msg;
        el.classList.remove('hidden');
    }

    function clearErrors() {
        if (loginError) { loginError.innerText = ''; loginError.classList.add('hidden'); }
        if (signupError) { signupError.innerText = ''; signupError.classList.add('hidden'); }
    }

    function login(username, password) {
        clearErrors();
        if (!username || !password) return showError(loginError, "Username and password required.");
        if (users[username] && users[username].password === password) {
            currentUser = username;
            state = users[username].state;
            displayUsername.innerText = username;
            authSection.classList.add('hidden');
            if (state.onboarded) showDashboard();
            else landing.classList.remove('hidden');
            updateUI();
            logEvent("user_login", { username });
        } else {
            showError(loginError, "Invalid username or password.");
        }
    }

    function signup(username, password) {
        clearErrors();
        if (!username || !password) return showError(signupError, "Please fill in all fields.");
        if (users[username]) return showError(signupError, "Username already taken.");
        
        users[username] = { password, state: { completedQuests: [], totalXP: 0, userLocation: { state: '', pincode: '' }, onboarded: false } };
        saveUsers();
        showError(signupError, "Account forged! You may now login.");
        setTimeout(() => { toggleAuthView(); clearErrors(); }, 1000);
    }

    function toggleAuthView() {
        loginView.classList.toggle('hidden');
        signupView.classList.toggle('hidden');
        clearErrors();
    }

    function showDashboard() {
        landing.classList.add('hidden');
        dashboard.classList.remove('hidden');
    }

    function triggerLevelUp() {
        levelUpOverlay.classList.add('active');
        setTimeout(() => { levelUpOverlay.classList.remove('active'); }, 2000);
    }

    function updateUI() {
        if (!currentUser) return;

        animateValue(xpCounter, parseInt(xpCounter.innerText) || 0, state.totalXP, 800);

        const totalQuests = Object.keys(QUESTS).length;
        const progressPercentage = (state.completedQuests.length / totalQuests) * 100;
        if (topProgressBar) {
            topProgressBar.style.width = `${progressPercentage}%`;
            const topProgressContainer = get('top-progress-container');
            if (topProgressContainer) topProgressContainer.setAttribute('aria-valuenow', Math.round(progressPercentage));
        }

        document.querySelectorAll('.node').forEach(node => {
            const qId = parseInt(node.dataset.quest);
            const quest = QUESTS[qId];
            if (!quest) return;
            const iconEl = node.querySelector('i');
            
            if (state.completedQuests.includes(qId)) {
                node.className = 'node completed';
                node.setAttribute('aria-disabled', 'false');
                node.setAttribute('tabindex', '0');
                if (iconEl) iconEl.className = 'fas fa-check';
            } else {
                const isUnlocked = qId === 1 || state.completedQuests.includes(qId - 1);
                node.className = isUnlocked ? 'node unlocked' : 'node locked';
                node.setAttribute('aria-disabled', isUnlocked ? 'false' : 'true');
                node.setAttribute('tabindex', isUnlocked ? '0' : '-1');
                if (iconEl) iconEl.className = 'fas ' + getIconForQuest(qId);
            }
        });

        document.querySelectorAll('.badge-item').forEach(badge => badge.classList.remove('earned'));
        state.completedQuests.forEach(qId => {
            if (QUESTS[qId]) {
                const badgeEl = get(QUESTS[qId].badge);
                if (badgeEl) badgeEl.classList.add('earned');
            }
        });
    }

    function getIconForQuest(qId) {
        const icons = { 1: 'fa-feather-pointed', 2: 'fa-compass', 3: 'fa-users-rectangle', 4: 'fa-book-open', 5: 'fa-shield-halved', 6: 'fa-eye', 7: 'fa-bullhorn', 8: 'fa-monument' };
        return icons[qId] || 'fa-star';
    }

    function animateValue(obj, start, end, duration) {
        if (!obj) return;
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start);
            if (progress < 1) window.requestAnimationFrame(step);
        };
        window.requestAnimationFrame(step);
    }

    function openQuest(qId) {
        const quest = QUESTS[qId];
        if (!quest) return;
        const isCompleted = state.completedQuests.includes(qId);
        const isUnlocked = qId === 1 || state.completedQuests.includes(qId - 1);
        if (!isUnlocked && !isCompleted) return;

        currentQuestId = qId;
        logEvent("challenge_started", { username: currentUser, quest_id: qId });

        let html = `
            <h2 class="modal-title" id="modal-title">${quest.title}</h2>
            <p class="modal-desc">${quest.desc}</p>
        `;

        if (isCompleted) {
            html += `<p class="quest-status">QUEST FULFILLED</p>
            <div style="margin-top: 2rem; display: flex; align-items: center; gap: 1.5rem; justify-content: center;">
                <img src="https://storage.googleapis.com/electoquest-assets-silicon-garage-494118-a1/${quest.badge}.png" style="width: 80px;" class="shimmer" alt="${quest.title} Badge">
                <div><h4 style="font-size: 0.7rem; color: var(--text-dim);">CIVIC XP</h4><p style="font-size: 1.8rem; font-weight: 800; color:var(--secondary);">+${quest.xp}</p></div>
            </div>`;
        } else {
            html += `<div class="mcq-container" id="mcq-form" role="radiogroup" aria-label="Quest Challenge Questions">`;
            quest.questions.forEach((q, idx) => {
                html += `<div class="mcq-question-block" data-idx="${idx}">
                    <p class="mcq-q-text" id="q-text-${idx}">${idx+1}. ${q.q}</p>
                    <div class="mcq-options" role="radiogroup" aria-labelledby="q-text-${idx}">
                        ${q.options.map((opt, optIdx) => `<button class="mcq-opt" data-opt="${optIdx}" role="radio" aria-checked="false" tabindex="0">${opt}</button>`).join('')}
                    </div>
                </div>`;
            });
            html += `</div>
            <button id="btn-complete-quest" class="btn-primary" disabled aria-disabled="true">Complete Quest & Earn Reward</button>
            <div style="margin-top: 2rem; display: flex; align-items: center; gap: 1.5rem; justify-content: center;">
                <img src="https://storage.googleapis.com/electoquest-assets-silicon-garage-494118-a1/${quest.badge}.png" style="width: 80px; filter: grayscale(1) opacity(0.3)" alt="${quest.title} Badge Locked">
                <div><h4 style="font-size: 0.7rem; color: var(--text-dim);">CIVIC XP</h4><p style="font-size: 1.8rem; font-weight: 800; color:var(--secondary);">+${quest.xp}</p></div>
            </div>`;
        }

        modalContent.innerHTML = html;
        modalOverlay.classList.remove('hidden');

        if (!isCompleted) {
            let selections = [-1, -1, -1];
            const qBlocks = document.querySelectorAll('.mcq-question-block');
            
            qBlocks.forEach((block) => {
                const qIdx = parseInt(block.dataset.idx);
                const opts = block.querySelectorAll('.mcq-opt');
                opts.forEach((opt) => {
                    opt.onclick = () => {
                        // If already correctly answered, block changes
                        if (selections[qIdx] === quest.questions[qIdx].ans) return;

                        opts.forEach(o => {
                            o.classList.remove('selected', 'wrong');
                            o.setAttribute('aria-checked', 'false');
                        });
                        opt.classList.add('selected');
                        opt.setAttribute('aria-checked', 'true');
                        const selectedVal = parseInt(opt.dataset.opt);
                        
                        if (selectedVal === quest.questions[qIdx].ans) {
                            opt.classList.add('correct');
                            selections[qIdx] = selectedVal;
                        } else {
                            opt.classList.add('wrong');
                            logEvent("quiz_failed", { username: currentUser, quest_id: qId, question: qIdx });
                            setTimeout(() => { 
                                opt.classList.remove('selected', 'wrong'); 
                                opt.setAttribute('aria-checked', 'false');
                            }, 800);
                        }

                        // Check if all correct
                        if (selections.every((sel, i) => sel === quest.questions[i].ans)) {
                            const completeBtn = get('btn-complete-quest');
                            completeBtn.disabled = false;
                            completeBtn.setAttribute('aria-disabled', 'false');
                        }
                    };
                });
            });

            get('btn-complete-quest').onclick = () => {
                state.completedQuests.push(qId);
                state.totalXP += quest.xp;
                saveCurrentState();
                logEvent("circuit_completed", { username: currentUser, quest_id: qId });
                updateUI();
                modalOverlay.classList.add('hidden');
                triggerLevelUp();
            };
        }
    }

    // --- Event Listeners ---
    if (get('show-signup')) get('show-signup').onclick = (e) => { e.preventDefault(); toggleAuthView(); };
    if (get('show-login')) get('show-login').onclick = (e) => { e.preventDefault(); toggleAuthView(); };
    if (btnLogin) btnLogin.onclick = () => login(loginUser.value, loginPass.value);
    if (btnSignup) btnSignup.onclick = () => signup(signupUser.value, signupPass.value);
    
    if (btnLogout) {
        btnLogout.onclick = () => {
            currentUser = null;
            dashboard.classList.add('hidden');
            authSection.classList.remove('hidden');
            if (loginUser) loginUser.value = '';
            if (loginPass) loginPass.value = '';
        };
    }

    if (btnBegin) {
        btnBegin.onclick = () => {
            const stateInput = get('user-state'), pinInput = get('user-pincode');
            if (!stateInput.value || !pinInput.value) return alert("State and Pincode required.");
            state.userLocation = { state: stateInput.value, pincode: pinInput.value };
            state.onboarded = true;
            saveCurrentState();
            showDashboard();
            updateUI();
        };
    }

    document.querySelectorAll('.node').forEach(node => {
        node.onclick = () => openQuest(parseInt(node.dataset.quest));
    });

    if (modalClose) modalClose.onclick = () => modalOverlay.classList.add('hidden');
    if (modalOverlay) {
        modalOverlay.onclick = (e) => {
            if (e.target === modalOverlay) modalOverlay.classList.add('hidden');
        };
    }

    [loginUser, loginPass, signupUser, signupPass].forEach(el => { if (el) el.oninput = clearErrors; });
});

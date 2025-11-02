document.addEventListener('DOMContentLoaded', () => {
    // Utility helpers
    const openModal = overlayElm => {
        overlayElm.classList.add('open');
        document.body.classList.add('scroll-locked');
    };
    const closeModal = overlayElm => {
        overlayElm.classList.remove('open');
        document.body.classList.remove('scroll-locked');
    };
    const setupModalInteractions = overlayElm => {
        // Close on overlay click
        overlayElm.addEventListener('click', e => {
            if (e.target === overlayElm) closeModal(overlayElm);
        });
        // Close on [data-close-modal] inside and ESC
        overlayElm.addEventListener('click', e => {
            const btn = e.target.closest('[data-close-modal]');
            if (btn) closeModal(overlayElm);
        });
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && overlayElm.classList.contains('open')) {
                closeModal(overlayElm);
            }
        });
    };

    // App (alert-like) modal API
    const appModal = document.getElementById('app-modal');
    const appModalOk = document.getElementById('app-modal-ok');
    const showAppModal = (title, message) => {
        document.getElementById('app-modal-title').textContent = title ?? 'Message';
        document.getElementById('app-modal-message').textContent = message ?? '';
        openModal(appModal);
    };
    appModalOk.addEventListener('click', () => closeModal(appModal));
    setupModalInteractions(appModal);

    // User Detail modal interactions
    const userDetailModal = document.getElementById('user-detail-modal');
    const closeUserBtn = document.getElementById('close-modal-btn');
    closeUserBtn.setAttribute('data-close-modal', '');
    setupModalInteractions(userDetailModal);

    // Form submit with validation and dedupe
    document.getElementById('form').addEventListener('submit', e => {
        e.preventDefault();
        const name = e.target.name.value.trim();
        const gradeStr = e.target.grade.value.trim();
        const grade = Number(gradeStr);

        if (!name) {
            showAppModal('Validation', 'Please enter a name.');
            return;
        }
        if (!Number.isFinite(grade) || grade < 0 || grade > 100) {
            showAppModal('Validation', 'Please enter a grade between 0 and 100.');
            return;
        }

        const studentListElm = document.getElementById('student-list');
        const studentListElmCount = studentListElm.children.length;
        const studentNameAndGradeList = new Set();
        let gradeTotal = 0;
        studentNameAndGradeList.add(`${name} ${grade}`);
        gradeTotal += Number(grade);
        studentListElm.querySelectorAll('div').forEach(div => {
            const studentData = div.textContent.split(' ');
            if (studentData.length === 2) {
                const [name, grade] = studentData;
                if (studentNameAndGradeList.has(`${name} ${grade}`)) {
                    return;
                }
                studentNameAndGradeList.add(`${name} ${grade}`);
                gradeTotal += Number(grade);
            }
        });
        const averageGrade = (gradeTotal / studentNameAndGradeList.size).toFixed(2);
        document.getElementById('student-average').textContent = `Average Grade: ${averageGrade}`;

        if (studentListElmCount === studentNameAndGradeList.size) {
            showAppModal('Duplicate', 'There is nothing new to add.');
            return;
        }
        studentListElm.innerHTML = '';
        for (let studentData of studentNameAndGradeList) {
            const div = document.createElement('div');
            div.textContent = studentData;
            studentListElm.appendChild(div);
        }
        showAppModal('Saved', 'Saved student successfully.');
    });

    // Save button with feedback
    document.getElementById('save-btn').addEventListener('click', () => {
        const studentListElm = document.getElementById('student-list');
        const students = new Set();
        studentListElm.querySelectorAll('div').forEach(div => {
            students.add(div.textContent);
        });
        localStorage.setItem('students', JSON.stringify([...students]));
        const count = students.size;
        showAppModal(
            'Saved',
            count ? `Saved ${count} student(s) to localStorage.` : 'No students to save yet.'
        );
    });

    // Fetch and render users
    const loadUserData = async () => {
        const apiStudentsContainer = document.getElementById('api-students');
        apiStudentsContainer.innerHTML = '';
        try {
            const response = await fetch('https://jsonplaceholder.typicode.com/users');
            const data = await response.json();
            const userApiList = new Map();
            data.forEach(user => {
                const div = document.createElement('div');
                div.dataset.id = `user-${user.id}`;
                div.textContent = `${user.name}`;
                div.addEventListener('click', () => {
                    const storageApiUsers = JSON.parse(localStorage.getItem('userApiList')) || {};
                    if (storageApiUsers[user.id]) {
                        const userDetailContent = document.getElementById('user-detail-content');
                        userDetailContent.innerHTML =
                            `
                            <div><strong>Name:</strong> ${user.name}</div>
                            <div><strong>Username:</strong> ${user.username}</div>
                            <div><strong>Email:</strong> ${user.email}</div>
                            <div><strong>Phone:</strong> ${user.phone}</div>
                            <div><strong>Address:</strong> ${user.address.street}, ${user.address.suite}, ${user.address.city}, ${user.address.zipcode}</div>
                            <div><strong>Website:</strong> ${user.website}</div>
                            <div><strong>Company:</strong> ${user.company.name}<br/><span class="muted">${user.company.catchPhrase}</span>` +
                            (user.company.bs ? ` — ${user.company.bs}` : '') +
                            `</div>
                        `;
                        openModal(userDetailModal);
                    }
                });
                apiStudentsContainer.appendChild(div);
                userApiList.set(user.id, JSON.stringify(user));
            });
            localStorage.setItem('userApiList', JSON.stringify(Object.fromEntries(userApiList)));
            const apiStudentCount = document.getElementById('api-student-count');
            apiStudentCount.textContent = `Total Users: ${data.length}`;
        } catch (error) {
            console.error('Error fetching user data:', error);
            showAppModal('Error', 'Failed to load users. Please try again.');
        }
    };

    loadUserData();
});

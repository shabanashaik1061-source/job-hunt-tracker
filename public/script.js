const jobForm = document.getElementById('jobForm');
const jobTableBody = document.getElementById('jobTableBody');
let allJobs = []; // Global storage for filtering

// 1. Initial Load
async function fetchJobs() {
    try {
        const res = await fetch('/api/jobs');
        allJobs = await res.json();
        filterJobs(); // This draws the table
        checkReminders(allJobs); // This triggers the popup
    } catch (err) {
        console.error("Error fetching jobs:", err);
    }
}

// 2. Search & Filter Logic
function filterJobs() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filterValue = document.getElementById('filterStatus').value;
    const today = new Date().toISOString().split('T')[0];

    const filtered = allJobs.filter(job => {
        const matchesSearch = job.company.toLowerCase().includes(searchTerm) || 
                              job.role.toLowerCase().includes(searchTerm);
        const matchesStatus = filterValue === "All" || job.status === filterValue;
        return matchesSearch && matchesStatus;
    });

    renderTableData(filtered, today);
}

// 3. Render Table to UI
function renderTableData(jobs, today) {
    jobTableBody.innerHTML = '';
    
    jobs.forEach(job => {
        const isOverdue = job.follow_up && job.follow_up < today && !['Rejected', 'Offer'].includes(job.status);
        const row = document.createElement('tr');
        if (isOverdue) row.classList.add('overdue');

        row.innerHTML = `
            <td>${job.company}</td>
            <td>
                ${job.job_link ? `<a href="${job.job_link}" target="_blank" style="color: #2563eb; text-decoration: underline; font-weight: bold;">🔗 ${job.role}</a>` : job.role}
            </td>
            <td><strong>${job.status}</strong></td>
            <td class="${isOverdue ? 'overdue-text' : ''}">${job.follow_up || 'N/A'}</td>
            <td>
                <button onclick="editJob(${JSON.stringify(job).replace(/"/g, '&quot;')})" style="background:#2563eb; color:white; border:none; padding:5px 8px; cursor:pointer; border-radius:4px; margin-right:5px;">Edit</button>
                <button onclick="deleteJob(${job.id})" style="background:#ef4444; color:white; border:none; padding:5px 8px; cursor:pointer; border-radius:4px;">Delete</button>
            </td>
        `;
        jobTableBody.appendChild(row);
    });

    // Update Dashboard counts based on ALL data
    document.getElementById('totalCount').innerText = allJobs.length;
    document.getElementById('offerCount').innerText = allJobs.filter(j => j.status === 'Offer').length;
}

// 4. Reminder Popup
function checkReminders(jobs) {
    const today = new Date().toISOString().split('T')[0];
    const dueToday = jobs.filter(j => j.follow_up === today && !['Rejected', 'Offer'].includes(j.status));

    if (dueToday.length > 0) {
        const names = dueToday.map(j => j.company).join(', ');
        alert(`🔔 Reminder: Follow up today with: ${names}`);
    }
}

// 5. Add/Update Submission
jobForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editingId = jobForm.dataset.editingId;

    const jobData = {
        company: document.getElementById('company').value,
        role: document.getElementById('role').value,
        status: document.getElementById('status').value,
        app_date: document.getElementById('appDate').value,
        follow_up: document.getElementById('followUp').value,
        job_link: document.getElementById('jobLink').value,
        notes: document.getElementById('notes').value
    };

    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/jobs/${editingId}` : '/api/jobs';

    await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData)
    });

    if (editingId) {
        delete jobForm.dataset.editingId;
        jobForm.querySelector('button[type="submit"]').innerText = "Add Application";
    }

    jobForm.reset();
    fetchJobs();
});

// 6. Edit & Delete
function editJob(job) {
    document.getElementById('company').value = job.company;
    document.getElementById('role').value = job.role;
    document.getElementById('status').value = job.status;
    document.getElementById('appDate').value = job.app_date;
    document.getElementById('followUp').value = job.follow_up;
    document.getElementById('jobLink').value = job.job_link || '';
    document.getElementById('notes').value = job.notes;

    const submitBtn = jobForm.querySelector('button[type="submit"]');
    submitBtn.innerText = "Update Application";
    jobForm.dataset.editingId = job.id;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteJob(id) {
    if (confirm('Delete this application?')) {
        await fetch(`/api/jobs/${id}`, { method: 'DELETE' });
        fetchJobs();
    }
}

// 7. Dark Mode Logic
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const btn = document.getElementById('darkToggle');
    const isDark = document.body.classList.contains('dark-mode');
    btn.innerText = isDark ? '☀️' : '🌙';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// Load Theme and Data on Start
window.onload = () => {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById('darkToggle').innerText = '☀️';
    }
    fetchJobs();
};
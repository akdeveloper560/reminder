let selectedHour = "09";
let selectedMinute = "00";
let selectedAmPm = "AM";
let reminders = JSON.parse(localStorage.getItem("reminders")) || [];

document.addEventListener("DOMContentLoaded", () => {
    if (Notification.permission !== "granted") {
        Notification.requestPermission();
    }
    
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    const today = new Date().toLocaleDateString('hi-IN', options);
    document.getElementById("current-date").innerText = today;

    buildClockColumns();
    renderReminders();
});

// Clock Columns Generate karna (Hours 1-12 aur Minutes 00-59)
function buildClockColumns() {
    const hourCol = document.getElementById("hourColumn");
    const minuteCol = document.getElementById("minuteColumn");

    hourCol.innerHTML = "";
    minuteCol.innerHTML = "";

    // Hours (1 to 12)
    for (let i = 1; i <= 12; i++) {
        let h = String(i).padStart(2, '0');
        let div = document.createElement("div");
        div.classList.add("time-option");
        if (h === selectedHour) div.classList.add("selected");
        div.innerText = h;
        div.onclick = () => selectHour(h, div);
        hourCol.appendChild(div);
    }

    // Minutes (00, 05, 10 ... 55 ya saare 00-59)
    for (let i = 0; i < 60; i++) {
        let m = String(i).padStart(2, '0');
        let div = document.createElement("div");
        div.classList.add("time-option");
        if (m === selectedMinute) div.classList.add("selected");
        div.innerText = m;
        div.onclick = () => selectMinute(m, div);
        minuteCol.appendChild(div);
    }
}

function selectHour(h, element) {
    selectedHour = h;
    document.querySelectorAll("#hourColumn .time-option").forEach(el => el.classList.remove("selected"));
    element.classList.add("selected");
}

function selectMinute(m, element) {
    selectedMinute = m;
    document.querySelectorAll("#minuteColumn .time-option").forEach(el => el.classList.remove("selected"));
    element.classList.add("selected");
}

function setAmPm(val) {
    selectedAmPm = val;
    document.querySelectorAll("#ampmColumn .time-option").forEach(el => el.classList.remove("selected"));
    event.target.classList.add("selected");
}

// Modal Open/Close
function openTimePicker() {
    document.getElementById("clockModal").classList.add("active");
}

function closeTimePicker() {
    document.getElementById("clockModal").classList.remove("active");
}

function confirmTime() {
    const displayString = `${selectedHour}:${selectedMinute} ${selectedAmPm}`;
    document.getElementById("selectedTimeString").innerText = displayString;
    closeTimePicker();
}

// 12-Hour format ko 24-hour mein badalna background check ke liye
function convertTo24Hour(hour, minute, ampm) {
    let h = parseInt(hour);
    if (ampm === "PM" && h < 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${minute}`;
}

// Reminder Add Karna
function addReminder() {
    const taskName = document.getElementById("taskName").value.trim();
    if (!taskName) {
        alert("Kripya task ka naam bharein!");
        return;
    }

    const time24 = convertTo24Hour(selectedHour, selectedMinute, selectedAmPm);
    const displayTimeStr = `${selectedHour}:${selectedMinute} ${selectedAmPm}`;

    const newReminder = {
        id: Date.now(),
        text: taskName,
        time24: time24,
        displayTime: displayTimeStr
    };

    reminders.push(newReminder);
    saveAndRender();
    document.getElementById("taskName").value = "";
}

function saveAndRender() {
    localStorage.setItem("reminders", JSON.stringify(reminders));
    renderReminders();
}

function renderReminders() {
    const list = document.getElementById("reminderList");
    list.innerHTML = "";

    if (reminders.length === 0) {
        list.innerHTML = `<div class="empty-state">Abhi koi reminder set nahi hai ✨</div>`;
        return;
    }

    reminders.sort((a, b) => a.time24.localeCompare(b.time24));

    reminders.forEach((rem) => {
        const div = document.createElement("div");
        div.classList.add("reminder-card-item");
        div.innerHTML = `
            <div class="reminder-info">
                <div class="task-title">${escapeHtml(rem.text)}</div>
                <div class="task-time-badge">⏰ ${rem.displayTime}</div>
            </div>
            <button class="delete-btn" onclick="deleteReminder(${rem.id})">✕</button>
        `;
        list.appendChild(div);
    });
}

function deleteReminder(id) {
    reminders = reminders.filter(rem => rem.id !== id);
    saveAndRender();
}

function escapeHtml(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

// Har second check karega
setInterval(() => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;

    reminders.forEach((rem, index) => {
        if (rem.time24 === currentTime) {
            triggerNotification(rem.text);
            reminders.splice(index, 1);
            saveAndRender();
        }
    });
}, 1000);

function triggerNotification(task) {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(e => console.log("Audio play error:", e));

    if (Notification.permission === "granted") {
        new Notification("⏰ Reminder Alert!", {
            body: task,
            icon: "https://cdn-icons-png.flaticon.com/512/3236/3236329.png"
        });
    } else {
        alert(`Reminder: ${task}`);
    }
}

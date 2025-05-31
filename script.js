const firebaseConfig = {
  apiKey: "AIzaSyA7MMnjIO6UQLYoJB9YJhSl9wUt1qx0EYE",
  authDomain: "lab-edu-11f05.firebaseapp.com",
  databaseURL: "https://lab-edu-11f05-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "lab-edu-11f05",
  storageBucket: "lab-edu-11f05.firebasestorage.app",
  messagingSenderId: "133738230418",
  appId: "1:133738230418:web:de00824ab2dc08172dac4b",
  measurementId: "G-JMVC7YZCJT"
};
let currentStudentPage = 1;
const studentsPerPage = 20;
let pagedStudentsData = {}; // dữ liệu học viên phân trang dạng object
let totalStudentPages = 1;

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();
const storage = firebase.storage();

const DB_PATHS = {
  USERS: "users",
  STUDENTS: "students",
  CLASSES: "classes"
};

let isAuthReady = false;

const pages = [
  "dashboard",
  "account-management",
  "student-management",
  "class-management",
  "profile-page"
];

// ==== AUTH ====

auth.onAuthStateChanged(user => {
  console.log("Auth state changed, user:", user);
  isAuthReady = true;
  if (user) {
    loadDashboard();
    initStudentsListener();
    initClassesListener();
  } else {
    toggleUI(false);
    showForm("login");
    hideAllManagementPages();
  }
});

function register() {
  const email = document.getElementById("register-email").value.trim();
  const password = document.getElementById("register-password").value.trim();
  if (!email || !password) {
    alert("Vui lòng nhập email và mật khẩu");
    return;
  }
  auth.createUserWithEmailAndPassword(email, password)
    .then(() => alert("Đăng ký thành công! Vui lòng đăng nhập."))
    .catch(error => alert("Lỗi đăng ký: " + error.message));
}

function login() {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();
  if (!email || !password) {
    alert("Vui lòng nhập email và mật khẩu");
    return;
  }
  auth.signInWithEmailAndPassword(email, password)
    .catch(error => alert("Lỗi đăng nhập: " + error.message));
}

function logout() {
  auth.signOut().then(() => {
    toggleUI(false);
    showForm("login");
    window.location.hash = "";
    hideAllManagementPages();
  }).catch(error => {
    alert("Lỗi đăng xuất: " + error.message);
  });
}

// ==== UI ====

function toggleUI(isLoggedIn) {
  document.getElementById("auth-container").style.display = isLoggedIn ? "none" : "block";
  document.getElementById("dashboard").style.display = isLoggedIn ? "block" : "none";
}

function showForm(formName) {
  const forms = document.querySelectorAll(".auth-form");
  forms.forEach(form => form.classList.remove("active"));

  const targetForm = document.getElementById(`${formName}-form`);
  if (targetForm) targetForm.classList.add("active");

  document.getElementById("auth-container").style.display = "block";
}

// ==== SPA Routing ====

function hideAllManagementPages() {
  pages.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
}

function showPage(pageId) {
  hideAllManagementPages();
  const el = document.getElementById(pageId);
  if (el) {
    el.style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}


function showPageFromHash() {
  const hash = window.location.hash.slice(1);
  console.log("showPageFromHash called with hash:", hash);
  if (!hash || !pages.includes(hash)) {
    window.location.hash = "dashboard";
    return;
  }
  const user = auth.currentUser;
  if (!user) {
    toggleUI(false);
    showForm("login");
    return;
  }
  showPage(hash);
}

window.addEventListener("hashchange", () => {
  if (!isAuthReady) return;
  showPageFromHash();
});

// Khi đăng nhập thành công
function loadDashboard() {
  toggleUI(true);
  if (!window.location.hash) {
    window.location.hash = "dashboard";
  } else {
    showPageFromHash();
  }
}
// Hàm quay lại dashboard cho nút "Quay lại"
function backToDashboard() {
  window.location.hash = "dashboard";
}

// ==== Quản lý học viên ====

function renderStudentList(students) {
  allStudentsData = students; // cập nhật toàn bộ dữ liệu học viên

  // Đổi object students thành array để phân trang
  const studentEntries = Object.entries(students);
  totalStudentPages = Math.ceil(studentEntries.length / studentsPerPage);

  // Giới hạn page trong khoảng hợp lệ
  if (currentStudentPage > totalStudentPages) currentStudentPage = totalStudentPages;
  if (currentStudentPage < 1) currentStudentPage = 1;

  // Lấy phần tử của trang hiện tại
  const startIndex = (currentStudentPage - 1) * studentsPerPage;
  const endIndex = startIndex + studentsPerPage;
  const currentPageStudents = studentEntries.slice(startIndex, endIndex);

  const tbody = document.getElementById("student-list");
  tbody.innerHTML = "";

  currentPageStudents.forEach(([id, st]) => {
    const row = `
      <tr>
        <td>${st.name || ""}</td>
        <td>${st.dob || ""}</td>
        <td>${st.parent || ""}</td>
        <td>${st.parentPhone || ""}</td>
        <td>${st.parentJob || ""}</td>
        <td>${st.package || ""}</td>
        <td>${st.sessionsAttended || 0}</td>
        <td>${st.sessionsPaid || 0}</td>
        <td>
          <button onclick="editStudent('${id}')">Sửa</button>
          <button class="delete-btn" onclick="deleteStudent('${id}')">Xóa</button>
        </td>
      </tr>`;
    tbody.innerHTML += row;
  });

  updateStudentPaginationControls();
}
function updateStudentPaginationControls() {
  document.getElementById("page-info").textContent = `Trang ${currentStudentPage} / ${totalStudentPages}`;

  const prevBtn = document.getElementById("prev-page");
  const nextBtn = document.getElementById("next-page");

  prevBtn.disabled = currentStudentPage <= 1;
  nextBtn.disabled = currentStudentPage >= totalStudentPages;
}
function changeStudentPage(newPage) {
  if (newPage < 1 || newPage > totalStudentPages) return;
  currentStudentPage = newPage;
  renderStudentList(allStudentsData);
}


let allStudentsData = {};
function updateStudentOptionsForClassForm() {
  database.ref(DB_PATHS.STUDENTS).once("value").then(snapshot => {
    allStudentsData = snapshot.val() || {};
    const select = document.getElementById("class-add-student");
    select.innerHTML = `<option value="">-- Chọn học viên --</option>`;
    Object.entries(allStudentsData).forEach(([id, st]) => {
      const option = document.createElement("option");
      option.value = id;
      option.textContent = st.name || "(Không rõ tên)";
      select.appendChild(option);
    });
  });
}


function initStudentsListener() {
  database.ref(DB_PATHS.STUDENTS).on("value", snapshot => {
    allStudentsData = snapshot.val() || {};
    renderStudentList(allStudentsData);
  });
}


function showStudentForm() {
  document.getElementById("student-form-title").textContent = "Tạo hồ sơ học viên mới";
  document.getElementById("student-form").reset();
  document.getElementById("student-index").value = "";
  document.getElementById("student-parent-job-other").style.display = "none";
  document.getElementById("student-form-container").style.display = "block";
}

function hideStudentForm() {
  document.getElementById("student-form-container").style.display = "none";
}

async function saveStudent() {
  const user = auth.currentUser;
  if (!user) {
    alert("Vui lòng đăng nhập để thêm hoặc sửa học viên!");
    showForm("login");
    toggleUI(false);
    return;
  }
  const id = document.getElementById("student-index").value;
  const studentData = {
    name: document.getElementById("student-name").value.trim(),
    dob: document.getElementById("student-dob").value,
    parent: document.getElementById("student-parent").value.trim(),
    parentPhone: document.getElementById("student-parent-phone").value.trim(),
    parentJob: document.getElementById("student-parent-job").value === "Khác"
      ? document.getElementById("student-parent-job-other").value.trim()
      : document.getElementById("student-parent-job").value,
    package: document.getElementById("student-package").value.trim(),
    sessionsAttended: parseInt(document.getElementById("student-sessions-attended").value) || 0,
    sessionsPaid: parseInt(document.getElementById("student-sessions-paid").value) || 0,
    updatedAt: firebase.database.ServerValue.TIMESTAMP
  };

  try {
    if (id) {
      await database.ref(`${DB_PATHS.STUDENTS}/${id}`).update(studentData);
      alert("Cập nhật học viên thành công!");
    } else {
      await database.ref(DB_PATHS.STUDENTS).push(studentData);
      alert("Thêm học viên mới thành công!");
    }
    hideStudentForm();
  } catch (error) {
    alert("Lỗi lưu học viên: " + error.message);
  }
}

async function deleteStudent(id) {
  if (!confirm("Bạn chắc chắn muốn xóa học viên này?")) return;
  try {
    await database.ref(`${DB_PATHS.STUDENTS}/${id}`).remove();
    alert("Xóa học viên thành công!");
  } catch (error) {
    alert("Lỗi xóa học viên: " + error.message);
  }
}

function editStudent(id) {
  database.ref(`${DB_PATHS.STUDENTS}/${id}`).once("value").then(snapshot => {
    const st = snapshot.val();
    if (!st) return alert("Học viên không tồn tại!");

    document.getElementById("student-index").value = id;
    document.getElementById("student-name").value = st.name || "";
    document.getElementById("student-dob").value = st.dob || "";
    document.getElementById("student-parent").value = st.parent || "";
    document.getElementById("student-parent-phone").value = st.parentPhone || "";
    if (["Công nhân", "Giáo viên", "Kinh doanh", "Bác sĩ", "Nông dân"].includes(st.parentJob)) {
      document.getElementById("student-parent-job").value = st.parentJob;
      document.getElementById("student-parent-job-other").style.display = "none";
    } else {
      document.getElementById("student-parent-job").value = "Khác";
      document.getElementById("student-parent-job-other").value = st.parentJob || "";
      document.getElementById("student-parent-job-other").style.display = "inline-block";
    }
    document.getElementById("student-package").value = st.package || "";
    document.getElementById("student-sessions-attended").value = st.sessionsAttended || 0;
    document.getElementById("student-sessions-paid").value = st.sessionsPaid || 0;

    document.getElementById("student-form-title").textContent = "Chỉnh sửa học viên";
    document.getElementById("student-form-container").style.display = "block";
  }).catch(err => alert("Lỗi tải học viên: " + err.message));
}

function parentJobChange(value) {
  document.getElementById("student-parent-job-other").style.display = (value === "Khác") ? "inline-block" : "none";
}

// ==== Quản lý lớp học ====

let currentClassStudents = [];

function initClassesListener() {
  database.ref(DB_PATHS.CLASSES).on("value", snapshot => {
    const classes = snapshot.val() || {};
    renderClassList(classes);
    clearSchedulePreview();  // Hiển thị nội dung mặc định lúc load xong bảng lớp
  });
}


function renderClassList(classes) {
  const tbody = document.getElementById("class-list");
  tbody.innerHTML = "";

  Object.entries(classes).forEach(([id, cls]) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${cls.name || ""}</td>
      <td>${cls.students ? Object.keys(cls.students).length : 0}</td>
      <td>${cls.teacher || ""}</td>
      <td>
        <button onclick="viewClassInfo('${id}')">Xem info</button>
        <button onclick="editClass('${id}')">Sửa</button>
        <button class="delete-btn" onclick="deleteClass('${id}')">Xóa</button>
      </td>
    `;

    // Thêm sự kiện hover
    tr.addEventListener("mouseenter", () => {
      showSchedulePreview(cls.fixedSchedule);
    });
    tr.addEventListener("mouseleave", () => {
      clearSchedulePreview();
    });

    tbody.appendChild(tr);
  });
}


function editClass(id) {
  database.ref(`${DB_PATHS.CLASSES}/${id}`).once("value").then(snapshot => {
    const cls = snapshot.val();
    if (!cls) return alert("Lớp học không tồn tại!");

    // Điền các trường lớp
    document.getElementById("class-index").value = id;
    document.getElementById("class-name").value = cls.name || "";
    document.getElementById("class-teacher").value = cls.teacher || "";

    // Danh sách học viên hiện có
    currentClassStudents = cls.students ? Object.keys(cls.students) : [];
    renderClassStudentList(currentClassStudents);

    // Điền lịch học cố định (nếu có)
    fillFixedScheduleForm(cls.fixedSchedule);

    // Hiển thị lịch học cố định bên dưới form
    renderFixedScheduleDisplay();

    document.getElementById("class-form-title").textContent = "Chỉnh sửa lớp học";
    document.getElementById("class-form-container").style.display = "block";

    // Đảm bảo lắng nghe thay đổi lịch học (nếu chưa setup)
    setupScheduleInputsListener();
  }).catch(err => alert("Lỗi tải lớp học: " + err.message));
}

async function showClassForm() {
  currentClassStudents = [];
  document.getElementById("class-form-title").textContent = "Tạo lớp học mới";
  document.getElementById("class-form").reset();
  document.getElementById("class-index").value = "";
  renderClassStudentList([]);
updateStudentOptionsForClassForm();
  // Reset lịch học cố định form
  fillFixedScheduleForm(null);

  // Hiển thị phần lịch học cố định (rỗng ban đầu)
  renderFixedScheduleDisplay();

  // Thiết lập sự kiện khi checkbox hoặc input time thay đổi
  setupScheduleInputsListener();

  document.getElementById("class-form-container").style.display = "block";
}


function hideClassForm() {
  document.getElementById("class-form-container").style.display = "none";
}

function updateStudentOptionsForClass() {
  database.ref(DB_PATHS.STUDENTS).once("value").then(snapshot => {
    const students = snapshot.val() || {};
    const select = document.getElementById("class-add-student");
    select.innerHTML = `<option value="">-- Chọn học viên --</option>`;
    Object.entries(students).forEach(([id, st]) => {
      const option = document.createElement("option");
     option.value = id; // key Firebase của học viên
option.textContent = st.name || "";
      select.appendChild(option);
    });
  });
}

function addStudentToClass() {
  const select = document.getElementById("class-add-student");
  const studentId = select.value;
  if (!studentId) return alert("Vui lòng chọn học viên để thêm!");

  if (currentClassStudents.includes(studentId)) {
    alert("Học viên đã có trong lớp!");
    return;
  }

  currentClassStudents.push(studentId);
  renderClassStudentList(currentClassStudents);
} // <-- Đóng hàm ở đây


function renderClassStudentList(studentIds) {
  currentClassStudents = studentIds;
  const ul = document.getElementById("class-student-list");
  ul.innerHTML = "";
  studentIds.forEach(id => {
    const st = allStudentsData[id];
    const name = st ? st.name : "(Không rõ tên)";
    const li = document.createElement("li");
    li.textContent = name;

    const btnRemove = document.createElement("span");
    btnRemove.textContent = "x";
    btnRemove.className = "remove-btn";
    btnRemove.onclick = () => {
      currentClassStudents = currentClassStudents.filter(sid => sid !== id);
      renderClassStudentList(currentClassStudents);
    };

    li.appendChild(btnRemove);
    ul.appendChild(li);
  });
}


async function saveClass() {
  const user = auth.currentUser;
  if (!user) {
    alert("Vui lòng đăng nhập để thêm hoặc sửa lớp học!");
    showForm("login");
    toggleUI(false);
    return;
  }
  const id = document.getElementById("class-index").value;
  const classData = {
    name: document.getElementById("class-name").value.trim(),
    teacher: document.getElementById("class-teacher").value.trim(),
    students: {},
    updatedAt: firebase.database.ServerValue.TIMESTAMP
  };
const fixedSchedule = getFixedScheduleFromForm();
classData.fixedSchedule = fixedSchedule;

  currentClassStudents.forEach(studentId => {
  classData.students[studentId] = true;
});
 if (!validateFixedSchedule()) return;

  if (!classData.name || !classData.teacher) {
    alert("Vui lòng nhập tên lớp và giáo viên đứng lớp!");
    return;
  }

  try {
    if (id) {
      await database.ref(`${DB_PATHS.CLASSES}/${id}`).update(classData);
      alert("Cập nhật lớp học thành công!");
    } else {
      await database.ref(DB_PATHS.CLASSES).push(classData);
      alert("Thêm lớp học mới thành công!");
    }
    hideClassForm();
  } catch (error) {
    alert("Lỗi lưu lớp học: " + error.message);
  }
}

async function deleteClass(id) {
  if (!confirm("Bạn chắc chắn muốn xóa lớp học này?")) return;
  try {
    await database.ref(`${DB_PATHS.CLASSES}/${id}`).remove();
    alert("Xóa lớp học thành công!");
  } catch (error) {
    alert("Lỗi xóa lớp học: " + error.message);
  }
}
function getFixedScheduleFromForm() {
  const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const schedule = {};
  days.forEach(day => {
    const checkbox = document.getElementById(`schedule-${day}`);
    const timeInput = document.getElementById(`time-${day}`);
    if (checkbox.checked && timeInput.value) {
      schedule[checkbox.value] = timeInput.value;
    }
  });
  return schedule;
}
function fillFixedScheduleForm(fixedSchedule) {
  const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  days.forEach(day => {
    const checkbox = document.getElementById(`schedule-${day}`);
    const timeInput = document.getElementById(`time-${day}`);
    if (fixedSchedule && fixedSchedule[checkbox.value]) {
      checkbox.checked = true;
      timeInput.value = fixedSchedule[checkbox.value];
    } else {
      checkbox.checked = false;
      timeInput.value = "";
    }
  });

  renderCalendarSchedule(fixedSchedule);
}

function renderFixedScheduleDisplay() {
  const scheduleList = document.getElementById("schedule-list");
  scheduleList.innerHTML = "";

  const fixedSchedule = getFixedScheduleFromForm();

  if (Object.keys(fixedSchedule).length === 0) {
    scheduleList.innerHTML = "<li>Chưa có lịch học cố định.</li>";
  } else {
    Object.entries(fixedSchedule).forEach(([day, time]) => {
      const li = document.createElement("li");
      li.textContent = `${day}: ${time}`;
      scheduleList.appendChild(li);
    });
  }

  renderCalendarSchedule(fixedSchedule);
}

function renderCalendarSchedule(fixedSchedule) {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const idMap = {
    Monday: "calendar-mon",
    Tuesday: "calendar-tue",
    Wednesday: "calendar-wed",
    Thursday: "calendar-thu",
    Friday: "calendar-fri",
    Saturday: "calendar-sat",
    Sunday: "calendar-sun"
  };

  // Xóa hết nội dung cũ
  days.forEach(day => {
    const cell = document.getElementById(idMap[day]);
    if (cell) cell.innerHTML = "";
  });

  // Nếu fixedSchedule rỗng thì thôi
  if (!fixedSchedule || Object.keys(fixedSchedule).length === 0) return;

  Object.entries(fixedSchedule).forEach(([day, time]) => {
    const cell = document.getElementById(idMap[day]);
    if (cell) {
      // Tạo div nhỏ hiển thị giờ học
      const div = document.createElement("div");
      div.textContent = time;
      div.style.backgroundColor = "#0066cc";
      div.style.color = "white";
      div.style.padding = "6px 8px";
      div.style.margin = "4px 0";
      div.style.borderRadius = "6px";
      div.style.fontWeight = "600";
      div.style.textAlign = "center";
      cell.appendChild(div);
    }
  });
}
function validateFixedSchedule() {
  const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  for (const day of days) {
    const checkbox = document.getElementById(`schedule-${day}`);
    const timeInput = document.getElementById(`time-${day}`);

    if (checkbox.checked && !timeInput.value) {
      alert(`Vui lòng chọn giờ học cho ${checkbox.value}!`);
      timeInput.focus();
      return false;
    }

    if (!checkbox.checked && timeInput.value) {
      alert(`Vui lòng tick lịch học cho ngày ${checkbox.value} hoặc xóa giờ!`);
      timeInput.focus();
      return false;
    }
  }
  return true;
}
function showSchedulePreview(fixedSchedule) {
  const ul = document.getElementById("schedule-preview-list");
  ul.innerHTML = "";

  if (!fixedSchedule || Object.keys(fixedSchedule).length === 0) {
    ul.innerHTML = "<li>Chưa có lịch học cố định.</li>";
    return;
  }

  Object.entries(fixedSchedule).forEach(([day, time]) => {
    const li = document.createElement("li");
    li.textContent = `${day}: ${time}`;
    ul.appendChild(li);
  });
}

function clearSchedulePreview() {
  const ul = document.getElementById("schedule-preview-list");
  ul.innerHTML = "<li>Di chuột vào lớp để xem lịch học cố định.</li>";
}

function setupScheduleInputsListener() {
  const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  days.forEach(day => {
    const checkbox = document.getElementById(`schedule-${day}`);
    const timeInput = document.getElementById(`time-${day}`);

    checkbox.addEventListener("change", renderFixedScheduleDisplay);
    timeInput.addEventListener("input", renderFixedScheduleDisplay);
  });
}
async function viewClassInfo(id) {
  try {
    const snapshot = await database.ref(`${DB_PATHS.CLASSES}/${id}`).once("value");
    const cls = snapshot.val();
    if (!cls) return alert("Lớp học không tồn tại!");

    const studentCount = cls.students ? Object.keys(cls.students).length : 0;
    const fixedSchedule = cls.fixedSchedule || {};
    const sessionsPerWeek = Object.keys(fixedSchedule).length;

    let scheduleText = "";
    for (const [day, time] of Object.entries(fixedSchedule)) {
      scheduleText += `- ${day}: ${time}\n`;
    }
    if (!scheduleText) scheduleText = "Chưa có lịch học cố định.";

    const info = `
Tên lớp: ${cls.name}
Giáo viên: ${cls.teacher}
Số học viên: ${studentCount}
Số buổi học cố định mỗi tuần: ${sessionsPerWeek}
Lịch học cố định:
${scheduleText}
    `;

    alert(info);
  } catch (error) {
    alert("Lỗi lấy thông tin lớp học: " + error.message);
  }
}

// ==== Profile ====

document.getElementById("avatar-file").addEventListener("change", async function() {
  const file = this.files[0];
  if (!file) return;

  const user = auth.currentUser;
  if (!user) return alert("Bạn chưa đăng nhập!");

  const storageRef = storage.ref();
  const avatarRef = storageRef.child(`avatars/${user.uid}_${Date.now()}`);

  try {
    showLoading(true);
    await avatarRef.put(file);
    const url = await avatarRef.getDownloadURL();

    await database.ref(`${DB_PATHS.USERS}/${user.uid}`).update({ avatarUrl: url });

    document.getElementById("avatar-img").src = url;
    document.getElementById("profile-avatar").src = url;

    alert("Cập nhật avatar thành công!");
  } catch (error) {
    alert("Lỗi upload avatar: " + error.message);
  } finally {
    showLoading(false);
  }
});

// ==== Loading ====

function showLoading(show) {
  document.getElementById("loading").style.display = show ? "block" : "none";
}
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-show-form]").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const form = link.getAttribute("data-show-form");
      showForm(form);
    });
  });
});

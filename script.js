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
// ===== Thêm hàm tiện ích để ẩn/hiện các phần UI =====
function showElement(id) {
  document.getElementById(id).style.display = "block";
}
function hideElement(id) {
  document.getElementById(id).style.display = "none";
}
const DB_PATHS = {
  USERS: "users",
  STUDENTS: "students",
  CLASSES: "classes"
};

let isAuthReady = false;
let selectedHomeworkClassId = null;
let selectedHomeworkStudentId = null;
let allClassesData = {};
const pages = [
  "dashboard",
  "account-management",
  "student-management",
  "class-management",
  "schedule-management",
  "homework-management",
  "profile-page"
];
let calendarWeekly = null;
let calendarMini   = null;
// ==== AUTH ====
// ===== Quan sát trạng thái đăng nhập của Firebase =====
auth.onAuthStateChanged(async (user) => {
  if (user) {
    // Khi đã đăng nhập
    const uid = user.uid;

    // Lấy thông tin user từ DB (bao gồm name và role)
    const userSnapshot = await database.ref(`users/${uid}`).once("value");
    const userData = userSnapshot.val() || {};

    // Nếu chưa có role (lần đầu sau khi đăng ký), hiển thị form chọn role
    if (!userData.role) {
      // Ẩn Dashboard và form auth, hiển thị role-selection
      hideElement("dashboard");                // Ẩn giao diện chính
      hideElement("auth-container");           // Ẩn form login/register
      showElement("role-selection");            // Hiển thị form chọn chức vụ

      // Nếu đã lưu sẵn tên người dùng (userData.name), ta có thể hiển thị chào mừng: 
      // Ví dụ: “Chào mừng lần đầu, <tên>! Vui lòng chọn chức vụ.” 
      // (Tuỳ ý, nhưng bắt buộc phải chọn role trước khi vào Dashboard.)
    } else {
      // Đã có role (những lần sau): hiển thị Dashboard và lời chào theo role
      // Ẩn phần login/register/role-selection
      hideElement("auth-container");
      hideElement("role-selection");

      // Truyền dữ liệu userData vào phần hiển thị Dashboard
      setupDashboardUI(userData);
      showElement("dashboard"); 
    }
  } else {
    // Chưa đăng nhập: hiển thị form login (ẩn Dashboard, role-selection)
    hideElement("dashboard");
    hideElement("role-selection");
    showElement("auth-container");
    showForm("login");
  }
});

auth.onAuthStateChanged(user => {
  console.log("Auth state changed, user:", user);
  isAuthReady = true;
  if (user) {
    loadDashboard();
    initStudentsListener();
    initClassesListener();
    // Mời gọi initFullCalendar khi đã load xong classes
    // Tuy nhiên, initClassesListener() là on("value") – async callback.
    // Để chắc chắn allClassesData có dữ liệu, ta gắn listener riêng:
    database.ref(DB_PATHS.CLASSES).once("value").then(snapshot => {
      // Khi lần đầu tiên fetch xong, allClassesData đã được gán trong initClassesListener()
      initFullCalendar();
    });
  } else {
    toggleUI(false);
    showForm("login");
    hideAllManagementPages();
  }
});


function register() {
  const email = document.getElementById("register-email").value.trim();
  const password = document.getElementById("register-password").value.trim();
  const fullName = document.getElementById("register-name").value.trim(); // Lấy tên người dùng
  if (!email || !password || !fullName) {
    alert("Vui lòng nhập đầy đủ email, mật khẩu và họ tên");
    return;
  }

  auth.createUserWithEmailAndPassword(email, password)
    .then(async (credential) => {
      // Sau khi tạo user thành công, lưu thêm thông tin name vào DB
      const user = credential.user;
      await database.ref(`users/${user.uid}`).set({
        name: fullName,
        role: null            // Chưa có role, sẽ chọn ở bước tiếp theo
      });
      // Đăng ký xong, Firebase tự động chuyển trạng thái auth.onAuthStateChanged -> gọi phần trên
      // Ở đây, ta không cần show alert nữa, mà sẽ để onAuthStateChanged xử lý chuyển giao diện
    })
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
function forgotPassword() {
  const email = document.getElementById("forgot-email").value.trim();
  if (!email) {
    alert("Vui lòng nhập email");
    return;
  }
  auth.sendPasswordResetEmail(email)
    .then(() => alert("Đường dẫn đặt lại mật khẩu đã được gửi tới email của bạn"))
    .catch(error => alert("Lỗi: " + error.message));
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

// ===== Hàm hiển thị form theo tên (login/register/forgot) =====
function showForm(formName) {
  const forms = document.querySelectorAll(".auth-form");
  forms.forEach(f => f.classList.remove("active"));
  const target = document.getElementById(`${formName}-form`);
  if (target) target.classList.add("active");
  // Luôn hiển thị “auth-container” khi gọi showForm
  showElement("auth-container");
}
// ===== Hàm lưu “role” khi người dùng chọn xong =====
async function saveUserRole() {
  const user = auth.currentUser;
  if (!user) {
    alert("Đã có lỗi: Vui lòng đăng nhập lại.");
    return;
  }
  const selectedRole = document.getElementById("select-role").value;
  if (!selectedRole) {
    alert("Vui lòng chọn một chức vụ!");
    return;
  }

  // Lưu role vào DB
  await database.ref(`users/${user.uid}/role`).set(selectedRole);
  // Sau khi lưu xong, gọi lại giao diện Dashboard
  // Đọc lại thông tin user (bao gồm name và role)
  const userSnapshot = await database.ref(`users/${user.uid}`).once("value");
  const userData = userSnapshot.val();
  
  // Ẩn form chọn role, hiển thị Dashboard
  hideElement("role-selection");
  setupDashboardUI(userData);
  showElement("dashboard");
}

// ===== Hàm dựng giao diện Dashboard (với lời chào theo role hoặc theo tên) =====
async function setupDashboardUI(userData) {
  // userData có shape: { name: "...", role: "Admin" } (role không null)
  const displayNameEl = document.getElementById("display-name");
  const displayHelloEl = document.getElementById("display-name-hello");

  // Nếu đã có role (lần sau đăng nhập), hiển thị “Chào mừng ngài trở lại, thưa <chức vụ>”
  if (userData.role) {
    displayNameEl.textContent = ""; // không cần hiển thị tên nữa
    displayHelloEl.textContent = `${userData.role}`; 
    // Thay câu “Xin chào, <tên>!” thành “Chào mừng ngài trở lại, thưa <chức vụ>”
    // Vì đoạn HTML gốc chứa: <p>Xin chào, <span id="display-name-hello"></span>!</p>
    // Nên ta chỉ cần ghi đúng nội dung vào display-name-hello. Chữ “Xin chào,” vẫn nằm ở bên ngoài.
  } else {
    // Trường hợp lần đầu (chưa có role) – có thể hiển thị tên, nhưng sau khi lưu role, hàm setupDashboardUI sẽ gọi lại
    displayNameEl.textContent = userData.name || "";
    displayHelloEl.textContent = userData.name || ""; 
  }
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
    // 1. Cập nhật biến toàn cục để các chỗ khác (Homeworks, FullCalendar) dùng được
    allClassesData = classes;
    // 2. Vẫn render danh sách lớp trong trang Quản lý lớp
    renderClassList(classes);
    clearSchedulePreview();
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
  const nowTimestamp = firebase.database.ServerValue.TIMESTAMP;

  // Nếu id rỗng => tạo lớp mới, cần lưu createdAt
  if (!id) {
    const newClassData = {
      name: document.getElementById("class-name").value.trim(),
      teacher: document.getElementById("class-teacher").value.trim(),
      students: {},               // sau sẽ điền vào
      fixedSchedule: getFixedScheduleFromForm(),
      createdAt: nowTimestamp,    // **LƯU ngày tạo ở đây**
      updatedAt: nowTimestamp
    };
    currentClassStudents.forEach(studentId => {
      // Khi thêm mới, có thể lưu giá trị true hoặc timestamp nếu muốn lưu ngày add
      newClassData.students[studentId] = true;
    });

    try {
      await database.ref(DB_PATHS.CLASSES).push(newClassData);
      alert("Thêm lớp học mới thành công!");
      hideClassForm();
    } catch (error) {
      alert("Lỗi lưu lớp học: " + error.message);
    }
  } else {
    // Khi id không rỗng => đang cập nhật lớp cũ, chỉ update cập nhật các trường, KHÔNG ghi đè createdAt
    const updatedClassData = {
      name: document.getElementById("class-name").value.trim(),
      teacher: document.getElementById("class-teacher").value.trim(),
      students: {},               // sau sẽ điền lại danh sách mới
      fixedSchedule: getFixedScheduleFromForm(),
      updatedAt: nowTimestamp
    };
    currentClassStudents.forEach(studentId => {
      updatedClassData.students[studentId] = true;
    });

    try {
      await database.ref(`${DB_PATHS.CLASSES}/${id}`).update(updatedClassData);
      alert("Cập nhật lớp học thành công!");
      hideClassForm();
    } catch (error) {
      alert("Lỗi lưu lớp học: " + error.message);
    }
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
// ======== Quản lý Bài tập về nhà =========

// Khi hash change tới '#homework-management':
function showHomeworkManagement() {
  // Hiển thị phần Quản lý bài tập, ẩn các phần khác
  hideAllManagementPages();
  const el = document.getElementById("homework-management");
  if (el) {
    el.style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Reset: hiển thị container lớp, ẩn 2 container sau
  document.getElementById("homework-class-container").style.display = "block";
  document.getElementById("homework-student-container").style.display = "none";
  document.getElementById("homework-session-container").style.display = "none";

  // Xóa cache tạm
  selectedHomeworkClassId = null;
  selectedHomeworkStudentId = null;

  // Load danh sách lớp từ allClassesData
  renderHomeworkClassList(allClassesData);
}

// Đăng ký sự kiện khi hash=homework-management
window.addEventListener("hashchange", () => {
  if (!isAuthReady) return;
  const hash = window.location.hash.slice(1);
  if (hash === "homework-management") {
    // Đảm bảo user đã login
    const user = auth.currentUser;
    if (!user) {
      toggleUI(false);
      showForm("login");
      return;
    }
    showHomeworkManagement();
  }
});

// Render bảng danh sách lớp cho phần Bài tập
function renderHomeworkClassList(classes) {
  const tbody = document.getElementById("homework-class-list");
  tbody.innerHTML = "";

  Object.entries(classes).forEach(([classId, cls]) => {
    const tr = document.createElement("tr");
    const studentCount = cls.students ? Object.keys(cls.students).length : 0;
    const teacherName = cls.teacher || "(Chưa có)";
    const className    = cls.name || "(Không đặt tên)";

    tr.innerHTML = `
      <td>${className}</td>
      <td>${studentCount}</td>
      <td>${teacherName}</td>
      <td>
        <button onclick="selectHomeworkClass('${classId}')">Chọn</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Khi người dùng bấm "Chọn" 1 lớp
async function selectHomeworkClass(classId) {
  selectedHomeworkClassId = classId;
  const cls = allClassesData[classId];
  if (!cls) return alert("Lớp không tồn tại!");

  // Hiển thị tên lớp
  document.getElementById("homework-selected-class-name").textContent = cls.name || "";

  // Ẩn container lớp, hiện container học viên
  document.getElementById("homework-class-container").style.display = "none";
  document.getElementById("homework-student-container").style.display = "block";

  // Clear danh sách học viên
  const ul = document.getElementById("homework-student-list");
  ul.innerHTML = "";

  // Lấy danh sách studentId trong lớp
  const studentIds = cls.students ? Object.keys(cls.students) : [];

  // Đảm bảo allStudentsData đã load (initStudentsListener đã set)
  studentIds.forEach(stId => {
    const st = allStudentsData[stId];
    const name = st ? st.name : "(Không tên)";
    const li = document.createElement("li");
    li.style.marginBottom = "8px";
    li.innerHTML = `
      ${name} 
      <button onclick="selectHomeworkStudent('${stId}')">Chọn</button>
    `;
    ul.appendChild(li);
  });
}

// Quay lại danh sách lớp
function backToHomeworkClasses() {
  document.getElementById("homework-student-container").style.display = "none";
  document.getElementById("homework-class-container").style.display = "block";
  selectedHomeworkClassId = null;
}

// Khi người dùng bấm “Chọn” 1 học viên
async function selectHomeworkStudent(studentId) {
  selectedHomeworkStudentId = studentId;
  const cls = allClassesData[selectedHomeworkClassId];
  const st  = allStudentsData[studentId];
  if (!cls || !st) return alert("Lỗi: Không tìm thấy dữ liệu lớp hoặc học viên!");

  // Hiển thị tên học viên + tên lớp
  document.getElementById("homework-selected-student-name").textContent = st.name || "";
  document.getElementById("homework-selected-class-name-2").textContent = cls.name || "";

  // Ẩn container học viên, hiện container sessions
  document.getElementById("homework-student-container").style.display = "none";
  document.getElementById("homework-session-container").style.display = "block";

  // Build danh sách ngày buổi học dựa trên fixedSchedule
  const fixedSchedule = cls.fixedSchedule || {};  
  // Tạo mảng các dates (định dạng "YYYY-MM-DD") mà lớp đã có buổi học
  // Ở đây mình chỉ sinh ra các ngày từ đầu tháng đến ngày hôm nay (bạn có thể điều chỉnh khoảng thời gian tuỳ ý)
  // === Thêm từ đây: Lấy joinTimestamp và joinDate của học sinh ===
let joinTimestamp = null;
if (cls.students && cls.students[studentId]) {
  joinTimestamp = cls.students[studentId];
}
let joinDate = null;
if (joinTimestamp) {
  joinDate = new Date(joinTimestamp);
  joinDate.setHours(0, 0, 0, 0);
}
  const today = new Date();
  const year  = today.getFullYear();
  const month = today.getMonth() + 1; // 1..12
  const daysInMonth = new Date(year, month, 0).getDate();

  // Hàm helper: lấy ra mã weekday (0=Chủ nhật, 1=Thứ 2, … 6=Thứ 7)
  const weekdayMap = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6
  };

  // Chuyển fixedSchedule (keys là “Monday”, “Tuesday”, …) sang tập các weekday số
  const activeWeekdays = Object.keys(fixedSchedule)
    .map(w => weekdayMap[w])      // e.g. Monday -> 1
    .filter(x => x !== undefined);

  
  const container = document.getElementById("homework-session-list");
  container.innerHTML = "";

  // Dùng Promise.all để đợi load xong hết
  const promises = sessionDates.map(dateStr => {
    return database.ref(`homeworks/${selectedHomeworkClassId}/${selectedHomeworkStudentId}/${dateStr}`)
      .once("value")
      .then(snapshot => {
        const rec = snapshot.val() || { attended: false, completedHomework: false };
        return { date: dateStr, record: rec };
      });
  });
const sessionDates = [];
if (joinDate) {
  // Lặp từ joinDate đến hôm nay
  let dt = new Date(joinDate);
  while (dt.getTime() <= today.getTime()) {
    if (activeWeekdays.includes(dt.getDay())) {
      const yyyy = dt.getFullYear();
      const mm2  = String(dt.getMonth() + 1).padStart(2, "0");
      const dd2  = String(dt.getDate()).padStart(2, "0");
      sessionDates.push(`${yyyy}-${mm2}-${dd2}`);
    }
    dt.setDate(dt.getDate() + 1);
  }
} else {
  // Nếu không có joinDate (dữ liệu cũ chưa được migrate),
  // fallback về logic cũ: từ ngày 1 của tháng đến hôm nay
  const fallbackToday = new Date();
  fallbackToday.setHours(0, 0, 0, 0);
  const yearF = fallbackToday.getFullYear();
  const monthF = fallbackToday.getMonth() + 1;
  const daysInMonthF = new Date(yearF, monthF, 0).getDate();
  for (let d = 1; d <= daysInMonthF; d++) {
    const dt2 = new Date(yearF, monthF - 1, d);
    if (dt2.getTime() > fallbackToday.getTime()) break;
    if (activeWeekdays.includes(dt2.getDay())) {
      const yyyy = dt2.getFullYear();
      const mm2  = String(dt2.getMonth() + 1).padStart(2, "0");
      const dd2  = String(dt2.getDate()).padStart(2, "0");
      sessionDates.push(`${yyyy}-${mm2}-${dd2}`);
    }
  }
}
  const results = await Promise.all(promises);

  // Render mỗi ngày 1 <tr>
  results.forEach(({ date, record }) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${date}</td>
      <td style="text-align:center;">
        <input type="checkbox" 
               data-date="${date}" 
               data-type="attended" 
               ${record.attended ? "checked" : ""} 
               onchange="updateHomeworkRecord('${selectedHomeworkClassId}','${selectedHomeworkStudentId}','${date}','attended', this.checked)" />
      </td>
      <td style="text-align:center;">
        <input type="checkbox" 
               data-date="${date}" 
               data-type="completedHomework" 
               ${record.completedHomework ? "checked" : ""} 
               onchange="updateHomeworkRecord('${selectedHomeworkClassId}','${selectedHomeworkStudentId}','${date}','completedHomework', this.checked)" />
      </td>
    `;
    container.appendChild(tr);
  });
}

// Quay lại danh sách học viên
function backToHomeworkStudents() {
  document.getElementById("homework-session-container").style.display = "none";
  document.getElementById("homework-student-container").style.display = "block";
  selectedHomeworkStudentId = null;
}

// Hàm update khi người dùng tick/un-tick checkbox
async function updateHomeworkRecord(classId, studentId, dateStr, field, value) {
  // classId, studentId, dateStr, field in ["attended","completedHomework"], value boolean
  try {
    const refPath = `homeworks/${classId}/${studentId}/${dateStr}`;
    // Lấy data hiện tại (nếu có) để merge
    const snapshot = await database.ref(refPath).once("value");
    const existing = snapshot.val() || {};

    const updated = {
      ...existing,
      [field]: value,
      updatedAt: firebase.database.ServerValue.TIMESTAMP
    };

    await database.ref(refPath).set(updated);
    // Có thể cho 1 toast nhỏ hoặc console.log để feedback
    console.log(`Đã cập nhật ${field}=${value} cho ${studentId} ngày ${dateStr}`);
  } catch (error) {
    console.error("Lỗi cập nhật homework record:", error);
    alert("Lỗi lưu dữ liệu. Vui lòng thử lại.");
  }
}

// ==== Profile ====
/*
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
*/
// build event
// ======== Phần FullCalendar đã được đặt ngay sau khi initClassesListener + once("value") ========

function buildEventsArray(year, month) {
  const events = [];
  const monthIndex = month - 1;
  const lastDayOfMonth  = new Date(year, monthIndex + 1, 0);

  Object.values(allClassesData).forEach(cls => {
    const teacherName = cls.teacher || "(Chưa có tên GV)";
    const fixed = cls.fixedSchedule || {};

    // 1. Lấy createdAt từ cls (giả sử cls.createdAt là timestamp số nguyên từ Firebase)
    let createdDate = null;
    if (cls.createdAt) {
      // Tạo Date từ timestamp (Firebase ServerValue.TIMESTAMP)  
      // Nếu giá trị saved là 165… (ms) thì:
      createdDate = new Date(cls.createdAt);
      // Reset thời gian thành 00:00:00 để so sánh chỉ theo ngày
      createdDate.setHours(0, 0, 0, 0);
    }

    Object.entries(fixed).forEach(([weekdayEng, timeStr]) => {
      const weekdayMap = {
        Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
        Thursday: 4, Friday: 5, Saturday: 6
      };
      const targetWeekday = weekdayMap[weekdayEng];
      if (targetWeekday === undefined) return;

      for (let d = 1; d <= lastDayOfMonth.getDate(); d++) {
        const dt = new Date(year, monthIndex, d);
        dt.setHours(0, 0, 0, 0); // chỉ quan tâm ngày
        // 2. Nếu lớp có createdDate và dt < createdDate, bỏ qua
        if (createdDate && dt.getTime() < createdDate.getTime()) {
          continue;
        }
        if (dt.getDay() === targetWeekday) {
          const [hh, mm] = timeStr.split(":").map(Number);
          // Tạo thời gian bắt đầu chính xác
          const startDate = new Date(year, monthIndex, d, hh, mm);
          const endDate   = new Date(startDate.getTime() + 90 * 60 * 1000);

          function toISOStringNoTZ(date) {
            const yyyy = date.getFullYear();
            const mm2  = (date.getMonth() + 1).toString().padStart(2, "0");
            const dd2  = date.getDate().toString().padStart(2, "0");
            const hh2  = date.getHours().toString().padStart(2, "0");
            const min2 = date.getMinutes().toString().padStart(2, "0");
            return `${yyyy}-${mm2}-${dd2}T${hh2}:${min2}:00`;
          }

          events.push({
            title: teacherName,
            start: toISOStringNoTZ(startDate),
            end:   toISOStringNoTZ(endDate),
            allDay: false,
            backgroundColor: "#0066cc",
            borderColor:     "#0066cc",
            textColor:       "#fff"
          });
        }
      }
    });
  });

  console.log(`>>> buildEventsArray(${year},${month}) =>`, events);
  return events;
}


function initFullCalendar() {
  const today = new Date();
  const curYear  = today.getFullYear();
  const curMonth = today.getMonth() + 1;

  // === Mini Calendar ===
  const miniEl = document.getElementById("fullcalendar-mini");
  calendarMini = new FullCalendar.Calendar(miniEl, {
    initialView: 'dayGridMonth',
    headerToolbar: { left: 'prev', center: 'title', right: 'next' },
    height: 500,
    selectable: false,
    editable: false,
    dateClick: function(info) {
      const dt = info.date;
      calendarWeekly.gotoDate(dt);
      calendarWeekly.changeView('timeGridWeek');
    },
    fixedWeekCount: false,
    locale: 'vi'
  });
  calendarMini.render();

  // === Weekly Calendar ===
  const weeklyEl = document.getElementById("fullcalendar-weekly");
  calendarWeekly = new FullCalendar.Calendar(weeklyEl, {
    initialView: 'timeGridWeek',
    headerToolbar: { left: '', center: 'title', right: '' },
    allDaySlot: false,
    slotMinTime: "06:00:00",
    slotMaxTime: "22:00:00",
    slotDuration: "01:00:00",
    nowIndicator: true,
    weekNumbers: false,
    height: 600,
    expandRows: true,
    firstDay: 1,
    locale: 'vi',
    views: {
      timeGridWeek: {
        titleFormat: { year: 'numeric', month: 'long', day: 'numeric' },
        dayHeaderFormat: { weekday: 'short', day: 'numeric', month: 'numeric' },
        slotLabelFormat: { hour: '2-digit', minute: '2-digit', hour12: false }
      }
    },
    events: function(fetchInfo, successCallback) {
      const year = fetchInfo.start.getFullYear();
      const month = fetchInfo.start.getMonth() + 1;
      const evts = buildEventsArray(year, month);
      successCallback(evts);
    },
    eventTimeFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
    dayHeaderFormat: { weekday: 'short', day: 'numeric', month: 'numeric' }
  });
  calendarWeekly.render();
}

// Khi user chuyển tab (hashchange):
window.addEventListener("hashchange", () => {
  if (!isAuthReady) return;
  showPageFromHash();

  if (window.location.hash.slice(1) === "schedule-management" && calendarWeekly) {
    // 1. Force render lại để FullCalendar đo đúng kích thước
    calendarWeekly.render();

    // 2. Build event mới (theo tháng hiện tại)
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const evts = buildEventsArray(year, month);

    // 3. Cập nhật lại event cho calendarWeekly
    calendarWeekly.removeAllEvents();
    calendarWeekly.addEventSource(evts);

    // 4. Refresh mini nếu cần
    calendarMini?.refetchEvents?.();
  }
});

// Khi load trang lần đầu, nếu URL có #schedule-management, render ngay
document.addEventListener("DOMContentLoaded", () => {
  // (nếu bạn vẫn bind [data-show-form] ở đây)
  // ...

  if (window.location.hash.slice(1) === "schedule-management" && calendarWeekly) {
    calendarWeekly.render();
    const now = new Date();
    const evts = buildEventsArray(now.getFullYear(), now.getMonth() + 1);
    calendarWeekly.removeAllEvents();
    calendarWeekly.addEventSource(evts);
    calendarMini?.refetchEvents?.();
  }
});

// loading 
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

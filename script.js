// Firebase Configuration - THAY BẰNG CẤU HÌNH CỦA BẠN
const firebaseConfig = {
  apiKey: "AIzaSyA7MMnjIO6UQLYoJB9YJhSl9wUt1qx0EYE",
  authDomain: "lab-edu-11f05.firebaseapp.com",
  projectId: "lab-edu-11f05",
  storageBucket: "lab-edu-11f05.firebasestorage.app",
  messagingSenderId: "133738230418",
  appId: "1:133738230418:web:de00824ab2dc08172dac4b",
  measurementId: "G-JMVC7YZCJT"
};

// Khởi tạo Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();

// Paths database
const DB_PATHS = {
  USERS: "users",
  STUDENTS: "students",
  CLASSES: "classes"
};

// ================= AUTHENTICATION =================
// Đăng ký tài khoản
async function register() {
  const email = document.getElementById("register-email").value.trim();
  const password = document.getElementById("register-password").value;
  const name = document.getElementById("register-name").value.trim();
  const username = document.getElementById("register-username").value.trim();

  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    
    // Lưu thông tin user lên Realtime Database
    await database.ref(`${DB_PATHS.USERS}/${userCredential.user.uid}`).set({
      email,
      name,
      username,
      role: "Người dùng",
      active: true
    });

    alert("Đăng ký thành công!");
    showForm("login");
  } catch (error) {
    alert(`Lỗi đăng ký: ${error.message}`);
  }
}

// Đăng nhập
async function login() {
  const email = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;

  try {
    await auth.signInWithEmailAndPassword(email, password);
    loadDashboard();
  } catch (error) {
    alert(`Lỗi đăng nhập: ${error.message}`);
  }
}

// Theo dõi trạng thái đăng nhập
auth.onAuthStateChanged(user => {
  if (user) {
    loadDashboard();
  } else {
    logout();
  }
});

// ================= STUDENT MANAGEMENT =================
// Lắng nghe thay đổi danh sách học viên
function initStudentsListener() {
  database.ref(DB_PATHS.STUDENTS).on("value", snapshot => {
    const students = snapshot.val() || {};
    renderStudentList(students);
  });
}

// Thêm học viên
async function saveStudent() {
  const studentData = {
    name: document.getElementById("student-name").value.trim(),
    dob: document.getElementById("student-dob").value,
    parent: document.getElementById("student-parent").value.trim(),
    parentJob: document.getElementById("student-parent-job").value,
    package: document.getElementById("student-package").value.trim(),
    sessionsAttended: parseInt(document.getElementById("student-sessions-attended").value),
    sessionsPaid: parseInt(document.getElementById("student-sessions-paid").value),
    createdAt: firebase.database.ServerValue.TIMESTAMP
  };

  try {
    await database.ref(DB_PATHS.STUDENTS).push(studentData);
    hideStudentForm();
  } catch (error) {
    alert(`Lỗi lưu học viên: ${error.message}`);
  }
}

// Xóa học viên
async function deleteStudent(studentId) {
  if (!confirm("Bạn chắc chắn muốn xóa?")) return;
  try {
    await database.ref(`${DB_PATHS.STUDENTS}/${studentId}`).remove();
  } catch (error) {
    alert(`Lỗi xóa học viên: ${error.message}`);
  }
}

// Render danh sách học viên
function renderStudentList(students) {
  const tbody = document.getElementById("student-list");
  tbody.innerHTML = "";

  Object.entries(students).forEach(([key, st]) => {
    const row = `
      <tr>
        <td>${st.name}</td>
        <td>${st.dob}</td>
        <td>${st.parent}</td>
        <td>${st.parentJob}</td>
        <td>${st.package}</td>
        <td>${st.sessionsAttended}</td>
        <td>${st.sessionsPaid}</td>
        <td>
          <button onclick="editStudent('${key}')">Sửa</button>
          <button onclick="deleteStudent('${key}')">Xóa</button>
        </td>
      </tr>`;
    tbody.innerHTML += row;
  });
}

// ================= CLASS MANAGEMENT =================
// Lắng nghe thay đổi lớp học
function initClassesListener() {
  database.ref(DB_PATHS.CLASSES).on("value", snapshot => {
    const classes = snapshot.val() || {};
    renderClassList(classes);
  });
}

// Lưu lớp học
async function saveClass() {
  const classData = {
    name: document.getElementById("class-name").value.trim(),
    teacher: document.getElementById("class-teacher").value.trim(),
    students: getStudentsInClass(),
    createdAt: firebase.database.ServerValue.TIMESTAMP
  };

  try {
    await database.ref(DB_PATHS.CLASSES).push(classData);
    hideClassForm();
  } catch (error) {
    alert(`Lỗi lưu lớp học: ${error.message}`);
  }
}

// Render danh sách lớp
function renderClassList(classes) {
  const tbody = document.getElementById("class-list");
  tbody.innerHTML = "";

  Object.entries(classes).forEach(([key, cls]) => {
    const row = `
      <tr>
        <td>${cls.name}</td>
        <td>${cls.students?.length || 0}</td>
        <td>${cls.teacher}</td>
        <td>
          <button onclick="editClass('${key}')">Sửa</button>
          <button onclick="deleteClass('${key}')">Xóa</button>
        </td>
      </tr>`;
    tbody.innerHTML += row;
  });
}

// ================= COMMON FUNCTIONS =================
// Load dashboard
async function loadDashboard() {
  document.getElementById("auth-container").style.display = "none";
  document.getElementById("dashboard").style.display = "block";

  // Load user data
  const user = auth.currentUser;
  const userData = (await database.ref(`${DB_PATHS.USERS}/${user.uid}`).once("value")).val();
  
  document.getElementById("display-name").textContent = userData.name;
  document.getElementById("display-role").textContent = userData.role;
  document.getElementById("display-name-hello").textContent = userData.name;

  // Khởi tạo listeners
  initStudentsListener();
  initClassesListener();
}

// Đăng xuất
function logout() {
  auth.signOut();
  document.getElementById("dashboard").style.display = "none";
  document.getElementById("auth-container").style.display = "block";
  showForm("login");
}

// Các hàm hiển thị UI giữ nguyên như cũ
// [Giữ nguyên tất cả hàm hiển thị UI như showForm(), hideStudentForm(),...]
// ... (Phần còn lại của code UI giữ nguyên)
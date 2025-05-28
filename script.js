// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyA7MMnjIO6UQLYoJB9YJhSl9wUt1qx0EYE",
  authDomain: "lab-edu-11f05.firebaseapp.com",
  databaseURL: "https://lab-edu-11f05-default-rtdb.asia-southeast1.firebasedatabase.app", // THÊM DÒNG NÀY
  projectId: "lab-edu-11f05",
  storageBucket: "lab-edu-11f05.appspot.com", // SỬA LẠI CHO ĐÚNG
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
    console.error("Lỗi đăng ký:", error);
    alert(`Lỗi đăng ký: ${error.message}`);
  }
}

// Đăng nhập
async function login() {
  const email = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;

  try {
    await auth.signInWithEmailAndPassword(email, password);
    // loadDashboard() sẽ được gọi tự động qua onAuthStateChanged
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    alert(`Lỗi đăng nhập: ${error.message}`);
  }
}

// Theo dõi trạng thái đăng nhập
auth.onAuthStateChanged(user => {
  if (user) {
    loadDashboard();
  } else {
    logoutUI(); // Chỉ ẩn giao diện, không xóa dữ liệu
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

// Thêm/cập nhật học viên
async function saveStudent() {
  const index = document.getElementById("student-index").value;
  const studentData = {
    name: document.getElementById("student-name").value.trim(),
    dob: document.getElementById("student-dob").value,
    parent: document.getElementById("student-parent").value.trim(),
    parentJob: document.getElementById("student-parent-job").value,
    package: document.getElementById("student-package").value.trim(),
    sessionsAttended: parseInt(document.getElementById("student-sessions-attended").value) || 0,
    sessionsPaid: parseInt(document.getElementById("student-sessions-paid").value) || 0,
    updatedAt: firebase.database.ServerValue.TIMESTAMP
  };

  try {
    if (index) {
      // Cập nhật học viên hiện có
      await database.ref(`${DB_PATHS.STUDENTS}/${index}`).update(studentData);
    } else {
      // Thêm học viên mới
      await database.ref(DB_PATHS.STUDENTS).push(studentData);
    }
    hideStudentForm();
  } catch (error) {
    console.error("Lỗi lưu học viên:", error);
    alert(`Lỗi lưu học viên: ${error.message}`);
  }
}

// Xóa học viên
async function deleteStudent(studentId) {
  if (!confirm("Bạn chắc chắn muốn xóa học viên này?")) return;
  try {
    await database.ref(`${DB_PATHS.STUDENTS}/${studentId}`).remove();
  } catch (error) {
    console.error("Lỗi xóa học viên:", error);
    alert(`Lỗi xóa học viên: ${error.message}`);
  }
}

// Sửa học viên
function editStudent(studentId) {
  database.ref(`${DB_PATHS.STUDENTS}/${studentId}`).once("value")
    .then(snapshot => {
      const student = snapshot.val();
      if (student) {
        document.getElementById("student-index").value = studentId;
        document.getElementById("student-name").value = student.name || "";
        document.getElementById("student-dob").value = student.dob || "";
        document.getElementById("student-parent").value = student.parent || "";
        document.getElementById("student-parent-job").value = student.parentJob || "";
        document.getElementById("student-package").value = student.package || "";
        document.getElementById("student-sessions-attended").value = student.sessionsAttended || 0;
        document.getElementById("student-sessions-paid").value = student.sessionsPaid || 0;
        
        showStudentForm();
      }
    })
    .catch(error => {
      console.error("Lỗi tải học viên:", error);
      alert(`Lỗi tải thông tin học viên: ${error.message}`);
    });
}

// Render danh sách học viên
function renderStudentList(students) {
  const tbody = document.getElementById("student-list");
  if (!tbody) return;
  
  tbody.innerHTML = "";

  Object.entries(students).forEach(([key, st]) => {
    const row = `
      <tr>
        <td>${st.name || ""}</td>
        <td>${st.dob || ""}</td>
        <td>${st.parent || ""}</td>
        <td>${st.parentJob || ""}</td>
        <td>${st.package || ""}</td>
        <td>${st.sessionsAttended || 0}</td>
        <td>${st.sessionsPaid || 0}</td>
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
  const index = document.getElementById("class-index").value;
  const classData = {
    name: document.getElementById("class-name").value.trim(),
    teacher: document.getElementById("class-teacher").value.trim(),
    students: getStudentsInClass(),
    studentCount: document.getElementById("class-student-count").value || 0,
    updatedAt: firebase.database.ServerValue.TIMESTAMP
  };

  try {
    if (index) {
      // Cập nhật lớp hiện có
      await database.ref(`${DB_PATHS.CLASSES}/${index}`).update(classData);
    } else {
      // Thêm lớp mới
      await database.ref(DB_PATHS.CLASSES).push(classData);
    }
    hideClassForm();
  } catch (error) {
    console.error("Lỗi lưu lớp học:", error);
    alert(`Lỗi lưu lớp học: ${error.message}`);
  }
}

// Sửa lớp học
function editClass(classId) {
  database.ref(`${DB_PATHS.CLASSES}/${classId}`).once("value")
    .then(snapshot => {
      const cls = snapshot.val();
      if (cls) {
        document.getElementById("class-index").value = classId;
        document.getElementById("class-name").value = cls.name || "";
        document.getElementById("class-teacher").value = cls.teacher || "";
        document.getElementById("class-student-count").value = cls.studentCount || 0;
        
        // Hiển thị danh sách học viên
        renderClassStudentList(cls.students || []);
        
        showClassForm();
      }
    })
    .catch(error => {
      console.error("Lỗi tải lớp học:", error);
      alert(`Lỗi tải thông tin lớp: ${error.message}`);
    });
}

// Render danh sách lớp
function renderClassList(classes) {
  const tbody = document.getElementById("class-list");
  if (!tbody) return;
  
  tbody.innerHTML = "";

  Object.entries(classes).forEach(([key, cls]) => {
    const row = `
      <tr>
        <td>${cls.name || ""}</td>
        <td>${cls.studentCount || 0}</td>
        <td>${cls.teacher || ""}</td>
        <td>
          <button onclick="editClass('${key}')">Sửa</button>
          <button onclick="deleteClass('${key}')">Xóa</button>
        </td>
      </tr>`;
    tbody.innerHTML += row;
  });
}

// Xóa lớp học
async function deleteClass(classId) {
  if (!confirm("Bạn chắc chắn muốn xóa lớp học này?")) return;
  try {
    await database.ref(`${DB_PATHS.CLASSES}/${classId}`).remove();
  } catch (error) {
    console.error("Lỗi xóa lớp học:", error);
    alert(`Lỗi xóa lớp học: ${error.message}`);
  }
}

// ================= COMMON FUNCTIONS =================
// Load dashboard
async function loadDashboard() {
  document.getElementById("auth-container").style.display = "none";
  document.getElementById("dashboard").style.display = "block";

  // Load user data
  const user = auth.currentUser;
  try {
    const snapshot = await database.ref(`${DB_PATHS.USERS}/${user.uid}`).once("value");
    const userData = snapshot.val();
    
    if (userData) {
      document.getElementById("display-name").textContent = userData.name;
      document.getElementById("display-role").textContent = userData.role;
      document.getElementById("display-name-hello").textContent = userData.name;
    }

    // Khởi tạo listeners
    initStudentsListener();
    initClassesListener();
  } catch (error) {
    console.error("Lỗi tải thông tin người dùng:", error);
    alert(`Lỗi tải thông tin người dùng: ${error.message}`);
  }
}

// Đăng xuất (chỉ ẩn giao diện)
function logoutUI() {
  document.getElementById("dashboard").style.display = "none";
  document.getElementById("profile-page").style.display = "none";
  document.getElementById("account-management").style.display = "none";
  document.getElementById("student-management").style.display = "none";
  document.getElementById("class-management").style.display = "none";
  
  document.getElementById("auth-container").style.display = "block";
  showForm("login");
}

// Đăng xuất hoàn toàn
function logout() {
  auth.signOut();
  logoutUI();
}

// ================= UI FUNCTIONS =================
// Hàm hiển thị form đăng nhập/đăng ký/quên mk
function showForm(formName) {
  document.querySelectorAll(".auth-form").forEach((el) => el.classList.remove("active"));
  if (formName === "login") {
    document

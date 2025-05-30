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

// ==== AUTH ====

auth.onAuthStateChanged(user => {
  isAuthReady = true;
  if (user) {
    loadDashboard();
    initStudentsListener();
    initClassesListener();
  } else {
    // Khi logout hoặc chưa đăng nhập
    toggleUI(false);
    showForm("login");
    // Ẩn tất cả các phần quản lý để không bị lỗi UI
    document.getElementById("student-management").style.display = "none";
    document.getElementById("class-management").style.display = "none";
    document.getElementById("account-management").style.display = "none";
    document.getElementById("profile-page").style.display = "none";
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
    // Sau khi logout, reset UI
    toggleUI(false);
    showForm("login");
    // Ẩn các phần quản lý nếu có
    document.getElementById("student-management").style.display = "none";
    document.getElementById("class-management").style.display = "none";
    document.getElementById("account-management").style.display = "none";
    document.getElementById("profile-page").style.display = "none";
  }).catch(error => {
    alert("Lỗi đăng xuất: " + error.message);
  });
}
// ==== UI ====

function toggleUI(isLoggedIn) {
  document.getElementById("auth-container").style.display = isLoggedIn ? "none" : "block";
  document.getElementById("dashboard").style.display = isLoggedIn ? "block" : "none";
  // Các phần quản lý không ẩn ở đây để giữ dashboard luôn hiện
}

function showForm(formName) {
  const authContainer = document.getElementById("auth-container");
  const registerForm = document.getElementById("register-form");
  const loginForm = document.getElementById("login-form");
  const forgotForm = document.getElementById("forgot-password-form");

  if(authContainer) authContainer.style.display = "block";
  if(registerForm) registerForm.style.display = (formName === "register") ? "block" : "none";
  if(loginForm) loginForm.style.display = (formName === "login") ? "block" : "none";
  if(forgotForm) forgotForm.style.display = (formName === "forgot") ? "block" : "none";
}

function loadDashboard() {
  toggleUI(true);
  // Ẩn tất cả các phần quản lý khi load dashboard
  document.getElementById("student-management").style.display = "none";
  document.getElementById("class-management").style.display = "none";
  document.getElementById("account-management").style.display = "none";
  document.getElementById("profile-page").style.display = "none";
}

// ==== Kiểm tra auth trước khi hiển thị phần quản lý ====

function checkAuthAndShow(elementId) {
  if (!isAuthReady) {
    alert("Đang kiểm tra đăng nhập, vui lòng thử lại sau.");
    return false;
  }
  const user = auth.currentUser;
  if (!user) {
    alert("Vui lòng đăng nhập để sử dụng chức năng này!");
    showForm("login");
    toggleUI(false);
    return false;
  }
  // Ẩn hết các phần quản lý
  document.getElementById("student-management").style.display = "none";
  document.getElementById("class-management").style.display = "none";
  document.getElementById("account-management").style.display = "none";
  document.getElementById("profile-page").style.display = "none";
  // Hiện phần được chọn
  document.getElementById(elementId).style.display = "block";
  return true;
}

function showStudentManagement() {
  if (checkAuthAndShow("student-management")) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function showClassManagement() {
  if (checkAuthAndShow("class-management")) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function showAccountManagement() {
  if (checkAuthAndShow("account-management")) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}


function openProfile() {
  if (checkAuthAndShow("profile-page")) {
     window.scrollTo({top: 0, behavior: 'smooth'});
  }
}

// ==== QUẢN LÝ HỌC VIÊN ====

function renderStudentList(students) {
  const tbody = document.getElementById("student-list");
  tbody.innerHTML = "";
  Object.entries(students).forEach(([id, st]) => {
    const row = `
      <tr>
        <td>${st.name || ""}</td>
        <td>${st.dob || ""}</td>
        <td>${st.parent || ""}</td>
        <td>${st.parentPhone || ""}</td> <!-- Mới thêm -->
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
}


function initStudentsListener() {
  database.ref(DB_PATHS.STUDENTS).on("value", snapshot => {
    const students = snapshot.val() || {};
    renderStudentList(students);
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
    parentPhone: document.getElementById("student-parent-phone").value.trim(), // mới thêm
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
    document.getElementById("student-parent-phone").value = st.parentPhone || ""; // Mới thêm
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

// ==== QUẢN LÝ LỚP HỌC ====

let currentClassStudents = [];

function initClassesListener() {
  database.ref(DB_PATHS.CLASSES).on("value", snapshot => {
    const classes = snapshot.val() || {};
    renderClassList(classes);
  });
}

function renderClassList(classes) {
  const tbody = document.getElementById("class-list");
  tbody.innerHTML = "";
  Object.entries(classes).forEach(([id, cls]) => {
    const row = `
      <tr>
        <td>${cls.name || ""}</td>
        <td>${cls.students ? Object.keys(cls.students).length : 0}</td>
        <td>${cls.teacher || ""}</td>
        <td>
          <button onclick="editClass('${id}')">Sửa</button>
          <button class="delete-btn" onclick="deleteClass('${id}')">Xóa</button>
        </td>
      </tr>`;
    tbody.innerHTML += row;
  });
}

function showClassManagement() {
  checkAuthAndShow("class-management");
}

function showClassForm() {
  currentClassStudents = [];
  document.getElementById("class-form-title").textContent = "Tạo lớp học mới";
  document.getElementById("class-form").reset();
  document.getElementById("class-index").value = "";
  renderClassStudentList([]);
  updateStudentOptionsForClass();
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
      option.value = st.name || "";
      option.textContent = st.name || "";
      select.appendChild(option);
    });
  });
}

function addStudentToClass() {
  const select = document.getElementById("class-add-student");
  const name = select.value.trim();
  if (!name) return alert("Vui lòng chọn học viên để thêm!");

  if (currentClassStudents.includes(name)) {
    alert("Học viên đã có trong lớp!");
    return;
  }

  currentClassStudents.push(name);
  renderClassStudentList(currentClassStudents);
}

function renderClassStudentList(students) {
  currentClassStudents = students;
  const ul = document.getElementById("class-student-list");
  ul.innerHTML = "";
  students.forEach(name => {
    const li = document.createElement("li");
    li.textContent = name;

    const btnRemove = document.createElement("span");
    btnRemove.textContent = "x";
    btnRemove.className = "remove-btn";
    btnRemove.onclick = () => {
      currentClassStudents = currentClassStudents.filter(n => n !== name);
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

  currentClassStudents.forEach(name => {
    classData.students[name] = true;
  });

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

// ==== PROFILE ====

function openProfile() {
  checkAuthAndShow("profile-page");
}

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

// ==== LOADING ====

function showLoading(show) {
  document.getElementById("loading").style.display = show ? "block" : "none";
}

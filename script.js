// Firebase config chuẩn, cập nhật version compat để dễ dùng
const firebaseConfig = {
  apiKey: "AIzaSyA7MMnjIO6UQLYoJB9YJhSl9wUt1qx0EYE",
  authDomain: "lab-edu-11f05.firebaseapp.com",
  databaseURL: "https://lab-edu-11f05-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "lab-edu-11f05",
  storageBucket: "lab-edu-11f05.appspot.com",
  messagingSenderId: "133738230418",
  appId: "1:133738230418:web:de00824ab2dc08172dac4b",
  measurementId: "G-JMVC7YZCJT"
};

// Khởi tạo Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();
const storage = firebase.storage();

// Path DB
const DB_PATHS = {
  USERS: "users",
  STUDENTS: "students",
  CLASSES: "classes"
};

// ==== XỬ LÝ AUTH ====
// Hiển thị form đăng nhập/đăng ký/quên mk
function showForm(formName) {
  document.querySelectorAll(".auth-form").forEach(el => el.classList.remove("active"));
  if (formName === "login") {
    document.getElementById("login-form").classList.add("active");
  } else if (formName === "register") {
    document.getElementById("register-form").classList.add("active");
  } else if (formName === "forgot") {
    document.getElementById("forgot-form").classList.add("active");
  }
}

// Đăng ký tài khoản
async function register() {
  const email = document.getElementById("register-email").value.trim();
  const password = document.getElementById("register-password").value;
  const name = document.getElementById("register-name").value.trim();
  const username = document.getElementById("register-username").value.trim();

  if (!email || !password || !name || !username) {
    alert("Vui lòng nhập đầy đủ thông tin đăng ký!");
    return;
  }

  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const uid = userCredential.user.uid;

    // Lưu thông tin user lên Realtime Database
    await database.ref(`${DB_PATHS.USERS}/${uid}`).set({
      email,
      name,
      username,
      role: "Người dùng",
      active: true
    });

    alert("Đăng ký thành công! Vui lòng đăng nhập.");
    showForm("login");
  } catch (error) {
    alert("Lỗi đăng ký: " + error.message);
  }
}

// Đăng nhập
async function login() {
  const email = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;

  if (!email || !password) {
    alert("Vui lòng nhập email và mật khẩu!");
    return;
  }

  try {
    await auth.signInWithEmailAndPassword(email, password);
    // onAuthStateChanged sẽ tự động gọi loadDashboard
  } catch (error) {
    alert("Lỗi đăng nhập: " + error.message);
  }
}

// Quên mật khẩu
async function forgotPassword() {
  const email = document.getElementById("forgot-username").value.trim();
  if (!email) {
    alert("Vui lòng nhập email để lấy lại mật khẩu!");
    return;
  }
  try {
    await auth.sendPasswordResetEmail(email);
    alert("Email lấy lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư.");
    showForm("login");
  } catch (error) {
    alert("Lỗi gửi email: " + error.message);
  }
}

// Đăng xuất
function logout() {
  auth.signOut();
  showForm("login");
  toggleUI(false);
}

// Theo dõi trạng thái đăng nhập
auth.onAuthStateChanged(user => {
  if (user) {
    loadDashboard();
  } else {
    toggleUI(false);
    showForm("login");
  }
});

// ==== UI BỔ TRỢ ====

function toggleUI(isLoggedIn) {
  document.getElementById("auth-container").style.display = isLoggedIn ? "none" : "block";
  document.getElementById("dashboard").style.display = isLoggedIn ? "block" : "none";
  document.getElementById("account-management").style.display = "none";
  document.getElementById("student-management").style.display = "none";
  document.getElementById("class-management").style.display = "none";
  document.getElementById("profile-page").style.display = "none";
  hideStudentForm();
  hideClassForm();
}

function backToDashboard() {
  toggleUI(true);
}

// ==== DASHBOARD ====

async function loadDashboard() {
  toggleUI(true);
  const user = auth.currentUser;
  if (!user) return;

  // Load thông tin user
  try {
    const snapshot = await database.ref(`${DB_PATHS.USERS}/${user.uid}`).once("value");
    const userData = snapshot.val();
    if (userData) {
      document.getElementById("display-name").textContent = userData.name;
      document.getElementById("display-role").textContent = userData.role;
      document.getElementById("display-name-hello").textContent = userData.name;
      if (userData.avatarUrl) {
        document.getElementById("avatar-img").src = userData.avatarUrl;
        document.getElementById("profile-avatar").src = userData.avatarUrl;
      } else {
        document.getElementById("avatar-img").src = "avatar.png";
        document.getElementById("profile-avatar").src = "avatar.png";
      }
    }
  } catch (error) {
    alert("Lỗi tải thông tin người dùng: " + error.message);
  }

  // Khởi tạo listeners realtime
  initStudentsListener();
  initClassesListener();
  initAccountsListener();
}

// ==== QUẢN LÝ TÀI KHOẢN ====

function initAccountsListener() {
  database.ref(DB_PATHS.USERS).on("value", snapshot => {
    const users = snapshot.val() || {};
    const tbody = document.getElementById("account-list");
    tbody.innerHTML = "";
    Object.entries(users).forEach(([uid, user]) => {
      const statusClass = user.active ? "status-active" : "status-deactive";
      const row = `
        <tr>
          <td>${user.email || ""}</td>
          <td>${user.name || ""}</td>
          <td>${user.username || ""}</td>
          <td>${user.role || ""}</td>
          <td class="${statusClass}">${user.active ? "Active" : "Inactive"}</td>
        </tr>`;
      tbody.innerHTML += row;
    });
  });
}

function showAccountManagement() {
  toggleUI(false);
  document.getElementById("account-management").style.display = "block";
}

// ==== QUẢN LÝ HỌC VIÊN ====

function initStudentsListener() {
  database.ref(DB_PATHS.STUDENTS).on("value", snapshot => {
    const students = snapshot.val() || {};
    renderStudentList(students);
    updateStudentOptions(students);
  });
}

// renderStudentList sửa lại nút Xóa:
function renderStudentList(students) {
  const tbody = document.getElementById("student-list");
  tbody.innerHTML = "";
  Object.entries(students).forEach(([id, st]) => {
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
          <button onclick="editStudent('${id}')">Sửa</button>
          <button class="delete-btn" onclick="deleteStudent('${id}')">Xóa</button>
        </td>
      </tr>`;
    tbody.innerHTML += row;
  });
}

function showStudentManagement() {
  toggleUI(false);
  document.getElementById("student-management").style.display = "block";
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
  const id = document.getElementById("student-index").value;
  const studentData = {
    name: document.getElementById("student-name").value.trim(),
    dob: document.getElementById("student-dob").value,
    parent: document.getElementById("student-parent").value.trim(),
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
    if (["Công nhân","Giáo viên","Kinh doanh","Bác sĩ","Nông dân"].includes(st.parentJob)) {
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

// renderClassList sửa lại nút Xóa:
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
  toggleUI(false);
  document.getElementById("class-management").style.display = "block";
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

function editClass(id) {
  database.ref(`${DB_PATHS.CLASSES}/${id}`).once("value").then(snapshot => {
    const cls = snapshot.val();
    if (!cls) return alert("Lớp học không tồn tại!");

    document.getElementById("class-index").value = id;
    document.getElementById("class-name").value = cls.name || "";
    document.getElementById("class-teacher").value = cls.teacher || "";

    const studentNames = cls.students ? Object.keys(cls.students) : [];
    renderClassStudentList(studentNames);

    updateStudentOptionsForClass();
    document.getElementById("class-form-title").textContent = "Chỉnh sửa lớp học";
    document.getElementById("class-form-container").style.display = "block";
  }).catch(err => alert("Lỗi tải lớp học: " + err.message));
}

// ==== PROFILE ====

function openProfile() {
  toggleUI(false);
  document.getElementById("profile-page").style.display = "block";
}

// Upload avatar lên Firebase Storage
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

    // Cập nhật URL avatar trong DB user
    await database.ref(`${DB_PATHS.USERS}/${user.uid}`).update({ avatarUrl: url });

    // Cập nhật avatar trong UI
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

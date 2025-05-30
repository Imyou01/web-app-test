// Firebase config (thay bằng config của bạn)
const firebaseConfig = {
  // ... your config ...
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();
const storage = firebase.storage();

// Các biến hỗ trợ
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Hàm login, logout, register, auth check ... giữ nguyên của bạn hoặc tự làm

// Hàm backToDashboard() để quay về dashboard
function backToDashboard() {
  window.location.hash = "dashboard";
}

// Các hàm khác load dữ liệu học viên, tài khoản ...

// --- Lớp học ---

// Mảng lưu học viên chọn thêm khi tạo/sửa lớp
let selectedStudentsForClass = {};

// Load danh sách lớp học
async function loadClasses() {
  showLoading(true);
  const snapshot = await database.ref("classes").get();
  if (!snapshot.exists()) {
    document.getElementById("class-list").innerHTML = "<tr><td colspan='6'>Chưa có lớp học</td></tr>";
    showLoading(false);
    return;
  }
  const classes = snapshot.val();

  // Render lên bảng
  renderClassList(classes);

  // Load danh sách học viên để chọn thêm
  await loadStudentsForClass();

  showLoading(false);
}

// Render bảng lớp học
function renderClassList(classes) {
  const tbody = document.getElementById("class-list");
  tbody.innerHTML = "";
  Object.entries(classes).forEach(([id, cls]) => {
    const studentCount = cls.students ? Object.keys(cls.students).length : 0;
    const sessionsDone = cls.totalSessions || 0;
    let scheduleStr = "-";
    if (cls.schedule && Array.isArray(cls.schedule) && cls.schedule.length > 0) {
      scheduleStr = cls.schedule.map(day => day.slice(0,3)).join(", ");
    }
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${cls.name || ""}</td>
      <td>${studentCount}</td>
      <td>${cls.teacher || ""}</td>
      <td>${sessionsDone}</td>
      <td>${scheduleStr}</td>
      <td>
        <button onclick="showClassDetail('${id}')">Xem chi tiết</button>
        <button onclick="editClass('${id}')">Sửa</button>
        <button class="delete-btn" onclick="deleteClass('${id}')">Xóa</button>
      </td>`;
    tbody.appendChild(row);
  });
}

// Load danh sách học viên để chọn thêm trong form lớp
async function loadStudentsForClass() {
  const snapshot = await database.ref("students").get();
  const select = document.getElementById("class-add-student");
  select.innerHTML = `<option value="">-- Chọn học viên --</option>`;
  if (!snapshot.exists()) return;
  const students = snapshot.val();
  Object.entries(students).forEach(([id, st]) => {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = st.name || "Không tên";
    select.appendChild(option);
  });
}

// Thêm học viên vào danh sách lớp khi chọn
function addStudentToClass() {
  const select = document.getElementById("class-add-student");
  const studentId = select.value;
  if (!studentId) return alert("Vui lòng chọn học viên");
  if (selectedStudentsForClass[studentId]) return alert("Học viên đã được thêm");
  
  const studentName = select.options[select.selectedIndex].text;

  selectedStudentsForClass[studentId] = studentName;

  // Hiển thị danh sách học viên trong lớp
  const ul = document.getElementById("class-student-list");
  const li = document.createElement("li");
  li.setAttribute("data-id", studentId);
  li.textContent = studentName;
  const btnRemove = document.createElement("button");
  btnRemove.textContent = "X";
  btnRemove.className = "remove-btn";
  btnRemove.onclick = () => {
    delete selectedStudentsForClass[studentId];
    ul.removeChild(li);
  };
  li.appendChild(btnRemove);
  ul.appendChild(li);

  // Reset select
  select.value = "";
}

// Hiển thị form tạo/sửa lớp
function showClassForm() {
  document.getElementById("class-form-container").style.display = "block";
  document.getElementById("class-management").scrollIntoView({ behavior: "smooth" });
  document.getElementById("class-form-title").textContent = "Tạo lớp học mới";
  document.getElementById("class-index").value = "";
  document.getElementById("class-name").value = "";
  document.getElementById("class-teacher").value = "";
  selectedStudentsForClass = {};
  document.getElementById("class-student-list").innerHTML = "";
  // reset checkbox lịch học
  document.querySelectorAll('input[name="fixed-schedule"]').forEach(cb => cb.checked = false);
}

// Ẩn form tạo/sửa lớp
function hideClassForm() {
  document.getElementById("class-form-container").style.display = "none";
}

// Lưu lớp (tạo hoặc cập nhật)
async function saveClass() {
  const className = document.getElementById("class-name").value.trim();
  const classTeacher = document.getElementById("class-teacher").value.trim();
  const classIndex = document.getElementById("class-index").value;

  const checkedBoxes = document.querySelectorAll('input[name="fixed-schedule"]:checked');
  const schedule = Array.from(checkedBoxes).map(cb => cb.value);

  if (!className) return alert("Vui lòng nhập tên lớp");
  if (!classTeacher) return alert("Vui lòng nhập tên giáo viên");

  const classData = {
    name: className,
    teacher: classTeacher,
    students: selectedStudentsForClass,
    schedule,
    totalSessions: 0,
  };

  showLoading(true);
  try {
    if (classIndex) {
      await database.ref(`classes/${classIndex}`).update(classData);
    } else {
      await database.ref("classes").push(classData);
    }
    alert("Lưu lớp học thành công");
    hideClassForm();
    loadClasses();
  } catch (error) {
    alert("Lỗi lưu lớp học: " + error.message);
  }
  showLoading(false);
}

// Hiển thị chi tiết lớp học popup
async function showClassDetail(classId) {
  const popup = document.getElementById("class-detail-popup");
  const content = document.getElementById("class-detail-content");
  showLoading(true);
  try {
    const snapshot = await database.ref(`classes/${classId}`).get();
    if (!snapshot.exists()) {
      alert("Lớp học không tồn tại");
      showLoading(false);
      return;
    }
    const cls = snapshot.val();
    let html = `<p><strong>Tên lớp:</strong> ${cls.name || ""}</p>`;
    html += `<p><strong>Giáo viên:</strong> ${cls.teacher || ""}</p>`;
    const studentCount = cls.students ? Object.keys(cls.students).length : 0;
    html += `<p><strong>Số học viên:</strong> ${studentCount}</p>`;
    const sessionsDone = cls.totalSessions || 0;
    html += `<p><strong>Số buổi đã học:</strong> ${sessionsDone}</p>`;
    if (cls.schedule && cls.schedule.length > 0) {
      html += `<p><strong>Lịch học cố định:</strong> ${cls.schedule.join(", ")}</p>`;
    } else {
      html += `<p><strong>Lịch học cố định:</strong> Chưa đặt lịch</p>`;
    }
    // Lịch học dạng bảng tuần
    html += `<h3>Lịch học cụ thể</h3>`;
    html += `<table border="1" cellspacing="0" cellpadding="6" style="width:100%; border-collapse:collapse; text-align:center;">
      <thead><tr>${WEEKDAYS.map(d => `<th>${d.slice(0,3)}</th>`).join("")}</tr></thead>
      <tbody><tr>`;
    WEEKDAYS.forEach(day => {
      if (cls.schedule && cls.schedule.includes(day)) {
        html += `<td style="background:#d5e2ff; cursor:pointer;" onclick="alert('Chức năng chi tiết buổi học đang phát triển')">●</td>`;
      } else {
        html += `<td></td>`;
      }
    });
    html += `</tr></tbody></table>`;
    content.innerHTML = html;
    popup.style.display = "block";
  } catch (error) {
    alert("Lỗi tải chi tiết lớp: " + error.message);
  }
  showLoading(false);
}

// Đóng popup chi tiết lớp
function closeClassDetail() {
  document.getElementById("class-detail-popup").style.display = "none";
}

// Chỉnh sửa lớp
async function editClass(classId) {
  showLoading(true);
  try {
    const snapshot = await database.ref(`classes/${classId}`).get();
    if (!snapshot.exists()) {
      alert("Lớp học không tồn tại");
      showLoading(false);
      return;
    }
    const cls = snapshot.val();
    showClassForm();
    document.getElementById("class-form-title").textContent = "Chỉnh sửa lớp học";
    document.getElementById("class-index").value = classId;
    document.getElementById("class-name").value = cls.name || "";
    document.getElementById("class-teacher").value = cls.teacher || "";
    selectedStudentsForClass = cls.students || {};
    // Hiển thị học viên trong danh sách
    const ul = document.getElementById("class-student-list");
    ul.innerHTML = "";
    Object.entries(selectedStudentsForClass).forEach(([id, name]) => {
      const li = document.createElement("li");
      li.setAttribute("data-id", id);
      li.textContent = name;
      const btnRemove = document.createElement("button");
      btnRemove.textContent = "X";
      btnRemove.className = "remove-btn";
      btnRemove.onclick = () => {
        delete selectedStudentsForClass[id];
        ul.removeChild(li);
      };
      li.appendChild(btnRemove);
      ul.appendChild(li);
    });
    // Đánh dấu lịch cố định checkbox
    document.querySelectorAll('input[name="fixed-schedule"]').forEach(cb => {
      cb.checked = cls.schedule ? cls.schedule.includes(cb.value) : false;
    });
  } catch (error) {
    alert("Lỗi tải lớp: " + error.message);
  }
  showLoading(false);
}

// Xóa lớp học
async function deleteClass(classId) {
  if (!confirm("Bạn có chắc chắn muốn xóa lớp này?")) return;
  showLoading(true);
  try {
    await database.ref(`classes/${classId}`).remove();
    alert("Xóa lớp học thành công");
    loadClasses();
  } catch (error) {
    alert("Lỗi xóa lớp học: " + error.message);
  }
  showLoading(false);
}

// Hàm hiển thị loading
function showLoading(show) {
  document.getElementById("loading").style.display = show ? "block" : "none";
}

// Hàm khác giữ nguyên từ project trước của bạn (loadStudents, loadAccounts, login, logout, v.v...)


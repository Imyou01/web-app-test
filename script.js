// ... giữ nguyên toàn bộ code trước đó ...

// Thêm xử lý nâng cao cho lớp học

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Gán dữ liệu lớp lên bảng, thêm cột buổi đã học, lịch cố định, nút xem chi tiết
function renderClassList(classes) {
  const tbody = document.getElementById("class-list");
  tbody.innerHTML = "";
  Object.entries(classes).forEach(([id, cls]) => {
    // Tính số học viên
    const studentCount = cls.students ? Object.keys(cls.students).length : 0;

    // Tính số buổi đã học (ví dụ dùng trường totalSessions học viên hoặc cls.totalSessions)
    const sessionsDone = cls.totalSessions || 0;

    // Hiển thị lịch học cố định dạng ngày viết tắt
    let scheduleStr = "";
    if (cls.schedule && Array.isArray(cls.schedule) && cls.schedule.length > 0) {
      scheduleStr = cls.schedule.map(day => day.slice(0, 3)).join(", ");
    } else {
      scheduleStr = "-";
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

// Lưu lớp có schedule
async function saveClass() {
  const user = auth.currentUser;
  if (!user) return alert("Vui lòng đăng nhập");

  const className = document.getElementById("class-name").value.trim();
  const classTeacher = document.getElementById("class-teacher").value.trim();
  const classIndex = document.getElementById("class-index").value;

  // Lấy lịch học cố định
  const checkedBoxes = document.querySelectorAll('input[name="fixed-schedule"]:checked');
  const schedule = Array.from(checkedBoxes).map(cb => cb.value);

  // Lấy học viên thêm vào lớp
  const students = {};
  const ulStudents = document.getElementById("class-student-list");
  ulStudents.querySelectorAll("li").forEach(li => {
    const studentId = li.getAttribute("data-id");
    const studentName = li.textContent.trim();
    students[studentId] = studentName;
  });

  if (!className) return alert("Vui lòng nhập tên lớp");
  if (!classTeacher) return alert("Vui lòng nhập tên giáo viên");

  const classData = {
    name: className,
    teacher: classTeacher,
    students,
    schedule,
    totalSessions: 0, // mặc định
  };

  showLoading(true);
  try {
    if (classIndex) {
      // Update lớp
      await database.ref(`classes/${classIndex}`).update(classData);
    } else {
      // Tạo mới
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

// Hiển thị chi tiết lớp (popup)
async function showClassDetail(classId) {
  const classDetailPopup = document.getElementById("class-detail-popup");
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

    // Chuẩn bị nội dung chi tiết
    let html = `<p><strong>Tên lớp:</strong> ${cls.name || ""}</p>`;
    html += `<p><strong>Giáo viên:</strong> ${cls.teacher || ""}</p>`;

    // Học viên
    const studentCount = cls.students ? Object.keys(cls.students).length : 0;
    html += `<p><strong>Số học viên:</strong> ${studentCount}</p>`;

    // Buổi đã học
    const sessionsDone = cls.totalSessions || 0;
    html += `<p><strong>Số buổi đã học:</strong> ${sessionsDone}</p>`;

    // Lịch học cố định
    if (cls.schedule && cls.schedule.length > 0) {
      html += `<p><strong>Lịch học cố định:</strong> ${cls.schedule.join(", ")}</p>`;
    } else {
      html += `<p><strong>Lịch học cố định:</strong> Chưa đặt lịch</p>`;
    }

    // Lịch học cụ thể (demo calendar)
    html += `<h3>Lịch học cụ thể</h3>`;
    html += `<table border="1" cellspacing="0" cellpadding="6" style="width:100%; border-collapse:collapse; text-align:center;">
      <thead><tr>${WEEKDAYS.map(d => `<th>${d.slice(0,3)}</th>`).join("")}</tr></thead>
      <tbody><tr>`;

    // Tạo ô trống, hoặc đánh dấu lịch cố định
    WEEKDAYS.forEach(day => {
      if (cls.schedule && cls.schedule.includes(day)) {
        html += `<td style="background:#d5e2ff; cursor:pointer;" onclick="alert('Bạn có thể thêm chức năng chi tiết cho buổi học này')">●</td>`;
      } else {
        html += "<td></td>";
      }
    });

    html += "</tr></tbody></table>";

    content.innerHTML = html;
    classDetailPopup.style.display = "block";
  } catch (error) {
    alert("Lỗi tải chi tiết lớp: " + error.message);
  }
  showLoading(false);
}

function closeClassDetail() {
  document.getElementById("class-detail-popup").style.display = "none";
}

// ... giữ nguyên các hàm khác (loadClasses, editClass, deleteClass, addStudentToClass, showClassForm, hideClassForm, etc.) ...

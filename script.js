// script.js  ---------------------------------------------------------------------------------

// Cấu hình Firebase
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

// Khởi tạo Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();
const storage = firebase.storage();

// Các biến toàn cục
let isAuthReady = false;
let currentStudentPage = 1;
const studentsPerPage = 20;
let totalStudentPages = 1;

let allStudentsData = {};
let allClassesData = {};
let currentClassStudents = [];
let calendarWeekly = null;
let calendarMini   = null;

// Đường dẫn các node trong Realtime Database
const DB_PATHS = {
  USERS: "users",
  STUDENTS: "students",
  CLASSES: "classes",
  HOMEWORKS: "homeworks"
};

// Danh sách các trang (tham chiếu bằng ID)
const pages = [
  "dashboard",
  "account-management",
  "student-management",
  "class-management",
  "schedule-management",
  "homework-management",
  "profile-page"
];
// script.js

// script.js

// XÓA đối tượng certificateCourses cũ và THAY THẾ bằng 2 đối tượng mới dưới đây

const generalEnglishCourses = [
  { name: "Tiếng Anh cho trẻ em (Mầm non)", sessions: 8 }, // 1 tháng
  { name: "Tiếng Anh cho học sinh (TH+THCS+THPT)", sessions: 8 }, // 1 tháng
  { name: "Luyện thi THPT Quốc Gia (điểm cao)", sessions: 8 }, // 1 tháng
  { name: "Combo 3X: Tiếng Anh cho trẻ em (Mầm non)", sessions: 24 }, // 3 tháng
  { name: "Combo 3X: Tiếng Anh cho học sinh (TH+THCS+THPT)", sessions: 24 }, // 3 tháng
  { name: "Combo 3X: Luyện thi THPT Quốc Gia (điểm cao)", sessions: 24 }, // 3 tháng
  { name: "Combo 6X: Tiếng Anh cho trẻ em (Mầm non)", sessions: 48 }, // 6 tháng
  { name: "Combo 6X: Tiếng Anh cho học sinh (TH+THCS+THPT)", sessions: 48 }, // 6 tháng
  { name: "Combo 6X: Luyện thi THPT Quốc Gia (điểm cao)", sessions: 48 }, // 6 tháng
  { name: "Combo 12X: Tiếng Anh cho trẻ em (Mầm non)", sessions: 96 }, // 12 tháng
  { name: "Combo 12X: Tiếng Anh cho học sinh (TH+THCS+THPT)", sessions: 96 }, // 12 tháng
  { name: "Combo 12X: Luyện thi THPT Quốc Gia (điểm cao)", sessions: 96 }, // 12 tháng
];

const certificateCourses = {
  IELTS: [
    { name: "Giao tiếp cơ bản", sessions: 18 },
    { name: "Nền tảng IELTS 4.0", sessions: 18 },
    { name: "Khởi động IELTS 5.0", sessions: 27 },
    { name: "Bứt phá IELTS 6.5", sessions: 40 },
    { name: "Chinh phục IELTS 7.0+", sessions: 40 },
    { name: "Luyện đề IELTS 7.0+", sessions: 18 },
    { name: "Combo 2 khóa: Giao tiếp + IELTS 4.0", sessions: 36 },
    { name: "Combo 2 khóa: IELTS 4.0 + IELTS 5.0", sessions: 45 },
    { name: "Combo 2 khóa: IELTS 5.0 + IELTS 6.5", sessions: 67 },
    { name: "Combo 2 khóa: IELTS 6.5 + IELTS 7.0+", sessions: 80 },
    { name: "Combo 3 khóa: Giao tiếp + IELTS 4.0 + IELTS 5.0", sessions: 53 },
    { name: "Combo 3 khóa: IELTS 4.0 + IELTS 5.0 + IELTS 6.5", sessions: 85 },
    { name: "Combo 3 khóa: IELTS 5.0 + IELTS 6.5 + IELTS 7.0+", sessions: 107 },
    { name: "Combo 3 khóa: IELTS 6.5 + IELTS 7.0+ + Luyện đề 7.0+", sessions: 98 },
    { name: "Combo 4 khóa: Giao tiếp + IELTS 4.0 + IELTS 5.0 + IELTS 6.5", sessions: 93 },
    { name: "Combo 4 khóa: IELTS 4.0 + IELTS 5.0 + IELTS 6.5 + IELTS 7.0+", sessions: 125 },
    { name: "Combo 4 khóa: IELTS 5.0 + IELTS 6.5 + IELTS 7.0+ + Luyện đề 7.0+", sessions: 125 },
    { name: "Combo 5 khóa: Giao tiếp + IELTS 4.0 + IELTS 5.0 + IELTS 6.5 + IELTS 7.0+", sessions: 133 },
    { name: "Combo 5 khóa: IELTS 4.0 + IELTS 5.0 + IELTS 6.5 + IELTS 7.0+ + Luyện đề 7.0+", sessions: 143 }
  ],
  TOEIC: [
    { name: "Nền tảng - TOEIC 450", sessions: 25 },
    { name: "TOEIC 600+", sessions: 30 },
    { name: "TOEIC 700+", sessions: 25 },
    { name: "TOEIC S + W (230)", sessions: 25 },
    { name: "TOEIC S + W (320)", sessions: 25 }
  ],
  HSK_BASE: [
    { name: "HSK1", sessions: 18 }, { name: "HSK2", sessions: 20 }, { name: "HSK3", sessions: 28 }, { name: "HSK4", sessions: 50 }, { name: "HSK5", sessions: 80 },
    { name: "HSKK sơ cấp", sessions: 10 }, { name: "HSKK trung cấp", sessions: 18 }, { name: "HSKK cao cấp", sessions: 25 },
    { name: "Sơ cấp A1-A2", sessions: 45 }, { name: "Trung cấp B1", sessions: 65 }, { name: "Trung-cao cấp B2", sessions: 75 },
  ],
  YCT_BASE: [], // Sẽ được tạo tự động
   HSK: [
    // Khóa lẻ
    { name: "HSK1", sessions: 18 }, { name: "HSK2", sessions: 20 }, { name: "HSK3", sessions: 28 }, { name: "HSK4", sessions: 50 }, { name: "HSK5", sessions: 80 },
    { name: "HSKK sơ cấp", sessions: 10 }, { name: "HSKK trung cấp", sessions: 18 }, { name: "HSKK cao cấp", sessions: 25 },
    { name: "Sơ cấp A1-A2", sessions: 45 }, { name: "Trung cấp B1", sessions: 65 }, { name: "Trung-cao cấp B2", sessions: 75 },
    // Combo (Thêm thuộc tính selectionLimit)
    { name: "Combo HSK + HSKK: 2 khoá bất kì", selectionLimit: 2 },
    { name: "Combo HSK + HSKK: 3 khoá bất kì", selectionLimit: 3 },
    { name: "Combo HSK + HSKK: 4 khoá bất kì", selectionLimit: 4 },
    { name: "Combo HSK + HSKK: 5 khoá bất kì", selectionLimit: 5 },
    { name: "Combo Giao Tiếp: 2 khoá bất kì", selectionLimit: 2 },
    { name: "Combo Giao Tiếp: 3 khoá bất kì", selectionLimit: 3 },
  ],
  YCT: []
};

// Tự động tạo danh sách YCT_BASE
certificateCourses.YCT_BASE = certificateCourses.HSK_BASE.map(course => ({
    name: course.name.replace(/HSK/g, 'YCT'),
    sessions: course.sessions
}));
// Tự động tạo danh sách khóa YCT đầy đủ
certificateCourses.YCT = certificateCourses.HSK.map(course => ({
    name: course.name.replace(/HSK/g, 'YCT'),
    sessions: course.sessions,
    selectionLimit: course.selectionLimit // Chép cả selectionLimit
}));
// Thêm vào script.js, trước phần sử dụng showPageFromHash
function showPage(id) {
  // Ẩn tất cả các trang management, dashboard, profile…
  pages.forEach(pageId => {
    const el = document.getElementById(pageId);
    if (el) el.style.display = "none";
  });
  // Ẩn luôn dashboard và profile nếu đang mở
  document.getElementById("dashboard").style.display = "none";
  document.getElementById("profile-page").style.display = "none";

  // Hiển thị trang tương ứng theo id
  const target = document.getElementById(id);
  if (target) {
    target.style.display = "block";
  }
}
// hoặc (curr || 0) - 1 nếu bỏ điểm danh

// Khi trạng thái xác thực thay đổi
auth.onAuthStateChanged(async (user) => {
  console.log("Auth state changed, user:", user);
  isAuthReady = true;

  if (user) {
    // === XÓA HOẶC BỎ GHI CHÚ ĐOẠN NÀY ===
    // if (!user.emailVerified) {
    //   alert("Vui lòng xác thực email trước khi truy cập Dashboard.");
    //   await auth.signOut();
    //   return;
    // }
    // ======================================

    // Lấy thông tin profile từ DB
    const uid = user.uid;
    const userSnapshot = await database.ref(`${DB_PATHS.USERS}/${uid}`).once("value");
    const userData = userSnapshot.val() || {};

    // Nếu chưa có role => hiển thị form chọn chức vụ
    if (!userData.role) {
      hideAllManagementPages();
      hideStudentForm();
      hideElement("dashboard");
      hideElement("auth-container");
      showElement("role-selection");
    } else {
      // Nếu đã có role => hiện Dashboard
      hideElement("auth-container");
      hideElement("role-selection");
      setupDashboardUI(userData);
      showElement("dashboard");
      loadDashboard();
      initStudentsListener();
      initClassesListener();
      // Đợi load xong lớp để khởi tạo FullCalendar
      database.ref(DB_PATHS.CLASSES).once("value").then(() => {
        initFullCalendar();
      });
    }
  } else {
    hideAllManagementPages();
    toggleUI(false);
    showForm("login");
  }
});

// =========================== AUTH FUNCTIONS ===========================
// Đăng ký
function register() {
  const email = document.getElementById("register-email").value.trim();
  const password = document.getElementById("register-password").value.trim();
  const fullName = document.getElementById("register-name").value.trim();

  if (!email || !password || !fullName) {
    Swal.fire("Lỗi", "Vui lòng nhập đầy đủ email, mật khẩu và họ tên", "error"); // Sử dụng Swal.fire
    return;
  }

  auth.createUserWithEmailAndPassword(email, password)
    .then(async (credential) => {
      const user = credential.user;
      console.log("Auth user created:", user.uid);

      setTimeout(async () => {
        try {
          // Lưu thêm name và role vào Realtime Database
          await database.ref(`${DB_PATHS.USERS}/${user.uid}`).set({
            name: fullName,
            role: null
          });
          console.log("User data written to DB successfully for:", user.uid);

          // === XÓA HOẶC BỎ GHI CHÚ ĐOẠN NÀY ===
          // user.sendEmailVerification()
          //   .then(() => {
          //     Swal.fire({
          //       icon: 'success',
          //       title: 'Đăng ký thành công!',
          //       text: "Đã gửi email xác thực. Vui lòng kiểm tra hộp thư và bấm vào link xác thực trước khi đăng nhập.",
          //       timer: 4000,
          //       showConfirmButton: false
          //     });
          //     setTimeout(() => {
          //       auth.signOut();
          //     }, 1500);
          //   })
          //   .catch(error => {
          //     console.error("Lỗi khi gửi email xác thực:", error);
          //     Swal.fire({
          //       icon: 'error',
          //       title: 'Lỗi!',
          //       text: "Lỗi khi gửi email xác thực: " + error.message,
          //     });
          //   });
          // ======================================

          // Nếu không gửi email xác thực, chuyển hướng ngay sau khi đăng ký thành công
          Swal.fire({
            icon: 'success',
            title: 'Đăng ký thành công!',
            text: "Bạn có thể đăng nhập ngay bây giờ.",
            timer: 2000, // Thời gian hiển thị ngắn hơn
            showConfirmButton: false
          }).then(() => {
            auth.signOut(); // Đăng xuất để người dùng tự đăng nhập lại
          });

        } catch (dbError) {
          console.error("Lỗi khi lưu dữ liệu người dùng vào Realtime Database:", dbError);
          Swal.fire({
            icon: 'error',
            title: 'Lỗi!',
            text: "Lỗi lưu dữ liệu người dùng: " + dbError.message + ". Vui lòng thử lại.",
          });
          user.delete().catch(delErr => console.error("Error deleting auth user:", delErr));
        }
      }, 500); // Vẫn giữ độ trễ này để xử lý lỗi "Permission Denied" khi ghi DB
    })
    .catch(authError => {
      console.error("Lỗi đăng ký Auth:", authError);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi đăng ký!',
        text: authError.message,
      });
    });
}
// Đăng nhập
function login() {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();

  if (!email || !password) {
    alert("Vui lòng nhập email và mật khẩu");
    return;
  }

  auth.signInWithEmailAndPassword(email, password)
    .then(({ user }) => {
      // === XÓA HOẶC BỎ GHI CHÚ ĐOẠN NÀY ===
      // if (!user.emailVerified) {
      //   alert("Email của bạn chưa được xác thực. Vui lòng kiểm tra hộp thư và nhấn vào link xác thực.");
      //   auth.signOut();
      //   return;
      // }
      // ======================================
      // Sau khi xác thực, onAuthStateChanged sẽ xử lý hiển thị
    })
    .catch(error => Swal.fire("Lỗi", "Lỗi đăng nhập: " + error.message, "error")); // Sử dụng Swal.fire
}
// Quên mật khẩu
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

// Đăng xuất
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

// =========================== UI & NAVIGATION ===========================

// Ẩn tất cả các page
function hideAllManagementPages() {
  pages.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
}

// Hiển thị một phần tử theo ID
function showElement(id) {
  document.querySelectorAll(".management-page, #dashboard, #profile-page").forEach(el => {
    el.style.display = "none";
  });
  const el = document.getElementById(id);
  if (el) {
    el.style.display = "block";
  }
}

// Ẩn một phần tử theo ID
function hideElement(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = "none";
}

// Bật/tắt UI authentication vs dashboard
function toggleUI(isLoggedIn) {
  document.getElementById("auth-container").style.display = isLoggedIn ? "none" : "block";
  document.getElementById("dashboard").style.display = isLoggedIn ? "block" : "none";
}

// Chuyển form (login/register/forgot)
function showForm(formName) {
  const forms = document.querySelectorAll(".auth-form");
  forms.forEach(f => {
    f.classList.remove("active", "fade-in");
  });

  const target = document.getElementById(`${formName}-form`);
  if (target) {
    target.classList.add("active", "fade-in");
  }

  showElement("auth-container");
}

// Lưu “role” khi user chọn xong
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

  await database.ref(`${DB_PATHS.USERS}/${user.uid}/role`).set(selectedRole);
  const userSnapshot = await database.ref(`${DB_PATHS.USERS}/${user.uid}`).once("value");
  const userData = userSnapshot.val();

  hideElement("role-selection");
  setupDashboardUI(userData);
  showElement("dashboard");
}

// Thiết lập UI Dashboard (hiển thị tên hoặc chức vụ)
async function setupDashboardUI(userData) {
  const displayNameEl = document.getElementById("display-name");
  const displayHelloEl = document.getElementById("display-name-hello");

  if (userData.role) {
    displayNameEl.textContent = "";
    displayHelloEl.textContent = `${userData.role}`;
  } else {
    displayNameEl.textContent = userData.name || "";
    displayHelloEl.textContent = userData.name || "";
  }
}

// Quay lại Dashboard
function backToDashboard() {
  window.location.hash = "dashboard";
}

// Chuyển trang theo hash
async function showPageFromHash() {
  const hash = window.location.hash.slice(1);
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

  if (hash === "class-management")    initClassesListener();
  if (hash === "homework-management") await showHomeworkManagement();
  if (hash === "schedule-management") initFullCalendar();
}

window.addEventListener("hashchange", () => {
  if (!isAuthReady) return;
  showPageFromHash();
});
document.getElementById("class-form").addEventListener("submit", function (e) {
  e.preventDefault();
  saveClass();
});

// Khi load lần đầu nếu có hash và user đã xác thực
document.addEventListener("DOMContentLoaded", () => {
  const monthsSelect = document.getElementById('student-package-months');
  if (monthsSelect) {
    for (let i = 1; i <= 30; i++) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = `${i} tháng`;
      monthsSelect.appendChild(option);
    }
  }
  if (window.location.hash && isAuthReady && auth.currentUser) {
    showPageFromHash();
  }
});

// Sau khi login thành công
function loadDashboard() {
  toggleUI(true);
  if (!window.location.hash) {
    window.location.hash = "dashboard";
  } else {
    showPageFromHash();
  }
}

// ===================== Quản lý HỌC VIÊN =====================
/**
 * HÀM MỚI
 * Điền vào ô lựa chọn khóa học cho Tiếng Anh Phổ Thông
 */
function populateGeneralCourseDropdown() {
    const courseSelect = document.getElementById('general-english-course');
    courseSelect.innerHTML = '<option value="">-- Chọn khóa học --</option>'; // Reset
    generalEnglishCourses.forEach(course => {
        const option = document.createElement('option');
        option.value = course.name;
        option.textContent = `${course.name} (${course.sessions} buổi)`;
        courseSelect.appendChild(option);
    });
}


/**
 * HÀM CẬP NHẬT
 * Xử lý khi người dùng thay đổi loại gói chính.
 */
function handlePackageTypeChange() {
  const packageType = document.getElementById('student-package-type').value;
  const generalContainer = document.getElementById('general-english-options-container');
  const certificateContainer = document.getElementById('certificate-options-container');

  // Ẩn tất cả các container con trước
  generalContainer.style.display = 'none';
  certificateContainer.style.display = 'none';
  
  if (packageType === 'Lớp tiếng Anh phổ thông') {
    populateGeneralCourseDropdown(); // Điền dữ liệu trước khi hiển thị
    generalContainer.style.display = 'block';
  } else if (packageType === 'Luyện thi chứng chỉ') {
    certificateContainer.style.display = 'block';
  }
  
  // Reset các lựa chọn con khi ẩn đi để tránh nhầm lẫn
  document.getElementById('general-english-course').value = '';
  document.getElementById('student-certificate-type').value = '';
  document.getElementById('certificate-course-wrapper').style.display = 'none';
  document.getElementById('student-certificate-course').innerHTML = '';
  
  updateStudentPackageName();
}

/**
 * HÀM CẬP NHẬT
 * Điền vào ô lựa chọn khóa học dựa trên loại chứng chỉ đã chọn.
 */
// script.js

/**
 * HÀM MỚI
 * Xử lý chính khi người dùng chọn một khóa học cụ thể.
 * Sẽ quyết định xem có nên hiển thị phần chọn combo hay không.
 */
function handleCourseSelection() {
  const certType = document.getElementById('student-certificate-type').value;
  const courseSelect = document.getElementById('student-certificate-course');
  const comboContainer = document.getElementById('combo-selection-container');
  
  const selectedCourseName = courseSelect.value;
  const courseData = certificateCourses[certType]?.find(c => c.name === selectedCourseName);

  if (courseData && courseData.selectionLimit > 0) {
    // Đây là một khóa combo, hiển thị phần chọn
    generateComboCheckboxes(certType, courseData.selectionLimit);
    comboContainer.style.display = 'block';
  } else {
    // Khóa học bình thường, ẩn phần chọn combo
    comboContainer.style.display = 'none';
    document.getElementById('combo-checkboxes-list').innerHTML = ''; // Dọn dẹp
  }
  updateStudentPackageName(); // Cập nhật tên gói cuối cùng
}

/**
 * HÀM MỚI
 * Tạo ra danh sách các checkbox để chọn khóa con cho combo.
 */
function generateComboCheckboxes(certType, limit) {
  const listContainer = document.getElementById('combo-checkboxes-list');
  const title = document.getElementById('combo-selection-title');
  listContainer.innerHTML = ''; // Xóa các checkbox cũ
  title.textContent = `Vui lòng chọn đúng ${limit} khóa học:`;

  const baseCourses = certificateCourses[`${certType}_BASE`];
  if (!baseCourses) return;

  baseCourses.forEach(course => {
    const div = document.createElement('div');
    div.style.marginBottom = '5px';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = course.name;
    checkbox.dataset.sessions = course.sessions;
    checkbox.id = `combo-chk-${course.name.replace(/\s/g, '-')}`;
    
    checkbox.onchange = () => {
      const checkedBoxes = listContainer.querySelectorAll('input[type="checkbox"]:checked');
      if (checkedBoxes.length > limit) {
        alert(`Bạn chỉ được chọn tối đa ${limit} khóa học.`);
        checkbox.checked = false;
      }
      updateStudentPackageName();
    };

    const label = document.createElement('label');
    label.htmlFor = checkbox.id;
    label.textContent = ` ${course.name} (${course.sessions} buổi)`;
    
    div.appendChild(checkbox);
    div.appendChild(label);
    listContainer.appendChild(div);
  });
}

/**
 * HÀM CẬP NHẬT (thay thế populateCourseDropdown cũ)
 * Điền danh sách khóa học và gán sự kiện onchange mới.
 */
function populateCourseDropdown() {
  const certType = document.getElementById('student-certificate-type').value;
  const courseWrapper = document.getElementById('certificate-course-wrapper');
  const courseSelect = document.getElementById('student-certificate-course');
  // Quan trọng: Gán sự kiện onchange mới cho thẻ select này
  courseSelect.onchange = handleCourseSelection;

  courseSelect.innerHTML = '<option value="">-- Chọn khóa học --</option>';
  
  // Ẩn phần chọn combo khi thay đổi loại chứng chỉ
  document.getElementById('combo-selection-container').style.display = 'none';

  if (certType && certificateCourses[certType]) {
    certificateCourses[certType].forEach(course => {
      const option = document.createElement('option');
      option.value = course.name;
      // Hiển thị số buổi cho khóa lẻ, hoặc chỉ tên cho combo
      const displayText = course.sessions ? `${course.name} (${course.sessions} buổi)` : course.name;
      option.textContent = displayText;
      courseSelect.appendChild(option);
    });
    courseWrapper.style.display = 'block';
  } else {
    courseWrapper.style.display = 'none';
  }
  updateStudentPackageName();
}

/**
 * HÀM VIẾT LẠI HOÀN TOÀN (thay thế updateStudentPackageName cũ)
 * Tạo tên gói cuối cùng, có khả năng xử lý cả combo.
 */
// script.js

/**
 * HÀM VIẾT LẠI HOÀN TOÀN (thay thế updateStudentPackageName cũ)
 * Tạo tên gói cuối cùng VÀ cập nhật số buổi đã đóng.
 */
function updateStudentPackageName() {
  const packageType = document.getElementById('student-package-type').value;
  const packageInput = document.getElementById('student-package');
  const sessionsPaidInput = document.getElementById('student-sessions-paid');
  
  let finalPackageName = '';
  let totalSessions = 0;
  let selectedCourse = null;

  if (packageType === 'Lớp tiếng Anh phổ thông') {
    const courseName = document.getElementById('general-english-course').value;
    if (courseName) {
      selectedCourse = generalEnglishCourses.find(c => c.name === courseName);
    }
  } else if (packageType === 'Luyện thi chứng chỉ') {
    const certType = document.getElementById('student-certificate-type').value;
    const courseName = document.getElementById('student-certificate-course').value;
    if (certType && courseName) {
      selectedCourse = certificateCourses[certType]?.find(c => c.name === courseName);
    }
  }

  if (selectedCourse) {
    if (selectedCourse.selectionLimit > 0) { // Xử lý cho combo
      const checkedBoxes = document.querySelectorAll('#combo-checkboxes-list input:checked');
      const selectedNames = [];
      checkedBoxes.forEach(box => {
        totalSessions += parseInt(box.dataset.sessions, 10);
        selectedNames.push(box.value);
      });
      
      if (selectedNames.length > 0) {
        finalPackageName = `${selectedCourse.name} (${selectedNames.join(' + ')})`;
      } else {
        finalPackageName = selectedCourse.name;
      }
    } else { // Xử lý cho khóa lẻ
      totalSessions = selectedCourse.sessions;
      finalPackageName = selectedCourse.name;
    }
  }

  // Cập nhật tên gói và số buổi
  packageInput.value = totalSessions > 0 ? `${finalPackageName} (${totalSessions} buổi)` : finalPackageName;
  sessionsPaidInput.value = totalSessions;
}
// Render danh sách học viên (phân trang)
function renderStudentList(dataset) {
  // Không gán allStudentsData = dataset nữa!
  // const studentEntries = Object.entries(students);
  const studentEntries = Object.entries(dataset);
  totalStudentPages = Math.ceil(studentEntries.length / studentsPerPage);
  if (currentStudentPage > totalStudentPages) currentStudentPage = totalStudentPages;
  if (currentStudentPage < 1) currentStudentPage = 1;

  const startIndex = (currentStudentPage - 1) * studentsPerPage;
  const endIndex = startIndex + studentsPerPage;
  const currentPageStudents = studentEntries.slice(startIndex, endIndex);

  const tbody = document.getElementById("student-list");
  tbody.innerHTML = "";

  currentPageStudents.forEach(([id, st]) => {
     const classIds = st.classes ? Object.keys(st.classes) : [];
     const firstClassId = classIds.length > 0 ? classIds[0] : "";
    const query = document.getElementById("student-search")?.value.toLowerCase() || "";

    function highlight(text) {
      if (!query) return text;
      const regex = new RegExp(`(${query})`, "gi");
      return text.replace(regex, '<mark>$1</mark>');
    }

    const isHighlight = query && (
      (st.name  || "").toLowerCase().includes(query) ||
      (st.parent|| "").toLowerCase().includes(query) ||
      (st.parentPhone|| "").toLowerCase().includes(query) ||
      (st.parentJob|| "").toLowerCase().includes(query)
    );
  // Tạo nút "Buổi học"
  let btnBuoiHoc;
  if (!firstClassId) {
    btnBuoiHoc = `<button disabled>Buổi học</button>`;
  } else {
    btnBuoiHoc = `<button onclick="viewStudentSessions('${id}', '${firstClassId}')">Buổi học</button>`;
  }
  const attended = st.sessionsAttended || 0;
    const paid = st.sessionsPaid || 0;
    const isWarning = paid > 0 && attended >= paid;
    const warningClass = isWarning ? 'student-warning' : '';
    const row = `
      <tr class="${isHighlight ? 'highlight-row' : ''}">
        <td data-label="Họ và tên" class="${warningClass}">${highlight(st.name || "")}</td>
        <td data-label="Năm sinh">${st.dob || ""}</td>
        <td data-label="Bố/Mẹ">${highlight(st.parent || "")}</td>
        <td data-label="Số điện thoại">${highlight(st.parentPhone || "")}</td>
        <td data-label="Nghề nghiệp">${highlight(st.parentJob || "")}</td>
        <td data-label="Gói">${st.package || ""}</td>
        <td data-label="Đã học">${attended}</td>
        <td data-label="Đã đóng">${paid}</td>
        <td data-label="Hành động">
          <button onclick="editStudent('${id}')">Sửa</button>
          ${btnBuoiHoc}
          <button class="delete-btn" onclick="deleteStudent('${id}')">Xóa</button>
        </td>
      </tr>`;
  tbody.insertAdjacentHTML("beforeend", row);
  });

  updateStudentPaginationControls();
}

// Lọc học viên theo input tìm kiếm
function filterStudentsBySearch() {
  const query = document.getElementById("student-search").value.toLowerCase().trim();

  // Nếu query trống => reset trang và render lại toàn bộ allStudentsData gốc
  if (!query) {
    currentStudentPage = 1;
    renderStudentList(allStudentsData);
    return;
  }

  const filtered = {};
  Object.entries(allStudentsData).forEach(([id, st]) => {
    const name   = (st.name        || "").toLowerCase();
    const parent = (st.parent      || "").toLowerCase();
    const phone  = (st.parentPhone || "").toLowerCase();
    const job    = (st.parentJob   || "").toLowerCase();
    if (
      name.includes(query) ||
      parent.includes(query) ||
      phone.includes(query) ||
      job.includes(query)
    ) {
      filtered[id] = st;
    }
  });

  currentStudentPage = 1;
  renderStudentList(filtered);
}

// Cập nhật controls phân trang
function updateStudentPaginationControls() {
  document.getElementById("page-info").textContent = `Trang ${currentStudentPage} / ${totalStudentPages}`;
  const prevBtn = document.getElementById("prev-page");
  const nextBtn = document.getElementById("next-page");
  prevBtn.disabled = currentStudentPage <= 1;
  nextBtn.disabled = currentStudentPage >= totalStudentPages;
}

// Chuyển trang
function changeStudentPage(newPage) {
  if (newPage < 1 || newPage > totalStudentPages) return;
  currentStudentPage = newPage;
  renderStudentList(allStudentsData);
}

// Khởi tạo listener realtime cho học viên
function initStudentsListener() {
  showLoading(true);
  database.ref(DB_PATHS.STUDENTS).on("value", snapshot => {
    allStudentsData = snapshot.val() || {};
    const query = document.getElementById("student-search")?.value.trim().toLowerCase();
    if (query) filterStudentsBySearch();
    else renderStudentList(allStudentsData);
    showLoading(false);
  });
}

// Hiển thị form thêm/sửa học viên
function showStudentForm() {
  document.getElementById("student-form").reset();
  document.getElementById("student-index").value = "";
  document.getElementById("student-package").value = "";
  document.getElementById("student-parent-job-other").style.display = "none";

  document.getElementById("student-form-modal").style.display = "flex";
  document.getElementById("student-form-container").style.display = "block";

  const modalContent = document.querySelector("#student-form-modal .modal-content");
  modalContent.classList.remove("scale-up");
  modalContent.offsetHeight;
  modalContent.classList.add("scale-up");
}

// Ẩn form thêm/sửa học viên
function hideStudentForm() {
  document.getElementById("student-form-modal").style.display = "none";
  document.getElementById("student-form-container").style.display = "none";
}

// Lưu draft localStorage cho form học viên
const fields = ["student-name", "student-dob", "student-parent", "student-parent-phone", "student-package"];
fields.forEach(id => {
  const input = document.getElementById(id);
  input.addEventListener("input", () => {
    localStorage.setItem(id, input.value);
  });
  const draft = localStorage.getItem(id);
  if (draft) input.value = draft;
});

// Lưu hoặc cập nhật học viên
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
    dob: document.getElementById("student-dob").value.trim(),
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
      Swal.fire({ icon: 'success', title: 'Đã cập nhật học viên!', timer: 2000, showConfirmButton: false });
    } else {
      await database.ref(DB_PATHS.STUDENTS).push(studentData);
      Swal.fire({ icon: 'success', title: 'Đã thêm học viên!', timer: 2000, showConfirmButton: false });
    }
    fields.forEach(id => localStorage.removeItem(id));
    hideStudentForm();
  } catch (error) {
    alert("Lỗi lưu học viên: " + error.message);
  }
}

// Xóa học viên
async function deleteStudent(id) {
  if (!confirm("Bạn chắc chắn muốn xóa học viên này?")) return;
  try {
    await database.ref(`${DB_PATHS.STUDENTS}/${id}`).remove();
    Swal.fire({ icon: 'success', title: 'Đã xoá học viên!', timer: 2000, showConfirmButton: false });
    fields.forEach(id => localStorage.removeItem(id));
  } catch (error) {
    alert("Lỗi xóa học viên: " + error.message);
  }
}

// Chỉnh sửa học viên (đổ dữ liệu vào form)
function editStudent(id) {
  database.ref(`${DB_PATHS.STUDENTS}/${id}`).once("value").then(snapshot => {
    const st = snapshot.val();
    if (!st) return alert("Học viên không tồn tại!");

    document.getElementById("student-form").reset();
    handlePackageTypeChange();
    
    document.getElementById("student-index").value = id;
    document.getElementById("student-name").value = st.name || "";
    // ... (toàn bộ các dòng gán giá trị khác của bạn ở đây) ...
    document.getElementById("student-sessions-paid").value = st.sessionsPaid || 0;
    
    const packageStr = st.package || "";
    document.getElementById("student-package").value = packageStr;
    
    // Lưu ý: Do tính phức tạp, chúng tôi sẽ không tự động chọn lại các khóa con
    // trong combo khi sửa. Người dùng sẽ phải chọn lại nếu muốn thay đổi.
    // Logic dưới đây chỉ chọn các dropdown chính.
    
    const courseNameMatch = packageStr.match(/^(.*?)(?:\s\(.*\))?$/);
    if (!courseNameMatch) return;
    const courseName = courseNameMatch[1];

    if (generalEnglishCourses.some(c => c.name === courseName)) {
        document.getElementById('student-package-type').value = 'Lớp tiếng Anh phổ thông';
        handlePackageTypeChange();
        document.getElementById('general-english-course').value = courseName;
    } else {
        for (const certType in certificateCourses) {
            if (certificateCourses[certType]?.some(c => c.name === courseName)) {
                document.getElementById('student-package-type').value = 'Luyện thi chứng chỉ';
                handlePackageTypeChange();
                document.getElementById('student-certificate-type').value = certType;
                populateCourseDropdown();
                document.getElementById('student-certificate-course').value = courseName;
                // Không cố gắng check các ô con của combo
                break;
            }
        }
    }

    document.getElementById("student-form-title").textContent = "Chỉnh sửa học viên";
    document.getElementById("student-form-modal").style.display = "flex";
    document.getElementById("student-form-container").style.display = "block";
  }).catch(err => alert("Lỗi tải học viên: " + err.message));
}
// Hiển thị hoặc ẩn ô “Nhập nghề nghiệp khác”
function parentJobChange(value) {
  document.getElementById("student-parent-job-other").style.display = (value === "Khác") ? "inline-block" : "none";
}

// ===================== Quản lý LỚP HỌC =====================

// Render danh sách lớp
function renderClassList(classes) {
  const tbody = document.getElementById("class-list");
  if (!tbody) {
    console.warn("class-list element not found");
    return;
  }
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

    // Hover để hiển thị preview lịch cố định
    tr.addEventListener("mouseenter", () => {
      showSchedulePreview(cls.fixedSchedule);
    });
    tr.addEventListener("mouseleave", () => {
      clearSchedulePreview();
    });

    tbody.appendChild(tr);
  });
}

// Chỉnh sửa lớp (đổ dữ liệu vào form)
async function editClass(id) {
   // 1. Mở overlay + container
   document.getElementById("class-form-modal").style.display = "flex";
   document.getElementById("class-form-container").style.display = "block";

   // 2. Đổi tiêu đề sang “Chỉnh sửa lớp học”
   document.getElementById("class-form-title").textContent = "Chỉnh sửa lớp học";
  try {
    // 3.1. Lấy dữ liệu lớp
    const snapshot = await database.ref(`${DB_PATHS.CLASSES}/${id}`).once("value");
    const cls = snapshot.val();
    if (!cls) {
      alert("Lớp học không tồn tại!");
      return;
    }

    // Điền thông tin chung
    document.getElementById("class-index").value = id;
    document.getElementById("class-name").value = cls.name || "";
    document.getElementById("class-teacher").value = cls.teacher || "";

    // 3.2. Cập nhật dropdown chọn học viên (đảm bảo allStudentsData đã có giá trị)
    await updateStudentOptionsForClassForm();

    // 3.3. Đổ danh sách học viên đã có sẵn trong lớp
    currentClassStudents = cls.students ? Object.keys(cls.students) : [];
    renderClassStudentList(currentClassStudents);

    // 3.4. Lịch cố định
    fillFixedScheduleForm(cls.fixedSchedule);
    renderFixedScheduleDisplay();

    setupScheduleInputsListener();
  } catch (err) {
    alert("Lỗi tải lớp học: " + err.message);
  }
 }


// Hiển thị form tạo lớp
async function showClassForm() {
  currentClassStudents = [];
  document.getElementById("class-form-title").textContent = "Tạo lớp học mới";
  document.getElementById("class-form").reset();
  document.getElementById("class-index").value = "";

  renderClassStudentList([]);
  await updateStudentOptionsForClassForm();

  fillFixedScheduleForm(null);
  renderFixedScheduleDisplay();
  setupScheduleInputsListener();

  document.getElementById("class-form-modal").style.display = "flex";
  document.getElementById("class-form-container").style.display = "block";
  const modalContent = document.querySelector("#class-form-modal .modal-content");
  modalContent.classList.remove("scale-up");
  modalContent.offsetHeight;
  modalContent.classList.add("scale-up");
}

// Ẩn form lớp học
function hideClassForm() {
  document.getElementById("class-form-modal").style.display = "none";
  document.getElementById("class-form-container").style.display = "none";
}

// Cập nhật dropdown chọn học viên khi tạo/sửa lớp
function updateStudentOptionsForClassForm() {
  return database.ref(DB_PATHS.STUDENTS).once("value").then(snapshot => {
    allStudentsData = snapshot.val() || {};

    const datalist = document.getElementById("class-add-student-datalist");
    datalist.innerHTML = ""; 
    Object.entries(allStudentsData).forEach(([id, st]) => {
      const option = document.createElement("option");
      option.value = st.name || "(Không rõ tên)";
      option.dataset.id = id; // lưu luôn studentId vào data-id để dùng sau
      datalist.appendChild(option);
    });
  });
}
/**
 * Lọc các option trong <select id="class-add-student"> dựa vào nội dung ô #class-add-student-search.
 * Mỗi lần gõ, hàm này sẽ lấy toàn bộ allStudentsData, tìm tên học sinh có chứa từ khóa, rồi rebuild <option>.
 */
function filterClassStudentOptions() {
  const query = document.getElementById("class-add-student-search").value.toLowerCase();
  const datalist = document.getElementById("class-add-student-datalist");

  if (query.length > 0) {
    datalist.style.display = "block";
  } else {
    datalist.style.display = "none";
  }

  datalist.innerHTML = "";
  Object.entries(allStudentsData).forEach(([id, st]) => {
    if ((st.name || "").toLowerCase().includes(query)) {
      const option = document.createElement("option");
      option.value = st.name;
      option.dataset.id = id;
      datalist.appendChild(option);
    }
  });
}
// Thêm học viên vào danh sách class
function addStudentToClass() {
  const input = document.getElementById("class-add-student-search");
  const chosenName = input.value;
  // Tìm studentId từ tên trong allStudentsData
  let studentId = "";
  Object.entries(allStudentsData).forEach(([id, st]) => {
    if (st.name === chosenName) {
      studentId = id;
    }
  });
  if (!studentId) {
    return alert("Vui lòng chọn chính xác tên học viên từ danh sách gợi ý!");
  }
  if (currentClassStudents.includes(studentId)) {
    return alert("Học viên đã có trong lớp!");
  }
  currentClassStudents.push(studentId);
  renderClassStudentList(currentClassStudents);
  input.value = "";        // xóa hết ô search sau khi thêm
  filterClassStudentOptions(); // reset datalist về tất cả
}

// Render danh sách học viên hiện có trong class
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
    btnRemove.textContent = "×";
    btnRemove.className = "remove-btn";
    btnRemove.onclick = () => {
      currentClassStudents = currentClassStudents.filter(sid => sid !== id);
      renderClassStudentList(currentClassStudents);
    };

    li.appendChild(btnRemove);
    ul.appendChild(li);
  });
}

// Lưu hoặc cập nhật lớp học
let isSavingClass = false;
// script.js

// HÃY THAY THẾ TOÀN BỘ HÀM saveClass() CŨ BẰNG HÀM MỚI NÀY

async function saveClass() {
  if (isSavingClass) return;
  isSavingClass = true;
  const user = auth.currentUser;
  if (!user) {
    alert("Vui lòng đăng nhập để thêm hoặc sửa lớp học!");
    showForm("login");
    toggleUI(false);
    isSavingClass = false; // Nhớ reset cờ
    return;
  }

  // Lấy dữ liệu từ form
  const name = document.getElementById("class-name").value.trim();
  const teacher = document.getElementById("class-teacher").value.trim();
  const startDate = document.getElementById("class-start-date").value;
  const fixedSchedule = getFixedScheduleFromForm();
  const id = document.getElementById("class-index").value;
  const nowTimestamp = firebase.database.ServerValue.TIMESTAMP;

  if (!name || !teacher || !startDate) {
    Swal.fire("Lỗi", "Vui lòng điền đầy đủ thông tin lớp học.", "error");
    isSavingClass = false; // Nhớ reset cờ
    return;
  }

  if (!validateFixedSchedule()) {
    isSavingClass = false; // Nhớ reset cờ
    return;
  }

  try {
    if (!id) {
      // === TẠO LỚP MỚI ===
      const newClassRef = database.ref(DB_PATHS.CLASSES).push();
      const newClassId = newClassRef.key;

      const newClassData = {
        name,
        teacher,
        students: {}, // Khởi tạo object students rỗng
        fixedSchedule,
        startDate,
        createdAt: nowTimestamp,
        updatedAt: nowTimestamp
      };

      // =================================================================
      // THAY ĐỔI Ở ĐÂY: Lấy thêm Tên và Gói đăng ký của học viên
      // =================================================================
      currentClassStudents.forEach(studentId => {
        const studentInfo = allStudentsData[studentId]; // Tra cứu thông tin học viên
        if (studentInfo) {
          newClassData.students[studentId] = {
            enrolledAt: nowTimestamp,
            studentName: studentInfo.name || '(Không rõ tên)',
            packageName: studentInfo.package || '(Chưa có gói)'
          };
        }
      });
      // =================================================================

      await newClassRef.set(newClassData);

      // Ghi vào từng học viên (phần này không cần thay đổi)
      await Promise.all(currentClassStudents.map(studentId =>
        database.ref(`students/${studentId}/classes/${newClassId}`).set({ enrolledAt: nowTimestamp })
      ));

      Swal.fire({ icon: 'success', title: 'Đã thêm lớp học!', timer: 2000, showConfirmButton: false });
    } else {
      // === CẬP NHẬT LỚP CŨ ===
      const clsSnap = await database.ref(`${DB_PATHS.CLASSES}/${id}`).once("value");
      const clsData = clsSnap.val() || { students: {} };

      const updatedClassData = {
        name,
        teacher,
        students: {}, // Khởi tạo object students rỗng
        fixedSchedule,
        updatedAt: nowTimestamp
      };

      if (startDate) updatedClassData.startDate = startDate;

      // =================================================================
      // THAY ĐỔI Ở ĐÂY: Lấy thêm Tên và Gói đăng ký của học viên
      // =================================================================
      currentClassStudents.forEach(studentId => {
        const studentInfo = allStudentsData[studentId]; // Tra cứu thông tin học viên
        // Giữ lại ngày đăng ký ban đầu nếu đã có
        const enrolledAt = clsData.students?.[studentId]?.enrolledAt || nowTimestamp; 
        
        if (studentInfo) {
          updatedClassData.students[studentId] = {
            enrolledAt: enrolledAt,
            studentName: studentInfo.name || '(Không rõ tên)',
            packageName: studentInfo.package || '(Chưa có gói)'
          };
        }
      });
      // =================================================================

      await database.ref(`${DB_PATHS.CLASSES}/${id}`).update(updatedClassData);

      // Cập nhật lại thông tin lớp học trong từng học viên
      await Promise.all(currentClassStudents.map(studentId =>
        database.ref(`students/${studentId}/classes/${id}`).set({ enrolledAt: updatedClassData.students[studentId].enrolledAt })
      ));

      Swal.fire({ icon: 'success', title: 'Đã cập nhật lớp học!', timer: 2000, showConfirmButton: false });
    }

    hideClassForm();
  } catch (error) {
    console.error("Lỗi khi lưu lớp học:", error);
    Swal.fire("Lỗi", error.message, "error");
  }
  isSavingClass = false;
}
// Xóa lớp học
async function deleteClass(id) {
  if (!confirm("Bạn chắc chắn muốn xóa lớp học này?")) return;
  try {
    await database.ref(`${DB_PATHS.CLASSES}/${id}`).remove();
    Swal.fire({ icon: 'success', title: 'Đã xóa lớp học!', timer: 2000, showConfirmButton: false });
  } catch (error) {
    alert("Lỗi xóa lớp học: " + error.message);
  }
}

// Lấy lịch cố định từ form
function getFixedScheduleFromForm() {
  const schedule = {};
  const dayCheckboxes = document.querySelectorAll("input[name='schedule-day']:checked");

  dayCheckboxes.forEach(checkbox => {
    const day = checkbox.value; // ví dụ: "Tuesday"
    const dayKey = checkbox.id.split("-")[1]; // "mon", "tue", ...
    const timeInput = document.getElementById(`time-${dayKey}`);
    const time = timeInput?.value;

    if (time) {
      schedule[day] = time; // ví dụ: { Tuesday: "16:00" }
    }
  });

  return schedule;
}
// Điền form với lịch cố định có sẵn
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
  renderFixedScheduleDisplay();
}
// Thiết lập sự kiện change cho các ô checkbox/time trong form lớp
function setupScheduleInputsListener() {
  const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  days.forEach(day => {
    const cb = document.getElementById(`schedule-${day}`);
    const ti = document.getElementById(`time-${day}`);
    if (cb) cb.addEventListener("change", renderFixedScheduleDisplay);
    if (ti) ti.addEventListener("change", renderFixedScheduleDisplay);
  });
}

// Hiển thị danh sách lịch cố định bên dưới form
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
// ----------------------------------------------------------------------------
// 1. Hàm sinh N buổi sắp tới (sliding window) từ fixedSchedule và enrolledAt
// ----------------------------------------------------------------------------
function generateSessionDates(startDateStr, scheduleArray, numberOfWeeks = 12) {
  const sessions = [];
  const startDate = new Date(startDateStr);
  const dayNameToNumber = {
    "Sunday": 0, "Monday": 1, "Tuesday": 2,
    "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6
  };

  for (let week = 0; week < numberOfWeeks; week++) {
    scheduleArray.forEach(({ day, time }) => {
      const sessionDate = new Date(startDate); // startDate gốc
      const targetDay = dayNameToNumber[day];

      // Tìm ngày đầu tiên có 'day' trong tuần kể từ startDate
      const startDay = sessionDate.getDay();
      let daysToAdd = targetDay - startDay;
      if (daysToAdd < 0) daysToAdd += 7;

      // Cộng thêm số tuần
      daysToAdd += week * 7;
      sessionDate.setDate(sessionDate.getDate() + daysToAdd);

      // Chỉ thêm nếu ngày >= startDate gốc
      if (sessionDate >= startDate) {
        sessions.push({
          date: sessionDate.toISOString().split("T")[0],
          time: time
        });
      }
    });
  }

  return sessions;
}


// ----------------------------------------------------------------------------
// 2. Hàm cập nhật attendance (tích / hủy tích) và điều chỉnh sessionsAttended, sessionsPaid
// ----------------------------------------------------------------------------
async function updateAttendanceBySchedule(classId, studentId, dateStr, isAttending) {
  const attRef = database.ref(`attendance/${classId}/${studentId}/${dateStr}`);
  const studentRef = database.ref(`students/${studentId}`);

  try {
    // 2.1. Lấy trạng thái cũ (oldFlag) nếu đã lưu
    const snapOld = await attRef.once("value");
    const oldFlag = snapOld.exists() ? !!snapOld.val() : false;

    // 2.2. Tính delta để cộng/trừ sessionsAttended và sessionsPaid
    let deltaAtt = 0, deltaPaid = 0;
    if (!oldFlag && isAttending) {
      // Trước chưa tick, giờ tick -> +1 attended, -1 paid
      deltaAtt = +1;
      deltaPaid = -1;
    } else if (oldFlag && !isAttending) {
      // Trước đã tick, giờ bỏ tick -> -1 attended, +1 paid
      deltaAtt = -1;
      deltaPaid = +1;
    }
    // Nếu oldFlag == isAttending, không thay đổi counts

    // 2.3. Cập nhật node attendance cho ngày đó
    await attRef.set(isAttending);

    // 2.4. Nếu có delta, cập nhật students/{studentId}/sessionsAttended, sessionsPaid
    if (deltaAtt !== 0 || deltaPaid !== 0) {
      const stuSnap = await studentRef.once("value");
      const stuData = stuSnap.val() || {};
      const oldAttCount = parseInt(stuData.sessionsAttended) || 0;
      const oldPaidCount = parseInt(stuData.sessionsPaid) || 0;

      const newAttCount = oldAttCount + deltaAtt;
      const newPaidCount = oldPaidCount + deltaPaid;
      await studentRef.update({
        sessionsAttended: newAttCount,
        sessionsPaid: newPaidCount,
        updatedAt: firebase.database.ServerValue.TIMESTAMP
      });
    }

    console.log(`Cập nhật attendance ${classId}/${studentId}/${dateStr} → ${isAttending}`);
  } catch (err) {
    console.error("Lỗi updateAttendanceBySchedule:", err);
  }
}
function updateHomeworkScore(classId, studentId, score) {
  const today = new Date().toISOString().split("T")[0];
  const parsed = parseInt(score);

  if (isNaN(parsed) || parsed < 0 || parsed > 10) {
    alert("Điểm phải từ 0 đến 10");
    return;
  }

  database.ref(`homeworkScores/${classId}/${studentId}/${today}`).set(parsed)
    .then(() => {
      console.log(`✔ Điểm bài tập đã lưu: ${parsed}`);
    })
    .catch(err => {
      console.error("❌ Lỗi lưu điểm:", err);
    });
}

// ----------------------------------------------------------------------------
// 3. Hàm hiển thị modal "Buổi học" cho một học sinh trong một lớp
//    – Dựa hoàn toàn vào fixedSchedule (trong classes/{classId}/fixedSchedule)
//    – Mỗi lần mở modal, sinh numSessions ngày sắp tới, không cần lưu scheduleDates
// ----------------------------------------------------------------------------
async function viewStudentSessions(studentId, classId) {
  // 3.1. Lấy info lớp (để có fixedSchedule, tên lớp)
const listEl = document.getElementById("class-student-list");
if (listEl) listEl.style.display = "none";

const searchEl = document.getElementById("class-add-student-search");
if (searchEl) searchEl.style.display = "none";

const addBtnEl = document.getElementById("add-student-btn");
if (addBtnEl) addBtnEl.style.display = "none";
  const clsSnap = await database.ref(`classes/${classId}`).once("value");
  const clsData = clsSnap.val();
  if (!clsData) {
    return alert("Lớp không tồn tại!");
  }

  // 3.2. Kiểm tra học sinh đã được add chưa
  const enrolledObj = clsData.students && clsData.students[studentId];
  if (!enrolledObj || !enrolledObj.enrolledAt) {
    return alert("Học sinh chưa được thêm vào lớp này!");
  }
  const enrolledAt = enrolledObj.enrolledAt;
  const fixedSchedule = clsData.fixedSchedule || {};

  // 3.3. Sinh N buổi sắp tới (ví dụ 30 buổi)
  const NUM_FUTURE = 30;
  const sessionDates = generateFutureSessionDates(fixedSchedule, enrolledAt, NUM_FUTURE);

  // 3.4. Lấy attendance hiện có của học sinh
  const attSnap = await database.ref(`attendance/${classId}/${studentId}`).once("value");
  const attendanceData = attSnap.val() || {};
  // attendanceData có dạng: { "2025-06-07": true, "2025-06-11": false, … }

  // 3.5. Xóa nội dung cũ trong slider
  const sliderEl = document.getElementById("sessions-slider");
  if (!sliderEl) {
    console.warn("Không tìm thấy #sessions-slider trong DOM!");
    return;
  }
  sliderEl.innerHTML = "";
  // 3.6. Tạo các thẻ session-item và checkbox
  sessionDates.forEach(dateStr => {
    const container = document.createElement("div");
    container.className = "session-item";
    // Nếu attendanceData[dateStr] === true thì đã điểm danh → thêm class attended
    if (attendanceData[dateStr] === true) {
      container.classList.add("attended");
    }

    // Format ngày sang "DD/MM/YYYY - HH:mm"
    const parts = dateStr.split("-");
    // Tìm ra tên thứ (tiếng Anh) để lấy giờ từ fixedSchedule
    const dayName = new Date(dateStr).toLocaleDateString("en-US", { weekday: "long" });
    const timeStr = fixedSchedule[dayName] || ""; 
    const txtDate = document.createElement("p");
    txtDate.textContent = `${parts[2]}/${parts[1]}/${parts[0]} - ${timeStr}`;
    container.appendChild(txtDate);

    // Checkbox: nếu attendanceData[dateStr] === true → checked
    const chk = document.createElement("input");
    chk.type = "checkbox";
    chk.checked = attendanceData[dateStr] === true;
    chk.dataset.date = dateStr;
    chk.addEventListener("change", () => {
      const isChecked = chk.checked;
      updateAttendanceBySchedule(classId, studentId, dateStr, isChecked);
      if (isChecked) container.classList.add("attended");
      else container.classList.remove("attended");
    });
    container.appendChild(chk);

    sliderEl.appendChild(container);
  });

  // 3.7. Hiển thị tên học sinh và tên lớp lên modal
  const stuSnap = await database.ref(`students/${studentId}`).once("value");
  const stuData = stuSnap.val() || {};
  document.getElementById("student-sessions-name").textContent = stuData.name || "(Không rõ)";
  document.getElementById("student-sessions-class").textContent = clsData.name || "(Không rõ)";

  // 3.8. Hiển thị modal
  const modal = document.getElementById("student-sessions-modal");
  modal.style.display = "flex";
  const modalContent = document.querySelector("#student-sessions-modal .modal-content");
  modalContent.classList.remove("scale-up");
  // Force reflow để animation scale-up chạy lại
  void modalContent.offsetWidth;
  modalContent.classList.add("scale-up");
  //wrap & remove
  const addWrapper = document.getElementById("class-add-wrapper");
if (addWrapper) {
  addWrapper.remove(); // xoá luôn phần thêm học viên và danh sách
}

}

// ----------------------------------------------------------------------------
// 4. Hàm đóng modal
// ----------------------------------------------------------------------------
function hideStudentSessions() {
  const modal = document.getElementById("student-sessions-modal");
  if (modal) modal.style.display = "none";
}

// Vẽ preview lịch cố định (ô calendar nhỏ bên phải)
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
  days.forEach(day => {
    const cell = document.getElementById(idMap[day]);
    if (cell) cell.innerHTML = "";
  });
  if (!fixedSchedule || Object.keys(fixedSchedule).length === 0) return;
  Object.entries(fixedSchedule).forEach(([day, time]) => {
    const cell = document.getElementById(idMap[day]);
    if (cell) {
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

// Kiểm tra tính hợp lệ trước khi lưu lịch cố định
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

// Hiển thị preview khi hover vào từng lớp
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

// Xóa preview
function clearSchedulePreview() {
  const ul = document.getElementById("schedule-preview-list");
  ul.innerHTML = "<li>Di chuột vào lớp để xem lịch học cố định.</li>";
}

// Xem thông tin đầy đủ của một lớp khi click “Xem info”
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

// Khởi tạo listener realtime cho lớp
function initClassesListener() {
  database.ref(DB_PATHS.CLASSES).on("value", snapshot => {
    const classes = snapshot.val() || {};
    allClassesData = classes;
    renderClassList(classes);
    clearSchedulePreview();
  });
}

// ===================== Quản lý Lịch học (FullCalendar) =====================

// Xây dựng mảng sự kiện hàng tháng cho FullCalendar :contentReference[oaicite:2]{index=2}
function buildEventsArray(year, month) {
  const events = [];
  const monthIndex = month - 1;
  const lastDayOfMonth = new Date(year, monthIndex + 1, 0);

  // Dùng để so sánh ngày theo yyyy-mm-dd
  function toDateString(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
  Object.values(allClassesData).forEach(cls => {
    const teacherName = cls.teacher || "(Chưa có tên GV)";
    const fixed = cls.fixedSchedule || {};
    const startDateStr = cls.startDate;
    const startDate = startDateStr ? new Date(startDateStr) : null;

    Object.entries(fixed).forEach(([weekdayEng, timeStr]) => {
      const weekdayMap = {
        Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
        Thursday: 4, Friday: 5, Saturday: 6
      };
      const targetWeekday = weekdayMap[weekdayEng];
      if (targetWeekday === undefined) return;

      for (let d = 1; d <= lastDayOfMonth.getDate(); d++) {
        const dt = new Date(year, monthIndex, d);
        dt.setHours(0, 0, 0, 0);

        // ✅ Sửa TẠI ĐÂY: so sánh ngày theo chuỗi yyyy-mm-dd
        if (startDate && toDateString(dt) < toDateString(startDate)) {
          continue;
        }

        if (dt.getDay() === targetWeekday) {
          const [hh, mm] = timeStr.split(":").map(Number);
          const startDateTime = new Date(year, monthIndex, d, hh, mm);
          const endDateTime = new Date(startDateTime.getTime() + 90 * 60 * 1000);

          function toISOStringNoTZ(date) {
            const yyyy = date.getFullYear();
            const mm2 = (date.getMonth() + 1).toString().padStart(2, "0");
            const dd2 = date.getDate().toString().padStart(2, "0");
            const hh2 = date.getHours().toString().padStart(2, "0");
            const min2 = date.getMinutes().toString().padStart(2, "0");
            return `${yyyy}-${mm2}-${dd2}T${hh2}:${min2}:00`;
          }

          events.push({
            title: teacherName,
            start: toISOStringNoTZ(startDateTime),
            end: toISOStringNoTZ(endDateTime),
            allDay: false,
            backgroundColor: "#0066cc",
            borderColor: "#0066cc",
            textColor: "#fff"
          });
        }
      }
    });
  });

  console.log(`>>> buildEventsArray(${year},${month}) =>`, events);
  return events;
}
// Khởi tạo FullCalendar cho trang Lịch học :contentReference[oaicite:3]{index=3}
function initFullCalendar() {
  const today = new Date();

  // Mini Calendar (month view)
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

  // Weekly Calendar (timeGridWeek)
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

// Khi chuyển hash sang #schedule-management, render lại calendar :contentReference[oaicite:4]{index=4}
window.addEventListener("hashchange", () => {
  if (!isAuthReady) return;
  showPageFromHash();
  if (window.location.hash.slice(1) === "schedule-management" && calendarWeekly) {
    calendarWeekly.render();
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const evts = buildEventsArray(year, month);
    calendarWeekly.removeAllEvents();
    calendarWeekly.addEventSource(evts);
    calendarMini?.refetchEvents?.();
  }
});
//              QUẢN LÝ BÀI TẬP VỀ NHÀ          //
/**
 * Hàm này khôi phục lại giao diện danh sách lớp và ẩn modal điểm danh.
 * Đây là trạng thái xem mặc định của trang Quản lý bài tập.
 */
function showClassListAndHideModal() {
  // 1. Ẩn modal overlay của bảng điểm danh
  const modal = document.getElementById("homework-modal-overlay");
  if (modal) {
    modal.style.display = "none";
  }

  // 2. Hiển thị lại các thành phần của danh sách lớp
  const container = document.getElementById("homework-class-container");
  if (container) {
    container.style.display = "block"; // hoặc 'flex' tùy vào layout của bạn
  }

  const list = document.getElementById("homework-class-list");
  if (list) {
    list.style.display = "block"; // QUAN TRỌNG NHẤT: Hiển thị lại danh sách
  }
}
/**
 * Tạo ra một danh sách các buổi học "cuốn chiếu".
 * Bắt đầu từ ngày khai giảng của lớp và kết thúc vào một ngày trong tương lai
 * tính từ thời điểm hiện tại.
 * @param {object} fixedSchedule - Lịch học cố định (vd: { Monday: "18:00", ...})
 * @param {string} startDateStr - Ngày lớp học bắt đầu (vd: "2025-06-03")
 * @param {number} monthsInFuture - Cần tạo lịch cho bao nhiêu tháng trong tương lai.
 * @returns {Array} - Mảng các buổi học.
 */
function generateRollingSessions(fixedSchedule, startDateStr, monthsInFuture = 3) {
  const sessions = [];
  const dayNameToNumber = {
    "Sunday": 0, "Monday": 1, "Tuesday": 2, "Wednesday": 3,
    "Thursday": 4, "Friday": 5, "Saturday": 6
  };

  const scheduleArray = Object.entries(fixedSchedule).map(([day, time]) => ({
    dayNumber: dayNameToNumber[day],
    time,
  }));

  // Ngày bắt đầu tính toán là ngày khai giảng của lớp
  let cursorDate = new Date(startDateStr);
  
  // Ngày kết thúc là `monthsInFuture` tháng tính từ HÔM NAY
  let endDate = new Date();
  endDate.setMonth(endDate.getMonth() + monthsInFuture);

  // Vòng lặp sẽ chạy cho đến khi ngày tính toán vượt qua ngày kết thúc
  while (cursorDate <= endDate) {
    scheduleArray.forEach(({ dayNumber, time }) => {
      // Chỉ thêm buổi học nếu nó nằm trong tuần đang xét
      if (cursorDate.getDay() === dayNumber) {
        const dateStr = cursorDate.toISOString().split("T")[0];
        // Kiểm tra để đảm bảo không thêm trùng lặp
        if (!sessions.some(s => s.date === dateStr)) {
          sessions.push({ date: dateStr, time });
        }
      }
    });

    // Di chuyển con trỏ đến ngày tiếp theo
    cursorDate.setDate(cursorDate.getDate() + 1);
  }

  sessions.sort((a, b) => a.date.localeCompare(b.date));
  return sessions;
}
async function showHomeworkManagement() {
  const classListEl = document.getElementById("homework-class-list");
  const tableBody = document.getElementById("attendance-table-body");

  classListEl.innerHTML = "";
  if (tableBody) {
      tableBody.innerHTML = "";
  }
 // document.getElementById("homework-attendance-container").style.display = "none";

  const snapshot = await database.ref(DB_PATHS.CLASSES).once("value");
  const classes = snapshot.val() || {};

  Object.entries(classes).forEach(([classId, cls]) => {
    const li = document.createElement("li");
    li.textContent = cls.name || "Không tên";
   li.onclick = () => {
  console.log("Bạn đã click vào classId:", classId);
  renderHomeworkAttendanceTable(classId);
};
    classListEl.appendChild(li);
  });
  showClassListAndHideModal();
}

function generateNextNSessions(fixedSchedule, startDateStr, count = 30) {
  const sessions = [];
  const dayNameToNumber = {
    "Sunday": 0, "Monday": 1, "Tuesday": 2,
    "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6
  };

  const scheduleArray = Object.entries(fixedSchedule).map(([day, time]) => ({
    dayNumber: dayNameToNumber[day],
    time,
  }));

  let currentDate = new Date(startDateStr);
  while (sessions.length < count) {
    scheduleArray.forEach(({ dayNumber, time }) => {
      const tempDate = new Date(currentDate);
      const currentDay = tempDate.getDay();
      let daysToAdd = (dayNumber - currentDay + 7) % 7;
      const sessionDate = new Date(tempDate.setDate(tempDate.getDate() + daysToAdd));
      const dateStr = sessionDate.toISOString().split("T")[0];
      if (!sessions.some(s => s.date === dateStr)) {
        sessions.push({ date: dateStr, time });
      }
    });
    currentDate.setDate(currentDate.getDate() + 7);
  }

  sessions.sort((a, b) => a.date.localeCompare(b.date));
  return sessions.slice(0, count);
}
function showHomeworkModal(className) {
  document.getElementById("homework-modal-title").textContent = `Bảng điểm danh – ${className}`;
  document.getElementById("homework-modal-overlay").style.display = "flex";
}
function hideHomeworkModal() {
  showClassListAndHideModal();
}
function scrollBySessions(direction) {
  const scrollContainer = document.getElementById("homework-scroll-container");
  const step = 120 * 5; // 5 cột
  scrollContainer.scrollLeft += direction * step;
}
// script.js

async function renderHomeworkAttendanceTable(classId) {
  const classSnap = await database.ref(`classes/${classId}`).once("value");
  const cls = classSnap.val();
  if (!cls) return alert("Lớp không tồn tại");

  const students = cls.students || {};
  const fixedSchedule = cls.fixedSchedule || {};
  const startDate = cls.startDate || new Date().toISOString().split("T")[0];
  const sessions = generateRollingSessions(fixedSchedule, startDate, 3);
  // Lấy dữ liệu học viên, điểm danh và điểm bài tập
  const studentSnap = await database.ref("students").once("value");
  const allStudents = studentSnap.val() || {};
  const attSnap = await database.ref(`attendance/${classId}`).once("value");
  const attendance = attSnap.val() || {};
  const scoreSnap = await database.ref(`homeworkScores/${classId}`).once("value");
  const scores = scoreSnap.val() || {};

  // Render bảng
  const tableHeadRow = document.getElementById("homework-table-head");
  const tableBody = document.getElementById("attendance-table-body");
  const scrollContainer = document.getElementById("homework-scroll-container");

  let headerHTML = `<th style="min-width: 180px; position: sticky; left: 0; background-color: #f3f6fb; z-index: 1;">Họ tên học viên</th>`;
sessions.forEach((s) => {
  const d = new Date(s.date);
  const label = `${d.getDate()}/${d.getMonth() + 1}`;
  headerHTML += `<th style="min-width: 120px;">${label}</th>`; // Nối chuỗi trong biến
});
tableHeadRow.innerHTML = headerHTML;
  Object.keys(students).forEach(studentId => {
    const student = allStudents[studentId];
    if (!student) return;
 const attended = student.sessionsAttended || 0;
    const paid = student.sessionsPaid || 0;
    const isWarning = paid > 0 && attended >= paid;
    const row = document.createElement("tr");
    const nameCell = document.createElement("td");
    nameCell.className = isWarning ? 'student-warning' : '';
    nameCell.textContent = student.name || "(Không rõ tên)";
    // CSS để giữ cột tên học viên cố định khi cuộn ngang
    nameCell.style.position = "sticky";
    nameCell.style.left = "0";
    nameCell.style.backgroundColor = "#fff"; // Màu nền để không bị nội dung khác đè lên
    nameCell.style.zIndex = "1";
    row.appendChild(nameCell);

    sessions.forEach((session) => {
      const dateStr = session.date;
      const checked = attendance?.[studentId]?.[dateStr] === true;
      const score = scores?.[studentId]?.[dateStr] ?? "";

      const td = document.createElement("td");
      td.style.minWidth = "120px";
      td.innerHTML = `
        <input type="checkbox"
               onchange="toggleAttendance('${classId}', '${studentId}', '${dateStr}', this.checked)"
               ${checked ? "checked" : ""} />
        <select onchange="updateHomeworkScore('${classId}', '${studentId}', '${dateStr}', this.value)">
          <option value="">Chưa làm</option>
          ${[...Array(11).keys()].map(i =>
            `<option value="${i}" ${score == i ? "selected" : ""}>${i}</option>`
          ).join("")}
        </select>
      `;
      row.appendChild(td);
    });

    tableBody.appendChild(row);
  });

  // Ẩn danh sách lớp, hiện bảng modal
  document.getElementById("homework-class-container").style.display = "none";
  document.getElementById("homework-class-list").style.display = "none";
  showHomeworkModal(cls.name || "Không rõ tên lớp");

  // =================================================================
  // PHẦN LOGIC MỚI: TỰ ĐỘNG CUỘN ĐẾN BUỔI HỌC GẦN NHẤT
  // =================================================================
  setTimeout(() => {
    // 1. Lấy ngày hôm nay (chỉ tính ngày, bỏ qua giờ) để so sánh
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 2. Tìm index của buổi học đầu tiên (Buổi T) tính từ hôm nay trở đi
    const closestIndex = sessions.findIndex(s => new Date(s.date) >= today);

    // Nếu không tìm thấy buổi nào trong tương lai, thì cuộn đến cuối
    if (closestIndex === -1) {
        scrollContainer.scrollLeft = scrollContainer.scrollWidth;
        return;
    }

    // 3. Tính toán index của cột đầu tiên cần hiển thị (T-2)
    //    Dùng Math.max để đảm bảo không bị số âm nếu T là 1 trong 2 buổi đầu tiên
    const visibleStartIndex = Math.max(0, closestIndex - 2);

    // 4. Lấy chiều rộng của một cột ngày tháng (cột thứ 2 trong a)
    //    (cột đầu tiên là tên học viên)
    const firstDateColumn = tableHeadRow.children[1];
    if (!firstDateColumn) return; // Thoát nếu không có cột nào

    const columnWidth = firstDateColumn.offsetWidth;

    // 5. Tính toán vị trí cần cuộn đến và thực thi
    const scrollPosition = visibleStartIndex * columnWidth;
    scrollContainer.scrollLeft = scrollPosition;

  }, 0); // Dùng setTimeout(..., 0) để đảm bảo trình duyệt đã render xong bảng
}
// script.js

/**
 * HÀM NÂNG CẤP: Cập nhật trạng thái điểm danh và tăng/giảm số buổi đã học
 */
function toggleAttendance(classId, studentId, dateStr, isChecked) {
  // Cập nhật trạng thái điểm danh (như cũ)
  database.ref(`attendance/${classId}/${studentId}/${dateStr}`).set(isChecked);

  // Cập nhật số buổi đã học của học viên
  const studentSessionsRef = database.ref(`students/${studentId}/sessionsAttended`);

  // Sử dụng transaction để đảm bảo an toàn dữ liệu
  studentSessionsRef.transaction((currentSessions) => {
    const currentVal = currentSessions || 0;
    if (isChecked) {
      // Nếu tick chọn, tăng lên 1
      return currentVal + 1;
    } else {
      // Nếu bỏ tick, giảm đi 1 (đảm bảo không nhỏ hơn 0)
      return Math.max(0, currentVal - 1);
    }
  });
}

function updateHomeworkScore(classId, studentId, dateStr, value) {
  if (value === "") {
    database.ref(`homeworkScores/${classId}/${studentId}/${dateStr}`).remove();
  } else {
    database.ref(`homeworkScores/${classId}/${studentId}/${dateStr}`).set(parseInt(value));
  }
}
// Render danh sách lớp trong Quản lý bài tập
/* function renderHomeworkClassList() {
  const container = document.getElementById("homework-class-list");
  container.innerHTML = "";

  database.ref(DB_PATHS.CLASSES).once("value").then(snapshot => {
    const classes = snapshot.val() || {};

    for (const classId in classes) {
      const cls = classes[classId];
      const li = document.createElement("li");
      li.textContent = cls.name;

      li.onclick = () => {
        document.getElementById("homework-class-container").style.display = "none";
        document.getElementById("homework-student-list").style.display = "block";
        document.getElementById("homework-attendance-container").style.display = "block";

        renderHomeworkStudentListForClass(classId);
        renderHomeworkTableForClass(classId, cls);
      };

      container.appendChild(li);
    }
  });
} */
// Quay lại danh sách lớp
function backToHomeworkClasses() {
  showClassListAndHideModal();
}
// Render danh sách học viên trong lớp đã chọn
let selectedHomeworkClassId = null;
let selectedHomeworkStudentId = null;
async function renderHomeworkStudentList(classId) {
  document.getElementById("homework-class-container").style.display = "none";
  const ul = document.getElementById("homework-student-list");
  ul.innerHTML = "";
  const cls = allClassesData[classId];
  if (!cls || !cls.students) {
    alert("Lớp này chưa có học viên!");
    backToHomeworkClasses();
    return;
  }
  Object.keys(cls.students).forEach(studentId => {
    const st = allStudentsData[studentId];
    const name = st ? st.name : "(Không rõ tên)";
    const li = document.createElement("li");
    li.textContent = name;
    li.style.cursor = "pointer";
    li.onclick = () => {
      selectedHomeworkStudentId = studentId;
      renderHomeworkSessions(classId, studentId);
    };
    ul.appendChild(li);
  });
  document.getElementById("homework-student-container").style.display = "block";
}

// Quay lại danh sách học viên
function backToHomeworkStudents() {
  document.getElementById("homework-session-container").style.display = "none";
  document.getElementById("homework-student-container").style.display = "block";
  selectedHomeworkStudentId = null;
}

// Render bảng session (ngày) kèm checkbox
async function renderHomeworkSessions(classId, studentId) {
  console.log("renderHomeworkSessions called with:", classId, studentId);
  document.getElementById("homework-student-container").style.display = "none";
  const container = document.getElementById("homework-session-list");
  container.innerHTML = "";

  // Lấy thông tin cls để xác định ngày học (dựa vào fixedSchedule + createdAt)
  const clsSnapshot = await database.ref(`${DB_PATHS.CLASSES}/${classId}`).once("value");
  const cls = clsSnapshot.val();
  console.log("Class data:", cls);
  if (!cls) return;

  const fixedSchedule = cls.fixedSchedule || {};
   console.log("fixedSchedule:", fixedSchedule);
  const activeWeekdays = Object.keys(fixedSchedule).map(day => {
    const weekdayMap = {
      Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
      Thursday: 4, Friday: 5, Saturday: 6
    };
    return weekdayMap[day];
  });
console.log("activeWeekdays:", activeWeekdays);
  // Tìm danh sách ngày trong tháng hiện tại (hoặc kể từ ngày tạo)
  const sessionDates = [];
  // Tính ngày bắt đầu = max(hôm nay 00:00, createdAt 00:00)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const enrollDate = cls.createdAt ? new Date(cls.createdAt) : new Date();
  enrollDate.setHours(0, 0, 0, 0);
  const cursor = new Date(Math.max(today.getTime(), enrollDate.getTime()));
  // Muốn hiển thị 30 buổi kế tiếp
  const NUM_SESSIONS = 30;
  while (sessionDates.length < NUM_SESSIONS) {
    if (activeWeekdays.includes(cursor.getDay())) {
      const yyyy = cursor.getFullYear();
      const mm2 = String(cursor.getMonth() + 1).padStart(2, "0");
      const dd2 = String(cursor.getDate()).padStart(2, "0");
      sessionDates.push(`${yyyy}-${mm2}-${dd2}`);
    }
    cursor.setDate(cursor.getDate() + 1);
    console.log("sessionDates:", sessionDates);
  }

  // Lấy dữ liệu homework record từ DB (đồng thời hiển thị checkbox)
  const promises = sessionDates.map(date => {
    return database.ref(`${DB_PATHS.HOMEWORKS}/${classId}/${studentId}/${date}`).once("value")
      .then(snapshot => {
        return { date, record: snapshot.val() || {} };
      });
  });

  const results = await Promise.all(promises);

  // Render bảng
  results.forEach(({ date, record }) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${date}</td>
      <td style="text-align:center;">
        <input type="checkbox" data-date="${date}" data-type="attended"
               ${record.attended ? "checked" : ""}
               onchange="updateHomeworkRecord('${classId}','${studentId}','${date}','attended', this.checked)" />
      </td>
      <td style="text-align:center;">
        <input type="checkbox" data-date="${date}" data-type="completedHomework"
               ${record.completedHomework ? "checked" : ""}
               onchange="updateHomeworkRecord('${classId}','${studentId}','${date}','completedHomework', this.checked)" />
      </td>
    `;
    container.appendChild(tr);
  });

  document.getElementById("homework-session-container").style.display = "block";
}

// Update homework record khi tick/un-tick
async function updateHomeworkRecord(classId, studentId, dateStr, field, value) {
  try {
    const refPath = `${DB_PATHS.HOMEWORKS}/${classId}/${studentId}/${dateStr}`;
    const snapshot = await database.ref(refPath).once("value");
    const existing = snapshot.val() || {};

    const updated = {
      ...existing,
      [field]: value,
      updatedAt: firebase.database.ServerValue.TIMESTAMP
    };

    await database.ref(refPath).set(updated);
    console.log(`Đã cập nhật ${field}=${value} cho ${studentId} ngày ${dateStr}`);
  } catch (error) {
    console.error("Lỗi cập nhật homework record:", error);
    alert("Lỗi lưu dữ liệu. Vui lòng thử lại.");
  }
}

// ===================== Quản lý TÀI KHOẢN =====================

// (Nếu cần, bạn có thể thêm các hàm CRUD cho tài khoản ở đây)

// ===================== Trang Cá nhân =====================

// Khi click avatar mở trang cá nhân
function openProfile() {
   window.location.hash = "profile-page";
  hideAllManagementPages();
  const el = document.getElementById("profile-page");
  if (el) el.style.display = "block";

  const user = auth.currentUser;
  if (!user) return;

  database.ref(`${DB_PATHS.USERS}/${user.uid}`).once("value").then(snapshot => {
    const data = snapshot.val() || {};
    document.getElementById("profile-name").textContent = data.name || "";
    document.getElementById("profile-email").textContent = user.email || "";
    document.getElementById("profile-role").textContent = data.role || "";
    document.getElementById("avatar-img").src = data.avatarUrl || document.getElementById("avatar-img").src;
    document.getElementById("profile-avatar").src = data.avatarUrl || document.getElementById("profile-avatar").src;
  });
}
function updateStickyBackVisibility() {
  const hash = window.location.hash.slice(1);
  const stickyBtn = document.getElementById("sticky-back");
  const isMgmtPage = ["account-management","student-management","class-management","schedule-management","homework-management","profile-page"].includes(hash);
  if (stickyBtn) {
    stickyBtn.style.display = isMgmtPage ? "block" : "none";
  }
}


window.addEventListener("hashchange", updateStickyBackVisibility);
document.addEventListener("DOMContentLoaded", updateStickyBackVisibility);

// Upload avatar (commented out, bạn có thể bật nếu cần) :contentReference[oaicite:5]{index=5}

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
// Lọc danh sách lớp theo từ khóa nhập vào
function filterClassesBySearch() {
  const query = document.getElementById("class-search").value.toLowerCase().trim();

  // Lấy tbody chứa tất cả rows của class-list
  const tbody = document.getElementById("class-list");
  // Nếu query rỗng, render lại toàn bộ allClassesData
  if (!query) {
    renderClassList(allClassesData);
    return;
  }

  // Tạo object filteredClasses chỉ chứa lớp thỏa điều kiện
  const filtered = {};
  Object.entries(allClassesData).forEach(([id, cls]) => {
    const name = (cls.name || "").toLowerCase();
    const teacher = (cls.teacher || "").toLowerCase();
    if (name.includes(query) || teacher.includes(query)) {
      filtered[id] = cls;
    }
  });

  renderClassList(filtered);
}
// Lọc danh sách lớp trong Quản lý bài tập
function filterHomeworkClassesBySearch() {
  const query = document.getElementById("homework-class-search").value.toLowerCase().trim();

  if (!query) {
    renderHomeworkClassList(allClassesData);
    return;
  }
  // Chỉ render những lớp mà tên hoặc tên giáo viên thỏa điều kiện
  const filtered = {};
  Object.entries(allClassesData).forEach(([id, cls]) => {
    const name = (cls.name || "").toLowerCase();
    const teacher = (cls.teacher || "").toLowerCase();
    if (name.includes(query) || teacher.includes(query)) {
      filtered[id] = cls;
    }
  });

  renderHomeworkClassList(filtered);
}

// ===================== Loading =====================
function showLoading(show) {
  document.getElementById("loading").style.display = show ? "block" : "none";
}

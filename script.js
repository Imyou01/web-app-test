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
let allUsersData = {};
let currentUserData = null;
let currentClassStudents = [];
let calendarWeekly = null;
let calendarMini   = null;
let personnelListInitialized = false;

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
  //"homework-management",
  "personnel-management",
  "profile-page"
];
// script.js
const PERSONNEL_MANAGEMENT_ROLES = ["Admin", "Hội Đồng"];
const PAYROLL_STAFF_ROLES = ["Giáo Viên", "Trợ Giảng"];
// Thêm dữ liệu giá khóa học (ví dụ, bạn cần điều chỉnh cho đúng giá của mình)
const coursePrices = {
  // General English Courses (1 tháng = 8 buổi mặc định)
  "Tiếng Anh cho trẻ em (Mầm non)": 480000,
  "Tiếng Anh cho học sinh (TH+THCS+THPT)": 600000,
  "Luyện thi THPT Quốc Gia (điểm cao)": 840000,
  "Combo 3X: Tiếng Anh cho trẻ em (Mầm non)": 1440000, // 3 tháng
  "Combo 3X: Tiếng Anh cho học sinh (TH+THCS+THPT)": 1800000, // 3 tháng
  "Combo 3X: Luyện thi THPT Quốc Gia (điểm cao)": 2520000, // 3 tháng
  "Combo 6X: Tiếng Anh cho trẻ em (Mầm non)": 2880000, // 6 tháng
  "Combo 6X: Tiếng Anh cho học sinh (TH+THCS+THPT)": 3600000, // 6 tháng
  "Combo 6X: Luyện thi THPT Quốc Gia (điểm cao)": 5040000, // 6 tháng
  "Combo 12X: Tiếng Anh cho trẻ em (Mầm non)": 5760000, // 12 tháng
  "Combo 12X: Tiếng Anh cho học sinh (TH+THCS+THPT)": 7200000, // 12 tháng
  "Combo 12X: Luyện thi THPT Quốc Gia (điểm cao)": 10080000, // 12 tháng

  // IELTS
  "Giao tiếp cơ bản": 2500000,
  "Nền tảng IELTS 4.0": 4250000,
  "Khởi động IELTS 5.0": 6480000,
  "Bứt phá IELTS 6.5": 9500000,
  "Chinh phục IELTS 7.0+": 8800000,
  "Luyện đề IELTS 7.0+": 5000000,
  "Combo 2 khóa: Giao tiếp + IELTS 4.0": 6750000,
  "Combo 2 khóa: IELTS 4.0 + IELTS 5.0": 10750000,
  "Combo 2 khóa: IELTS 5.0 + IELTS 6.5": 15980000,
  "Combo 2 khóa: IELTS 6.5 + IELTS 7.0+": 18300000,
  "Combo 3 khóa: Giao tiếp + IELTS 4.0 + IELTS 5.0": 13250000,
  "Combo 3 khóa: IELTS 4.0 + IELTS 5.0 + IELTS 6.5": 20230000,
  "Combo 3 khóa: IELTS 5.0 + IELTS 6.5 + IELTS 7.0+": 24800000,
  "Combo 3 khóa: IELTS 6.5 + IELTS 7.0+ + Luyện đề 7.0+": 23300000,
  "Combo 4 khóa: Giao tiếp + IELTS 4.0 + IELTS 5.0 + IELTS 6.5": 22750000,
  "Combo 4 khóa: IELTS 4.0 + IELTS 5.0 + IELTS 6.5 + IELTS 7.0+": 29000000,
  "Combo 4 khóa: IELTS 5.0 + IELTS 6.5 + IELTS 7.0+ + Luyện đề 7.0+": 30000000,
  "Combo 5 khóa: Giao tiếp + IELTS 4.0 + IELTS 5.0 + IELTS 6.5 + IELTS 7.0+": 31500000,
  "Combo 5 khóa: IELTS 4.0 + IELTS 5.0 + IELTS 6.5 + IELTS 7.0+ + Luyện đề 7.0+": 34000000,

  // TOEIC
  "Nền tảng - TOEIC 450": 2800000,
  "TOEIC 600+": 4500000,
  "TOEIC 700+": 3500000,
  "TOEIC S + W (230)": 4700000,
  "TOEIC S + W (320)": 4700000,

  // HSK (và YCT sẽ lấy giá tương tự)
  "HSK1": 1440000,
  "HSK2": 1600000,
  "HSK3": 2900000,
  "HSK4": 7425000,
  "HSK5": 13080000,
  "HSKK sơ cấp": 840000,
  "HSKK trung cấp": 1840000,
  "HSKK cao cấp": 3620000,
  "Sơ cấp A1-A2": 5340000,
  "Trung cấp B1": 9800000,
  "Trung-cao cấp B2": 13000000,

  // Combo HSK/YCT (Giá sẽ được tính toán từ các khóa con được chọn)
  "Combo HSK + HSKK: 2 khoá bất kì": 0, // Giá sẽ được tính động
  "Combo HSK + HSKK: 3 khoá bất kì": 0,
  "Combo HSK + HSKK: 4 khoá bất kì": 0,
  "Combo HSK + HSKK: 5 khoá bất kì": 0,
  "Combo Giao Tiếp: 2 khoá bất kì": 0,
  "Combo Giao Tiếp: 3 khoá bất kì": 0,

  "YCT1": 0, // Giá này sẽ được tính là 90% của HSK1
  "YCT2": 0,
  "YCT3": 0,
  "YCT4": 0,
  "YCT5": 0,
  "YCTK sơ cấp": 0,
  "YCTK trung cấp": 0,
  "YCTK cao cấp": 0,
  "Sơ cấp Y1-Y2": 0,
  "Trung cấp Y1": 0,
  "Trung-cao cấp Y2": 0,

  "Combo YCT + YCTK: 2 khoá bất kì": 0,
  "Combo YCT + YCTK: 3 khoá bất kì": 0,
  "Combo YCT + YCTK: 4 khoá bất kì": 0,
  "Combo YCT + YCTK: 5 khoá bất kì": 0,
  "Combo Giao Tiếp YCT: 2 khoá bất kì": 0,
  "Combo Giao Tiếp YCT: 3 khoá bất kì": 0,
};

// Cập nhật tên các khóa YCT trong certificateCourses để khớp với `coursePrices`
// (Đảm bảo đoạn này có trong script.js của bạn)

// script.js
let currentPersonnelClassId = null;


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
    { name: "Nền tảng IELTS 4.0", sessions: 25 },
    { name: "Khởi động IELTS 5.0", sessions: 36 },
    { name: "Bứt phá IELTS 6.5", sessions: 50 },
    { name: "Chinh phục IELTS 7.0+", sessions: 40 },
    { name: "Luyện đề IELTS 7.0+", sessions: 18 },
    { name: "Combo 2 khóa: Giao tiếp + IELTS 4.0", sessions: 43 },
    { name: "Combo 2 khóa: IELTS 4.0 + IELTS 5.0", sessions: 61 },
    { name: "Combo 2 khóa: IELTS 5.0 + IELTS 6.5", sessions: 86 },
    { name: "Combo 2 khóa: IELTS 6.5 + IELTS 7.0+", sessions: 90 },
    { name: "Combo 3 khóa: Giao tiếp + IELTS 4.0 + IELTS 5.0", sessions: 79 },
    { name: "Combo 3 khóa: IELTS 4.0 + IELTS 5.0 + IELTS 6.5", sessions: 111 },
    { name: "Combo 3 khóa: IELTS 5.0 + IELTS 6.5 + IELTS 7.0+", sessions: 126 },
    { name: "Combo 3 khóa: IELTS 6.5 + IELTS 7.0+ + Luyện đề 7.0+", sessions: 108 },
    { name: "Combo 4 khóa: Giao tiếp + IELTS 4.0 + IELTS 5.0 + IELTS 6.5", sessions: 129 },
    { name: "Combo 4 khóa: IELTS 4.0 + IELTS 5.0 + IELTS 6.5 + IELTS 7.0+", sessions: 151 },
    { name: "Combo 4 khóa: IELTS 5.0 + IELTS 6.5 + IELTS 7.0+ + Luyện đề 7.0+", sessions: 144 },
    { name: "Combo 5 khóa: Giao tiếp + IELTS 4.0 + IELTS 5.0 + IELTS 6.5 + IELTS 7.0+", sessions: 169 },
    { name: "Combo 5 khóa: IELTS 4.0 + IELTS 5.0 + IELTS 6.5 + IELTS 7.0+ + Luyện đề 7.0+", sessions: 169 }
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

certificateCourses.YCT_BASE = certificateCourses.HSK_BASE.map(course => ({
    name: course.name.replace(/HSK/g, 'YCT').replace(/A1-A2/g, 'Y1-Y2').replace(/B1/g, 'Y1').replace(/B2/g, 'Y2'),
    sessions: course.sessions
}));

certificateCourses.YCT = certificateCourses.HSK.map(course => ({
    name: course.name.replace(/HSK/g, 'YCT').replace(/Giao Tiếp:/g, 'Giao Tiếp YCT:'),
    sessions: course.sessions, // sessions sẽ là undefined cho combos, điều này là bình thường
    selectionLimit: course.selectionLimit
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
    const uid = user.uid;
    const userSnapshot = await database.ref(`${DB_PATHS.USERS}/${uid}`).once("value");
    const userData = userSnapshot.val() || {};
    currentUserData = { uid: user.uid, ...userData }; // CẬP NHẬT BIẾN TOÀN CỤC currentUserData
    console.log(currentUserData)
    if (!userData.role) {
      hideAllManagementPages();
      hideStudentForm();
      hideElement("dashboard");
      hideElement("auth-container");
      showElement("role-selection");
    } else {
      hideElement("auth-container");
      hideElement("role-selection");
      setupDashboardUI(userData);
      showElement("dashboard");
      loadDashboard();
      initStudentsListener();
      initClassesListener(); // Listener cho lớp sẽ cập nhật allClassesData

      // Thiết lập listener cho allUsersData (tất cả người dùng)
// Listener này sẽ chạy mỗi khi dữ liệu users thay đổi
database.ref(DB_PATHS.USERS).on("value", (snapshot) => {
    allUsersData = snapshot.val() || {}; // CẬP NHẬT BIẾN TOÀN CỤC allUsersData

    // Nếu đang ở trang Quản lý tài khoản, render lại bảng
    if (window.location.hash.slice(1) === "account-management") {
        renderAccountList(); // Gọi renderAccountList để cập nhật bảng
    }
    // Có thể gọi renderStaffSalaryTable() và populatePersonnelClassList() ở đây
    // nếu bạn muốn chúng tự cập nhật khi dữ liệu user thay đổi
    // renderStaffSalaryTable(); 
    // populatePersonnelClassList(allClassesData); 
});
      // Khởi tạo FullCalendar sau khi đã có dữ liệu lớp
      database.ref(DB_PATHS.CLASSES).once("value").then(() => {
        initFullCalendar();
      });
    }
  } else {
    hideAllManagementPages();
    toggleUI(false);
    showForm("login");
    currentUserData = null; // Reset currentUserData khi đăng xuất
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
        role: null, // MẶC ĐỊNH LÀ NULL KHI ĐĂNG KÝ MỚI
        status: "pending" // (TÙY CHỌN)
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
    personnelListInitialized = false;
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
  // Trong showPageFromHash()
if (hash === "account-management") {
    const hasAccess = currentUserData && (currentUserData.role === "Admin" || currentUserData.role === "Hội Đồng");
    if (!hasAccess) {
        Swal.fire("Truy cập bị từ chối", "Bạn không có quyền truy cập chức năng này.", "warning");
        window.location.hash = "dashboard";
        return;
    }
    // BỎ DÒNG NÀY: await renderAccountList();
    renderAccountList(); // GỌI MỘT LẦN KHI VÀO TRANG, SAU ĐÓ LISTENER SẼ XỬ LÝ CẬP NHẬT
}
  if (hash === "class-management")    initClassesListener();
  if (hash === "homework-management") await showHomeworkManagement();
  if (hash === "schedule-management") initFullCalendar();
  if (hash === "personnel-management") {
    await initPersonnelManagement(); // Hàm này sẽ chịu trách nhiệm render
}
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
async function renderAccountList() {
    showLoading(true);
    const accountListEl = document.getElementById("account-list");
    accountListEl.innerHTML = "";

    const isAdminOrHoiDong = currentUserData && (currentUserData.role === "Admin" || currentUserData.role === "Hội Đồng");

    try {
        // XÓA DÒNG NÀY: const snapshot = await database.ref(DB_PATHS.USERS).once("value");
        // XÓA DÒNG NÀY: const users = snapshot.val() || {};
        const users = allUsersData; // SỬ DỤNG allUsersData TOÀN CỤC ĐÃ ĐƯỢC CẬP NHẬT BỞI LISTENER

        for (const uid in users) {
            const userData = users[uid];
            const row = document.createElement("tr");

            const userEmail = userData.email || "";
            const username = userEmail ? userEmail.split('@')[0] : "";

            let actionButtonHTML = '';
            if (isAdminOrHoiDong) {
                if (!userData.role) {
                    actionButtonHTML = `
                        <button onclick="showApproveAccountModal('${uid}')">Duyệt</button>
                        <button class="delete-btn" onclick="deleteAccount('${uid}')">Xóa</button>
                    `;
                } else {
                    actionButtonHTML = `
                        <button onclick="showApproveAccountModal('${uid}')">Sửa chức vụ</button>
                        <button class="delete-btn" onclick="deleteAccount('${uid}')">Xóa</button>
                    `;
                }
            } else {
                actionButtonHTML = 'Không có quyền';
            }

            row.innerHTML = `
                <td>${userEmail}</td>
                <td>${userData.name || ""}</td>
                <td>${username}</td>
                <td>${userData.role || "(Chưa duyệt)"}</td>
                <td>${userData.status || "Hoạt động"}</td>
                <td>${actionButtonHTML}</td>
            `;
            accountListEl.appendChild(row);
        }
    } catch (error) {
        console.error("Lỗi khi tải danh sách tài khoản:", error);
        Swal.fire("Lỗi", "Không thể tải danh sách tài khoản. Vui lòng thử lại.", "error");
    } finally {
        showLoading(false);
    }
}
let currentApprovingUid = null; // Biến toàn cục để lưu UID đang duyệt

async function showApproveAccountModal(uid) {
    currentApprovingUid = uid;
    showLoading(true);
    try {
        const userSnap = await database.ref(`${DB_PATHS.USERS}/${uid}`).once("value");
        const userData = userSnap.val();
        if (!userData) {
            Swal.fire("Lỗi", "Tài khoản không tồn tại.", "error");
            return;
        }

        document.getElementById("approve-account-name").textContent = userData.name || userData.email;
        document.getElementById("approve-account-role-select").value = userData.role || "";

        document.getElementById("approve-account-modal").style.display = "flex";
        const modalContent = document.querySelector("#approve-account-modal .modal-content");
        modalContent.classList.remove("scale-up");
        modalContent.offsetHeight;
        modalContent.classList.add("scale-up");

    } catch (error) {
        console.error("Lỗi khi mở modal duyệt tài khoản:", error);
        Swal.fire("Lỗi", "Không thể mở modal duyệt tài khoản: " + error.message, "error");
    } finally {
        showLoading(false);
    }
}

function hideApproveAccountModal() {
    document.getElementById("approve-account-modal").style.display = "none";
    currentApprovingUid = null;
}

async function approveAccount() {
    if (!currentApprovingUid) return;
    const selectedRole = document.getElementById("approve-account-role-select").value;

    if (!selectedRole) {
        Swal.fire("Lỗi", "Vui lòng chọn một chức vụ.", "warning");
        return;
    }

    showLoading(true);
    try {
        await database.ref(`${DB_PATHS.USERS}/${currentApprovingUid}`).update({
            role: selectedRole,
            status: "active", // Đặt trạng thái là active khi được duyệt
            updatedAt: firebase.database.ServerValue.TIMESTAMP
        });
        Swal.fire({ icon: 'success', title: 'Đã cập nhật chức vụ!', timer: 2000, showConfirmButton: false });
        hideApproveAccountModal();
        renderAccountList(); // Tải lại danh sách tài khoản
    } catch (error) {
        console.error("Lỗi duyệt tài khoản:", error);
        Swal.fire("Lỗi", "Không thể duyệt tài khoản: " + error.message, "error");
    } finally {
        showLoading(false);
    }
}

async function deleteAccount(uid) {
    if (!confirm("Bạn có chắc muốn xóa tài khoản này?")) return;
    showLoading(true);
    try {
        // Xóa tài khoản khỏi Realtime Database
        await database.ref(`${DB_PATHS.USERS}/${uid}`).remove();

        // Nếu người dùng đang tự xóa tài khoản của mình, đăng xuất họ
        if (auth.currentUser && auth.currentUser.uid === uid) {
            await auth.signOut(); // Đăng xuất người dùng
        } else {
            // Đối với admin xóa người khác, firebase auth không cho xóa user khác từ client
            // Cần một Cloud Function nếu muốn Admin xóa user Auth thực sự
            // Hiện tại, chỉ xóa data trên DB
            Swal.fire({ icon: 'success', title: 'Đã xóa dữ liệu tài khoản trên Database!', text: 'Lưu ý: Chỉ Admin hệ thống mới có thể xóa tài khoản Auth thực sự.', timer: 3000, showConfirmButton: false });
        }
        renderAccountList(); // Tải lại danh sách tài khoản
    } catch (error) {
        console.error("Lỗi xóa tài khoản:", error);
        Swal.fire("Lỗi", "Không thể xóa tài khoản: " + error.message, "error");
    } finally {
        showLoading(false);
    }
}
// ===================== Quản lý HỌC VIÊN =====================
function handleAgeChange() {
  const dobInput = document.getElementById('student-dob');
  const contactInfoContainer = document.getElementById('contact-info-container');
  const birthYear = parseInt(dobInput.value);
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;

  contactInfoContainer.innerHTML = ''; // Xóa nội dung cũ

  if (isNaN(birthYear) || birthYear === 0) {
    return;
  }

  if (age >= 18) {
    contactInfoContainer.innerHTML = `
      <label>Số điện thoại học viên (Không bắt buộc):<br />
        <input type="text" id="student-phone" placeholder="Số điện thoại của bạn" />
      </label><br />
    `;
    // Thêm logic gắn listener và load draft cho student-phone
    const studentPhoneInput = document.getElementById("student-phone");
    if (studentPhoneInput) {
      studentPhoneInput.addEventListener("input", () => {
        localStorage.setItem("student-phone", studentPhoneInput.value);
      });
      const draft = localStorage.getItem("student-phone");
      if (draft !== null && draft !== undefined) {
        studentPhoneInput.value = draft;
      }
    }
    document.getElementById("student-parent") && (document.getElementById("student-parent").value = "");
    document.getElementById("student-parent-phone") && (document.getElementById("student-parent-phone").value = "");
  } else {
    contactInfoContainer.innerHTML = `
      <label>Số điện thoại học viên (nếu có):<br />
        <input type="text" id="student-phone" placeholder="Số điện thoại của học viên" />
      </label><br />
      <label>Tên Bố/Mẹ (Không bắt buộc):<br />
        <input type="text" id="student-parent" placeholder="Tên bố hoặc mẹ" />
      </label><br />
      <label>Số điện thoại Phụ huynh (Không bắt buộc):<br />
        <input type="text" id="student-parent-phone" placeholder="Số điện thoại phụ huynh" />
      </label><br />
    `;
    // Thêm logic gắn listener và load draft cho cả 3 trường này
    const studentPhoneInput = document.getElementById("student-phone");
    if (studentPhoneInput) {
      studentPhoneInput.addEventListener("input", () => {
        localStorage.setItem("student-phone", studentPhoneInput.value);
      });
      const draft = localStorage.getItem("student-phone");
      if (draft !== null && draft !== undefined) {
        studentPhoneInput.value = draft;
      }
    }

    const studentParentInput = document.getElementById("student-parent");
    if (studentParentInput) {
      studentParentInput.addEventListener("input", () => {
        localStorage.setItem("student-parent", studentParentInput.value);
      });
      const draft = localStorage.getItem("student-parent");
      if (draft !== null && draft !== undefined) {
        studentParentInput.value = draft;
      }
    }

    const studentParentPhoneInput = document.getElementById("student-parent-phone");
    if (studentParentPhoneInput) {
      studentParentPhoneInput.addEventListener("input", () => {
        localStorage.setItem("student-parent-phone", studentParentPhoneInput.value);
      });
      const draft = localStorage.getItem("student-parent-phone");
      if (draft !== null && draft !== undefined) {
        studentParentPhoneInput.value = draft;
      }
    }
    document.getElementById("student-phone") && (document.getElementById("student-phone").value = "");
  }
}
async function showRenewPackageForm(studentId) {
  showLoading(true);
  try {
    const snapshot = await database.ref(`${DB_PATHS.STUDENTS}/${studentId}`).once("value");
    const st = snapshot.val();
    if (!st) {
      Swal.fire("Lỗi", "Học viên không tồn tại!", "error");
      showLoading(false);
      return;
    }

    document.getElementById("student-form").reset(); // Reset form trước
    document.getElementById("student-index").value = studentId; // Giữ ID học viên

    // Đặt tiêu đề cho biết đây là form gia hạn/thêm gói
    document.getElementById("student-form-title").textContent = "Gia hạn";

    // Ẩn các trường không liên quan đến gói mới
    // Bạn có thể thêm class CSS để ẩn nhanh hơn
    const fieldsToHide = [
        "student-name", "student-dob", "contact-info-container", 
        "student-address", "student-parent-job"
    ];
    fieldsToHide.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.parentElement.classList.add('form-field-hidden'); // Ẩn cả label và input
    });

    // Hiển thị các trường liên quan đến gói
    document.getElementById("student-package-type").value = ""; // Reset gói type
    document.getElementById("general-english-options-container").style.display = "none";
    document.getElementById("certificate-options-container").style.display = "none";
    document.getElementById("student-new-package-sessions").value = "0"; // Reset số buổi gói mới
    document.getElementById("student-package").value = ""; // Reset tên gói tự động
    document.getElementById("student-original-price").value = "0";
    document.getElementById("student-total-due").value = "0";
    document.getElementById("student-discount-percent").value = "0";
    document.getElementById("student-promotion-percent").value = "0";


    // Đổ thông tin số buổi còn lại hiện tại của học viên vào trường hiển thị
    const sessionsAttended = st.sessionsAttended || 0;
    const totalSessionsPaid = st.totalSessionsPaid || 0;
    document.getElementById("student-remaining-sessions-display").value = totalSessionsPaid - sessionsAttended;


    // Hiển thị modal
    document.getElementById("student-form-modal").style.display = "flex";
    document.getElementById("student-form-container").style.display = "block";
    const modalContent = document.querySelector("#student-form-modal .modal-content");
    modalContent.classList.remove("scale-up");
    modalContent.offsetHeight;
    modalContent.classList.add("scale-up");

  } catch (error) {
    console.error("Lỗi khi mở form gia hạn:", error);
    Swal.fire("Lỗi", "Không thể mở form gia hạn: " + error.message, "error");
  } finally {
    showLoading(false);
  }
}
function calculateFinalPrice() {
  const packageType = document.getElementById('student-package-type').value;
  const generalCourseSelect = document.getElementById('general-english-course');
  const certificateTypeSelect = document.getElementById('student-certificate-type');
  const certificateCourseSelect = document.getElementById('student-certificate-course');
  const discountPercentSelect = document.getElementById('student-discount-percent');
  const promotionPercentInput = document.getElementById('student-promotion-percent');
  const originalPriceInput = document.getElementById('student-original-price');
  const totalDueInput = document.getElementById('student-total-due');

  let basePrice = 0; // Đây sẽ là giá GỐC theo coursePrices
  let selectedCourseName = '';

  // 1. Xác định giá GỐC (basePrice)
  if (packageType === 'Lớp tiếng Anh phổ thông') {
    selectedCourseName = generalCourseSelect.value;
    const courseData = generalEnglishCourses.find(c => c.name === selectedCourseName);
    if (courseData) {
      basePrice = coursePrices[selectedCourseName] || 0; // Giá gốc của combo hoặc khóa lẻ
    }
  } else if (packageType === 'Luyện thi chứng chỉ') {
    selectedCourseName = certificateCourseSelect.value;
    const certType = certificateTypeSelect.value;
    const courseData = certificateCourses[certType]?.find(c => c.name === selectedCourseName);

    if (courseData && courseData.selectionLimit > 0) { // Đây là combo (HSK/YCT combo hoặc IELTS combo)
      const checkedBoxes = document.querySelectorAll('#combo-checkboxes-list input:checked');
      checkedBoxes.forEach(box => {
        basePrice += parseFloat(box.dataset.originalPrice || 0); // Cộng dồn giá GỐC của các khóa con
      });
    } else { // Đây là khóa lẻ trong chứng chỉ (IELTS, TOEIC, HSK lẻ, YCT lẻ)
      basePrice = coursePrices[selectedCourseName] || 0; // Giá gốc ban đầu
    }
  }

  originalPriceInput.value = Math.round(basePrice); // HIỂN THỊ GIÁ GỐC ĐÚNG TỪ coursePrices

  // 2. Tính TỔNG PHẦN TRĂM GIẢM GIÁ
  let totalDiscountPercentage = 0;

  // Áp dụng giảm giá cố định (chỉ cho các combo cụ thể, không có giảm giá mặc định cho khóa lẻ)
  if (packageType === 'Lớp tiếng Anh phổ thông') {
    if (selectedCourseName.includes("Combo")) {
        // Lấy % giảm giá của Combo (3X: 5%, 6X: 11%, 12X: 25%)
        if (selectedCourseName.includes("3X")) totalDiscountPercentage += 5;
        else if (selectedCourseName.includes("6X")) totalDiscountPercentage += 11;
        else if (selectedCourseName.includes("12X")) totalDiscountPercentage += 25;
    }
  } else if (packageType === 'Luyện thi chứng chỉ') {
    const certType = certificateTypeSelect.value;
    const courseData = certificateCourses[certType]?.find(c => c.name === selectedCourseName);

    // Kiểm tra xem có phải là combo hay không để áp dụng giảm giá combo
    if (courseData && courseData.selectionLimit > 0) { // Combo IELTS, HSK, YCT
        if (certType === 'IELTS') {
            if (selectedCourseName.includes('Combo 2 khóa')) totalDiscountPercentage += 20; // 20%
            else if (selectedCourseName.includes('Combo 3 khóa')) totalDiscountPercentage += 22; // 22%
            else if (selectedCourseName.includes('Combo 4 khóa')) totalDiscountPercentage += 25; // 25%
            else if (selectedCourseName.includes('Combo 5 khóa')) totalDiscountPercentage += 28; // 28%
        } else if (certType === 'HSK' || certType === 'YCT') {
            const discountLookup = {
                "Combo HSK + HSKK: 2 khoá bất kì": 5, "Combo YCT + YCTK: 2 khoá bất kì": 5,
                "Combo HSK + HSKK: 3 khoá bất kì": 8, "Combo YCT + YCTK: 3 khoá bất kì": 8,
                "Combo HSK + HSKK: 4 khoá bất kì": 12, "Combo YCT + YCTK: 4 khoá bất kì": 12,
                "Combo HSK + HSKK: 5 khoá bất kì": 15, "Combo YCT + YCTK: 5 khoá bất kì": 15,
                "Combo Giao Tiếp: 2 khoá bất kì": 10, "Combo Giao Tiếp YCT: 2 khoá bất kì": 10,
                "Combo Giao Tiếp: 3 khoá bất kì": 15, "Combo Giao Tiếp YCT: 3 khoá bất kì": 15,
            };
            totalDiscountPercentage += (discountLookup[selectedCourseName] || 0);
        }
    }
    
    // Thêm giảm giá 10% cho YCT riêng biệt (áp dụng cho cả khóa lẻ và combo YCT)
    if (certType === 'YCT') {
        totalDiscountPercentage += 10;
    }
  }

  // Cộng thêm mã giảm giá (5-100%)
  totalDiscountPercentage += parseFloat(discountPercentSelect.value) || 0;

  // Cộng thêm khuyến mại từ input (1-100%)
  totalDiscountPercentage += parseFloat(promotionPercentInput.value) || 0;

  // Giới hạn tổng phần trăm giảm giá không vượt quá 100%
  totalDiscountPercentage = Math.min(totalDiscountPercentage, 100);

  // 3. Tính Tổng tiền phải đóng
  let finalPrice = basePrice * (1 - totalDiscountPercentage / 100);

  totalDueInput.value = Math.round(finalPrice); // Hiển thị tổng tiền phải đóng (làm tròn)
}
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
  document.getElementById('combo-selection-container').style.display = 'none'; // Clear combo container
  document.getElementById('combo-checkboxes-list').innerHTML = ''; // Clear combo checkboxes
  
  updateStudentPackageName(); // Cập nhật tên gói, số buổi và sau đó tính giá
  calculateFinalPrice(); // MỚI: Gọi hàm này để cập nhật tất cả các trường giá
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
  updateStudentPackageName(); // Cập nhật tên gói cuối cùng và sessions paid
  calculateFinalPrice(); // MỚI: Gọi hàm này để cập nhật tất cả các trường giá
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

    // Lấy giá gốc của khóa con từ coursePrices
    let originalPriceForCheckbox = coursePrices[course.name] || 0;
    checkbox.dataset.originalPrice = originalPriceForCheckbox; // LƯU GIÁ GỐC BAN ĐẦU VÀO ĐÂY

    // Tính giá sau khi áp dụng 90% nếu là YCT_BASE (để dùng trong calculateFinalPrice)
    let priceAfterYCTDiscount = originalPriceForCheckbox;
    if (certType === 'YCT') { 
        const hskEquivalentName = course.name
                                  .replace(/YCT/g, 'HSK')
                                  .replace(/Y1-Y2/g, 'A1-A2')
                                  .replace(/Y1/g, 'B1')
                                  .replace(/Y2/g, 'B2');
        const hskBasePrice = coursePrices[hskEquivalentName] || 0;
        priceAfterYCTDiscount = hskBasePrice * 0.9; // 90% của giá HSK tương ứng
    }
    checkbox.dataset.price = priceAfterYCTDiscount; // Giá này sẽ được sử dụng để tính tổng tiền gốc của combo

    checkbox.id = `combo-chk-${course.name.replace(/\s/g, '-')}`;
    
    checkbox.onchange = () => {
      const checkedBoxes = listContainer.querySelectorAll('input[type="checkbox"]:checked');
      if (checkedBoxes.length > limit) {
        Swal.fire("Thông báo", `Bạn chỉ được chọn tối đa ${limit} khóa học.`, "warning");
        checkbox.checked = false;
      }
      updateStudentPackageName();
      calculateFinalPrice(); 
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
  courseSelect.onchange = handleCourseSelection; // Đảm bảo gọi handleCourseSelection

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
      option.dataset.price = coursePrices[course.name] || 0; // Thêm giá vào dataset
      option.dataset.sessions = course.sessions || 0; // Thêm số buổi vào dataset
      courseSelect.appendChild(option);
    });
    courseWrapper.style.display = 'block';
  } else {
    courseWrapper.style.display = 'none';
  }
  updateStudentPackageName();
  calculateFinalPrice(); // Gọi hàm này khi dropdown được điền lại
}

// updateStudentPackageName()
// updateStudentPackageName()
function updateStudentPackageName() {
  const packageType = document.getElementById('student-package-type').value;
  const packageInput = document.getElementById('student-package');
  const newPackageSessionsInput = document.getElementById('student-new-package-sessions'); // LẤY INPUT HIDDEN

  let finalPackageName = '';
  let totalSessionsOfNewPackage = 0; // Tổng số buổi của gói MỚI được chọn
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
        totalSessionsOfNewPackage += parseInt(box.dataset.sessions, 10);
        selectedNames.push(box.value);
      });

      if (selectedNames.length > 0) {
        finalPackageName = `${selectedCourse.name} (${selectedNames.join(' + ')})`;
      } else {
        finalPackageName = selectedCourse.name; // Nếu combo nhưng chưa chọn gì
      }
    } else { // Xử lý cho khóa lẻ
      totalSessionsOfNewPackage = selectedCourse.sessions;
      finalPackageName = selectedCourse.name;
    }
  }

  packageInput.value = totalSessionsOfNewPackage > 0 ? `${finalPackageName} (${totalSessionsOfNewPackage} buổi)` : finalPackageName;
  newPackageSessionsInput.value = totalSessionsOfNewPackage; // LƯU SỐ BUỔI CỦA GÓI MỚI VÀO INPUT HIDDEN

  calculateFinalPrice();
}
// Render danh sách học viên (phân trang)
function renderStudentList(dataset) {
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
      (st.name || "").toLowerCase().includes(query) ||
      (st.phone || "").toLowerCase().includes(query) ||
      (st.parentPhone || "").toLowerCase().includes(query) ||
      (st.parentJob || "").toLowerCase().includes(query) ||
      (st.package || "").toLowerCase().includes(query)
    );

    let displayPhone = '';
    const currentYear = new Date().getFullYear();
    const age = st.dob ? (currentYear - parseInt(st.dob)) : null;

    if (st.phone) {
      displayPhone = st.phone;
    } else if (age !== null && age < 18 && st.parentPhone) {
      displayPhone = st.parentPhone;
    } else if (age !== null && age >= 18 && st.phone === undefined) {
      displayPhone = '';
    } else {
      displayPhone = st.parentPhone || "";
    }

    let btnBuoiHoc;
    if (!firstClassId) {
      btnBuoiHoc = `<button disabled>Buổi học</button>`;
    } else {
      btnBuoiHoc = `<button onclick="viewStudentSessions('${id}', '${firstClassId}')">Buổi học</button>`;
    }

    const sessionsAttended = st.sessionsAttended || 0;
    const totalSessionsPaid = st.totalSessionsPaid || 0; // LẤY TỪ TRƯỜNG MỚI
    const remainingSessions = totalSessionsPaid - sessionsAttended;
     // --- LOGIC CẢNH BÁO MỚI ---
    let warningClass = '';
    if (remainingSessions <= 0) {
        warningClass = 'student-warning-critical'; // Mức đỏ
    } else if (remainingSessions <= 3) {
        warningClass = 'student-warning-low'; // Mức vàng
    }
    // --- KẾT THÚC LOGIC ---
    console.log(`Học viên: ${st.name}, Buổi còn lại: ${remainingSessions}, Class được gán: ${warningClass}`);
    const discount = st.discountPercent ? `${st.discountPercent}%` : '0%';
    const promotion = st.promotionPercent ? `${st.promotionPercent}%` : '0%';
    const totalDiscountPromo = (st.discountPercent || 0) + (st.promotionPercent || 0);
    const totalDiscountPromoText = totalDiscountPromo > 0 ? `${totalDiscountPromo}%` : '0%';

    const totalDue = (st.totalDue || 0).toLocaleString('vi-VN');

    const row = `
      <tr class="${isHighlight ? 'highlight-row' : ''}">
        <td data-label="Họ và tên" class="${warningClass}">${highlight(st.name || "")}</td>
        <td data-label="Năm sinh">${st.dob || ""}</td>
        <td data-label="Số điện thoại">${highlight(displayPhone)}</td>
        <td data-label="Gói đăng ký">${st.package || ""}</td>
        <td data-label="Mã giảm giá / Khuyến mại">${totalDiscountPromoText}</td>
        <td data-label="Tổng tiền phải đóng">${totalDue} VNĐ</td>
        <td data-label="Số buổi còn lại">${remainingSessions}</td>
        <td data-label="Hành động">
          <button onclick="editStudent('${id}')">Sửa</button>
          ${btnBuoiHoc}
          <button onclick="showRenewPackageForm('${id}')">Gia hạn</button>
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

  // Hiển thị lại các trường đã ẩn
  const fieldsToHide = [
      "student-name", "student-dob", "contact-info-container", 
      "student-address", "student-parent-job"
  ];
  fieldsToHide.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.parentElement.classList.remove('form-field-hidden'); // Đảm bảo hiển thị lại
  });
  // Đặt lại tiêu đề mặc định
  document.getElementById("student-form-title").textContent = "Tạo hồ sơ học viên mới";
}

// Lưu draft localStorage cho form học viên
const fields = ["student-name", "student-dob", "student-address", "student-package-type", 
                "general-english-course", "student-certificate-type", "student-certificate-course",
                "student-package", "student-sessions-attended", "student-sessions-paid",
                "student-discount-percent", "student-promotion-percent", 
                "student-original-price", "student-total-due", "student-parent-job"];

fields.forEach(id => {
  const input = document.getElementById(id);
  if (input) { // THÊM KIỂM TRA NULL Ở ĐÂY
    input.addEventListener("input", () => {
      localStorage.setItem(id, input.value);
    });
    // Tải draft khi DOMContentLoaded hoặc khi form được hiển thị
    const draft = localStorage.getItem(id);
    if (draft !== null && draft !== undefined) { // Kiểm tra draft có giá trị
      input.value = draft;
    }
  }
});

// Lưu hoặc cập nhật học viên
// Lưu hoặc cập nhật học viên
async function saveStudent() {
  const user = auth.currentUser;
  if (!user) {
    Swal.fire("Lỗi", "Vui lòng đăng nhập để thêm hoặc sửa học viên!", "error");
    showForm("login");
    toggleUI(false);
    return;
  }

  const id = document.getElementById("student-index").value;
  const name = document.getElementById("student-name").value.trim();
  const dob = document.getElementById("student-dob").value.trim();
  const address = document.getElementById("student-address").value.trim();

  const studentPhone = document.getElementById("student-phone") ? document.getElementById("student-phone").value.trim() : "";
  const parentName = document.getElementById("student-parent") ? document.getElementById("student-parent").value.trim() : "";
  const parentPhone = document.getElementById("student-parent-phone") ? document.getElementById("student-parent-phone").value.trim() : "";

  const parentJobSelect = document.getElementById("student-parent-job");
  const parentJobOtherInput = document.getElementById("student-parent-job-other");
  const parentJob = parentJobSelect.value === "Khác" ? parentJobOtherInput.value.trim() : parentJobSelect.value;

  const packageName = document.getElementById("student-package").value.trim();
  const newPackageSessions = parseInt(document.getElementById("student-new-package-sessions").value) || 0; // Lấy từ input hidden
  const discountPercent = parseInt(document.getElementById("student-discount-percent").value) || 0;
  const promotionPercent = parseInt(document.getElementById("student-promotion-percent").value) || 0;
  const originalPrice = parseInt(document.getElementById("student-original-price").value) || 0;
  const totalDue = parseInt(document.getElementById("student-total-due").value) || 0;

  let selectedComboCourses = null;
  const packageType = document.getElementById('student-package-type').value;
  const certType = document.getElementById('student-certificate-type').value;
  const selectedCourseNameFromForm = document.getElementById('student-certificate-course').value;

  if (packageType === 'Luyện thi chứng chỉ' && (certType === 'HSK' || certType === 'YCT') && selectedCourseNameFromForm) {
    const courseData = certificateCourses[certType]?.find(c => c.name === selectedCourseNameFromForm);
    if (courseData && courseData.selectionLimit > 0) {
      const checkedBoxes = document.querySelectorAll('#combo-checkboxes-list input[type="checkbox"]:checked');
      selectedComboCourses = Array.from(checkedBoxes).map(box => box.value);

      if (selectedComboCourses.length !== courseData.selectionLimit) {
        Swal.fire({
          icon: 'warning',
          title: 'Thiếu khóa học combo!',
          text: `Bạn đã chọn gói combo "${selectedCourseNameFromForm}" nhưng phải chọn đúng ${courseData.selectionLimit} khóa học con. Vui lòng kiểm tra lại.`,
          confirmButtonText: 'Đã hiểu'
        });
      }
    }
  }

  if (!name || !dob) {
    Swal.fire("Lỗi", "Vui lòng nhập đầy đủ Tên học viên và Năm sinh (có dấu *).", "error");
    return;
  }

  let currentSessionsAttended = 0;
  let currentTotalSessionsPaid = 0;
  if (id) {
    const existingStudentSnap = await database.ref(`${DB_PATHS.STUDENTS}/${id}`).once("value");
    const existingStudentData = existingStudentSnap.val();
    currentSessionsAttended = existingStudentData?.sessionsAttended || 0;
    currentTotalSessionsPaid = existingStudentData?.totalSessionsPaid || 0;
  }

  // Logic cộng dồn số buổi:
  // Nếu là tạo học viên mới (không có ID), totalSessionsPaid ban đầu là newPackageSessions.
  // Nếu là sửa học viên, hoặc là gia hạn gói, totalSessionsPaid sẽ được cộng dồn.
  // Quan trọng: Logic này cũng sẽ tính cả việc học viên đã mua một gói từ đầu.
  // Khi "Đăng ký/Gia hạn gói" được click, form sẽ được mở, user chọn gói mới, và sessionsPaid sẽ là số buổi của gói đó.
  // Khi saveStudent chạy, nó sẽ cộng số buổi của gói mới vào totalSessionsPaid hiện tại của học viên.
  let updatedTotalSessionsPaid = currentTotalSessionsPaid;
  if (document.getElementById("student-form-title").textContent === "Gia hạn") {
      updatedTotalSessionsPaid = currentTotalSessionsPaid + newPackageSessions;
  } else { // Nếu là tạo mới hoặc sửa thông tin cơ bản (không gia hạn)
      // Nếu form không phải là gia hạn, thì totalSessionsPaid được lấy từ input `student-new-package-sessions`
      // (Input này chỉ chứa số buổi của gói hiện tại mà người dùng đã chọn trên form,
      //  và khi lưu, nó sẽ trở thành tổng số buổi đã đóng nếu không có gói nào trước đó,
      //  hoặc là gói đầu tiên của học viên mới)
      updatedTotalSessionsPaid = newPackageSessions;
  }

  const studentData = {
    name: name,
    dob: dob,
    address: address,
    phone: studentPhone,
    parent: parentName,
    parentPhone: parentPhone,
    parentJob: parentJob,
    package: packageName,
    selectedComboCourses: selectedComboCourses,
    sessionsAttended: currentSessionsAttended, // Giữ nguyên, cập nhật qua điểm danh
    totalSessionsPaid: updatedTotalSessionsPaid, // TỔNG SỐ BUỔI ĐÃ ĐÓNG TỪ TRƯỚC VÀ HIỆN TẠI
    discountPercent: discountPercent,
    promotionPercent: promotionPercent,
    originalPrice: originalPrice,
    totalDue: totalDue,
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
    localStorage.removeItem("student-phone");
    localStorage.removeItem("student-parent");
    localStorage.removeItem("student-parent-phone");

    hideStudentForm();
  } catch (error) {
    Swal.fire("Lỗi", "Lỗi lưu học viên: " + error.message, "error");
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
// Chỉnh sửa học viên (đổ dữ liệu vào form)
// Chỉnh sửa học viên (đổ dữ liệu vào form)
async function editStudent(id) {
  showLoading(true);
  try {
    const snapshot = await database.ref(`${DB_PATHS.STUDENTS}/${id}`).once("value");
    const st = snapshot.val();
    if (!st) {
      Swal.fire("Lỗi", "Học viên không tồn tại!", "error");
      return;
    }

    document.getElementById("student-form").reset();
    document.getElementById("student-new-package-sessions").value = "0"; // Reset số buổi của gói mới khi sửa

    document.getElementById("student-index").value = id;
    document.getElementById("student-name").value = st.name || "";
    document.getElementById("student-dob").value = st.dob || "";
    document.getElementById("student-address").value = st.address || "";
    // Đổ số buổi còn lại (tổng số buổi đã đóng trừ đã điểm danh) vào ô hiển thị
    const sessionsAttended = st.sessionsAttended || 0;
    const totalSessionsPaid = st.totalSessionsPaid || 0;
    document.getElementById("student-remaining-sessions-display").value = totalSessionsPaid - sessionsAttended;

    document.getElementById("student-discount-percent").value = st.discountPercent || 0;
    document.getElementById("student-promotion-percent").value = st.promotionPercent || 0;
    document.getElementById("student-original-price").value = st.originalPrice || 0;
    document.getElementById("student-total-due").value = st.totalDue || 0;

    handleAgeChange();
    setTimeout(() => {
      if (st.dob) {
        const birthYear = parseInt(st.dob);
        const currentYear = new Date().getFullYear();
        const age = currentYear - birthYear;

        const studentPhoneInput = document.getElementById("student-phone");
        const studentParentInput = document.getElementById("student-parent");
        const studentParentPhoneInput = document.getElementById("student-parent-phone");

        if (age >= 18) {
          if (studentPhoneInput) studentPhoneInput.value = st.phone || "";
        } else {
          if (studentPhoneInput) studentPhoneInput.value = st.phone || "";
          if (studentParentInput) studentParentInput.value = st.parent || "";
          if (studentParentPhoneInput) studentParentPhoneInput.value = st.parentPhone || "";
        }
      }
    }, 0);

    const parentJobSelect = document.getElementById("student-parent-job");
    const parentJobOtherInput = document.getElementById("student-parent-job-other");
    if (st.parentJob && Array.from(parentJobSelect.options).some(option => option.value === st.parentJob)) {
      parentJobSelect.value = st.parentJob;
      parentJobOtherInput.style.display = "none";
      parentJobOtherInput.value = "";
    } else if (st.parentJob) {
      parentJobSelect.value = "Khác";
      parentJobOtherInput.style.display = "inline-block";
      parentJobOtherInput.value = st.parentJob;
    } else {
      parentJobSelect.value = "";
      parentJobOtherInput.style.display = "none";
      parentJobOtherInput.value = "";
    }
    parentJobChange(parentJobSelect.value);

    const packageTypeSelect = document.getElementById('student-package-type');
    const generalEnglishCourseSelect = document.getElementById('general-english-course');
    const certificateTypeSelect = document.getElementById('student-certificate-type');
    const certificateCourseSelect = document.getElementById('student-certificate-course');
    const comboSelectionContainer = document.getElementById('combo-selection-container');

    packageTypeSelect.value = '';
    generalEnglishCourseSelect.value = '';
    certificateTypeSelect.value = '';
    certificateCourseSelect.innerHTML = '';
    comboSelectionContainer.style.display = 'none';
    document.getElementById('combo-checkboxes-list').innerHTML = '';

    document.getElementById("student-package").value = st.package || "";

    let foundPackage = false;
    let selectedComboCoursesFromDB = st.selectedComboCourses;

    if (Array.isArray(selectedComboCoursesFromDB) && selectedComboCoursesFromDB.length > 0) {
      let detectedCertType = null;
      for (const key of ['HSK', 'YCT']) {
        if (certificateCourses[`${key}_BASE`]?.some(c => c.name === selectedComboCoursesFromDB[0])) {
          detectedCertType = key;
          break;
        }
      }

      if (detectedCertType) {
        packageTypeSelect.value = 'Luyện thi chứng chỉ';
        await handlePackageTypeChange();
        certificateTypeSelect.value = detectedCertType;
        await populateCourseDropdown();

        const comboCount = selectedComboCoursesFromDB.length;
        const firstSelectedCourse = selectedComboCoursesFromDB[0];

        const isGiaoTiepCombo = firstSelectedCourse.includes('Giao Tiếp') ||
          firstSelectedCourse.includes('Sơ cấp') ||
          firstSelectedCourse.includes('Trung cấp') ||
          firstSelectedCourse.includes('Y1-Y2');

        let comboCourseName = '';
        if (isGiaoTiepCombo) {
          comboCourseName = `Combo Giao Tiếp: ${comboCount} khoá bất kì`;
          if (detectedCertType === 'YCT') comboCourseName = `Combo Giao Tiếp YCT: ${comboCount} khoá bất kì`;
        } else {
          comboCourseName = `Combo ${detectedCertType} + ${detectedCertType}K: ${comboCount} khoá bất kì`;
        }

        if (Array.from(certificateCourseSelect.options).some(opt => opt.value === comboCourseName)) {
          certificateCourseSelect.value = comboCourseName;
        } else {
          console.warn(`Không tìm thấy option combo chính cho: ${comboCourseName}. Có thể sẽ về gói lẻ.`);
        }

        if (certificateCourseSelect.value === comboCourseName) {
          handleCourseSelection();
          foundPackage = true;

          setTimeout(() => {
            const checkboxes = document.querySelectorAll('#combo-checkboxes-list input[type="checkbox"]');
            checkboxes.forEach(chk => {
              if (selectedComboCoursesFromDB.includes(chk.value)) {
                chk.checked = true;
              }
            });
            updateStudentPackageName();
            calculateFinalPrice();
          }, 0);
        }
      }
    }

    if (!foundPackage) {
      for (const course of generalEnglishCourses) {
        if (st.package && st.package.includes(course.name)) {
          packageTypeSelect.value = 'Lớp tiếng Anh phổ thông';
          await handlePackageTypeChange();
          generalEnglishCourseSelect.value = course.name;
          foundPackage = true;
          break;
        }
      }

      if (!foundPackage) {
        for (const certTypeKey in certificateCourses) {
          if (certTypeKey.includes('_BASE')) continue;

          if (certificateCourses.hasOwnProperty(certTypeKey)) {
            for (const course of certificateCourses[certTypeKey]) {
              if (st.package && st.package.includes(course.name)) {
                packageTypeSelect.value = 'Luyện thi chứng chỉ';
                await handlePackageTypeChange();
                certificateTypeSelect.value = certTypeKey;
                await populateCourseDropdown();
                certificateCourseSelect.value = course.name;

                if (course.selectionLimit > 0) {
                  handleCourseSelection();
                }

                foundPackage = true;
                break;
              }
            }
          }
          if (foundPackage) break;
        }
      }
    }

    if (!foundPackage) {
      calculateFinalPrice();
      updateStudentPackageName();
    }

    document.getElementById("student-form-title").textContent = "Chỉnh sửa học viên";
    document.getElementById("student-form-modal").style.display = "flex";
    document.getElementById("student-form-container").style.display = "block";
  } catch (err) {
    console.error("Lỗi tải học viên:", err);
    Swal.fire("Lỗi", "Lỗi tải học viên: " + err.message, "error");
  } finally {
    showLoading(false);
    const modalContent = document.querySelector("#student-form-modal .modal-content");
    modalContent.classList.remove("scale-up");
    modalContent.offsetHeight;
    modalContent.classList.add("scale-up");
  }
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
        <button onclick="showClassAttendanceAndHomeworkTable('${id}')">Điểm Danh</button>
        <button onclick="editClass('${id}')">Sửa</button>
        <button class="delete-btn" onclick="deleteClass('${id}')">Xóa</button>
      </td>
    `;

    tr.addEventListener("mouseenter", () => {
      showSchedulePreview(cls.fixedSchedule);
    });
    tr.addEventListener("mouseleave", () => {
      clearSchedulePreview();
    });

    tbody.appendChild(tr);
  });
}
// Mảng chứa các role được phép làm giáo viên hoặc trợ giảng
const TEACHER_ROLES = ["Giáo Viên", "Trợ Giảng"];
const ASSISTANT_TEACHER_ROLES = ["Giáo Viên", "Trợ Giảng"];

/**
 * Điền vào ô lựa chọn giáo viên trong form lớp học
 */
async function populateTeacherDropdown() {
  const teacherSelect = document.getElementById("class-teacher");
  teacherSelect.innerHTML = '<option value="">-- Chọn giáo viên --</option>';

  try {
    const snapshot = await database.ref(DB_PATHS.USERS).once("value");
    allUsersData = snapshot.val() || {}; // CẬP NHẬT BIẾN TOÀN CỤC allUsersData

    Object.entries(allUsersData).forEach(([uid, userData]) => {
      if (userData.role && TEACHER_ROLES.includes(userData.role)) {
        const option = document.createElement("option");
        option.value = userData.name || userData.email;
        option.textContent = `${userData.name || userData.email} (${userData.role})`;
        option.dataset.uid = uid; // LƯU UID VÀO DATASET
        teacherSelect.appendChild(option);
      }
    });
  } catch (error) {
    console.error("Lỗi khi tải danh sách giáo viên:", error);
    Swal.fire("Lỗi", "Không thể tải danh sách giáo viên. Vui lòng thử lại.", "error");
  }
}
async function populateAssistantTeacherDropdown() {
    const assistantTeacherSelect = document.getElementById("class-assistant-teacher");
    assistantTeacherSelect.innerHTML = '<option value="">-- Không có trợ giảng --</option>';

    try {
        const snapshot = await database.ref(DB_PATHS.USERS).once("value");
        allUsersData = snapshot.val() || {}; // CẬP NHẬT BIẾN TOÀN CỤC allUsersData

        Object.entries(allUsersData).forEach(([uid, userData]) => {
            if (userData.role && ASSISTANT_TEACHER_ROLES.includes(userData.role)) {
                const option = document.createElement("option");
                option.value = userData.name || userData.email;
                option.textContent = `${userData.name || userData.email} (${userData.role})`;
                option.dataset.uid = uid; // LƯU UID VÀO DATASET
                assistantTeacherSelect.appendChild(option);
            }
        });
    } catch (error) {
        console.error("Lỗi khi tải danh sách trợ giảng:", error);
        Swal.fire("Lỗi", "Không thể tải danh sách trợ giảng. Vui lòng thử lại.", "error");
    }
}

// Chỉnh sửa lớp (đổ dữ liệu vào form)
async function editClass(id) {
  showLoading(true); // Hiển thị loading
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
      Swal.fire("Lỗi", "Lớp học không tồn tại!", "error"); // Dùng Swal.fire
      return;
    }

    // Điền thông tin chung
    document.getElementById("class-index").value = id;
    document.getElementById("class-name").value = cls.name || "";
    document.getElementById("class-start-date").value = cls.startDate || ""; // <--- ĐẢM BẢO TRƯỜNG NÀY ĐƯỢC ĐỔ DỮ LIỆU

    await populateTeacherDropdown(); // Đảm bảo dropdown giáo viên được điền trước
    document.getElementById("class-teacher").value = cls.teacher || "";

    await populateAssistantTeacherDropdown(); // Đảm bảo dropdown trợ giảng được điền trước
    document.getElementById("class-assistant-teacher").value = cls.assistantTeacher || "";

    // 3.2. Cập nhật dropdown chọn học viên (đảm bảo allStudentsData đã có giá trị)
    // Hàm này đã được gọi trong showClassForm/editClass, và nó đã load allStudentsData
    await updateStudentOptionsForClassForm(); // Đảm bảo danh sách gợi ý học viên được cập nhật

    // 3.3. Đổ danh sách học viên đã có sẵn trong lớp
    currentClassStudents = cls.students ? Object.keys(cls.students) : [];
    renderClassStudentList(currentClassStudents);

    // 3.4. Lịch cố định
    fillFixedScheduleForm(cls.fixedSchedule); // Hàm này đã đổ dữ liệu vào các checkbox/input time
    renderFixedScheduleDisplay(); // Hàm này đã hiển thị lịch ở dưới form

    setupScheduleInputsListener(); // Đảm bảo listener hoạt động
    const classAddWrapper = document.getElementById("class-add-wrapper");
    if (classAddWrapper) {
      classAddWrapper.style.display = "block"; // <-- THÊM DÒNG NÀY
    }
  } catch (err) {
    console.error("Lỗi tải lớp học:", err);
    Swal.fire("Lỗi", "Lỗi tải lớp học: " + err.message, "error"); // Dùng Swal.fire
  } finally {
    showLoading(false); // Ẩn loading
    // Thêm animation scale-up
    const modalContent = document.querySelector("#class-form-modal .modal-content");
    modalContent.classList.remove("scale-up");
    modalContent.offsetHeight;
    modalContent.classList.add("scale-up");
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
  await populateTeacherDropdown();
  await populateAssistantTeacherDropdown();

  fillFixedScheduleForm(null);
  renderFixedScheduleDisplay();
  setupScheduleInputsListener();

  const classAddWrapper = document.getElementById("class-add-wrapper");
  if (classAddWrapper) {
    classAddWrapper.style.display = "block"; // <-- THÊM DÒNG NÀY
  }

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
async function saveClass() {
  if (isSavingClass) return;
  isSavingClass = true;
  const user = auth.currentUser;
  if (!user) {
    Swal.fire("Lỗi", "Vui lòng đăng nhập để thêm hoặc sửa lớp học!", "error");
    showForm("login");
    toggleUI(false);
    isSavingClass = false;
    return;
  }

  const name = document.getElementById("class-name").value.trim();
  const teacherSelect = document.getElementById("class-teacher");
  const selectedTeacherOption = teacherSelect.options[teacherSelect.selectedIndex];
  const teacher = selectedTeacherOption.value;
  const teacherUid = selectedTeacherOption.dataset.uid || ''; // Lấy UID

  const assistantTeacherSelect = document.getElementById("class-assistant-teacher");
  const selectedAssistantTeacherOption = assistantTeacherSelect.options[assistantTeacherSelect.selectedIndex];
  const assistantTeacher = selectedAssistantTeacherOption.value;
  const assistantTeacherUid = selectedAssistantTeacherOption.dataset.uid || ''; // Lấy UID

  const startDate = document.getElementById("class-start-date").value;
  const fixedSchedule = getFixedScheduleFromForm();
  const id = document.getElementById("class-index").value;
  const nowTimestamp = firebase.database.ServerValue.TIMESTAMP;

  if (!name || !teacher || !startDate) {
    Swal.fire("Lỗi", "Vui lòng điền đầy đủ thông tin lớp học (Tên lớp, Giáo viên, Ngày bắt đầu).", "error");
    isSavingClass = false;
    return;
  }
  if (!validateFixedSchedule()) {
    isSavingClass = false;
    return;
  }

  try {
    if (!id) {
      const newClassRef = database.ref(DB_PATHS.CLASSES).push();
      const newClassId = newClassRef.key;

      const newClassData = {
  name,
  teacher,
  teacherUid, // THÊM DÒNG NÀY
  teacherSalary: 0,
  assistantTeacher,
  assistantTeacherUid, // THÊM DÒNG NÀY
  assistantTeacherSalary: 0,
  students: {},
  fixedSchedule,
  startDate,
  createdAt: nowTimestamp,
  updatedAt: nowTimestamp
};
      currentClassStudents.forEach(studentId => {
        const studentInfo = allStudentsData[studentId];
        if (studentInfo) {
          newClassData.students[studentId] = {
            enrolledAt: nowTimestamp,
            studentName: studentInfo.name || '(Không rõ tên)',
            packageName: studentInfo.package || '(Chưa có gói)'
          };
        }
      });

      await newClassRef.set(newClassData);
      await Promise.all(currentClassStudents.map(studentId =>
        database.ref(`students/${studentId}/classes/${newClassId}`).set({ enrolledAt: nowTimestamp })
      ));

      Swal.fire({ icon: 'success', title: 'Đã thêm lớp học!', timer: 2000, showConfirmButton: false });
    } else {
      const clsSnap = await database.ref(`${DB_PATHS.CLASSES}/${id}`).once("value");
      const clsData = clsSnap.val() || { students: {} };

     const updatedClassData = {
  name,
  teacher,
  teacherUid, // THÊM DÒNG NÀY
  assistantTeacher,
  assistantTeacherUid, // THÊM DÒNG NÀY
  students: {},
  fixedSchedule,
  updatedAt: nowTimestamp
};
      if (startDate) updatedClassData.startDate = startDate;

      // Giữ lại lương hiện có nếu có (chỉ cập nhật ở Quản lý nhân sự)
      updatedClassData.teacherSalary = clsData.teacherSalary || 0;
      updatedClassData.assistantTeacherSalary = clsData.assistantTeacherSalary || 0;

      currentClassStudents.forEach(studentId => {
        const studentInfo = allStudentsData[studentId];
        const enrolledAt = clsData.students?.[studentId]?.enrolledAt || nowTimestamp;

        if (studentInfo) {
          updatedClassData.students[studentId] = {
            enrolledAt: enrolledAt,
            studentName: studentInfo.name || '(Không rõ tên)',
            packageName: studentInfo.package || '(Chưa có gói)'
          };
        }
      });

      await database.ref(`${DB_PATHS.CLASSES}/${id}`).update(updatedClassData);
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
    showLoading(true);

    // 1. Lấy thông tin lớp trước khi xóa để biết danh sách học viên
    const classSnapshot = await database.ref(`${DB_PATHS.CLASSES}/${id}`).once("value");
    const cls = classSnapshot.val();
    const studentsInClass = cls && cls.students ? Object.keys(cls.students) : [];

    // 2. Xóa tất cả các bản ghi điểm danh và điểm bài tập của lớp này
    await database.ref(`attendance/${id}`).remove();
    await database.ref(`homeworkScores/${id}`).remove();

    // 3. Xóa lớp học khỏi node 'classes'
    await database.ref(`${DB_PATHS.CLASSES}/${id}`).remove();

    // 4. Cập nhật lại thông tin lớp học trong từng học viên
    // Đồng thời, tính toán lại sessionsAttended cho từng học viên
    const updatePromises = studentsInClass.map(async (studentId) => {
      // Xóa tham chiếu lớp học khỏi học viên
      await database.ref(`students/${studentId}/classes/${id}`).remove();

      // Sau đó, tính toán lại tổng sessionsAttended cho học viên đó
      // Đây là phần quan trọng: cần tổng hợp lại từ tất cả các lớp còn lại của học viên đó
      let totalAttended = 0;
      // Lấy tất cả các lớp mà học viên này tham gia
      const studentClassesSnap = await database.ref(`students/${studentId}/classes`).once("value");
      const studentClasses = studentClassesSnap.val() || {};

      for (const enrolledClassId in studentClasses) {
          // Lấy attendance cho từng lớp mà học viên này tham gia
          const attSnap = await database.ref(`attendance/${enrolledClassId}/${studentId}`).once("value");
          const attData = attSnap.val() || {};
          // Đếm số buổi đã điểm danh (true) trong lớp đó
          const attendedInThisClass = Object.values(attData).filter(val => val === true).length;
          totalAttended += attendedInThisClass;
      }
      // Cập nhật lại sessionsAttended cho học viên
      await database.ref(`students/${studentId}`).update({
            sessionsAttended: totalAttended, // CHỈ CẬP NHẬT sessionsAttended
            updatedAt: firebase.database.ServerValue.TIMESTAMP
      });
    });

    await Promise.all(updatePromises);

    Swal.fire({ icon: 'success', title: 'Đã xóa lớp học và cập nhật thông tin học viên!', timer: 3000, showConfirmButton: false });
    // Tự động load lại danh sách lớp, do initClassesListener đã làm điều này
  } catch (error) {
    console.error("Lỗi xóa lớp học:", error);
    Swal.fire("Lỗi", "Lỗi xóa lớp học: " + error.message, "error");
  } finally {
    showLoading(false);
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
  // Hiển thị chỉ báo tải
  showLoading(true); // Giả sử bạn có hàm này

  // 1. Lấy thông tin lớp (để có fixedSchedule, tên lớp)
  // Chỉ gọi database.ref() một lần
  const clsSnap = await database.ref(`classes/${classId}`).once("value");
  const clsData = clsSnap.val();
  if (!clsData) {
    Swal.fire("Lỗi", "Lớp không tồn tại!", "error"); // Sử dụng Swal.fire để nhất quán
    showLoading(false);
    return;
  }

  // Ẩn toàn bộ phần "Danh sách học viên thêm vào lớp"
  const classAddWrapper = document.getElementById("class-add-wrapper");
  if (classAddWrapper) {
    classAddWrapper.style.display = "none"; // CHỈ ẨN ĐI, KHÔNG XÓA
  }
  
  // 3.2. Kiểm tra học sinh đã được thêm chưa
  const enrolledObj = clsData.students && clsData.students[studentId];
  if (!enrolledObj || !enrolledObj.enrolledAt) {
    Swal.fire("Thông báo", "Học sinh chưa được thêm vào lớp này!", "info"); // Sử dụng Swal.fire
    showLoading(false);
    // Đảm bảo wrapper được hiển thị lại nếu thoát sớm
    if (classAddWrapper) {
        classAddWrapper.style.display = "block";
    }
    return;
  }
  const enrolledAt = enrolledObj.enrolledAt;
  const fixedSchedule = clsData.fixedSchedule || {};

  // 3.3. Sinh N buổi sắp tới (ví dụ 30 buổi)
  const NUM_FUTURE = 30;
  // Đảm bảo generateFutureSessionDates tồn tại và được định nghĩa đúng ở nơi khác
  const sessionDates = generateFutureSessionDates(fixedSchedule, enrolledAt, NUM_FUTURE);

  // 3.4. Lấy attendance hiện có của học sinh
  const attSnap = await database.ref(`attendance/${classId}/${studentId}`).once("value");
  const attendanceData = attSnap.val() || {};

  // 3.5. Xóa nội dung cũ trong slider
  const sliderEl = document.getElementById("sessions-slider");
  if (!sliderEl) {
    console.warn("Không tìm thấy #sessions-slider trong DOM!");
    showLoading(false);
    return;
  }
  sliderEl.innerHTML = "";

  // 3.6. Tạo các thẻ session-item và checkbox
  sessionDates.forEach(dateStr => {
    const container = document.createElement("div");
    container.className = "session-item";
    if (attendanceData[dateStr] === true) {
      container.classList.add("attended");
    }

    const parts = dateStr.split("-");
    const dayName = new Date(dateStr).toLocaleDateString("en-US", { weekday: "long" });
    const timeStr = fixedSchedule[dayName] || ""; 
    const txtDate = document.createElement("p");
    txtDate.textContent = `${parts[2]}/${parts[1]}/${parts[0]} - ${timeStr}`;
    container.appendChild(txtDate);

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
  void modalContent.offsetWidth; // Buộc reflow
  modalContent.classList.add("scale-up");
  
  showLoading(false);
}
// ----------------------------------------------------------------------------
// 4. Hàm đóng modal
// ----------------------------------------------------------------------------
function hideStudentSessions() {
  const modal = document.getElementById("student-sessions-modal");
  if (modal) modal.style.display = "none";

  // Hiển thị lại phần thêm học viên vào lớp khi đóng modal buổi học
  const classAddWrapper = document.getElementById("class-add-wrapper");
  if (classAddWrapper) {
    classAddWrapper.style.display = "block"; // Hiển thị lại
  }
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
  // Chỉ nên có MỘT listener cho CLASSES node.
  // Gỡ bỏ listener cũ nếu có để tránh nhân đôi.
  database.ref(DB_PATHS.CLASSES).off("value"); // THÊM DÒNG NÀY để gỡ bỏ listener cũ nếu hàm được gọi lại
  database.ref(DB_PATHS.CLASSES).on("value", snapshot => {
    const classes = snapshot.val() || {};
    allClassesData = classes; // CẬP NHẬT BIẾN TOÀN CỤC Ở ĐÂY
    renderClassList(classes); // Render cho Quản lý lớp học
    clearSchedulePreview();

    // SAU KHI allClassesData ĐƯỢC CẬP NHẬT, MỚI THỬ RENDER CHO QUẢN LÝ NHÂN SỰ NẾU ĐANG Ở TRANG ĐÓ
    if (window.location.hash.slice(1) === "personnel-management" && personnelListInitialized) {
        // Chỉ gọi populatePersonnelClassList nếu trang QLNS đã được khởi tạo và đang hiển thị.
        // Hơn nữa, chúng ta không cần truyền classes nữa vì nó sẽ dùng allClassesData toàn cục.
        populatePersonnelClassList(allClassesData); // Gọi lại để cập nhật danh sách QLNS
    }
  });
}
// MỚI: QUẢN LÝ NHÂN SỰ
// =========================================================================================

// Hàm kiểm tra quyền truy cập Quản lý Nhân sự
async function checkPersonnelAccess() {
    const user = auth.currentUser;
    if (!user) {
        return false;
    }
    const userSnapshot = await database.ref(`${DB_PATHS.USERS}/${user.uid}`).once("value");
    const userData = userSnapshot.val() || {};
    // Cho phép truy cập nếu là Admin, Hội Đồng, Giáo Viên, hoặc Trợ Giảng
    return userData.role && (PERSONNEL_MANAGEMENT_ROLES.includes(userData.role) || PAYROLL_STAFF_ROLES.includes(userData.role));
}

// Cập nhật event listener cho thẻ "Quản lý nhân sự" trong dashboard
document.addEventListener("DOMContentLoaded", () => {
    const personnelCard = document.getElementById("personnel-management-card");
    if (personnelCard) {
        personnelCard.addEventListener("click", async (e) => {
            const hasAccess = await checkPersonnelAccess();
            if (!hasAccess) {
                e.preventDefault(); // Ngăn chặn chuyển trang
                Swal.fire("Truy cập bị từ chối", "Bạn không có quyền truy cập chức năng này.", "warning");
            }
        });
    }
});
function showPersonnelSection(section) {
    const classesSection = document.getElementById("personnel-classes-section");
    const staffSection = document.getElementById("personnel-staff-section");

    const btnClasses = document.getElementById("btn-show-personnel-classes");
    const btnStaff = document.getElementById("btn-show-personnel-staff");

    // Ẩn tất cả các section trước
    classesSection.style.display = 'none';
    staffSection.style.display = 'none';

    // Xóa class 'active' khỏi tất cả các nút
    btnClasses.classList.remove('active');
    btnStaff.classList.remove('active');

    // Lấy quyền của người dùng hiện tại
    const isAdminOrHoiDong = currentUserData && (currentUserData.role === "Admin" || currentUserData.role === "Hội Đồng");
    const isTeacherOrAssistant = currentUserData && PAYROLL_STAFF_ROLES.includes(currentUserData.role); 

    // Điều chỉnh hiển thị nút "Danh sách nhân sự (Lương)"
    // Nút này luôn hiển thị nếu là Admin/Hội Đồng, hoặc nếu là Giáo viên/Trợ giảng
    if (btnStaff) {
        btnStaff.style.display = (isAdminOrHoiDong || isTeacherOrAssistant) ? 'inline-flex' : 'none';
    }
    // Nút "Danh sách lớp (Chấm công)" cũng luôn hiển thị nếu có quyền truy cập trang QLNS
    if (btnClasses) {
         btnClasses.style.display = (isAdminOrHoiDong || isTeacherOrAssistant) ? 'inline-flex' : 'none';
    }

    // Hiển thị section được chọn và thêm class 'active' cho nút tương ứng
    if (section === 'classes') {
        classesSection.style.display = 'block';
        btnClasses.classList.add('active');
    } else if (section === 'staff') {
        staffSection.style.display = 'block';
        btnStaff.classList.add('active');
        // Khi chọn tab "Danh sách nhân sự", cần render lại bảng để áp dụng quyền
        renderStaffSalaryTable();
    }
}
// MỚI: Hàm khởi tạo trang quản lý nhân sự
async function initPersonnelManagement() {
    // Nếu đã khởi tạo rồi thì thoát, tránh việc chạy lại nhiều lần khi hashchange
    if (personnelListInitialized) {
        showLoading(false);
        return;
    }

    const hasAccess = await checkPersonnelAccess();
    if (!hasAccess) {
        Swal.fire("Truy cập bị từ chối", "Bạn không có quyền truy cập chức năng này.", "warning");
        window.location.hash = "dashboard";
        return;
    }

    showLoading(true);
    // KHÔNG CẦN await populatePersonnelClassList() ở đây nữa
    // vì nó sẽ được gọi từ initClassesListener hoặc renderStaffSalaryTable nếu cần
    await renderStaffSalaryTable();

    // Mặc định hiển thị phần danh sách lớp khi vào trang Quản lý Nhân sự
    showPersonnelSection('classes');
    
    showLoading(false);
    personnelListInitialized = true; // Đặt cờ là true sau khi khởi tạo thành công

    // Sau khi trang được khởi tạo, đảm bảo populatePersonnelClassList được gọi VỚI DỮ LIỆU MỚI NHẤT
    // Trường hợp này, nó sẽ dùng dữ liệu từ allClassesData đã được listener cập nhật
    populatePersonnelClassList(allClassesData); 
}
// MỚI: Điền danh sách lớp vào Ô 1 (giống quản lý bài tập)
async function populatePersonnelClassList(classesToRender = allClassesData) {
    const classListEl = document.getElementById("personnel-class-list");
    classListEl.innerHTML = "";

    const isAdminOrHoiDong = currentUserData && (currentUserData.role === "Admin" || currentUserData.role === "Hội Đồng");
    const currentUid = currentUserData ? currentUserData.uid : null;

    Object.entries(classesToRender).forEach(([classId, cls]) => {
        // Chỉ hiển thị lớp nếu người dùng có quyền Admin/Hội Đồng HOẶC người dùng là GV/TG của lớp đó
        if (isAdminOrHoiDong || (cls.teacherUid === currentUid) || (cls.assistantTeacherUid === currentUid)) {
            const li = document.createElement("li");
            li.textContent = cls.name || "Không tên";
            li.onclick = () => {
                currentPersonnelClassId = classId;
                renderPersonnelAttendanceTable(classId, cls.name || "Không tên");
            };
            classListEl.appendChild(li);
        }
    });
}
// MỚI: Lọc danh sách lớp trong Quản lý nhân sự
function filterPersonnelClassesBySearch() {
    const query = document.getElementById("personnel-class-search").value.toLowerCase().trim();
    const classListEl = document.getElementById("personnel-class-list");
    classListEl.innerHTML = "";

    const isAdminOrHoiDong = currentUserData && (currentUserData.role === "Admin" || currentUserData.role === "Hội Đồng");
    const currentUid = currentUserData ? currentUserData.uid : null;

    // Đảm bảo lọc từ allClassesData (biến toàn cục)
    Object.entries(allClassesData).forEach(([classId, cls]) => {
        const name = (cls.name || "").toLowerCase();
        // Lọc theo tên lớp VÀ quyền truy cập
        if (name.includes(query) && (isAdminOrHoiDong || (cls.teacherUid === currentUid) || (cls.assistantTeacherUid === currentUid))) {
            const li = document.createElement("li");
            li.textContent = cls.name || "Không tên";
            li.onclick = () => {
                currentPersonnelClassId = classId;
                renderPersonnelAttendanceTable(classId, cls.name || "Không tên");
            };
            classListEl.appendChild(li);
        }
    });
}

// MỚI: Render bảng chấm công của lớp (Ô 1 - giống bảng điểm danh học viên nhưng cho nhân sự)
async function renderPersonnelAttendanceTable(classId, className) {
    showLoading(true);
    document.getElementById("personnel-classes-section").style.display = "none";
    document.getElementById("personnel-staff-section").style.display = "none";
    document.querySelector('.personnel-controls').style.display = 'none';
    document.getElementById("current-personnel-class-name").textContent = className;

    const classSnap = await database.ref(`classes/${classId}`).once("value");
    const cls = classSnap.val();
    if (!cls) {
        Swal.fire("Lỗi", "Lớp không tồn tại!", "error");
        showLoading(false);
        return;
    }

    const fixedSchedule = cls.fixedSchedule || {};
    const startDate = cls.startDate || new Date().toISOString().split("T")[0];
    const sessions = generateRollingSessions(fixedSchedule, startDate, 3); // 3 tháng lịch tương lai

    let classStaff = [];
    const isAdminOrHoiDong = currentUserData && (currentUserData.role === "Admin" || currentUserData.role === "Hội Đồng");
    const currentUid = currentUserData ? currentUserData.uid : null;

    if (cls.teacherUid && allUsersData[cls.teacherUid]) { // Kiểm tra uid và dữ liệu user
        if (isAdminOrHoiDong || cls.teacherUid === currentUid) { // Chỉ thêm nếu Admin/Hội Đồng HOẶC là chính GV đó
            classStaff.push({ uid: cls.teacherUid, name: cls.teacher, role: "Giáo Viên" });
        }
    }
    if (cls.assistantTeacherUid && allUsersData[cls.assistantTeacherUid]) { // Kiểm tra uid và dữ liệu user
        if (isAdminOrHoiDong || cls.assistantTeacherUid === currentUid) { // Chỉ thêm nếu Admin/Hội Đồng HOẶC là chính TG đó
            // Tránh thêm trùng nếu một người vừa là GV vừa là TG
            if (!classStaff.some(s => s.uid === cls.assistantTeacherUid)) {
                classStaff.push({ uid: cls.assistantTeacherUid, name: cls.assistantTeacher, role: "Trợ Giảng" });
            }
        }
    }

    const personnelAttendanceSnap = await database.ref(`personnelAttendance/${classId}`).once("value");
    const personnelAttendanceData = personnelAttendanceSnap.val() || {};

    const tableHeadRow = document.getElementById("personnel-attendance-table-head");
    const tableBody = document.getElementById("personnel-attendance-table-body");

    let headerHTML = `<th style="min-width: 180px; position: sticky; left: 0; background-color: #f3f6fb; z-index: 1;">Nhân sự</th>`;
    sessions.forEach((s) => {
        const d = new Date(s.date);
        const label = `${d.getDate()}/${d.getMonth() + 1}`;
        headerHTML += `<th style="min-width: 100px;">${label}</th>`;
    });
    tableHeadRow.innerHTML = headerHTML;
    tableBody.innerHTML = "";

    classStaff.forEach(staff => {
        const row = document.createElement("tr");
        const nameCell = document.createElement("td");
        nameCell.textContent = `${staff.name} (${staff.role})`;
        nameCell.style.position = "sticky";
        nameCell.style.left = "0";
        nameCell.style.backgroundColor = "#fff";
        nameCell.style.zIndex = "1";
        row.appendChild(nameCell);

        sessions.forEach((session) => {
            const dateStr = session.date;
            const isChecked = personnelAttendanceData?.[staff.uid]?.[dateStr]?.[staff.role] === true;

            const td = document.createElement("td");
            td.style.minWidth = "100px";
            // Disable checkbox nếu không phải Admin/Hội Đồng và không phải là người dùng hiện tại
              const isCurrentUserAdminOrHoiDong = currentUserData && (currentUserData.role === "Admin" || currentUserData.role === "Hội Đồng");

            // Checkbox bị vô hiệu hóa nếu người dùng hiện tại KHÔNG phải Admin/Hội Đồng
            // (Tức là, Giáo Viên và Trợ Giảng không thể tự chấm công)
            const isDisabled = !isCurrentUserAdminOrHoiDong; 
            
            td.innerHTML = `
                <input type="checkbox"
                       onchange="togglePersonnelAttendance('${classId}', '${staff.uid}', '${dateStr}', '${staff.role}', this.checked)"
                       ${isChecked ? "checked" : ""}
                       ${isDisabled ? "disabled" : ""} />
            `;
            row.appendChild(td);
        });
        tableBody.appendChild(row);
    });

    showPersonnelAttendanceModal();
    showLoading(false);

    // Tự động cuộn đến buổi gần nhất
    setTimeout(() => {
        const scrollContainer = document.getElementById("personnel-attendance-scroll-container");
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const closestIndex = sessions.findIndex(s => new Date(s.date) >= today);

        if (closestIndex === -1) {
            scrollContainer.scrollLeft = scrollContainer.scrollWidth;
            return;
        }

        const firstDateColumn = tableHeadRow.children[1];
        if (!firstDateColumn) return;

        const columnWidth = firstDateColumn.offsetWidth;
        const scrollPosition = Math.max(0, closestIndex - 2) * columnWidth; // Cuộn lùi 2 cột
        scrollContainer.scrollLeft = scrollPosition;
    }, 0);
}

// MỚI: Hàm bật/tắt checkbox chấm công nhân sự
async function togglePersonnelAttendance(classId, staffUid, dateStr, role, isChecked) {
    const attPath = `personnelAttendance/${classId}/${staffUid}/${dateStr}/${role}`;
    try {
        await database.ref(attPath).set(isChecked);
        console.log(`Chấm công ${staffUid} (${role}) ngày ${dateStr} của lớp ${classId}: ${isChecked}`);
        // Không cần cập nhật sessionsAttended ở đây, sẽ tính lại tổng khi xem lương
    } catch (error) {
        console.error("Lỗi cập nhật chấm công nhân sự:", error);
        Swal.fire("Lỗi", "Không thể cập nhật chấm công.", "error");
    }
}

// MỚI: Hàm hiển thị modal chấm công nhân sự
function showPersonnelAttendanceModal() {
    document.getElementById("personnel-attendance-modal").style.display = "flex";
}

// MỚI: Hàm ẩn modal chấm công nhân sự và quay lại trang quản lý nhân sự
function hidePersonnelAttendanceModal() {
    document.getElementById("personnel-attendance-modal").style.display = "none";
    
    // Hiển thị lại các section và nút điều khiển
    document.getElementById("personnel-classes-section").style.display = "block"; // Mặc định về danh sách lớp
    document.getElementById("personnel-staff-section").style.display = "block"; // Vẫn block cho tiện, sau đó showPersonnelSection sẽ ẩn đi
    document.querySelector('.personnel-controls').style.display = 'flex'; // Hiển thị lại các nút

    // Đảm bảo nút được chọn trước đó vẫn được active, hoặc mặc định chọn lại 'classes'
    showPersonnelSection('classes'); // Hoặc lưu trạng thái trước đó và gọi lại
    
    currentPersonnelClassId = null;
}

// MỚI: Hàm cuộn bảng chấm công nhân sự
function scrollPersonnelAttendanceBySessions(direction) {
    const scrollContainer = document.getElementById("personnel-attendance-scroll-container");
    const step = 100 * 5; // 5 cột, mỗi cột 100px min-width
    scrollContainer.scrollLeft += direction * step;
}

// MỚI: Render bảng danh sách nhân sự và lương (Ô 2)
let allStaffData = {}; // Biến toàn cục để lưu trữ dữ liệu nhân sự có vai trò cần quản lý

async function renderStaffSalaryTable() {
    const staffSalaryListEl = document.getElementById("staff-salary-list");
    staffSalaryListEl.innerHTML = "";
    allStaffData = {}; // Reset allStaffData mỗi khi render lại

    showLoading(true);
    try {
        const users = allUsersData; // Sử dụng allUsersData toàn cục
        const isAdminOrHoiDong = currentUserData && (currentUserData.role === "Admin" || currentUserData.role === "Hội Đồng");
        const currentUid = currentUserData ? currentUserData.uid : null; // Lấy UID của người dùng hiện tại

        for (const uid in users) {
            const userData = users[uid];
            // Chỉ hiển thị người có role liên quan đến lương (GV/TG)
            // Và nếu không phải Admin/Hội Đồng thì chỉ hiển thị chính người dùng đó
            if (userData.role && PAYROLL_STAFF_ROLES.includes(userData.role) && (isAdminOrHoiDong || (currentUid === uid))) {
                allStaffData[uid] = userData; // Lưu trữ vào biến toàn cục với UID làm key

                const row = document.createElement("tr");
                let salaryInputTeacherCol = ''; // Cột cho input lương Giáo viên
                let salaryInputAssistantCol = ''; // Cột cho input lương Trợ giảng
                let actionButtonCol = ''; // Cột cho nút hành động

                if (isAdminOrHoiDong) {
                    // Admin/Hội Đồng có quyền quản lý lương theo lớp và xóa
                    // Hiện tại, lương cố định per-staff đã được chuyển sang per-class, nên 2 cột này sẽ trống
                    // Thay vào đó, nút "Quản lý lương theo lớp" sẽ mở modal quản lý chi tiết.
                    salaryInputTeacherCol = `<td></td>`;
                    salaryInputAssistantCol = `<td></td>`;
                    actionButtonCol = `<td><button onclick="showStaffClassesAndSalariesModal('${uid}')">Quản lý lương theo lớp</button></td>`;
                } else {
                    // Giáo viên/Trợ giảng chỉ xem tên của chính mình, và chỉ xem tổng lương
                    if (currentUid === uid) {
                        salaryInputTeacherCol = `<td>Không có quyền sửa</td>`; // GV/TG không chỉnh sửa trực tiếp ở đây
                        salaryInputAssistantCol = `<td>Không có quyền sửa</td>`;
                        actionButtonCol = `<td><button onclick="showSalaryDetailModal('${uid}')">Xem tổng lương</button></td>`;
                    } else {
                        // Nếu là GV/TG nhưng không phải là người dùng hiện tại, không hiển thị gì cả
                        // Logic này đã được xử lý bởi điều kiện `(isAdminOrHoiDong || (currentUid === uid))`
                        // nên đoạn `else` này sẽ không bao giờ được chạy nếu đã lọc đúng ở trên.
                        continue; // Đảm bảo không hiển thị hàng của người khác
                    }
                }

                row.innerHTML = `
                    <td><a href="#" class="clickable-staff" data-uid="${uid}">${userData.name || userData.email} (${userData.role})</a></td>
                    <td>${userData.email || ""}</td>
                    ${salaryInputTeacherCol}
                    ${salaryInputAssistantCol}
                    ${actionButtonCol}
                `;
                staffSalaryListEl.appendChild(row);
            }
        }
    } catch (error) {
        console.error("Lỗi khi tải danh sách nhân sự:", error);
        Swal.fire("Lỗi", "Không thể tải danh sách nhân sự. Vui lòng thử lại.", "error");
    } finally {
        showLoading(false);
    }

    // Gắn sự kiện click cho tên nhân sự để hiển thị popup chi tiết (nếu có)
    staffSalaryListEl.querySelectorAll('.clickable-staff').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const staffUid = link.dataset.uid;
            const isCurrentUserAdminOrHoiDong = currentUserData && (currentUserData.role === "Admin" || currentUserData.role === "Hội Đồng");
            
            if (isCurrentUserAdminOrHoiDong) {
               // showStaffClassesAndSalariesModal(staffUid);
                showSalaryDetailModal(staffUid);
            } else if (staffUid === currentUserData.uid) { // Chỉ xem của chính mình
                showSalaryDetailModal(staffUid);
            } else { // Cố gắng click vào người khác mà không phải Admin/HĐ
                Swal.fire("Truy cập bị từ chối", "Bạn chỉ có thể xem chi tiết lương của bản thân.", "warning");
            }
        });
    });
}
async function populatePersonnelClassList(classesToRender = allClassesData) {
    const classListEl = document.getElementById("personnel-class-list");
    classListEl.innerHTML = "";

    const isAdminOrHoiDong = currentUserData && (currentUserData.role === "Admin" || currentUserData.role === "Hội Đồng");
    const currentUid = currentUserData ? currentUserData.uid : null;

    Object.entries(classesToRender).forEach(([classId, cls]) => {
        // Chỉ hiển thị lớp nếu người dùng có quyền Admin/Hội Đồng HOẶC người dùng là GV/TG của lớp đó
        if (isAdminOrHoiDong || (cls.teacherUid === currentUid) || (cls.assistantTeacherUid === currentUid)) {
            const li = document.createElement("li");
            li.textContent = cls.name || "Không tên";
            li.onclick = () => {
                currentPersonnelClassId = classId;
                renderPersonnelAttendanceTable(classId, cls.name || "Không tên");
            };
            classListEl.appendChild(li);
        }
    });
}
// CÁC HÀM saveStaffSalary(this) và deleteStaffSalary(uid) CŨ CŨNG SẼ BỊ XÓA HOẶC KHÔNG CẦN NỮA
// VÌ KHÔNG CÓ INPUT LƯƠNG CỐ ĐỊNH Ở ĐÂY
// MỚI: Lưu lương của nhân sự
async function showStaffClassesAndSalariesModal(staffUid) {
    if (!currentUserData) {
        Swal.fire("Lỗi", "Vui lòng đăng nhập.", "error");
        return;
    }
    const isAdminOrHoiDong = (currentUserData.role === "Admin" || currentUserData.role === "Hội Đồng");

    // Chỉ Admin/Hội Đồng mới được phép chỉnh sửa lương theo lớp
    // Giáo viên/Trợ giảng KHÔNG được mở modal này để chỉnh sửa, họ dùng showSalaryDetailModal
    if (!isAdminOrHoiDong) {
        Swal.fire("Truy cập bị từ chối", "Bạn không có quyền quản lý lương theo lớp.", "warning");
        return;
    }

    showLoading(true);
    const staffData = allStaffData[staffUid];
    if (!staffData) {
        Swal.fire("Lỗi", "Không tìm thấy thông tin nhân sự.", "error");
        showLoading(false);
        return;
    }

    document.getElementById("staff-classes-salary-name").textContent = staffData.name || staffData.email;
    const listEl = document.getElementById("staff-individual-class-salary-list");
    listEl.innerHTML = "";

    try {
        const allClasses = allClassesData || {};

        let foundClasses = false;
        for (const classId in allClasses) {
            if (!allClasses.hasOwnProperty(classId)) continue;

            const cls = allClasses[classId];
            let isTeacherInClass = false;
            let isAssistantInClass = false;
            let currentSalary = 0;
            let roleInClass = ''; // Role hiển thị trong bảng

            if (cls.teacherUid === staffUid) {
                isTeacherInClass = true;
                roleInClass = 'Giáo Viên';
                currentSalary = cls.teacherSalary || 0;
            }
            // Nếu người này vừa là GV vừa là TG trong cùng 1 lớp (trường hợp hiếm)
            if (cls.assistantTeacherUid === staffUid) {
                isAssistantInClass = true;
                // Nếu đã là GV, thêm cả vai trò TG vào
                if (isTeacherInClass) roleInClass = 'Giáo Viên, Trợ Giảng';
                else roleInClass = 'Trợ Giảng';
                // Lấy lương của vai trò chính hoặc vai trò TG nếu chỉ là TG
                currentSalary = isTeacherInClass ? (cls.teacherSalary || 0) : (cls.assistantTeacherSalary || 0);
            }

            if (isTeacherInClass || isAssistantInClass) {
                foundClasses = true;
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${cls.name || 'Không tên lớp'}</td>
                    <td>${roleInClass}</td>
                    <td>
                        <input type="number"
                               class="salary-input"
                               data-class-id="${classId}"
                               data-staff-uid="${staffUid}"
                               data-role-in-class="${isTeacherInClass ? 'teacher' : ''}${isAssistantInClass ? 'assistant' : ''}"
                               value="${currentSalary}"
                               min="0"
                               onchange="saveClassSpecificSalary(this)"
                               ${isAdminOrHoiDong ? '' : 'disabled'} > </td>
                    <td>
                        ${isAdminOrHoiDong ? `
                            <button onclick="removeClassSpecificSalary('${classId}', '${staffUid}', '${isTeacherInClass ? 'teacher' : ''}${isAssistantInClass ? 'assistant' : ''}')" class="delete-btn">Xóa</button>
                        ` : `
                            `}
                    </td>
                `;
                listEl.appendChild(row);
            }
        }

        if (!foundClasses) {
            listEl.innerHTML = '<tr><td colspan="4">Nhân sự này hiện không dạy lớp nào.</td></tr>';
        }

        document.getElementById("staff-classes-salary-modal").style.display = "flex";
        const modalContent = document.querySelector("#staff-classes-salary-modal .modal-content");
        modalContent.classList.remove("scale-up");
        modalContent.offsetHeight;
        modalContent.classList.add("scale-up");

    } catch (error) {
        console.error("Lỗi khi tải lương theo lớp:", error);
        Swal.fire("Lỗi", "Không thể tải danh sách lớp của nhân sự: " + error.message, "error");
    } finally {
        showLoading(false);
    }
}
async function saveClassSpecificSalary(inputElement) {
   const isAdminOrHoiDong = currentUserData && (currentUserData.role === "Admin" || currentUserData.role === "Hội Đồng");
    if (!isAdminOrHoiDong) {
        Swal.fire("Truy cập bị từ chối", "Bạn không có quyền chỉnh sửa mức lương.", "warning");
        // Có thể reset giá trị input về giá trị trước đó nếu muốn
        return;
    }
    const classId = inputElement.dataset.classId;
    const staffUid = inputElement.dataset.staffUid;
    const roleInClass = inputElement.dataset.roleInClass; // 'teacher', 'assistant', or 'teacherassistant'
    const value = parseInt(inputElement.value) || 0;

    if (value < 0) {
        Swal.fire("Lỗi", "Mức lương không thể là số âm.", "warning");
        inputElement.value = 0;
        return;
    }

    let updatePath = `classes/${classId}/`;
    if (roleInClass.includes('teacher')) {
        updatePath += 'teacherSalary';
    } else if (roleInClass.includes('assistant')) {
        updatePath += 'assistantTeacherSalary';
    } else {
        console.error("Vai trò không xác định cho lớp:", roleInClass);
        return;
    }

    try {
        await database.ref(updatePath).set(value);
        Swal.fire({ icon: 'success', title: 'Đã lưu lương lớp!', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
    } catch (error) {
        console.error("Lỗi lưu lương lớp:", error);
        Swal.fire("Lỗi", "Không thể lưu lương lớp. Vui lòng thử lại.", "error");
    }
}

async function removeClassSpecificSalary(classId, staffUid, roleInClass) {
  const isAdminOrHoiDong = currentUserData && (currentUserData.role === "Admin" || currentUserData.role === "Hội Đồng");
    if (!isAdminOrHoiDong) {
        Swal.fire("Truy cập bị từ chối", "Bạn không có quyền xóa mức lương.", "warning");
        return;
    }
    if (!confirm("Bạn có chắc muốn xóa mức lương này cho lớp? (Sẽ đặt về 0)")) return;
    showLoading(true);

    let updatePath = `classes/${classId}/`;
    if (roleInClass.includes('teacher')) {
        updatePath += 'teacherSalary';
    } else if (roleInClass.includes('assistant')) {
        updatePath += 'assistantTeacherSalary';
    } else {
        console.error("Vai trò không xác định để xóa lương lớp:", roleInClass);
        showLoading(false);
        return;
    }

    try {
        await database.ref(updatePath).set(0);
        Swal.fire({ icon: 'success', title: 'Đã xóa lương lớp!', timer: 1500, showConfirmButton: false });
        // Tải lại modal để cập nhật giao diện
        showStaffClassesAndSalariesModal(staffUid);
    } catch (error) {
        console.error("Lỗi xóa lương lớp:", error);
        Swal.fire("Lỗi", "Không thể xóa lương lớp. Vui lòng thử lại.", "error");
    } finally {
        showLoading(false);
    }
}

function hideStaffClassesSalaryModal() {
    document.getElementById("staff-classes-salary-modal").style.display = "none";
}

async function saveStaffSalary(inputElement) {
    const uid = inputElement.dataset.uid;
    const role = inputElement.dataset.role;
    const value = parseInt(inputElement.value) || 0; // Đảm bảo là số

    if (value < 0) {
        Swal.fire("Lỗi", "Lương không thể là số âm.", "warning");
        inputElement.value = 0; // Reset về 0
        return;
    }

    let updatePath;
    if (role === "Giáo Viên") {
        updatePath = `users/${uid}/salaryTeacher`;
    } else if (role === "Trợ Giảng") {
        updatePath = `users/${uid}/salaryAssistant`;
    } else {
        console.error("Role không hợp lệ để lưu lương:", role);
        return;
    }

    try {
        await database.ref(updatePath).set(value);
        console.log(`Lương ${role} của ${uid} đã được cập nhật thành ${value}`);
        // Cập nhật lại allStaffData để dữ liệu cục bộ nhất quán
        if (allStaffData[uid]) {
            if (role === "Giáo Viên") allStaffData[uid].salaryTeacher = value;
            if (role === "Trợ Giảng") allStaffData[uid].salaryAssistant = value;
        }
        Swal.fire({ icon: 'success', title: 'Đã lưu lương!', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
    } catch (error) {
        console.error("Lỗi lưu lương:", error);
        Swal.fire("Lỗi", "Không thể lưu lương. Vui lòng thử lại.", "error");
    }
}

// MỚI: Xóa lương của nhân sự (đặt về 0)
async function deleteStaffSalary(uid) {
    if (!confirm("Bạn có chắc muốn xóa mức lương của nhân sự này? (Sẽ đặt về 0)")) return;
    showLoading(true);
    try {
        await database.ref(`users/${uid}/salaryTeacher`).set(0);
        await database.ref(`users/${uid}/salaryAssistant`).set(0);
        await renderStaffSalaryTable(); // Tải lại bảng để cập nhật UI
        Swal.fire({ icon: 'success', title: 'Đã xóa mức lương!', timer: 2000, showConfirmButton: false });
    } catch (error) {
        console.error("Lỗi xóa lương:", error);
        Swal.fire("Lỗi", "Không thể xóa lương. Vui lòng thử lại.", "error");
    } finally {
        showLoading(false);
    }
}

// MỚI: Hiển thị Modal chi tiết lương và chấm công
async function showSalaryDetailModal(staffUid) {
    if (!currentUserData) {
        Swal.fire("Lỗi", "Vui lòng đăng nhập.", "error");
        return;
    }
    const isAdminOrHoiDong = (currentUserData.role === "Admin" || currentUserData.role === "Hội Đồng");

    // Nếu không phải Admin/Hội Đồng VÀ không phải là chính mình, ngăn truy cập
    if (!isAdminOrHoiDong && staffUid !== currentUserData.uid) {
        Swal.fire("Truy cập bị từ chối", "Bạn chỉ có thể xem chi tiết lương của bản thân.", "warning");
        return;
    }

    showLoading(true);
    const staffData = allStaffData[staffUid];
    if (!staffData) {
        Swal.fire("Lỗi", "Không tìm thấy thông tin nhân sự.", "error");
        showLoading(false);
        return;
    }

    document.getElementById("salary-detail-name").textContent = `${staffData.name || staffData.email} (${staffData.role})`;

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    document.getElementById("salary-month-select").value = currentMonth;

    // Gán sự kiện onchange cho input tháng
    const salaryMonthSelect = document.getElementById("salary-month-select");
    salaryMonthSelect.onchange = () => renderPersonnelSalaryChart(staffUid, salaryMonthSelect.value);

    await renderPersonnelSalaryChart(staffUid, currentMonth);

    document.getElementById("salary-detail-modal").style.display = "flex";
    const modalContent = document.querySelector("#salary-detail-modal .modal-content");
    modalContent.classList.remove("scale-up");
    modalContent.offsetHeight;
    modalContent.classList.add("scale-up");
    showLoading(false);
}

// MỚI: Ẩn Modal chi tiết lương
function hideSalaryDetailModal() {
    document.getElementById("salary-detail-modal").style.display = "none";
}

// MỚI: Render biểu đồ và tính toán lương cho nhân sự theo tháng
let personnelChart = null; // Biến để lưu instance của Chart.js

async function renderPersonnelSalaryChart(staffUid, monthYear) {
    showLoading(true);
    const staffData = allStaffData[staffUid]; // allStaffData vẫn chứa thông tin cơ bản của nhân sự
    if (!staffData) {
        showLoading(false);
        return;
    }

    const [year, month] = monthYear.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayOfMonth = new Date(year, month - 1, 1);
    const lastDayOfMonth = new Date(year, month - 1, daysInMonth);

    const allAttendanceSnap = await database.ref(`personnelAttendance`).once("value");
    const allAttendanceData = allAttendanceSnap.val() || {};

    let dailyTeacherShifts = new Array(daysInMonth).fill(0);
    let dailyAssistantShifts = new Array(daysInMonth).fill(0);
    let totalTeacherShifts = 0;
    let totalAssistantShifts = 0;
    let dailyShiftDetails = {};

    // Lấy tất cả các lớp một lần để tra cứu lương
    const allClassesSnap = await database.ref(DB_PATHS.CLASSES).once("value");
    const allClasses = allClassesSnap.val() || {};

    for (const classId in allAttendanceData) {
        const staffAttendance = allAttendanceData[classId]?.[staffUid];
        const cls = allClasses[classId]; // Lấy thông tin lớp
        if (!staffAttendance || !cls) continue; // Bỏ qua nếu không có attendance hoặc lớp không tồn tại

        // Xác định mức lương cho GV/TG trong LỚP HIỆN TẠI
        let salaryTeacherPerClass = 0;
        let salaryAssistantPerClass = 0;

        if (cls.teacherUid === staffUid) {
            salaryTeacherPerClass = cls.teacherSalary || 0;
        }
        if (cls.assistantTeacherUid === staffUid) {
            salaryAssistantPerClass = cls.assistantTeacherSalary || 0;
        }

        for (const dateStr in staffAttendance) {
            const sessionDate = new Date(dateStr);
            if (sessionDate >= firstDayOfMonth && sessionDate <= lastDayOfMonth) {
                const dayIndex = sessionDate.getDate() - 1;
                const weekdayEng = sessionDate.toLocaleDateString("en-US", { weekday: "long" });
                const sessionTime = cls.fixedSchedule?.[weekdayEng] || 'Không rõ giờ';

                const rolesAttended = staffAttendance[dateStr];

                // Cộng dồn ca và chi tiết ca, sử dụng lương theo lớp
                if (rolesAttended?.['Giáo Viên'] === true) {
                    dailyTeacherShifts[dayIndex]++;
                    totalTeacherShifts++;
                    if (!dailyShiftDetails[dateStr]) dailyShiftDetails[dateStr] = [];
                    dailyShiftDetails[dateStr].push(`Lớp: ${cls.name} (GV - ${sessionTime}) - Lương: ${salaryTeacherPerClass.toLocaleString('vi-VN')} VNĐ`);
                }
                if (rolesAttended?.['Trợ Giảng'] === true) {
                    dailyAssistantShifts[dayIndex]++;
                    totalAssistantShifts++;
                    if (!dailyShiftDetails[dateStr]) dailyShiftDetails[dateStr] = [];
                    dailyShiftDetails[dateStr].push(`Lớp: ${cls.name} (TG - ${sessionTime}) - Lương: ${salaryAssistantPerClass.toLocaleString('vi-VN')} VNĐ`);
                }
            }
        }
    }

    // Tính tổng lương cuối cùng
    let finalCalculatedSalary = 0;
    for (const classId in allClasses) { // Duyệt lại qua các lớp để tính tổng lương thực tế
        const cls = allClasses[classId];
        if (!cls) continue;

        let salaryTeacherPerClass = 0;
        let salaryAssistantPerClass = 0;
        if (cls.teacherUid === staffUid) salaryTeacherPerClass = cls.teacherSalary || 0;
        if (cls.assistantTeacherUid === staffUid) salaryAssistantPerClass = cls.assistantTeacherSalary || 0;

        const staffAttendanceInClass = allAttendanceData[classId]?.[staffUid];
        if (staffAttendanceInClass) {
            for (const dateStr in staffAttendanceInClass) {
                const sessionDate = new Date(dateStr);
                if (sessionDate >= firstDayOfMonth && sessionDate <= lastDayOfMonth) {
                    const rolesAttended = staffAttendanceInClass[dateStr];
                    if (rolesAttended?.['Giáo Viên'] === true) {
                        finalCalculatedSalary += salaryTeacherPerClass;
                    }
                    if (rolesAttended?.['Trợ Giảng'] === true) {
                        finalCalculatedSalary += salaryAssistantPerClass;
                    }
                }
            }
        }
    }

    // Cập nhật thông tin tóm tắt trên modal
    document.getElementById("summary-month-year").textContent = `${month}/${year}`;
    document.getElementById("total-monthly-salary").textContent = finalCalculatedSalary.toLocaleString('vi-VN'); // Dùng lương đã tính toán
    document.getElementById("total-teacher-shifts").textContent = totalTeacherShifts;
    document.getElementById("total-assistant-shifts").textContent = totalAssistantShifts;
    // Chuẩn bị dữ liệu cho biểu đồ
    const labels = Array.from({ length: daysInMonth }, (_, i) => i + 1); // Ngày 1, 2, 3...
    const teacherData = dailyTeacherShifts;
    const assistantData = dailyAssistantShifts;

    const ctx = document.getElementById('personnel-daily-chart').getContext('2d');

    // Nếu biểu đồ đã tồn tại, hủy nó đi để vẽ lại
    if (personnelChart) {
        personnelChart.destroy();
    }

    personnelChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Ca Giáo viên',
                    data: teacherData,
                    backgroundColor: 'rgba(0, 102, 204, 0.7)', // Màu xanh dương
                    borderColor: 'rgba(0, 102, 204, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Ca Trợ giảng',
                    data: assistantData,
                    backgroundColor: 'rgba(0, 74, 153, 0.7)', // Màu xanh đậm hơn
                    borderColor: 'rgba(0, 74, 153, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Ngày trong tháng'
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Số ca chấm công'
                    },
                    ticks: {
                        stepSize: 1 // Chỉ hiển thị số nguyên
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function(tooltipItems) {
                            return `Ngày ${tooltipItems[0].label}`;
                        },
                        label: function(context) {
                            const datasetLabel = context.dataset.label || '';
                            const value = context.parsed.y;
                            return `${datasetLabel}: ${value} ca`;
                        },
                        afterBody: function(tooltipItems) {
                            const day = tooltipItems[0].label;
                            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const details = dailyShiftDetails[dateStr];
                            if (details && details.length > 0) {
                                return '\nChi tiết:\n' + details.join('\n');
                            }
                            return '';
                        }
                    }
                }
            }
        }
    });

    // Cập nhật chi tiết chấm công theo ngày dưới biểu đồ
    const dailyShiftsList = document.getElementById("daily-shifts-list");
    dailyShiftsList.innerHTML = "";
    for (let i = 0; i < daysInMonth; i++) {
        const date = i + 1;
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
        const details = dailyShiftDetails[dateStr];
        if (details && details.length > 0) {
            const li = document.createElement("li");
            li.innerHTML = `<strong>Ngày ${date}:</strong><br>` + details.map(d => `- ${d}`).join('<br>');
            dailyShiftsList.appendChild(li);
        }
    }


    showLoading(false);
}
async function showSalaryDetailModal(staffUid) {
    if (!currentUserData) {
        Swal.fire("Lỗi", "Vui lòng đăng nhập.", "error");
        return;
    }
    const isAdminOrHoiDong = (currentUserData.role === "Admin" || currentUserData.role === "Hội Đồng");

    // Nếu không phải Admin/Hội Đồng VÀ không phải là chính mình, ngăn truy cập
    if (!isAdminOrHoiDong && staffUid !== currentUserData.uid) {
        Swal.fire("Truy cập bị từ chối", "Bạn chỉ có thể xem chi tiết lương của bản thân.", "warning");
        return;
    }

    showLoading(true);
    const staffData = allStaffData[staffUid];
    if (!staffData) {
        Swal.fire("Lỗi", "Không tìm thấy thông tin nhân sự.", "error");
        showLoading(false);
        return;
    }

    document.getElementById("salary-detail-name").textContent = `${staffData.name || staffData.email} (${staffData.role})`;

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    document.getElementById("salary-month-select").value = currentMonth;

    // Gán sự kiện onchange cho input tháng
    const salaryMonthSelect = document.getElementById("salary-month-select");
    salaryMonthSelect.onchange = () => renderPersonnelSalaryChart(staffUid, salaryMonthSelect.value);

    await renderPersonnelSalaryChart(staffUid, currentMonth);

    document.getElementById("salary-detail-modal").style.display = "flex";
    const modalContent = document.querySelector("#salary-detail-modal .modal-content");
    modalContent.classList.remove("scale-up");
    modalContent.offsetHeight;
    modalContent.classList.add("scale-up");
    showLoading(false);
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
/* function showClassListAndHideModal() {
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
} */
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
/*async function showHomeworkManagement() {
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
} */

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
function showClassAttendanceModal(className) {
  document.getElementById("class-attendance-modal-title").textContent = `Bảng điểm danh & Bài tập Lớp: ${className}`;
  document.getElementById("class-attendance-modal-overlay").style.display = "flex";
}
function hideClassAttendanceModal() {
  document.getElementById("class-attendance-modal-overlay").style.display = "none";
  // Hiển thị lại trang "Quản lý lớp học"
  document.getElementById("class-management").style.display = "block"; // HIỂN THỊ LẠI TRANG QUẢN LÝ LỚP HỌC
  
  // Bạn có thể không cần gọi initClassesListener() ở đây nếu nó đã được gọi khi hashchange
  // hoặc nếu bạn muốn cập nhật riêng bảng lớp
  // initClassesListener(); 
}
function scrollClassAttendanceBySessions(direction) {
  const scrollContainer = document.getElementById("class-attendance-scroll-container");
  const step = 120 * 5; // 5 cột, mỗi cột 120px min-width
  scrollContainer.scrollLeft += direction * step;
}
// script.js
// MỚI: Hiển thị bảng điểm danh & bài tập khi click "Điểm Danh"
async function showClassAttendanceAndHomeworkTable(classId) {
  showLoading(true); // Hiển thị loading ở đây
  await renderClassAttendanceTable(classId);
  showLoading(false); // Ẩn loading sau khi render xong
}

// MỚI: Hiển thị bảng điểm danh & bài tập khi click "Điểm Danh"
async function showClassAttendanceAndHomeworkTable(classId) {
  showLoading(true); // Hiển thị loading ở đây
  await renderClassAttendanceTable(classId);
  showLoading(false); // Ẩn loading sau khi render xong
}

async function renderClassAttendanceTable(classId) {
  let cls = null;

  try {
    const classSnap = await database.ref(`classes/${classId}`).once("value");
    cls = classSnap.val();
    if (!cls) {
      Swal.fire("Lỗi", "Lớp không tồn tại", "error");
      return;
    }

    // --- CẬP NHẬT PHẦN NÀY ĐỂ THAY ĐỔI TIÊU ĐỀ ---
    const className = cls.name || "Không rõ tên lớp";
    const teacherName = cls.teacher || "Chưa có Giáo viên";
    const assistantTeacherName = cls.assistantTeacher || "Không có Trợ giảng";

    // Format lịch học cố định
    let fixedScheduleText = "Chưa có lịch";
    if (cls.fixedSchedule && Object.keys(cls.fixedSchedule).length > 0) {
      const scheduleParts = Object.entries(cls.fixedSchedule)
                                  .map(([day, time]) => `${day.substring(0, 3)}: ${time}`); // VD: Mon: 18:00
      fixedScheduleText = scheduleParts.join(", ");
    }
    
    // Thiết lập tiêu đề đầy đủ
    document.getElementById("current-class-attendance-name").textContent = 
        `${className} - GV: ${teacherName} - TG: ${assistantTeacherName} - Lịch: [${fixedScheduleText}]`;
    // --- KẾT THÚC CẬP NHẬT PHẦN NÀY ---

    const students = cls.students || {};
    const fixedSchedule = cls.fixedSchedule || {};
    const startDate = cls.startDate || new Date().toISOString().split("T")[0];
    const sessions = generateRollingSessions(fixedSchedule, startDate, 3); // 3 tháng lịch tương lai

    const studentSnap = await database.ref("students").once("value");
    const allStudents = studentSnap.val() || {};
    const attSnap = await database.ref(`attendance/${classId}`).once("value");
    const attendance = attSnap.val() || {};
    const scoreSnap = await database.ref(`homeworkScores/${classId}`).once("value");
    const scores = scoreSnap.val() || {};

    const tableHeadRow = document.getElementById("class-attendance-table-head");
    const tableBody = document.getElementById("class-attendance-table-body");
    const scrollContainer = document.getElementById("class-attendance-scroll-container");

    tableBody.innerHTML = "";

    let headerHTML = `<th style="min-width: 180px; position: sticky; left: 0; background-color: #f3f6fb; z-index: 1;">Họ tên học viên</th>`;
    sessions.forEach((s) => {
      const d = new Date(s.date);
      const label = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
      headerHTML += `<th style="min-width: 120px;">${label}</th>`;
    });
    tableHeadRow.innerHTML = headerHTML;

    Object.keys(students).forEach(studentId => {
      const student = allStudents[studentId];
      if (!student) return;
      const sessionsAttended = student.sessionsAttended || 0;
      const totalSessionsPaid = student.totalSessionsPaid || 0;
      const remainingSessions = totalSessionsPaid - sessionsAttended;
       // --- LOGIC CẢNH BÁO MỚI ---
       let attendanceWarningClass = '';
      if (remainingSessions <= 0) {
          attendanceWarningClass = 'student-warning-critical'; // Mức đỏ
      } else if (remainingSessions <= 3) {
          attendanceWarningClass = 'student-warning-low'; // Mức vàng
      }
      // --- KẾT THÚC LOGIC ---
      const row = document.createElement("tr");
      const nameCell = document.createElement("td");
      nameCell.className = attendanceWarningClass; // Áp dụng lớp cảnh báo mới
      nameCell.textContent = `${student.name || "(Không rõ tên)"} (${student.dob || "N/A"})`;
      nameCell.style.position = "sticky";
      nameCell.style.left = "0";
      nameCell.style.backgroundColor = "#fff";
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

    document.getElementById("class-management").style.display = "none"; 

    document.getElementById("class-attendance-modal-overlay").style.display = "flex";

    setTimeout(() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const closestIndex = sessions.findIndex(s => new Date(s.date) >= today);

      if (closestIndex === -1) {
        scrollContainer.scrollLeft = scrollContainer.scrollWidth;
        return;
      }

      const firstDateColumn = tableHeadRow.children[1];
      if (!firstDateColumn) return;

      const columnWidth = firstDateColumn.offsetWidth;
      const scrollPosition = closestIndex * columnWidth;
      scrollContainer.scrollLeft = scrollPosition;

    }, 0);

  } catch (error) {
    console.error("Lỗi khi render bảng điểm danh/bài tập lớp:", error);
    Swal.fire("Lỗi", "Không thể tải bảng điểm danh: " + error.message, "error");
  } finally {
    // showLoading(false); // Đã di chuyển ra ngoài showClassAttendanceAndHomeworkTable
  }
}
/*
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
    const firstDateColumn = tableHeadRow.children[1];
    if (!firstDateColumn) return; // Thoát nếu không có cột nào

    const columnWidth = firstDateColumn.offsetWidth;
    const scrollPosition = closestIndex * columnWidth; // Changed from visibleStartIndex * columnWidth
    scrollContainer.scrollLeft = scrollPosition;

  }, 0); // Dùng setTimeout(..., 0) để đảm bảo trình duyệt đã render xong bảng
} 
  
// script.js

/**
 * HÀM NÂNG CẤP: Cập nhật trạng thái điểm danh và tăng/giảm số buổi đã học
 */
function toggleAttendance(classId, studentId, dateStr, isChecked) {
  database.ref(`attendance/${classId}/${studentId}/${dateStr}`).set(isChecked);

  const studentAttendedRef = database.ref(`students/${studentId}/sessionsAttended`);

  studentAttendedRef.transaction((currentSessionsAttended) => {
    const currentVal = currentSessionsAttended || 0;
    if (isChecked) {
      return currentVal + 1;
    } else {
      return Math.max(0, currentVal - 1);
    }
  }).then(() => {
      database.ref(DB_PATHS.STUDENTS).once("value").then(snapshot => {
          allStudentsData = snapshot.val() || {};
          renderStudentList(allStudentsData);
      });
  }).catch(error => {
      console.error("Lỗi cập nhật sessionsAttended:", error);
  });
}

function updateHomeworkScore(classId, studentId, dateStr, value) { // THÊM dateStr VÀO ĐÂY
  if (value === "") {
    database.ref(`homeworkScores/${classId}/${studentId}/${dateStr}`).remove(); // SỬ DỤNG dateStr
  } else {
    database.ref(`homeworkScores/${classId}/${studentId}/${dateStr}`).set(parseInt(value)); // SỬ DỤNG dateStr
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
/*async function renderHomeworkStudentList(classId) {
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
} */

// Quay lại danh sách học viên
/*function backToHomeworkStudents() {
  document.getElementById("homework-session-container").style.display = "none";
  document.getElementById("homework-student-container").style.display = "block";
  selectedHomeworkStudentId = null;
} */

// Render bảng session (ngày) kèm checkbox
/*async function renderHomeworkSessions(classId, studentId) {
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
} */

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
/* function filterHomeworkClassesBySearch() {
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
} */
document.addEventListener("DOMContentLoaded", () => {
    const hamburgerBtn = document.getElementById("hamburger-btn");
    const navLinks = document.getElementById("nav-links");

    if (hamburgerBtn && navLinks) {
        hamburgerBtn.addEventListener("click", () => {
            // Thêm hoặc xóa class 'show' để hiện/ẩn menu
            navLinks.classList.toggle("show");
        });
    }
    
    // Tự động ẩn menu khi người dùng nhấn vào một link
    navLinks.addEventListener('click', (event) => {
        if (event.target.tagName === 'A') {
            if (window.innerWidth <= 768) { // Chỉ ẩn trên di động
                 navLinks.classList.remove('show');
            }
        }
    });
});

// ===================== Loading =====================
function showLoading(show) {
  document.getElementById("loading").style.display = show ? "block" : "none";
}

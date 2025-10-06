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

let personnelListInitialized = false;
let scheduleEventListenersInitialized = false;
//let tempClassesData = {};
let selectedTempStudents = {};

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
  "student-management",
  "class-management",
  "account-management",
  "new-schedule-page",
  "personnel-management",
  "tuition-management",
  "profile-page",
  "trash-management",
  "activity-log-page"
];
// script.js
const PERSONNEL_MANAGEMENT_ROLES = ["Admin", "Hội Đồng"];
const PAYROLL_STAFF_ROLES = ["Giáo Viên", "Trợ Giảng"];
const BOOK_DATA = {
    english: [
        { name: "Explore our world", levelType: 'numeric', hasTypeSelector: true },
        { name: "World link", levelType: 'numeric', hasTypeSelector: true },
        { name: "Global success", levelType: 'numeric', hasTypeSelector: true },
        { name: "Oxford discover", levelType: 'numeric', hasTypeSelector: true },
        { name: "Oxford discover future", levelType: 'numeric', hasTypeSelector: true },
        { name: "Oxford Phonics World", levelType: 'numeric', hasTypeSelector: true },
        { name: "Get ready for ielts", levelType: 'none' }, // 'none' cho biết không có lựa chọn cấp độ
        { name: "Bài tập viết mầm non", levelType: 'none' }
    ],
    chinese: [
        { name: "HSK GT Chuẩn", levelType: 'numeric' },
        { name: "Boya", levelType: 'level', levels: ['Sơ cấp', 'Trung cấp', 'Cao cấp'] },
        { name: "Phát triển Giao tiếp tiếng Trung", levelType: 'level', levels: ['Sơ cấp', 'Trung cấp', 'Cao cấp'] }
    ]
};
// Thêm dữ liệu giá khóa học (ví dụ, bạn cần điều chỉnh cho đúng giá của mình)
const coursePrices = {
  ...(() => {
    const prices = {};
    const subjects = [
        "Văn", "Toán", "Tiếng Việt", "Thể Dục", "Hoá", "Vật Lý", "Ma Thuật Hắc Ám",
        "GDCD", "Đạo Đức", "Thể Thuật", "Tự Nhiên Xã Hội", "Lịch Sử", "Nhẫn Thuật", "Địa Lý"
    ];
    const combos = { "Combo 3X": 1200000, "Combo 6X": 2300000, "Combo 12X": 4250000 };

    for (const subject of subjects) {
        for (let grade = 1; grade <= 12; grade++) {
            for (const comboName in combos) {
                const key = `${subject} - Lớp ${grade} - ${comboName}`;
                prices[key] = combos[comboName];
            }
        }
    }
    return prices;
  })(),
  
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

  //Tiếng Trung phổ thông
   "Combo 3X: Tiếng Trung (Mầm non (<6 tuổi))": 1200000,
  "Combo 3X: Tiếng Trung (6-12 tuổi)": 1200000,
  "Combo 3X: Tiếng Trung (12+ tuổi)": 1200000,
  "Combo 6X: Tiếng Trung (Mầm non (<6 tuổi))": 2300000,
  "Combo 6X: Tiếng Trung (6-12 tuổi)": 2300000,
  "Combo 6X: Tiếng Trung (12+ tuổi)": 2300000,
  "Combo 12X: Tiếng Trung (Mầm non (<6 tuổi))": 4250000,
  "Combo 12X: Tiếng Trung (6-12 tuổi)": 4250000,
  "Combo 12X: Tiếng Trung (12+ tuổi)": 4250000,

  // HSK (và YCT sẽ lấy giá tương tự)
  "HSK1": 1760000,
  "HSK2": 2000000,
  "HSK3": 3650000,
  "HSK4": 5625000,
  "HSK5": 10000000,
  "HSKK sơ cấp": 840000,
  "HSKK trung cấp": 1840000,
  "HSKK cao cấp": 3620000,
  "Sơ cấp A1-A2": 5340000,
  "Trung cấp B1": 7680000,
  "Trung-cao cấp B2": 9990000,

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

let studentSortState = {
  key: null,      // 'createdAt' hoặc 'updatedAt'
  direction: 'none' // 'asc', 'desc', hoặc 'none'
};
let currentPersonnelClassId = null;
let classSizeChart = null;
let newStudentsChart = null;
let currentClassView = 'active';

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
const generalChineseCourses = [
    { combo: "Combo 3X", ageGroup: "Mầm non (<6 tuổi)", sessions: 24 },
    { combo: "Combo 3X", ageGroup: "6-12 tuổi", sessions: 24 },
    { combo: "Combo 3X", ageGroup: "12+ tuổi", sessions: 24 },
    { combo: "Combo 6X", ageGroup: "Mầm non (<6 tuổi)", sessions: 48 },
    { combo: "Combo 6X", ageGroup: "6-12 tuổi", sessions: 48 },
    { combo: "Combo 6X", ageGroup: "12+ tuổi", sessions: 48 },
    { combo: "Combo 12X", ageGroup: "Mầm non (<6 tuổi)", sessions: 96 },
    { combo: "Combo 12X", ageGroup: "6-12 tuổi", sessions: 96 },
    { combo: "Combo 12X", ageGroup: "12+ tuổi", sessions: 96 }
];
const schoolSubjects = [
    "Văn", "Toán", "Tiếng Việt", "Thể Dục", "Hoá", "Vật Lý", "Ma Thuật Hắc Ám",
        "GDCD", "Đạo Đức", "Thể Thuật", "Tự Nhiên Xã Hội", "Lịch Sử", "Nhẫn Thuật", "Địa Lý"
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
    { name: "HSK1", sessions: 22 }, { name: "HSK2", sessions: 25 }, { name: "HSK3", sessions: 35 }, { name: "HSK4", sessions: 50 }, { name: "HSK5", sessions: 80 },
    { name: "HSKK sơ cấp", sessions: 10 }, { name: "HSKK trung cấp", sessions: 18 }, { name: "HSKK cao cấp", sessions: 25 },
    { name: "Sơ cấp A1-A2", sessions: 45 }, { name: "Trung cấp B1", sessions: 65 }, { name: "Trung-cao cấp B2", sessions: 75 },
  ],
  YCT_BASE: [], // Sẽ được tạo tự động
   HSK: [
    // Khóa lẻ
    { name: "HSK1", sessions: 22 }, { name: "HSK2", sessions: 25 }, { name: "HSK3", sessions: 35 }, { name: "HSK4", sessions: 50 }, { name: "HSK5", sessions: 80 },
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
generalEnglishCourses.sort((a, b) => b.name.length - a.name.length);
for (const key in certificateCourses) {
    if (Array.isArray(certificateCourses[key])) {
        certificateCourses[key].sort((a, b) => b.name.length - a.name.length);
    }
}
// Thêm vào script.js, trước phần sử dụng showPageFromHash

// hoặc (curr || 0) - 1 nếu bỏ điểm danh

// Khi trạng thái xác thực thay đổi
auth.onAuthStateChanged(async (user) => {
  isAuthReady = true;

  // Ẩn tất cả các màn hình trước khi xử lý
  document.getElementById("auth-container").style.display = "none";
  document.getElementById("role-selection").style.display = "none";
  document.getElementById("pending-approval-screen").style.display = "none";
  document.getElementById("app-layout").style.display = "none";

  if (user) {
    const userSnapshot = await database.ref(`${DB_PATHS.USERS}/${user.uid}`).once("value");
    currentUserData = { uid: user.uid, ...userSnapshot.val() };

    if (!currentUserData.role) {
      // 1. Chưa có vai trò -> Bắt chọn vai trò
      document.getElementById("role-selection").style.display = "block";
    } else if (currentUserData.status === 'pending') {
      // 2. Đã có vai trò nhưng đang chờ duyệt -> Hiển thị màn hình chờ
      document.getElementById("pending-approval-screen").style.display = "flex";
    } else {
      // 3. Đã được duyệt -> Vào màn hình chính
      document.getElementById("app-layout").style.display = "flex";
      showLoading(true);
      try {
        await loadInitialData();
        initStudentsListener();
        initClassesListener();
        initUsersListener();
        setupDashboardUI(currentUserData);
        updateUIAccessByRole(currentUserData);
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        await showPageFromHash();
      } catch (error) {
         console.error("Lỗi nghiêm trọng khi khởi tạo:", error);
      } finally {
        showLoading(false);
      }
    }
  } else {
    // 4. Chưa đăng nhập -> Hiển thị form đăng nhập
    document.getElementById("auth-container").style.display = "flex";
    currentUserData = null;
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
            showForm('login');
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
    // Ẩn giao diện chính của ứng dụng
    document.getElementById("app-layout").style.display = "none";
    
    // Hiển thị lại màn hình đăng nhập với thuộc tính 'flex' để căn giữa
    document.getElementById("auth-container").style.display = "flex"; 

    // Các thao tác dọn dẹp khác
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
    Swal.fire("Lỗi", "Đã có lỗi: Vui lòng đăng nhập lại.", "error");
    return;
  }
  const selectedRole = document.getElementById("select-role").value;
  if (!selectedRole) {
    Swal.fire("Thông báo", "Vui lòng chọn một chức vụ!", "warning");
    return;
  }

  try {
    showLoading(true);
    // 1. Lưu chức vụ vào database như cũ
    await database.ref(`${DB_PATHS.USERS}/${user.uid}/role`).set(selectedRole);

    // 2. Ẩn màn hình chọn chức vụ
    hideElement("role-selection");

    // 3. HIỂN THỊ TRỰC TIẾP màn hình chờ duyệt
    document.getElementById("pending-approval-screen").style.display = "flex";

    // 4. Tắt loading
    showLoading(false);

  } catch (error) {
    showLoading(false);
    console.error("Lỗi khi lưu chức vụ:", error);
    Swal.fire("Lỗi", "Không thể lưu lựa chọn chức vụ của bạn.", "error");
  }
}
// Thiết lập UI Dashboard (hiển thị tên hoặc chức vụ)
async function setupDashboardUI(userData) {
    const displayHelloEl = document.getElementById("display-name-hello");
    if (displayHelloEl) {
        // Hiển thị tên người dùng trên sidebar
        displayHelloEl.textContent = userData.name || "Username"; 
    }
  
    const welcomeMessageEl = document.getElementById("welcome-message");
    if (welcomeMessageEl) {
        // Hiển thị lời chào trên dashboard
        welcomeMessageEl.textContent = `Chào mừng trở lại, ${userData.role}!`;
    }

    // Hiển thị avatar
    const avatarImg = document.getElementById("avatar-img");
    if(avatarImg && userData.avatarUrl) {
        avatarImg.src = userData.avatarUrl;
    }
}
/**
 * Hàm chính để gọi vẽ cả hai biểu đồ
 */
function renderDashboardCharts() {
    renderClassSizeChart();
    renderNewStudentsChart();
}

/**
 * Vẽ biểu đồ cột: Sĩ số 5 lớp đông nhất
 */
function renderClassSizeChart() {
    const ctx = document.getElementById('class-size-chart');
    if (!ctx) return;

    // 1. Xử lý dữ liệu
    const classArray = Object.values(allClassesData);
    classArray.sort((a, b) => {
        const sizeB = Object.keys(b.students || {}).length;
        const sizeA = Object.keys(a.students || {}).length;
        return sizeB - sizeA;
    });

    const top5Classes = classArray.slice(0, 5);
    const labels = top5Classes.map(cls => cls.name);
    const data = top5Classes.map(cls => Object.keys(cls.students || {}).length);

    // 2. Hủy biểu đồ cũ nếu tồn tại
    if (classSizeChart) {
        classSizeChart.destroy();
    }

    // 3. Vẽ biểu đồ mới
    classSizeChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Sĩ số',
                data: data,
                backgroundColor: 'rgba(0, 102, 204, 0.7)',
                borderColor: 'rgba(0, 102, 204, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            indexAxis: 'y', // Biểu đồ cột ngang để dễ đọc tên lớp
            plugins: { legend: { display: false } },
            scales: { x: { beginAtZero: true } }
        }
    });
}

/**
 * Vẽ biểu đồ đường: Học viên mới trong 6 tháng qua
 */
function renderNewStudentsChart() {
    const ctx = document.getElementById('new-students-chart');
    if (!ctx) return;

    // 1. Chuẩn bị dữ liệu 6 tháng gần nhất
    const months = [];
    const counts = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const month = d.getMonth() + 1;
        const year = d.getFullYear();
        months.push(`Thg ${month}/${year}`);
        counts.push(0); // Khởi tạo số đếm bằng 0
    }

    // 2. Đếm số học viên mới theo tháng
    Object.values(allStudentsData).forEach(student => {
        if (student.createdAt) {
            const createdDate = new Date(student.createdAt);
            const createdMonth = createdDate.getMonth();
            const createdYear = createdDate.getFullYear();

            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                if (d.getMonth() === createdMonth && d.getFullYear() === createdYear) {
                    counts[5 - i]++;
                    break;
                }
            }
        }
    });

    // 3. Hủy biểu đồ cũ nếu tồn tại
    if (newStudentsChart) {
        newStudentsChart.destroy();
    }

    // 4. Vẽ biểu đồ mới
    newStudentsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Học viên mới',
                data: counts,
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });
}
// === HÀM MỚI CHO ĐỒNG HỒ (CHUẨN GIỜ GMT+7) ===
function updateLiveClock() {
    const clockEl = document.getElementById("live-clock");
    if (!clockEl) return;

    // 1. Lấy thời gian hiện tại
    const localTime = new Date();

    // 2. Chuyển sang giờ UTC, sau đó cộng thêm 7 tiếng (tính bằng mili giây)
    const utcTime = localTime.getTime() + (localTime.getTimezoneOffset() * 60000);
    const hanoiTime = new Date(utcTime + (3600000 * 7));

    // 3. Lấy giờ, phút, giây từ thời gian Hà Nội đã được tính toán
    const h = String(hanoiTime.getHours()).padStart(2, '0');
    const m = String(hanoiTime.getMinutes()).padStart(2, '0');
    const s = String(hanoiTime.getSeconds()).padStart(2, '0');
    const ms = String(hanoiTime.getMilliseconds()).padStart(3, '0');

    clockEl.textContent = `${h} : ${m} : ${s} : ${ms}`;
}
function updateLiveDate() {
    const dateEl = document.getElementById("live-date");
    if (!dateEl) return;

    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    
    // Sử dụng locale 'vi-VN' để có định dạng tiếng Việt
    dateEl.textContent = now.toLocaleDateString('vi-VN', options);
}
// Quay lại Dashboard
function backToDashboard() {
  window.location.hash = "dashboard";
}
async function loadInitialData() {
    console.log("Bắt đầu tải dữ liệu ban đầu...");
    try {
        // Tải đồng thời cả 3 loại dữ liệu và chờ cho đến khi tất cả hoàn tất
        const [usersSnap, classesSnap, studentsSnap] = await Promise.all([
            database.ref(DB_PATHS.USERS).once('value'),
            database.ref(DB_PATHS.CLASSES).once('value'),
            database.ref(DB_PATHS.STUDENTS).once('value')
        ]);

        // Gán dữ liệu vào các biến toàn cục
        allUsersData = usersSnap.val() || {};
        allClassesData = classesSnap.val() || {};
        allStudentsData = studentsSnap.val() || {};
        
        console.log("Tải dữ liệu ban đầu thành công!");
    } catch (error) {
        console.error("Lỗi nghiêm trọng khi tải dữ liệu ban đầu:", error);
        Swal.fire("Lỗi kết nối", "Không thể tải dữ liệu từ server. Vui lòng kiểm tra kết nối mạng và thử lại.", "error");
        throw error; // Ném lỗi ra ngoài để hàm gọi nó biết và dừng lại
    }
}
// Chuyển trang theo hash
async function showPageFromHash() {
    const hash = window.location.hash.slice(1) || 'dashboard';

    // --- BƯỚC KIỂM TRA QUYỀN TRUY CẬP ---
    const isAuthorized = currentUserData && (currentUserData.role === 'Admin' || currentUserData.role === 'Hội Đồng');
    if (hash === 'trash-management' && !isAuthorized) {
        Swal.fire({
            icon: 'error',
            title: 'Truy cập bị từ chối',
            text: 'Bạn không có quyền truy cập chức năng này.',
        });
        window.location.hash = 'dashboard'; // Chuyển về trang chính
        return; // Dừng hàm tại đây
    }
    // --- KẾT THÚC BƯỚC KIỂM TRA ---

    if (!pages.includes(hash)) {
        window.location.hash = 'dashboard';
        return;
    }
    
    pages.forEach(pageId => {
        const el = document.getElementById(pageId);
        if (el) el.style.display = "none";
    });

    const targetPage = document.getElementById(hash);
    if (targetPage) {
        targetPage.style.display = "block";
    }

    switch (hash) {
        case 'dashboard':
            renderDashboardCharts();
            break;
        case 'student-management':
            populateClassFilterDropdown();
            renderStudentList(allStudentsData);
            break;
        case 'class-management':
            //renderClassList(allClassesData);
            showClassView('active');
            break;
         case 'new-schedule-page':
            renderNewSchedulePage();
            break;
        case 'personnel-management':
            initPersonnelManagement(); 
            break;
        case 'account-management':
            renderAccountList();
            break;
        case 'tuition-management':
           renderTuitionView('', 'fee');  // Render tab học phí
            renderTuitionView('', 'book');
            break;
        case 'trash-management':
            renderTrashPage();
            break;
        case 'activity-log-page':
            renderActivityLog();
             break;

    }
}
window.addEventListener("hashchange", () => {
  if (!isAuthReady) return;
  showPageFromHash();
});
// Khi load lần đầu nếu có hash và user đã xác thực
document.addEventListener("DOMContentLoaded", () => {
  populateTimeDropdowns();
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
    if(!accountListEl) {
        showLoading(false);
        return;
    }
    accountListEl.innerHTML = "";

    const users = allUsersData; 
    try {
        const sortedUsers = Object.entries(users).sort(([,a],[,b]) => (a.name || "").localeCompare(b.name || ""));

        for (const [uid, userData] of sortedUsers) {
            const row = document.createElement("tr");
            const userEmail = auth.currentUser?.uid === uid ? auth.currentUser.email : (userData.email || "N/A");
            
            // === LOGIC PHÂN QUYỀN NÚT BẤM MỚI ===
            let actionButtonHTML = '<td>Không có quyền</td>'; // Mặc định
            
            if (currentUserData.role === 'Admin') {
                // Admin có mọi quyền, trừ việc tự xóa mình
                if (currentUserData.uid !== uid) {
                    actionButtonHTML = `
                        <td>
                            <button onclick="showApproveAccountModal('${uid}')">${userData.status === 'pending' ? 'Duyệt' : 'Sửa'}</button>
                            <button class="delete-btn" onclick="deleteAccount('${uid}')">Xóa</button>
                        </td>`;
                } else {
                     actionButtonHTML = `<td><button onclick="showApproveAccountModal('${uid}')">Sửa</button></td>`;
                }
            } else if (currentUserData.role === 'Hội Đồng') {
                // Hội đồng có quyền với tất cả, trừ Admin
                if (userData.role !== 'Admin') {
                     actionButtonHTML = `
                        <td>
                            <button onclick="showApproveAccountModal('${uid}')">${userData.status === 'pending' ? 'Duyệt' : 'Sửa'}</button>
                            <button class="delete-btn" onclick="deleteAccount('${uid}')">Xóa</button>
                        </td>`;
                }
            }
            // ===================================

            row.innerHTML = `
                <td>${userEmail}</td>
                <td>${userData.name || ""}</td>
                <td>${(userEmail || "").split('@')[0]}</td>
                <td>${userData.role || "(Chưa có vai trò)"}</td>
                ${actionButtonHTML}
            `;
            accountListEl.appendChild(row);
        }
    } catch (error) {
        console.error("Lỗi khi tải danh sách tài khoản:", error);
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
        const modalContent = document.querySelector("#approve-account-modal .modal__content");
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
        // Lấy tên của user trước khi cập nhật
        const userSnap = await database.ref(`${DB_PATHS.USERS}/${currentApprovingUid}`).once('value');
        const targetUserName = userSnap.val()?.name || 'Không rõ';

        await database.ref(`${DB_PATHS.USERS}/${currentApprovingUid}`).update({
            role: selectedRole,
            status: "active",
            updatedAt: firebase.database.ServerValue.TIMESTAMP
        });
        await logActivity(`Đã duyệt/sửa vai trò cho "${targetUserName}" thành "${selectedRole}"`);
        Swal.fire({ icon: 'success', title: 'Đã cập nhật chức vụ!', timer: 2000, showConfirmButton: false });
        hideApproveAccountModal();
        renderAccountList();
    } catch (error) {
        console.error("Lỗi duyệt tài khoản:", error);
        Swal.fire("Lỗi", "Không thể duyệt tài khoản: " + error.message, "error");
    } finally {
        showLoading(false);
    }
}

async function deleteAccount(uid) {
    // Sử dụng Swal thay cho confirm để đẹp hơn
    const result = await Swal.fire({
        title: 'Bạn chắc chắn muốn xóa?',
        text: "Hành động này không thể hoàn tác!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonText: 'Hủy',
        confirmButtonText: 'Vâng, xóa nó!'
    });

    if (!result.isConfirmed) return;

    showLoading(true);
    try {
        // Lấy tên của user trước khi xóa
        const userSnap = await database.ref(`${DB_PATHS.USERS}/${uid}`).once('value');
        const targetUserName = userSnap.val()?.name || 'Không rõ';

        await database.ref(`${DB_PATHS.USERS}/${uid}`).remove();
        await logActivity(`Đã xóa tài khoản: ${targetUserName}`);

        if (auth.currentUser && auth.currentUser.uid === uid) {
            await auth.signOut();
        } else {
            Swal.fire({ icon: 'success', title: 'Đã xóa dữ liệu tài khoản trên Database!', text: 'Lưu ý: Chỉ Admin hệ thống mới có thể xóa tài khoản Auth thực sự.', timer: 3000, showConfirmButton: false });
        }
        renderAccountList();
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
        const studentData = snapshot.val();
        if (!studentData) throw new Error("Không tìm thấy học viên.");

        // Mở form và reset các lựa chọn gói học về trạng thái ban đầu
        showStudentForm(); 
        
        // Cập nhật tiêu đề và ID
        document.getElementById("student-form-title").textContent = `Gia hạn gói học cho ${studentData.name}`;
        document.getElementById("student-index").value = studentId;
        
        // Ẩn các trường thông tin cá nhân không cần thiết khi gia hạn
        const fieldsToHide = [
            "student-name", "student-dob", "student-address", 
            "contact-info-container", "student-parent-job"
        ];

        fieldsToHide.forEach(fieldId => {
            const el = document.getElementById(fieldId);
            if(el) {
                const fieldWrapper = el.closest('.form-grid__field');
                if(fieldWrapper) {
                    fieldWrapper.classList.add('form-field--hidden');
                }
                // Bỏ thuộc tính required để có thể submit form
                el.required = false;
            }
        });

    } catch (error) {
        console.error("Lỗi khi mở form gia hạn:", error);
        Swal.fire("Lỗi", "Không thể mở form gia hạn.", "error");
    } finally {
        showLoading(false);
    }
}
function calculateFinalPrice() {
    const originalPriceInput = document.getElementById('student-original-price');
    const totalDueInput = document.getElementById('student-total-due');
    const discountPercentInput = document.getElementById('student-discount-percent');
    const promotionPercentInput = document.getElementById('student-promotion-percent');

    const fullPackageName = document.getElementById('student-package').value;
    const courseNameForPriceLookup = fullPackageName.replace(/\s*\(\d+\s+buổi\)$/, '').trim();

    let basePrice = coursePrices[courseNameForPriceLookup] || 0;

    originalPriceInput.value = Math.round(basePrice);
    let finalPrice = basePrice;
    
    // ======================================================================
    // === SỬA LỖI TÍNH TOÁN NẰM Ở ĐÂY ===
    // ======================================================================
    let packageDiscountPercent = 0;
    // THÊM ĐIỀU KIỆN: Chỉ giảm giá nếu là gói Combo TIẾNG ANH
    if (courseNameForPriceLookup.includes("3X") && courseNameForPriceLookup.includes("Tiếng Anh")) packageDiscountPercent = 5;
    else if (courseNameForPriceLookup.includes("6X") && courseNameForPriceLookup.includes("Tiếng Anh")) packageDiscountPercent = 11;
    else if (courseNameForPriceLookup.includes("12X") && courseNameForPriceLookup.includes("Tiếng Anh")) packageDiscountPercent = 25;
    // Các logic giảm giá cho chứng chỉ khác giữ nguyên vì đã đủ cụ thể
    else if (courseNameForPriceLookup.includes('IELTS') && courseNameForPriceLookup.includes('Combo 2 khóa')) packageDiscountPercent = 20;
    else if (courseNameForPriceLookup.includes('IELTS') && courseNameForPriceLookup.includes('Combo 3 khóa')) packageDiscountPercent = 22;
    else if (courseNameForPriceLookup.includes('IELTS') && courseNameForPriceLookup.includes('Combo 4 khóa')) packageDiscountPercent = 25;
    else if (courseNameForPriceLookup.includes('IELTS') && courseNameForPriceLookup.includes('Combo 5 khóa')) packageDiscountPercent = 28;
    else if (courseNameForPriceLookup.includes('Combo HSK + HSKK: 2 khoá') || courseNameForPriceLookup.includes('Combo YCT + YCTK: 2 khoá')) packageDiscountPercent = 5;
    else if (courseNameForPriceLookup.includes('Combo HSK + HSKK: 3 khoá') || courseNameForPriceLookup.includes('Combo YCT + YCTK: 3 khoá')) packageDiscountPercent = 8;
    else if (courseNameForPriceLookup.includes('Combo HSK + HSKK: 4 khoá') || courseNameForPriceLookup.includes('Combo YCT + YCTK: 4 khoá')) packageDiscountPercent = 12;
    else if (courseNameForPriceLookup.includes('Combo HSK + HSKK: 5 khoá') || courseNameForPriceLookup.includes('Combo YCT + YCTK: 5 khoá')) packageDiscountPercent = 15;
    else if (courseNameForPriceLookup.includes('Combo Giao Tiếp: 2 khoá')) packageDiscountPercent = 10;
    else if (courseNameForPriceLookup.includes('Combo Giao Tiếp: 3 khoá')) packageDiscountPercent = 15;

    finalPrice *= (1 - packageDiscountPercent / 100);

    // Áp dụng chiết khấu YCT
    if (courseNameForPriceLookup.toLowerCase().includes('yct')) {
      finalPrice *= (1 - 10 / 100);
    }
    // ======================================================================
    // === KẾT THÚC SỬA LỖI ===
    // ======================================================================

    const discountCodePercent = parseFloat(discountPercentInput.value) || 0;
    finalPrice *= (1 - discountCodePercent / 100);

    const promotionPercent = parseFloat(promotionPercentInput.value) || 0;
    finalPrice *= (1 - promotionPercent / 100);
    
    totalDueInput.value = Math.round(finalPrice);
}
function populateSchoolSubjectDropdown() {
    const select = document.getElementById('school-subject-select');
    select.innerHTML = '<option value="">-- Chọn Môn --</option>';
    schoolSubjects.forEach(subject => {
        select.innerHTML += `<option value="${subject}">${subject}</option>`;
    });
}

/**
 * HÀM MỚI: Điền dữ liệu vào dropdown Khối lớp (1-12)
 */
function populateSchoolGradeDropdown() {
    const select = document.getElementById('school-grade-select');
    select.innerHTML = '<option value="">-- Chọn Lớp --</option>';
    for (let i = 1; i <= 12; i++) {
        select.innerHTML += `<option value="${i}">Lớp ${i}</option>`;
    }
}

/**
 * HÀM MỚI: Điền dữ liệu vào dropdown Combo (3X, 6X, 12X)
 */
function populateSchoolComboDropdown() {
    const select = document.getElementById('school-combo-select');
    select.innerHTML = '<option value="">-- Chọn Combo --</option>';
    ['Combo 3X', 'Combo 6X', 'Combo 12X'].forEach(combo => {
        select.innerHTML += `<option value="${combo}">${combo}</option>`;
    });
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
function populateGeneralChineseComboDropdown() {
    const comboSelect = document.getElementById('general-chinese-combo-select');
    comboSelect.innerHTML = '<option value="">-- Chọn Combo --</option>';
    // Lấy các giá trị combo duy nhất từ mảng dữ liệu
    const combos = [...new Set(generalChineseCourses.map(course => course.combo))];
    combos.forEach(combo => {
        const option = document.createElement('option');
        option.value = combo;
        option.textContent = combo;
        comboSelect.appendChild(option);
    });
}

/**
 * HÀM MỚI: Điền dữ liệu vào dropdown chọn Lứa tuổi Tiếng Trung
 */
function populateGeneralChineseAgeDropdown() {
    const ageSelect = document.getElementById('general-chinese-age-select');
    ageSelect.innerHTML = '<option value="">-- Chọn Lứa tuổi --</option>';
    // Lấy các giá trị lứa tuổi duy nhất
    const ageGroups = [...new Set(generalChineseCourses.map(course => course.ageGroup))];
    ageGroups.forEach(ageGroup => {
        const option = document.createElement('option');
        option.value = ageGroup;
        option.textContent = ageGroup;
        ageSelect.appendChild(option);
    });
}
function handleGeneralCourseTypeChange() {
    const selectedType = document.querySelector('input[name="general-type"]:checked').value;
    const englishContainer = document.getElementById('general-english-options-container');
    const chineseContainer = document.getElementById('general-chinese-options-container');

    englishContainer.classList.add('form-field--hidden');
    chineseContainer.classList.add('form-field--hidden');

    if (selectedType === 'english') {
        populateGeneralCourseDropdown();
        englishContainer.classList.remove('form-field--hidden');
    } else if (selectedType === 'chinese') {
        // Gọi 2 hàm populate mới
        populateGeneralChineseComboDropdown();
        populateGeneralChineseAgeDropdown();
        chineseContainer.classList.remove('form-field--hidden');
    }
    updateStudentPackageName();
}
/**
 * HÀM CẬP NHẬT
 * Xử lý khi người dùng thay đổi loại gói chính.
 */
function handlePackageTypeChange() {
    const packageType = document.getElementById('student-package-type').value;
    const generalTypeContainer = document.getElementById('general-course-type-container');
    const certificateContainer = document.getElementById('certificate-options-container');
    const schoolSubjectContainer = document.getElementById('school-subject-options-container');

    // Ẩn tất cả các container con trước
    document.getElementById('general-english-options-container').classList.add('form-field--hidden');
    document.getElementById('general-chinese-options-container').classList.add('form-field--hidden');
    certificateContainer.classList.add('form-field--hidden');
    generalTypeContainer.classList.add('form-field--hidden');
    schoolSubjectContainer.classList.add('form-field--hidden');
    document.getElementById('certificate-course-wrapper').classList.add('form-field--hidden');

    // Hiển thị container tương ứng với lựa chọn
    if (packageType === 'Phổ thông') {
        generalTypeContainer.classList.remove('form-field--hidden');
    } else if (packageType === 'Chứng chỉ') {
        certificateContainer.classList.remove('form-field--hidden');
    } else if (packageType === 'Các môn trên trường') {
        populateSchoolSubjectDropdown();
        populateSchoolGradeDropdown();
        populateSchoolComboDropdown();
        schoolSubjectContainer.classList.remove('form-field--hidden');
    }

    // Reset các lựa chọn cũ
    const generalRadios = document.getElementsByName('general-type');
    for(const radio of generalRadios) {
        radio.checked = false;
    }
    document.getElementById('student-certificate-type').value = '';
    
    updateStudentPackageName();
    calculateFinalPrice();
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

    // Nếu khóa học được chọn có 'selectionLimit', đó là một gói combo
    if (courseData && courseData.selectionLimit > 0) {
        generateComboCheckboxes(certType, courseData.selectionLimit);
        comboContainer.classList.remove('form-field--hidden'); // Hiển thị các ô checkbox
    } else {
        // Nếu không phải combo, ẩn các ô checkbox đi
        comboContainer.classList.add('form-field--hidden');
        document.getElementById('combo-checkboxes-list').innerHTML = '';
    }

    updateStudentPackageName();
    calculateFinalPrice();
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
    
    // Gán sự kiện onchange để gọi hàm xử lý khi chọn khóa học
    courseSelect.onchange = handleCourseSelection;
    
    courseSelect.innerHTML = '<option value="">-- Chọn khóa học --</option>';
    
    // Luôn ẩn container combo khi thay đổi loại chứng chỉ
    document.getElementById('combo-selection-container').classList.add('form-field--hidden');

    if (certType && certificateCourses[certType]) {
        certificateCourses[certType].forEach(course => {
            const option = document.createElement('option');
            option.value = course.name;
            const displayText = course.sessions ? `${course.name} (${course.sessions} buổi)` : course.name;
            option.textContent = displayText;
            courseSelect.appendChild(option);
        });
        courseWrapper.classList.remove('form-field--hidden');
    } else {
        courseWrapper.classList.add('form-field--hidden');
    }

    // Reset và tính toán lại sau khi điền xong
    updateStudentPackageName();
    calculateFinalPrice();
}

// updateStudentPackageName()
// updateStudentPackageName()
function updateStudentPackageName() {
    const packageType = document.getElementById('student-package-type').value;
    const packageInput = document.getElementById('student-package');
    const newPackageSessionsInput = document.getElementById('student-new-package-sessions');

    let finalPackageName = '';
    let totalSessionsOfNewPackage = 0;
    let selectedCourse = null;

    if (packageType === 'Phổ thông') {
        const generalTypeRadio = document.querySelector('input[name="general-type"]:checked');
        if (generalTypeRadio) {
            const generalType = generalTypeRadio.value;
            if (generalType === 'english') {
                const courseName = document.getElementById('general-english-course').value;
                if (courseName) selectedCourse = generalEnglishCourses.find(c => c.name === courseName);
            } else if (generalType === 'chinese') {
                const combo = document.getElementById('general-chinese-combo-select').value;
                const ageGroup = document.getElementById('general-chinese-age-select').value;
                if (combo && ageGroup) {
                    selectedCourse = generalChineseCourses.find(c => c.combo === combo && c.ageGroup === ageGroup);
                    if (selectedCourse) {
                        finalPackageName = `${combo}: Tiếng Trung (${ageGroup})`;
                    }
                }
            }
        }
    } else if (packageType === 'Chứng chỉ') {
        const certType = document.getElementById('student-certificate-type').value;
        const courseName = document.getElementById('student-certificate-course').value;
        if (certType && courseName) {
            selectedCourse = certificateCourses[certType]?.find(c => c.name === courseName);
        }
    } else if (packageType === 'Các môn trên trường') {
        const subject = document.getElementById('school-subject-select').value;
        const grade = document.getElementById('school-grade-select').value;
        const combo = document.getElementById('school-combo-select').value;

        if (subject && grade && combo) {
            finalPackageName = `${subject} - Lớp ${grade} - ${combo}`;
            const sessionMap = { "Combo 3X": 24, "Combo 6X": 48, "Combo 12X": 96 };
            totalSessionsOfNewPackage = sessionMap[combo] || 0;
        }
    }

    if (selectedCourse) {
        if (selectedCourse.selectionLimit > 0) {
            const checkedBoxes = document.querySelectorAll('#combo-checkboxes-list input:checked');
            const selectedNames = Array.from(checkedBoxes).map(box => {
                totalSessionsOfNewPackage += parseInt(box.dataset.sessions, 10);
                return box.value;
            });
            finalPackageName = selectedNames.length > 0 ? `${selectedCourse.name} (${selectedNames.join(' + ')})` : selectedCourse.name;
        } else {
            totalSessionsOfNewPackage = selectedCourse.sessions;
            if (!finalPackageName) {
                finalPackageName = selectedCourse.name;
            }
        }
    }

    packageInput.value = totalSessionsOfNewPackage > 0 ? `${finalPackageName} (${totalSessionsOfNewPackage} buổi)` : finalPackageName;
    newPackageSessionsInput.value = totalSessionsOfNewPackage;

    calculateFinalPrice();
}
function formatTimestamp(ts) {
  if (!ts) return "N/A";
  const date = new Date(ts);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  // Lấy 2 số cuối của năm
  const year = String(date.getFullYear()).slice(-2); 
  return `${day}/${month}/${year}`;
}
// Render danh sách học viên (phân trang)
function renderStudentList(dataset) {
  const studentEntries = Object.entries(dataset)
    .filter(([, st]) => st.status !== 'deleted');
  const totalStudents = studentEntries.length;
  const paidStudents = studentEntries.filter(([, st]) => st.package && st.package.trim() !== '').length;

  document.getElementById("total-students-display").innerHTML = `Tổng số: <strong>${totalStudents}</strong>`;
  document.getElementById("paid-students-display").innerHTML = `Đã đóng tiền: <strong>${paidStudents}</strong>`;

  totalStudentPages = Math.ceil(studentEntries.length / studentsPerPage);
  if (currentStudentPage > totalStudentPages) currentStudentPage = totalStudentPages;
  if (currentStudentPage < 1) currentStudentPage = 1;

  const startIndex = (currentStudentPage - 1) * studentsPerPage;
  const endIndex = startIndex + studentsPerPage;
  const currentPageStudents = studentEntries.slice(startIndex, endIndex);

  const tbody = document.getElementById("student-list");
  tbody.innerHTML = "";

  // *** LOGIC PHÂN QUYỀN BẮT ĐẦU TỪ ĐÂY ***
  //const canEditStudents = currentUserData && (currentUserData.role === "Admin" || currentUserData.role === "Hội Đồng");
const canEditStudents = currentUserData && (
    currentUserData.role === "Admin" || 
    currentUserData.role === "Hội Đồng" || 
    currentUserData.role === "Giáo Viên" || 
    currentUserData.role === "Trợ Giảng"
);
  currentPageStudents.forEach(([id, st]) => {
    let actionButtonsHTML = '';

     if (canEditStudents) {
      // SỬ DỤNG HÀM MỚI ĐỂ TÌM LỚP HỢP LỆ
      const activeClassId = findActiveStudentClassId(st); 

      actionButtonsHTML = `
        <button onclick="editStudent('${id}')">Sửa</button>
        <button onclick="showTransferModal('${id}')">Chuyển lớp</button>
        <button onclick="viewStudentSessions('${id}', '${activeClassId || ''}')" ${!activeClassId ? 'disabled' : ''}>Buổi học</button>
        <button onclick="showRenewPackageForm('${id}')">Gia hạn</button>
        <button class="delete-btn" onclick="deleteStudent('${id}')">Xóa</button>
      `;
    } else {
      // Nếu là vai trò khác, các nút sẽ hiển thị thông báo "không đủ thẩm quyền"
      const permissionAlert = "Swal.fire('Thẩm quyền', 'Bạn không có quyền thực hiện hành động này.', 'warning')";
      actionButtonsHTML = `
        <button onclick="${permissionAlert}">Sửa</button>
        <button onclick="${permissionAlert}"">Chuyển lớp</button> 
        <button onclick="${permissionAlert}">Buổi học</button>
        <button onclick="${permissionAlert}">Gia hạn</button>
        <button class="delete-btn" onclick="${permissionAlert}">Xóa</button>
      `;
    }

    const classIds = st.classes ? Object.keys(st.classes) : [];
    const firstClassId = classIds.length > 0 ? classIds[0] : "";
    const query = document.getElementById("student-search")?.value.toLowerCase() || "";

    function highlight(text) {
      if (!query || !text) return text;
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
    } else {
      displayPhone = st.parentPhone || "";
    }

    const sessionsAttended = st.sessionsAttended || 0;
    const totalSessionsPaid = st.totalSessionsPaid || 0;
    const remainingSessions = totalSessionsPaid - sessionsAttended;
    
     let warningClass = '';
    let iconHtml = '';
    if (remainingSessions <= 0) {
        warningClass = 'student-warning-critical';
    } else if (remainingSessions <= 3) {
        warningClass = 'student-warning-low';
        iconHtml = '<span class="warning-icon">&#9888;</span> '; // Dấu chấm than
    }
    const totalDueFormatted = (st.totalDue || 0).toLocaleString('vi-VN');
    const row = `
  <tr class="${isHighlight ? 'highlight-row' : ''}">
    <td data-label="Họ và tên" class="${warningClass}">${highlight(st.name || "")}</td>
    <td data-label="Năm sinh">${st.dob || ""}</td>
    <td data-label="Số điện thoại">${highlight(displayPhone)}</td>
    <td data-label="Gói đăng ký">${st.package || ""}</td>
    <td data-label="Ngày tạo">${formatTimestamp(st.createdAt)}</td>
    <td data-label="Ngày sửa đổi">${formatTimestamp(st.updatedAt)}</td>
    <td data-label="Học phí">${totalDueFormatted} VNĐ</td>
    <td data-label="Số buổi đã học" class="td-sessions-attended">${sessionsAttended}</td>
    <td data-label="Số buổi còn lại" class="td-sessions-remaining">${remainingSessions}</td>
    <td data-label="Hành động">${actionButtonsHTML}</td>
  </tr>`;
   
    tbody.insertAdjacentHTML("beforeend", row);
  });

  updateStudentPaginationControls();
}

/**
 * HÀM CẬP NHẬT: Thực hiện chuyển lớp và TỰ ĐỘNG ĐIỂM DANH ở lớp mới.
 */
async function showTransferModal(studentId) {
    showLoading(true);
    try {
        const student = allStudentsData[studentId];
        if (!student) throw new Error("Không tìm thấy học viên.");

        const activeClassId = findActiveStudentClassId(student);
        if (!activeClassId) {
            Swal.fire("Thông báo", "Học viên này hiện không ở trong lớp nào hợp lệ để chuyển.", "info");
            return;
        }

        const currentClass = allClassesData[activeClassId];

        document.getElementById('transfer-student-id').value = studentId;
        document.getElementById('transfer-student-name').textContent = student.name;
        document.getElementById('transfer-from-class-id').value = activeClassId;
        document.getElementById('transfer-from-class-name').textContent = currentClass.name;

        const toClassSelect = document.getElementById('transfer-to-class-select');
        toClassSelect.innerHTML = '<option value="">-- Chọn lớp mới --</option>';

        // --- THÊM ĐIỀU KIỆN LỌC CÁC LỚP ĐANG HOẠT ĐỘNG ---
        Object.entries(allClassesData)
            .filter(([classId, cls]) => {
                // Điều kiện lọc mới:
                // 1. Lớp phải đang hoạt động (status không phải 'completed' hay 'deleted')
                const isActive = !cls.status || cls.status === 'active';
                // 2. Không phải là lớp hiện tại của học viên
                return isActive && classId !== activeClassId;
            })
            .forEach(([classId, cls]) => {
                const option = document.createElement('option');
                option.value = classId;
                option.textContent = cls.name;
                toClassSelect.appendChild(option);
            });
        // --- KẾT THÚC PHẦN LỌC ---

        document.getElementById('transfer-student-modal').style.display = 'flex';

    } catch (error) {
        console.error("Lỗi khi mở form chuyển lớp:", error);
        Swal.fire("Lỗi", "Không thể mở form chuyển lớp: " + error.message, "error");
    } finally {
        showLoading(false);
    }
}
async function executeTransfer() {
    const studentId = document.getElementById('transfer-student-id').value;
    const oldClassId = document.getElementById('transfer-from-class-id').value;
    const newClassId = document.getElementById('transfer-to-class-select').value;
    const studentName = document.getElementById('transfer-student-name').textContent;

    if (!newClassId) {
        Swal.fire("Lỗi", "Vui lòng chọn một lớp để chuyển đến.", "warning");
        return;
    }

    // Thay đổi nội dung hộp thoại xác nhận cho phù hợp với logic mới
    const result = await Swal.fire({
        title: 'Xác nhận chuyển lớp?',
        text: `Hệ thống sẽ chuyển ${studentName} sang lớp mới và tự động điểm danh số buổi tương ứng đã học ở lớp cũ.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Vâng, xác nhận!',
        cancelButtonText: 'Hủy'
    });

    if (!result.isConfirmed) return;

    showLoading(true);
    try {
        // --- BƯỚC 1: Đếm số buổi đã điểm danh ở lớp cũ ---
        const oldAttendanceSnap = await database.ref(`attendance/${oldClassId}/${studentId}`).once('value');
        const oldAttendanceData = oldAttendanceSnap.val() || {};
        let attendedCount = 0;
        for (const date in oldAttendanceData) {
            if (oldAttendanceData[date].attended === true) {
                attendedCount++;
            }
        }

        // Nếu không có buổi nào đã học, chỉ cần chuyển lớp bình thường
        if (attendedCount === 0) {
            console.log("Học viên chưa học buổi nào, chỉ chuyển lớp.");
        }

        // --- BƯỚC 2: Chuẩn bị các lệnh cập nhật ---
        const updates = {};

        // 2.1. Cập nhật thành viên của các lớp
        updates[`/classes/${oldClassId}/students/${studentId}`] = null;
        updates[`/classes/${newClassId}/students/${studentId}`] = { enrolledAt: firebase.database.ServerValue.TIMESTAMP };
        
        // 2.2. Cập nhật thông tin lớp học của học viên
        updates[`/students/${studentId}/classes/${oldClassId}`] = null;
        updates[`/students/${studentId}/classes/${newClassId}`] = true;
        updates[`/students/${studentId}/updatedAt`] = firebase.database.ServerValue.TIMESTAMP;

        // QUAN TRỌNG: Không reset `sessionsAttended` nữa. Tổng số buổi học viên đã sử dụng từ gói của họ không đổi.

        // --- BƯỚC 3: Áp dụng điểm danh "ghi có" vào lớp mới ---
        if (attendedCount > 0) {
            const newClassData = allClassesData[newClassId];
            if (newClassData && newClassData.sessions) {
                // Sắp xếp các buổi học của lớp mới theo thứ tự thời gian
                const sortedNewSessions = Object.keys(newClassData.sessions).sort();
                
                // Lấy ra đúng số buổi đầu tiên để điểm danh
                const sessionsToAutoAttend = sortedNewSessions.slice(0, attendedCount);
                
                // Tạo các bản ghi điểm danh mới
                sessionsToAutoAttend.forEach(dateKey => {
                    updates[`/attendance/${newClassId}/${studentId}/${dateKey}`] = { attended: true };
                });
            }
        }

        // --- BƯỚC 4: Thực hiện tất cả các cập nhật ---
        await database.ref().update(updates);
        await logActivity(`Đã chuyển học viên "${studentName}" từ lớp ${allClassesData[oldClassId].name} sang lớp ${allClassesData[newClassId].name} (tự động điểm danh ${attendedCount} buổi).`);

        document.getElementById('transfer-student-modal').style.display = 'none';
        Swal.fire('Thành công!', `Đã chuyển lớp và tự động điểm danh ${attendedCount} buổi ở lớp mới.`, 'success');

    } catch (error) {
        console.error("Lỗi khi thực hiện chuyển lớp:", error);
        Swal.fire("Lỗi", "Đã xảy ra lỗi: " + error.message, "error");
    } finally {
        showLoading(false);
    }
}
// Lọc học viên theo input tìm kiếm
function filterStudentsBySearch() {
    // Chuyển tất cả logic lọc vào hàm mới
    applyStudentFilters();
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
     renderDashboardCharts();
    showLoading(false);
  });
}
/**
 * Hiển thị form thêm/sửa học viên.
 */
function showStudentForm() {
    // Gọi hàm reset mới để dọn dẹp cả giá trị và giao diện
    resetStudentFormState(); 
    
    document.getElementById("student-index").value = "";
    document.getElementById("student-form-title").textContent = "Tạo hồ sơ học viên mới";
    
    // Mở modal
    openStudentModal();
}
/**
 * Ẩn form thêm/sửa học viên.
 */
function hideStudentForm() {
    const modal = document.getElementById("student-form-modal");
    if (modal) {
        modal.style.display = "none";
    }

    // Hiển thị lại tất cả các trường có thể đã bị ẩn bởi form Gia hạn
    const allFields = modal.querySelectorAll('.form-field--hidden');
    allFields.forEach(field => {
        field.classList.remove('form-field--hidden');
    });

    // **QUAN TRỌNG**: Khôi phục lại thuộc tính 'required'
    document.getElementById("student-name").required = true;
    document.getElementById("student-dob").required = true;
}
// Lưu draft localStorage cho form học viên
function populateClassFilterDropdown() {
  const select = document.getElementById('student-filter-class');
  if (!select) return;

  select.innerHTML = '<option value="">-- Lọc theo lớp --</option>'; // Luôn có lựa chọn mặc định
  
  // Sắp xếp các lớp theo tên để dễ tìm
  const sortedClasses = Object.entries(allClassesData).sort(([, a], [, b]) => a.name.localeCompare(b.name));

  sortedClasses.forEach(([classId, classData]) => {
    const option = document.createElement('option');
    option.value = classId;
    option.textContent = classData.name;
    select.appendChild(option);
  });
}

function updateSortIcons() {
  // Xóa tất cả các icon cũ
  document.getElementById('sort-icon-createdAt').className = '';
  document.getElementById('sort-icon-updatedAt').className = '';

  if (studentSortState.direction !== 'none') {
    const iconEl = document.getElementById(`sort-icon-${studentSortState.key}`);
    if (iconEl) {
      // Thêm class để hiển thị mũi tên (cần CSS)
      iconEl.className = studentSortState.direction === 'asc' ? 'sort-asc' : 'sort-desc';
    }
  }
}

// THÊM HÀM MỚI NÀY
/**
 * Xử lý khi người dùng nhấp vào tiêu đề cột để sắp xếp
 * @param {'createdAt' | 'updatedAt'} key - Khóa để sắp xếp
 */
function sortStudentsBy(key) {
  if (studentSortState.key === key) {
    // Nếu đang sắp xếp cột này, xoay vòng trạng thái: asc -> desc -> none
    if (studentSortState.direction === 'asc') {
      studentSortState.direction = 'desc';
    } else if (studentSortState.direction === 'desc') {
      studentSortState.direction = 'none';
      studentSortState.key = null;
    }
  } else {
    // Nếu sắp xếp cột mới, bắt đầu bằng 'asc'
    studentSortState.key = key;
    studentSortState.direction = 'asc';
  }
  
  // Áp dụng lại bộ lọc và sắp xếp
  applyStudentFilters();
}
function applyStudentFilters() {
  const searchText = document.getElementById('student-search').value.toLowerCase().trim();
  const classId = document.getElementById('student-filter-class').value;

  let filteredStudents = Object.entries(allStudentsData);

  // Bước 1: Lọc (Filter)
  if (searchText) {
    filteredStudents = filteredStudents.filter(([, st]) => 
        (st.name || "").toLowerCase().includes(searchText) ||
        (st.phone || "").toLowerCase().includes(searchText) ||
        (st.parentPhone || "").toLowerCase().includes(searchText)
    );
  }
  if (classId) {
    filteredStudents = filteredStudents.filter(([, st]) => st.classes && st.classes[classId]);
  }

  // Bước 2: Sắp xếp (Sort) trên kết quả đã lọc
  if (studentSortState.direction !== 'none') {
    const { key, direction } = studentSortState;
    filteredStudents.sort(([, a], [, b]) => {
      const valA = a[key] || 0;
      const valB = b[key] || 0;
      if (direction === 'asc') {
        return valA - valB; // Tăng dần (cũ nhất -> mới nhất)
      } else {
        return valB - valA; // Giảm dần (mới nhất -> cũ nhất)
      }
    });
  }
  
  updateSortIcons(); // Cập nhật hiển thị mũi tên
  
  const finalFilteredData = Object.fromEntries(filteredStudents);
  currentStudentPage = 1; 
  renderStudentList(finalFilteredData);
}

// THAY THẾ HOÀN TOÀN HÀM resetStudentFilters CŨ
function resetStudentFilters() {
  document.getElementById('student-search').value = '';
  document.getElementById('student-filter-class').value = '';
  
  // Reset cả trạng thái sắp xếp
  studentSortState.key = null;
  studentSortState.direction = 'none';
  
  applyStudentFilters(); // Sẽ hiển thị lại danh sách gốc
}
// Lưu hoặc cập nhật học viên
async function saveStudent() {
    const user = auth.currentUser;
    if (!user) {
        Swal.fire("Lỗi", "Vui lòng đăng nhập để thêm hoặc sửa học viên!", "error");
        return;
    }

    const id = document.getElementById("student-index").value;
    let existingData = id ? (allStudentsData[id] || null) : null;
    const isRenewing = document.getElementById("student-form-title").textContent.includes("Gia hạn");
    
    // Biến để ghi log, sẽ được gán giá trị ở dưới
    let studentNameForLog = '';

    const studentData = {
        package: document.getElementById("student-package").value.trim(),
        discountPercent: parseInt(document.getElementById("student-discount-percent").value) || 0,
        promotionPercent: parseInt(document.getElementById("student-promotion-percent").value) || 0,
        originalPrice: parseInt(document.getElementById("student-original-price").value) || 0,
        totalDue: parseInt(document.getElementById("student-total-due").value) || 0,
        totalBookFeeDue: parseInt(document.getElementById("student-book-fee-due").value) || 0,
        updatedAt: firebase.database.ServerValue.TIMESTAMP
    };

    if (!isRenewing) {
        const name = document.getElementById("student-name").value.trim();
        const dob = document.getElementById("student-dob").value.trim();
        if (!name || !dob) {
            Swal.fire("Lỗi", "Vui lòng nhập đầy đủ Tên học viên và Năm sinh.", "error");
            return;
        }
        studentNameForLog = name;
        studentData.name = name;
        studentData.dob = dob;
        // ... (các trường dữ liệu cá nhân khác)
    } else if (existingData) {
        studentNameForLog = existingData.name;
        studentData.name = existingData.name;
        studentData.dob = existingData.dob;
        // ... (sao chép các trường dữ liệu cá nhân cũ)
    }

    const newPackageSessions = parseInt(document.getElementById("student-new-package-sessions").value) || 0;
    if (id && existingData) {
        // Cập nhật hoặc gia hạn
        studentData.sessionsAttended = existingData.sessionsAttended || 0;
        studentData.createdAt = existingData.createdAt;
        studentData.paymentHistory = existingData.paymentHistory || {};
        studentData.totalSessionsPaid = isRenewing 
            ? (existingData.totalSessionsPaid || 0) + newPackageSessions 
            : (newPackageSessions > 0 ? newPackageSessions : (existingData.totalSessionsPaid || 0));
    } else {
        // Tạo mới
        studentData.createdAt = firebase.database.ServerValue.TIMESTAMP;
        studentData.sessionsAttended = 0;
        studentData.totalSessionsPaid = newPackageSessions;
    }
  
    try {
        if (id) {
            await database.ref(`${DB_PATHS.STUDENTS}/${id}`).update(studentData);
            await logActivity(`Đã cập nhật hồ sơ học viên: "${studentNameForLog}"`);
            Swal.fire({ icon: 'success', title: 'Đã cập nhật!', timer: 2000, showConfirmButton: false });
        } else {
            await database.ref(DB_PATHS.STUDENTS).push(studentData);
            await logActivity(`Đã tạo hồ sơ học viên mới: "${studentNameForLog}"`);
            Swal.fire({ icon: 'success', title: 'Đã thêm!', timer: 2000, showConfirmButton: false });
        }
        hideStudentForm();
    } catch (error) {
        Swal.fire("Lỗi", "Lỗi lưu học viên: " + error.message, "error");
    }
}
// Xóa học viên
async function deleteStudent(id) {
    const result = await Swal.fire({
        title: 'Bạn muốn chuyển vào thùng rác?',
        text: "Học viên sẽ được chuyển vào thùng rác và có thể khôi phục sau.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonText: 'Hủy',
        confirmButtonText: 'Vâng, chuyển!'
    });

    if (result.isConfirmed) {
        showLoading(true);
        try {
            const studentName = allStudentsData[id]?.name || 'Không rõ tên';

            await database.ref(`${DB_PATHS.STUDENTS}/${id}`).update({
                status: 'deleted',
                deletedAt: firebase.database.ServerValue.TIMESTAMP
            });

            await logActivity(`Đã chuyển học viên vào thùng rác: ${studentName}`);
            
            Swal.fire('Đã chuyển!', 'Học viên đã được chuyển vào thùng rác.', 'success');
        } catch (error) {
            Swal.fire("Lỗi", "Không thể thực hiện: " + error.message, "error");
        } finally {
            showLoading(false);
        }
    }
}
// Hàm mới để khóa hoặc mở khóa form sửa học viên
function setStudentFormReadonly(isReadonly) {
  const form = document.getElementById("student-form");
  const elements = form.querySelectorAll("input, select, button");

  elements.forEach(el => {
    // Không khóa nút "Hủy" hoặc nút đóng modal
    if (el.type === 'button' && el.textContent.toLowerCase() === 'hủy') {
      el.disabled = false;
    } else {
      el.disabled = isReadonly;
    }
  });
}
function resetStudentFormState() {
    const studentForm = document.getElementById("student-form");
    if (studentForm) {
        studentForm.reset(); // Xóa trắng giá trị các ô input
    }
    
    // Ẩn tất cả các container lựa chọn con
    document.getElementById('general-course-type-container').classList.add('form-field--hidden');
    document.getElementById('general-english-options-container').classList.add('form-field--hidden');
    document.getElementById('general-chinese-options-container').classList.add('form-field--hidden');
    document.getElementById('certificate-options-container').classList.add('form-field--hidden');
    document.getElementById('school-subject-options-container').classList.add('form-field--hidden');
    document.getElementById('certificate-course-wrapper').classList.add('form-field--hidden');
    document.getElementById('combo-selection-container').classList.add('form-field--hidden');
}
// Chỉnh sửa học viên (đổ dữ liệu vào form)
async function editStudent(id) {
    showLoading(true);
    try {
        const snapshot = await database.ref(`${DB_PATHS.STUDENTS}/${id}`).once("value");
        const st = snapshot.val();
        if (!st) throw new Error("Không tìm thấy học viên.");

        showStudentForm();
        
        document.getElementById("student-form-title").textContent = "Chỉnh sửa học viên";
        document.getElementById("student-index").value = id;

        document.getElementById("student-name").value = st.name || "";
        document.getElementById("student-dob").value = st.dob || "";
        document.getElementById("student-address").value = st.address || "";
        handleAgeChange();
        setTimeout(() => {
            if (document.getElementById("student-phone")) document.getElementById("student-phone").value = st.phone || "";
            if (document.getElementById("student-parent")) document.getElementById("student-parent").value = st.parent || "";
            if (document.getElementById("student-parent-phone")) document.getElementById("student-parent-phone").value = st.parentPhone || "";
        }, 50);

        document.getElementById("student-package").value = st.package || "";
        document.getElementById("student-original-price").value = st.originalPrice || 0;
        document.getElementById("student-total-due").value = st.totalDue || 0;
        document.getElementById("student-discount-percent").value = st.discountPercent || 0;
        document.getElementById("student-promotion-percent").value = st.promotionPercent || 0;
        document.getElementById("student-book-fee-due").value = st.totalBookFeeDue || 0;
        const sessionsAttended = st.sessionsAttended || 0;
        const totalSessionsPaid = st.totalSessionsPaid || 0;
        document.getElementById("student-total-attended-sessions").value = sessionsAttended;
        document.getElementById("student-remaining-sessions-display").value = totalSessionsPaid - sessionsAttended;

        if (st.package) {
            const savedPackage = st.package.toLowerCase();
            let foundPackage = false;
            
            if (generalEnglishCourses.some(course => savedPackage.includes(course.name.toLowerCase()))) {
                document.getElementById('student-package-type').value = 'Phổ thông';
                handlePackageTypeChange();
                document.getElementById('radio-general-en').checked = true;
                handleGeneralCourseTypeChange();
                const courseName = generalEnglishCourses.find(c => savedPackage.includes(c.name.toLowerCase())).name;
                document.getElementById('general-english-course').value = courseName;
                foundPackage = true;
            } 
            else if (savedPackage.includes('tiếng trung')) {
                document.getElementById('student-package-type').value = 'Phổ thông';
                handlePackageTypeChange();
                document.getElementById('radio-general-zh').checked = true;
                handleGeneralCourseTypeChange();
                const comboMatch = st.package.match(/Combo \d+X/);
                const ageGroupMatch = st.package.match(/\(([^)]+)\)/);
                if (comboMatch && ageGroupMatch) {
                    document.getElementById('general-chinese-combo-select').value = comboMatch[0];
                    document.getElementById('general-chinese-age-select').value = ageGroupMatch[1];
                }
                foundPackage = true;
            }
            else if (schoolSubjects.some(subject => savedPackage.includes(subject.toLowerCase()))) {
                document.getElementById('student-package-type').value = 'Các môn trên trường';
                handlePackageTypeChange();
                const parts = st.package.split(' - ');
                if (parts.length === 3) {
                    const subject = parts[0].trim();
                    const grade = parts[1].replace('Lớp ', '').trim();
                    const combo = parts[2].replace(/\s*\(\d+\s+buổi\)$/, '').trim();
                    document.getElementById('school-subject-select').value = subject;
                    document.getElementById('school-grade-select').value = grade;
                    document.getElementById('school-combo-select').value = combo;
                }
                foundPackage = true;
            }
            
            if (!foundPackage) {
                for (const certTypeKey in certificateCourses) {
                    if (certTypeKey.includes('_BASE')) continue;
                    for (const course of certificateCourses[certTypeKey]) {
                        if (savedPackage.includes(course.name.toLowerCase())) {
                            document.getElementById('student-package-type').value = 'Chứng chỉ';
                            handlePackageTypeChange();
                            document.getElementById('student-certificate-type').value = certTypeKey;
                            populateCourseDropdown();
                            document.getElementById('student-certificate-course').value = course.name;
                            handleCourseSelection();
                            foundPackage = true;
                            break;
                        }
                    }
                    if (foundPackage) break;
                }
            }
        }
        
        updateStudentPackageName();
        calculateFinalPrice();

    } catch (error) {
        console.error("Lỗi khi sửa học viên:", error);
        Swal.fire("Lỗi", "Không thể tải dữ liệu học viên để sửa.", "error");
    } finally {
        showLoading(false);
    }
}
function openStudentModal() {
    const modal = document.getElementById("student-form-modal");
    if (modal) {
        modal.style.display = "flex";
    }
}
// Hiển thị hoặc ẩn ô “Nhập nghề nghiệp khác”
function parentJobChange(value) {
  document.getElementById("student-parent-job-other").style.display = (value === "Khác") ? "inline-block" : "none";
}

// ===================== Quản lý LỚP HỌC =====================

// Render danh sách lớp

// Mảng chứa các role được phép làm giáo viên hoặc trợ giảng
const TEACHER_ROLES = ["Giáo Viên", "Trợ Giảng"];
const ASSISTANT_TEACHER_ROLES = ["Giáo Viên", "Trợ Giảng"];
function renderClassList() {
    const tbody = document.getElementById("class-list");
    if (!tbody) return;
    tbody.innerHTML = "";

    let classesToRender = {};
    const isAdminOrHoiDong = currentUserData && (currentUserData.role === 'Admin' || currentUserData.role === 'Hội Đồng');

    if (isAdminOrHoiDong) {
        classesToRender = allClassesData;
    } else if (currentUserData && (currentUserData.role === 'Giáo Viên' || currentUserData.role === 'Trợ Giảng')) {
        const currentUid = currentUserData.uid;
        Object.entries(allClassesData).forEach(([classId, cls]) => {
            if (cls.teacherUid === currentUid || cls.assistantTeacherUid === currentUid) {
                classesToRender[classId] = cls;
            }
        });
    }
    
    const filteredClasses = Object.entries(classesToRender).filter(([, cls]) => {
        const isActive = !cls.status || cls.status === 'active';
        return currentClassView === 'active' ? isActive : cls.status === 'completed';
    });

    if (filteredClasses.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4">Không có lớp học nào trong mục này.</td></tr>`;
        return;
    }

    filteredClasses.sort(([, a], [, b]) => (a.name || "").localeCompare(b.name || ""));

    filteredClasses.forEach(([id, cls]) => {
        let actionButtonsHTML = '';
        if (currentClassView === 'active') {
            actionButtonsHTML = `
                <button onclick="showClassAttendanceAndHomeworkTable('${id}')">Điểm Danh</button>
                <button onclick="editClass('${id}')">Sửa</button>
                <button class="btn-restore" onclick="markClassAsCompleted('${id}')">Hoàn thành</button>
                <button class="delete-btn" onclick="deleteClass('${id}')">Xóa</button>
            `;
        } else {
            actionButtonsHTML = `
                <button onclick="showClassAttendanceAndHomeworkTable('${id}')">Xem Điểm danh</button>
                <button onclick="editOfficialClass('${id}', true)">Xem Thông tin</button>
                <button onclick="restoreClassFromCompleted('${id}')">Khôi phục</button>
                <button class="delete-btn" onclick="deleteClass('${id}')">Xóa</button>
            `;
        }

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${cls.name || ""}</td>
            <td>${cls.students ? Object.keys(cls.students).length : 0}</td>
            <td>${cls.teacher || ""}</td>
            <td>${actionButtonsHTML}</td>
        `;
        
        tr.dataset.classId = id; 
        tr.addEventListener("mouseenter", handleClassRowMouseEnter);
        tr.addEventListener("mousemove", handleClassRowMouseMove);
        tr.addEventListener("mouseleave", handleClassRowMouseLeave);
        
        tbody.appendChild(tr);
    });
}
/**
 * HÀM MỚI: Tìm ID của lớp học hợp lệ (còn tồn tại) từ hồ sơ của một học viên.
 * @param {object} studentData - Dữ liệu của học viên (st).
 * @returns {string|null} - Trả về ID của lớp hợp lệ, hoặc null nếu không tìm thấy.
 */
function findActiveStudentClassId(studentData) {
    if (!studentData || !studentData.classes) {
        return null;
    }
    const classIds = Object.keys(studentData.classes);
    // Duyệt qua danh sách ID lớp của học viên
    for (const classId of classIds) {
        // Kiểm tra xem ID này có tồn tại trong danh sách tất cả các lớp đang hoạt động không
        if (allClassesData[classId]) {
            return classId; // Tìm thấy, trả về ngay lập tức
        }
    }
    return null; // Không tìm thấy lớp nào hợp lệ
}
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
function showClassView(viewType) {
    currentClassView = viewType; // Cập nhật trạng thái view hiện tại

    // Cập nhật giao diện cho nút tab
    document.getElementById('btn-active-classes').classList.toggle('active', viewType === 'active');
    document.getElementById('btn-completed-classes').classList.toggle('active', viewType === 'completed');

    // Vẽ lại danh sách lớp học theo view đã chọn
    renderClassList();
}

// HÀM MỚI: Đánh dấu một lớp đã hoàn thành
async function markClassAsCompleted(classId) {
    const result = await Swal.fire({
        title: 'Xác nhận hoàn thành lớp?',
        text: "Lớp học sẽ được chuyển sang mục 'Đã hoàn thành'.",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonText: 'Hủy',
        confirmButtonText: 'Vâng, đã hoàn thành!'
    });

    if (result.isConfirmed) {
        await database.ref(`${DB_PATHS.CLASSES}/${classId}`).update({ status: 'completed' });
        Swal.fire('Thành công!', 'Lớp học đã được chuyển trạng thái.', 'success');
        renderClassList(); // Tải lại danh sách
    }
}

// HÀM MỚI: Khôi phục một lớp từ mục hoàn thành về lại hoạt động
async function restoreClassFromCompleted(classId) {
    await database.ref(`${DB_PATHS.CLASSES}/${classId}`).update({ status: 'active' });
    Swal.fire('Đã khôi phục!', 'Lớp học đã trở lại danh sách hoạt động.', 'success');
    renderClassList(); // Tải lại danh sách
}
async function editClass(id) {
    const classData = allClassesData[id];
    if (!classData) {
        Swal.fire("Lỗi", "Không tìm thấy dữ liệu lớp học!", "error");
        return;
    }

    // --- LOGIC NHẬN DIỆN MỚI ---
   let isConsideredTemp = false;

    // 1. Ưu tiên kiểm tra cờ 'isTemporary' có được đặt tường minh hay không
    if (classData.isTemporary === true) {
        isConsideredTemp = true;
    // 2. Sau đó, kiểm tra loại lớp 'classType' đã được lưu
    } else if (classData.classType === 'Lớp tiếng Anh phổ thông' || classData.classType === 'Lớp chứng chỉ' || classData.classType === 'Lớp các môn trên trường') {
    isConsideredTemp = false; // Đây chắc chắn là lớp chính thức, không phải lớp tạm thời
    // 3. Cuối cùng, mới dùng tên lớp để "đoán" cho các trường hợp khác hoặc dữ liệu cũ (fallback)
    } else {
        const subject = getSubjectClass(classData.name);
        if (subject === 'subject-default') {
            isConsideredTemp = true;
        }
    }
    // --- KẾT THÚC LOGIC MỚI ---

    if (isConsideredTemp) {
        // Mở form cho lớp tạm thời / lớp có màu xám
        editTempClass(id, classData);
    } else {
        // Mở form cho lớp chính thức
        editOfficialClass(id); // Chỉ cần truyền ID, hàm này sẽ tự lấy data
    }
}
// Chỉnh sửa lớp (đổ dữ liệu vào form)
async function editOfficialClass(id, isReadOnly = false) {
    showLoading(true);
    document.getElementById("class-form-modal").style.display = "flex";
    document.getElementById("class-form-title").textContent = isReadOnly ? "Xem thông tin lớp học" : "Chỉnh sửa lớp học";

    try {
        const snapshot = await database.ref(`${DB_PATHS.CLASSES}/${id}`).once("value");
        const cls = snapshot.val();
        if (!cls) throw new Error("Lớp học không tồn tại!");

        document.getElementById("class-index").value = id;
        document.getElementById("class-name").value = cls.name || "";
        document.getElementById("class-start-date").value = cls.startDate || "";
        document.getElementById("class-room").value = cls.room || "Phòng 301";

        await populateTeacherDropdown();
        document.getElementById("class-teacher").value = cls.teacher || "";
        await populateAssistantTeacherDropdown();
        document.getElementById("class-assistant-teacher").value = cls.assistantTeacher || "";

        const classTypeSelect = document.getElementById('class-type-select');
        classTypeSelect.value = cls.classType || "";
        handleClassTypeChange();

        setTimeout(() => {
            if (cls.classType === 'Lớp chứng chỉ') {
                const certTypeSelect = document.getElementById('class-certificate-type-select');
                certTypeSelect.value = cls.certificateType || "";
                populateClassCertificateCourseDropdown();

                setTimeout(() => {
                    const courseSelect = document.getElementById('class-course-select');
                    courseSelect.value = cls.courseName || "";
                }, 100);
            }
        }, 100);

        await updateStudentOptionsForClassForm();
        currentClassStudents = cls.students ? Object.keys(cls.students) : [];
        renderClassStudentList(currentClassStudents);
        fillFixedScheduleIntoForm(cls.fixedSchedule);

        const form = document.getElementById('class-form');
        const footer = form.parentElement.querySelector('.modal__footer');
        const saveButton = footer.querySelector('.modal__button--save');
        const formElements = form.querySelectorAll('input, select, button, fieldset');

        if (isReadOnly) {
            formElements.forEach(el => el.disabled = true);
            if (saveButton) saveButton.style.display = 'none';
            document.getElementById("btn-change-schedule").style.display = "none";
        } else {
            formElements.forEach(el => el.disabled = false);
            if (saveButton) saveButton.style.display = 'inline-block';
            document.getElementById("class-start-date").disabled = true;
            document.getElementById("fieldset-fixed-schedule").disabled = true;
            document.getElementById("btn-change-schedule").style.display = "block";
        }

        const classAddWrapper = document.getElementById("class-add-wrapper");
        if (classAddWrapper) {
            classAddWrapper.style.display = isReadOnly ? "none" : "block";
        }

    } catch (err) {
        console.error("Lỗi tải lớp học:", err);
        Swal.fire("Lỗi", "Lỗi tải lớp học: " + err.message, "error");
    } finally {
        showLoading(false);
     const modalContent = document.querySelector("#class-form-modal .modal__content");
        modalContent.classList.remove("scale-up");
        modalContent.offsetHeight;
        modalContent.classList.add("scale-up");
    }
}
/**
 * Xử lý khi người dùng thay đổi loại lớp học chính.
 */
function handleClassTypeChange() {
    const classType = document.getElementById('class-type-select').value;
    const certificateOptions = document.getElementById('class-certificate-options-container');

    if (classType === 'Lớp chứng chỉ') {
        certificateOptions.classList.remove('form-field--hidden'); // Sửa ở đây
        populateClassCertificateTypeDropdown();
    } else {
        certificateOptions.classList.add('form-field--hidden'); // Và ở đây
    }
}
/**
 * Điền vào dropdown lựa chọn loại chứng chỉ (IELTS, HSK...).
 */
function populateClassCertificateTypeDropdown() {
    const select = document.getElementById('class-certificate-type-select');
    select.innerHTML = '<option value="">-- Chọn loại chứng chỉ --</option>';

    // Lấy các key từ object certificateCourses và loại bỏ các key không cần thiết
    const certificateTypes = Object.keys(certificateCourses).filter(
        type => !type.includes('_BASE')
    );

    certificateTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        select.appendChild(option);
    });
    // Reset dropdown khóa học con
    document.getElementById('class-course-select').innerHTML = '';
}

/**
 * Điền vào dropdown lựa chọn khóa học cụ thể dựa trên loại chứng chỉ đã chọn.
 * Hàm này chỉ lấy các khóa học đơn, không lấy combo.
 */
function populateClassCertificateCourseDropdown() {
    const certType = document.getElementById('class-certificate-type-select').value;
    const courseSelect = document.getElementById('class-course-select');
    courseSelect.innerHTML = '<option value="">-- Chọn khóa học --</option>';

    if (!certType) return;

    // Lọc để chỉ lấy các khóa học đơn (không chứa "combo" và không có selectionLimit)
    const singleCourses = (certificateCourses[certType] || []).filter(
        course => !course.name.toLowerCase().includes('combo') && !course.selectionLimit
    );

    singleCourses.forEach(course => {
        const option = document.createElement('option');
        option.value = course.name;
        option.textContent = `${course.name} (${course.sessions} buổi)`;
        courseSelect.appendChild(option);
    });
}
// Hiển thị form tạo lớp
async function showClassForm() {
  currentClassStudents = [];
  document.getElementById("class-form-title").textContent = "Tạo lớp học mới";
  document.getElementById("class-form").reset();
  document.getElementById("class-index").value = "";

  // Bật lại (mở khóa) trường ngày bắt đầu
  document.getElementById("class-start-date").disabled = false; // <-- THÊM DÒNG NÀY

  document.getElementById('class-certificate-options-container').classList.add('form-field-hidden');

  renderClassStudentList([]);
  await updateStudentOptionsForClassForm();
  await populateTeacherDropdown();
  await populateAssistantTeacherDropdown();

  fillFixedScheduleIntoForm(null); // Sử dụng hàm hỗ trợ mới
  
  // Cho phép đặt lịch khi tạo mới và ẩn nút thay đổi
  document.getElementById("fieldset-fixed-schedule").disabled = false; 
  document.getElementById("btn-change-schedule").style.display = "none";

  const classAddWrapper = document.getElementById("class-add-wrapper");
  if (classAddWrapper) {
    classAddWrapper.style.display = "block";
  }

  document.getElementById("class-form-modal").style.display = "flex";
  //document.getElementById("class-form-container").style.display = "block";
  const modalContent = document.querySelector("#class-form-modal .modal__content");
  modalContent.classList.remove("scale-up");
  modalContent.offsetHeight;
  modalContent.classList.add("scale-up");
}
// Ẩn form lớp học
function hideClassForm() {
  document.getElementById("class-form-modal").style.display = "none";
 // document.getElementById("class-form-container").style.display = "none";
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
async function saveClass(event) {
    event.preventDefault();
    showLoading(true);

    const classId = document.getElementById("class-index").value; // Sẽ có giá trị nếu là sửa lớp
    
    // Lấy <select> element thay vì chỉ lấy value
    const teacherSelect = document.getElementById("class-teacher");
    const assistantTeacherSelect = document.getElementById("class-assistant-teacher");

    // Lấy tất cả thông tin từ form
    const classData = {
        name: document.getElementById("class-name").value.trim(),
        classType: document.getElementById('class-type-select').value,
        certificateType: document.getElementById('class-certificate-type-select').value,
        courseName: document.getElementById('class-course-select').value,
        
        // === PHẦN SỬA LỖI NẰM Ở ĐÂY ===
        // Lấy .value (tên giáo viên) thay vì .text (tên + chức vụ)
        teacher: teacherSelect.value, 
        teacherUid: teacherSelect.options[teacherSelect.selectedIndex].dataset.uid || '',
        assistantTeacher: assistantTeacherSelect.value,
        assistantTeacherUid: assistantTeacherSelect.value ? assistantTeacherSelect.options[assistantTeacherSelect.selectedIndex].dataset.uid : '',
        // ==============================

        room: document.getElementById("class-room").value,
        startDate: document.getElementById("class-start-date").value,
        updatedAt: firebase.database.ServerValue.TIMESTAMP
    };

    // --- LOGIC XỬ LÝ DANH SÁCH HỌC VIÊN ---
    const newStudentsObject = {};
    currentClassStudents.forEach(studentId => {
        newStudentsObject[studentId] = {
            enrolledAt: firebase.database.ServerValue.TIMESTAMP
        };
    });
    classData.students = newStudentsObject;

    try {
        if (classId) {
            // --- TRƯỜNG HỢP SỬA LỚP ---
            const updates = {};
            const oldClassData = allClassesData[classId];
            const oldStudentIds = oldClassData.students ? Object.keys(oldClassData.students) : [];
            
            // Cập nhật thông tin lớp học (giữ lại các thuộc tính không có trên form)
            updates[`/classes/${classId}`] = { ...oldClassData, ...classData };

            const addedStudents = currentClassStudents.filter(id => !oldStudentIds.includes(id));
            addedStudents.forEach(studentId => {
                updates[`/students/${studentId}/classes/${classId}`] = true;
            });

            const removedStudents = oldStudentIds.filter(id => !currentClassStudents.includes(id));
            removedStudents.forEach(studentId => {
                updates[`/students/${studentId}/classes/${classId}`] = null;
            });

            await database.ref().update(updates);
            await logActivity(`Đã tạo/cập nhật lớp: ${classData.name}`);
            Swal.fire({ icon: 'success', title: 'Đã cập nhật lớp học!', timer: 2000, showConfirmButton: false });
            
        } else {
            // --- TRƯỜNG HỢP TẠO LỚP MỚI ---
            const fixedSchedule = getFixedScheduleFromForm();
            if (Object.keys(fixedSchedule).length === 0) { throw new Error("Lớp mới phải có lịch học."); }
            classData.fixedSchedule = fixedSchedule;
            classData.createdAt = firebase.database.ServerValue.TIMESTAMP;
            
            let sessionCount = (classData.classType === 'Lớp chứng chỉ')
                ? (certificateCourses[classData.certificateType]?.find(c => c.name === classData.courseName)?.sessions || 0)
                : 72; // Giả sử mặc định 72 buổi cho lớp phổ thông
            if (sessionCount <= 0 && classData.classType === 'Lớp chứng chỉ') { throw new Error("Không thể xác định số buổi học."); }
            
            classData.sessions = generateRollingSessions(classData.startDate, sessionCount, fixedSchedule);
            
            const updates = {};
            const newClassRef = database.ref('classes').push();
            const newClassId = newClassRef.key;
            updates[`/classes/${newClassId}`] = classData;

            currentClassStudents.forEach(studentId => {
                updates[`/students/${studentId}/classes/${newClassId}`] = true;
            });
            
            await database.ref().update(updates);
            Swal.fire({ icon: 'success', title: 'Đã tạo lớp học mới!', timer: 2000, showConfirmButton: false });
        }
        hideClassForm();
    } catch (error) {
        console.error("Lỗi khi lưu lớp học:", error);
        Swal.fire("Lỗi", "Lỗi lưu lớp học: " + error.message, "error");
    } finally {
        showLoading(false);
    }
}
// Xóa lớp học
async function deleteClass(id) {
    const result = await Swal.fire({
        title: 'Bạn muốn chuyển vào thùng rác?',
        text: "Lớp học sẽ được chuyển vào thùng rác và có thể khôi phục sau.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonText: 'Hủy',
        confirmButtonText: 'Vâng, chuyển!'
    });

    if (result.isConfirmed) {
        showLoading(true);
        try {
            const className = allClassesData[id]?.name || 'Không rõ tên';

            await database.ref(`${DB_PATHS.CLASSES}/${id}`).update({
                status: 'deleted',
                deletedAt: firebase.database.ServerValue.TIMESTAMP
            });

            await logActivity(`Đã chuyển lớp vào thùng rác: ${className}`);
            
            Swal.fire('Đã chuyển!', 'Lớp học đã được chuyển vào thùng rác.', 'success');
        } catch (error) {
            Swal.fire("Lỗi", "Không thể thực hiện: " + error.message, "error");
        } finally {
            showLoading(false);
        }
    }
}
// Lấy lịch cố định từ form
function getFixedScheduleFromForm() {
  const schedule = {};
  // Ánh xạ từ key của checkbox (sun, mon,...) sang chỉ số ngày (0-6)
  const dayKeyToIndex = { "sun": 0, "mon": 1, "tue": 2, "wed": 3, "thu": 4, "fri": 5, "sat": 6 };

  document.querySelectorAll("input[name='schedule-day']:checked").forEach(checkbox => {
    const dayKey = checkbox.id.split("-")[1]; // "sun", "mon",...
    const dayIndex = dayKeyToIndex[dayKey];   // 0, 1,...
    
    const hour = document.getElementById(`hour-${dayKey}`).value;
    const minute = document.getElementById(`minute-${dayKey}`).value;

    if (hour && minute) {
      // Dùng SỐ làm key thay vì chữ
      schedule[dayIndex] = `${hour}:${minute}`;
    }
  });

  return schedule;
}
// Điền form với lịch cố định có sẵn
function editTempClass(id, classData) {
    const modal = document.getElementById('temp-class-form-modal');
    const form = document.getElementById('temp-class-form');
    form.reset();
    
    document.getElementById('temp-class-form-title').textContent = "Sửa lớp học tạm thời";
    
    // Gán ID vào một trường ẩn để hàm saveTempClass biết là đang sửa
    let idInput = document.getElementById('temp-class-id');
    if (!idInput) {
        idInput = document.createElement('input');
        idInput.type = 'hidden';
        idInput.id = 'temp-class-id';
        form.prepend(idInput);
    }
    idInput.value = id;

    // Điền dữ liệu vào form
    document.getElementById('temp-class-name').value = classData.name || '';
    document.getElementById('temp-class-start-date').value = classData.startDate || '';
    
    // Điền vào dropdown giáo viên, trợ giảng và lịch học
    populatePersonnelDropdown(document.getElementById('temp-class-teacher'));
    populatePersonnelDropdown(document.getElementById('temp-class-assistant'));
    
    setTimeout(() => { // Dùng setTimeout để đảm bảo dropdown đã được điền
        document.getElementById('temp-class-teacher').value = classData.teacher || '';
        document.getElementById('temp-class-assistant').value = classData.assistantTeacher || '';
    }, 100);

    // Cần một hàm để điền lại lịch học cũ
    fillFixedScheduleIntoForm(classData.fixedSchedule, 'temp-');
    
    // Xử lý danh sách học viên
    selectedTempStudents = classData.students ? Object.fromEntries(Object.entries(classData.students).map(([id, data]) => [id, data.studentName || allStudentsData[id]?.name || 'Học viên'])) : {};
    updateSelectedTempStudentsUI();
    setupStudentSearchForTempClass();

    modal.style.display = 'flex';
}

// HÀM HỖ TRỢ MỚI: điền lịch học có sẵn vào form
function fillFixedScheduleIntoForm(schedule, prefix = '') {
    // Reset tất cả checkbox
    document.querySelectorAll(`input[name='${prefix}schedule-day']`).forEach(cb => cb.checked = false);

    if (!schedule) return;

    const dayIndexToKey = { 0: "sun", 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat" };
    Object.entries(schedule).forEach(([dayIndex, time]) => {
        const dayKey = dayIndexToKey[dayIndex];
        if (dayKey) {
            const checkbox = document.getElementById(`${prefix}schedule-${dayKey}`);
            const hourSelect = document.getElementById(`${prefix}hour-${dayKey}`);
            const minuteSelect = document.getElementById(`${prefix}minute-${dayKey}`);
            
            if (checkbox && hourSelect && minuteSelect) {
                checkbox.checked = true;
                const [hour, minute] = time.split(":");
                hourSelect.value = hour;
                minuteSelect.value = minute;
            }
        }
    });
}
// Hàm fillFixedScheduleForm cần được cập nhật để dùng cho cả 2 form
function fillFixedScheduleForm(fixedSchedule, prefix = 'schedule-') {
    const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    days.forEach(day => {
        const checkbox = document.getElementById(`${prefix}${day}`);
        const hourSelect = document.getElementById(`${prefix.replace('schedule-','hour-')}${day}`);
        const minuteSelect = document.getElementById(`${prefix.replace('schedule-','minute-')}${day}`);
        
        if (!checkbox || !hourSelect || !minuteSelect) return;

        const dayName = checkbox.value; // "Sunday", "Monday", ...
        if (fixedSchedule && fixedSchedule[dayName]) {
            checkbox.checked = true;
            const [hour, minute] = fixedSchedule[dayName].split(":");
            hourSelect.value = hour;
            minuteSelect.value = minute;
        } else {
            checkbox.checked = false;
            hourSelect.value = "08"; // Giờ mặc định
            minuteSelect.value = "00"; // Phút mặc định
        }
    });
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
    if (!classId) {
        Swal.fire("Thông báo", "Học viên này chưa được xếp vào lớp nào.", "info");
        return;
    }

    // KIỂM TRA AN TOÀN: Đảm bảo dữ liệu lớp học tồn tại
    if (!allClassesData[classId]) {
         Swal.fire("Dữ liệu không hợp lệ", "Không tìm thấy dữ liệu của lớp học mà học viên này đang tham gia. Có thể lớp đã bị xóa.", "error");
         return;
    }

    if (typeof showClassAttendanceAndHomeworkTable === 'function') {
        await showClassAttendanceAndHomeworkTable(classId);
    } else {
        Swal.fire("Lỗi", "Chức năng xem điểm danh chưa được định nghĩa.", "error");
    }
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
    
    // Lấy giá trị từ các dropdown mới
    const hourSelect = document.getElementById(`hour-${day.substring(0, 3)}`);
    const minuteSelect = document.getElementById(`minute-${day.substring(0, 3)}`);

    // Kiểm tra nếu checkbox được chọn nhưng có thể select không tồn tại (để phòng lỗi)
    if (checkbox && checkbox.checked && (!hourSelect || !minuteSelect)) {
        alert(`Đã xảy ra lỗi với phần chọn giờ của ${checkbox.value}. Vui lòng tải lại trang.`);
        return false;
    }
  }
  // Với cấu trúc dropdown mới, giờ luôn có giá trị, nên việc kiểm tra giờ trống không còn cần thiết.
  // Hàm getFixedScheduleFromForm sẽ tự động chỉ lấy giờ của những ngày được tick.
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
    allClassesData = snapshot.val() || {};
    const currentPage = window.location.hash.slice(1);

    // Khi dữ liệu lớp thay đổi, render lại trang tương ứng nếu đang mở
    if (currentPage === "class-management") {
      renderClassList(allClassesData);
    }
    if (currentPage === "new-schedule-page") {
      renderNewSchedulePage();
    }
    if (currentPage === "tuition-management") {
        const query = document.getElementById("tuition-class-search")?.value || '';
        renderTuitionView(query);
    }
    renderDashboardCharts();
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
    
    await renderPersonnelListForAttendance();
    await renderStaffSalaryTable();

    showPersonnelSection('classes');
    
    showLoading(false);
    personnelListInitialized = true; 
}
// MỚI: Điền danh sách lớp vào Ô 1 (giống quản lý bài tập)
async function renderPersonnelListForAttendance() {
    const sectionContainer = document.getElementById("personnel-classes-section");
    if (!sectionContainer) return;

    sectionContainer.innerHTML = `
        <h3>Chọn nhân sự để xem danh sách lớp và chấm công</h3>
        <input 
            type="text" 
            id="personnel-class-search" 
            placeholder="Tìm nhân sự..." 
            oninput="filterPersonnelClassesBySearch()" 
            style="width: 100%; padding: 8px; margin-bottom: 10px;"
        />
        <ul id="personnel-list-for-attendance" class="styled-list"></ul>
    `;

    const personnelListUl = document.getElementById('personnel-list-for-attendance');
    if (!personnelListUl) return;

    // --- LOGIC PHÂN QUYỀN MỚI ---
    const isAdminOrHoiDong = currentUserData && (currentUserData.role === "Admin" || currentUserData.role === "Hội Đồng");
    let staffToRender = [];

    if (isAdminOrHoiDong) {
        // Nếu là Admin/Hội Đồng, hiển thị tất cả nhân sự.
        staffToRender = Object.entries(allUsersData)
            .filter(([, userData]) => userData.role && PAYROLL_STAFF_ROLES.includes(userData.role))
            .sort(([, a], [, b]) => (a.name || "").localeCompare(b.name || ""));
    } else if (currentUserData) {
        // Nếu là vai trò khác (GV, TG), chỉ hiển thị chính họ.
        const selfData = allUsersData[currentUserData.uid];
        if (selfData && selfData.role && PAYROLL_STAFF_ROLES.includes(selfData.role)) {
            staffToRender.push([currentUserData.uid, selfData]);
        }
    }
    // --- KẾT THÚC LOGIC PHÂN QUYỀN ---

    personnelListUl.innerHTML = "";
    // Vẽ danh sách nhân sự đã được lọc
    staffToRender.forEach(([uid, userData]) => {
        const staffLi = document.createElement('li');
        staffLi.textContent = `${userData.name || userData.email} (${userData.role})`;
        staffLi.dataset.uid = uid;
        staffLi.style.cursor = 'pointer';

        const classSublistDiv = document.createElement('div');
        classSublistDiv.className = 'class-sublist';
        classSublistDiv.style.display = 'none';
        staffLi.appendChild(classSublistDiv);

        staffLi.onclick = () => toggleStaffClassList(staffLi, uid);
        personnelListUl.appendChild(staffLi);
    });
}
/**
 * [HÀM MỚI] Xử lý việc hiển thị hoặc ẩn danh sách lớp của một nhân sự.
 * @param {HTMLElement} staffLiElement - Phần tử <li> của nhân sự được nhấp vào.
 * @param {string} staffUid - UID của nhân sự đó.
 */
function toggleStaffClassList(staffLiElement, staffUid) {
    const sublistDiv = staffLiElement.querySelector('.class-sublist');
    const isActive = staffLiElement.classList.contains('active');

    // Nếu đang active, chỉ cần ẩn đi và xóa class
    if (isActive) {
        sublistDiv.style.display = 'none';
        staffLiElement.classList.remove('active');
        return;
    }

    // Nếu chưa active, ẩn tất cả các sublist khác trước
    document.querySelectorAll('#personnel-list-for-attendance > li').forEach(li => {
        li.classList.remove('active');
        li.querySelector('.class-sublist').style.display = 'none';
    });

    // Thêm class active cho mục hiện tại
    staffLiElement.classList.add('active');

    // Nếu sublist chưa có nội dung, thì tạo nó
    if (!sublistDiv.hasChildNodes()) {
        const classUl = document.createElement('ul');
        let classesFound = false;

        Object.entries(allClassesData).forEach(([classId, cls]) => {
            if (cls.teacherUid === staffUid || cls.assistantTeacherUid === staffUid) {
                classesFound = true;
                const classLi = document.createElement('li');
                classLi.textContent = cls.name || 'Lớp không tên';
                
                // Gán sự kiện click cho từng lớp để mở bảng chấm công
                classLi.onclick = (event) => {
                    event.stopPropagation(); // Ngăn sự kiện click lan ra phần tử cha (staffLiElement)
                    currentPersonnelClassId = classId;
                    renderPersonnelAttendanceTable(classId, cls.name || "Không tên");
                };
                classUl.appendChild(classLi);
            }
        });

        if (!classesFound) {
            classUl.innerHTML = '<li><em>Nhân sự này chưa được phân công lớp nào.</em></li>';
        }
        sublistDiv.appendChild(classUl);
    }

    // Hiển thị sublist
    sublistDiv.style.display = 'block';
}
// MỚI: Lọc danh sách lớp trong Quản lý nhân sự
function filterPersonnelClassesBySearch() {
    const query = document.getElementById("personnel-class-search").value.toLowerCase().trim();
    const personnelList = document.getElementById("personnel-list-for-attendance");

    if (!personnelList) return;

    const staffItems = personnelList.getElementsByTagName('li');

    for (const item of staffItems) {
        const staffName = item.textContent || item.innerText;
        if (staffName.toLowerCase().includes(query)) {
            item.style.display = ""; // Hiển thị nếu khớp
        } else {
            item.style.display = "none"; // Ẩn nếu không khớp
        }
    }
}
// MỚI: Render bảng chấm công của lớp (Ô 1 - giống bảng điểm danh học viên nhưng cho nhân sự)
async function renderPersonnelAttendanceTable(classId, className) {
    showLoading(true);
    document.getElementById("personnel-classes-section").style.display = "none";
    document.getElementById("personnel-staff-section").style.display = "none";
    document.querySelector('.personnel-controls').style.display = 'none';
    document.getElementById("current-personnel-class-name").textContent = className;

    try {
        const classSnap = await database.ref(`classes/${classId}`).once("value");
        const cls = classSnap.val();
        if (!cls) {
            throw new Error("Không tìm thấy dữ liệu lớp học.");
        }

        // SỬA LỖI: Lấy trực tiếp các buổi học đã được lưu của lớp
        const sessions = cls.sessions || {};
        const sortedSessionDates = Object.keys(sessions).sort();

        let classStaff = [];
        const isAdminOrHoiDong = currentUserData && (currentUserData.role === "Admin" || currentUserData.role === "Hội Đồng");
        const currentUid = currentUserData ? currentUserData.uid : null;

        if (cls.teacherUid && allUsersData[cls.teacherUid]) {
            if (isAdminOrHoiDong || cls.teacherUid === currentUid) {
                classStaff.push({ uid: cls.teacherUid, name: cls.teacher, role: "Giáo Viên" });
            }
        }
        if (cls.assistantTeacherUid && allUsersData[cls.assistantTeacherUid]) {
            if (isAdminOrHoiDong || cls.assistantTeacherUid === currentUid) {
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
        // Dùng sortedSessionDates để tạo header
        sortedSessionDates.forEach((dateKey) => {
            const d = new Date(dateKey + 'T00:00:00');
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

            // Dùng sortedSessionDates để tạo các ô checkbox
            sortedSessionDates.forEach((dateKey) => {
                const isChecked = personnelAttendanceData?.[staff.uid]?.[dateKey]?.[staff.role] === true;
                const td = document.createElement("td");
                td.style.minWidth = "100px";
                const isDisabled = !isAdminOrHoiDong;
                
                td.innerHTML = `
                    <input type="checkbox"
                           onchange="togglePersonnelAttendance('${classId}', '${staff.uid}', '${dateKey}', '${staff.role}', this.checked)"
                           ${isChecked ? "checked" : ""}
                           ${isDisabled ? "disabled" : ""} />
                `;
                row.appendChild(td);
            });
            tableBody.appendChild(row);
        });

        showPersonnelAttendanceModal();
        
        // Logic cuộn (giữ nguyên)
        setTimeout(() => {
            const scrollContainer = document.getElementById("personnel-attendance-scroll-container");
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const closestIndex = sortedSessionDates.findIndex(date => new Date(date + 'T00:00:00') >= today);
            if (closestIndex === -1) {
                scrollContainer.scrollLeft = scrollContainer.scrollWidth;
                return;
            }
            const firstDateColumn = tableHeadRow.children[1];
            if (!firstDateColumn) return;
            const columnWidth = firstDateColumn.offsetWidth;
            const scrollPosition = Math.max(0, closestIndex - 2) * columnWidth;
            scrollContainer.scrollLeft = scrollPosition;
        }, 0);

    } catch (error) {
        console.error("Lỗi khi render bảng chấm công nhân sự:", error);
        Swal.fire("Lỗi", "Không thể render bảng chấm công: " + error.message, "error");
        hidePersonnelAttendanceModal();
    } finally {
        showLoading(false);
    }
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
        const modalContent = document.querySelector("#staff-classes-salary-modal .modal__content");
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
    const staffData = allStaffData[staffUid];
    if (!staffData) {
        showLoading(false);
        return;
    }

    const [year, month] = monthYear.split('-').map(Number);

    // LOGIC MỚI: Tính ngày bắt đầu và kết thúc của chu kỳ lương
    const startDate = new Date(year, month - 2, 16); // Ngày 16 của tháng trước
    const endDate = new Date(year, month - 1, 15);   // Ngày 15 của tháng đã chọn
    endDate.setHours(23, 59, 59, 999); // Bao gồm toàn bộ ngày cuối cùng

    const allAttendanceSnap = await database.ref(`personnelAttendance`).once("value");
    const allAttendanceData = allAttendanceSnap.val() || {};
    const allClassesSnap = await database.ref(DB_PATHS.CLASSES).once("value");
    const allClasses = allClassesSnap.val() || {};

    let dailyShiftDetails = {};
    let finalCalculatedSalary = 0;
    
    // Tạo một map để lưu số ca theo từng ngày trong chu kỳ
    const dailyShiftsMap = new Map();

    // Duyệt qua tất cả các lớp để tính lương và chấm công
    for (const classId in allClasses) {
        const cls = allClasses[classId];
        if (!cls) continue;

        const staffAttendanceInClass = allAttendanceData[classId]?.[staffUid];
        if (!staffAttendanceInClass) continue;

        // Xác định mức lương của nhân sự trong lớp này
        const salaryTeacherPerClass = (cls.teacherUid === staffUid) ? (cls.teacherSalary || 0) : 0;
        const salaryAssistantPerClass = (cls.assistantTeacherUid === staffUid) ? (cls.assistantTeacherSalary || 0) : 0;

        // Duyệt qua các ngày đã chấm công của nhân sự trong lớp
        for (const dateStr in staffAttendanceInClass) {
            const sessionDate = new Date(dateStr);
            if (sessionDate >= startDate && sessionDate <= endDate) {
                
                // Khởi tạo nếu ngày chưa có trong map
                if (!dailyShiftsMap.has(dateStr)) {
                    dailyShiftsMap.set(dateStr, { teacher: 0, assistant: 0 });
                }
                if (!dailyShiftDetails[dateStr]) {
                    dailyShiftDetails[dateStr] = [];
                }

                const rolesAttended = staffAttendanceInClass[dateStr];
                const sessionTime = cls.fixedSchedule?.[sessionDate.toLocaleDateString("en-US", { weekday: "long" })] || 'N/A';
                
                if (rolesAttended['Giáo Viên'] === true) {
                    dailyShiftsMap.get(dateStr).teacher++;
                    finalCalculatedSalary += salaryTeacherPerClass;
                    dailyShiftDetails[dateStr].push(`Lớp: ${cls.name} (GV - ${sessionTime}) - Lương: ${salaryTeacherPerClass.toLocaleString('vi-VN')} VNĐ`);
                }
                if (rolesAttended['Trợ Giảng'] === true) {
                    dailyShiftsMap.get(dateStr).assistant++;
                    finalCalculatedSalary += salaryAssistantPerClass;
                    dailyShiftDetails[dateStr].push(`Lớp: ${cls.name} (TG - ${sessionTime}) - Lương: ${salaryAssistantPerClass.toLocaleString('vi-VN')} VNĐ`);
                }
            }
        }
    }
    
    // Chuẩn bị dữ liệu và nhãn cho biểu đồ từ startDate đến endDate
    const labels = [];
    const teacherData = [];
    const assistantData = [];
    let totalTeacherShifts = 0;
    let totalAssistantShifts = 0;

    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        labels.push(`${currentDate.getDate()}/${currentDate.getMonth() + 1}`);
        
        const shifts = dailyShiftsMap.get(dateStr) || { teacher: 0, assistant: 0 };
        teacherData.push(shifts.teacher);
        assistantData.push(shifts.assistant);
        totalTeacherShifts += shifts.teacher;
        totalAssistantShifts += shifts.assistant;
        
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Cập nhật giao diện
    const noteElement = document.getElementById('salary-period-note');
    if (noteElement) {
        noteElement.textContent = `Lưu ý: Lương tháng ${month}/${year} được tính từ ngày ${startDate.toLocaleDateString('vi-VN')} đến ${endDate.toLocaleDateString('vi-VN')}.`;
    }
    document.getElementById("summary-month-year").textContent = `${month}/${year}`;
    document.getElementById("total-monthly-salary").textContent = finalCalculatedSalary.toLocaleString('vi-VN');
    document.getElementById("total-teacher-shifts").textContent = totalTeacherShifts;
    document.getElementById("total-assistant-shifts").textContent = totalAssistantShifts;

    // Vẽ biểu đồ
    const ctx = document.getElementById('personnel-daily-chart').getContext('2d');
    if (personnelChart) {
        personnelChart.destroy();
    }
    personnelChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels, // Dữ liệu nhãn đã được tạo chính xác
            datasets: [
                {
                    label: 'Ca Giáo viên',
                    data: teacherData, // Dữ liệu ca GV đã được tạo chính xác
                    backgroundColor: 'rgba(0, 102, 204, 0.7)',
                    borderColor: 'rgba(0, 102, 204, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Ca Trợ giảng',
                    data: assistantData, // Dữ liệu ca TG đã được tạo chính xác
                    backgroundColor: 'rgba(0, 74, 153, 0.7)',
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
                    title: { display: true, text: 'Ngày trong chu kỳ lương' }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    title: { display: true, text: 'Số ca chấm công' },
                    ticks: { stepSize: 1 }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        title: (tooltipItems) => `Ngày ${tooltipItems[0].label}`,
                        label: (context) => `${context.dataset.label || ''}: ${context.parsed.y} ca`,
                        afterBody: (tooltipItems) => {
                            const [day, month] = tooltipItems[0].label.split('/');
                            // Tìm ngày chính xác trong chu kỳ
                            let tooltipDate = new Date(startDate);
                            while(tooltipDate <= endDate) {
                                if(tooltipDate.getDate() == day && (tooltipDate.getMonth() + 1) == month) {
                                    break;
                                }
                                tooltipDate.setDate(tooltipDate.getDate() + 1);
                            }
                            const dateStr = tooltipDate.toISOString().split('T')[0];
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

    // Cập nhật chi tiết chấm công theo ngày
    const dailyShiftsList = document.getElementById("daily-shifts-list");
    dailyShiftsList.innerHTML = "";
    Object.keys(dailyShiftDetails).sort().forEach(dateStr => {
        const details = dailyShiftDetails[dateStr];
        const li = document.createElement("li");
        li.innerHTML = `<strong>Ngày ${new Date(dateStr).toLocaleDateString('vi-VN')}:</strong><br>` + details.map(d => `- ${d}`).join('<br>');
        dailyShiftsList.appendChild(li);
    });

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
function getSubjectClass(className) {
    if (!className) return 'subject-default';
    const lowerCaseName = className.toLowerCase();
    
    if (lowerCaseName.includes('ielts')) {
        return 'subject-ielts';
    }
    if (lowerCaseName.includes('tiếng trung') || lowerCaseName.includes('hsk') || lowerCaseName.includes('yct')) {
        return 'subject-chinese';
    }
    if (lowerCaseName.includes('tiếng anh') || lowerCaseName.includes('thcs') || lowerCaseName.includes('tiểu học') || lowerCaseName.includes('mầm non')) {
        return 'subject-english';
    }
    
    return 'subject-default';
}
async function deleteTempClass(event, classId) {
    // Ngăn các sự kiện khác (như mở menu chuột phải) được kích hoạt
    event.stopPropagation(); 
    
    const result = await Swal.fire({
        title: 'Bạn chắc chắn muốn xóa?',
        text: "Hành động này sẽ xóa vĩnh viễn lớp tạm thời này!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Vâng, xóa nó!',
        cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
        try {
            await database.ref(`${DB_PATHS.CLASSES}/${classId}`).remove();
            // Lịch sẽ tự động cập nhật do có listener
            Swal.fire('Đã xóa!', 'Lớp tạm thời đã được xóa.', 'success');
        } catch (error) {
            console.error("Lỗi khi xóa lớp tạm thời:", error);
            Swal.fire('Lỗi!', 'Không thể xóa lớp. Vui lòng thử lại.', 'error');
        }
    }
}
let currentWeekOffset = 0; // 0 là tuần hiện tại, -1 là tuần trước, 1 là tuần sau
// THAY THẾ TOÀN BỘ HÀM RENDER... CŨ BẰNG HÀM NÀY
function renderNewSchedulePage() {
    // Logic phân quyền (giữ nguyên)
    let visibleClasses = {};
    const isAdminOrHoiDong = currentUserData && (currentUserData.role === 'Admin' || currentUserData.role === 'Hội Đồng');

    if (isAdminOrHoiDong) {
        visibleClasses = allClassesData;
    } else {
        const currentUid = currentUserData ? currentUserData.uid : null;
        if (currentUid) {
            Object.entries(allClassesData).forEach(([classId, cls]) => {
                if (cls.teacherUid === currentUid || cls.assistantTeacherUid === currentUid) {
                    visibleClasses[classId] = cls;
                }
            });
        }
    }
    
    // === LOGIC MỚI: Chỉ lấy các lớp đang hoạt động để hiển thị trên lịch ===
    const activeVisibleClasses = {};
    Object.entries(visibleClasses).forEach(([classId, cls]) => {
        if (cls.status !== 'completed') {
            activeVisibleClasses[classId] = cls;
        }
    });
    // ===================================================================
    
    const container = document.getElementById('schedule-grid-container');
    if (!container) {
        console.error("Lỗi nghiêm trọng: Không tìm thấy #schedule-grid-container trong HTML.");
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    today.setDate(today.getDate() + (currentWeekOffset * 7));
    
    const firstDayOfWeek = new Date(today);
    firstDayOfWeek.setDate(firstDayOfWeek.getDate() - firstDayOfWeek.getDay());
    
    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 6);
    
    document.getElementById('schedule-week-title').textContent = 
        `Tuần từ ${firstDayOfWeek.toLocaleDateString('vi-VN')} đến ${lastDayOfWeek.toLocaleDateString('vi-VN')}`;

    const activeHours = new Set();
    if (activeVisibleClasses) { // <-- SỬ DỤNG BIẾN MỚI
        Object.values(activeVisibleClasses).forEach(cls => { // <-- SỬ DỤNG BIẾN MỚI
            if (cls.fixedSchedule) {
                Object.values(cls.fixedSchedule).forEach(timeString => {
                    if (timeString && typeof timeString === 'string' && timeString.includes(':')) {
                        const hour = parseInt(timeString.split(':')[0], 10);
                        if (!isNaN(hour)) activeHours.add(hour);
                    }
                });
            }
        });
    }

    const sortedActiveHours = Array.from(activeHours).sort((a, b) => a - b);
    const hourToRowMap = new Map();
    sortedActiveHours.forEach((hour, index) => {
        hourToRowMap.set(hour, index * 2 + 3);
    });

    let tempContainerHTML = '';
    tempContainerHTML += `<div class="grid-header time-label" style="grid-row: 1 / 3;">Giờ</div>`;
    const daysOfWeek = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    daysOfWeek.forEach((day, index) => {
        tempContainerHTML += `<div class="grid-header day" style="grid-column: ${index * 2 + 2} / span 2;">${day}</div>`;
        tempContainerHTML += `<div class="grid-header room" style="grid-column: ${index * 2 + 2}; grid-row: 2;">P.301</div>`;
        tempContainerHTML += `<div class="grid-header room" style="grid-column: ${index * 2 + 3}; grid-row: 2;">P.302</div>`;
    });

    const totalRows = sortedActiveHours.length * 2;
    if (totalRows > 0) {
        container.style.gridTemplateRows = `auto auto repeat(${totalRows}, 30px)`; 
        sortedActiveHours.forEach(hour => {
            const gridRowStart = hourToRowMap.get(hour);
            tempContainerHTML += `<div class="time-slot" style="grid-row: ${gridRowStart} / span 2;">${hour}:00</div>`;
        });
    } else {
        container.style.gridTemplateRows = `auto auto 100px`;
        tempContainerHTML += `<div style="grid-column: 2 / -1; grid-row: 3; text-align:center; padding-top: 30px; color: #999;">Không có lớp học nào trong tuần này.</div>`;
    }
    
    container.innerHTML = tempContainerHTML;

    const renderBlock = (item) => {
        try {
            if (!item.time || typeof item.time !== 'string' || !item.time.includes(':')) return;
            const [hour, minute] = item.time.split(':').map(Number);
            if (hourToRowMap.has(hour)) {
                let dayIndex = daysOfWeek.indexOf(item.dayName.charAt(0).toUpperCase() + item.dayName.slice(1));
                if (dayIndex === -1) {
                    const dayNamesList = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    dayIndex = dayNamesList.indexOf(item.dayName);
                    if (dayIndex === -1) return;
                }
                const baseRowIndex = hourToRowMap.get(hour);
                const rowStart = baseRowIndex + (minute >= 30 ? 1 : 0);
                const rowSpan = Math.ceil(90 / 30);
                const colStart = (dayIndex * 2) + (item.room === "Phòng 301" ? 2 : 3);
                const studentCount = item.students ? Object.keys(item.students).length : 0;
                const classBlock = document.createElement('div');
                const subjectClass = item.isTemporary ? 'subject-default' : getSubjectClass(item.name);
                classBlock.className = `class-block ${subjectClass}`;
                classBlock.style.gridColumn = `${colStart}`;
                classBlock.style.gridRow = `${rowStart} / span ${rowSpan}`;
                classBlock.dataset.classId = item.id;
                classBlock.dataset.tooltip = `Tên: ${item.name}\nPhòng: ${item.room}\nGiờ: ${item.time}\nGV: ${item.teacher || ''}\nSĩ số: ${studentCount}`;
                classBlock.innerHTML = `<div class="class-name">${item.name}</div><div class="teacher-name">${item.teacher || ''}</div>`;
                if (item.isTemporary) {
                    const deleteBtn = document.createElement('div');
                    deleteBtn.className = 'delete-temp-class';
                    deleteBtn.innerHTML = '&times;';
                    deleteBtn.title = 'Xóa lớp tạm thời';
                    deleteBtn.onclick = (event) => deleteTempClass(event, item.id);
                    classBlock.appendChild(deleteBtn);
                }
                container.appendChild(classBlock);
            }
        } catch (error) {
            console.error("Lỗi khi vẽ một khối lớp:", item, error);
        }
    };

    const dayNamesList = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    Object.entries(activeVisibleClasses).forEach(([classId, cls]) => { // <-- SỬ DỤNG BIẾN MỚI
        if (!cls.fixedSchedule) return;
        Object.entries(cls.fixedSchedule).forEach(([dayIndex, time]) => {
            const dayName = dayNamesList[parseInt(dayIndex, 10)]; 
            if (dayName) {
                renderBlock({ ...cls, id: classId, dayName, time });
            }
        });
    });
}
function initScheduleEventListeners() {
    if (scheduleEventListenersInitialized) return;

    const scheduleContainer = document.getElementById('schedule-grid-container');
    const tooltip = document.getElementById('schedule-tooltip');
    const createMenu = document.getElementById('schedule-context-menu');
    const actionMenu = document.getElementById('class-action-context-menu');

    if (!scheduleContainer || !tooltip || !createMenu || !actionMenu) {
        console.error("Không thể khởi tạo sự kiện lịch vì thiếu phần tử HTML quan trọng.");
        return;
    }

    let contextData = {};

    // SỬA LỖI VỊ TRÍ TOOLTIP VÀ THÊM LOGIC HIGHLIGHT
    scheduleContainer.addEventListener('mouseover', (e) => {
        const targetBlock = e.target.closest('.class-block');
        
        // Xóa highlight cũ trước
        document.querySelectorAll('.class-block.highlight-sibling').forEach(el => {
            el.classList.remove('highlight-sibling');
        });

        if (targetBlock) {
            // Hiển thị tooltip
            if (targetBlock.dataset.tooltip) {
                tooltip.innerHTML = targetBlock.dataset.tooltip.replace(/\n/g, '<br>');
                tooltip.style.display = 'block';
            }
            // Logic highlight các lớp liên quan
            const classIdToHighlight = targetBlock.dataset.classId;
            if (classIdToHighlight) {
                document.querySelectorAll(`.class-block[data-class-id="${classIdToHighlight}"]`).forEach(el => {
                    el.classList.add('highlight-sibling');
                });
            }
        }
    });

    scheduleContainer.addEventListener('mousemove', (e) => {
        // SỬA LỖI VỊ TRÍ: Dùng clientX/Y vì tooltip có position: fixed
        tooltip.style.left = `${e.clientX + 15}px`;
        tooltip.style.top = `${e.clientY + 15}px`;
    });

    scheduleContainer.addEventListener('mouseout', (e) => {
        // Ẩn tooltip và xóa highlight khi chuột ra khỏi toàn bộ lưới lịch
        tooltip.style.display = 'none';
        document.querySelectorAll('.class-block.highlight-sibling').forEach(el => {
            el.classList.remove('highlight-sibling');
        });
    });
    
    // Phần xử lý context menu (giữ nguyên logic cũ)
    scheduleContainer.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        createMenu.classList.remove('visible');
        actionMenu.classList.remove('visible');
        const clickedBlock = e.target.closest('.class-block');
        if (clickedBlock) {
            const classId = clickedBlock.dataset.classId;
            if (!classId) return;
            const editButton = document.getElementById('menu-edit-class');
            if (editButton) {
                editButton.onclick = () => {
                    actionMenu.classList.remove('visible');
                    editClass(classId);
                };
            }
            actionMenu.style.left = `${e.pageX}px`;
            actionMenu.style.top = `${e.pageY}px`;
            actionMenu.classList.add('visible');
        } else {
            let visibleClasses = {};
            const isAdminOrHoiDong = currentUserData && (currentUserData.role === 'Admin' || currentUserData.role === 'Hội Đồng');
            if (isAdminOrHoiDong) {
                visibleClasses = allClassesData;
            } else {
                const currentUid = currentUserData ? currentUserData.uid : null;
                if (currentUid) {
                    Object.entries(allClassesData).forEach(([classId, cls]) => {
                        if (cls.teacherUid === currentUid || cls.assistantTeacherUid === currentUid) {
                            visibleClasses[classId] = cls;
                        }
                    });
                }
            }
            const rect = scheduleContainer.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            if (y < 60 || x < 60) return; 
            const colWidth = (rect.width - 60) / 14;
            const colIndex = Math.floor((x - 60) / colWidth);
            const dayOfWeekIndex = Math.floor(colIndex / 2);
            const room = colIndex % 2 === 0 ? 'Phòng 301' : 'Phòng 302';
            const rowHeight = 30;
            const rowIndex = Math.floor((y - 60) / rowHeight);
            const activeHours = new Set();
            if (visibleClasses) {
                Object.values(visibleClasses).forEach(cls => {
                    if (cls.fixedSchedule) {
                        Object.values(cls.fixedSchedule).forEach(timeString => {
                            if (timeString && typeof timeString === 'string' && timeString.includes(':')) {
                                const hour = parseInt(timeString.split(':')[0], 10);
                                if (!isNaN(hour)) activeHours.add(hour);
                            }
                        });
                    }
                });
            }
            const sortedActiveHours = Array.from(activeHours).sort((a,b)=>a-b);
            const hourIndex = Math.floor(rowIndex / 2);
            const hour = sortedActiveHours[hourIndex] || (7 + hourIndex);
            const minute = (rowIndex % 2) * 30;
            const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
            const firstDayOfWeek = new Date();
            firstDayOfWeek.setHours(0,0,0,0);
            firstDayOfWeek.setDate(firstDayOfWeek.getDate() - firstDayOfWeek.getDay() + (currentWeekOffset * 7) + dayOfWeekIndex);
            const date = firstDayOfWeek.toISOString().split('T')[0];
            contextData = { date, time, room };
            document.getElementById('menu-add-class').onclick = () => {
                createMenu.classList.remove('visible');
                showAddClassFormFromSchedule(contextData.date, contextData.time, contextData.room);
            };
            document.getElementById('menu-add-temp-class').onclick = () => {
                createMenu.classList.remove('visible');
                showAddTempClassForm(contextData.date, contextData.time, contextData.room);
            };
            createMenu.style.left = `${e.pageX}px`;
            createMenu.style.top = `${e.pageY}px`;
            createMenu.classList.add('visible');
        }
    });

    document.addEventListener('click', (e) => {
        if (createMenu && !createMenu.contains(e.target)) {
            createMenu.classList.remove('visible');
        }
        if (actionMenu && !actionMenu.contains(e.target)) {
            actionMenu.classList.remove('visible');
        }
    });

    console.log("Sự kiện lịch học (sửa/thêm) đã được khởi tạo.");
    scheduleEventListenersInitialized = true;
}
function showAddClassFormFromSchedule(date, time, room) {
    showClassForm(); // Tái sử dụng hàm đã có
    // Tự động điền thông tin
    document.getElementById("class-start-date").value = date;
    document.getElementById("class-room").value = room;
    
    const dayOfWeek = new Date(date).toLocaleString('en-US', { weekday: 'long' });
    const dayKey = dayOfWeek.toLowerCase().substring(0, 3);
    const [hour, minute] = time.split(':');

    document.getElementById(`schedule-${dayKey}`).checked = true;
    document.getElementById(`hour-${dayKey}`).value = hour;
    document.getElementById(`minute-${dayKey}`).value = minute;
}
function showAddTempClassForm(date, time, room) {
    const modal = document.getElementById('temp-class-form-modal');
    document.getElementById('temp-class-form').reset();
    selectedTempStudents = {};
    updateSelectedTempStudentsUI();

    // Điền sẵn ngày bắt đầu
    document.getElementById('temp-class-start-date').value = date;
    document.getElementById('temp-class-room').value = room; // Lưu phòng ẩn

    // Tự động tick vào ngày và giờ đã chọn trên lịch
    const dayOfWeek = new Date(date + 'T00:00:00').toLocaleString('en-US', { weekday: 'long' });
    const dayKey = dayOfWeek.toLowerCase().substring(0, 3);
    const [hour, minute] = time.split(':');

    document.getElementById(`temp-schedule-${dayKey}`).checked = true;
    document.getElementById(`temp-hour-${dayKey}`).value = hour;
    document.getElementById(`temp-minute-${dayKey}`).value = minute;

    // Điền danh sách nhân sự và kích hoạt tìm kiếm
    populatePersonnelDropdown(document.getElementById('temp-class-teacher'));
    populatePersonnelDropdown(document.getElementById('temp-class-assistant'));
    setupStudentSearchForTempClass();

    modal.style.display = 'flex';
}
// Thêm hàm MỚI này vào ngay bên dưới hàm showAddTempClassForm
function setupStudentSearchForTempClass() {
    const searchInput = document.getElementById('temp-class-student-search');
    const resultsContainer = document.getElementById('temp-class-student-results');

    // Xóa listener cũ để tránh lỗi gắn chồng sự kiện
    const newSearchInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newSearchInput, searchInput);

    newSearchInput.addEventListener('input', () => {
        const query = newSearchInput.value.toLowerCase().trim();
        resultsContainer.innerHTML = '';
        if (query.length < 1) { // Hiện kết quả ngay từ ký tự đầu tiên
            resultsContainer.style.display = 'none';
            return;
        }

        // Lọc những học viên có tên chứa từ khóa và chưa được chọn
        const filteredStudents = Object.entries(allStudentsData).filter(([id, student]) => 
            (student.name || "").toLowerCase().includes(query) && !selectedTempStudents.hasOwnProperty(id)
        );

        if (filteredStudents.length > 0) {
            resultsContainer.style.display = 'block';
            // Chỉ hiển thị tối đa 5 kết quả để tránh list quá dài
            filteredStudents.slice(0, 5).forEach(([id, student]) => {
                const resultDiv = document.createElement('div');
                resultDiv.textContent = student.name;
                resultDiv.onclick = () => {
                    selectedTempStudents[id] = student.name; // Thêm vào danh sách chọn
                    updateSelectedTempStudentsUI(); // Cập nhật giao diện tag
                    newSearchInput.value = ''; // Xóa ô tìm kiếm
                    resultsContainer.style.display = 'none'; // Ẩn kết quả
                };
                resultsContainer.appendChild(resultDiv);
            });
        } else {
            resultsContainer.style.display = 'none';
        }
    });
}
/**
 * [HÀM MỚI] Hàm phụ để điền danh sách nhân sự vào dropdown.
 */
function populatePersonnelDropdown(selectElement) {
    selectElement.innerHTML = '<option value="">-- Chọn --</option>';
    // Sửa ở đây: dùng Object.entries để có cả uid và user data
    Object.entries(allUsersData).forEach(([uid, user]) => {
        if (user.role && (user.role === 'Giáo Viên' || user.role === 'Trợ Giảng')) {
            const option = document.createElement('option');
            option.value = user.name;
            option.textContent = `${user.name} (${user.role})`;
            
            // === DÒNG QUAN TRỌNG NHẤT BỊ THIẾU LÀ DÒNG NÀY ===
            option.dataset.uid = uid;
            
            selectElement.appendChild(option);
        }
    });
}
async function saveTempClass(event) {
    event.preventDefault();

    // Lấy dữ liệu từ form modal
    const name = document.getElementById('temp-class-name').value;
    const teacherSelect = document.getElementById('temp-class-teacher');
    const teacher = teacherSelect.options[teacherSelect.selectedIndex].text;
    const teacherUid = teacherSelect.options[teacherSelect.selectedIndex].dataset.uid || '';
    const assistantSelect = document.getElementById('temp-class-assistant');
    const assistantTeacher = assistantSelect.options[assistantSelect.selectedIndex].text;
    const assistantTeacherUid = assistantSelect.options[assistantSelect.selectedIndex].dataset.uid || '';
    const startDate = document.getElementById('temp-class-start-date').value;
    const room = document.getElementById('temp-class-room').value; // Lấy từ trường ẩn

    // Lấy lịch học cố định từ form mới
    const fixedSchedule = getTempFixedScheduleFromForm();

    if (!name || !teacher || !startDate || Object.keys(fixedSchedule).length === 0) {
        Swal.fire("Lỗi", "Vui lòng điền đầy đủ Tên lớp, Giáo viên, Ngày bắt đầu và chọn ít nhất một lịch học.", "error");
        return;
    }

   // Tạo lịch học cho khoảng 30 buổi tới dựa trên lịch cố định
const sessionsToGenerate = generateRollingSessions(startDate, 30, fixedSchedule); // Gọi lại hàm với đúng tham số

// Tạo đối tượng dữ liệu lớp học
const classData = {
    name,
    teacher,
    teacherUid,
    assistantTeacher,
    assistantTeacherUid,
    room,
    startDate,
    fixedSchedule,
    students: {},
    sessions: sessionsToGenerate, // Gán trực tiếp kết quả vào đây
    isTemporary: true, // <-- THÊM DÒNG QUAN TRỌNG NÀY
    createdAt: firebase.database.ServerValue.TIMESTAMP,
    updatedAt: firebase.database.ServerValue.TIMESTAMP,
    teacherSalary: 0,
    assistantTeacherSalary: 0,
};

    // Thêm thông tin học viên đã chọn
    Object.entries(selectedTempStudents).forEach(([studentId, studentName]) => {
        classData.students[studentId] = {
            enrolledAt: classData.createdAt,
            studentName: studentName,
            packageName: allStudentsData[studentId]?.package || '(Chưa có gói)'
        };
    });

    // Lưu vào Firebase
    try {
        showLoading(true);
        // THAY ĐỔI: SỬA LỖI KHI SỬA LỚP TẠM THỜI
        const tempClassId = document.getElementById('temp-class-id')?.value;
        if (tempClassId) {
             // Nếu có ID, nghĩa là đang sửa
            await database.ref(`${DB_PATHS.CLASSES}/${tempClassId}`).update(classData);
        } else {
            // Nếu không có ID, là tạo mới
            const newClassRef = database.ref(DB_PATHS.CLASSES).push();
            const newClassId = newClassRef.key;
            await newClassRef.set(classData);
             // Cập nhật thông tin lớp học cho từng học viên
            const studentUpdatePromises = Object.keys(selectedTempStudents).map(studentId => {
                return database.ref(`students/${studentId}/classes/${newClassId}`).set({ enrolledAt: classData.createdAt });
            });
            await Promise.all(studentUpdatePromises);
        }
        
        closeModal('temp-class-form-modal');
        Swal.fire({ icon: 'success', title: 'Đã lưu lớp học thành công!', timer: 2000, showConfirmButton: false });
        // Lịch sẽ tự động cập nhật do có listener
    } catch (error) {
        console.error("Lỗi khi lưu lớp học từ lịch:", error);
        Swal.fire("Lỗi", "Không thể lưu lớp học: " + error.message, "error");
    } finally {
        showLoading(false);
    }
}
function getTempFixedScheduleFromForm() {
    const schedule = {};
    // Thêm một bộ ánh xạ để chuyển tên ngày (chữ) sang chỉ số (số)
    const dayNameToIndex = { "Sunday": 0, "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6 };
    const dayCheckboxes = document.querySelectorAll("input[name='temp-schedule-day']:checked");

    dayCheckboxes.forEach(checkbox => {
        const dayName = checkbox.value; // Lấy tên ngày, ví dụ: "Monday"
        const dayIndex = dayNameToIndex[dayName]; // Chuyển "Monday" thành số 1
        const dayKey = checkbox.id.split("-")[2]; // "mon", "tue", ...

        const hour = document.getElementById(`temp-hour-${dayKey}`).value;
        const minute = document.getElementById(`temp-minute-${dayKey}`).value;

        if (hour && minute && dayIndex !== undefined) {
            // SỬA LỖI: Dùng dayIndex (số) làm key thay vì dayName (chữ)
            schedule[dayIndex] = `${hour}:${minute}`;
        }
    });
    return schedule;
}
/**
 * [HÀM MỚI] Cập nhật giao diện các học viên đã chọn cho lớp tạm thời.
 */
function updateSelectedTempStudentsUI() {
    const container = document.getElementById('temp-class-selected-students');
    container.innerHTML = '';
    Object.entries(selectedTempStudents).forEach(([id, name]) => {
        container.innerHTML += `
            <div class="selected-item-tag" data-id="${id}">
                ${name}
                <span class="remove-tag" onclick="removeTempStudent('${id}')">&times;</span>
            </div>
        `;
    });
}

/**
 * [HÀM MỚI] Xóa một học viên khỏi danh sách chọn.
 */
function removeTempStudent(studentId) {
    delete selectedTempStudents[studentId];
    updateSelectedTempStudentsUI();
}

/**
 * [HÀM MỚI] Đóng một modal bất kỳ bằng ID.
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}
document.addEventListener('DOMContentLoaded', () => {
    const scheduleContainer = document.getElementById('schedule-grid-container');
    const tooltip = document.getElementById('schedule-tooltip');

    if (scheduleContainer && tooltip) {
        scheduleContainer.addEventListener('mouseover', (e) => {
            const classBlock = e.target.closest('.class-block');
            if (classBlock) {
                tooltip.textContent = classBlock.dataset.tooltip;
                tooltip.style.display = 'block';
            }
        });

        scheduleContainer.addEventListener('mouseout', () => {
            tooltip.style.display = 'none';
        });

        scheduleContainer.addEventListener('mousemove', (e) => {
            // Hiển thị tooltip bên cạnh con trỏ chuột
            tooltip.style.left = `${e.pageX + 15}px`;
            tooltip.style.top = `${e.pageY + 15}px`;
        });
    }
});
// Gắn sự kiện cho các nút chuyển tuần
// Chờ cho toàn bộ HTML được tải xong rồi mới chạy code bên trong
document.addEventListener('DOMContentLoaded', () => {
     initScheduleEventListeners();
    // Gắn sự kiện cho các nút chuyển tuần
    const prevWeekBtn = document.getElementById('schedule-prev-week');
    const nextWeekBtn = document.getElementById('schedule-next-week');

    if (prevWeekBtn) {
        prevWeekBtn.addEventListener('click', () => {
            currentWeekOffset--;
            renderNewSchedulePage();
        });
    }

    if (nextWeekBtn) {
        nextWeekBtn.addEventListener('click', () => {
            currentWeekOffset++;
            renderNewSchedulePage();
        });
    } 
     const hamburgerBtn = document.querySelector('.top-bar__hamburger'); // Sửa lại selector
    const sidebar = document.querySelector('.sidebar');

    if (hamburgerBtn && sidebar) {
        hamburgerBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Ngăn sự kiện click lan ra ngoài
            sidebar.classList.toggle('visible');
        });
    }

    // Thêm sự kiện để đóng sidebar khi nhấn ra ngoài
    document.addEventListener('click', (e) => {
        if (sidebar && sidebar.classList.contains('visible') && !sidebar.contains(e.target)) {
            sidebar.classList.remove('visible');
        }
    });
    const avatarFileInput = document.getElementById("avatar-file");
    if (avatarFileInput) {
        avatarFileInput.addEventListener("change", async function() {
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

                // Thêm kiểm tra null cho các element này để an toàn hơn
                const avatarImg = document.getElementById("avatar-img");
                const profileAvatar = document.getElementById("profile-avatar");
                if(avatarImg) avatarImg.src = url;
                if(profileAvatar) profileAvatar.src = url;

                alert("Cập nhật avatar thành công!");
            } catch (error) {
                alert("Lỗi upload avatar: " + error.message);
            } finally {
                showLoading(false);
            }
        });
    }
    // 1. Dán listener cho form lớp học
    const classForm = document.getElementById("class-form");
    if (classForm) {
        classForm.addEventListener("submit", saveClass);
    }

    // 2. Dán listener cho việc lưu brouillon
    const fields = ["student-name", "student-dob", "student-address", "student-package-type", 
                    "general-english-course", "student-certificate-type", "student-certificate-course",
                    "student-package", "student-sessions-attended", "student-sessions-paid",
                    "student-discount-percent", "student-promotion-percent", 
                    "student-original-price", "student-total-due", "student-parent-job"];

    fields.forEach(id => {
      const input = document.getElementById(id);
      if (input) {
        input.addEventListener("input", () => {
          localStorage.setItem(id, input.value);
        });
        const draft = localStorage.getItem(id);
        if (draft !== null && draft !== undefined) {
          input.value = draft;
        }
      }
    });
     setInterval(updateLiveClock, 100); // Cập nhật đồng hồ mỗi 100ms
    updateLiveDate();
});
function populateTimeDropdowns() {
    const hourSelects = document.querySelectorAll('.hour-select');
    const minuteSelects = document.querySelectorAll('.minute-select');
    const minutes = ['00', '15', '30', '45'];

    hourSelects.forEach(select => {
        // Chỉ điền nếu nó đang trống để tránh lặp lại
        if (select.options.length <= 1) { 
            select.innerHTML = '';
            for (let i = 0; i < 24; i++) {
                const hour = String(i).padStart(2, '0');
                select.innerHTML += `<option value="${hour}">${hour}</option>`;
            }
        }
    });

    minuteSelects.forEach(select => {
        if (select.options.length <= 1) {
            select.innerHTML = '';
            minutes.forEach(minute => {
                select.innerHTML += `<option value="${minute}">${minute}</option>`;
            });
        }
    });
}
// Khi chuyển hash sang #schedule-management, render lại calendar :contentReference[oaicite:4]{index=4}
window.addEventListener("hashchange", () => {
  if (!isAuthReady) return;
  showPageFromHash();
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
 * HÀM MỚI: Sinh ra một số lượng buổi học cố định từ ngày bắt đầu.
 * @param {object} fixedSchedule - Lịch học cố định (vd: { Monday: "18:00", ...})
 * @param {string} startDateStr - Ngày lớp học bắt đầu (vd: "2025-06-03")
 * @param {number} sessionCount - Tổng số buổi cần tạo.
 * @returns {Array} - Mảng các đối tượng buổi học { date, time }.
 */
function generateFixedSessions(fixedSchedule, startDateStr, sessionCount) {
    const generatedSessions = [];
    if (!fixedSchedule || Object.keys(fixedSchedule).length === 0 || sessionCount <= 0) {
        return generatedSessions;
    }

    const dayNameToNumber = {
        "Sunday": 0, "Monday": 1, "Tuesday": 2, "Wednesday": 3,
        "Thursday": 4, "Friday": 5, "Saturday": 6
    };

    let cursorDate = new Date(startDateStr);
    // Chuẩn hóa về 00:00:00 UTC để tránh lỗi timezone khi so sánh
    cursorDate.setUTCHours(0, 0, 0, 0);

    while (generatedSessions.length < sessionCount) {
        const dayOfWeek = cursorDate.getDay();
        const dayName = Object.keys(dayNameToNumber).find(key => dayNameToNumber[key] === dayOfWeek);

        // Nếu ngày hiện tại trong vòng lặp có trong lịch cố định thì thêm vào danh sách
        if (fixedSchedule[dayName]) {
            const dateStr = cursorDate.toISOString().split("T")[0];
            generatedSessions.push({
                date: dateStr,
                time: fixedSchedule[dayName]
            });
        }
        // Tăng con trỏ lên 1 ngày để xét ngày tiếp theo
        cursorDate.setDate(cursorDate.getDate() + 1);
    }
    
    // Sắp xếp lại để đảm bảo thứ tự ngày và chỉ trả về đúng số buổi yêu cầu
    return generatedSessions.sort((a, b) => a.date.localeCompare(b.date));
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
function generateRollingSessions(startDateStr, sessionCount, schedule) {
    const sessions = {};
    if (!schedule || Object.keys(schedule).length === 0 || sessionCount <= 0) {
        return sessions;
    }

    let cursorDate = new Date(startDateStr + 'T00:00:00');

    while (Object.keys(sessions).length < sessionCount) {
        const dayIndex = cursorDate.getDay();

        if (schedule[dayIndex]) {
            // === PHẦN SỬA LỖI QUAN TRỌNG NHẤT LÀ Ở ĐÂY ===
            // Bỏ .toISOString() và định dạng ngày thủ công theo giờ địa phương
            const year = cursorDate.getFullYear();
            const month = String(cursorDate.getMonth() + 1).padStart(2, '0');
            const day = String(cursorDate.getDate()).padStart(2, '0');
            const dateKey = `${year}-${month}-${day}`;
            // ===============================================

            if (!sessions[dateKey]) {
                sessions[dateKey] = {
                    time: schedule[dayIndex]
                };
            }
        }
        cursorDate.setDate(cursorDate.getDate() + 1);
    }
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
  const overlay = document.getElementById("class-attendance-modal-overlay");
  if (overlay) overlay.style.display = "none";
  
  // Thêm bước kiểm tra null để tránh lỗi
  const titleEl = document.getElementById("current-class-attendance-name");
  if (titleEl && titleEl.dataset) {
      titleEl.dataset.classId = '';
  }
  
  // Dòng code gây lỗi đã được xóa bỏ khỏi đây
}
function scrollClassAttendanceBySessions(direction) {
  const scrollContainer = document.getElementById("class-attendance-scroll-container");
  const step = 120 * 5; // 5 cột, mỗi cột 120px min-width
  scrollContainer.scrollLeft += direction * step;
}
// script.js
// MỚI: Hiển thị bảng điểm danh & bài tập khi click "Điểm Danh"
async function showClassAttendanceAndHomeworkTable(classId) {
    showLoading(true);
    try {
        // --- BỔ SUNG LOGIC ĐỂ LƯU LẠI CLASS ID ---
        const modalTitle = document.getElementById("class-attendance-modal-title");
        if (modalTitle) {
            // Gán ID của lớp vào thuộc tính data-class-id của tiêu đề modal
            modalTitle.dataset.classId = classId;
        }
        // --- KẾT THÚC PHẦN BỔ SUNG ---

        // Gọi hàm render bảng như cũ
        await renderClassAttendanceTable(classId);

    } catch (error) {
        console.error("Lỗi khi hiển thị bảng điểm danh:", error);
        Swal.fire("Lỗi", "Không thể hiển thị bảng điểm danh.", "error");
    } finally {
        showLoading(false);
    }
}
/**
 * HÀM MỚI: Mở hộp thoại để thêm một buổi học dự phòng/bổ sung.
 */
async function promptAddExtraSession() {
    const classId = document.getElementById('class-attendance-modal-title').dataset.classId;
    if (!classId) {
        Swal.fire("Lỗi", "Không thể xác định được lớp học hiện tại.", "error");
        return;
    }

    const classData = allClassesData[classId];
    if (!classData) return;

    const { value: formValues } = await Swal.fire({
        title: 'Thêm buổi học dự phòng',
        html: `
            <div style="text-align: left; margin-top: 20px;">
                <label for="swal-new-date"><b>Ngày và giờ của buổi học mới:</b></label>
                <input type="date" id="swal-new-date" class="swal2-input" style="width: 100%;">
                <input type="time" id="swal-new-time" class="swal2-input" style="width: 100%;">
            </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Thêm Buổi',
        cancelButtonText: 'Hủy',
        preConfirm: () => {
            const newDate = document.getElementById('swal-new-date').value;
            const newTime = document.getElementById('swal-new-time').value;
            if (!newDate || !newTime) {
                Swal.showValidationMessage('Vui lòng nhập đầy đủ ngày và giờ.');
                return false;
            }
            // Kiểm tra xem ngày mới có bị trùng không
            if (classData.sessions?.[newDate] || classData.exams?.[newDate]) {
                 Swal.showValidationMessage('Ngày này đã bị trùng với một buổi học/buổi thi khác.');
                return false;
            }
            return { newDate, newTime };
        }
    });

    if (formValues) {
        const { newDate, newTime } = formValues;
        showLoading(true);
        try {
            const updates = {};
            // Thêm buổi học mới và đánh dấu là "buổi thêm"
            updates[`/classes/${classId}/sessions/${newDate}`] = { time: newTime, type: "extra" };

            await database.ref().update(updates);
            await logActivity(`Đã thêm buổi học dự phòng ngày ${newDate} cho lớp ${classData.name}`);

            // Tải lại bảng điểm danh để hiển thị buổi mới
            await renderClassAttendanceTable(classId);

            Swal.fire('Thành công!', 'Đã thêm buổi học mới thành công.', 'success');

        } catch (error) {
            console.error("Lỗi khi thêm buổi học:", error);
            Swal.fire("Lỗi", "Đã xảy ra lỗi: " + error.message, "error");
        } finally {
            showLoading(false);
        }
    }
}
/**
 * HÀM MỚI: Mở hộp thoại để tạo một buổi học bù thay thế cho một buổi học cũ.
 */
async function promptCreateMakeupSession() {
    const classId = document.getElementById('class-attendance-modal-title').dataset.classId;
    if (!classId) {
        Swal.fire("Lỗi", "Không thể xác định được lớp học hiện tại.", "error");
        return;
    }

    const classData = allClassesData[classId];
    if (!classData || !classData.sessions) return;

    // 1. Lọc ra những buổi học trong tương lai để cho phép thay thế
    const todayStr = new Date().toISOString().split('T')[0];
    const futureSessions = Object.keys(classData.sessions)
        .filter(date => date >= todayStr)
        .sort();

    if (futureSessions.length === 0) {
        Swal.fire("Thông báo", "Không có buổi học nào trong tương lai để thay thế.", "info");
        return;
    }

    // 2. Tạo HTML cho các lựa chọn trong hộp thoại
    const optionsHtml = futureSessions.map(date => `<option value="${date}">Buổi ngày: ${date}</option>`).join('');

    // 3. Hiển thị hộp thoại Swal để nhập thông tin
    const { value: formValues } = await Swal.fire({
        title: 'Tạo buổi học bù',
        html: `
            <div style="text-align: left; margin-top: 20px;">
                <label for="swal-new-date"><b>Ngày và giờ bù:</b></label>
                <input type="date" id="swal-new-date" class="swal2-input" style="width: 100%;">
                <input type="time" id="swal-new-time" class="swal2-input" style="width: 100%;">

                <label for="swal-old-date" style="margin-top: 15px; display: block;"><b>Buổi học được thay thế:</b></label>
                <select id="swal-old-date" class="swal2-select" style="width: 100%;">
                    <option value="">-- Chọn buổi cần thay thế --</option>
                    ${optionsHtml}
                </select>
            </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Xác nhận',
        cancelButtonText: 'Hủy',
        preConfirm: () => {
            const newDate = document.getElementById('swal-new-date').value;
            const newTime = document.getElementById('swal-new-time').value;
            const oldDate = document.getElementById('swal-old-date').value;
            if (!newDate || !newTime || !oldDate) {
                Swal.showValidationMessage('Vui lòng điền đầy đủ tất cả thông tin.');
                return false;
            }
            if (classData.sessions[newDate] || (classData.exams && classData.exams[newDate])) {
                 Swal.showValidationMessage('Ngày bù đã bị trùng với một buổi học/buổi thi khác.');
                return false;
            }
            return { newDate, newTime, oldDate };
        }
    });

    if (formValues) {
        const { newDate, newTime, oldDate } = formValues;
        showLoading(true);
        try {
            // 4. Chuẩn bị cập nhật lên Firebase
            const updates = {};
            // Xóa buổi học cũ
            updates[`/classes/${classId}/sessions/${oldDate}`] = null;
            // Thêm buổi học mới và đánh dấu là "buổi bù"
            updates[`/classes/${classId}/sessions/${newDate}`] = { time: newTime, type: "makeup" };

            await database.ref().update(updates);
            await logActivity(`Đã tạo buổi bù ngày ${newDate} thay thế cho buổi ${oldDate} của lớp ${classData.name}`);

            // Tải lại bảng điểm danh để hiển thị sự thay đổi
            await renderClassAttendanceTable(classId);

            Swal.fire('Thành công!', 'Đã cập nhật lịch học.', 'success');

        } catch (error) {
            console.error("Lỗi khi tạo buổi bù:", error);
            Swal.fire("Lỗi", "Đã xảy ra lỗi: " + error.message, "error");
        } finally {
            showLoading(false);
        }
    }
}
async function renderClassAttendanceTable(classId) {
    showLoading(true);
    try {
        const classSnap = await database.ref(`classes/${classId}`).once("value");
        const classData = classSnap.val();
        if (!classData) throw new Error("Không tìm thấy dữ liệu lớp học.");

        const studentIds = Object.keys(classData.students || {});
        const studentPromises = studentIds.map(id => database.ref(`students/${id}`).once('value'));
        const studentSnapshots = await Promise.all(studentPromises);
        const students = {};
        studentSnapshots.forEach(snap => {
            if (snap.exists()) students[snap.key] = snap.val();
        });

        const attendanceSnap = await database.ref(`attendance/${classId}`).once('value');
        const allAttendance = attendanceSnap.val() || {};
        const sessions = classData.sessions || {};
        const exams = classData.exams || {};
        const allEventDates = [...new Set([...Object.keys(sessions), ...Object.keys(exams)])].sort();

        const tableHeadRow = document.getElementById("class-attendance-table-head");
        const tableBody = document.getElementById("class-attendance-table-body");

        let headerHTML = `<tr><th style="min-width: 200px;">Họ tên</th>`;
        allEventDates.forEach(dateKey => {
            const isExam = !!exams[dateKey];
            const sessionData = sessions[dateKey];
            let eventName;

            if (isExam) {
                eventName = exams[dateKey].name || 'Bài KT';
            } else if (sessionData && sessionData.type === 'makeup') {
                eventName = 'Buổi học bù';
            } else if (sessionData && sessionData.type === 'extra') {
                // THÊM LOGIC MỚI ĐỂ HIỂN THỊ TÊN BUỔI HỌC THÊM
                eventName = 'Buổi học thêm';
            } else {
                eventName = 'Buổi học';
            }

            const formattedDate = new Date(dateKey + 'T00:00:00').toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
            headerHTML += `<th class="${isExam ? 'exam-header' : ''}" style="position: relative;"><button class="delete-session-btn" onclick="deleteSession('${classId}', '${dateKey}', ${isExam})" title="Xóa buổi này">×</button>${eventName}<br><small>${formattedDate}</small></th>`;
        });
        headerHTML += `</tr>`;
        tableHeadRow.innerHTML = headerHTML;

        let bodyHTML = "";
        for (const studentId in students) {
            const student = students[studentId];
            const sessionsAttended = student.sessionsAttended || 0;
            const totalSessionsPaid = student.totalSessionsPaid || 0;
            const remainingSessions = totalSessionsPaid - sessionsAttended;
            let warningClass = '';
            let iconHtml = '';
            if (remainingSessions <= 0) {
                warningClass = 'student-warning-critical';
            } else if (remainingSessions <= 3) {
                warningClass = 'student-warning-low';
                iconHtml = '<span class="warning-icon">&#9888;</span> ';
            }

            let rowHTML = `<tr><td class="${warningClass}">${iconHtml}${student.name}</td>`;
            allEventDates.forEach(dateKey => {
                const isExam = !!exams[dateKey];
                const attendanceData = allAttendance[studentId] ? allAttendance[studentId][dateKey] : undefined;
                const isChecked = attendanceData && attendanceData.attended === true;
                rowHTML += `<td><input type="checkbox" onchange="toggleAttendance('${classId}', '${studentId}', '${dateKey}', this.checked, ${isExam})" ${isChecked ? "checked" : ""}></td>`;
            });
            rowHTML += `</tr>`;
            bodyHTML += rowHTML;
        }
        tableBody.innerHTML = bodyHTML;

        const modalTitle = document.getElementById("class-attendance-modal-title");
        modalTitle.textContent = `Bảng điểm danh: ${classData.name}`;
        modalTitle.dataset.classId = classId; 

        document.getElementById("class-attendance-modal-overlay").style.display = "flex";

        setTimeout(() => {
            const scrollContainer = document.getElementById("class-attendance-scroll-container");
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const closestIndex = allEventDates.findIndex(date => new Date(date + 'T00:00:00') >= today);
            const firstDateColumn = tableHeadRow.querySelector("tr th:nth-child(2)");
            if (!firstDateColumn) return;
            const columnWidth = firstDateColumn.offsetWidth;
            let scrollPosition = 0;
            if (closestIndex === -1) {
                scrollPosition = scrollContainer.scrollWidth;
            } else {
                const targetColumnIndex = closestIndex + 1;
                scrollPosition = Math.max(0, targetColumnIndex - 2) * columnWidth;
            }
            scrollContainer.scrollLeft = scrollPosition;
        }, 100);

    } catch (error) {
        console.error("Lỗi khi render bảng điểm danh:", error);
        Swal.fire("Lỗi", "Không thể tải bảng điểm danh: " + error.message, "error");
    } finally {
        showLoading(false);
    }
}
// MỚI: Hiển thị bảng điểm danh & bài tập khi click "Điểm Danh"
async function showClassAttendanceAndHomeworkTable(classId) {
    // Chỉ cần gọi hàm render chính, mọi logic đã nằm trong đó
    await renderClassAttendanceTable(classId);
}

function formatDate(dateString) {
    if (!dateString) return '';
    const parts = dateString.split('-'); // Tách chuỗi thành [YYYY, MM, DD]
    return `${parts[2]}/${parts[1]}`; // Trả về DD/MM
}
function renderAttendanceCell(cell, classId, studentId, dateKey, isExam, attendanceData) {
    const isChecked = attendanceData && attendanceData.attended === true;
    const scoreValue = (attendanceData && attendanceData.score !== undefined) ? attendanceData.score : "";

    let scoreInputHTML = '';
    if (isExam) {
        // Input cho bài kiểm tra (nhập điểm số)
        scoreInputHTML = `
            <input 
                type="number" class="exam-score-input" min="0" max="10" step="0.5" 
                value="${scoreValue}" placeholder="Điểm" 
                onchange="updateHomeworkScore('${classId}', '${studentId}', '${dateKey}', this.value)" 
            />`;
    } else {
        // --- LOGIC MỚI CHO DROPDOWN ĐÁNH GIÁ VỚI MÀU SẮC ---
        const scoreOptions = [
            { value: "", text: "Chưa đánh giá", color: "#6c757d" },
            { value: "Không tích cực", text: "Không tích cực", color: "#dc3545" },
            { value: "Tích cực", text: "Tích cực", color: "#28a745" },
            { value: "Rất tích cực", text: "Rất tích cực", color: "#007bff" }
        ];

        // Tìm màu sắc ban đầu dựa trên giá trị đã lưu
        const initialColor = (scoreOptions.find(opt => opt.value === scoreValue) || scoreOptions[0]).color;
        
        // Tạo các thẻ <option> với thuộc tính data-color
        let optionsHTML = scoreOptions.map(opt =>
            `<option value="${opt.value}" data-color="${opt.color}" ${scoreValue === opt.value ? 'selected' : ''}>${opt.text}</option>`
        ).join('');

        // Tạo thẻ <select> với style và onchange để tự cập nhật màu
        scoreInputHTML = `
            <select 
                class="evaluation-select" 
                style="color: ${initialColor}; font-weight: bold;"
                onchange="
                    this.style.color = this.options[this.selectedIndex].dataset.color;
                    updateHomeworkScore('${classId}', '${studentId}', '${dateKey}', this.value);
                ">
                ${optionsHTML}
            </select>`;
    }

    cell.innerHTML = `
        <input 
            type="checkbox" 
            onchange="toggleAttendance('${classId}', '${studentId}', '${dateKey}', this.checked, ${isExam})" 
            ${isChecked ? "checked" : ""} 
        />
        ${scoreInputHTML}
    `;
}
async function promptAddSession(classId, afterDate) {
  const { value: formValues, isConfirmed } = await Swal.fire({
    title: 'Thêm buổi học bù',
    html: `
      <input type="date" id="swal-input-date" class="swal2-input">
      <input type="time" id="swal-input-time" class="swal2-input">
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Thêm',
    cancelButtonText: 'Hủy',
    preConfirm: () => {
      const newDate = document.getElementById('swal-input-date').value;
      const newTime = document.getElementById('swal-input-time').value;
      if (!newDate || !newTime) {
        Swal.showValidationMessage('Vui lòng nhập đầy đủ ngày và giờ');
      }
      return { newDate, newTime };
    }
  });

  if (isConfirmed && formValues) {
    const { newDate, newTime } = formValues;
    showLoading(true);
    try {
      // Thêm buổi học mới vào node 'sessions' của lớp
      const sessionRef = database.ref(`classes/${classId}/sessions/${newDate}`);
      await sessionRef.set({
        time: newTime,
        type: 'makeup' // Đánh dấu đây là buổi học bù
      });
      // Tải lại bảng điểm danh để hiển thị cột mới
      await renderClassAttendanceTable(classId);
      Swal.fire('Đã thêm!', `Buổi học ngày ${newDate} đã được thêm.`, 'success');
    } catch (error) {
      console.error("Lỗi thêm buổi học:", error);
      Swal.fire('Lỗi', 'Không thể thêm buổi học: ' + error.message, 'error');
    } finally {
      showLoading(false);
    }
  }
}
async function deleteSession(classId, dateToDelete, isExam) {
    const sessionType = isExam ? "buổi thi" : "buổi học";
    const result = await Swal.fire({
        title: `Bạn chắc chắn muốn xóa ${sessionType} ngày ${dateToDelete}?`,
        text: "Hành động này sẽ xóa điểm danh và điểm của ngày này. Không thể hoàn tác!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Vâng, xóa nó!',
        cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
        showLoading(true);
        try {
            const classSnap = await database.ref(`classes/${classId}`).once("value");
            const cls = classSnap.val();
            if (!cls) throw new Error("Không tìm thấy lớp học.");

            const studentIds = Object.keys(cls.students || {});
            const updates = {};
            
            if (isExam) {
                updates[`/classes/${classId}/exams/${dateToDelete}`] = null;
            } else {
                updates[`/classes/${classId}/sessions/${dateToDelete}`] = null;
            }

            for (const studentId of studentIds) {
                const attendanceRecordRef = database.ref(`attendance/${classId}/${studentId}/${dateToDelete}`);
                const attendanceRecordSnap = await attendanceRecordRef.once("value");

                // --- PHẦN SỬA LỖI QUAN TRỌNG NHẤT LÀ Ở ĐÂY ---
                // Kiểm tra đúng định dạng dữ liệu { attended: true }
                if (attendanceRecordSnap.val()?.attended === true && !isExam) {
                    const studentAttendedRef = database.ref(`students/${studentId}/sessionsAttended`);
                    // Thực hiện giảm số buổi đã học
                    await studentAttendedRef.transaction((currentValue) => (currentValue || 0) - 1);
                }
                // --- KẾT THÚC PHẦN SỬA LỖI ---

                updates[`/attendance/${classId}/${studentId}/${dateToDelete}`] = null;
                updates[`/homeworkScores/${classId}/${studentId}/${dateToDelete}`] = null; // Vẫn xóa điểm nếu có
            }

            await database.ref().update(updates);
            await renderClassAttendanceTable(classId);
            Swal.fire('Đã xóa!', `${sessionType.charAt(0).toUpperCase() + sessionType.slice(1)} ngày ${dateToDelete} đã được xóa.`, 'success');

        } catch (error) {
            console.error("Lỗi xóa buổi học:", error);
            Swal.fire('Lỗi', 'Không thể xóa buổi học: ' + error.message, 'error');
        } finally {
            showLoading(false);
        }
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
async function toggleAttendance(classId, studentId, dateStr, isChecked, isExamSession) {
    const attendanceRef = database.ref(`attendance/${classId}/${studentId}/${dateStr}`);

    try {
        // Cập nhật trạng thái điểm danh
        await attendanceRef.transaction(currentData => {
            const data = (currentData && typeof currentData === 'object') ? currentData : {};
            data.attended = isChecked;
            return data;
        });

        // Chỉ xử lý logic đếm buổi và tự động gia hạn cho các buổi học thông thường
        if (!isExamSession) {
            const studentSessionsRef = database.ref(`students/${studentId}/sessionsAttended`);
            const delta = isChecked ? 1 : -1;
            
            // Cập nhật số buổi đã học và lấy giá trị mới nhất
            const { committed, snapshot } = await studentSessionsRef.transaction(currentValue => {
                return (currentValue || 0) + delta;
            });

            // --- THÊM ĐOẠN CODE MỚI ĐỂ KIỂM TRA VÀ KÍCH HOẠT GIA HẠN ---
            if (committed && isChecked) {
                const newAttendedCount = snapshot.val();
                const classData = allClassesData[classId];

                // Kiểm tra nếu đây là lớp phổ thông/môn trên trường và số buổi đã học là bội số của 16
                if (classData && (classData.classType === 'Lớp tiếng Anh phổ thông' || classData.classType === 'Lớp các môn trên trường') && newAttendedCount > 0 && newAttendedCount % 16 === 0) {
                    // Gọi hàm tự động thêm 16 buổi mới (hàm này sẽ chạy ngầm)
                    autoExtendSchedule(classId);
                }
            }
            // --- KẾT THÚC ĐOẠN CODE MỚI ---
        }
    } catch (error) {
        console.error("Lỗi khi cập nhật điểm danh:", error);
        Swal.fire("Lỗi", "Không thể cập nhật điểm danh.", "error");
    }
}
/**
 * HÀM MỚI: Tự động thêm 16 buổi học vào cuối lịch trình của một lớp.
 * @param {string} classId - ID của lớp cần thêm buổi.
 */
async function autoExtendSchedule(classId) {
    console.log(`Bắt đầu kiểm tra và tự động thêm buổi cho lớp: ${classId}`);
    try {
        const classRef = database.ref(`classes/${classId}`);
        const classSnap = await classRef.once('value');
        const classData = classSnap.val();

        // Chỉ thực hiện nếu lớp tồn tại và có đủ thông tin
        if (!classData || !classData.sessions || !classData.fixedSchedule) {
            console.warn("Dữ liệu lớp không đầy đủ, không thể tự động thêm buổi.");
            return;
        }

        // Tìm ngày học cuối cùng trong lịch hiện tại
        const existingSessions = Object.keys(classData.sessions).sort();
        const lastSessionDateStr = existingSessions[existingSessions.length - 1];
        
        const nextDay = new Date(lastSessionDateStr);
        nextDay.setDate(nextDay.getDate() + 1);
        const newStartDateStr = nextDay.toISOString().split('T')[0];

        // Số buổi cần tạo luôn là 16
        const sessionsToGenerate = 16;

        // Tạo ra 16 buổi học mới
        const newSessions = generateRollingSessions(newStartDateStr, sessionsToGenerate, classData.fixedSchedule);

        // Chuẩn bị dữ liệu để cập nhật
        const updates = {};
        for (const dateKey in newSessions) {
            updates[`/classes/${classId}/sessions/${dateKey}`] = newSessions[dateKey];
        }
        
        // Cập nhật lên Firebase
        await database.ref().update(updates);
        console.log(`THÀNH CÔNG: Đã tự động thêm ${sessionsToGenerate} buổi học mới cho lớp ${classId}.`);

    } catch (error) {
        console.error(`Lỗi khi tự động thêm buổi cho lớp ${classId}:`, error);
    }
}
/**
 * Hàm hỗ trợ tạo và thêm một buổi thi đặc biệt vào cơ sở dữ liệu.
 * @param {string} classId - ID của lớp học.
 * @param {object} examData - Dữ liệu của bài thi, ví dụ: { date, name, type }.
 */
async function generateAndAddExam(classId, examData) {
  try {
    // Luôn sử dụng ngày tháng (YYYY-MM-DD) làm key chính
    const examRef = database.ref(`classes/${classId}/exams/${examData.date}`);
    
    const existingExam = (await examRef.once('value')).val();
    if (existingExam) {
      console.log(`Bài thi tại ngày ${examData.date} đã tồn tại, bỏ qua.`);
      return;
    }
    
    await examRef.set({
      name: examData.name,
      type: examData.type,
      createdAt: firebase.database.ServerValue.TIMESTAMP
    });
    console.log(`Đã tạo thành công bài thi: ${examData.name} cho lớp ${classId}`);
  } catch (error) {
    console.error(`Lỗi khi tạo bài thi đặc biệt: `, error);
  }
}
function updateHomeworkScore(classId, studentId, dateStr, value) {
  const scoreRef = database.ref(`attendance/${classId}/${studentId}/${dateStr}`);
  
  scoreRef.transaction(currentData => {
    const data = (currentData && typeof currentData === 'object') ? currentData : {};
    if (value === "") {
      // Nếu giá trị rỗng, xóa thuộc tính score
      delete data.score;
    } else {
      data.score = value;
    }
    return data;
  });
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
// ===================== Loading =====================
function showLoading(show) {
  document.getElementById("loading").style.display = show ? "block" : "none";
}
async function recalculateAllStudentTuition() {
    // Bước 1: Xác nhận trước khi chạy
    if (!confirm("⚠️ BẠN CÓ CHẮC CHẮN MUỐN TÍNH LẠI TOÀN BỘ HỌC PHÍ CHO TẤT CẢ HỌC VIÊN KHÔNG?\n\nHành động này sẽ ghi đè dữ liệu cũ và KHÔNG THỂ HOÀN TÁC. Hãy chắc chắn rằng bạn đã sao lưu dữ liệu nếu cần thiết.")) {
        console.log("Hành động đã được hủy bỏ.");
        return;
    }

    console.log("Bắt đầu quá trình tính lại học phí...");
    showLoading(true);

    try {
        // Bước 2: Lấy toàn bộ dữ liệu học viên
        const snapshot = await database.ref('students').once('value');
        const allStudents = snapshot.val();

        if (!allStudents) {
            Swal.fire("Không có dữ liệu", "Không tìm thấy học viên nào.", "info");
            return;
        }

        const updates = {};
        let updatedCount = 0;

        // Bước 3: Lặp qua từng học viên để tính toán lại
        for (const studentId in allStudents) {
            const st = allStudents[studentId];

            // Cần có thông tin gói và giá gốc để tính
            if (!st.package || st.originalPrice === undefined) {
                console.warn(`Bỏ qua học viên ${st.name || studentId} vì thiếu thông tin gói hoặc giá gốc.`);
                continue;
            }

            let basePrice = parseFloat(st.originalPrice);
            let finalPrice = basePrice;

            // Trích xuất tên khóa học sạch từ chuỗi package
            // Ví dụ: từ "Combo 3X: Tiếng Anh cho trẻ em (Mầm non) (24 buổi)" -> "Combo 3X: Tiếng Anh cho trẻ em (Mầm non)"
            const courseName = st.package.replace(/\s*\(\d+\s+buổi\)$/, '').trim();

            // Áp dụng lại logic chiết khấu tuần tự y hệt hàm calculateFinalPrice
            // 2.1. Áp dụng chiết khấu cố định của gói
            let packageDiscountPercent = 0;
            // Lớp tiếng Anh phổ thông
            if (courseName.includes("Combo 3X")) packageDiscountPercent = 5;
            else if (courseName.includes("Combo 6X")) packageDiscountPercent = 11;
            else if (courseName.includes("Combo 12X")) packageDiscountPercent = 25;
            // IELTS
            else if (courseName.includes('Combo 2 khóa')) packageDiscountPercent = 20;
            else if (courseName.includes('Combo 3 khóa')) packageDiscountPercent = 22;
            else if (courseName.includes('Combo 4 khóa')) packageDiscountPercent = 25;
            else if (courseName.includes('Combo 5 khóa')) packageDiscountPercent = 28;
            
            finalPrice *= (1 - packageDiscountPercent / 100);

            // 2.2. Áp dụng chiết khấu YCT
            if (st.package.toLowerCase().includes('yct')) {
                finalPrice *= (1 - 10 / 100);
            }

            // 2.3. Áp dụng "Mã giảm giá" đã lưu của học viên
            const discountCodePercent = parseFloat(st.discountPercent) || 0;
            finalPrice *= (1 - discountCodePercent / 100);

            // 2.4. Áp dụng "Khuyến mại" đã lưu của học viên
            const promotionPercent = parseFloat(st.promotionPercent) || 0;
            finalPrice *= (1 - promotionPercent / 100);

            const newTotalDue = Math.round(finalPrice);
            
            // Chỉ cập nhật nếu giá trị mới khác giá trị cũ
            if (newTotalDue !== st.totalDue) {
                updates[`/students/${studentId}/totalDue`] = newTotalDue;
                updatedCount++;
            }
        }

        // Bước 4: Gửi một lần cập nhật duy nhất lên Firebase
        if (Object.keys(updates).length > 0) {
            await database.ref().update(updates);
            Swal.fire("Hoàn tất!", `Đã tính lại và cập nhật học phí cho ${updatedCount} học viên.`, "success");
            console.log(`Đã cập nhật thành công ${updatedCount} học viên.`);
        } else {
            Swal.fire("Hoàn tất!", "Không có học viên nào cần cập nhật học phí.", "info");
            console.log("Không có học viên nào cần cập nhật.");
        }

    } catch (error) {
        console.error("Lỗi nghiêm trọng trong quá trình tính lại học phí:", error);
        Swal.fire("Lỗi!", "Đã xảy ra lỗi: " + error.message, "error");
    } finally {
        showLoading(false);
    }
}
async function backfillCreatedAtTimestamp() {
  const isConfirmed = confirm(
    "⚠️ BẠN CÓ CHẮC CHẮN MUỐN CẬP NHẬT 'NGÀY TẠO' CHO DỮ LIỆU CŨ KHÔNG?\n\nHành động này sẽ duyệt qua toàn bộ học viên và dùng 'ngày sửa đổi' để điền vào 'ngày tạo' nếu bị thiếu. Chỉ nên chạy hành động này MỘT LẦN."
  );

  if (!isConfirmed) {
    alert("Hành động đã được hủy.");
    return;
  }

  showLoading(true);
  try {
    const snapshot = await database.ref(DB_PATHS.STUDENTS).once('value');
    const allStudents = snapshot.val() || {};
    const updates = {};
    let updatedCount = 0;

    for (const studentId in allStudents) {
      const student = allStudents[studentId];
      // Chỉ cập nhật nếu 'createdAt' không tồn tại VÀ 'updatedAt' tồn tại
      if (!student.createdAt && student.updatedAt) {
        updates[`/${DB_PATHS.STUDENTS}/${studentId}/createdAt`] = student.updatedAt;
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      await database.ref().update(updates);
      Swal.fire(
        'Thành công!',
        `Đã cập nhật ngày tạo cho ${updatedCount} học viên cũ. Vui lòng tải lại trang.`,
        'success'
      );
    } else {
      Swal.fire('Không có gì để cập nhật', 'Tất cả học viên đã có ngày tạo.', 'info');
    }

  } catch (error) {
    console.error("Lỗi khi cập nhật dữ liệu cũ:", error);
    Swal.fire('Lỗi!', 'Đã xảy ra lỗi: ' + error.message, 'error');
  } finally {
    showLoading(false);
  }
}
async function recalculateAllStudentTuition_OneTime() {
  const isConfirmed = confirm(
    "BẠN CÓ CHẮC CHẮN MUỐN TÍNH LẠI HỌC PHÍ CHO TẤT CẢ HỌC VIÊN KHÔNG?\n\nHành động này sẽ ghi đè dữ liệu cũ và KHÔNG THỂ HOÀN TÁC."
  );

  if (!isConfirmed) {
    alert("Hành động đã được hủy bỏ.");
    return;
  }

  showLoading(true);
  console.log("Bắt đầu quá trình tính lại học phí hàng loạt (phiên bản nâng cấp)...");

  try {
    const snapshot = await database.ref(DB_PATHS.STUDENTS).once('value');
    const allStudents = snapshot.val() || {};
    const updates = {};
    let updatedCount = 0;
    let errorCount = 0;

    for (const studentId in allStudents) {
      const st = allStudents[studentId];

      if (!st.package) {
        continue;
      }

      try {
        const courseNameClean = st.package.replace(/\s*\([\s\S]*\)$/, '').trim();
        let basePrice = 0;

        // =================================================================
        // === LOGIC NÂNG CẤP: XỬ LÝ GÓI COMBO ===
        // =================================================================
        const isCombo = Array.isArray(st.selectedComboCourses) && st.selectedComboCourses.length > 0;

        if (isCombo) {
          // Nếu là combo, tính tổng giá các khóa con
          console.log(`Đang xử lý gói combo cho ${st.name}: ${st.selectedComboCourses.join(', ')}`);
          for (const subCourseName of st.selectedComboCourses) {
            const subCoursePrice = coursePrices[subCourseName];
            if (subCoursePrice !== undefined) {
              basePrice += subCoursePrice;
            } else {
              console.warn(`-> Không tìm thấy giá cho khóa con "${subCourseName}"`);
            }
          }
        } else {
          // Nếu không phải combo, lấy giá như bình thường
          basePrice = coursePrices[courseNameClean];
        }
        // =================================================================

        if (basePrice === undefined || basePrice === 0) {
            console.warn(`Bỏ qua học viên ${st.name || studentId}: Không thể xác định giá gốc cho gói "${courseNameClean}"`);
            errorCount++;
            continue;
        }

        let finalPrice = basePrice;
        let packageDiscountPercent = 0;

        if (courseNameClean.includes("3X")) packageDiscountPercent = 5;
        else if (courseNameClean.includes("6X")) packageDiscountPercent = 11;
        else if (courseNameClean.includes("12X")) packageDiscountPercent = 25;
        // Chiết khấu cho Combo IELTS
        else if (courseNameClean.includes('IELTS') && courseNameClean.includes('Combo 2 khóa')) packageDiscountPercent = 20;
        else if (courseNameClean.includes('IELTS') && courseNameClean.includes('Combo 3 khóa')) packageDiscountPercent = 22;
        else if (courseNameClean.includes('IELTS') && courseNameClean.includes('Combo 4 khóa')) packageDiscountPercent = 25;
        else if (courseNameClean.includes('IELTS') && courseNameClean.includes('Combo 5 khóa')) packageDiscountPercent = 28;
        // Chiết khấu cho Combo HSK/YCT
        else if (courseNameClean.includes('Combo HSK + HSKK: 2 khoá') || courseNameClean.includes('Combo YCT + YCTK: 2 khoá')) packageDiscountPercent = 5;
        else if (courseNameClean.includes('Combo HSK + HSKK: 3 khoá') || courseNameClean.includes('Combo YCT + YCTK: 3 khoá')) packageDiscountPercent = 8;
        else if (courseNameClean.includes('Combo HSK + HSKK: 4 khoá') || courseNameClean.includes('Combo YCT + YCTK: 4 khoá')) packageDiscountPercent = 12;
        else if (courseNameClean.includes('Combo HSK + HSKK: 5 khoá') || courseNameClean.includes('Combo YCT + YCTK: 5 khoá')) packageDiscountPercent = 15;
        else if (courseNameClean.includes('Combo Giao Tiếp: 2 khoá')) packageDiscountPercent = 10;
        else if (courseNameClean.includes('Combo Giao Tiếp: 3 khoá')) packageDiscountPercent = 15;


        finalPrice *= (1 - packageDiscountPercent / 100);

        if (courseNameClean.toLowerCase().includes('yct')) {
          finalPrice *= (1 - 10 / 100);
        }

        const discountCodePercent = parseFloat(st.discountPercent) || 0;
        finalPrice *= (1 - discountCodePercent / 100);

        const promotionPercent = parseFloat(st.promotionPercent) || 0;
        finalPrice *= (1 - promotionPercent / 100);

        const newTotalDue = Math.round(finalPrice);

        if (st.originalPrice !== basePrice || st.totalDue !== newTotalDue) {
          updates[`/${DB_PATHS.STUDENTS}/${studentId}/originalPrice`] = basePrice;
          updates[`/${DB_PATHS.STUDENTS}/${studentId}/totalDue`] = newTotalDue;
          updatedCount++;
        }
      } catch (e) {
        console.error(`Lỗi xử lý học viên ${st.name || studentId}:`, e.message);
        errorCount++;
      }
    }

    if (updatedCount > 0) {
      await database.ref().update(updates);
      Swal.fire('Hoàn tất!', `Đã tính lại và cập nhật học phí cho ${updatedCount} học viên.`, 'success');
    } else {
      Swal.fire('Không có gì thay đổi', 'Không có học viên nào cần cập nhật học phí.', 'info');
    }
    
    if (errorCount > 0) {
      alert(`Không thể xử lý ${errorCount} học viên do tên gói không hợp lệ hoặc thiếu thông tin. Vui lòng kiểm tra console (F12) và chỉnh sửa thủ công các trường hợp này.`);
    }

  } catch (error) {
    console.error("Lỗi nghiêm trọng trong quá trình tính lại học phí:", error);
    Swal.fire("Lỗi!", "Đã xảy ra lỗi: " + error.message, "error");
  } finally {
    showLoading(false);
  }
}
/*
* HÀM MỚI: Hiển thị hộp thoại lựa chọn hành động (Sửa/Gia hạn) cho học viên
 * @param {string} studentId - ID của học viên được chọn
 */
function showStudentActionOptions(studentId) {
  Swal.fire({
    title: 'Chọn hành động',
    html: `
      <p>Bạn muốn làm gì với học viên này?</p>
      <div class="swal-custom-buttons">
        <button id="swal-edit-btn" class="swal2-styled">Sửa thông tin</button>
        <button id="swal-renew-btn" class="swal2-styled">Gia hạn gói</button>
        <button id="swal-progress-btn" class="swal2-styled">Xem tiến bộ</button>
      </div>
    `,
    // THÊM DÒNG NÀY ĐỂ HIỂN THỊ NÚT 'X'
    showCloseButton: true,

    // Ẩn các nút mặc định ở dưới
    showConfirmButton: false,
    showDenyButton: false,
    showCancelButton: false,
  });

  // Gán sự kiện click cho từng nút đã tạo
  document.getElementById('swal-edit-btn').addEventListener('click', () => {
    Swal.close();
    editStudent(studentId);
  });

  document.getElementById('swal-renew-btn').addEventListener('click', () => {
    Swal.close();
    showRenewPackageForm(studentId);
  });

  document.getElementById('swal-progress-btn').addEventListener('click', () => {
    Swal.close();
    showStudentProgressModal(studentId);
  });
}
function promptResetPackage() {
  const studentId = document.getElementById("student-index").value;

  if (!studentId) {
    Swal.fire("Thông báo", "Không thể reset khi đang tạo hồ sơ mới.", "info");
    return;
  }

  // LẤY TÊN HỌC VIÊN TỪ DỮ LIỆU TOÀN CỤC
  const studentName = allStudentsData[studentId]?.name || 'Không rõ tên';

  Swal.fire({
    title: 'Xác nhận Reset',
    text: "Bạn có chắc chắn muốn xóa toàn bộ thông tin gói đăng ký, học phí và số buổi học của học viên này không? Hành động này không thể hoàn tác!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Vâng, Reset ngay!',
    cancelButtonText: 'Hủy'
  }).then(async (result) => {
    if (result.isConfirmed) {
      showLoading(true);
      try {
        const resetData = {
          package: "",
          totalSessionsPaid: 0,
          sessionsAttended: 0,
          originalPrice: 0,
          totalDue: 0,
          discountPercent: 0,
          promotionPercent: 0,
          selectedComboCourses: null,
          updatedAt: firebase.database.ServerValue.TIMESTAMP
        };

        await database.ref(`${DB_PATHS.STUDENTS}/${studentId}`).update(resetData);
        await logActivity(`Đã reset gói học cho: ${studentName}`); // Giờ biến này đã tồn tại
        Swal.fire(
          'Đã Reset!',
          'Thông tin gói đăng ký của học viên đã được xóa.',
          'success'
        );

        editStudent(studentId);

      } catch (error) {
        console.error("Lỗi khi reset gói:", error);
        Swal.fire("Lỗi!", "Đã xảy ra lỗi khi cố gắng reset gói đăng ký.", "error");
      } finally {
        showLoading(false);
      }
    }
  });
}
// ======================================================
// === CÁC HÀM MỚI CHO CHỨC NĂNG QUẢN LÝ HỌC PHÍ ===
// ======================================================

/**
 * Hàm chính để render toàn bộ view quản lý học phí
 * @param {string} query - Từ khóa tìm kiếm từ ô input
 */
async function renderTuitionView(query = '', type = 'fee') {
    const containerId = type === 'book' ? "book-class-list" : "tuition-class-list";
    const classListContainer = document.getElementById(containerId);
    if (!classListContainer) return;

    // Lấy dữ liệu và sắp xếp (giữ nguyên)
    const classArray = Object.entries(allClassesData);
    const filteredClasses = query ? classArray.filter(([id, cls]) => (cls.name || "").toLowerCase().includes(query.toLowerCase())) : classArray;
    const subjectOrder = { 'subject-ielts': 1, 'subject-chinese': 2, 'subject-english': 3, 'subject-default': 4 };
    filteredClasses.sort(([, a], [, b]) => {
        const subjectA = getSubjectClass(a.name);
        const subjectB = getSubjectClass(b.name);
        if (subjectOrder[subjectA] !== subjectOrder[subjectB]) {
            return subjectOrder[subjectA] - subjectOrder[subjectB];
        }
        return (a.name || "").localeCompare(b.name || "");
    });

    classListContainer.innerHTML = "";
    if (filteredClasses.length === 0) {
        classListContainer.innerHTML = "<p>Không tìm thấy lớp học nào.</p>";
        return;
    }
    
    // === PHẦN LOGIC MỚI BẮT ĐẦU TỪ ĐÂY ===
    // Nhóm các lớp lại theo môn học
    const groupedClasses = {};
    filteredClasses.forEach(([classId, cls]) => {
        const subject = getSubjectClass(cls.name);
        if (!groupedClasses[subject]) {
            groupedClasses[subject] = [];
        }
        groupedClasses[subject].push({ classId, cls });
    });

    // Render ra các nhóm có thể thu gọn
    for (const subject in groupedClasses) {
        const subjectName = subject.split('-')[1].toUpperCase();
        const classesInGroup = groupedClasses[subject];

        // 1. Tạo khối bao bọc cho cả nhóm
        const subjectGroupDiv = document.createElement('div');
        subjectGroupDiv.className = 'subject-group';

        // 2. Tạo tiêu đề có thể bấm vào
        const header = document.createElement('h3');
        header.className = 'subject-header collapsible-header';
        header.setAttribute('onclick', 'toggleCollapsible(this)');
        header.innerHTML = `
            <span>${subjectName}</span>
            <i data-lucide="chevron-down"></i>
        `;

        // 3. Tạo khối nội dung để chứa danh sách lớp
        const contentDiv = document.createElement('div');
        contentDiv.className = 'collapsible-content';

        // 4. Render từng lớp vào khối nội dung
        classesInGroup.forEach(({ classId, cls }) => {
            const onClickFunction = type === 'book' 
                ? `showClassBookFeeModal('${classId}')` 
                : `showTuitionManagementForClass('${classId}')`;

            const classDiv = document.createElement("div");
            classDiv.className = "tuition-class-item";
            classDiv.innerHTML = `
                <div class="class-header" onclick="${onClickFunction}">
                  <span>${cls.name}</span>
                </div>
            `;
            contentDiv.appendChild(classDiv);
        });

        // 5. Gắn tiêu đề và nội dung vào khối bao bọc nhóm
        subjectGroupDiv.appendChild(header);
        subjectGroupDiv.appendChild(contentDiv);

        // 6. Gắn cả nhóm vào container chính
        classListContainer.appendChild(subjectGroupDiv);
    }
    // ===================================
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

/**
 * Hiển thị Modal quản lý học phí với dữ liệu của học viên được chọn
 * @param {string} studentId - ID của học viên
 */
async function showTuitionModal(studentId, classId) {
    showLoading(true);
    try {
        const studentSnap = await database.ref(`students/${studentId}`).once('value');
        const student = studentSnap.val();
        if (!student) {
            Swal.fire("Lỗi", "Không tìm thấy dữ liệu học viên!", "error");
            return;
        }

        document.getElementById("tuition-student-id").value = studentId;
        document.getElementById("tuition-modal-class-id").value = classId;
        document.getElementById("tuition-student-name").textContent = student.name;
        
        const totalDue = student.totalDue || 0;
        let totalPaid = 0;
        if (student.paymentHistory) {
            totalPaid = Object.values(student.paymentHistory).reduce((sum, payment) => sum + (payment.amountPaid || 0), 0);
        }
        const remainingBalance = totalDue - totalPaid;
        document.getElementById("tuition-total-due").textContent = `${totalDue.toLocaleString('vi-VN')} VNĐ`;
        document.getElementById("tuition-total-paid").textContent = `${totalPaid.toLocaleString('vi-VN')} VNĐ`;
        document.getElementById("tuition-remaining-balance").textContent = `${remainingBalance.toLocaleString('vi-VN')} VNĐ`;
        
        const historyList = document.getElementById("tuition-history-list");
        historyList.innerHTML = "";
        if (student.paymentHistory) {
            const sortedHistory = Object.entries(student.paymentHistory).sort(([,a], [,b]) => new Date(b.paymentDate) - new Date(a.paymentDate));
            sortedHistory.forEach(([paymentId, payment]) => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${payment.paymentDate || ''}</td>
                    <td>${(payment.amountPaid || 0).toLocaleString('vi-VN')}</td>
                    <td>${payment.method || ''}</td>
                    <td>${payment.note || ''}</td>
                    <td>${payment.recordedBy || 'N/A'}</td>
                    <td><button class="delete-btn" onclick="deletePayment('${studentId}', '${paymentId}')">Xóa</button></td>
                `;
                historyList.appendChild(row);
            });
        }
        
        document.getElementById("tuition-modal").style.display = "flex";
    } catch (error) {
        console.error("Lỗi khi hiển thị modal học phí:", error);
        Swal.fire("Lỗi", "Không thể hiển thị thông tin học phí: " + error.message, "error");
    } finally {
        showLoading(false);
    }
}
async function promptSetBookFeeDue() {
    const studentId = document.getElementById("tuition-student-id").value;
    // Lấy classId từ trường ẩn mà chúng ta đã lưu
    const classId = document.getElementById("tuition-modal-class-id").value;
    const studentRef = database.ref(`students/${studentId}`);

    const oldData = (await studentRef.once('value')).val();
    const oldBookFeeDue = oldData.totalBookFeeDue || 0;

    const { value: newTotalBookFeeDue } = await Swal.fire({
        title: 'Cập nhật Tổng nợ Tiền sách',
        input: 'number',
        inputLabel: 'Nhập tổng số tiền sách mà học viên cần phải đóng',
        inputValue: oldBookFeeDue,
        showCancelButton: true,
        confirmButtonText: 'Lưu',
        cancelButtonText: 'Hủy',
        inputValidator: (value) => {
            if (value === '' || value < 0) {
                return 'Giá trị phải là một số không âm!'
            }
        }
    });

    if (newTotalBookFeeDue !== undefined) {
        showLoading(true);
        try {
            await studentRef.update({ totalBookFeeDue: parseInt(newTotalBookFeeDue) });
            
            // Tải lại modal chi tiết của học viên để cập nhật số liệu
            await showTuitionModal(studentId, classId);
            Swal.fire('Thành công!', 'Đã cập nhật tổng nợ tiền sách.', 'success');
            
            // Nếu có classId, tức là người dùng đi từ bảng tổng quan, hãy tải lại nó
            if(classId) {
                await showTuitionManagementForClass(classId);
            }
        } catch(error) {
             Swal.fire('Lỗi!', 'Không thể cập nhật.', 'error');
        } finally {
            showLoading(false);
        }
    }
}

async function showTuitionManagementForClass(classId) {
    showLoading(true);
    const studentListBody = document.getElementById("class-tuition-student-list");
    studentListBody.innerHTML = ''; 

    try {
        const classSnap = await database.ref(`classes/${classId}`).once('value');
        const classData = classSnap.val();
        if (!classData) throw new Error("Không tìm thấy dữ liệu lớp học.");
        
        document.getElementById("class-tuition-name").textContent = classData.name || "Không tên";
        document.getElementById("class-tuition-modal").dataset.classId = classId;

        const studentIds = Object.keys(classData.students || {});
        if (studentIds.length === 0) {
            studentListBody.innerHTML = '<tr><td colspan="7">Lớp này chưa có học viên.</td></tr>';
            document.getElementById("class-tuition-modal").style.display = "flex";
            showLoading(false);
            return;
        }

        const studentPromises = studentIds.map(id => database.ref(`students/${id}`).once('value'));
        const studentSnapshots = await Promise.all(studentPromises);
        let tableRowsHtml = "";

        studentSnapshots.forEach(snap => {
            if (!snap.exists()) return;
            const studentId = snap.key;
            const student = snap.val();
            
            const totalTuitionDue = student.totalDue || 0;
            const totalTuitionPaid = Object.values(student.paymentHistory || {}).reduce((sum, p) => sum + p.amountPaid, 0);
            const remainingTuition = totalTuitionDue - totalTuitionPaid;
            let tuitionStatusHtml = getStatusHtml(totalTuitionDue, remainingTuition, totalTuitionPaid);
            
            // === LOGIC CẢNH BÁO SỐ BUỔI ===
            const sessionsAttended = student.sessionsAttended || 0;
            const totalSessionsPaid = student.totalSessionsPaid || 0;
            const remainingSessions = totalSessionsPaid - sessionsAttended;
            let warningClass = '';
            let iconHtml = '';
            if (remainingSessions <= 0) {
                warningClass = 'student-warning-critical';
            } else if (remainingSessions <= 3) {
                warningClass = 'student-warning-low';
                iconHtml = '<span class="warning-icon">&#9888;</span> ';
            }
            // ================================
            
            const canEdit = currentUserData && (currentUserData.role === 'Admin' || currentUserData.role === 'Hội Đồng');
            const studentNameHtml = canEdit 
                ? `<a href="#" onclick="event.preventDefault(); showStudentActionOptions('${studentId}')" class="clickable-student-name ${warningClass}">${iconHtml}${student.name}</a>`
                : `<span class="${warningClass}">${iconHtml}${student.name}</span>`;

            tableRowsHtml += `
                <tr>
                    <td>${studentNameHtml}</td>
                    <td style="font-weight: bold;">Học phí</td>
                    <td>${totalTuitionDue.toLocaleString('vi-VN')}</td>
                    <td>${totalTuitionPaid.toLocaleString('vi-VN')}</td>
                    <td>${remainingTuition.toLocaleString('vi-VN')}</td>
                    <td>${tuitionStatusHtml}</td>
                    <td><button onclick="showTuitionModal('${studentId}', '${classId}')">Lịch sử HP</button></td>
                </tr>`;
        });
        studentListBody.innerHTML = tableRowsHtml;
    } catch (error) {
        console.error("Lỗi khi hiển thị tổng quan học phí lớp:", error);
        studentListBody.innerHTML = `<tr><td colspan="7">Có lỗi xảy ra: ${error.message}</td></tr>`;
    } finally {
        showLoading(false);
        document.getElementById("class-tuition-modal").style.display = "flex";
    }
}

// THÊM HÀM HELPER MỚI NÀY VÀO script.js
// Hàm này giúp tạo HTML cho cột trạng thái để tránh lặp code
function getStatusHtml(totalDue, remaining, totalPaid) {
    let statusClass, statusText;
    if (totalDue > 0) {
        if (remaining <= 0) {
            statusClass = 'status-paid';
            statusText = 'Hoàn thành';
        } else if (totalPaid > 0) {
            statusClass = 'status-partial';
            statusText = 'Đã đóng một phần';
        } else {
            statusClass = 'status-unpaid';
            statusText = 'Chưa đóng';
        }
    } else {
        statusClass = 'status-default';
        statusText = 'Miễn phí / Không có';
    }
    return `<span class="tuition-status ${statusClass}">${statusText}</span>`;
}
/**
 * HÀM MỚI: Lưu một khoản thanh toán mới cho học viên
 */
async function savePayment() {
    const studentId = document.getElementById("tuition-student-id").value;
    const amountPaid = parseInt(document.getElementById("tuition-amount-input").value);
    const method = document.getElementById("tuition-method-select").value;
    const note = document.getElementById("tuition-note-input").value.trim();
    
    // Lấy giá trị từ ô input mới
    const holder = document.getElementById("tuition-holder-input").value.trim();

    if (!studentId || isNaN(amountPaid) || amountPaid <= 0 || !holder) {
        Swal.fire("Lỗi", "Vui lòng nhập đầy đủ số tiền và tên người cầm tiền.", "error");
        return;
    }

    const paymentData = {
        amountPaid: amountPaid,
        method: method,
        note: note,
        paymentDate: new Date().toISOString().split("T")[0],
        // Thay thế 'recordedBy' bằng giá trị từ input 'holder'
        recordedBy: holder 
    };

    showLoading(true);
    try {
        const paymentRef = database.ref(`students/${studentId}/paymentHistory`);
        await paymentRef.push(paymentData);
        Swal.fire({ icon: 'success', title: 'Thành công!', text: 'Đã ghi nhận thanh toán mới.', timer: 1500, showConfirmButton: false });
        document.getElementById("tuition-payment-form").reset();
        await showTuitionModal(studentId);
    } catch (error) {
        console.error("Lỗi khi lưu thanh toán:", error);
        Swal.fire("Lỗi", "Không thể lưu thanh toán: " + error.message, "error");
    } finally {
        showLoading(false);
    }
}
/**
 * HÀM MỚI: Xóa một khoản thanh toán đã ghi nhận
 * @param {string} studentId - ID của học viên
 * @param {string} paymentId - ID của lần thanh toán cần xóa (do Firebase tự tạo)
 */
async function deletePayment(studentId, paymentId) {
    // 1. Hỏi xác nhận trước khi xóa để đảm bảo an toàn
    const result = await Swal.fire({
        title: 'Bạn chắc chắn muốn xóa?',
        text: "Hành động này sẽ xóa vĩnh viễn khoản thanh toán này và không thể hoàn tác!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Vâng, xóa nó!',
        cancelButtonText: 'Hủy'
    });

    // 2. Nếu người dùng không đồng ý, thoát khỏi hàm
    if (!result.isConfirmed) {
        return;
    }

    // 3. Tiến hành xóa trên Firebase
    showLoading(true);
    try {
        const paymentRef = database.ref(`students/${studentId}/paymentHistory/${paymentId}`);
        await paymentRef.remove();

        Swal.fire({
            icon: 'success',
            title: 'Đã xóa!',
            text: 'Khoản thanh toán đã được xóa.',
            timer: 1500,
            showConfirmButton: false
        });

        // 4. Tải lại modal để cập nhật lại bảng lịch sử và các số liệu
        await showTuitionModal(studentId);

    } catch (error) {
        console.error("Lỗi khi xóa thanh toán:", error);
        Swal.fire("Lỗi", "Không thể xóa thanh toán: " + error.message, "error");
    } finally {
        showLoading(false);
    }
}
/**
 * Hàm ẩn Modal quản lý học phí
 */
function hideTuitionModal() {
    document.getElementById("tuition-modal").style.display = "none";
}
async function generateExamsForGeneralClasses() {
    const isConfirmed = confirm("Hệ thống sẽ quét TẤT CẢ Lớp Phổ Thông và tạo bù các bài KT định kỳ (T3,6,9,12) và KT 45 phút (sau 16 buổi) còn thiếu. Tiếp tục?");
    if (!isConfirmed) return;
    showLoading(true);
    try {
        const classesSnap = await database.ref("classes").once("value");
        const allClasses = classesSnap.val() || {};
        const updates = {};
        let examsCreatedCount = 0;

        for (const classId in allClasses) {
            const cls = allClasses[classId];
            if (cls.classType !== 'Lớp tiếng Anh phổ thông' || !cls.sessions) continue;

            const sortedSessions = Object.keys(cls.sessions).sort();
            const periodicExamMonths = [3, 6, 9, 12];
            const processedPeriodicMonths = new Set();
            let examsForThisClass = { ...(cls.exams || {}) };

            // Logic 1: Tạo bài KT định kỳ
            sortedSessions.forEach(sessionDateStr => {
                const sessionDate = new Date(sessionDateStr + "T00:00:00");
                const sessionMonth = sessionDate.getMonth() + 1;
                const sessionYear = sessionDate.getFullYear();
                const monthKey = `${sessionYear}-${sessionMonth}`;

                if (periodicExamMonths.includes(sessionMonth) && !processedPeriodicMonths.has(monthKey)) {
                    const examType = `periodic-${monthKey}`;
                    const hasExam = Object.values(examsForThisClass).some(e => e.type === examType);
                    if (!hasExam) {
                        let examDate = new Date(sessionDate);
                        let examDateStr;
                        do {
                            examDate.setDate(examDate.getDate() + 1);
                            examDateStr = examDate.toISOString().split('T')[0];
                        } while (cls.sessions[examDateStr] || examsForThisClass[examDateStr]);
                        
                        const newExam = { name: `Kiểm tra định kỳ T${sessionMonth}`, type: examType };
                        updates[`/classes/${classId}/exams/${examDateStr}`] = newExam;
                        examsForThisClass[examDateStr] = newExam;
                        examsCreatedCount++;
                    }
                    processedPeriodicMonths.add(monthKey);
                }
            });

            // Logic 2: Tạo bài KT 45 phút
            for (let i = 16; i <= sortedSessions.length; i += 16) {
                const examType = `mid-course-${i}`;
                const hasExam = Object.values(examsForThisClass).some(e => e.type === examType);
                if (!hasExam) {
                    const milestoneSessionDate = new Date(sortedSessions[i - 1] + "T00:00:00");
                    let examDate = new Date(milestoneSessionDate);
                    let examDateStr;
                    do {
                        examDate.setDate(examDate.getDate() + 1);
                        examDateStr = examDate.toISOString().split('T')[0];
                    } while (cls.sessions[examDateStr] || examsForThisClass[examDateStr]);

                    const newExam = { name: `Kiểm tra 45 phút (Buổi ${i})`, type: examType };
                    updates[`/classes/${classId}/exams/${examDateStr}`] = newExam;
                    examsForThisClass[examDateStr] = newExam;
                    examsCreatedCount++;
                }
            }
        }
        if (examsCreatedCount > 0) {
            await database.ref().update(updates);
            Swal.fire("Hoàn tất!", `Đã tạo bù thành công ${examsCreatedCount} bài kiểm tra cho các lớp phổ thông.`, "success");
        } else {
            Swal.fire("Đã đầy đủ", "Không có bài kiểm tra nào cần tạo bù cho lớp phổ thông.", "info");
        }
    } catch (e) { Swal.fire("Lỗi", e.message, "error"); } finally { showLoading(false); }
}

// Hàm 2: Tạo bù bài thi cuối khóa cho Lớp Chứng Chỉ
async function generateExamsForCertificateClasses() {
    const isConfirmed = confirm("Hệ thống sẽ quét TẤT CẢ Lớp Chứng Chỉ và tạo bù bài kiểm tra cuối khóa cho các lớp đã đủ số buổi. Tiếp tục?");
    if (!isConfirmed) return;
    showLoading(true);
    try {
        const classesSnap = await database.ref("classes").once("value");
        const allClasses = classesSnap.val() || {};
        const updates = {};
        let examsCreatedCount = 0;

        for (const classId in allClasses) {
            const cls = allClasses[classId];
            if (cls.classType !== 'Lớp chứng chỉ' || !cls.sessions || !cls.certificateType || !cls.courseName) continue;
            
            const hasFinalExam = cls.exams && Object.values(cls.exams).some(e => e.type === 'final');
            if(hasFinalExam) continue;

            const courseData = certificateCourses[cls.certificateType]?.find(c => c.name === cls.courseName);
            const totalSessionsForCourse = courseData?.sessions;
            const sortedSessions = Object.keys(cls.sessions).sort();

            if (totalSessionsForCourse && sortedSessions.length >= totalSessionsForCourse) {
                const lastSessionDate = new Date(sortedSessions[totalSessionsForCourse - 1] + "T00:00:00");
                let examDate = new Date(lastSessionDate);
                let examDateStr;
                do {
                    examDate.setDate(examDate.getDate() + 1);
                    examDateStr = examDate.toISOString().split('T')[0];
                } while (cls.sessions[examDateStr] || (cls.exams && cls.exams[examDateStr]));

                updates[`/classes/${classId}/exams/${examDateStr}`] = { name: 'Kiểm tra cuối khoá', type: 'final' };
                examsCreatedCount++;
            }
        }
        if (examsCreatedCount > 0) {
            await database.ref().update(updates);
            Swal.fire("Hoàn tất!", `Đã tạo bù thành công ${examsCreatedCount} bài kiểm tra cuối khóa.`, "success");
        } else {
            Swal.fire("Đã đầy đủ", "Không có bài kiểm tra cuối khóa nào cần tạo bù.", "info");
        }
    } catch (e) { Swal.fire("Lỗi", e.message, "error"); } finally { showLoading(false); }
}
async function promptAddExam(classId) {
    const {
        value: formValues
    } = await Swal.fire({
        title: 'Thêm bài kiểm tra mới',
        html: '<input id="swal-input-date" class="swal2-input" type="date">' +
            '<input id="swal-input-name" class="swal2-input" placeholder="Tên bài kiểm tra (ví dụ: Giữa kỳ)">',
        focusConfirm: false,
        preConfirm: () => {
            const date = document.getElementById('swal-input-date').value;
            const name = document.getElementById('swal-input-name').value;
            if (!date || !name) {
                Swal.showValidationMessage('Vui lòng nhập đầy đủ ngày và tên bài kiểm tra');
                return null;
            }
            return {
                date,
                name
            };
        }
    });

    if (formValues) {
        const {
            date,
            name
        } = formValues;
        try {
            const sessionRef = database.ref(`classes/${classId}/sessions/${date}`);
            const examRef = database.ref(`classes/${classId}/exams/${date}`);
            const sessionSnap = await sessionRef.once('value');
            const examSnap = await examRef.once('value');

            if (sessionSnap.exists() || examSnap.exists()) {
                Swal.fire('Lỗi', `Đã có một buổi học hoặc bài thi vào ngày ${date}. Vui lòng chọn ngày khác.`, 'error');
                return;
            }

            await examRef.set({
                name: name,
                type: 'manual' // Đánh dấu đây là bài thi được thêm thủ công
            });

            await Swal.fire('Thành công', 'Đã thêm bài kiểm tra thành công!', 'success');
            renderClassAttendanceTable(classId); // Tải lại bảng điểm danh
        } catch (error) {
            console.error("Lỗi khi thêm bài kiểm tra:", error);
            Swal.fire('Lỗi', 'Không thể thêm bài kiểm tra.', 'error');
        }
    }
}
function initUsersListener() {
    database.ref(DB_PATHS.USERS).on("value", (snapshot) => {
        allUsersData = snapshot.val() || {};
        const currentPage = window.location.hash.slice(1);

        // Khi dữ liệu người dùng thay đổi, render lại trang tương ứng nếu đang mở
        if (currentPage === "account-management") {
            renderAccountList();
        }
        if (currentPage === "personnel-management") {
            // Chỉ render phần danh sách nhân sự, không phải toàn bộ trang
            renderPersonnelListForAttendance(); 
            renderStaffSalaryTable();
        }
    });
}
let progressTimeChart = null;
let progressBreakdownChart = null;

async function showStudentProgressModal(studentId) {
    showLoading(true);
    try {
        // Lấy dữ liệu cần thiết của học viên
        const studentSnap = await database.ref(`students/${studentId}`).once('value');
        const student = studentSnap.val();
        if (!student) throw new Error("Không tìm thấy học viên.");

        // Giả sử học viên chỉ thuộc 1 lớp đầu tiên để đơn giản hóa
        const classId = student.classes ? Object.keys(student.classes)[0] : null;
        if (!classId) throw new Error("Học viên này chưa được xếp vào lớp nào.");

        const classSnap = await database.ref(`classes/${classId}`).once('value');
        const cls = classSnap.val();
        if (!cls) throw new Error("Không tìm thấy dữ liệu lớp học.");

        // Lấy dữ liệu điểm danh và điểm số
        const attendanceSnap = await database.ref(`attendance/${classId}/${studentId}`).once('value');
        const attendanceData = attendanceSnap.val() || {};
        const scoresSnap = await database.ref(`homeworkScores/${classId}/${studentId}`).once('value');
        const scoresData = scoresSnap.val() || {};
        
        // 1. Xử lý và tổng hợp dữ liệu
        const allSessions = { ...(cls.sessions || {}), ...(cls.exams || {}) };
        const sortedDates = Object.keys(allSessions).sort();

        const evaluationMap = { "Không tích cực": 4, "Tích cực": 8, "Rất tích cực": 10 };
        const processedData = [];

        sortedDates.forEach(date => {
            const isExam = !!(cls.exams && cls.exams[date]);
            const scoreValue = scoresData[date];
            let numericScore = null;

            if (isExam && !isNaN(parseFloat(scoreValue))) {
                numericScore = parseFloat(scoreValue);
            } else if (!isExam && evaluationMap.hasOwnProperty(scoreValue)) {
                numericScore = evaluationMap[scoreValue];
            }

            if (numericScore !== null) {
                processedData.push({ date, score: numericScore, isExam });
            }
        });

        if (processedData.length < 2) {
             throw new Error("Cần ít nhất 2 buổi có điểm hoặc đánh giá để phân tích.");
        }

        // 2. Tính toán các thành phần điểm
        // 2.1. Điểm chuyên cần (Attendance Score)
        const attendedCount = Object.values(attendanceData).filter(att => att === true).length;
        const totalScheduledSessions = sortedDates.length;
        const chuyenCanScore = totalScheduledSessions > 0 ? (attendedCount / totalScheduledSessions) * 10 : 0;

        // 2.2. Điểm kiểm tra (Test Score)
        const examScores = processedData.filter(d => d.isExam).map(d => d.score);
        const diemKTScore = examScores.length > 0 ? examScores.reduce((a, b) => a + b, 0) / examScores.length : 0;

        // 2.3. Điểm tiến bộ (Progress Score) - Dùng thuật toán hồi quy tuyến tính đơn giản
        // để tìm xu hướng của các điểm đánh giá (không phải điểm thi)
        const evaluationScores = processedData.filter(d => !d.isExam);
        let tienBoScore = 5; // Điểm trung bình nếu không đủ dữ liệu
        if (evaluationScores.length > 1) {
            let n = evaluationScores.length;
            let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
            evaluationScores.forEach((d, i) => {
                let x = i + 1;
                let y = d.score;
                sumX += x;
                sumY += y;
                sumXY += x * y;
                sumX2 += x * x;
            });
            const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
            // Quy đổi độ dốc (slope) ra thang điểm 10
            // Giả sử: slope > 0.1 là tiến bộ vượt bậc (10đ), slope < -0.1 là thụt lùi (0đ)
            if (slope > 0.1) tienBoScore = 10;
            else if (slope < -0.1) tienBoScore = 0;
            else tienBoScore = 5 + (slope * 50); // Ánh xạ slope từ [-0.1, 0.1] to [0, 10]
            tienBoScore = Math.max(0, Math.min(10, tienBoScore)); // Đảm bảo điểm trong khoảng 0-10
        }

        // 2.4. Tính điểm tổng kết
        const finalScore = (diemKTScore * 0.6) + (chuyenCanScore * 0.2) + (tienBoScore * 0.2);

        // 3. Hiển thị kết quả và modal
        document.getElementById("progress-student-name").textContent = student.name;
        
        // Hiển thị tóm tắt điểm
        const summaryDiv = document.getElementById('progress-summary');
        summaryDiv.innerHTML = `
            <div>
                <p>Điểm Tổng Kết</p>
                <strong style="font-size: 24px; color: #0066cc;">${finalScore.toFixed(2)}</strong>
            </div>
            <div>
                <p>Điểm KT (60%)</p>
                <strong style="color: #28a745;">${diemKTScore.toFixed(2)}</strong>
            </div>
            <div>
                <p>Chuyên cần (20%)</p>
                <strong style="color: #ffc107;">${chuyenCanScore.toFixed(2)}</strong>
            </div>
            <div>
                <p>Tiến bộ (20%)</p>
                <strong style="color: #17a2b8;">${tienBoScore.toFixed(2)}</strong>
            </div>
        `;
        
        // Hủy biểu đồ cũ nếu tồn tại
        if(progressTimeChart) progressTimeChart.destroy();
        if(progressBreakdownChart) progressBreakdownChart.destroy();

        // 4. Vẽ biểu đồ
        // Biểu đồ 1: Đường tiến bộ theo thời gian
        const timeCtx = document.getElementById('progress-over-time-chart').getContext('2d');
        progressTimeChart = new Chart(timeCtx, {
            type: 'line',
            data: {
                labels: processedData.map(d => new Date(d.date).toLocaleDateString('vi-VN')),
                datasets: [{
                    label: 'Điểm đánh giá / Điểm thi',
                    data: processedData.map(d => d.score),
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    fill: false,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                plugins: { title: { display: true, text: 'Quá trình học tập theo thời gian' } },
                scales: { y: { beginAtZero: true, max: 10 } }
            }
        });

        // Biểu đồ 2: Phân bổ điểm tổng kết (Radar Chart)
        const breakdownCtx = document.getElementById('progress-breakdown-chart').getContext('2d');
        progressBreakdownChart = new Chart(breakdownCtx, {
            type: 'radar',
            data: {
                labels: ['Điểm KT (60%)', 'Chuyên cần (20%)', 'Tiến bộ (20%)'],
                datasets: [{
                    label: 'Thành phần điểm',
                    data: [diemKTScore, chuyenCanScore, tienBoScore],
                    backgroundColor: 'rgba(0, 102, 204, 0.2)',
                    borderColor: 'rgba(0, 102, 204, 1)',
                    pointBackgroundColor: 'rgba(0, 102, 204, 1)',
                }]
            },
            options: {
                responsive: true,
                plugins: { title: { display: true, text: 'Phân tích các thành phần điểm' } },
                scales: { r: { beginAtZero: true, max: 10, stepSize: 2 } }
            }
        });

        document.getElementById('progress-modal').style.display = 'flex';

    } catch (error) {
        console.error("Lỗi khi phân tích tiến bộ:", error);
        Swal.fire("Lỗi", "Không thể phân tích tiến bộ: " + error.message, "error");
    } finally {
        showLoading(false);
    }
}
// --- hàm quản lí Modal thay đổi lịch ---
function showChangeScheduleModal() {
    const classId = document.getElementById("class-index").value;
    if (!classId) {
        Swal.fire("Lỗi", "Không thể thay đổi lịch cho lớp mới. Vui lòng lưu lớp trước.", "error");
        return;
    }
    document.getElementById("change-schedule-class-id").value = classId;
    document.getElementById("change-schedule-date").value = new Date().toISOString().split("T")[0];
    document.querySelectorAll('#new-fixed-schedule-container input[type="checkbox"]').forEach(cb => cb.checked = false);

    // GỌI HÀM ĐIỀN GIỜ/PHÚT Ở ĐÂY
    populateTimeDropdowns();

    document.getElementById("change-schedule-modal").style.display = "flex";
}
function hideChangeScheduleModal() {
  document.getElementById("change-schedule-modal").style.display = "none";
}
async function confirmScheduleChange() {
    const classId = document.getElementById("change-schedule-class-id").value;
    const changeDateStr = document.getElementById("change-schedule-date").value;
    if (!changeDateStr) { return; }

    // Tạo schedule mới với key là SỐ
    const newFixedSchedule = {};
    const dayKeyToIndex = { "sun": 0, "mon": 1, "tue": 2, "wed": 3, "thu": 4, "fri": 5, "sat": 6 };
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    days.forEach(dayKey => {
        const checkbox = document.getElementById(`new-schedule-${dayKey}`);
        if (checkbox && checkbox.checked) {
            const dayIndex = dayKeyToIndex[dayKey];
            const hour = document.getElementById(`new-hour-${dayKey}`).value;
            const minute = document.getElementById(`new-minute-${dayKey}`).value;
            newFixedSchedule[dayIndex] = `${hour}:${minute}`;
        }
    });

    if (Object.keys(newFixedSchedule).length === 0) { return; }

    const result = await Swal.fire({ /* ... hỏi xác nhận ... */ });

    if (result.isConfirmed) {
        showLoading(true);
        try {
            const classRef = database.ref(`classes/${classId}`);
            const classSnap = await classRef.once('value');
            const classData = classSnap.val();
            if (!classData) throw new Error("Không tìm thấy lớp học.");

            // ... giữ nguyên logic xóa và đếm buổi học cũ ...
            const allSessions = classData.sessions || {};
            const attendanceSnap = await database.ref(`attendance/${classId}`).once('value');
            const allAttendance = attendanceSnap.val() || {};
            const updates = {};
            let pastSessionsCount = 0;
            for (const dateKey in allSessions) {
                if (dateKey < changeDateStr) {
                    pastSessionsCount++;
                    continue;
                }
                let isAttended = false;
                for (const studentId in allAttendance) {
                    if (allAttendance[studentId]?.[dateKey]) {
                        isAttended = true;
                        break;
                    }
                }
                if (!isAttended) {
                    updates[`/classes/${classId}/sessions/${dateKey}`] = null;
                } else {
                    pastSessionsCount++;
                }
            }
            
            let sessionsToGenerate = (classData.classType === 'Lớp chứng chỉ')
                ? ((certificateCourses[classData.certificateType]?.find(c => c.name === classData.courseName)?.sessions || 0) - pastSessionsCount)
                : 31;
            sessionsToGenerate = Math.max(0, sessionsToGenerate);
            
            if (sessionsToGenerate > 0) {
                // Hàm generateRollingSessions giờ sẽ nhận schedule mới với key là SỐ
                const newSessions = generateRollingSessions(changeDateStr, sessionsToGenerate, newFixedSchedule);
                for(const dateKey in newSessions) {
                     updates[`/classes/${classId}/sessions/${dateKey}`] = newSessions[dateKey];
                }
            }

            updates[`/classes/${classId}/fixedSchedule`] = newFixedSchedule;
            
            await database.ref().update(updates);
            
            hideChangeScheduleModal();
            Swal.fire('Thành công!', 'Lịch học đã được cập nhật.', 'success');
        } catch (error) {
            console.error("Lỗi khi thay đổi lịch học:", error);
            Swal.fire("Lỗi", "Lỗi cập nhật lịch học: " + error.message, "error");
        } finally {
            showLoading(false);
        }
    }
}
async function migrateAttendanceData() {
    const confirm = await Swal.fire({
        title: 'Chuyển đổi Dữ liệu Điểm danh?',
        text: "Hệ thống sẽ quét và chuẩn hóa toàn bộ dữ liệu điểm danh cũ. Chỉ nên chạy hành động này MỘT LẦN. Tiếp tục?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Vâng, chuyển đổi!',
        cancelButtonText: 'Hủy'
    });

    if (!confirm.isConfirmed) return;

    showLoading(true);
    try {
        const attendanceRef = database.ref('attendance');
        const snapshot = await attendanceRef.once('value');
        const allAttendance = snapshot.val() || {};

        const updates = {};
        let migratedCount = 0;

        for (const classId in allAttendance) {
            for (const studentId in allAttendance[classId]) {
                for (const dateKey in allAttendance[classId][studentId]) {
                    const data = allAttendance[classId][studentId][dateKey];
                    // Nếu dữ liệu không phải là object, tiến hành chuyển đổi
                    if (typeof data !== 'object' || data === null) {
                        const path = `attendance/${classId}/${studentId}/${dateKey}`;
                        updates[path] = {
                            attended: data === true // Giả định nếu là boolean thì là dữ liệu điểm danh
                        };
                        migratedCount++;
                    }
                }
            }
        }

        if (migratedCount > 0) {
            await database.ref().update(updates);
            Swal.fire('Hoàn tất!', `Đã chuyển đổi thành công ${migratedCount} mục dữ liệu điểm danh cũ.`, 'success');
        } else {
            Swal.fire('Đã hoàn tất', 'Không có dữ liệu cũ nào cần chuyển đổi.', 'info');
        }
    } catch (error) {
        Swal.fire('Lỗi', `Đã xảy ra lỗi khi chuyển đổi: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}
/** 
 * Hàm Lưu Tiền Sách
 */
async function saveBookFeePayment() {
    const studentId = document.getElementById("tuition-student-id").value;
    
    // === THAY ĐỔI DÒNG NÀY ===
    const bookTitle = document.getElementById("book-fee-title-final").value.trim();
    // ========================

    const amountPaid = parseInt(document.getElementById("book-fee-amount-input").value);
    const method = document.getElementById("book-fee-method-select").value;
    const note = document.getElementById("book-fee-note-input").value.trim();
    const holder = document.getElementById("book-fee-holder-input").value.trim();

    if (!bookTitle || isNaN(amountPaid) || amountPaid <= 0 || !holder) {
        Swal.fire("Lỗi", "Vui lòng chọn đầy đủ tên sách, nhập số tiền và tên người cầm tiền.", "error");
        return;
    }

    const paymentData = {
        bookTitle,
        amountPaid,
        method,
        note,
        paymentDate: new Date().toISOString().split("T")[0],
        recordedBy: holder 
    };

    showLoading(true);
    try {
        const bookFeeRef = database.ref(`students/${studentId}/bookFeeHistory`);
        await bookFeeRef.push(paymentData);
        Swal.fire({ icon: 'success', title: 'Thành công!', text: 'Đã ghi nhận thanh toán tiền sách.', timer: 1500, showConfirmButton: false });
        
        // Reset lại các lựa chọn sách sau khi lưu
        document.getElementById("book-selection-container").innerHTML = '';
        document.getElementById("book-fee-title-final").value = '';
        
        await showTuitionModal(studentId);
    } catch (error) {
        console.error("Lỗi khi lưu tiền sách:", error);
        Swal.fire("Lỗi", "Không thể lưu thanh toán: " + error.message, "error");
    } finally {
        showLoading(false);
    }
}
/**
 * HÀM MỚI: Xóa một khoản thanh toán tiền sách đã ghi nhận.
 */
async function deleteBookFeePayment(studentId, paymentId) {
    const result = await Swal.fire({
        title: 'Bạn chắc chắn muốn xóa?',
        text: "Hành động này sẽ xóa vĩnh viễn khoản thanh toán tiền sách này!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Vâng, xóa nó!',
        cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
        showLoading(true);
        try {
            const paymentRef = database.ref(`students/${studentId}/bookFeeHistory/${paymentId}`);
            await paymentRef.remove();
            Swal.fire({ icon: 'success', title: 'Đã xóa!', text: 'Khoản thanh toán tiền sách đã được xóa.', timer: 1500, showConfirmButton: false });
            // Tải lại toàn bộ modal để cập nhật
            await showTuitionModal(studentId);
        } catch (error) {
            console.error("Lỗi khi xóa tiền sách:", error);
            Swal.fire("Lỗi", "Không thể xóa thanh toán: " + error.message, "error");
        } finally {
            showLoading(false);
        }
    }
}
// ======================================================
// === CÁC HÀM MỚI CHO CHỨC NĂNG CHỌN SÁCH THÔNG MINH ===
// ======================================================

/**
 * Khởi tạo hệ thống chọn sách dựa trên lớp học của học viên
 * @param {string} studentId - ID của học viên đang được xem
 */
async function initializeBookSelection(studentId) {
    try {
        const studentSnap = await database.ref(`students/${studentId}`).once('value');
        const student = studentSnap.val();
        if (!student || !student.classes) {
            populateMainBookDropdown(null); // Hiển thị cả 2 loại nếu không xác định được lớp
            return;
        }

        const classId = Object.keys(student.classes)[0]; // Lấy lớp đầu tiên của học viên
        const classSnap = await database.ref(`classes/${classId}`).once('value');
        const classData = classSnap.val();

        // Logic "thông minh": xác định ngôn ngữ
        let language = null;
        if (classData && classData.name) {
            const classNameLower = classData.name.toLowerCase();
            if (classNameLower.includes('trung') || classNameLower.includes('hsk') || classNameLower.includes('yct')) {
                language = 'chinese';
            } else if (classNameLower.includes('anh') || classNameLower.includes('ielts') || classNameLower.includes('oxford')) {
                language = 'english';
            }
        }
        
        populateMainBookDropdown(language);

    } catch (error) {
        console.error("Lỗi khi khởi tạo lựa chọn sách:", error);
        populateMainBookDropdown(null); // Fallback: hiển thị tất cả
    }
}


/**
 * Tạo dropdown chính để chọn đầu sách
 * @param {('english'|'chinese'|null)} language - Ngôn ngữ cần hiển thị, hoặc null để hiển thị tất cả
 */
function populateMainBookDropdown(language) {
    const container = document.getElementById('book-selection-container');
    container.innerHTML = ''; // Xóa sạch các lựa chọn cũ

    const mainSelect = document.createElement('select');
    mainSelect.id = 'book-main-select';
    mainSelect.style.padding = '8px';
    mainSelect.innerHTML = '<option value="">-- Chọn đầu sách --</option>';

    const booksToShow = [];
    if (language === 'english' || language === null) {
        booksToShow.push(...BOOK_DATA.english);
    }
    if (language === 'chinese' || language === null) {
         booksToShow.push(...BOOK_DATA.chinese);
    }

    booksToShow.forEach(book => {
        const option = document.createElement('option');
        option.value = book.name;
        option.textContent = book.name;
        mainSelect.appendChild(option);
    });

    mainSelect.onchange = handleMainBookChange;
    container.appendChild(mainSelect);
    updateFinalBookTitle(); // Reset tiêu đề cuối cùng
}

/**
 * Xử lý khi người dùng thay đổi lựa chọn ở dropdown chính
 */
function handleMainBookChange() {
    const selectedBookName = document.getElementById('book-main-select').value;
    
    // Tìm đối tượng sách tương ứng trong BOOK_DATA
    const allBooks = [...BOOK_DATA.english, ...BOOK_DATA.chinese];
    const selectedBook = allBooks.find(book => book.name === selectedBookName);

    // Xóa các dropdown phụ cũ (cấp độ, loại sách)
    document.getElementById('book-level-select')?.remove();
    document.getElementById('book-type-select')?.remove();

    if (selectedBook) {
        if (selectedBook.levelType === 'numeric' || selectedBook.levelType === 'level') {
            createLevelSelector(selectedBook);
        } else if (selectedBook.hasTypeSelector) {
            // Trường hợp sách không có cấp độ nhưng có loại (hiện tại không có, nhưng để dự phòng)
            createTypeSelector(selectedBook);
        }
    }
    updateFinalBookTitle();
}

/**
 * Tạo dropdown chọn cấp độ (số hoặc chữ)
 * @param {object} book - Đối tượng sách đã chọn
 */
function createLevelSelector(book) {
    const container = document.getElementById('book-selection-container');
    const levelSelect = document.createElement('select');
    levelSelect.id = 'book-level-select';
    levelSelect.style.padding = '8px';
    levelSelect.innerHTML = `<option value="">-- Chọn ${book.levelType === 'numeric' ? 'quyển số' : 'cấp độ'} --</option>`;

    if (book.levelType === 'numeric') {
        for (let i = 1; i <= 9; i++) {
            levelSelect.innerHTML += `<option value="${i}">Quyển ${i}</option>`;
        }
    } else if (book.levelType === 'level') {
        book.levels.forEach(level => {
            levelSelect.innerHTML += `<option value="${level}">${level}</option>`;
        });
    }

    levelSelect.onchange = () => {
        // Sau khi chọn cấp độ, kiểm tra xem có cần chọn loại sách không
        if (book.hasTypeSelector) {
            createTypeSelector(book);
        }
        updateFinalBookTitle();
    };

    container.appendChild(levelSelect);
}

/**
 * Tạo dropdown chọn loại sách (SGK, SBT, Cả hai)
 * @param {object} book - Đối tượng sách đã chọn
 */
function createTypeSelector(book) {
    // Xóa selector cũ nếu có
    document.getElementById('book-type-select')?.remove();

    const container = document.getElementById('book-selection-container');
    const typeSelect = document.createElement('select');
    typeSelect.id = 'book-type-select';
    typeSelect.style.padding = '8px';
    typeSelect.innerHTML = `
        <option value="">-- Chọn loại sách --</option>
        <option value="Sách giáo khoa">Sách giáo khoa</option>
        <option value="Sách bài tập">Sách bài tập</option>
        <option value="Cả hai">Cả hai (SGK + SBT)</option>
    `;
    typeSelect.onchange = updateFinalBookTitle;
    container.appendChild(typeSelect);
}
function renderTrashPage() {
    renderDeletedStudents();
    renderDeletedClasses();
}

// Hiển thị danh sách học viên đã xóa
function renderDeletedStudents() {
    const tbody = document.getElementById("deleted-student-list");
    tbody.innerHTML = "<tr><td colspan='4'>Đang tải...</td></tr>";

    const deletedStudents = Object.entries(allStudentsData)
        .filter(([, st]) => st.status === 'deleted');

    if (deletedStudents.length === 0) {
        tbody.innerHTML = "<tr><td colspan='4'>Thùng rác trống.</td></tr>";
        return;
    }

    tbody.innerHTML = "";
    deletedStudents.forEach(([id, st]) => {
        const row = `
            <tr>
                <td>${st.name || ""}</td>
                <td>${st.dob || ""}</td>
                <td>${st.package || ""}</td>
                <td>
                    <button class="btn-restore" onclick="restoreStudent('${id}')">Khôi phục</button>
                    <button class="btn-delete-perm" onclick="permanentlyDeleteStudent('${id}')">Xóa vĩnh viễn</button>
                </td>
            </tr>
        `;
        tbody.insertAdjacentHTML("beforeend", row);
    });
}

// Hiển thị danh sách lớp học đã xóa
function renderDeletedClasses() {
    const tbody = document.getElementById("deleted-class-list");
    tbody.innerHTML = "<tr><td colspan='3'>Đang tải...</td></tr>";

    const deletedClasses = Object.entries(allClassesData)
        .filter(([, cls]) => cls.status === 'deleted');
        
    if (deletedClasses.length === 0) {
        tbody.innerHTML = "<tr><td colspan='3'>Thùng rác trống.</td></tr>";
        return;
    }

    tbody.innerHTML = "";
    deletedClasses.forEach(([id, cls]) => {
        const row = `
            <tr>
                <td>${cls.name || ""}</td>
                <td>${cls.teacher || ""}</td>
                <td>
                    <button class="btn-restore" onclick="restoreClass('${id}')">Khôi phục</button>
                    <button class="btn-delete-perm" onclick="permanentlyDeleteClass('${id}')">Xóa vĩnh viễn</button>
                </td>
            </tr>
        `;
        tbody.insertAdjacentHTML("beforeend", row);
    });
}

// Khôi phục học viên
async function restoreStudent(id) {
    await database.ref(`${DB_PATHS.STUDENTS}/${id}`).update({ status: 'active' });
    Swal.fire('Đã khôi phục!', 'Học viên đã được đưa trở lại danh sách.', 'success');
    renderTrashPage(); // Cập nhật lại trang thùng rác
}

// Xóa vĩnh viễn học viên
async function permanentlyDeleteStudent(id) {
    const isConfirmed = await Swal.fire({
        title: 'Bạn chắc chắn muốn XÓA VĨNH VIỄN?',
        text: "Hành động này không thể hoàn tác!",
        icon: 'error',
        showCancelButton: true,
        confirmButtonText: 'Xóa vĩnh viễn'
    }).then(result => result.isConfirmed);

    if (isConfirmed) {
        await database.ref(`${DB_PATHS.STUDENTS}/${id}`).remove();
        Swal.fire('Đã xóa!', 'Học viên đã bị xóa vĩnh viễn.', 'success');
        delete allStudentsData[id]; // Xóa khỏi dữ liệu local
        renderTrashPage();
    }
}

// Khôi phục lớp học
async function restoreClass(id) {
    await database.ref(`${DB_PATHS.CLASSES}/${id}`).update({ status: 'active' });
    Swal.fire('Đã khôi phục!', 'Lớp học đã được đưa trở lại danh sách.', 'success');
    renderTrashPage();
}

// Xóa vĩnh viễn lớp học
async function permanentlyDeleteClass(id) {
    const isConfirmed = await Swal.fire({
        title: 'Bạn chắc chắn muốn XÓA VĨNH VIỄN?',
        text: "Hành động này không thể hoàn tác!",
        icon: 'error',
        showCancelButton: true,
        confirmButtonText: 'Xóa vĩnh viễn'
    }).then(result => result.isConfirmed);

    if (isConfirmed) {
        await database.ref(`${DB_PATHS.CLASSES}/${id}`).remove();
        // Cần thêm logic xóa lớp khỏi danh sách của học viên nếu cần
        Swal.fire('Đã xóa!', 'Lớp học đã bị xóa vĩnh viễn.', 'success');
        delete allClassesData[id]; // Xóa khỏi dữ liệu local
        renderTrashPage();
    }
}
// HÀM MỚI: Cập nhật giao diện dựa trên vai trò người dùng
function updateUIAccessByRole(userData) {
    // Biến để kiểm tra quyền truy cập các mục chung (Admin + Hội Đồng)
    const isAuthorized = userData && (userData.role === 'Admin' || userData.role === 'Hội Đồng');
    
    // === PHẦN SỬA LỖI: Định nghĩa biến 'isAdmin' một cách rõ ràng ===
    const isAdmin = userData && userData.role === 'Admin';
    // ==========================================================

    // Lấy thẻ Thùng rác trên Bảng điều khiển
    const trashCard = document.querySelector('a[href="#trash-management"]');
    if (trashCard) {
        // Chỉ Admin và Hội Đồng mới thấy Thùng rác
        trashCard.style.display = isAuthorized ? 'block' : 'none';
    }

    // Lấy link Nhật ký Hoạt động trên sidebar
    const activityLogNav = document.getElementById('nav-activity-log');
    if (activityLogNav) {
        // Chỉ Admin mới thấy Nhật ký
        activityLogNav.style.display = isAdmin ? 'block' : 'none';
    }
}
/**
 * Cập nhật ô input chỉ đọc với tên sách đầy đủ
 */
function updateFinalBookTitle() {
    const mainSelect = document.getElementById('book-main-select');
    const levelSelect = document.getElementById('book-level-select');
    const typeSelect = document.getElementById('book-type-select');
    const finalTitleInput = document.getElementById('book-fee-title-final');

    let titleParts = [];

    if (mainSelect && mainSelect.value) {
        titleParts.push(mainSelect.value);
    } else {
        finalTitleInput.value = '';
        return;
    }

    if (levelSelect && levelSelect.value) {
        titleParts.push(levelSelect.value);
    }

    if (typeSelect && typeSelect.value) {
        titleParts.push(`(${typeSelect.value})`);
    }

    finalTitleInput.value = titleParts.join(' ').trim();
}
/**
 * Xử lý khi di chuột vào một hàng trong danh sách lớp.
 * @param {MouseEvent} event - Sự kiện chuột.
 */
function handleClassRowMouseEnter(event) {
    const tooltip = document.getElementById("class-info-tooltip");
    const classId = event.currentTarget.dataset.classId;
    const cls = allClassesData[classId];

    if (!cls || !tooltip) return;

    // 1. Lấy và định dạng Lịch học
    let scheduleHtml = "Chưa có lịch";
    if (cls.fixedSchedule) {
        const dayMap = { 0: "Chủ Nhật", 1: "Thứ 2", 2: "Thứ 3", 3: "Thứ 4", 4: "Thứ 5", 5: "Thứ 6", 6: "Thứ 7" };
        scheduleHtml = Object.entries(cls.fixedSchedule)
            .map(([dayIndex, time]) => `${dayMap[dayIndex]}: ${time}`)
            .join('<br>');
    }

    // 2. Lấy Sĩ số
    const classSize = cls.students ? Object.keys(cls.students).length : 0;

    // 3. Tính toán số buổi đã học / còn lại (chỉ cho Lớp chứng chỉ)
    let sessionInfoHtml = '';
    if (cls.classType === 'Lớp chứng chỉ' && cls.certificateType && cls.courseName) {
        const courseData = certificateCourses[cls.certificateType]?.find(c => c.name === cls.courseName);
        const totalSessions = courseData?.sessions || 0;
        
        const today = new Date().toISOString().split('T')[0];
        const attendedSessions = Object.keys(cls.sessions || {}).filter(date => date < today).length;
        const remainingSessions = totalSessions > 0 ? totalSessions - attendedSessions : 'N/A';
        
        sessionInfoHtml = `
            <div><strong>Số buổi đã học:</strong> ${attendedSessions}</div>
            <div><strong>Số buổi còn lại:</strong> ${remainingSessions}</div>
        `;
    }

    // 4. Tạo nội dung HTML cho tooltip
    tooltip.innerHTML = `
        <div style="margin-bottom: 8px;"><strong>Lịch học:</strong><br>${scheduleHtml}</div>
        <div><strong>Sĩ số:</strong> ${classSize}</div>
        ${sessionInfoHtml}
    `;

    // 5. Hiển thị tooltip
    tooltip.style.display = 'block';
}

/**
 * Xử lý khi di chuyển chuột trên hàng để cập nhật vị trí tooltip.
 * @param {MouseEvent} event - Sự kiện chuột.
 */
function handleClassRowMouseMove(event) {
    const tooltip = document.getElementById("class-info-tooltip");
    if (!tooltip || tooltip.style.display === 'none') return;

    const offset = 15; // Khoảng cách giữa con trỏ và tooltip
    let x = event.clientX + offset;
    let y = event.clientY + offset;

    // Logic "thông minh" để tránh tooltip bị tràn ra ngoài màn hình
    const tooltipWidth = tooltip.offsetWidth;
    const tooltipHeight = tooltip.offsetHeight;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Nếu tràn sang phải, hiển thị tooltip bên trái con trỏ
    if (x + tooltipWidth > viewportWidth) {
        x = event.clientX - tooltipWidth - offset;
    }

    // Nếu tràn xuống dưới, hiển thị tooltip bên trên con trỏ
    if (y + tooltipHeight > viewportHeight) {
        y = event.clientY - tooltipHeight - offset;
    }

    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
}

/**
 * Xử lý khi đưa chuột ra khỏi hàng để ẩn tooltip.
 */
function handleClassRowMouseLeave() {
    const tooltip = document.getElementById("class-info-tooltip");
    if (tooltip) {
        tooltip.style.display = 'none';
    }
}
// Hàm chuyển tab
function openPageTab(evt, tabName, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Ẩn tất cả nội dung của các tab
    const tabcontent = container.querySelectorAll(".tabs__content");
    tabcontent.forEach(tab => {
        tab.classList.remove("active");
        tab.style.display = "none";
    });

    // Xóa class "active" khỏi tất cả các nút tab
    const tablinks = container.querySelectorAll(".tabs__button");
    tablinks.forEach(button => {
        button.classList.remove("active");
    });

    // Hiển thị tab được chọn và thêm class "active"
    const targetTab = document.getElementById(tabName);
    if (targetTab) {
        targetTab.style.display = "block";
        targetTab.classList.add("active");
    }
    evt.currentTarget.classList.add("active");
}
// Hiển thị modal tổng quan tiền sách của một lớp
async function showClassBookFeeModal(classId) {
    showLoading(true);
    const modal = document.getElementById('class-book-fee-modal');
    const studentListBody = document.getElementById("class-book-fee-student-list");
    studentListBody.innerHTML = ''; 

    try {
        const classSnap = await database.ref(`classes/${classId}`).once('value');
        const classData = classSnap.val();
        if (!classData) throw new Error("Không tìm thấy dữ liệu lớp học.");

        document.getElementById("class-book-fee-name").textContent = classData.name || "Không tên";
        document.getElementById("update-book-class-id").value = classId;

        // Lấy thông tin của đợt sách HIỆN TẠI
        const currentDriveId = classData.currentBookDriveId;
        const currentBookInfo = (currentDriveId && classData.bookDrives) ? classData.bookDrives[currentDriveId] : {};

        const studentIds = Object.keys(classData.students || {});
        if (studentIds.length === 0) {
            // ... (phần xử lý lớp rỗng giữ nguyên)
            return;
        }

        const studentPromises = studentIds.map(id => database.ref(`students/${id}`).once('value'));
        const studentSnapshots = await Promise.all(studentPromises);
        
        let tableRowsHtml = "";
        studentSnapshots.forEach(snap => {
            if (!snap.exists()) return;
            const studentId = snap.key;
            const student = snap.val();
            
            // Kiểm tra trạng thái đóng tiền cho đợt sách HIỆN TẠI
            const isPaid = student.bookPayments?.[classId]?.[currentDriveId]?.paid === true;
            // === LOGIC CẢNH BÁO SỐ BUỔI ===
        const sessionsAttended = student.sessionsAttended || 0;
        const totalSessionsPaid = student.totalSessionsPaid || 0;
        const remainingSessions = totalSessionsPaid - sessionsAttended;
        let warningClass = '';
        let iconHtml = '';
        if (remainingSessions <= 0) {
            warningClass = 'student-warning-critical';
        } else if (remainingSessions <= 3) {
            warningClass = 'student-warning-low';
            iconHtml = '<span class="warning-icon">&#9888;</span> ';
        }
        // ================================

            tableRowsHtml += `
                <tr>
                    <td>${student.name}</td>
                    <td>${currentBookInfo.bookName || '(Chưa có sách)'}</td>
                    <td>${(currentBookInfo.bookFee || 0).toLocaleString('vi-VN')}</td>
                    <td>
                        <input type="checkbox" 
                               onchange="toggleBookFeePaid('${studentId}', '${classId}', '${currentDriveId}', this.checked)" 
                               ${isPaid ? 'checked' : ''}
                               ${!currentDriveId ? 'disabled' : ''}> 
                        Đã đóng
                    </td>
                    <td><button onclick="showBookFeeHistory('${studentId}', '${classId}')">Xem lịch sử</button></td>
                </tr>`;
        });
        studentListBody.innerHTML = tableRowsHtml;

    } catch (error) {
        // ... (phần xử lý lỗi giữ nguyên)
    } finally {
        showLoading(false);
        modal.style.display = "flex";
    }
}


// Hiển thị modal cập nhật thông tin sách
function showUpdateClassBookModal() {
    const classId = document.getElementById("update-book-class-id").value;
    const classData = allClassesData[classId];
    if (classData && classData.bookInfo) {
        document.getElementById("class-book-name").value = classData.bookInfo.bookName || '';
        document.getElementById("class-book-type").value = classData.bookInfo.bookType || '';
        document.getElementById("class-book-fee").value = classData.bookInfo.bookFee || 0;
    } else {
        document.getElementById("update-class-book-form").reset();
    }
    document.getElementById("update-class-book-modal").style.display = "flex";
}

async function saveClassBookInfo() {
    const classId = document.getElementById("update-book-class-id").value;
    const bookName = document.getElementById("class-book-name").value.trim();
    const bookFee = parseInt(document.getElementById("class-book-fee").value) || 0;

    if (!bookName || bookFee < 0) {
        Swal.fire("Lỗi", "Vui lòng nhập Tên sách và Tiền sách hợp lệ.", "error");
        return;
    }

    showLoading(true);
    try {
        // 1. Tạo một "đợt thu tiền sách" mới bằng lệnh push() để có ID duy nhất
        const bookDrivesRef = database.ref(`classes/${classId}/bookDrives`);
        const newDriveRef = await bookDrivesRef.push({
            bookName: bookName,
            bookFee: bookFee,
            createdAt: new Date().toISOString().split("T")[0] // Lưu ngày tạo đợt thu
        });

        // 2. Lấy ID của đợt mới và đặt nó làm "đợt thu hiện tại" của lớp
        const newDriveId = newDriveRef.key;
        await database.ref(`classes/${classId}/currentBookDriveId`).set(newDriveId);

        document.getElementById("update-class-book-modal").style.display = "none";
        Swal.fire("Thành công!", "Đã tạo một đợt thu tiền sách mới cho lớp.", "success");
        
        // Tải lại modal tổng quan để hiển thị dữ liệu mới
        await showClassBookFeeModal(classId);

    } catch (error) {
        console.error("Lỗi khi lưu thông tin sách:", error);
        Swal.fire("Lỗi", "Không thể lưu thông tin sách.", "error");
    } finally {
        showLoading(false);
    }
}

// Tick/bỏ tick ô đã đóng tiền sách
async function toggleBookFeePaid(studentId, classId, driveId, isPaid) {
    if (!driveId || driveId === 'undefined') {
        Swal.fire("Lỗi", "Chưa có đợt thu tiền sách nào được tạo cho lớp này.", "error");
        return;
    }
    // Đường dẫn mới, lưu trạng thái theo từng đợt sách
    const statusRef = database.ref(`students/${studentId}/bookPayments/${classId}/${driveId}`);
    try {
        if (isPaid) {
            await statusRef.set({
                paid: true,
                paidDate: new Date().toISOString().split("T")[0],
                recordedBy: currentUserData.name || "System"
            });
        } else {
            await statusRef.remove();
        }
    } catch (error) {
        console.error("Lỗi cập nhật trạng thái tiền sách:", error);
    }
}

// Xem lịch sử đóng tiền sách của học viên
async function showBookFeeHistory(studentId, classId) {
    showLoading(true);
    try {
        const student = allStudentsData[studentId];
        const classData = allClassesData[classId];

        const allDrives = classData.bookDrives || {};
        const studentPayments = student.bookPayments ? (student.bookPayments[classId] || {}) : {};

        if (Object.keys(allDrives).length === 0) {
            Swal.fire("Chưa có dữ liệu", "Lớp này chưa có đợt thu tiền sách nào.", "info");
            return;
        }

        // Sắp xếp các đợt thu theo ngày tạo
        const sortedDrives = Object.entries(allDrives).sort(([, a], [, b]) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );

        let historyHtml = `
            <div style="text-align: left; max-height: 400px; overflow-y: auto;">
                <table class="swal-table">
                    <thead>
                        <tr>
                            <th>Ngày Cập nhật Sách</th>
                            <th>Tên Sách</th>
                            <th>Tiền Sách</th>
                            <th>Trạng thái</th>
                            <th>Ngày Đóng</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        sortedDrives.forEach(([driveId, driveData]) => {
            const payment = studentPayments[driveId];
            const status = payment && payment.paid ? 
                '<span style="color: green; font-weight: bold;">Đã đóng</span>' : 
                '<span style="color: red;">Chưa đóng</span>';
            
            historyHtml += `
                <tr>
                    <td>${driveData.createdAt}</td>
                    <td>${driveData.bookName}</td>
                    <td>${(driveData.bookFee || 0).toLocaleString('vi-VN')} đ</td>
                    <td>${status}</td>
                    <td>${payment ? payment.paidDate : '---'}</td>
                </tr>
            `;
        });

        historyHtml += `</tbody></table></div>`;

        Swal.fire({
            title: `Lịch sử đóng tiền sách<br><small>${student.name}</small>`,
            html: historyHtml,
            width: '800px'
        });

    } catch(error) {
        console.error("Lỗi khi xem lịch sử tiền sách:", error);
        Swal.fire("Lỗi", "Không thể tải lịch sử tiền sách.", "error");
    } finally {
        showLoading(false);
    }
}
/**
 * HÀM MỚI & DUY NHẤT: Dùng để chuyển đổi giữa các tab
 * @param {Event} evt - Sự kiện click
 * @param {string} tabName - ID của nội dung tab cần hiển thị
 * @param {string} containerId - ID của khối chứa các tab (để phân biệt các nhóm tab khác nhau)
 */
function openPageTab(evt, tabName, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Ẩn tất cả nội dung của các tab trong container này
    const tabcontent = container.getElementsByClassName("tabs__content");
    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].classList.remove("active");
        tabcontent[i].style.display = "none";
    }

    // Xóa class "active" khỏi tất cả các nút tab
    const tablinks = container.getElementsByClassName("tabs__button");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Hiển thị tab được chọn và thêm class "active" cho nút
    document.getElementById(tabName).style.display = "block";
    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.className += " active";
}
async function promptResetClassBookFee() {
    const classId = document.getElementById("update-book-class-id").value;
    if (!classId) return;

    const result = await Swal.fire({
        title: 'Bạn chắc chắn muốn Reset?',
        text: "Hành động này sẽ XÓA VĨNH VIỄN toàn bộ lịch sử, các đợt thu và trạng thái đóng tiền sách của TẤT CẢ học viên trong lớp này!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonText: 'Hủy',
        confirmButtonText: 'Vâng, Reset cho cả lớp!'
    });

    if (result.isConfirmed) {
        showLoading(true);
        try {
            const classData = allClassesData[classId];
            if (!classData) throw new Error("Không tìm thấy dữ liệu lớp.");

            const studentIds = Object.keys(classData.students || {});
            const updates = {};
            const className = classData.name || 'Không rõ tên';

            // 1. Xóa thông tin sách và các đợt thu của lớp
            updates[`/classes/${classId}/bookInfo`] = null;
            updates[`/classes/${classId}/bookDrives`] = null;
            updates[`/classes/${classId}/currentBookDriveId`] = null;

            // 2. Xóa lịch sử đóng tiền sách của từng học viên trong lớp đó
            studentIds.forEach(studentId => {
                updates[`/students/${studentId}/bookPayments/${classId}`] = null;
                updates[`/students/${studentId}/bookFeeStatus/${classId}`] = null; // Dành cho cấu trúc cũ (nếu có)
            });

            // 3. Gửi một lệnh cập nhật duy nhất lên Firebase
            await database.ref().update(updates);
            await logActivity(`Đã reset tiền sách cho lớp: ${className}`);

            Swal.fire('Đã Reset!', 'Toàn bộ thông tin tiền sách của lớp đã được xóa.', 'success');

            // Tải lại modal để thấy sự thay đổi
            await showClassBookFeeModal(classId);

        } catch (error) {
            console.error("Lỗi khi reset tiền sách lớp:", error);
            Swal.fire("Lỗi!", "Đã xảy ra lỗi khi reset tiền sách của lớp.", "error");
        } finally {
            showLoading(false);
        }
    }
}
function toggleCollapsible(headerElement) {
    // Thêm hoặc xóa class 'active' trên tiêu đề
    headerElement.classList.toggle('active');

    // Lấy phần tử nội dung ngay sau tiêu đề
    const content = headerElement.nextElementSibling;
    
    // Kiểm tra và thay đổi trạng thái hiển thị
    if (content.style.display === "block") {
        content.style.display = "none";
    } else {
        content.style.display = "block";
    }
}
async function logActivity(actionDescription) {
    // Chỉ ghi nhật ký nếu người dùng không phải là Admin
    if (!currentUserData || currentUserData.role === 'Admin') {
        return; 
    }

    const logEntry = {
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        userUid: currentUserData.uid,
        userName: currentUserData.name,
        userRole: currentUserData.role,
        action: actionDescription
    };

    try {
        await database.ref('activityLog').push(logEntry);
    } catch (error) {
        console.error("Lỗi khi ghi nhật ký hoạt động:", error);
    }
}

/**
 * HÀM MỚI: Render (vẽ) ra trang Nhật ký Hoạt động
 */
async function renderActivityLog() {
    const logListBody = document.getElementById("activity-log-list");
    logListBody.innerHTML = '<tr><td colspan="4">Đang tải nhật ký...</td></tr>';
    showLoading(true);

    try {
        // Lấy 100 hoạt động gần nhất
        const snapshot = await database.ref('activityLog').orderByChild('timestamp').limitToLast(100).once('value');
        const logs = snapshot.val() || {};

        if (Object.keys(logs).length === 0) {
            logListBody.innerHTML = '<tr><td colspan="4">Chưa có hoạt động nào được ghi nhận.</td></tr>';
            return;
        }

        // Sắp xếp lại để hiển thị cái mới nhất lên đầu
        const sortedLogs = Object.values(logs).sort((a, b) => b.timestamp - a.timestamp);

        let tableRowsHtml = "";
        sortedLogs.forEach(log => {
            const logTime = new Date(log.timestamp).toLocaleString('vi-VN');
            tableRowsHtml += `
                <tr>
                    <td>${logTime}</td>
                    <td>${log.userName}</td>
                    <td>${log.userRole}</td>
                    <td>${log.action}</td>
                </tr>
            `;
        });
        logListBody.innerHTML = tableRowsHtml;

    } catch (error) {
        console.error("Lỗi khi tải nhật ký:", error);
        logListBody.innerHTML = '<tr><td colspan="4">Không thể tải nhật ký hoạt động.</td></tr>';
    } finally {
        showLoading(false);
    }
}
/**
 * HÀM CẬP NHẬT: Chuyển lớp sang dạng Phổ thông để kích hoạt cơ chế tự động gia hạn.
 * @param {string} classId - ID của lớp cần chuyển đổi.
 */
async function convertAndExtendClass(classId) {
    if (!classId) return;

    // 1. Hỏi xác nhận với nội dung mới
    const result = await Swal.fire({
        title: 'Chuyển sang Lớp Phổ thông?',
        text: "Hệ thống sẽ chuyển lớp này sang loại có lịch học tự động gia hạn. Lịch sẽ tự động được thêm 16 buổi mỗi khi cần. Bạn có chắc chắn?",
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Vâng, chuyển đổi!',
        cancelButtonText: 'Hủy'
    });

    if (!result.isConfirmed) return;

    showLoading(true);
    try {
        const classRef = database.ref(`classes/${classId}`);
        const classSnap = await classRef.once('value');
        const classData = classSnap.val();

        if (!classData || !classData.sessions || !classData.fixedSchedule) {
            throw new Error("Dữ liệu lớp học không đầy đủ để chuyển đổi.");
        }

        // 2. Tìm ngày học cuối cùng để bắt đầu thêm buổi mới
        const existingSessions = Object.keys(classData.sessions).sort();
        const lastSessionDateStr = existingSessions[existingSessions.length - 1];
        
        const nextDay = new Date(lastSessionDateStr);
        nextDay.setDate(nextDay.getDate() + 1);
        const newStartDateStr = nextDay.toISOString().split('T')[0];

        // 3. Chỉ thêm một khối "mồi" gồm 16 buổi
        const sessionsToGenerate = 16;

        const newSessions = generateRollingSessions(newStartDateStr, sessionsToGenerate, classData.fixedSchedule);

        // 4. Chuẩn bị dữ liệu cập nhật
        const updates = {};
        for (const dateKey in newSessions) {
            updates[`/classes/${classId}/sessions/${dateKey}`] = newSessions[dateKey];
        }
        // Dòng quan trọng nhất: thay đổi loại lớp học
        updates[`/classes/${classId}/classType`] = 'Lớp tiếng Anh phổ thông'; 
        updates[`/classes/${classId}/updatedAt`] = firebase.database.ServerValue.TIMESTAMP;
        
        await database.ref().update(updates);
        
        Swal.fire('Thành công!', `Lớp đã được chuyển sang loại tự động gia hạn và đã được thêm ${sessionsToGenerate} buổi học mới.`, 'success');
        hideClassForm();

    } catch (error) {
        console.error("Lỗi khi chuyển đổi lớp:", error);
        Swal.fire("Lỗi!", "Đã xảy ra lỗi: " + error.message, "error");
    } finally {
        showLoading(false);
    }
}
/**
 * HÀM CUỐI CÙNG: Áp dụng logic tính toán đã được kiểm chứng cho TOÀN BỘ học viên.
 * 1. Tìm lớp học đang hoạt động mới nhất của mỗi học viên.
 * 2. Đếm lại số buổi đã học (bao gồm cả KT định kỳ của lớp phổ thông) CHỈ trong lớp đó.
 * 3. Ghi đè lại kết quả cho tất cả học viên.
 */
async function finalRecalculateAllStudentSessions() {
    const result = await Swal.fire({
        title: 'Bạn chắc chắn muốn đồng bộ lại toàn bộ?',
        text: "Hệ thống sẽ thực hiện đợt quét sâu cuối cùng để GHI ĐÈ lại 'số buổi đã học' cho TẤT CẢ học viên. Đây là phương pháp chính xác nhất dựa trên logic đã kiểm tra.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Vâng, thực hiện ngay!',
        cancelButtonText: 'Hủy'
    });

    if (!result.isConfirmed) {
        console.log("Hành động đã bị hủy.");
        return;
    }

    console.log("Bắt đầu quá trình đồng bộ cuối cùng...");
    showLoading(true);

    try {
        const [studentsSnap, attendanceSnap, classesSnap] = await Promise.all([
            database.ref('students').once('value'),
            database.ref('attendance').once('value'),
            database.ref('classes').once('value')
        ]);
        
        const allStudents = studentsSnap.val() || {};
        const allAttendance = attendanceSnap.val() || {};
        const allClasses = classesSnap.val() || {};

        const updates = {};
        let studentsProcessed = 0;

        for (const studentId in allStudents) {
            studentsProcessed++;
            const studentData = allStudents[studentId];
            
            // --- BƯỚC A: TÌM LỚP HỌC HIỆN TẠI DUY NHẤT CỦA HỌC VIÊN ---
            let newestActiveClassId = null;
            let latestEnrollment = 0;

            if (studentData.classes) {
                for (const classId in studentData.classes) {
                    const classData = allClasses[classId];
                    if (classData && (classData.status === 'active' || !classData.status)) {
                        const enrollmentTime = classData.students?.[studentId]?.enrolledAt || 0;
                        if (enrollmentTime >= latestEnrollment) { // Dùng >= để xử lý trường hợp chỉ có 1 lớp
                            latestEnrollment = enrollmentTime;
                            newestActiveClassId = classId;
                        }
                    }
                }
            }
            
            // --- BƯỚC B: CHỈ ĐẾM SỐ BUỔI TRONG LỚP HỌC ĐÓ ---
            let correctAttendedCount = 0;
            if (newestActiveClassId && allAttendance[newestActiveClassId]?.[studentId]) {
                const studentAttendanceInClass = allAttendance[newestActiveClassId][studentId];
                const classData = allClasses[newestActiveClassId];
                const isGeneralTypeClass = classData.classType === 'Lớp tiếng Anh phổ thông' || classData.classType === 'Lớp các môn trên trường';

                for (const date in studentAttendanceInClass) {
                    if (studentAttendanceInClass[date]?.attended === true) {
                        const isExam = classData.exams?.[date];
                        if (!isExam || (isExam && isGeneralTypeClass)) {
                            // Đếm nếu là buổi học thường, HOẶC là buổi thi của lớp phổ thông
                            correctAttendedCount++;
                        }
                    }
                }
            }
            
            // --- BƯỚC C: GHI ĐÈ trực tiếp, không cần so sánh ---
            updates[`/students/${studentId}/sessionsAttended`] = correctAttendedCount;
        }

        await database.ref().update(updates);
        Swal.fire('Hoàn tất!', `Đã quét và ghi đè lại số buổi đã học cho ${studentsProcessed} học viên.`, 'success');

    } catch (error) {
        console.error("Lỗi trong quá trình tính lại:", error);
        Swal.fire("Lỗi!", "Đã xảy ra lỗi: " + error.message, "error");
    } finally {
        showLoading(false);
    }
}
/**
 * HÀM GỠ LỖI CUỐI CÙNG: Áp dụng logic tính toán chính xác cho một học viên
 * và in ra chi tiết quá trình để kiểm tra.
 * @param {string} studentName - Tên chính xác của học viên cần gỡ lỗi.
 */
async function debugFinalRecalculation(studentName) {
    if (!studentName) {
        console.error("Vui lòng nhập tên học viên. Ví dụ: debugFinalRecalculation('Nguyễn Văn A')");
        return;
    }

    console.clear();
    console.log(`--- BẮT ĐẦU GỠ LỖI CHO HỌC VIÊN: ${studentName} ---`);
    showLoading(true);

    try {
        let studentId = null;
        let studentData = null;
        let foundCount = 0;
        for (const id in allStudentsData) {
            if (allStudentsData[id].name === studentName) {
                studentId = id;
                studentData = allStudentsData[id];
                foundCount++;
            }
        }
        if (!studentId) throw new Error(`Không tìm thấy học viên nào có tên "${studentName}".`);
        if (foundCount > 1) throw new Error(`Tìm thấy ${foundCount} học viên cùng tên. Vui lòng kiểm tra lại.`);

        const [attendanceSnap, classesSnap] = await Promise.all([
            database.ref('attendance').once('value'),
            database.ref('classes').once('value')
        ]);
        const allAttendance = attendanceSnap.val() || {};
        const allClasses = classesSnap.val() || {};

        const detailedLogs = [];

        // --- BƯỚC A: TÌM LỚP HỌC ĐANG HOẠT ĐỘNG MỚI NHẤT ---
        detailedLogs.push("--- BƯỚC A: TÌM LỚP HỌC ĐANG HOẠT ĐỘNG MỚI NHẤT ---");
        let newestActiveClassId = null;
        let latestEnrollment = 0;

        if (studentData.classes) {
            for (const classId in studentData.classes) {
                const classData = allClasses[classId];
                if (classData && (classData.status === 'active' || !classData.status)) {
                    const enrollmentTime = classData.students?.[studentId]?.enrolledAt || 0;
                    detailedLogs.push(`[LỚP: ${classData.name}] - Trạng thái: active. Thời gian nhập học: ${enrollmentTime}`);
                    if (enrollmentTime >= latestEnrollment) {
                        latestEnrollment = enrollmentTime;
                        newestActiveClassId = classId;
                        detailedLogs.push(`  -> Được chọn là lớp mới nhất (tạm thời).`);
                    }
                } else {
                     detailedLogs.push(`[LỚP: ${classData?.name || classId}] - Trạng thái: ${classData?.status || 'không tồn tại'}. Bỏ qua.`);
                }
            }
        }
        
        const finalClassName = newestActiveClassId ? allClasses[newestActiveClassId].name : "Không tìm thấy";
        detailedLogs.push(`=> KẾT LUẬN: Lớp học mới nhất đang hoạt động là: "${finalClassName}"`);
        
        // --- BƯỚC B: ĐẾM SỐ BUỔI ĐIỂM DANH TRONG LỚP TÌM ĐƯỢC ---
        detailedLogs.push("\n--- BƯỚC B: ĐẾM SỐ BUỔI ĐIỂM DANH TRONG LỚP TRÊN ---");
        let correctAttendedCount = 0;
        if (newestActiveClassId && allAttendance[newestActiveClassId]?.[studentId]) {
            const studentAttendanceInClass = allAttendance[newestActiveClassId][studentId];
            const classData = allClasses[newestActiveClassId];
            const isGeneralTypeClass = classData.classType === 'Lớp tiếng Anh phổ thông' || classData.classType === 'Lớp các môn trên trường';

            for (const date in studentAttendanceInClass) {
                if (studentAttendanceInClass[date]?.attended === true) {
                    const isExam = classData.exams?.[date];
                    if (!isExam) {
                        detailedLogs.push(`  -> [${date}]: Buổi học thường. ĐẾM +1.`);
                        correctAttendedCount++;
                    } else if (isGeneralTypeClass) {
                        detailedLogs.push(`  -> [${date}]: Buổi KT định kỳ (lớp phổ thông). ĐẾM +1.`);
                        correctAttendedCount++;
                    } else {
                        detailedLogs.push(`  -> [${date}]: Buổi thi (lớp chứng chỉ). KHÔNG ĐẾM.`);
                    }
                }
            }
        } else {
            detailedLogs.push("Không tìm thấy dữ liệu điểm danh nào trong lớp này.");
        }
        
        console.log("%c--- KẾT QUẢ ---", "font-weight: bold; font-size: 18px; color: blue;");
        console.log(`Số buổi đã học (hiện đang lưu trong DB): %c${studentData.sessionsAttended || 0}`, "font-weight: bold; color: red;");
        console.log(`Số buổi đếm được (kết quả tính toán lại): %c${correctAttendedCount}`, "font-weight: bold; color: green;");
        
        console.groupCollapsed("Xem chi tiết quá trình gỡ lỗi");
        detailedLogs.forEach(log => console.log(log));
        console.groupEnd();
        
        const updateResult = await Swal.fire({
            title: 'Gỡ lỗi hoàn tất',
            html: `Số buổi đếm được là <b>${correctAttendedCount}</b>. Bạn có muốn cập nhật lại con số này cho <b>${studentName}</b> không?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Có, cập nhật!',
            cancelButtonText: 'Không, chỉ xem thôi'
        });

        if (updateResult.isConfirmed) {
            await database.ref(`students/${studentId}/sessionsAttended`).set(correctAttendedCount);
            Swal.fire('Đã cập nhật!', `Số buổi đã học của ${studentName} đã được sửa thành ${correctAttendedCount}.`, 'success');
        }

    } catch (error) {
        console.error("Lỗi khi gỡ lỗi:", error);
        Swal.fire("Lỗi!", error.message, "error");
    } finally {
        showLoading(false);
    }
}

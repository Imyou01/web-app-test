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
let selectedBranchId = null; // Lưu ID của cơ sở đang làm việc ('branch1', 'branch2', ...)
let allStudentsData = {};
let allClassesData = {};
let allUsersData = {};
let currentUserData = null;
let currentClassStudents = [];

let personnelListInitialized = false;
let codeManagementListenerInitialized = false;
let scheduleEventListenersInitialized = false;
//let tempClassesData = {};
let selectedTempStudents = {};

// Đường dẫn các node trong Realtime Database
const DB_PATHS = {
  USERS: "users",
  STUDENTS: "students",
  CLASSES: "classes",
  HOMEWORKS: "homeworks",
  ATTENDANCE: "attendance",
  PERSONNEL_CODES: "personnel_codes"
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
  "activity-log-page",
  "code-management"
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

const HOLIDAYS = [
    '01-01' // Tết Dương lịch
];

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

/**
 * HÀM MỚI: Trả về một Firebase Database Reference đã trỏ đúng vào nhánh dữ liệu của cơ sở đã chọn.
 * @param {string} path - Đường dẫn tương đối bên trong một nhánh (vd: DB_PATHS.STUDENTS, 'classes/some_class_id').
 * @returns {firebase.database.Reference} - Một đối tượng Reference.
 */
function getBranchRef(path) {
    if (!selectedBranchId) {
        // Trường hợp lỗi: Chưa chọn cơ sở mà đã cố gắng truy cập dữ liệu nhánh
        console.error("Lỗi nghiêm trọng: Chưa chọn cơ sở (selectedBranchId is null) khi gọi getBranchRef với path:", path);
        // Có thể hiển thị thông báo lỗi hoặc chuyển hướng về màn hình chọn cơ sở
        // Ví dụ đơn giản: Ném lỗi để dừng thực thi
        throw new Error("Chưa chọn cơ sở làm việc.");
    }
    // Tạo đường dẫn đầy đủ: ví dụ "branches/branch1/students"
    const fullPath = `branches/${selectedBranchId}/${path}`;
    return database.ref(fullPath);
}

// Khi trạng thái xác thực thay đổi
auth.onAuthStateChanged(async (user) => {
  checkInitialAuthState();
});
async function checkInitialAuthState() {
    console.log("Kiểm tra trạng thái đăng nhập ban đầu...");
    const user = auth.currentUser; // Lấy user hiện tại trực tiếp

    // === LOGIC MỚI: KIỂM TRA LỰA CHỌN CƠ SỞ ===
    selectedBranchId = localStorage.getItem('selectedBranchId');
    const branchScreen = document.getElementById('branch-selection-screen');

    if (!selectedBranchId) {
        console.log("Chưa chọn cơ sở. Hiển thị màn hình chọn.");
        if (branchScreen) {
            branchScreen.style.display = 'flex'; // Đảm bảo màn hình chọn hiển thị
            branchScreen.classList.remove('hidden');
        }
        // Ẩn các màn hình khác
        document.getElementById("auth-container").style.display = "none";
        document.getElementById("role-selection").style.display = "none";
        document.getElementById("pending-approval-screen").style.display = "none";
        document.getElementById("app-layout").style.display = "none";
        return; // Dừng lại ở đây, chờ người dùng chọn cơ sở
    } else {
        console.log("Đã chọn cơ sở:", selectedBranchId);
        if (branchScreen) {
            branchScreen.style.display = 'none'; // Ẩn màn hình chọn nếu đã có lựa chọn
            branchScreen.classList.add('hidden');
        }
    }
    // === KẾT THÚC LOGIC MỚI ===

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
      //showLoading(true);
      try {
        await loadInitialData();
        initListeners();
        setupDashboardUI(currentUserData);
        updateUIAccessByRole(currentUserData);
    /*    if (typeof Lucide !== 'undefined') {
            Lucide.createIcons();
        } */
        await showPageFromHash();
      } catch (error) {
         console.error("Lỗi nghiêm trọng khi khởi tạo:", error);
         Swal.fire("Lỗi Khởi Tạo", "Không thể tải dữ liệu cần thiết. Vui lòng thử lại.", "error");
         showLoading(false); // Ẩn loading nếu có lỗi ở đây
      } finally {
       // showLoading(false);
      }
    }
  } else {
    // 4. Chưa đăng nhập -> Hiển thị form đăng nhập
    document.getElementById("auth-container").style.display = "flex";
    currentUserData = null;
  }
}
// =========================== AUTH FUNCTIONS ===========================
/**
 * HÀM MỚI: Xử lý khi người dùng chọn một cơ sở
 * @param {string} branchId - ID của cơ sở được chọn (vd: 'branch1')
 */
function selectBranch(branchId) {
    console.log("Đã chọn cơ sở:", branchId);
    selectedBranchId = branchId;
    localStorage.setItem('selectedBranchId', branchId); // Lưu vào localStorage

    // Ẩn màn hình chọn cơ sở
    const branchScreen = document.getElementById('branch-selection-screen');
    if (branchScreen) {
        branchScreen.classList.add('hidden'); // Dùng class để ẩn mượt hơn
        // Dùng setTimeout để đảm bảo animation ẩn hoàn thành trước khi ẩn hẳn
        setTimeout(() => {
             branchScreen.style.display = 'none';
        }, 300); // 300ms khớp với transition trong CSS
    }

    // Sau khi chọn, kiểm tra trạng thái đăng nhập để hiển thị form login hoặc vào app
    checkInitialAuthState(); // Gọi hàm kiểm tra đăng nhập (sẽ tạo ở bước sau)
}
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
    // === THÊM CÁC DÒNG NÀY ===
    console.log("Đăng xuất, xóa lựa chọn cơ sở...");
    localStorage.removeItem('selectedBranchId'); // Xóa lựa chọn cơ sở khi đăng xuất
    selectedBranchId = null; // Reset biến toàn cục
    // ======================

    window.globalListenersInitialized = false;

    // Ẩn giao diện chính của ứng dụng
    document.getElementById("app-layout").style.display = "none";

    // Hiển thị lại màn hình đăng nhập (sẽ bị ẩn ngay sau đó nếu chọn cơ sở)
    document.getElementById("auth-container").style.display = "flex";
    showForm("login"); // Đặt lại form đăng nhập về mặc định

    // Các thao tác dọn dẹp khác
    window.location.hash = ""; // Xóa hash khỏi URL
    hideAllManagementPages(); // Ẩn tất cả các trang quản lý
    personnelListInitialized = false; // Reset trạng thái khởi tạo trang nhân sự

    // QUAN TRỌNG: Hiển thị lại màn hình chọn cơ sở sau khi đăng xuất
    const branchScreen = document.getElementById('branch-selection-screen');
     if (branchScreen) {
        console.log("Hiển thị lại màn hình chọn cơ sở sau khi đăng xuất.");
        branchScreen.style.display = 'flex';
        branchScreen.classList.remove('hidden'); // Bỏ class hidden đi
    }

  }).catch(error => {
    // Sử dụng Swal thay cho alert
    Swal.fire({icon: 'error', title: 'Lỗi Đăng Xuất', text: error.message});
    console.error("Lỗi đăng xuất:", error);
  });
}
/**
 * HÀM MỚI: Hiển thị lại màn hình chọn cơ sở mà không cần đăng xuất
 */
function promptSwitchBranch() {
    console.log("Yêu cầu chuyển cơ sở...");
    // 1. Xóa lựa chọn cơ sở đã lưu
    localStorage.removeItem('selectedBranchId');
    selectedBranchId = null;

    // 2. Ẩn giao diện ứng dụng hiện tại
    const appLayout = document.getElementById('app-layout');
    if (appLayout) {
        appLayout.style.display = 'none';
    }

    // 3. Ẩn các màn hình khác (phòng trường hợp đang ở màn hình role/pending)
    document.getElementById("role-selection").style.display = "none";
    document.getElementById("pending-approval-screen").style.display = "none";
    document.getElementById("auth-container").style.display = "none"; // Ẩn cả login


    // 4. Reset các trạng thái listener (quan trọng để tránh lỗi khi chọn lại cơ sở)
     window.globalListenersInitialized = false; // Cho phép gắn lại listener chung
     // Có thể cần detach các listener cũ ở đây nếu Firebase SDK không tự xử lý
     // database.ref(...).off(); // Ví dụ

    // 5. Hiển thị lại màn hình chọn cơ sở
    const branchScreen = document.getElementById('branch-selection-screen');
    if (branchScreen) {
        console.log("Hiển thị màn hình chọn cơ sở.");
        branchScreen.style.display = 'flex';
        branchScreen.classList.remove('hidden'); // Bỏ class hidden
    }

    // 6. (Tùy chọn) Xóa hash khỏi URL để quay về trang mặc định sau khi chọn lại
    window.location.hash = "";
    hideAllManagementPages(); // Ẩn các section con trong app-layout

     // 7. Reset lại biến dữ liệu toàn cục để buộc tải lại khi chọn cơ sở mới
     allStudentsData = {};
     allClassesData = {};
     allAttendanceData = {};
     allPersonnelAttendanceData = {};
     // Reset các biến dữ liệu khác nếu có
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
    console.log(`Bắt đầu tải dữ liệu ban đầu cho cơ sở: ${selectedBranchId}...`); // Thêm log để biết đang tải cơ sở nào
    showLoading(true); // Hiển thị loading ở đây
    try {
        // --- THAY ĐỔI CÁCH GỌI Ở ĐÂY ---
        const [usersSnap, classesSnap, studentsSnap, attendanceSnap, personnelAttendanceSnap, homeworkScoresSnap /*, Thêm các Snap khác nếu cần */] = await Promise.all([
            database.ref(DB_PATHS.USERS).once('value'),               // Giữ nguyên vì users là chung
            getBranchRef(DB_PATHS.CLASSES).once('value'),             // Sử dụng getBranchRef
            getBranchRef(DB_PATHS.STUDENTS).once('value'),            // Sử dụng getBranchRef
            getBranchRef(DB_PATHS.ATTENDANCE).once('value'),          // Sử dụng getBranchRef
            getBranchRef(DB_PATHS.PERSONNEL_ATTENDANCE).once('value'), // Sử dụng getBranchRef
            getBranchRef(DB_PATHS.HOMEWORK_SCORES).once('value')      // Sử dụng getBranchRef
            // Thêm getBranchRef(...).once('value') cho các path khác trong DB_PATHS nếu bạn dùng chúng ở đây
        ]);
        // --- KẾT THÚC THAY ĐỔI ---

        // Gán dữ liệu vào các biến toàn cục (giữ nguyên)
        allUsersData = usersSnap.val() || {}; // users vẫn lấy từ gốc
        allClassesData = classesSnap.val() || {};
        allStudentsData = studentsSnap.val() || {};
        allAttendanceData = attendanceSnap.val() || {}; // Đảm bảo bạn có biến này
        allPersonnelAttendanceData = personnelAttendanceSnap.val() || {}; // Cần biến này nếu dùng
        allHomeworkScoresData = homeworkScoresSnap.val() || {}; // Cần biến này nếu dùng

        console.log("Tải dữ liệu ban đầu thành công!");

    } catch (error) {
        console.error("Lỗi nghiêm trọng khi tải dữ liệu ban đầu:", error);
        Swal.fire("Lỗi kết nối", `Không thể tải dữ liệu từ cơ sở ${selectedBranchId}. Vui lòng kiểm tra kết nối mạng và thử lại.`, "error");
        throw error; // Ném lỗi ra ngoài để hàm gọi nó biết và dừng lại
    } finally {
        showLoading(false); // Ẩn loading khi hoàn thành hoặc lỗi
    }
}
// Chuyển trang theo hash
async function showPageFromHash() {
    let hash = window.location.hash.slice(1) || 'dashboard';

    const role = currentUserData?.role;
    const isFullAccess = role === 'Admin' || role === 'Hội Đồng';
    const isAdmin = role === 'Admin';

    // Danh sách các trang bị hạn chế
    const restrictedPages = [
        'student-management', 'personnel-management', 
        'account-management', 'tuition-management', 'trash-management', 'code-management'
    ];
    
    // Kiểm tra quyền truy cập trang
    let hasAccess = true;
    if (restrictedPages.includes(hash) && !isFullAccess) hasAccess = false;
    if (hash === 'activity-log-page' && !isAdmin) hasAccess = false;

    // Nếu không có quyền, báo lỗi và chuyển về trang dashboard
    if (!hasAccess) {
        Swal.fire('Truy cập bị từ chối', 'Bạn không có quyền truy cập chức năng này.', 'error');
        hash = 'dashboard';
        window.location.hash = 'dashboard';
    }

    if (!pages.includes(hash)) {
        hash = 'dashboard';
        window.location.hash = 'dashboard';
    }
    
    pages.forEach(pageId => {
        const el = document.getElementById(pageId);
        if (el) el.style.display = "none";
    });

    const targetPage = document.getElementById(hash);
    if (targetPage) {
        targetPage.style.display = "block";
    }

    // Phần switch case để render nội dung trang giữ nguyên như cũ
    switch (hash) {
        case 'dashboard':
            renderDashboardCharts();
            break;
        case 'student-management':
            populateClassFilterDropdown();
            renderStudentList(allStudentsData);
            break;
        case 'class-management':
            showClassView('active');
            break;
         case 'new-schedule-page':
            renderNewSchedulePage();
            break;
        case 'personnel-management':
            initPersonnelManagement(); 
            break;
        case 'code-management':
           // đã dùng ListenerInitilized để kiểm tra
           renderCodeManagementPage();
            break;
        case 'account-management':
            renderAccountList();
            break;
        case 'tuition-management':
           renderTuitionView('', 'fee');
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

    // --- THÊM KIỂM TRA ---
    if (!selectedBranchId || !studentId) {
        Swal.fire("Lỗi", "Không thể xác định cơ sở hoặc học viên.", "error");
        return;
    }
    // --- KẾT THÚC KIỂM TRA ---

    showLoading(true);
    try {
        const snapshot = await getBranchRef(`${DB_PATHS.STUDENTS}/${studentId}`).once("value");
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

        // Reset phần học phí về 0 để nhập mới
        document.getElementById("student-original-price").value = 0;
        document.getElementById("student-total-due").value = 0;
        document.getElementById("student-discount-percent").value = 0;
        document.getElementById("student-promotion-percent").value = 0;
        // Không reset số buổi đã học/còn lại vì gia hạn là cộng thêm
         const sessionsAttended = studentData.sessionsAttended || 0;
         const totalSessionsPaid = studentData.totalSessionsPaid || 0;
         document.getElementById("student-total-attended-sessions").value = sessionsAttended;
         document.getElementById("student-remaining-sessions-display").value = totalSessionsPaid - sessionsAttended;

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

     // === PHẦN SỬA LỖI QUAN TRỌNG NHẤT NẰM Ở ĐÂY ===
    let basePrice = 0;
    const certType = document.getElementById('student-certificate-type').value;
    const courseName = document.getElementById('student-certificate-course').value;
    const selectedCourseData = (certType && certificateCourses[certType]) 
        ? certificateCourses[certType].find(c => c.name === courseName) 
        : null;

    // 1. Kiểm tra xem có phải là gói combo không
    if (selectedCourseData && selectedCourseData.selectionLimit > 0) {
        // Nếu LÀ combo, tính tổng giá từ các ô đã tick
        const checkedBoxes = document.querySelectorAll('#combo-checkboxes-list input:checked');
        checkedBoxes.forEach(box => {
            // Lấy giá từ thuộc tính 'data-price' mà chúng ta đã lưu trước đó
            basePrice += parseFloat(box.dataset.price) || 0;
        });
    } else {
        // Nếu KHÔNG phải combo, lấy giá như bình thường
        basePrice = coursePrices[courseNameForPriceLookup] || 0;
    }
    // === KẾT THÚC PHẦN SỬA LỖI ===

    originalPriceInput.value = Math.round(basePrice);
    let finalPrice = basePrice;
    
    // ======================================================================
    // === BƯỚC 1: TỰ ĐỘNG KHẤU TRỪ 20% (LOGIC MỚI) ===
    // ======================================================================
    const packageType = document.getElementById('student-package-type').value;
    const isChinese = courseNameForPriceLookup.includes("Tiếng Trung");
    const isSchoolSubject = packageType === 'Các môn trên trường';

    // Chỉ áp dụng khấu trừ nếu không phải Tiếng Trung hoặc Môn trên trường
    if (!isChinese && !isSchoolSubject) {
        finalPrice *= (1 - 20 / 100); // Tự động khấu trừ 20%
    }

    // ======================================================================
    // ======================================================================
    // === SỬA LỖI TÍNH TOÁN NẰM Ở ĐÂY ===
    // ======================================================================
    let packageDiscountPercent = 0;
    // THÊM ĐIỀU KIỆN: Chỉ giảm giá nếu là gói Combo TIẾNG ANH
    if (courseNameForPriceLookup.includes("3X") && courseNameForPriceLookup.includes("Tiếng Anh") && courseNameForPriceLookup.includes("THPT")) packageDiscountPercent = 5;
    else if (courseNameForPriceLookup.includes("6X") && courseNameForPriceLookup.includes("Tiếng Anh") && courseNameForPriceLookup.includes("THPT")) packageDiscountPercent = 7;
    else if (courseNameForPriceLookup.includes("12X") && courseNameForPriceLookup.includes("Tiếng Anh") && courseNameForPriceLookup.includes("THPT")) packageDiscountPercent = 10;
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
// PHIÊN BẢN HOÀN CHỈNH - THAY THẾ TOÀN BỘ HÀM CŨ
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

     const canEdit = currentUserData && (
        currentUserData.role === "Admin" || 
        currentUserData.role === "Hội Đồng" || 
        currentUserData.role === "Giáo Viên" || 
        currentUserData.role === "Trợ Giảng"
    );

    currentPageStudents.forEach(([id, st]) => {
        let actionButtonsHTML = '';
        const activeClassId = findActiveStudentClassId(id, st);
        
        actionButtonsHTML = `
            <button onclick="editStudent('${id}')">Sửa</button>
            <button onclick="viewStudentSessions('${id}', '${activeClassId || ''}')" ${!activeClassId ? 'disabled' : ''}>Buổi học</button>
            <button onclick="showRenewPackageForm('${id}')">Gia hạn</button>
        `;
        if(canEdit) {
             actionButtonsHTML += `<button class="delete-btn" onclick="deleteStudent('${id}')">Xóa</button>`;
        } else {
             const permissionAlert = "Swal.fire('Thẩm quyền', 'Bạn không có quyền thực hiện hành động này.', 'warning')";
             actionButtonsHTML = `
                <button onclick="${permissionAlert}">Sửa</button>
                <button onclick="${permissionAlert}">Buổi học</button>
                <button onclick="${permissionAlert}">Gia hạn</button>
                <button class="delete-btn" onclick="${permissionAlert}">Xóa</button>
             `;
        }

        const query = document.getElementById("student-search")?.value.toLowerCase() || "";
        const highlight = (text) => {
            if (!query || !text) return text;
            try {
                const regex = new RegExp(`(${query})`, "gi");
                return text.replace(regex, '<mark>$1</mark>');
            } catch (e) { return text; }
        };
        
        const isHighlight = query && (
            (st.name || "").toLowerCase().includes(query) ||
            (st.phone || "").toLowerCase().includes(query) ||
            (st.parentPhone || "").toLowerCase().includes(query) ||
            (st.parentJob || "").toLowerCase().includes(query) ||
            (st.package || "").toLowerCase().includes(query)
        );

        const remainingSessions = (st.totalSessionsPaid || 0) - (st.sessionsAttended || 0);
        let warningClass = '';
        let iconHtml = '';
        if (remainingSessions <= 0) {
            warningClass = 'student-warning-critical';
        } else if (remainingSessions <= 3) {
            warningClass = 'student-warning-low';
            iconHtml = '<span class="warning-icon">&#9888;</span> ';
        }
        
        // Logic cho ô sửa ngày bắt đầu chu kì
        let cycleStartDateCellHTML = st.cycleStartDate || "";
        if (canEdit) {
            cycleStartDateCellHTML = `
                <input 
                    type="date" 
                    class="inline-date-editor" 
                    value="${st.cycleStartDate || ''}" 
                    onchange="updateCycleStartDate('${id}', this.value)"
                >`;
        }
        
        // Logic cho ô thanh toán gói hiện tại
        let tuitionCellHTML = `<td data-label="Thanh Toán Gói Hiện Tại" class="tuition-cycle-cell">---</td>`;
        let currentCycle = (st.tuitionCycles && st.tuitionCycles.length > 0) ? st.tuitionCycles[st.tuitionCycles.length - 1] : null;

        if (!currentCycle && st.package) {
            currentCycle = { cycleId: 'new_cycle', isPaid: false };
        }
        
        if (currentCycle) {
            const isChecked = currentCycle.isPaid ? 'checked' : '';
            const isDisabled = !canEdit ? 'disabled' : '';
            tuitionCellHTML = `
                <td data-label="Thanh Toán Gói Hiện Tại" class="tuition-cycle-cell">
                    <a href="#" class="tuition-history-link" onclick="event.preventDefault(); showTuitionCycleHistory('${id}')">Xem lịch sử</a>
                    <input 
                        type="checkbox" 
                        ${isChecked} 
                        ${isDisabled}
                        onchange="toggleTuitionCyclePaid('${id}', '${currentCycle.cycleId}', this.checked)">
                </td>
            `;
        }
        
        // Logic cho ô thông báo Zalo/Phone
        const notificationStatus = st.notificationStatus || {};
        const notificationCellHTML = `
            <div class="notification-cell">
                <label title="Đã liên hệ qua Zalo"><img src="icons/zalo.svg" alt="Zalo" class="table-icon"><input type="checkbox" onchange="updateNotificationStatus('${id}', 'zalo', this.checked)" ${notificationStatus.zalo ? 'checked' : ''}></label>
                <label title="Đã gọi điện"><img src="icons/phone.svg" alt="Phone" class="table-icon"><input type="checkbox" class="phone-checkbox" onchange="updateNotificationStatus('${id}', 'phone', this.checked)" ${notificationStatus.phone ? 'checked' : ''}></label>
            </div>
        `;

        const row = `
            <tr class="${isHighlight ? 'highlight-row' : ''}">
                <td data-label="Họ và tên" class="${warningClass}">${iconHtml}${highlight(st.name || "")}</td>
                <td data-label="Năm sinh">${st.dob || ""}</td>

                <!-- === DỮ LIỆU CỦA 2 CỘT MỚI === -->
                <td data-label="Tên Phụ Huynh">${highlight(st.parent || "")}</td>
                <td data-label="SĐT">${highlight(st.parentPhone || "")}</td>
                <!-- === KẾT THÚC PHẦN THÊM === -->

                <td data-label="Ngày bắt đầu chu kì">${cycleStartDateCellHTML}</td>
                <td data-label="Gói đăng ký">${highlight(st.package || "")}</td>
                <td data-label="Ngày tạo">${formatTimestamp(st.createdAt)}</td>
                <td data-label="Ngày sửa đổi">${formatTimestamp(st.updatedAt)}</td>
                ${tuitionCellHTML}
                <td data-label="Số buổi đã học" class="td-sessions-attended">${st.sessionsAttended || 0}</td>
                <td data-label="Buổi còn lại" class="td-sessions-remaining">${remainingSessions}</td>
                <td data-label="Thông báo">${notificationCellHTML}</td>
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
    getBranchRef(DB_PATHS.STUDENTS).on("value", snapshot => {
        // Cập nhật dữ liệu học viên mới nhất
        allStudentsData = snapshot.val() || {};
        
        // Thay vì vẽ lại toàn bộ, hãy gọi hàm lọc chính.
        // Hàm này sẽ tự động đọc trạng thái các bộ lọc và vẽ lại danh sách đã được lọc.
        applyStudentFilters(); 
        
        // Cập nhật lại biểu đồ trên dashboard nếu cần
        renderDashboardCharts();
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
    const zaloFilter = document.getElementById('student-filter-zalo').value;
    const phoneFilter = document.getElementById('student-filter-phone').value;

    let filteredStudents = Object.entries(allStudentsData)
        .filter(([, st]) => st.status !== 'deleted');

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

    if (zaloFilter) {
        filteredStudents = filteredStudents.filter(([, st]) => {
            const status = st.notificationStatus?.zalo || false;
            return zaloFilter === 'yes' ? status === true : status === false;
        });
    }
    if (phoneFilter) {
        filteredStudents = filteredStudents.filter(([, st]) => {
            const status = st.notificationStatus?.phone || false;
            return phoneFilter === 'yes' ? status === true : status === false;
        });
    }

    if (studentSortState.direction !== 'none') {
        const { key, direction } = studentSortState;
        filteredStudents.sort(([, a], [, b]) => {
            const valA = a[key] || 0;
            const valB = b[key] || 0;
            return direction === 'asc' ? valA - valB : valB - valA;
        });
    }
  
    updateSortIcons();
  
    const finalFilteredData = Object.fromEntries(filteredStudents);
    currentStudentPage = 1; 
    renderStudentList(finalFilteredData);
}

// THAY THẾ HOÀN TOÀN HÀM resetStudentFilters CŨ
function resetStudentFilters() {
    document.getElementById('student-search').value = '';
    document.getElementById('student-filter-class').value = '';
    document.getElementById('student-filter-zalo').value = '';
    document.getElementById('student-filter-phone').value = '';
  
    studentSortState.key = null;
    studentSortState.direction = 'none';
  
    applyStudentFilters();
}
// Lưu hoặc cập nhật học viên
async function saveStudent() {
    const user = auth.currentUser;
    if (!user) {
        Swal.fire("Lỗi", "Vui lòng đăng nhập để thêm hoặc sửa học viên!", "error");
        return;
    }
// Thêm kiểm tra selectedBranchId
    if (!selectedBranchId) {
        Swal.fire("Lỗi", "Chưa chọn cơ sở làm việc.", "error");
        return;
    }

    const id = document.getElementById("student-index").value;
    // Lấy dữ liệu hiện có TỪ CHI NHÁNH HIỆN TẠI
    const existingData = id ? (allStudentsData[id] || {}) : {};
    const isRenewing = document.getElementById("student-form-title").textContent.includes("Gia hạn");
    
    let studentNameForLog = '';
    const newPackageName = document.getElementById("student-package").value.trim();

    const studentData = {
        package: newPackageName,
        discountPercent: parseInt(document.getElementById("student-discount-percent").value) || 0,
        promotionPercent: parseInt(document.getElementById("student-promotion-percent").value) || 0,
        originalPrice: parseInt(document.getElementById("student-original-price").value) || 0,
        totalDue: parseInt(document.getElementById("student-total-due").value) || 0,
        totalBookFeeDue: parseInt(document.getElementById("student-book-fee-due").value) || 0,
       // cycleStartDate: document.getElementById("student-cycle-start-date").value,
        updatedAt: firebase.database.ServerValue.TIMESTAMP
    };

    // === LOGIC PHÂN BIỆT SỬA VÀ GIA HẠN ĐƯỢC THÊM LẠI ===
    if (!isRenewing) {
        // Nếu là Tạo mới hoặc Sửa thông tin, đọc dữ liệu từ form
        const name = document.getElementById("student-name").value.trim();
        if (!name) {
            Swal.fire("Lỗi", "Vui lòng nhập Tên học viên.", "error");
            return;
        }
        studentNameForLog = name;
        studentData.name = name;
        studentData.dob = document.getElementById("student-dob").value.trim();
        studentData.address = document.getElementById("student-address").value.trim();
        studentData.phone = document.getElementById("student-phone")?.value.trim() || "";
        studentData.parent = document.getElementById("student-parent")?.value.trim() || "";
        studentData.parentPhone = document.getElementById("student-parent-phone")?.value.trim() || "";
        studentData.parentJob = document.getElementById("student-parent-job").value === 'Khác'
            ? document.getElementById("student-parent-job-other").value.trim()
            : document.getElementById("student-parent-job").value;
    } else {
        // Nếu là Gia hạn, sao chép lại thông tin cá nhân cũ để tránh bị xóa
        studentNameForLog = existingData.name || '';
        ['name', 'dob', 'address', 'phone', 'parent', 'parentPhone', 'parentJob', 'cycleStartDate'].forEach(key => {
            studentData[key] = existingData[key] || "";
        });
    }
    // === KẾT THÚC LOGIC PHÂN BIỆT ===

    // Xử lý logic chu kỳ học phí
    let tuitionCycles = existingData.tuitionCycles || [];
    const lastCycle = tuitionCycles.length > 0 ? tuitionCycles[tuitionCycles.length - 1] : null;

    if (newPackageName && (!lastCycle || lastCycle.packageName !== newPackageName)) {
        const newCycle = {
            cycleId: `cycle_${Date.now()}`,
            packageName: newPackageName,
            renewalDate: new Date().toISOString().split("T")[0],
            isPaid: false,
            paidDate: null
        };
        tuitionCycles.push(newCycle);
    }
    studentData.tuitionCycles = tuitionCycles;

    // Xử lý số buổi học
    const newPackageSessions = parseInt(document.getElementById("student-new-package-sessions").value) || 0;
    if (id) { // Nếu là sửa hoặc gia hạn
        studentData.sessionsAttended = existingData.sessionsAttended || 0;
        studentData.createdAt = existingData.createdAt;
        studentData.totalSessionsPaid = isRenewing 
            ? (existingData.totalSessionsPaid || 0) + newPackageSessions 
            : (newPackageSessions > 0 ? newPackageSessions : (existingData.totalSessionsPaid || 0));
    } else { // Nếu là tạo mới
        studentData.createdAt = firebase.database.ServerValue.TIMESTAMP;
        studentData.sessionsAttended = 0;
        studentData.totalSessionsPaid = newPackageSessions;
    }
  
   // === PHẦN THAY ĐỔI QUAN TRỌNG NHẤT ===
    try {
        showLoading(true); // Hiển thị loading trước khi ghi DB
        if (id) {
            // Sửa: Dùng getBranchRef để lấy đường dẫn tới học viên cụ thể
            await getBranchRef(`${DB_PATHS.STUDENTS}/${id}`).update(studentData);
            await logActivity(`Đã cập nhật/gia hạn cho học viên: "${studentNameForLog}" tại cơ sở ${selectedBranchId}`);
            Swal.fire({ icon: 'success', title: 'Đã cập nhật!', timer: 2000, showConfirmButton: false });
        } else {
            // Thêm mới: Dùng getBranchRef để lấy đường dẫn tới node students
            await getBranchRef(DB_PATHS.STUDENTS).push(studentData);
            await logActivity(`Đã tạo hồ sơ học viên mới: "${studentNameForLog}" tại cơ sở ${selectedBranchId}`);
            Swal.fire({ icon: 'success', title: 'Đã thêm!', timer: 2000, showConfirmButton: false });
        }
        hideStudentForm();
    } catch (error) {
        console.error("Lỗi lưu học viên:", error); // Log lỗi chi tiết
        Swal.fire("Lỗi", "Lỗi lưu học viên: " + error.message, "error");
    } finally {
        showLoading(false); // Ẩn loading sau khi hoàn thành hoặc lỗi
    }
    // === KẾT THÚC THAY ĐỔI ===
}
// Xóa học viên
async function deleteStudent(id) {
    // Thêm kiểm tra selectedBranchId
    if (!selectedBranchId) {
        Swal.fire("Lỗi", "Chưa chọn cơ sở làm việc.", "error");
        return;
    }
     // Thêm kiểm tra id
     if (!id) {
        Swal.fire("Lỗi", "Không xác định được học viên cần xóa.", "error");
        return;
    }
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
            // Lấy tên học viên TỪ CHI NHÁNH HIỆN TẠI
            const studentName = allStudentsData[id]?.name || 'Không rõ tên';

            // --- THAY ĐỔI Ở ĐÂY ---
            // Sử dụng getBranchRef để trỏ đến học viên cần xóa mềm
            await getBranchRef(`${DB_PATHS.STUDENTS}/${id}`).update({
            // --- KẾT THÚC THAY ĐỔI ---
                status: 'deleted',
                deletedAt: firebase.database.ServerValue.TIMESTAMP
            });

            // Thêm cơ sở vào log
            await logActivity(`Đã chuyển học viên vào thùng rác: ${studentName} tại cơ sở ${selectedBranchId}`);

            Swal.fire('Đã chuyển!', 'Học viên đã được chuyển vào thùng rác.', 'success');
            // Listener sẽ tự động cập nhật lại danh sách

        } catch (error) {
            console.error("Lỗi khi chuyển học viên vào thùng rác:", error); // Log lỗi chi tiết
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

    // --- THÊM KIỂM TRA ---
    if (!selectedBranchId || !id) {
        Swal.fire("Lỗi", "Không thể xác định cơ sở hoặc học viên.", "error");
        return;
    }
    // --- KẾT THÚC KIỂM TRA ---

    showLoading(true);
    try {
        const snapshot = await getBranchRef(`${DB_PATHS.STUDENTS}/${id}`).once("value");
        const st = snapshot.val();
        if (!st) throw new Error("Không tìm thấy học viên.");

        showStudentForm();
        
        document.getElementById("student-form-title").textContent = "Chỉnh sửa học viên";
        document.getElementById("student-index").value = id;

        document.getElementById("student-name").value = st.name || "";
        document.getElementById("student-dob").value = st.dob || "";
        document.getElementById("student-address").value = st.address || "";
       // document.getElementById("student-cycle-start-date").value = st.cycleStartDate || "";

        handleAgeChange();
        setTimeout(() => {
            if (document.getElementById("student-phone")) document.getElementById("student-phone").value = st.phone || "";
            if (document.getElementById("student-parent")) document.getElementById("student-parent").value = st.parent || "";
            if (document.getElementById("student-parent-phone")) document.getElementById("student-parent-phone").value = st.parentPhone || "";
        }, 50);

        // Điền thông tin nghề nghiệp
        const parentJobSelect = document.getElementById("student-parent-job");
        const otherJobInput = document.getElementById("student-parent-job-other");
        parentJobSelect.value = st.parentJob || "";
        // Kiểm tra xem giá trị có phải là "Khác" không
        let isOtherJob = true;
        for (let i = 0; i < parentJobSelect.options.length; i++) {
            if (parentJobSelect.options[i].value === st.parentJob) {
                isOtherJob = false;
                break;
            }
        }
        if (st.parentJob && isOtherJob) {
             parentJobSelect.value = "Khác"; // Set dropdown thành "Khác"
             otherJobInput.value = st.parentJob; // Điền giá trị vào ô text
             otherJobInput.style.display = "inline-block";
        } else {
             otherJobInput.style.display = "none";
        }

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

    // === THAY ĐỔI NẰM Ở ĐÂY ===
    // Bây giờ, tất cả các vai trò được phép vào trang này (Admin, Hội Đồng, GV, TG)
    // đều sẽ xem được toàn bộ danh sách lớp học.
    // Việc phân quyền (ai được sửa/xóa) sẽ nằm ở phần tạo nút hành động.
    let classesToRender = allClassesData; 
    // === KẾT THÚC THAY ĐỔI ===
    
    // Phần lọc theo trạng thái (active/completed) giữ nguyên
    const filteredClasses = Object.entries(classesToRender).filter(([, cls]) => {
        // Loại bỏ các lớp đã bị xóa mềm (status === 'deleted')
        if (cls.status === 'deleted') return false; 
        
        const isActive = !cls.status || cls.status === 'active';
        return currentClassView === 'active' ? isActive : cls.status === 'completed';
    });

    if (filteredClasses.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4">Không có lớp học nào trong mục này.</td></tr>`;
        return;
    }

    filteredClasses.sort(([, a], [, b]) => (a.name || "").localeCompare(b.name || ""));

    // === PHẦN PHÂN QUYỀN CHO NÚT BẤM ===
    const canManageClass = currentUserData && (currentUserData.role === 'Admin' || currentUserData.role === 'Hội Đồng');

    filteredClasses.forEach(([id, cls]) => {
        let actionButtonsHTML = '';
        
        // Nút Điểm Danh/Xem Điểm Danh luôn hiển thị cho mọi vai trò được phép vào trang
        const attendanceButtonText = currentClassView === 'active' ? 'Điểm Danh' : 'Xem Điểm danh';
        actionButtonsHTML += `<button onclick="promptForAttendancePassword('${id}')">${attendanceButtonText}</button>`;

        // Chỉ Admin/Hội Đồng mới có các nút quản lý khác
        if (canManageClass) {
            if (currentClassView === 'active') {
                actionButtonsHTML += `
                    <button onclick="editClass('${id}')">Sửa</button>
                    <button class="btn-restore" onclick="markClassAsCompleted('${id}')">Hoàn thành</button>
                    <button class="delete-btn" onclick="deleteClass('${id}')">Xóa</button>
                `;
            } else { // Lớp đã hoàn thành
                actionButtonsHTML += `
                    <button onclick="editOfficialClass('${id}', true)">Xem Thông tin</button>
                    <button onclick="restoreClassFromCompleted('${id}')">Khôi phục</button>
                    <button class="delete-btn" onclick="deleteClass('${id}')">Xóa</button>
                `;
            }
        } else {
             // Giáo viên/Trợ giảng chỉ có thể xem thông tin lớp đã hoàn thành
             if (currentClassView === 'completed') {
                 actionButtonsHTML += `<button onclick="editOfficialClass('${id}', true)">Xem Thông tin</button>`;
             }
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
 * HÀM CẬP NHẬT: Tìm ID lớp hiện tại của học viên dựa vào ngày điểm danh gần nhất.
 */
function findActiveStudentClassId(studentId, studentData) {
    if (!studentData || !studentData.classes) {
        return null;
    }

    const classIds = Object.keys(studentData.classes);
    let latestDate = '1970-01-01'; // Một ngày trong quá khứ rất xa
    let mostRecentClassId = null;

    const validClasses = classIds.filter(classId => {
        const classData = allClassesData[classId];
        return classData && classData.status !== 'deleted';
    });

    if (validClasses.length === 0) return null;
    if (validClasses.length === 1) return validClasses[0];
    
    // Mặc định gán lớp hợp lệ đầu tiên làm kết quả tạm thời
    mostRecentClassId = validClasses[0];

    validClasses.forEach(classId => {
        const attendanceRecords = allAttendanceData[classId]?.[studentId];
        if (!attendanceRecords) {
            return; // Bỏ qua nếu lớp này không có dữ liệu điểm danh
        }

        const lastDateInClass = Object.keys(attendanceRecords).sort().pop();

        if (lastDateInClass && lastDateInClass > latestDate) {
            latestDate = lastDateInClass;
            mostRecentClassId = classId;
        }
    });

    return mostRecentClassId;
}
/**
 * Điền vào ô lựa chọn giáo viên trong form lớp học
 */
async function populateTeacherDropdown() {
  const teacherSelect = document.getElementById("class-teacher");
  teacherSelect.innerHTML = '<option value="">-- Chọn giáo viên --</option>';
  try {
    const snapshot = await database.ref(DB_PATHS.PERSONNEL_CODES).once("value");
    const personnel = snapshot.val() || {};
    Object.values(personnel).forEach(p => {
        if (p.name) { // Chỉ thêm nếu có tên
            const option = document.createElement("option");
            option.value = p.name;
            option.textContent = p.name;
            teacherSelect.appendChild(option);
        }
    });
  } catch (error) { console.error("Lỗi tải danh sách giáo viên:", error); }
}
async function populateAssistantTeacherDropdown() {
    const assistantSelect = document.getElementById("class-assistant-teacher");
    assistantSelect.innerHTML = '<option value="">-- Không có trợ giảng --</option>';
    try {
        const snapshot = await database.ref(DB_PATHS.PERSONNEL_CODES).once("value");
        const personnel = snapshot.val() || {};
        Object.values(personnel).forEach(p => {
            if (p.name) { // Chỉ thêm nếu có tên
                const option = document.createElement("option");
                option.value = p.name;
                option.textContent = p.name;
                assistantSelect.appendChild(option);
            }
        });
    } catch (error) { console.error("Lỗi tải danh sách trợ giảng:", error); }
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

    // --- THÊM KIỂM TRA ---
    if (!selectedBranchId || !id) {
        Swal.fire("Lỗi", "Không thể xác định cơ sở hoặc lớp học.", "error");
        return;
    }
    // --- KẾT THÚC KIỂM TRA ---

    showLoading(true);
    document.getElementById("class-form-modal").style.display = "flex";
    document.getElementById("class-form-title").textContent = isReadOnly ? "Xem thông tin lớp học" : "Chỉnh sửa lớp học";

    try {
        // --- THAY ĐỔI Ở ĐÂY: Sử dụng getBranchRef để đọc dữ liệu lớp ---
        const snapshot = await getBranchRef(`${DB_PATHS.CLASSES}/${id}`).once("value");
        // --- KẾT THÚC THAY ĐỔI ---

        const cls = snapshot.val();
        if (!cls) throw new Error("Lớp học không tồn tại trong cơ sở này!");

        // Phần còn lại của hàm (điền dữ liệu vào form, xử lý readonly,...) giữ nguyên
        document.getElementById("class-index").value = id;
        document.getElementById("class-name").value = cls.name || "";
        // ... (điền các trường khác: startDate, room, teacher, assistantTeacher, classType, ...) ...
        document.getElementById("class-start-date").value = cls.startDate || "";
        document.getElementById("class-room").value = cls.room || "Phòng 301";

        // Cần gọi populate dropdowns trước khi set value
        await populateTeacherDropdown(); // Đảm bảo hàm này lấy đúng danh sách chung
        await populateAssistantTeacherDropdown(); // Đảm bảo hàm này lấy đúng danh sách chung

        document.getElementById("class-teacher").value = cls.teacher || "";
        document.getElementById("class-assistant-teacher").value = cls.assistantTeacher || "";

        const classTypeSelect = document.getElementById('class-type-select');
        classTypeSelect.value = cls.classType || "";
        handleClassTypeChange(); // Gọi để hiện/ẩn phần chứng chỉ

        // Xử lý điền dropdown chứng chỉ (nếu có)
        if (cls.classType === 'Lớp chứng chỉ' && cls.certificateType) {
             setTimeout(() => { // Dùng timeout nhỏ để đảm bảo dropdown loại chứng chỉ đã được điền
                 const certTypeSelect = document.getElementById('class-certificate-type-select');
                 certTypeSelect.value = cls.certificateType;
                 populateClassCertificateCourseDropdown(); // Điền khóa học theo loại chứng chỉ

                 setTimeout(() => { // Timeout nhỏ nữa để đảm bảo dropdown khóa học đã được điền
                     const courseSelect = document.getElementById('class-course-select');
                     courseSelect.value = cls.courseName || "";
                 }, 50); // Có thể cần điều chỉnh thời gian
             }, 50);
        }


        // Cập nhật danh sách học viên hiện tại và render (cần đảm bảo allStudentsData đã load đúng)
        await updateStudentOptionsForClassForm(); // Hàm này cần đọc students từ đúng nhánh
        currentClassStudents = cls.students ? Object.keys(cls.students) : [];
        renderClassStudentList(currentClassStudents);

        // Điền lịch học cố định
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
async function updateStudentOptionsForClassForm() { // Chuyển thành async
    // --- THÊM KIỂM TRA ---
    if (!selectedBranchId) { return; } // Không làm gì nếu chưa chọn cơ sở
    // --- KẾT THÚC KIỂM TRA ---
    try { // Thêm try...catch
        // --- THAY ĐỔI: Sử dụng getBranchRef ---
        const snapshot = await getBranchRef(DB_PATHS.STUDENTS).once("value");
        // --- KẾT THÚC THAY ĐỔI ---

        // Cập nhật lại biến toàn cục allStudentsData cho cơ sở hiện tại
        allStudentsData = snapshot.val() || {};

        const datalist = document.getElementById("class-add-student-datalist");
        if (!datalist) return; // Kiểm tra nếu datalist tồn tại
        datalist.innerHTML = "";

        // Sắp xếp học viên theo tên trước khi thêm vào datalist
        const sortedStudents = Object.entries(allStudentsData)
                                .filter(([, st]) => st.status !== 'deleted') // Lọc học viên đã xóa
                                .sort(([, a], [, b]) => (a.name || "").localeCompare(b.name || ""));

        sortedStudents.forEach(([id, st]) => {
            const option = document.createElement("option");
            option.value = st.name || "(Không rõ tên)";
            option.dataset.id = id;
            datalist.appendChild(option);
        });
    } catch (error) {
         console.error("Lỗi khi cập nhật danh sách học viên cho form lớp:", error);
         // Có thể thông báo lỗi nếu cần
    }
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

    if (!selectedBranchId) {
        Swal.fire("Lỗi", "Chưa chọn cơ sở làm việc.", "error");
        return;
    }

    showLoading(true);

    const classId = document.getElementById("class-index").value;
    const teacherSelect = document.getElementById("class-teacher");
    const assistantTeacherSelect = document.getElementById("class-assistant-teacher");

    const classDataFromForm = {
        name: document.getElementById("class-name").value.trim(),
        classType: document.getElementById('class-type-select').value,
        certificateType: document.getElementById('class-certificate-type-select').value,
        courseName: document.getElementById('class-course-select').value,
        teacher: teacherSelect.value, 
     //   teacherUid: teacherSelect.options[teacherSelect.selectedIndex]?.dataset.uid || '',
        assistantTeacher: assistantTeacherSelect.value,
     //   assistantTeacherUid: assistantTeacherSelect.value ? assistantTeacherSelect.options[assistantTeacherSelect.selectedIndex]?.dataset.uid : '',
        room: document.getElementById("class-room").value,
        startDate: document.getElementById("class-start-date").value,
        updatedAt: firebase.database.ServerValue.TIMESTAMP,
        status: 'active'
    };

    // LOGIC DỌN DẸP: Nếu không phải lớp chứng chỉ, hãy đảm bảo các trường liên quan bị xóa.
    if (classDataFromForm.classType !== 'Lớp chứng chỉ') {
        classDataFromForm.certificateType = null;
        classDataFromForm.courseName = null;
    }

    const newStudentsObject = {};
    currentClassStudents.forEach(studentId => {
        newStudentsObject[studentId] = {
            enrolledAt: firebase.database.ServerValue.TIMESTAMP
        };
    });
  //  classData.students = newStudentsObject;

    try {
        if (classId) {
            // --- TRƯỜNG HỢP SỬA LỚP ---

            const updates = {};
            // Lấy dữ liệu CŨ từ biến toàn cục
            const oldClassData = (allClassesData && allClassesData[classId]) ? allClassesData[classId] : null;

            if (!oldClassData) {
                 throw new Error("Không tìm thấy dữ liệu lớp học gốc để cập nhật.");
            }
            const oldStudentIds = oldClassData.students ? Object.keys(oldClassData.students) : [];

            // Gộp dữ liệu cũ và mới để tạo đối tượng cuối cùng
            const finalClassData = {
                ...oldClassData,         // 1. Lấy nền là dữ liệu cũ (giữ createdAt, startDate, fixedSchedule, sessions, exams,...)
                ...classDataFromForm,    // 2. Ghi đè bằng dữ liệu mới từ form (name, teacher, classType,...)
                students: newStudentsObject, // 3. Ghi đè bằng danh sách học viên mới nhất

                // 4. Đảm bảo các trường object/array không bị 'undefined' nếu chưa từng tồn tại
                fixedSchedule: oldClassData.fixedSchedule || null,
                sessions: oldClassData.sessions || null,
                exams: oldClassData.exams || null,
                bookDrives: oldClassData.bookDrives || null,
                currentBookDriveId: oldClassData.currentBookDriveId || null,
                teacherSalary: oldClassData.teacherSalary || 0,
                assistantTeacherSalary: oldClassData.assistantTeacherSalary || 0
            };
            // Đường dẫn cập nhật lớp
            updates[`/branches/${selectedBranchId}/${DB_PATHS.CLASSES}/${classId}`] = finalClassData;

            // Cập nhật liên kết học viên (đường dẫn đã sửa ở bước trước)
            const studentBasePath = `branches/${selectedBranchId}/${DB_PATHS.STUDENTS}`;
            const addedStudents = currentClassStudents.filter(id => !oldStudentIds.includes(id));
            addedStudents.forEach(studentId => {
                updates[`/${studentBasePath}/${studentId}/classes/${classId}`] = true;
            });
            const removedStudents = oldStudentIds.filter(id => !currentClassStudents.includes(id));
            removedStudents.forEach(studentId => {
                updates[`/${studentBasePath}/${studentId}/classes/${classId}`] = null;
            });

            // Thực hiện cập nhật hàng loạt
            await database.ref().update(updates);
            await logActivity(`Đã cập nhật lớp học: ${finalClassData.name} tại cơ sở ${selectedBranchId}`);
            Swal.fire({ icon: 'success', title: 'Đã cập nhật lớp học!', timer: 2000, showConfirmButton: false });
        } else {
            // --- TRƯỜNG HỢP TẠO LỚP MỚI ---
            const fixedSchedule = getFixedScheduleFromForm();
            if (Object.keys(fixedSchedule).length === 0) { throw new Error("Lớp mới phải có lịch học cố định."); }

            // Tạo dữ liệu lớp hoàn chỉnh để push
            const newClassData = {
                ...classDataFromForm, // Dữ liệu từ form
                startDate: document.getElementById("class-start-date").value, // Lấy startDate khi tạo mới
                fixedSchedule: fixedSchedule,
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                students: newStudentsObject, // Danh sách học viên ban đầu
                // Khởi tạo các trường khác là null hoặc giá trị mặc định
                sessions: null, // Sẽ được tạo sau
                exams: null,
                teacherSalary: 0,
                assistantTeacherSalary: 0,
                bookDrives: null,
                currentBookDriveId: null
            };
            
            // Tính toán số buổi và tạo sessions
            let sessionCount = 0;
            if (newClassData.classType === 'Lớp chứng chỉ') {
                 sessionCount = certificateCourses[newClassData.certificateType]?.find(c => c.name === newClassData.courseName)?.sessions || 0;
                 if (sessionCount <= 0) { throw new Error("Không thể xác định số buổi học cho khóa chứng chỉ."); }
            } else {
                 // Lớp Phổ thông hoặc Môn trường -> tạo 24 buổi ban đầu (ví dụ)
                 sessionCount = 24;
            }

            if(sessionCount > 0) {
                newClassData.sessions = generateRollingSessions(newClassData.startDate, sessionCount, fixedSchedule);
            }
            
            // Chuẩn bị cập nhật hàng loạt
            const updates = {};
            const newClassRef = getBranchRef(DB_PATHS.CLASSES).push();
            const newClassId = newClassRef.key;
            updates[`/branches/${selectedBranchId}/${DB_PATHS.CLASSES}/${newClassId}`] = newClassData;

            // Cập nhật liên kết học viên
            const studentBasePath = `branches/${selectedBranchId}/${DB_PATHS.STUDENTS}`;
            currentClassStudents.forEach(studentId => {
                updates[`/${studentBasePath}/${studentId}/classes/${newClassId}`] = true;
            });

            // Thực hiện cập nhật
            await database.ref().update(updates);
            await logActivity(`Đã tạo lớp học mới: ${newClassData.name} tại cơ sở ${selectedBranchId}`);
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

    // --- THÊM KIỂM TRA ---
    if (!selectedBranchId) {
        Swal.fire("Lỗi", "Chưa chọn cơ sở làm việc.", "error");
        return;
    }
    if (!id) {
        Swal.fire("Lỗi", "Không xác định được lớp học cần xóa.", "error");
        return;
    }
    // --- KẾT THÚC THÊM KIỂM TRA ---

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
            // Lấy tên lớp TỪ CHI NHÁNH HIỆN TẠI
            const className = allClassesData[id]?.name || 'Không rõ tên';

            // --- THAY ĐỔI Ở ĐÂY ---
            // Sử dụng getBranchRef để trỏ đến lớp cần xóa mềm
            await getBranchRef(`${DB_PATHS.CLASSES}/${id}`).update({
            // --- KẾT THÚC THAY ĐỔI ---
                status: 'deleted',
                deletedAt: firebase.database.ServerValue.TIMESTAMP
                // Không cần xóa học viên khỏi lớp khi chỉ chuyển vào thùng rác
            });

            // Thêm cơ sở vào log
            await logActivity(`Đã chuyển lớp vào thùng rác: ${className} tại cơ sở ${selectedBranchId}`);

            Swal.fire('Đã chuyển!', 'Lớp học đã được chuyển vào thùng rác.', 'success');
            // Listener sẽ tự động cập nhật danh sách lớp

        } catch (error) {
            console.error("Lỗi khi chuyển lớp vào thùng rác:", error); // Log lỗi chi tiết
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
  getBranchRef(DB_PATHS.CLASSES).on("value", snapshot => {
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

    // --- THÊM KIỂM TRA ---
    if (!selectedBranchId) {
        Swal.fire("Lỗi", "Chưa chọn cơ sở làm việc.", "error");
        return;
    }
    if (!classId) {
         Swal.fire("Lỗi", "Không xác định được lớp học.", "error");
         return;
    }
    // --- KẾT THÚC KIỂM TRA ---

    showLoading(true);
    document.getElementById("personnel-classes-section").style.display = "none";
    document.getElementById("personnel-staff-section").style.display = "none";
    document.querySelector('.personnel-controls').style.display = 'none';
    document.getElementById("current-personnel-class-name").textContent = className;

    try {
        // --- THAY ĐỔI: Sử dụng getBranchRef ---
        const classSnap = await getBranchRef(`${DB_PATHS.CLASSES}/${classId}`).once("value");
        // --- KẾT THÚC THAY ĐỔI ---
        const cls = classSnap.val();
        if (!cls) throw new Error("Không tìm thấy dữ liệu lớp học.");

        const sessions = cls.sessions || {};
        const sortedSessionDates = Object.keys(sessions).sort();

        let classStaff = [];
        const isAdminOrHoiDong = currentUserData?.role === "Admin" || currentUserData?.role === "Hội Đồng";
        const currentUid = currentUserData?.uid;

        // Lấy thông tin nhân sự từ allUsersData (chung)
        if (cls.teacherUid && allUsersData[cls.teacherUid]) {
            if (isAdminOrHoiDong || cls.teacherUid === currentUid) {
                classStaff.push({ uid: cls.teacherUid, name: allUsersData[cls.teacherUid]?.name || cls.teacher, role: "Giáo Viên" }); // Lấy tên từ allUsersData
            }
        }
        if (cls.assistantTeacherUid && allUsersData[cls.assistantTeacherUid]) {
            if (isAdminOrHoiDong || cls.assistantTeacherUid === currentUid) {
                // Đảm bảo không thêm trùng nếu GV=TG
                if (!classStaff.some(s => s.uid === cls.assistantTeacherUid)) {
                    classStaff.push({ uid: cls.assistantTeacherUid, name: allUsersData[cls.assistantTeacherUid]?.name || cls.assistantTeacher, role: "Trợ Giảng" }); // Lấy tên từ allUsersData
                }
            }
        }

        // --- THAY ĐỔI: Sử dụng getBranchRef ---
        const personnelAttendanceSnap = await getBranchRef(`${DB_PATHS.PERSONNEL_ATTENDANCE}/${classId}`).once("value");
        // --- KẾT THÚC THAY ĐỔI ---
        const personnelAttendanceData = personnelAttendanceSnap.val() || {};

        // Phần tạo HTML header và body (giữ nguyên logic, chỉ cần đảm bảo đọc đúng tên nhân sự)
        const tableHeadRow = document.getElementById("personnel-attendance-table-head");
        const tableBody = document.getElementById("personnel-attendance-table-body");
        let headerHTML = `<tr><th style="min-width: 180px; position: sticky; left: 0; background-color: #f8f9fa; z-index: 2;">Nhân sự</th>`; // Cập nhật style
        sortedSessionDates.forEach((dateKey) => {
            const d = new Date(dateKey + 'T00:00:00');
            const label = `${d.getDate()}/${d.getMonth() + 1}`;
            const sessionType = sessions[dateKey]?.type; // Lấy loại buổi học
            let typeLabel = '';
            if (sessionType === 'makeup') typeLabel = ' (Bù)';
            else if (sessionType === 'extra') typeLabel = ' (Thêm)';
            // Chỉ hiển thị nút xóa cho Admin/Hội đồng
            const deleteButtonHtml = (isAdminOrHoiDong)
                ? `<button class="delete-session-btn" onclick="deleteSession('${classId}', '${dateKey}', false)" title="Xóa buổi này">×</button>` // isExam = false
                : '';
            headerHTML += `<th style="position: relative; min-width: 100px;">${deleteButtonHtml}Buổi học${typeLabel}<br><small>${label}</small></th>`; // Thêm loại buổi học, bỏ isExam
        });
        headerHTML += `</tr>`;
        tableHeadRow.innerHTML = headerHTML;
        tableBody.innerHTML = "";

        classStaff.forEach(staff => {
            const row = document.createElement("tr");
            // Cột tên nhân sự (sticky)
            const nameCell = document.createElement("td");
            nameCell.textContent = `${staff.name} (${staff.role})`;
            nameCell.style.position = "sticky";
            nameCell.style.left = "0";
            nameCell.style.backgroundColor = "var(--color-surface)"; // Dùng biến CSS
            nameCell.style.zIndex = "1";
            row.appendChild(nameCell);

            // Các cột checkbox điểm danh
            sortedSessionDates.forEach((dateKey) => {
                const isChecked = personnelAttendanceData?.[staff.uid]?.[dateKey]?.[staff.role] === true;
                const td = document.createElement("td");
                td.style.minWidth = "100px";
                td.style.textAlign = "center"; // Căn giữa checkbox
                const isDisabled = !isAdminOrHoiDong; // Chỉ Admin/Hội đồng được sửa

                td.innerHTML = `
                    <input type="checkbox"
                           style="transform: scale(1.3);"
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

    if (!selectedBranchId) {
        Swal.fire("Lỗi", "Chưa chọn cơ sở làm việc.", "error");
        return;
    }
// Lưu ý: role ở đây là 'Giáo Viên' hoặc 'Trợ Giảng' (có dấu tiếng Việt)
    const attPath = `${DB_PATHS.PERSONNEL_ATTENDANCE}/${classId}/${staffUid}/${dateStr}/${role}`;
    const attRef = getBranchRef(attPath);
    // --- KẾT THÚC THAY ĐỔI ---
    try {
        await attRef.set(isChecked);
        console.log(`Chấm công ${staffUid} (${role}) ngày ${dateStr} lớp ${classId} tại cơ sở ${selectedBranchId}: ${isChecked}`);
        // Không cần logActivity cho hành động này
    } catch (error) {
        console.error("Lỗi cập nhật chấm công nhân sự:", error);
        Swal.fire("Lỗi", "Không thể cập nhật chấm công.", "error");
         // Nên tìm cách bỏ tick lại checkbox nếu lỗi
         const checkbox = event?.target;
         if (checkbox) checkbox.checked = !isChecked;
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

    if (!selectedBranchId) {
        Swal.fire("Lỗi", "Chưa chọn cơ sở làm việc.", "error");
        return;
    }

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
        // --- THAY ĐỔI: Đọc allClassesData từ biến toàn cục đã load theo nhánh ---
        const allClassesInBranch = allClassesData || {}; // Dùng biến toàn cục đã load
        // --- KẾT THÚC THAY ĐỔI ---

        let foundClasses = false;
        // Sắp xếp lớp theo tên
        const sortedClassEntries = Object.entries(allClassesInBranch)
                                     .sort(([,a], [,b]) => (a.name || "").localeCompare(b.name || ""));

        sortedClassEntries.forEach(([classId, cls]) => { // Duyệt qua các lớp đã sắp xếp
            // Phần logic kiểm tra isTeacherInClass, isAssistantInClass, currentSalary, roleInClass giữ nguyên
            let isTeacherInClass = false;
            let isAssistantInClass = false;
            let currentSalary = 0;
            let roleInClass = '';

            if (cls.teacherUid === staffUid) {
                isTeacherInClass = true;
                roleInClass = 'Giáo Viên';
                currentSalary = cls.teacherSalary || 0;
            }
            if (cls.assistantTeacherUid === staffUid) {
                isAssistantInClass = true;
                if (isTeacherInClass) roleInClass = 'Giáo Viên, Trợ Giảng';
                else {
                    roleInClass = 'Trợ Giảng';
                    // Chỉ lấy lương trợ giảng nếu họ CHỈ là trợ giảng trong lớp này
                    currentSalary = cls.assistantTeacherSalary || 0;
                }
            }


            if (isTeacherInClass || isAssistantInClass) {
                foundClasses = true;
                const row = document.createElement("tr");
                const salaryInputId = `salary-input-${classId}-${staffUid}`; // Tạo ID duy nhất

                 // Xác định vai trò chính để lưu lương (ưu tiên GV nếu có cả 2)
                 const primaryRoleForSalary = isTeacherInClass ? 'teacher' : 'assistant';

                row.innerHTML = `
                    <td>${cls.name || 'Không tên lớp'}</td>
                    <td>${roleInClass}</td>
                    <td>
                        <input type="number"
                               id="${salaryInputId}"
                               class="salary-input"
                               data-class-id="${classId}"
                               data-staff-uid="${staffUid}"
                               data-role-salary="${primaryRoleForSalary}" value="${currentSalary}"
                               min="0"
                               onchange="saveClassSpecificSalary(this)"
                               > VNĐ </td>
                    <td>
                        </td>
                `;
                listEl.appendChild(row);
            }
        });

        if (!foundClasses) {
            listEl.innerHTML = '<tr><td colspan="4">Nhân sự này hiện không dạy lớp nào tại cơ sở này.</td></tr>';
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

    if (!selectedBranchId) {
        Swal.fire("Lỗi", "Chưa chọn cơ sở làm việc.", "error");
        return;
    }

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
        // --- THAY ĐỔI: Sử dụng getBranchRef ---
        const salaryRef = getBranchRef(`${DB_PATHS.CLASSES}/${classId}/${updatePathKey}`);
        await salaryRef.set(value);
        // --- KẾT THÚC THAY ĐỔI ---

        // Cập nhật lại dữ liệu toàn cục allClassesData để phản ánh thay đổi ngay
        if (allClassesData[classId]) {
             allClassesData[classId][updatePathKey] = value;
        }

        Swal.fire({ icon: 'success', title: 'Đã lưu lương lớp!', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
    } catch (error) {
        console.error("Lỗi lưu lương lớp:", error);
        Swal.fire("Lỗi", "Không thể lưu lương lớp. Vui lòng thử lại.", "error");
         // Có thể cần đọc lại giá trị cũ và đặt lại vào input nếu lỗi
         // inputElement.value = allClassesData[classId]?.[updatePathKey] || 0;
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

        if (!selectedBranchId) {
        Swal.fire("Lỗi", "Chưa chọn cơ sở làm việc.", "error");
        return;
    }

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

        if (!selectedBranchId) {
        Swal.fire("Lỗi", "Chưa chọn cơ sở làm việc.", "error");
        return;
    }

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

   try { // Thêm try...catch để bắt lỗi đọc DB
        // --- THAY ĐỔI: Sử dụng getBranchRef ---
        const [personnelAttendanceSnap, allClassesSnap] = await Promise.all([
            getBranchRef(DB_PATHS.PERSONNEL_ATTENDANCE).once("value"),
            getBranchRef(DB_PATHS.CLASSES).once("value")
        ]);
        // --- KẾT THÚC THAY ĐỔI ---

        const allAttendanceDataInBranch = personnelAttendanceSnap.val() || {};
        const allClassesInBranch = allClassesSnap.val() || {};

        // Phần còn lại: tính toán dailyShiftDetails, finalCalculatedSalary,
        // chuẩn bị labels, teacherData, assistantData, vẽ biểu đồ, cập nhật UI
        // giữ nguyên logic, chỉ cần đảm bảo đọc đúng dữ liệu từ các biến mới
        // (allAttendanceDataInBranch, allClassesInBranch)
        let dailyShiftDetails = {};
        let finalCalculatedSalary = 0;
        const dailyShiftsMap = new Map();

        // Duyệt qua các lớp trong chi nhánh hiện tại
        for (const classId in allClassesInBranch) {
            const cls = allClassesInBranch[classId];
            if (!cls) continue;

            // Lấy dữ liệu điểm danh của nhân sự trong lớp này
            const staffAttendanceInClass = allAttendanceDataInBranch[classId]?.[staffUid];
            if (!staffAttendanceInClass) continue;

            const salaryTeacherPerClass = (cls.teacherUid === staffUid) ? (cls.teacherSalary || 0) : 0;
            const salaryAssistantPerClass = (cls.assistantTeacherUid === staffUid) ? (cls.assistantTeacherSalary || 0) : 0;

            for (const dateStr in staffAttendanceInClass) {
                const sessionDate = new Date(dateStr + 'T00:00:00'); // Thêm T00:00:00 để tránh lỗi timezone
                if (sessionDate >= startDate && sessionDate <= endDate) {
                    if (!dailyShiftsMap.has(dateStr)) { dailyShiftsMap.set(dateStr, { teacher: 0, assistant: 0 }); }
                    if (!dailyShiftDetails[dateStr]) { dailyShiftDetails[dateStr] = []; }

                    const rolesAttended = staffAttendanceInClass[dateStr];
                     // Lấy giờ học từ fixedSchedule dựa trên ngày trong tuần
                     const dayIndex = sessionDate.getDay(); // 0=CN, 1=T2,...
                     const sessionTime = cls.fixedSchedule?.[dayIndex] || 'N/A'; // Lấy giờ từ schedule bằng số

                    if (rolesAttended['Giáo Viên'] === true) {
                        dailyShiftsMap.get(dateStr).teacher++;
                        finalCalculatedSalary += salaryTeacherPerClass;
                        dailyShiftDetails[dateStr].push(`Lớp: ${cls.name} (GV - ${sessionTime}) - Lương: ${salaryTeacherPerClass.toLocaleString('vi-VN')} VNĐ`);
                    }
                    if (rolesAttended['Trợ Giảng'] === true) {
                        dailyShiftsMap.get(dateStr).assistant++;
                        finalCalculatedSalary += salaryAssistantPerClass;
                         // Chỉ thêm nếu khác dòng GV (trường hợp GV=TG)
                         if (!(rolesAttended['Giáo Viên'] === true && salaryTeacherPerClass === salaryAssistantPerClass)) {
                              dailyShiftDetails[dateStr].push(`Lớp: ${cls.name} (TG - ${sessionTime}) - Lương: ${salaryAssistantPerClass.toLocaleString('vi-VN')} VNĐ`);
                         }
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
} catch (error) { // Bắt lỗi đọc DB
        console.error("Lỗi khi tải dữ liệu lương:", error);
        Swal.fire("Lỗi", "Không thể tải dữ liệu chi tiết lương: " + error.message, "error");
         // Có thể ẩn modal hoặc hiển thị thông báo lỗi trong modal
         document.getElementById("total-monthly-salary").textContent = "Lỗi";
         document.getElementById("total-teacher-shifts").textContent = "N/A";
         document.getElementById("total-assistant-shifts").textContent = "N/A";
         if (personnelChart) personnelChart.destroy(); // Hủy biểu đồ cũ nếu có
    } finally {
        showLoading(false);
    }
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
    // --- Khởi tạo các thành phần giao diện ban đầu ---
    initScheduleEventListeners(); // Khởi tạo listener cho lịch học (context menu) - tooltip sẽ được thêm vào đây
    populateTimeDropdowns();      // Điền giờ/phút vào các dropdown
    updateLiveDate();             // Cập nhật ngày tháng
    setInterval(updateLiveClock, 100); // Bắt đầu chạy đồng hồ

    // === THÊM LẠI LISTENER CHO TOOLTIP LỊCH HỌC ===
    const scheduleContainer = document.getElementById('schedule-grid-container');
    const tooltip = document.getElementById('schedule-tooltip');

    if (scheduleContainer && tooltip) {
        scheduleContainer.addEventListener('mouseover', (e) => {
            const classBlock = e.target.closest('.class-block');
            if (classBlock && classBlock.dataset.tooltip) { // Thêm kiểm tra dataset.tooltip
                tooltip.innerHTML = classBlock.dataset.tooltip.replace(/\n/g, '<br>'); // Dùng innerHTML để hiển thị <br>
                tooltip.style.display = 'block';
            }
        });

        scheduleContainer.addEventListener('mouseout', () => {
            tooltip.style.display = 'none';
        });

        scheduleContainer.addEventListener('mousemove', (e) => {
            // Hiển thị tooltip bên cạnh con trỏ chuột
            tooltip.style.left = `${e.pageX + 15}px`; // Dùng pageX/pageY nếu tooltip không fixed
            tooltip.style.top = `${e.pageY + 15}px`;
            // Hoặc dùng clientX/clientY nếu tooltip có position: fixed
            // tooltip.style.left = `${e.clientX + 15}px`;
            // tooltip.style.top = `${e.clientY + 15}px`;
        });
    }
    // ===========================================

    // === GỌI KIỂM TRA TRẠNG THÁI BAN ĐẦU (CƠ SỞ & ĐĂNG NHẬP) ===
    checkInitialAuthState(); // Kiểm tra xem đã chọn cơ sở chưa và xử lý đăng nhập
    // =========================================================

    // --- Gắn listener cho các nút và input khác ---

    // Gắn sự kiện cho các nút chuyển tuần (lịch học)
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

    // Gắn sự kiện cho nút hamburger (menu mobile) và đóng sidebar
    const hamburgerBtn = document.querySelector('.top-bar__hamburger'); // Selector này có thể cần sửa nếu bạn chưa thêm nút hamburger
    const sidebar = document.querySelector('.sidebar');
    if (hamburgerBtn && sidebar) {
        hamburgerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('visible');
        });
    }
    document.addEventListener('click', (e) => {
        if (sidebar && sidebar.classList.contains('visible') && !sidebar.contains(e.target) && (!hamburgerBtn || !hamburgerBtn.contains(e.target))) { // Thêm kiểm tra hamburgerBtn
            sidebar.classList.remove('visible');
        }
    });

    // Gắn sự kiện cho input chọn file avatar
    const avatarFileInput = document.getElementById("avatar-file");
    if (avatarFileInput) {
        avatarFileInput.addEventListener("change", async function() {
            const file = this.files[0];
            if (!file) return;
            const user = auth.currentUser;
            if (!user) return alert("Bạn chưa đăng nhập!"); // Nên dùng Swal
            const storageRef = storage.ref();
            const avatarRef = storageRef.child(`avatars/${user.uid}_${Date.now()}`);
            try {
                showLoading(true);
                await avatarRef.put(file);
                const url = await avatarRef.getDownloadURL();
                await database.ref(`${DB_PATHS.USERS}/${user.uid}`).update({ avatarUrl: url });
                const avatarImg = document.getElementById("avatar-img");
                const profileAvatar = document.getElementById("profile-avatar");
                if(avatarImg) avatarImg.src = url;
                if(profileAvatar) profileAvatar.src = url;
                Swal.fire({icon: 'success', title: 'Avatar đã được cập nhật!', showConfirmButton: false, timer: 1500});
            } catch (error) {
                Swal.fire({icon: 'error', title: 'Lỗi Upload Avatar', text: error.message});
            } finally {
                showLoading(false);
            }
        });
    }

    // Gắn listener submit cho form lớp học
    const classForm = document.getElementById("class-form");
    if (classForm) {
        classForm.addEventListener("submit", saveClass);
    }

    // Gắn listener lưu brouillon (nháp) cho các trường trong form học viên
    const fields = ["student-name", "student-dob", "student-address", "student-package-type",
                    "general-english-course", "student-certificate-type", "student-certificate-course",
                    "student-package",
                    "student-discount-percent", "student-promotion-percent",
                    "student-original-price", "student-total-due", "student-parent-job",
                    "student-phone", "student-parent", "student-parent-phone", "student-parent-job-other"
                   ];
    fields.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            // Load nháp khi trang tải
            const draft = localStorage.getItem(id);
            if (draft !== null && draft !== undefined) {
                input.value = draft;
                if (input.tagName === 'SELECT') {
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                }
                if (id === 'student-parent-job' && draft === 'Khác') {
                    const otherJobInput = document.getElementById('student-parent-job-other');
                    if (otherJobInput) otherJobInput.style.display = 'inline-block';
                }
                if (id === 'student-dob' && draft) {
                    // Cần đảm bảo hàm này chạy sau khi giá trị dob được set
                    setTimeout(handleAgeChange, 0);
                }
            }
            // Lưu nháp khi người dùng nhập
            input.addEventListener("input", () => {
                localStorage.setItem(id, input.value);
                if (id === 'student-parent-job') {
                    const otherJobInput = document.getElementById('student-parent-job-other');
                    if (otherJobInput) {
                        otherJobInput.style.display = (input.value === 'Khác') ? 'inline-block' : 'none';
                        if (input.value !== 'Khác') {
                            otherJobInput.value = '';
                            localStorage.removeItem('student-parent-job-other');
                        }
                    }
                }
                 // Trigger age change logic when dob is changed by user
                if (id === 'student-dob') {
                    handleAgeChange();
                }
            });
             // Trigger age change logic after loading draft for dob (initial load)
            if (id === 'student-dob' && input.value) {
                setTimeout(handleAgeChange, 0); // Use timeout to ensure DOM updates apply
            }
        }
    });

    // Cập nhật lại giao diện sticky button
    updateStickyBackVisibility();
    window.addEventListener("hashchange", updateStickyBackVisibility);

}); // <--- Chỉ có MỘT dấu đóng } và ); ở đây
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
/**
 * Tạo ra một danh sách các buổi học "cuốn chiếu", có bỏ qua ngày lễ.
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
            // *** BƯỚC KIỂM TRA NGÀY LỄ MỚI ***
            const month = String(cursorDate.getMonth() + 1).padStart(2, '0');
            const day = String(cursorDate.getDate()).padStart(2, '0');
            const monthDay = `${month}-${day}`;

            if (!HOLIDAYS.includes(monthDay)) {
                // Chỉ thêm buổi học nếu ngày đó không phải là ngày lễ
                const year = cursorDate.getFullYear();
                const dateKey = `${year}-${month}-${day}`;
                
                if (!sessions[dateKey]) {
                    sessions[dateKey] = {
                        time: schedule[dayIndex]
                    };
                }
            }
            // Nếu là ngày lễ, vòng lặp sẽ tự động bỏ qua và xét ngày tiếp theo
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

    // --- THÊM KIỂM TRA ---
    if (!selectedBranchId) {
        Swal.fire("Lỗi", "Chưa chọn cơ sở làm việc.", "error");
        return;
    }
    // --- KẾT THÚC KIỂM TRA ---

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
            // --- THAY ĐỔI: Sử dụng getBranchRef để cập nhật ---
            const sessionRef = getBranchRef(`${DB_PATHS.CLASSES}/${classId}/sessions/${newDate}`);
            await sessionRef.set({ time: newTime, type: "extra" });
            // --- KẾT THÚC THAY ĐỔI ---

            await logActivity(`Đã thêm buổi học dự phòng ngày ${newDate} cho lớp ${classData.name} tại cơ sở ${selectedBranchId}`);

            // Tải lại bảng điểm danh (hàm này đã được sửa)
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

    // --- THÊM KIỂM TRA ---
    if (!selectedBranchId) {
        Swal.fire("Lỗi", "Chưa chọn cơ sở làm việc.", "error");
        return;
    }
    // --- KẾT THÚC KIỂM TRA ---

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
            // --- THAY ĐỔI: Chuẩn bị cập nhật hàng loạt trong đúng nhánh ---
            const updates = {};
            const basePath = `branches/${selectedBranchId}/${DB_PATHS.CLASSES}/${classId}/sessions`;
            // Đánh dấu xóa buổi học cũ
            updates[`/${basePath}/${oldDate}`] = null;
            // Thêm buổi học mới
            updates[`/${basePath}/${newDate}`] = { time: newTime, type: "makeup" };

            // Thực hiện cập nhật
            await database.ref().update(updates);
            // --- KẾT THÚC THAY ĐỔI ---

            await logActivity(`Đã tạo buổi bù ngày ${newDate} thay thế cho buổi ${oldDate} của lớp ${classData.name} tại cơ sở ${selectedBranchId}`);

            // Tải lại bảng điểm danh (hàm này đã được sửa)
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

    // --- THÊM KIỂM TRA ---
    if (!selectedBranchId) {
        Swal.fire("Lỗi", "Chưa chọn cơ sở làm việc.", "error");
        return;
    }
    if (!classId) {
         Swal.fire("Lỗi", "Không xác định được lớp học.", "error");
         return;
    }
    // --- KẾT THÚC KIỂM TRA ---

    showLoading(true);
    try {
        // --- THAY ĐỔI: Sử dụng getBranchRef ---
        const classSnap = await getBranchRef(`${DB_PATHS.CLASSES}/${classId}`).once("value");
        // --- KẾT THÚC THAY ĐỔI ---
        const classData = classSnap.val();
        if (!classData) throw new Error("Không tìm thấy dữ liệu lớp học.");

        const studentIds = Object.keys(classData.students || {});
        // --- THAY ĐỔI: Lấy dữ liệu students từ đúng nhánh ---
        const studentPromises = studentIds.map(id => getBranchRef(`${DB_PATHS.STUDENTS}/${id}`).once('value'));
        // --- KẾT THÚC THAY ĐỔI ---
        const studentSnapshots = await Promise.all(studentPromises);
        const students = {};
        studentSnapshots.forEach(snap => {
            if (snap.exists()) students[snap.key] = snap.val();
        });

        // --- THAY ĐỔI: Lấy dữ liệu attendance từ đúng nhánh ---
        const attendanceSnap = await getBranchRef(`${DB_PATHS.ATTENDANCE}/${classId}`).once('value');
        // --- KẾT THÚC THAY ĐỔI ---
        const allAttendance = attendanceSnap.val() || {};
        const sessions = classData.sessions || {};
        const exams = classData.exams || {};
        const allEventDates = [...new Set([...Object.keys(sessions), ...Object.keys(exams)])].sort();

        // === LOGIC MỚI: XÁC ĐỊNH CÁC NGÀY ĐƯỢC PHÉP ĐIỂM DANH ===
        const role = currentUserData?.role;
        const isLimited = role === 'Giáo Viên'; // Chỉ Giáo viên bị giới hạn, Trợ giảng không bị
        let allowedDates = new Set(allEventDates); // Mặc định cho phép tất cả

        if (isLimited) {
            allowedDates = new Set(); // Reset, chỉ cho phép ngày cụ thể
            const todayStr = new Date().toISOString().split('T')[0];
            const futureSessions = allEventDates.filter(date => date >= todayStr);
            if (futureSessions.length > 0) {
                const sessionN = futureSessions[0];
                allowedDates.add(sessionN);
                const indexN = allEventDates.indexOf(sessionN);
                if (indexN > 0) {
                    const sessionN_1 = allEventDates[indexN - 1];
                    allowedDates.add(sessionN_1);
                }
            }
             // Cho phép cả ngày hôm qua nữa
             const yesterday = new Date();
             yesterday.setDate(yesterday.getDate() - 1);
             const yesterdayStr = yesterday.toISOString().split('T')[0];
             if (allEventDates.includes(yesterdayStr)) {
                 allowedDates.add(yesterdayStr);
             }
        }

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
        // Sắp xếp học viên theo tên
        const sortedStudentIds = Object.keys(students).sort((a, b) => (students[a]?.name || '').localeCompare(students[b]?.name || ''));

        sortedStudentIds.forEach(studentId => { // Duyệt theo thứ tự đã sắp xếp
            const student = students[studentId];
             // Tính toán warning (giữ nguyên)
             const sessionsAttended = student.sessionsAttended || 0;
             const totalSessionsPaid = student.totalSessionsPaid || 0;
             const remainingSessions = totalSessionsPaid - sessionsAttended;
             let warningClass = '';
             let iconHtml = '';
             if (remainingSessions <= 0) { warningClass = 'student-warning-critical'; }
             else if (remainingSessions <= 3) { warningClass = 'student-warning-low'; iconHtml = '<span class="warning-icon">&#9888;</span> '; }

             // Thêm style sticky cho cột tên
            let rowHTML = `<tr><td class="${warningClass}" style="position: sticky; left: 0; background-color: var(--color-surface); z-index: 1;">${iconHtml}${student.name}</td>`;
            allEventDates.forEach(dateKey => {
                const isExam = !!exams[dateKey];
                const attendanceRecord = allAttendance[studentId]?.[dateKey]; // Lấy cả object { attended, score }
                const isChecked = attendanceRecord?.attended === true;
                const scoreValue = (attendanceRecord?.score !== undefined) ? attendanceRecord.score : "";
                const isDisabled = isLimited && !allowedDates.has(dateKey); // Kiểm tra giới hạn

                // Render ô điểm danh và ô điểm/đánh giá
                rowHTML += `<td style="text-align: center;">`; // Thêm style center
                rowHTML += `<input type="checkbox" onchange="toggleAttendance('${classId}', '${studentId}', '${dateKey}', this.checked, ${isExam})" ${isChecked ? "checked" : ""} ${isDisabled ? "disabled" : ""}>`;

                 // Chỉ hiển thị ô nhập điểm/đánh giá nếu là Admin/Hội đồng hoặc là buổi được phép sửa
                 if (!isDisabled || currentUserData?.role === 'Admin' || currentUserData?.role === 'Hội Đồng') {
                     if (isExam) {
                         rowHTML += `<input type="number" class="exam-score-input" min="0" max="10" step="0.5" value="${scoreValue}" placeholder="Điểm" onchange="updateHomeworkScore('${classId}', '${studentId}', '${dateKey}', this.value)" style="width: 60px; margin-top: 5px;">`;
                     } else {
                         const scoreOptions = [ /* ... options ... */
                             { value: "", text: "Chưa ĐG", color: "#6c757d" },
                             { value: "Không tích cực", text: "Kém", color: "#dc3545" },
                             { value: "Tích cực", text: "Tốt", color: "#28a745" },
                             { value: "Rất tích cực", text: "Xuất sắc", color: "#007bff" }
                         ];
                         const initialColor = (scoreOptions.find(opt => opt.value === scoreValue) || scoreOptions[0]).color;
                         let optionsHTML = scoreOptions.map(opt => `<option value="${opt.value}" data-color="${opt.color}" ${scoreValue === opt.value ? 'selected' : ''}>${opt.text}</option>`).join('');
                         rowHTML += `<select class="evaluation-select" style="color: ${initialColor}; font-weight: bold; margin-top: 5px; width: 90px;" onchange="this.style.color = this.options[this.selectedIndex].dataset.color; updateHomeworkScore('${classId}', '${studentId}', '${dateKey}', this.value);">${optionsHTML}</select>`;
                     }
                 } else {
                     // Nếu bị disable, hiển thị text thay vì input/select
                      if (isExam) {
                          rowHTML += `<div style="margin-top: 5px;">${scoreValue !== "" ? scoreValue : '---'}</div>`;
                      } else {
                           const scoreOptions = [ /* ... options ... */
                               { value: "", text: "Chưa ĐG", color: "#6c757d" },
                               { value: "Không tích cực", text: "Kém", color: "#dc3545" },
                               { value: "Tích cực", text: "Tốt", color: "#28a745" },
                               { value: "Rất tích cực", text: "Xuất sắc", color: "#007bff" }
                           ];
                           const selectedOption = scoreOptions.find(opt => opt.value === scoreValue) || scoreOptions[0];
                          rowHTML += `<div style="color: ${selectedOption.color}; font-weight: bold; margin-top: 5px;">${selectedOption.text}</div>`;
                      }
                 }

                rowHTML += `</td>`;
            });
            rowHTML += `</tr>`;
            bodyHTML += rowHTML;
        });
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
        hideClassAttendanceModal();
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

    // --- THÊM KIỂM TRA ---
    if (!selectedBranchId) {
        Swal.fire("Lỗi", "Chưa chọn cơ sở làm việc.", "error");
        return;
    }
    if (!classId || !dateToDelete) {
        Swal.fire("Lỗi", "Không xác định được buổi học cần xóa.", "error");
        return;
    }
    // --- KẾT THÚC KIỂM TRA ---

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
            const classRef = getBranchRef(`${DB_PATHS.CLASSES}/${classId}`);
            const classSnap = await classRef.once("value");
            const cls = classSnap.val();
            if (!cls) throw new Error("Không tìm thấy lớp học.");

            const studentIds = Object.keys(cls.students || {});
            const updates = {};
            
            const basePath = `branches/${selectedBranchId}`; // Phần tiền tố cho các đường dẫn cập nhật

            // Đánh dấu để xóa buổi học/thi khỏi node 'classes'
            if (isExam) {
                updates[`/${basePath}/${DB_PATHS.CLASSES}/${classId}/exams/${dateToDelete}`] = null;
            } else {
                updates[`/${basePath}/${DB_PATHS.CLASSES}/${classId}/sessions/${dateToDelete}`] = null;
            }

            // Duyệt qua từng học viên để xử lý điểm danh và sessionsAttended
            const studentUpdatePromises = studentIds.map(async (studentId) => {
                // --- THAY ĐỔI: Sử dụng getBranchRef ---
                const attendanceRecordRef = getBranchRef(`${DB_PATHS.ATTENDANCE}/${classId}/${studentId}/${dateToDelete}`);
                // --- KẾT THÚC THAY ĐỔI ---
                const attendanceRecordSnap = await attendanceRecordRef.once("value");
                const attendanceData = attendanceRecordSnap.val();

                // Kiểm tra xem học viên có điểm danh buổi này không và có cần giảm sessionsAttended không
                if (attendanceData?.attended === true) {
                     // Kiểm tra lại logic xem có cần giảm không (dựa trên loại lớp và loại buổi học)
                     const isCertificateClass = cls.classType === 'Lớp chứng chỉ';
                     let shouldDecrementCount = false;
                     if (isCertificateClass) {
                         shouldDecrementCount = !isExam; // Chỉ giảm nếu là buổi học thường
                     } else {
                         shouldDecrementCount = true; // Luôn giảm cho các lớp khác
                     }

                     if (shouldDecrementCount) {
                         // --- THAY ĐỔI: Sử dụng getBranchRef ---
                         const studentAttendedRef = getBranchRef(`${DB_PATHS.STUDENTS}/${studentId}/sessionsAttended`);
                         // --- KẾT THÚC THAY ĐỔI ---
                         // Thực hiện giảm số buổi đã học bằng transaction
                         await studentAttendedRef.transaction((currentValue) => {
                             const newValue = (currentValue || 0) - 1;
                             return Math.max(0, newValue); // Đảm bảo không âm
                         });
                         console.log(`Đã giảm sessionsAttended cho ${studentId} do xóa buổi ${dateToDelete}`);
                     }
                }

                // Đánh dấu để xóa bản ghi điểm danh/điểm số của học viên cho ngày này
                // --- THAY ĐỔI: Tạo đường dẫn cập nhật trong đúng nhánh ---
                updates[`/${basePath}/${DB_PATHS.ATTENDANCE}/${classId}/${studentId}/${dateToDelete}`] = null;
                // Nếu bạn có node homeworkScores riêng, cũng thêm vào đây:
                // updates[`/${basePath}/${DB_PATHS.HOMEWORK_SCORES}/${classId}/${studentId}/${dateToDelete}`] = null;
                // --- KẾT THÚC THAY ĐỔI ---
            });

            // Chờ tất cả các transaction cập nhật sessionsAttended hoàn tất
            await Promise.all(studentUpdatePromises);

            // Thực hiện xóa đồng bộ buổi học và điểm danh/điểm số
            await database.ref().update(updates);

            // Ghi log (không cần thêm cơ sở vì hàm logActivity đã làm)
            await logActivity(`Đã xóa ${sessionType} ngày ${dateToDelete} của lớp ${cls.name}`);

            // Tải lại bảng điểm danh để hiển thị sự thay đổi
            await renderClassAttendanceTable(classId); // Hàm này đã được sửa
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
 * HÀM NÂNG CẤP: Cập nhật trạng thái điểm danh và tăng/giảm số buổi đã học (với logic đếm mới)
 */
async function toggleAttendance(classId, studentId, dateStr, isChecked, isExamSession) {
    if (!selectedBranchId) {
        Swal.fire("Lỗi", "Chưa chọn cơ sở làm việc.", "error");
        return;
    }

    const attendanceRef = getBranchRef(`${DB_PATHS.ATTENDANCE}/${classId}/${studentId}/${dateStr}`);

    try {
        // Cập nhật trạng thái điểm danh (giữ nguyên)
        await attendanceRef.transaction(currentData => {
            const data = (currentData && typeof currentData === 'object') ? currentData : {};
            data.attended = isChecked;
            return data;
        });
        console.log(`Điểm danh ${studentId} ngày ${dateStr}: ${isChecked}`);

        // === THAY ĐỔI LOGIC ĐẾM BUỔI ===
        // 1. Lấy thông tin loại lớp từ biến toàn cục
        const classData = allClassesData[classId];
        const isCertificateClass = classData?.classType === 'Lớp chứng chỉ';

        // 2. Quyết định xem có cần cập nhật sessionsAttended không
        let shouldUpdateSessionCount = false;
        if (isCertificateClass) {
            // Lớp chứng chỉ: Chỉ cập nhật nếu KHÔNG phải buổi thi
            shouldUpdateSessionCount = !isExamSession;
        } else {
            // Lớp khác (Phổ thông, Môn trường): Luôn cập nhật
            shouldUpdateSessionCount = true;
        }

        // 3. Thực hiện cập nhật nếu cần
        if (shouldUpdateSessionCount) {
            console.log(` -> Buổi này sẽ được tính vào sessionsAttended.`);
            const studentSessionsRef = getBranchRef(`${DB_PATHS.STUDENTS}/${studentId}/sessionsAttended`);
            const delta = isChecked ? 1 : -1;

            const { committed, snapshot } = await studentSessionsRef.transaction(currentValue => {
                const newValue = (currentValue || 0) + delta;
                return Math.max(0, newValue); // Đảm bảo không âm
            });
            console.log(`Cập nhật sessionsAttended cho ${studentId}: ${delta > 0 ? '+' : ''}${delta}`);

            // Tự động gia hạn nếu cần (logic giữ nguyên)
            if (committed && isChecked) {
                const newAttendedCount = snapshot.val();
                 // classData đã lấy ở trên
                if (classData && (classData.classType === 'Lớp tiếng Anh phổ thông' || classData.classType === 'Lớp các môn trên trường') && newAttendedCount > 0 && newAttendedCount % 16 === 0) {
                    autoExtendSchedule(classId); // Hàm này cũng cần sửa sau
                }
            }
        } else {
             console.log(` -> Buổi này KHÔNG được tính vào sessionsAttended (Lớp chứng chỉ & là buổi thi).`);
        }
        // === KẾT THÚC THAY ĐỔI LOGIC ĐẾM BUỔI ===

    } catch (error) {
        console.error("Lỗi khi cập nhật điểm danh:", error);
        Swal.fire("Lỗi", "Không thể cập nhật điểm danh.", "error");
        renderClassAttendanceTable(classId); // Reload lại bảng nếu lỗi
    }
}
/**
 * HÀM MỚI: Tự động thêm 16 buổi học vào cuối lịch trình của một lớp.
 * @param {string} classId - ID của lớp cần thêm buổi.
 */
async function autoExtendSchedule(classId) {

    // --- THÊM KIỂM TRA ---
    if (!selectedBranchId) {
        console.error("Lỗi autoExtend: Chưa chọn cơ sở.");
        return;
    }
    // --- KẾT THÚC KIỂM TRA ---

    console.log(`Bắt đầu kiểm tra và tự động thêm buổi cho lớp: ${classId}`);
    try {
        const classRef = getBranchRef(`${DB_PATHS.CLASSES}/${classId}`);
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
        
        if (!lastSessionDateStr) {
             console.warn(`Lớp ${classId} không có buổi học nào để xác định ngày cuối cùng.`);
             return;
        }

        const nextDay = new Date(lastSessionDateStr);
        nextDay.setDate(nextDay.getDate() + 1);
        const newStartDateStr = nextDay.toISOString().split('T')[0];

        // Số buổi cần tạo luôn là 16
        const sessionsToGenerate = 16;

        // Tạo ra 16 buổi học mới
        const newSessions = generateRollingSessions(newStartDateStr, sessionsToGenerate, classData.fixedSchedule);

        // --- THAY ĐỔI: Chuẩn bị cập nhật hàng loạt trong đúng nhánh ---
        const updates = {};
        const basePath = `branches/${selectedBranchId}/${DB_PATHS.CLASSES}/${classId}/sessions`;
        for (const dateKey in newSessions) {
            // Chỉ thêm nếu buổi đó chưa tồn tại (phòng trường hợp chạy trùng lặp)
            if (!classData.sessions[dateKey]) {
                updates[`/${basePath}/${dateKey}`] = newSessions[dateKey];
            }
        }

        // Cập nhật lên Firebase nếu có buổi mới để thêm
        if (Object.keys(updates).length > 0) {
            await database.ref().update(updates);
            console.log(`THÀNH CÔNG: Đã tự động thêm ${Object.keys(updates).length} buổi học mới cho lớp ${classId} tại cơ sở ${selectedBranchId}.`);
             // (Không cần logActivity cho hành động tự động này)
             // Thông báo ngầm cho người dùng (nếu cần)
             // Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: `Đã tự động thêm lịch cho lớp ${classData.name}`, showConfirmButton: false, timer: 3000 });
        } else {
             console.log(`Không có buổi học mới nào cần thêm cho lớp ${classId} tại cơ sở ${selectedBranchId}.`);
        }
        // --- KẾT THÚC THAY ĐỔI ---

    } catch (error) {
        console.error(`Lỗi khi tự động thêm buổi cho lớp ${classId} tại cơ sở ${selectedBranchId}:`, error);
        // Không nên hiện Swal lỗi cho hành động chạy ngầm
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

    // --- THÊM KIỂM TRA ---
    if (!selectedBranchId) {
        console.error("Lỗi: Chưa chọn cơ sở khi cập nhật điểm.");
        // Không nên hiện Swal ở đây vì nó sẽ làm gián đoạn việc nhập liệu
        return;
    }
    // --- KẾT THÚC KIỂM TRA ---

  const scoreRef = getBranchRef(`${DB_PATHS.ATTENDANCE}/${classId}/${studentId}/${dateStr}`);
  
  scoreRef.transaction(currentData => {
        const data = (currentData && typeof currentData === 'object') ? currentData : {};
        if (value === "" || value === undefined || value === null) {
            // Nếu giá trị rỗng/không hợp lệ, xóa thuộc tính score
            delete data.score;
        } else {
            // Kiểm tra nếu là điểm số (number) thì parse, nếu không thì giữ nguyên (string)
            const numericValue = parseFloat(value);
            data.score = !isNaN(numericValue) ? numericValue : value;
        }
        return data;
    }).then(() => {
        console.log(`Đã cập nhật điểm/đánh giá cho ${studentId} ngày ${dateStr} thành: ${value}`);
    }).catch(error => {
        console.error(`Lỗi cập nhật điểm/đánh giá cho ${studentId} ngày ${dateStr}:`, error);
        // Có thể thêm thông báo lỗi nhỏ nếu cần
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
            <i data-Lucide="chevron-down"></i>
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
    
  /*  if (typeof Lucide !== 'undefined') {
        Lucide.createIcons();
    } */
}

/**
 * Hiển thị Modal quản lý học phí với dữ liệu của học viên được chọn
 * @param {string} studentId - ID của học viên
 */
async function showTuitionModal(studentId, classId) {

    // --- THÊM KIỂM TRA ---
    if (!selectedBranchId) {
        console.error("Lỗi autoExtend: Chưa chọn cơ sở.");
        return;
    }
    // --- KẾT THÚC KIỂM TRA ---

    showLoading(true);
    try {
        const studentSnap = await getBranchRef(`${DB_PATHS.STUDENTS}/${studentId}`).once('value');
        const student = studentSnap.val();
        if (!student) {
            Swal.fire("Lỗi", "Không tìm thấy dữ liệu học viên!", "error");
            hideTuitionModal();
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
        
       // Hiển thị lịch sử đóng tiền sách (bookFeeHistory)
        const bookHistoryList = document.getElementById("book-fee-history-list");
        bookHistoryList.innerHTML = ""; // Xóa cũ
        if (student.bookFeeHistory) {
             const sortedBookHistory = Object.entries(student.bookFeeHistory).sort(([,a], [,b]) => (b.paymentDate || "").localeCompare(a.paymentDate || ""));
             sortedBookHistory.forEach(([paymentId, payment]) => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${payment.paymentDate || ''}</td>
                    <td>${(payment.amountPaid || 0).toLocaleString('vi-VN')}</td>
                    <td>${payment.bookTitle || ''}</td>
                    <td>${payment.note || ''}</td>
                    <td>${payment.recordedBy || 'N/A'}</td>
                    <td><button class="delete-btn" onclick="deleteBookFeePayment('${studentId}', '${paymentId}')">Xóa</button></td>
                `;
                bookHistoryList.appendChild(row);
            });
        }

        // Khởi tạo book selection (nếu cần)
        initializeBookSelection(studentId); // Hàm này có thể cần sửa nếu đọc classId từ student

        // Hiển thị modal
        document.getElementById("tuition-modal").style.display = "flex";
        // Mặc định mở tab học phí
        openPageTab({ currentTarget: document.querySelector('#tuition-modal .tabs__button.active') || document.querySelector('#tuition-modal .tabs__button') }, 'payment-tab', 'tuition-modal');


    } catch (error) {
        console.error("Lỗi khi hiển thị modal học phí:", error);
        Swal.fire("Lỗi", "Không thể hiển thị thông tin học phí: " + error.message, "error");
    } finally {
        showLoading(false);
    }
}
async function promptSetBookFeeDue() {

    // --- THÊM KIỂM TRA ---
    if (!selectedBranchId) {
        console.error("Lỗi autoExtend: Chưa chọn cơ sở.");
        return;
    }
    // --- KẾT THÚC KIỂM TRA ---

    const studentId = document.getElementById("tuition-student-id").value;
    // Lấy classId từ trường ẩn mà chúng ta đã lưu
    const classId = document.getElementById("tuition-modal-class-id").value;
    const studentRef = getBranchRef(`${DB_PATHS.STUDENTS}/${studentId}`);

    const oldDataSnap = await studentRef.once('value');
    const oldData = oldDataSnap.val();
    const oldBookFeeDue = oldData?.totalBookFeeDue || 0; // Thêm ?. để an toàn

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
            // --- THAY ĐỔI: Ghi vào đúng nhánh ---
            await studentRef.update({ totalBookFeeDue: parseInt(newTotalBookFeeDue) });
            // --- KẾT THÚC THAY ĐỔI ---

             // Log hành động
             await logActivity(`Cập nhật tổng nợ tiền sách cho ${oldData?.name || studentId} thành ${parseInt(newTotalBookFeeDue).toLocaleString('vi-VN')} tại cơ sở ${selectedBranchId}`);

            // Tải lại modal chi tiết của học viên
            await showTuitionModal(studentId, classId);
            Swal.fire('Thành công!', 'Đã cập nhật tổng nợ tiền sách.', 'success');

            // Tải lại bảng tổng quan tiền sách lớp nếu đang mở
            if(classId && document.getElementById("class-book-fee-modal").style.display === "flex") {
                 await showClassBookFeeModal(classId);
            }
             // Tải lại bảng tổng quan học phí lớp nếu đang mở (vì nó cũng có thể hiển thị tiền sách)
             if(classId && document.getElementById("class-tuition-modal").style.display === "flex") {
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

    // --- THÊM KIỂM TRA ---
    if (!selectedBranchId) {
        Swal.fire("Lỗi", "Chưa chọn cơ sở làm việc.", "error");
        return;
    }
    if (!classId || !dateToDelete) {
        Swal.fire("Lỗi", "Không xác định được buổi học cần xóa.", "error");
        return;
    }
    // --- KẾT THÚC KIỂM TRA ---

    showLoading(true);
    const studentListBody = document.getElementById("class-tuition-student-list");
    studentListBody.innerHTML = ''; 

    try {
        const classSnap = await getBranchRef(`${DB_PATHS.CLASSES}/${classId}`).once('value');
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

        const studentPromises = studentIds.map(id => getBranchRef(`${DB_PATHS.STUDENTS}/${id}`).once('value'));
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

    // --- THÊM KIỂM TRA ---
    if (!selectedBranchId) {
        console.error("Lỗi autoExtend: Chưa chọn cơ sở.");
        return;
    }
    // --- KẾT THÚC KIỂM TRA ---

    const studentId = document.getElementById("tuition-student-id").value;
    const classId = document.getElementById("tuition-modal-class-id").value;
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
        // --- THAY ĐỔI: Sử dụng getBranchRef ---
        const paymentRef = getBranchRef(`${DB_PATHS.STUDENTS}/${studentId}/paymentHistory`);
        // --- KẾT THÚC THAY ĐỔI ---
        await paymentRef.push(paymentData);

        await logActivity(`Ghi nhận thanh toán học phí ${amountPaid.toLocaleString('vi-VN')} cho ${document.getElementById("tuition-student-name").textContent} tại cơ sở ${selectedBranchId}`);

        Swal.fire({ icon: 'success', title: 'Thành công!', text: 'Đã ghi nhận thanh toán mới.', timer: 1500, showConfirmButton: false });
        document.getElementById("tuition-payment-form").reset();

        // Tải lại modal chi tiết của học viên
        await showTuitionModal(studentId, classId);
        // Nếu đang xem từ bảng tổng quan lớp, tải lại bảng đó
        if(classId && document.getElementById("class-tuition-modal").style.display === "flex") {
             await showTuitionManagementForClass(classId);
        }

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

    // --- THÊM KIỂM TRA ---
    if (!selectedBranchId) {
        console.error("Lỗi autoExtend: Chưa chọn cơ sở.");
        return;
    }
    const classId = document.getElementById("tuition-modal-class-id").value;
    // --- KẾT THÚC KIỂM TRA ---

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
        // --- THAY ĐỔI: Sử dụng getBranchRef ---
        const paymentRef = getBranchRef(`${DB_PATHS.STUDENTS}/${studentId}/paymentHistory/${paymentId}`);
        // --- KẾT THÚC THAY ĐỔI ---
        await paymentRef.remove();

        // Lấy thông tin để log
        const studentName = document.getElementById("tuition-student-name").textContent;
        // Có thể cần lấy thêm thông tin payment bị xóa nếu muốn log chi tiết hơn
        await logActivity(`Đã xóa một khoản thanh toán học phí của ${studentName} tại cơ sở ${selectedBranchId}`);

        Swal.fire({ icon: 'success', title: 'Đã xóa!', text: 'Khoản thanh toán đã được xóa.', timer: 1500, showConfirmButton: false });

        // Tải lại modal chi tiết
        await showTuitionModal(studentId, classId);
         // Nếu đang xem từ bảng tổng quan lớp, tải lại bảng đó
        if(classId && document.getElementById("class-tuition-modal").style.display === "flex") {
             await showTuitionManagementForClass(classId);
        }

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
        console.log("Listener: Dữ liệu người dùng (chung) đã cập nhật."); // Thêm log
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
         // Cập nhật dropdown giáo viên/trợ giảng nếu form đang mở
         if (document.getElementById('class-form-modal').style.display === 'flex') {
             populateTeacherDropdown();
             populateAssistantTeacherDropdown();
         }
         if (document.getElementById('temp-class-form-modal').style.display === 'flex') {
             populatePersonnelDropdown(document.getElementById('temp-class-teacher'));
             populatePersonnelDropdown(document.getElementById('temp-class-assistant'));
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

    // --- THÊM KIỂM TRA ---
    if (!selectedBranchId) {
        Swal.fire("Lỗi", "Chưa chọn cơ sở làm việc.", "error");
        return;
    }
    // --- KẾT THÚC KIỂM TRA ---

    const classId = document.getElementById("change-schedule-class-id").value;
    const changeDateStr = document.getElementById("change-schedule-date").value;
    if (!classId || !changeDateStr) {
        Swal.fire("Lỗi", "Thiếu thông tin lớp học hoặc ngày áp dụng.", "error");
        return;
    }

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
            const classRef = getBranchRef(`${DB_PATHS.CLASSES}/${classId}`);
            const classSnap = await classRef.once('value');
            const classData = classSnap.val();
            if (!classData) throw new Error("Không tìm thấy lớp học.");

            // ... giữ nguyên logic xóa và đếm buổi học cũ ...
            const allSessions = classData.sessions || {};
            const attendanceSnap = await getBranchRef(`${DB_PATHS.ATTENDANCE}/${classId}`).once('value');
            const allAttendance = attendanceSnap.val() || {};
            const updates = {};
            const basePath = `branches/${selectedBranchId}/${DB_PATHS.CLASSES}/${classId}`;
            let pastSessionsCount = 0;
           for (const dateKey in allSessions) {
                // Chỉ xóa các buổi SAU hoặc BẰNG ngày thay đổi
                if (dateKey >= changeDateStr) {
                    let isAttendedByAny = false;
                    // Kiểm tra xem có ai đã điểm danh buổi này chưa
                    for (const studentId in allAttendance) {
                        if (allAttendance[studentId]?.[dateKey]?.attended === true) {
                            isAttendedByAny = true;
                            break;
                        }
                    }
                    // Nếu CHƯA có ai điểm danh -> Xóa buổi này
                    if (!isAttendedByAny) {
                         // --- THAY ĐỔI: Đường dẫn xóa ---
                        updates[`/${basePath}/sessions/${dateKey}`] = null;
                         // --- KẾT THÚC THAY ĐỔI ---
                    } else {
                        // Nếu đã có người điểm danh -> Không xóa, coi như buổi đã qua
                        pastSessionsCount++;
                         console.log(`Buổi ${dateKey} đã có người điểm danh, sẽ được giữ lại.`);
                    }
                } else {
                    // Các buổi trước ngày thay đổi -> Tăng số buổi đã qua
                    pastSessionsCount++;
                }
            }
             console.log(`Số buổi học tính đến trước khi áp dụng lịch mới: ${pastSessionsCount}`);
            
            // Tính số buổi cần tạo mới (logic giữ nguyên)
            let totalSessionsForCourse = 0;
            if (classData.classType === 'Lớp chứng chỉ') {
                totalSessionsForCourse = certificateCourses[classData.certificateType]?.find(c => c.name === classData.courseName)?.sessions || 0;
            } else if (classData.classType === 'Lớp tiếng Anh phổ thông' || classData.classType === 'Lớp các môn trên trường') {
                // Lớp thường: Tính tổng số buổi đã có + 16 (hoặc một số lượng đủ lớn)
                // Hoặc dựa vào tổng số buổi của gói học viên? Logic này cần xem lại
                totalSessionsForCourse = (Object.keys(allSessions).length - Object.keys(updates).length) + 24; // Tạm tính = số buổi còn lại + 24 buổi mới
                 console.log(`Tính toán cho lớp thường: ${Object.keys(allSessions).length} (tổng cũ) - ${Object.keys(updates).filter(k=>k.includes('/sessions/')).length} (xóa) + 24 (mới) = ${totalSessionsForCourse}`);
            }

            let sessionsToGenerate = totalSessionsForCourse > 0 ? totalSessionsForCourse - pastSessionsCount : 0;
            sessionsToGenerate = Math.max(0, sessionsToGenerate); // Đảm bảo không âm
             console.log(`Số buổi cần tạo mới: ${sessionsToGenerate}`);
            
            if (sessionsToGenerate > 0) {
                // Tạo các buổi mới từ changeDateStr với newFixedSchedule
                const newSessions = generateRollingSessions(changeDateStr, sessionsToGenerate, newFixedSchedule);
                for(const dateKey in newSessions) {
                    // Chỉ thêm nếu ngày đó không nằm trong danh sách xóa (mặc dù đã lọc ở trên)
                    // và đảm bảo không ghi đè buổi đã điểm danh (nếu có)
                     if (!updates[`/${basePath}/sessions/${dateKey}`] && !(allSessions[dateKey] && dateKey >= changeDateStr)) { // Kiểm tra kỹ hơn
                         // --- THAY ĐỔI: Đường dẫn thêm ---
                         updates[`/${basePath}/sessions/${dateKey}`] = newSessions[dateKey];
                         // --- KẾT THÚC THAY ĐỔI ---
                     }
                }
            }

            updates[`/${basePath}/fixedSchedule`] = newFixedSchedule;
            updates[`/${basePath}/updatedAt`] = firebase.database.ServerValue.TIMESTAMP; // Thêm updatedAt
            
            // Thực hiện cập nhật hàng loạt
            if (Object.keys(updates).length > 0) {
                 await database.ref().update(updates);
                 await logActivity(`Đã thay đổi lịch học cho lớp ${classData.name} tại cơ sở ${selectedBranchId} áp dụng từ ${changeDateStr}`);
                 hideChangeScheduleModal();
                 Swal.fire('Thành công!', 'Lịch học đã được cập nhật.', 'success');
                 // Quan trọng: Cần tải lại dữ liệu lớp học để listener cập nhật allClassesData
                 // hoặc cập nhật thủ công allClassesData[classId]
                 allClassesData[classId] = (await classRef.once('value')).val(); // Đọc lại dữ liệu mới nhất
                 // Có thể cần render lại bảng điểm danh nếu đang mở
                 if(document.getElementById("class-attendance-modal-overlay").style.display === "flex") {
                     renderClassAttendanceTable(classId);
                 }

            } else {
                 Swal.fire('Không thay đổi', 'Không có cập nhật nào được thực hiện.', 'info');
                 hideChangeScheduleModal();
            }

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

    // --- THÊM KIỂM TRA ----
    if (!selectedBranchId) {console.error("Lỗi autoExtend: Chưa chọn cơ sở.");return;}
    // --- KẾT THÚC KIỂM TRA ---

    const studentId = document.getElementById("tuition-student-id").value;
    const classId = document.getElementById("tuition-modal-class-id").value;
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
        // --- THAY ĐỔI: Sử dụng getBranchRef ---
        const bookFeeRef = getBranchRef(`${DB_PATHS.STUDENTS}/${studentId}/bookFeeHistory`);
        // --- KẾT THÚC THAY ĐỔI ---
        await bookFeeRef.push(paymentData);

        await logActivity(`Ghi nhận thanh toán tiền sách (${bookTitle}) ${amountPaid.toLocaleString('vi-VN')} cho ${document.getElementById("tuition-student-name").textContent} tại cơ sở ${selectedBranchId}`);

        Swal.fire({ icon: 'success', title: 'Thành công!', text: 'Đã ghi nhận thanh toán tiền sách.', timer: 1500, showConfirmButton: false });

        // Reset lại các lựa chọn sách sau khi lưu
        document.getElementById("book-fee-payment-form").reset(); // Reset form thay vì từng input
        document.getElementById("book-selection-container").innerHTML = '';
        document.getElementById("book-fee-title-final").value = '';

        // Tải lại modal chi tiết của học viên
        await showTuitionModal(studentId, classId);
         // Tải lại bảng tổng quan tiền sách lớp nếu đang mở
        if(classId && document.getElementById("class-book-fee-modal").style.display === "flex") {
            await showClassBookFeeModal(classId);
        }

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

    // --- THÊM KIỂM TRA ---
    if (!selectedBranchId) {console.error("Lỗi autoExtend: Chưa chọn cơ sở.");return;}
    const classId = document.getElementById("tuition-modal-class-id").value;
    // --- KẾT THÚC KIỂM TRA ---

    const result = await Swal.fire({
        title: 'Bạn chắc chắn muốn xóa?',
        text: "Hành động này sẽ xóa vĩnh viễn khoản thanh toán tiền sách này!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Vâng, xóa nó!',
        cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) return;
        showLoading(true);
        try {
        // --- THAY ĐỔI: Sử dụng getBranchRef ---
        const paymentRef = getBranchRef(`${DB_PATHS.STUDENTS}/${studentId}/bookFeeHistory/${paymentId}`);
        // --- KẾT THÚC THAY ĐỔI ---
        await paymentRef.remove();

        // Log hành động
        const studentName = document.getElementById("tuition-student-name").textContent;
        await logActivity(`Đã xóa một khoản thanh toán tiền sách của ${studentName} tại cơ sở ${selectedBranchId}`);

        Swal.fire({ icon: 'success', title: 'Đã xóa!', text: 'Khoản thanh toán tiền sách đã được xóa.', timer: 1500, showConfirmButton: false });

        // Tải lại toàn bộ modal để cập nhật
        await showTuitionModal(studentId, classId);
        // Tải lại bảng tổng quan tiền sách lớp nếu đang mở
        if(classId && document.getElementById("class-book-fee-modal").style.display === "flex") {
            await showClassBookFeeModal(classId);
        }

    } catch (error) {
        console.error("Lỗi khi xóa tiền sách:", error);
        Swal.fire("Lỗi", "Không thể xóa thanh toán: " + error.message, "error");
    } finally {
        showLoading(false);
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
     // --- THÊM KIỂM TRA ---
    if (!selectedBranchId || !studentId) {
        console.error("Lỗi: Không xác định cơ sở/học viên khi khởi tạo chọn sách.");
        populateMainBookDropdown(null); // Hiển thị tất cả nếu lỗi
        return;
    }
    // --- KẾT THÚC KIỂM TRA ---
    try {
        // --- THAY ĐỔI: Sử dụng getBranchRef ---
        const studentSnap = await getBranchRef(`${DB_PATHS.STUDENTS}/${studentId}`).once('value');
        // --- KẾT THÚC THAY ĐỔI ---
        const student = studentSnap.val();
        let classId = null;
        let classData = null;

        // Tìm lớp học HIỆN TẠI của học viên (ưu tiên lớp đang active)
        if (student && student.classes) {
            // Sử dụng hàm findActiveStudentClassId để tìm lớp phù hợp nhất
             classId = findActiveStudentClassId(studentId, student); // Hàm này đọc allClassesData đã load đúng nhánh
        }

        if (classId) {
             // Lấy classData từ biến toàn cục
             classData = allClassesData[classId];
        }

        // Logic xác định ngôn ngữ dựa trên tên lớp (giữ nguyên)
        let language = null;
        if (classData && classData.name) {
            const classNameLower = classData.name.toLowerCase();
            if (classNameLower.includes('trung') || classNameLower.includes('hsk') || classNameLower.includes('yct')) {
                language = 'chinese';
            } else if (classNameLower.includes('anh') || classNameLower.includes('ielts') || classNameLower.includes('oxford') || classNameLower.includes('thpt') || classNameLower.includes('thcs') || classNameLower.includes('tiểu học') || classNameLower.includes('mầm non')) { // Thêm các từ khóa tiếng Anh
                language = 'english';
            }
             // Có thể thêm logic cho các môn học khác nếu cần
        }

        // Điền dropdown dựa trên ngôn ngữ đã xác định
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

    if (!selectedBranchId) {
        Swal.fire("Lỗi", "Chưa chọn cơ sở làm việc.", "error");
        return;
    }
try { // Thêm try...catch
        // --- THAY ĐỔI ---
        await getBranchRef(`${DB_PATHS.STUDENTS}/${id}`).update({ status: 'active', deletedAt: null }); // Xóa cả deletedAt
        // --- KẾT THÚC THAY ĐỔI ---
        Swal.fire('Đã khôi phục!', 'Học viên đã được đưa trở lại danh sách.', 'success');
        // Listener sẽ tự cập nhật allStudentsData, chỉ cần render lại trang thùng rác
        renderTrashPage();
    } catch (error) {
         Swal.fire('Lỗi', 'Không thể khôi phục học viên: ' + error.message, 'error');
    }
}

// Xóa vĩnh viễn học viên
async function permanentlyDeleteStudent(id) {

    if (!selectedBranchId) {
        Swal.fire("Lỗi", "Chưa chọn cơ sở làm việc.", "error");
        return;
    }

    const isConfirmed = await Swal.fire({
        title: 'Bạn chắc chắn muốn XÓA VĨNH VIỄN?',
        text: "Hành động này không thể hoàn tác!",
        icon: 'error',
        showCancelButton: true,
        confirmButtonText: 'Xóa vĩnh viễn'
    }).then(result => result.isConfirmed);

    if (isConfirmed) {
        showLoading(true);
        try { // Thêm try...catch
            // --- THAY ĐỔI ---
            await getBranchRef(`${DB_PATHS.STUDENTS}/${id}`).remove();
            // --- KẾT THÚC THAY ĐỔI ---
            Swal.fire('Đã xóa!', 'Học viên đã bị xóa vĩnh viễn.', 'success');
            // Xóa khỏi dữ liệu local để cập nhật ngay lập tức
            if (allStudentsData[id]) {
                 delete allStudentsData[id];
            }
            renderTrashPage();
        } catch (error) {
             Swal.fire('Lỗi', 'Không thể xóa vĩnh viễn học viên: ' + error.message, 'error');
        } finally {
            showLoading(false);
        }
    }
}

// Khôi phục lớp học
async function restoreClass(id) {

     if (!selectedBranchId) {
        Swal.fire("Lỗi", "Chưa chọn cơ sở làm việc.", "error");
        return;
    }
try { // Thêm try...catch
        // --- THAY ĐỔI ---
        await getBranchRef(`${DB_PATHS.CLASSES}/${id}`).update({ status: 'active', deletedAt: null }); // Xóa cả deletedAt
        // --- KẾT THÚC THAY ĐỔI ---
        Swal.fire('Đã khôi phục!', 'Lớp học đã được đưa trở lại danh sách.', 'success');
        renderTrashPage();
     } catch (error) {
          Swal.fire('Lỗi', 'Không thể khôi phục lớp học: ' + error.message, 'error');
     }
}

// Xóa vĩnh viễn lớp học
async function permanentlyDeleteClass(id) {

    if (!selectedBranchId) {
        Swal.fire("Lỗi", "Chưa chọn cơ sở làm việc.", "error");
        return;
    }

    const isConfirmed = await Swal.fire({
        title: 'Bạn chắc chắn muốn XÓA VĨNH VIỄN?',
        text: "Hành động này không thể hoàn tác và sẽ xóa toàn bộ dữ liệu liên quan đến lớp học này!",
        icon: 'error',
        showCancelButton: true,
        confirmButtonText: 'Xóa vĩnh viễn'
    }).then(result => result.isConfirmed);

    if (isConfirmed) {
        showLoading(true);
        try {
            // Lấy thông tin lớp học TỪ CHI NHÁNH HIỆN TẠI
            const classData = allClassesData[id];
            const studentIds = classData ? Object.keys(classData.students || {}) : [];
            const className = classData?.name || 'Không rõ tên';

            // --- THAY ĐỔI: Tạo đường dẫn đầy đủ trong updates ---
            const updates = {};
            const basePath = `branches/${selectedBranchId}`;

            // Đánh dấu lớp học sẽ bị xóa
            updates[`/${basePath}/${DB_PATHS.CLASSES}/${id}`] = null;
            // Xóa cả điểm danh của lớp này
            updates[`/${basePath}/${DB_PATHS.ATTENDANCE}/${id}`] = null;
            // Xóa cả điểm danh nhân sự của lớp này
            updates[`/${basePath}/${DB_PATHS.PERSONNEL_ATTENDANCE}/${id}`] = null;
            // Xóa cả điểm số (nếu có node riêng)
            updates[`/${basePath}/${DB_PATHS.HOMEWORK_SCORES}/${id}`] = null;

            // Đánh dấu để xóa ID lớp này khỏi hồ sơ của từng học viên
            studentIds.forEach(studentId => {
                updates[`/${basePath}/${DB_PATHS.STUDENTS}/${studentId}/classes/${id}`] = null;
                // Có thể cân nhắc xóa cả bookPayments[classId] của học viên nếu cần
                // updates[`/${basePath}/${DB_PATHS.STUDENTS}/${studentId}/bookPayments/${id}`] = null;
            });
            // --- KẾT THÚC THAY ĐỔI ---

            // Thực hiện xóa đồng bộ
            await database.ref().update(updates);

            // Ghi log (không cần thêm cơ sở vì hàm logActivity đã làm)
            await logActivity(`Đã xóa vĩnh viễn lớp: ${className}`);

            Swal.fire('Đã xóa!', 'Lớp học và dữ liệu liên quan đã bị xóa vĩnh viễn.', 'success');

            // Cập nhật lại dữ liệu local và giao diện
             if (allClassesData[id]) {
                delete allClassesData[id];
             }
             // Nên xóa cả dữ liệu attendance khỏi biến toàn cục nếu có
             // if (allAttendanceData[id]) delete allAttendanceData[id];
             // if (allPersonnelAttendanceData[id]) delete allPersonnelAttendanceData[id];
             // if (allHomeworkScoresData[id]) delete allHomeworkScoresData[id];

            renderTrashPage();

        } catch (error) {
            console.error("Lỗi khi xóa vĩnh viễn lớp học:", error);
            Swal.fire("Lỗi!", "Không thể xóa lớp học: " + error.message, "error");
        } finally {
            showLoading(false);
        }
    }
}
// HÀM MỚI: Cập nhật giao diện dựa trên vai trò người dùng
function updateUIAccessByRole(userData) {
    const role = userData?.role;

    // Vai trò có toàn quyền truy cập
    const isFullAccess = role === 'Admin' || role === 'Hội Đồng';
    // Vai trò Admin (quyền cao nhất)
    const isAdmin = role === 'Admin';

    // Lấy các mục menu cần ẩn/hiện
    const restrictedNavItems = [
        document.getElementById('nav-student'),
        document.getElementById('nav-personnel'),
        document.getElementById('nav-account'),
        document.getElementById('nav-tuition')
    ];

    // Ẩn hoặc hiện các mục menu dựa trên quyền
    restrictedNavItems.forEach(item => {
        if (item) {
            item.style.display = isFullAccess ? 'list-item' : 'none';
        }
    });

    // Giữ nguyên logic cũ cho các phần tử khác
    const trashCard = document.querySelector('a[href="#trash-management"]');
    if (trashCard) {
        trashCard.style.display = isFullAccess ? 'block' : 'none';
    }

    const activityLogNav = document.getElementById('nav-activity-log');
    if (activityLogNav) {
        activityLogNav.style.display = isAdmin ? 'list-item' : 'none';
    }

    const recalcButton = document.getElementById('recalculate-sessions-btn');
    if (recalcButton) {
        recalcButton.style.display = isAdmin ? 'block' : 'none';
    }

    const cycleReportBtn = document.getElementById('export-cycle-report-btn');
    if (cycleReportBtn) {
        cycleReportBtn.style.display = isFullAccess ? 'inline-flex' : 'none';
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

    // --- THÊM KIỂM TRA ---
    if (!selectedBranchId) {
        Swal.fire("Lỗi", "Chưa chọn cơ sở làm việc.", "error");
        return;
    }
    if (!classId || !dateToDelete) {
        Swal.fire("Lỗi", "Không xác định được buổi học cần xóa.", "error");
        return;
    }
    // --- KẾT THÚC KIỂM TRA ---

    showLoading(true);
    const modal = document.getElementById('class-book-fee-modal');
    const studentListBody = document.getElementById("class-book-fee-student-list");
    studentListBody.innerHTML = ''; 

    try {
        // --- THAY ĐỔI: Sử dụng getBranchRef để đọc lớp ---
        const classSnap = await getBranchRef(`${DB_PATHS.CLASSES}/${classId}`).once('value');
        // --- KẾT THÚC THAY ĐỔI ---
        const classData = classSnap.val();
        if (!classData) throw new Error("Không tìm thấy dữ liệu lớp học.");

        document.getElementById("class-book-fee-name").textContent = classData.name || "Không tên";
        document.getElementById("update-book-class-id").value = classId; // Lưu classId vào form ẩn

        // Lấy thông tin đợt sách hiện tại (giữ nguyên logic)
        const currentDriveId = classData.currentBookDriveId;
        const currentBookInfo = (currentDriveId && classData.bookDrives) ? classData.bookDrives[currentDriveId] : {};

        const studentIds = Object.keys(classData.students || {});
        if (studentIds.length === 0) {
            studentListBody.innerHTML = '<tr><td colspan="5">Lớp này chưa có học viên.</td></tr>';
            modal.style.display = "flex";
            showLoading(false);
            return;
        }
        const studentPromises = studentIds.map(id => getBranchRef(`${DB_PATHS.STUDENTS}/${id}`).once('value'));
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
        console.error("Lỗi khi hiển thị tổng quan tiền sách:", error);
        studentListBody.innerHTML = `<tr><td colspan="5">Có lỗi xảy ra: ${error.message}</td></tr>`;
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

    // --- THÊM KIỂM TRA ---
    if (!selectedBranchId) {console.error("Lỗi autoExtend: Chưa chọn cơ sở.");return;}
    // --- KẾT THÚC KIỂM TRA ---

    const classId = document.getElementById("update-book-class-id").value;
    const bookName = document.getElementById("class-book-name").value.trim();
    const bookType = document.getElementById("class-book-type").value.trim();
    const bookFee = parseInt(document.getElementById("class-book-fee").value) || 0;

    if (!bookName || bookFee < 0) {
        Swal.fire("Lỗi", "Vui lòng nhập Tên sách và Tiền sách hợp lệ.", "error");
        return;
    }

    showLoading(true);
    try {
        // 1. Tạo một "đợt thu tiền sách" mới bằng lệnh push() để có ID duy nhất
        const bookDrivesRef = getBranchRef(`${DB_PATHS.CLASSES}/${classId}/bookDrives`);
        const currentDriveIdRef = getBranchRef(`${DB_PATHS.CLASSES}/${classId}/currentBookDriveId`);
        const newDriveRef = await bookDrivesRef.push({
            bookName: bookName,
            bookType: bookType,
            bookFee: bookFee,
            createdAt: new Date().toISOString().split("T")[0] // Lưu ngày tạo đợt thu
        });

        // 2. Lấy ID của đợt mới và đặt nó làm "đợt thu hiện tại" của lớp
        await currentDriveIdRef.set(newDriveId);

        // Log hành động
        const className = allClassesData[classId]?.name || classId;
        await logActivity(`Cập nhật/Thêm đợt thu tiền sách "${bookName}" (${bookFee.toLocaleString('vi-VN')}) cho lớp ${className} tại cơ sở ${selectedBranchId}`);

        document.getElementById("update-class-book-modal").style.display = "none";
        Swal.fire("Thành công!", "Đã tạo/cập nhật đợt thu tiền sách mới cho lớp.", "success");

        // Tải lại modal tổng quan
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

    // --- THÊM KIỂM TRA ---
    if (!selectedBranchId) {
        console.error("Lỗi: Chưa chọn cơ sở khi tick tiền sách.");
        return;
    }
    // --- KẾT THÚC KIỂM TRA ---

    if (!driveId || driveId === 'undefined') {
        Swal.fire("Lỗi", "Chưa có đợt thu tiền sách nào được tạo cho lớp này.", "error");
        const checkbox = event?.target; // Lấy checkbox từ sự kiện (nếu có)
        if (checkbox) checkbox.checked = !isPaid;
        return;
    }
    // Đường dẫn mới, lưu trạng thái theo từng đợt sách
    const statusRef = getBranchRef(`${DB_PATHS.STUDENTS}/${studentId}/bookPayments/${classId}/${driveId}`);
    try {
        if (isPaid) {
            await statusRef.set({
                paid: true,
                paidDate: new Date().toISOString().split("T")[0],
                recordedBy: currentUserData?.name || "System" // Thêm ?. cho an toàn
            });
             // Log hành động
             const studentName = allStudentsData[studentId]?.name || studentId;
             const className = allClassesData[classId]?.name || classId;
             // Lấy tên sách từ driveId (cần đọc lại classData hoặc lưu tạm)
             const bookName = allClassesData[classId]?.bookDrives?.[driveId]?.bookName || '?';
             await logActivity(`Xác nhận ${studentName} đã đóng tiền sách "${bookName}" lớp ${className} tại cơ sở ${selectedBranchId}`);
        } else {
            await statusRef.remove();
             // Log hành động hủy
             const studentName = allStudentsData[studentId]?.name || studentId;
             const className = allClassesData[classId]?.name || classId;
             const bookName = allClassesData[classId]?.bookDrives?.[driveId]?.bookName || '?';
             await logActivity(`Hủy xác nhận đóng tiền sách "${bookName}" của ${studentName} lớp ${className} tại cơ sở ${selectedBranchId}`);
        }
         // Không cần reload modal ở đây, chỉ cần cập nhật thành công là được
         console.log(`Cập nhật trạng thái đóng tiền sách drive ${driveId} cho ${studentId}: ${isPaid}`);

    } catch (error) {
        console.error("Lỗi cập nhật trạng thái tiền sách:", error);
         // Nếu lỗi, có thể cần reload lại modal để đảm bảo đồng bộ
         showClassBookFeeModal(classId);
    }
}
// Xem lịch sử đóng tiền sách của học viên
async function showBookFeeHistory(studentId, classId) {

    // --- THÊM KIỂM TRA ---
    if (!selectedBranchId) {
        console.error("Lỗi: Chưa chọn cơ sở khi tick tiền sách.");
        return;
    }
    // --- KẾT THÚC KIỂM TRA ---

    showLoading(true);
    try {
        // --- THAY ĐỔI: Sử dụng getBranchRef ---
        const studentSnap = await getBranchRef(`${DB_PATHS.STUDENTS}/${studentId}`).once('value');
        const classSnap = await getBranchRef(`${DB_PATHS.CLASSES}/${classId}`).once('value');
        // --- KẾT THÚC THAY ĐỔI ---

        const student = studentSnap.val();
        const classData = classSnap.val();

        if (!student || !classData) {
             Swal.fire("Lỗi", "Không tìm thấy dữ liệu học viên hoặc lớp học.", "error");
             return;
        }

        const allDrives = classData.bookDrives || {};
        // Lấy dữ liệu thanh toán của lớp này thôi
        const studentPaymentsForClass = student.bookPayments ? (student.bookPayments[classId] || {}) : {};

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
           const payment = studentPaymentsForClass[driveId];
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
            title: `Lịch sử đóng tiền sách<br><small>${student.name} - Lớp: ${classData.name}</small>`,
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

    // --- THÊM KIỂM TRA ---
    if (!selectedBranchId) {
        console.error("Lỗi: Chưa chọn cơ sở khi tick tiền sách.");
        return;
    }
    // --- KẾT THÚC KIỂM TRA ---

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

    if (result.isConfirmed) return;
        showLoading(true);
        try {
            // --- THAY ĐỔI: Sử dụng getBranchRef để đọc lớp ---
        const classRef = getBranchRef(`${DB_PATHS.CLASSES}/${classId}`);
        // --- KẾT THÚC THAY ĐỔI ---
        const classSnap = await classRef.once('value');
        const classData = classSnap.val();
        if (!classData) throw new Error("Không tìm thấy dữ liệu lớp.");

        const studentIds = Object.keys(classData.students || {});
        const updates = {};
        const className = classData.name || 'Không rõ tên';
        // --- THAY ĐỔI: Tạo basePath ---
        const basePath = `branches/${selectedBranchId}`;
        // --- KẾT THÚC THAY ĐỔI ---

        // 1. Xóa thông tin sách và các đợt thu của lớp trong đúng nhánh
        updates[`/${basePath}/${DB_PATHS.CLASSES}/${classId}/bookDrives`] = null;
        updates[`/${basePath}/${DB_PATHS.CLASSES}/${classId}/currentBookDriveId`] = null;
        // Giữ lại bookInfo cũ nếu có, chỉ xóa drives và currentDriveId
        // updates[`/${basePath}/${DB_PATHS.CLASSES}/${classId}/bookInfo`] = null; // Bỏ dòng này nếu muốn giữ bookInfo

        // 2. Xóa lịch sử đóng tiền sách của từng học viên trong lớp đó trong đúng nhánh
        studentIds.forEach(studentId => {
            updates[`/${basePath}/${DB_PATHS.STUDENTS}/${studentId}/bookPayments/${classId}`] = null;
            // Xóa cả cấu trúc cũ nếu còn tồn tại
            // updates[`/${basePath}/${DB_PATHS.STUDENTS}/${studentId}/bookFeeStatus/${classId}`] = null;
        });

        // 3. Gửi một lệnh cập nhật duy nhất lên Firebase
        await database.ref().update(updates);
        await logActivity(`Đã reset tiền sách cho lớp: ${className} tại cơ sở ${selectedBranchId}`);

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
 * HÀM MỚI: Cập nhật trạng thái thông báo (Zalo/Điện thoại) cho học viên
 */
async function updateNotificationStatus(studentId, type, isChecked) {

    // --- THÊM KIỂM TRA ---
    if (!selectedBranchId || !studentId) {
        console.error("Lỗi: Không xác định cơ sở hoặc học viên khi cập nhật trạng thái thông báo.");
        // Tìm checkbox và đặt lại trạng thái cũ
        const checkbox = event?.target;
        if(checkbox) checkbox.checked = !isChecked;
        return;
    }
    // --- KẾT THÚC KIỂM TRA ---

    try {
        // --- THAY ĐỔI: Sử dụng getBranchRef ---
        const statusRef = getBranchRef(`${DB_PATHS.STUDENTS}/${studentId}/notificationStatus/${type}`);
        // --- KẾT THÚC THAY ĐỔI ---
        await statusRef.set(isChecked);
        console.log(`Cập nhật notificationStatus.${type} = ${isChecked} cho ${studentId} tại ${selectedBranchId}`);
        // Không cần Swal thông báo thành công cho thao tác nhỏ này

        // Cập nhật lại biến toàn cục allStudentsData nếu cần thiết để UI khác đồng bộ
        if (allStudentsData[studentId]) {
             if (!allStudentsData[studentId].notificationStatus) {
                 allStudentsData[studentId].notificationStatus = {};
             }
             allStudentsData[studentId].notificationStatus[type] = isChecked;
        }

    } catch (error) {
        console.error("Lỗi khi cập nhật trạng thái thông báo:", error);
        Swal.fire("Lỗi", "Không thể lưu trạng thái thông báo.", "error");
         // Tìm checkbox và đặt lại trạng thái cũ
         const checkbox = event?.target;
         if(checkbox) checkbox.checked = !isChecked;
    }
}
/**
 * HÀM KIỂM TOÁN VÀ TÍNH TOÁN LẠI
 * Quét toàn bộ học viên, cộng dồn số buổi đã học từ tất cả các lớp Phổ thông (active/completed),
 * in ra báo cáo chi tiết và hỏi xác nhận trước khi ghi đè.
 */
async function auditAndRecalculateGeneralEnglish() {

// --- THÊM KIỂM TRA ---
    if (!selectedBranchId) {
        Swal.fire("Lỗi", "Chưa chọn cơ sở làm việc.", "error");
        return;
    }
    // --- KẾT THÚC KIỂM TRA ---

    console.clear();
    console.log(`Bắt đầu quá trình kiểm toán và tính toán lại cho cơ sở: ${selectedBranchId}...`);
    showLoading(true);

    try {
        // --- THAY ĐỔI: Sử dụng getBranchRef ---
        const [studentsSnap, attendanceSnap, classesSnap] = await Promise.all([
            getBranchRef(DB_PATHS.STUDENTS).once('value'),       // Đọc students của nhánh hiện tại
            getBranchRef(DB_PATHS.ATTENDANCE).once('value'),     // Đọc attendance của nhánh hiện tại
            getBranchRef(DB_PATHS.CLASSES).once('value')         // Đọc classes của nhánh hiện tại
        ]);
        // --- KẾT THÚC THAY ĐỔI ---

        // Lấy dữ liệu toàn cục (chung)
        const usersSnap = await database.ref(DB_PATHS.USERS).once('value'); // Users vẫn là chung

        const allStudentsInBranch = studentsSnap.val() || {};
        const allAttendanceInBranch = attendanceSnap.val() || {};
        const allClassesInBranch = classesSnap.val() || {};
        // allUsersData = usersSnap.val() || {}; // Cập nhật users nếu cần

        const auditLogs = [];
        const updates = {};
        let studentsProcessed = 0;

        // Lặp qua học viên TRONG CHI NHÁNH HIỆN TẠI
        for (const studentId in allStudentsInBranch) {
            studentsProcessed++;
            const studentData = allStudentsInBranch[studentId];

            // Tìm lớp phổ thông hợp lệ TRONG CHI NHÁNH HIỆN TẠI
            const applicableClasses = [];
            if (studentData.classes) {
                for (const classId in studentData.classes) {
                    // Lấy classData từ dữ liệu đã đọc của nhánh
                    const classData = allClassesInBranch[classId];
                    const isGeneralClass = classData?.classType === 'Lớp tiếng Anh phổ thông' || classData?.classType === 'Lớp các môn trên trường';
                    const isActiveOrCompleted = classData && (classData.status !== 'deleted');

                    if (isGeneralClass && isActiveOrCompleted) {
                        applicableClasses.push({ id: classId, name: classData.name || 'Không tên', type: classData.classType }); // Lưu lại type để kiểm tra
                    }
                }
            }

            // Cộng dồn số buổi từ attendance TRONG CHI NHÁNH HIỆN TẠI
            let totalAttendedCount = 0;
            console.log(`\n--- Đang xử lý học viên: ${studentData.name || studentId} ---`); // Log tên học viên

            applicableClasses.forEach(cls => {
                const classId = cls.id;
                const classData = allClassesInBranch[classId]; // Lấy lại classData để kiểm tra type
                console.log(` -> Đang quét lớp: "${cls.name}" (Type: ${cls.type})`); // Log cả classType
                if (allAttendanceInBranch[classId]?.[studentId]) {
                    const studentAttendanceInClass = allAttendanceInBranch[classId][studentId];

                    let countForThisClass = 0; // Đếm riêng cho lớp này để debug

                    // Sắp xếp ngày cho dễ theo dõi log
                    const sortedDates = Object.keys(studentAttendanceInClass).sort();
                    for (const date of sortedDates) {
                        const sessionExists = classData?.sessions?.[date] || classData?.exams?.[date];
                        const attended = studentAttendanceInClass[date]?.attended === true;

                        if (sessionExists && attended) {
                            const isExam = classData?.exams?.[date];

                            // === LOGIC ĐẾM ĐƯỢC SỬA LẠI ===
                            let shouldCount = false;
                            // 1. Nếu là lớp "Các môn trên trường" -> Luôn đếm (cả exam)
                            if (cls.type === 'Lớp các môn trên trường') {
                                shouldCount = true;
                                console.log(`    [${date}]: Lớp môn trường & đã điểm danh -> ĐẾM`);
                            }
                            // 2. Nếu là lớp "Phổ thông" -> Luôn đếm (cả exam)
                            else if (cls.type === 'Lớp tiếng Anh phổ thông') {
                                shouldCount = true;
                                console.log(`    [${date}]: Lớp phổ thông & đã điểm danh -> ĐẾM`);
                            }
                            // 3. (Trường hợp khác - Lớp chứng chỉ đã bị loại từ trước, nhưng để đây cho rõ)
                            // else if (cls.type === 'Lớp chứng chỉ') {
                            //     shouldCount = !isExam; // Chỉ đếm buổi thường
                            // }

                            if (shouldCount) {
                                totalAttendedCount++;
                                countForThisClass++;
                            } else {
                                 console.log(`    [${date}]: Đã điểm danh nhưng không được tính (logic loại trừ).`);
                            }
                        } else if (attended) {
                             console.log(`    [${date}]: Đã điểm danh nhưng buổi học/thi không còn tồn tại -> KHÔNG ĐẾM`);
                        }
                    }
                    console.log(` -> Số buổi được đếm từ lớp "${cls.name}": ${countForThisClass}`);
                } else {
                     console.log(` -> Không có dữ liệu điểm danh cho học viên này trong lớp.`);
                }
            });
            console.log(` -> Tổng số buổi đếm được cuối cùng: ${totalAttendedCount}`);
            // --- Kết thúc phần đếm ---

            // --- BƯỚC C: GHI NHẬN KẾT QUẢ ---
            const currentAttendedCount = studentData.sessionsAttended || 0;
            const classNames = applicableClasses.map(c => c.name).join(', ') || 'Không có';
            const status = currentAttendedCount === totalAttendedCount ? "(Đã đúng)" : "(Cần cập nhật)";
            auditLogs.push(`Học viên: ${studentData.name} | Số cũ: ${currentAttendedCount} -> Số mới: ${totalAttendedCount} ${status} | Quét từ lớp: [${classNames}]`);
            
            // Luôn ghi đè, kể cả khi không thay đổi
            updates[`/branches/${selectedBranchId}/${DB_PATHS.STUDENTS}/${studentId}/sessionsAttended`] = totalAttendedCount;
        }
        
        // --- BƯỚC D: HIỂN THỊ BÁO CÁO VÀ HỎI XÁC NHẬN ---
        console.log("%c--- BÁO CÁO KIỂM TOÁN CHI TIẾT ---", "font-weight: bold; font-size: 18px; color: blue;");
        auditLogs.forEach(log => console.log(log));
        console.log("%c--- KẾT THÚC BÁO CÁO ---", "font-weight: bold; font-size: 18px; color: blue;");

        showLoading(false); // Tắt loading để người dùng xem console và hộp thoại

        const result = await Swal.fire({
            title: 'Kiểm toán hoàn tất!',
            html: `Hệ thống đã quét <b>${studentsProcessed}</b> học viên và đã in báo cáo chi tiết trong Console (F12).<br><br>Bạn có muốn <b>ghi đè</b> lại toàn bộ số buổi đã học không?`,
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'Có, ghi đè tất cả!',
            cancelButtonText: 'Không, chỉ xem báo cáo thôi'
        });

        if (result.isConfirmed) {
            showLoading(true);
            // --- THAY ĐỔI: Thực hiện update trên gốc DB ---
            await database.ref().update(updates); // updates đã chứa đường dẫn đầy đủ
            // --- KẾT THÚC THAY ĐỔI ---
            Swal.fire('Thành công!', `Đã ghi đè lại số buổi đã học cho ${studentsProcessed} học viên tại cơ sở ${selectedBranchId}.`, 'success');
             // Cập nhật lại allStudentsData cục bộ
             Object.keys(updates).forEach(path => {
                 const parts = path.split('/'); // Tách path
                 if (parts[1] === 'branches' && parts[3] === 'students') {
                     const branch = parts[2];
                     const studentId = parts[4];
                     const field = parts[5];
                     const value = updates[path];
                     if (branch === selectedBranchId && allStudentsData[studentId]) {
                         allStudentsData[studentId][field] = value;
                     }
                 }
             });
             // Vẽ lại bảng học viên nếu đang xem
             if(window.location.hash === '#student-management') {
                 applyStudentFilters();
             }

        } else {
             Swal.fire('Đã hủy', 'Không có thay đổi nào được thực hiện.', 'info');
        }

    } catch (error) {
        console.error("Lỗi trong quá trình kiểm toán:", error);
        Swal.fire("Lỗi!", "Đã xảy ra lỗi: " + error.message, "error");
    } finally {
        showLoading(false);
    }
}
/**
 * HÀM GỠ LỖI: Quét một học viên, cộng dồn số buổi từ các lớp Phổ thông,
 * và in ra báo cáo chi tiết quá trình.
 * @param {string} studentName - Tên chính xác của học viên cần gỡ lỗi.
 */
async function debugAuditForStudent(studentName) {
    if (!studentName) {
        console.error("Vui lòng nhập tên học viên.");
        return;
    }

    console.clear();
    console.log(`--- BẮT ĐẦU GỠ LỖI TÍNH TỔNG HỢP CHO: ${studentName} ---`);
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
        if (foundCount > 1) throw new Error(`Tìm thấy ${foundCount} học viên cùng tên.`);
        
        const [attendanceSnap, classesSnap] = await Promise.all([
            database.ref('attendance').once('value'),
            database.ref('classes').once('value')
        ]);
        const allAttendance = attendanceSnap.val() || {};
        const allClasses = classesSnap.val() || {};

        const detailedLogs = [];

        // --- BƯỚC A: TÌM TẤT CẢ CÁC LỚP PHỔ THÔNG HỢP LỆ CỦA HỌC VIÊN ---
        detailedLogs.push("--- BƯỚC A: TÌM CÁC LỚP PHỔ THÔNG HỢP LỆ ---");
        const applicableClasses = [];
        if (studentData.classes) {
            for (const classId in studentData.classes) {
                const classData = allClasses[classId];
                detailedLogs.push(`- Đang xét Lớp ID: ${classId} (Tên: ${classData?.name || 'Không rõ'})`);
                
                const isGeneralClass = classData?.classType === 'Lớp tiếng Anh phổ thông' || classData?.classType === 'Lớp các môn trên trường';
                const isActiveOrCompleted = classData && (classData.status !== 'deleted');

                if (isGeneralClass && isActiveOrCompleted) {
                    applicableClasses.push({ id: classId, name: classData.name });
                    detailedLogs.push(`  -> OK. Lớp hợp lệ, sẽ được đưa vào danh sách quét.`);
                } else {
                    detailedLogs.push(`  -> Bỏ qua. (Loại lớp: ${classData?.classType}, Trạng thái: ${classData?.status})`);
                }
            }
        }
        detailedLogs.push(`=> KẾT LUẬN: Sẽ cộng dồn điểm danh từ ${applicableClasses.length} lớp: [${applicableClasses.map(c => c.name).join(', ')}]`);

        // --- BƯỚC B: CỘNG DỒN SỐ BUỔI TỪ CÁC LỚP ĐÓ ---
        detailedLogs.push("\n--- BƯỚC B: BẮT ĐẦU ĐẾM ĐIỂM DANH ---");
        let totalAttendedCount = 0;
        applicableClasses.forEach(cls => {
            const classId = cls.id;
            detailedLogs.push(`\n* Đang quét lớp: "${cls.name}"`);
            if (allAttendance[classId]?.[studentId]) {
                const studentAttendanceInClass = allAttendance[classId][studentId];
                const classData = allClasses[classId];
                
                for (const date in studentAttendanceInClass) {
                    const sessionExists = classData.sessions?.[date] || classData.exams?.[date];
                    if (sessionExists && studentAttendanceInClass[date]?.attended === true) {
                        const isExam = classData.exams?.[date];
                        if (!isExam || (isExam && (classData.classType === 'Lớp tiếng Anh phổ thông' || classData.classType === 'Lớp các môn на trường'))) {
                            totalAttendedCount++;
                            detailedLogs.push(`  -> [${date}]: Đã tick. ĐẾM +1 (Tổng hiện tại: ${totalAttendedCount})`);
                        } else {
                            detailedLogs.push(`  -> [${date}]: Buổi thi lớp chứng chỉ. Bỏ qua.`);
                        }
                    } else if (!sessionExists && studentAttendanceInClass[date]?.attended === true) {
                         detailedLogs.push(`  -> [${date}]: Buổi học đã bị xóa. Bỏ qua.`);
                    }
                }
            } else {
                 detailedLogs.push(`  -> Không có dữ liệu điểm danh nào cho học viên trong lớp này.`);
            }
        });
        
        console.log("%c--- KẾT QUẢ ---", "font-weight: bold; font-size: 18px; color: blue;");
        console.log(`Tổng số buổi đã đóng (gói học): %c${studentData.totalSessionsPaid || 0}`, "font-weight: bold; color: orange;");
        console.log(`Số buổi đã học (hiện đang lưu trong DB): %c${studentData.sessionsAttended || 0}`, "font-weight: bold; color: red;");
        console.log(`Số buổi đếm được (kết quả tính toán lại): %c${totalAttendedCount}`, "font-weight: bold; color: green;");
        
        console.groupCollapsed("Xem chi tiết quá trình gỡ lỗi");
        detailedLogs.forEach(log => console.log(log));
        console.groupEnd();
        
    } catch (error) {
        console.error("Lỗi khi gỡ lỗi:", error);
        Swal.fire("Lỗi!", error.message, "error");
    } finally {
        showLoading(false);
    }
}
/**
 * HÀM KIỂM TOÁN VÀ XUẤT FILE (CẬP NHẬT):
 * Thêm chi tiết số buổi đã học theo từng lớp vào báo cáo.
 */
async function exportFullStudentAudit() {
    const result = await Swal.fire({
        title: 'Xuất báo cáo kiểm toán chi tiết?',
        text: "Hệ thống sẽ quét toàn bộ học viên, tạo báo cáo chi tiết (bao gồm ngày điểm danh cụ thể theo từng lớp) và xuất ra file .txt.",
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Vâng, bắt đầu!',
        cancelButtonText: 'Hủy'
    });

    if (!result.isConfirmed) return;

    console.log("Bắt đầu quá trình xuất báo cáo chi tiết...");
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

        const fullReport = [];

        for (const studentId in allStudents) {
            const studentData = allStudents[studentId];
            fullReport.push(`--- Báo cáo cho học viên: ${studentData.name} (ID: ${studentId}) ---`);
            
            const applicableClasses = [];
            if (studentData.classes) {
                for (const classId in studentData.classes) {
                    const classData = allClasses[classId];
                    const isGeneralClass = classData?.classType === 'Lớp tiếng Anh phổ thông' || classData?.classType === 'Lớp các môn trên trường';
                    const isActiveOrCompleted = classData && (classData.status !== 'deleted');
                    if (isGeneralClass && isActiveOrCompleted) {
                        applicableClasses.push({ id: classId, name: classData.name });
                    }
                }
            }
            
            // THAY ĐỔI 1: Lưu trữ chi tiết ngày học thay vì chỉ đếm
            const perClassDetails = {}; // Cấu trúc: { classId: ['date1', 'date2', ...] }
            let totalAttendedCount = 0;

            applicableClasses.forEach(cls => {
                const classId = cls.id;
                perClassDetails[classId] = []; // Khởi tạo mảng để lưu ngày

                if (allAttendance[classId]?.[studentId]) {
                    const studentAttendanceInClass = allAttendance[classId][studentId];
                    const classData = allClasses[classId];
                    
                    // Sắp xếp các ngày để báo cáo có thứ tự
                    const sortedDates = Object.keys(studentAttendanceInClass).sort();

                    for (const date of sortedDates) {
                        const sessionExists = classData.sessions?.[date] || classData.exams?.[date];
                        if (sessionExists && studentAttendanceInClass[date]?.attended === true) {
                            const isExam = classData.exams?.[date];
                            if (!isExam || (isExam && (classData.classType === 'Lớp tiếng Anh phổ thông' || classData.classType === 'Lớp các môn trên trường'))) {
                                perClassDetails[classId].push(date); // Thêm ngày vào mảng
                                totalAttendedCount++;
                            }
                        }
                    }
                }
            });

            fullReport.push(`  * Các lớp được quét: [${applicableClasses.map(c => c.name).join(', ') || 'Không có'}]`);
            fullReport.push(`  => KẾT QUẢ:`);
            fullReport.push(`     - Tổng số buổi đã đóng: ${studentData.totalSessionsPaid || 0}`);
            fullReport.push(`     - Số buổi đã học (hiện tại): ${studentData.sessionsAttended || 0}`);
            fullReport.push(`     - Số buổi đếm được (chính xác): ${totalAttendedCount}`);
            
            // THAY ĐỔI 2: Tạo chuỗi báo cáo chi tiết với ngày cụ thể
            if (totalAttendedCount > 0) {
                 fullReport.push(`     - Chi tiết điểm danh:`);
                 for (const classId in perClassDetails) {
                     const datesArray = perClassDetails[classId];
                     if (datesArray.length > 0) {
                         const className = allClasses[classId]?.name || 'Lớp không tên';
                         const count = datesArray.length;
                         // Định dạng lại ngày từ YYYY-MM-DD sang DD.M.YYYY
                         const formattedDates = datesArray.map(dateStr => {
                             const [year, month, day] = dateStr.split('-');
                             return `${parseInt(day)}.${parseInt(month)}.${year}`;
                         }).join(', ');

                         fullReport.push(`       + ${className}: ${count} buổi - (${formattedDates})`);
                     }
                 }
            }

            fullReport.push(`-----------------------------------------------------\n`);
        }
        
        const reportContent = fullReport.join('\n');
        const today = new Date().toISOString().split('T')[0];
        downloadToFile(reportContent, `BaoCaoChiTietDiemDanh_${today}.txt`, 'text/plain');

        Swal.fire('Hoàn tất!', 'Báo cáo chi tiết đã được tạo và đang được tải xuống.', 'success');

    } catch (error) {
        console.error("Lỗi khi xuất báo cáo:", error);
        Swal.fire("Lỗi!", "Đã xảy ra lỗi: " + error.message, "error");
    } finally {
        showLoading(false);
    }
}
/**
 * HÀM HỖ TRỢ: Tạo và tải về một file từ nội dung dạng chuỗi.
 * @param {string} content - Nội dung của file.
 * @param {string} filename - Tên file muốn lưu (ví dụ: 'report.txt').
 * @param {string} contentType - Loại nội dung (ví dụ: 'text/plain').
 */
function downloadToFile(content, filename, contentType) {
    const a = document.createElement('a');
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
}
/**
 * LỌC CÁC LỰA CHỌN TRONG HỘP THOẠI SWAL
 */
function filterSwalOptions() {
    const query = document.getElementById('swal-student-search').value.toLowerCase();
    const select = document.getElementById('swal-student-select');
    const options = select.getElementsByTagName('option');

    for (let i = 0; i < options.length; i++) {
        const optionText = options[i].textContent || options[i].innerText;
        if (optionText.toLowerCase().includes(query)) {
            options[i].style.display = '';
        } else {
            options[i].style.display = 'none';
        }
    }
}

/**
 * HÀM PHỤ ĐỂ DỰ ĐOÁN CÁC BUỔI HỌC TRONG TƯƠNG LAI
 */
function generateFutureSessions(startDateStr, count, schedule) {
  const sessions = [];
  if (count <= 0) return sessions;
  
  let cursorDate = new Date(startDateStr + 'T00:00:00');

  while (sessions.length < count) {
    cursorDate.setDate(cursorDate.getDate() + 1);
    
    const dayIndex = cursorDate.getDay();
    if (schedule[dayIndex]) {
      const dateKey = cursorDate.toISOString().split('T')[0];
      sessions.push(dateKey);
    }
  }
  return sessions;
}

/**
 * HIỂN THỊ HỘP THOẠI CHỌN HỌC VIÊN ĐỂ XEM BÁO CÁO
 */
async function showStudentSelectorForCycleReport() {
    showLoading(true);
    const validStudents = [];
    const classMap = new Map();

    for (const studentId in allStudentsData) {
        const student = allStudentsData[studentId];
        if (student.status === 'deleted') continue;

        const classId = findActiveStudentClassId(studentId, student);
        if (classId && allClassesData[classId] && allClassesData[classId].classType !== 'Lớp chứng chỉ') {
            validStudents.push({ id: studentId, name: student.name, classId: classId });
            if (!classMap.has(classId)) {
                classMap.set(classId, allClassesData[classId].name);
            }
        }
    }
    showLoading(false);

    if (validStudents.length === 0) {
        Swal.fire("Thông báo", "Không có học viên nào thuộc lớp phổ thông hoặc các môn trên trường để xem báo cáo.", "info");
        return;
    }

    let classFilterOptions = '<option value="">-- Tất cả các lớp --</option>';
    classMap.forEach((name, id) => {
        classFilterOptions += `<option value="${id}">${name}</option>`;
    });

    const studentOptionsHtml = validStudents
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(student => `<option value="${student.id}" data-class-id="${student.classId}">${student.name}</option>`)
        .join('');

    const { value: selectedIds } = await Swal.fire({
        title: 'Chọn học viên để xem chu kỳ',
        html: `
            <div class="swal-custom-controls">
                <select id="swal-class-filter" onchange="applySwalFilters()">${classFilterOptions}</select>
                <button onclick="selectAllStudentsInSwal(event)">Chọn hết</button>
                <button onclick="deselectAllStudentsInSwal(event)">Bỏ chọn</button>
            </div>
            <input 
                type="text" 
                id="swal-student-search" 
                class="swal2-input" 
                placeholder="Gõ tên học viên để lọc..."
                oninput="applySwalFilters()">
            <select id="swal-student-select" class="swal2-select" multiple style="height: 200px; margin-top: 10px;">
                ${studentOptionsHtml}
            </select>
            <small>Giữ phím Ctrl (hoặc Command trên Mac) để chọn nhiều học viên.</small>`,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Xuất Báo Cáo',
        cancelButtonText: 'Hủy',
        preConfirm: () => {
            const select = document.getElementById('swal-student-select');
            return Array.from(select.selectedOptions).map(option => option.value);
        }
    });

    if (selectedIds && selectedIds.length > 0) {
        generateCycleReport(selectedIds);
    }
}
/**
 * HÀM MỚI (THAY THẾ 2 HÀM CŨ): Áp dụng đồng thời cả bộ lọc lớp và bộ lọc tên trong Swal
 */
function applySwalFilters() {
    // Lấy giá trị bộ lọc lớp và từ khóa tìm kiếm
    const selectedClassId = document.getElementById('swal-class-filter')?.value || ""; // Thêm ?. và || "" cho an toàn
    const searchQuery = document.getElementById('swal-student-search')?.value.toLowerCase() || ""; // Thêm ?. và || ""
    const studentSelect = document.getElementById('swal-student-select');

    if (!studentSelect) return; // Thoát nếu không tìm thấy select box

    const options = studentSelect.getElementsByTagName('option');

    // Lặp qua từng option học viên
    for (const option of options) {
        const studentName = option.textContent.toLowerCase();
        const studentClassId = option.dataset.classId; // Lấy classId từ data attribute

        // Kiểm tra xem học viên có thỏa mãn CẢ HAI điều kiện không
        const classMatch = (selectedClassId === "" || studentClassId === selectedClassId); // Khớp nếu không lọc lớp hoặc đúng lớp
        const searchMatch = studentName.includes(searchQuery); // Khớp nếu tên chứa từ khóa

        // Hiển thị hoặc ẩn option
        if (classMatch && searchMatch) {
            option.style.display = ''; // Hiển thị nếu khớp cả hai
        } else {
            option.style.display = 'none'; // Ẩn nếu không khớp
        }
    }
}
/**
 * LOGIC CHÍNH ĐỂ TẠO BÁO CÁO CHU KỲ (PHIÊN BẢN HOÀN CHỈNH)
 * Tự động bù thêm các buổi học dự đoán để đảm bảo đủ 24 buổi/chu kì.
 */
async function generateCycleReport(studentIds) {
    showLoading(true);
    try {
        const fullReport = [];
        const todayStr = new Date().toISOString().split('T')[0];

        for (const studentId of studentIds) {
            const studentData = allStudentsData[studentId];
            if (!studentData) continue;
            
            fullReport.push(`--- Báo Cáo Chu Kỳ Học Viên: ${studentData.name} ---`);

            let cycleStartDate = studentData.cycleStartDate;
            if (!cycleStartDate) {
                cycleStartDate = await findFirstAttendanceDate(studentId);
            }

            if (!cycleStartDate) {
                fullReport.push(" >> LỖI: Không thể xác định ngày bắt đầu chu kì cho học viên này.\n-----------------------------------------------------\n");
                continue;
            }

            const allScheduledDatesSet = new Set();
            const currentClassId = findActiveStudentClassId(studentId, studentData);
            const pastClassIds = (studentData.classes ? Object.keys(studentData.classes) : []).filter(id => id !== currentClassId);

            if (currentClassId) {
                const classData = allClassesData[currentClassId];
                if (classData && classData.sessions) {
                    Object.keys(classData.sessions).forEach(date => allScheduledDatesSet.add(date));
                }
            } else {
                 fullReport.push(" >> LỖI: Không tìm thấy lớp học hiện tại để dự đoán tương lai.\n-----------------------------------------------------\n");
                 continue;
            }

            for (const classId of pastClassIds) {
                const classData = allClassesData[classId];
                if (classData && classData.sessions) {
                    const attendanceRecords = allAttendanceData[classId]?.[studentId];
                    if (attendanceRecords) {
                        const lastAttendedDateInClass = Object.keys(attendanceRecords).sort().pop();
                        Object.keys(classData.sessions).forEach(date => {
                            if (date <= lastAttendedDateInClass) {
                                allScheduledDatesSet.add(date);
                            }
                        });
                    }
                }
            }

            const studentTimelineUnfiltered = Array.from(allScheduledDatesSet).sort().filter(date => date >= cycleStartDate);
            
            let studentTimeline = studentTimelineUnfiltered.filter(date => {
                const monthDay = date.substring(5);
                return !HOLIDAYS.includes(monthDay);
            });

            // *** BƯỚC BÙ THÊM BUỔI HỌC DỰ ĐOÁN ***
            if (studentTimeline.length > 0) {
                const lastKnownDate = studentTimeline[studentTimeline.length - 1];
                const currentClassData = allClassesData[currentClassId];

                if (currentClassData && currentClassData.fixedSchedule) {
                    // Tạo thêm 50 buổi học nữa (đã lọc ngày lễ) tính từ sau ngày cuối cùng đã biết
                    const futureSessionsObject = generateRollingSessions(lastKnownDate, 50, currentClassData.fixedSchedule);
                    const futureSessions = Object.keys(futureSessionsObject);

                    // Gộp lại để có một dòng thời gian đủ dài
                    const finalTimelineSet = new Set([...studentTimeline, ...futureSessions]);
                    studentTimeline = Array.from(finalTimelineSet).sort();
                }
            }
            // *** KẾT THÚC BƯỚC BÙ THÊM ***

            if (studentTimeline.length === 0) {
                fullReport.push(" >> LỖI: Không tìm thấy buổi học nào hợp lệ.\n-----------------------------------------------------\n");
                continue;
            }
            
            const attendedDatesSet = new Set();
            for (const classId in allAttendanceData) {
                if (allAttendanceData[classId]?.[studentId]) {
                    Object.keys(allAttendanceData[classId][studentId]).forEach(date => {
                        if (allAttendanceData[classId][studentId][date]?.attended === true) {
                            attendedDatesSet.add(date);
                        }
                    });
                }
            }

            let sessionsPassedCount = 0;
            for(const date of studentTimeline) {
                if(date < todayStr) sessionsPassedCount++;
                else break;
            }
            
            const cycleIndex = Math.floor((sessionsPassedCount > 0 ? sessionsPassedCount - 1 : 0) / 24);
            const currentCycleSessions = studentTimeline.slice(cycleIndex * 24, (cycleIndex + 1) * 24);
            const nextCycleSessions = studentTimeline.slice((cycleIndex + 1) * 24, (cycleIndex + 2) * 24);
            
            fullReport.push(`Ngày bắt đầu tính chu kì: ${cycleStartDate}`);
            
            // === PHẦN MỚI: Khởi tạo biến đếm ===
            let currentCycleAbsences = 0;
            let totalAbsences = 0;

            fullReport.push(`\n## CHU KỲ HIỆN TẠI (Số ${cycleIndex + 1}) ##`);
            if (currentCycleSessions.length > 0) {
                currentCycleSessions.forEach(date => {
                    if (date < todayStr) {
                        const isAttended = attendedDatesSet.has(date);
                        fullReport.push(`- ${date} ${isAttended ? '' : '(nghỉ)'}`.trim());
                    } else {
                        fullReport.push(`- ${date} (dự đoán)`);
                    }
                });
            } else {
                fullReport.push("Không có dữ liệu cho chu kỳ này.");
            }

            fullReport.push(`\n## CHU KỲ KẾ TIẾP (Số ${cycleIndex + 2}) ##`);
            if (nextCycleSessions.length > 0) {
                nextCycleSessions.forEach(date => {
                    fullReport.push(`- ${date} (dự đoán)`);
                });
            } else {
                fullReport.push("Không có dữ liệu cho chu kỳ tiếp theo.");
            }

            // === PHẦN MỚI: Tính tổng số buổi nghỉ từ trước đến nay ===
            const pastSessions = studentTimeline.filter(date => date < todayStr);
            pastSessions.forEach(date => {
                if (!attendedDatesSet.has(date)) {
                    totalAbsences++;
                }
            });

            // === PHẦN MỚI: Thêm phần tổng kết vào báo cáo ===
            fullReport.push(`\n## TỔNG KẾT ##`);
            fullReport.push(`- Số buổi nghỉ trong chu kỳ hiện tại: ${currentCycleAbsences}`);
            fullReport.push(`- Tổng số buổi nghỉ từ trước đến nay: ${totalAbsences}`);

            fullReport.push(`\n-----------------------------------------------------\n`);
        }
        
        const reportContent = fullReport.join('\n');
        const todayFile = new Date().toISOString().split('T')[0];
        downloadToFile(reportContent, `BaoCaoChuKyHoc_${todayFile}.txt`, 'text/plain');

    } catch (error) {
        console.error("Lỗi khi tạo báo cáo chu kỳ:", error);
        Swal.fire("Lỗi!", "Đã xảy ra lỗi: " + error.message, "error");
    } finally {
        showLoading(false);
    }
}

/**
 * HÀM MỚI: Cập nhật ngày bắt đầu chu kì trực tiếp từ bảng
 */
async function updateCycleStartDate(studentId, newDate) {
    // --- THÊM KIỂM TRA ---
    if (!selectedBranchId || !studentId) {
        console.error("Lỗi: Không xác định cơ sở/học viên khi cập nhật ngày bắt đầu chu kỳ.");
        // Có thể cần reload lại trang hoặc hàng đó để reset giá trị input nếu lỗi
        return;
    }
    // --- KẾT THÚC KIỂM TRA ---

    // Kiểm tra newDate có hợp lệ không (tùy chọn)
    if (!newDate) {
         console.warn("Ngày bắt đầu chu kỳ không hợp lệ.");
         // Reset lại input về giá trị cũ nếu có thể
         const inputElement = event?.target;
         if (inputElement && allStudentsData[studentId]) {
             inputElement.value = allStudentsData[studentId].cycleStartDate || '';
         }
         return;
    }


    try {
        // --- THAY ĐỔI: Sử dụng getBranchRef ---
        const studentRef = getBranchRef(`${DB_PATHS.STUDENTS}/${studentId}`);
        // --- KẾT THÚC THAY ĐỔI ---
        await studentRef.update({
            cycleStartDate: newDate,
            updatedAt: firebase.database.ServerValue.TIMESTAMP
        });

        // Cập nhật lại allStudentsData
        if(allStudentsData[studentId]) {
             allStudentsData[studentId].cycleStartDate = newDate;
             allStudentsData[studentId].updatedAt = Date.now(); // Ước lượng timestamp
        }

        // Log hành động
        const studentName = allStudentsData[studentId]?.name || studentId;
        await logActivity(`Cập nhật ngày bắt đầu chu kỳ thành ${newDate} cho ${studentName} tại cơ sở ${selectedBranchId}`);


        // Thông báo nhỏ (giữ nguyên)
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Đã cập nhật ngày!',
            showConfirmButton: false,
            timer: 1500
        });

    } catch (error) {
        console.error("Lỗi cập nhật ngày bắt đầu chu kì:", error);
        Swal.fire("Lỗi", "Không thể cập nhật ngày.", "error");
         // Reset lại input về giá trị cũ
         const inputElement = event?.target;
         if (inputElement && allStudentsData[studentId]) {
             inputElement.value = allStudentsData[studentId].cycleStartDate || '';
         }
    }
    // Không cần loading cho thao tác nhỏ này
}
/**
 * HÀM HỖ TRỢ MỚI: Tìm ngày điểm danh đầu tiên của học viên trên tất cả các lớp
 */
async function findFirstAttendanceDate(studentId) {
     // --- THÊM KIỂM TRA ---
    if (!selectedBranchId || !studentId) {
        console.error("Lỗi: Không xác định cơ sở/học viên khi tìm ngày đi học đầu tiên.");
        return null;
    }
    // --- KẾT THÚC KIỂM TRA ---

    try {
        // --- THAY ĐỔI: Sử dụng getBranchRef để đọc attendance của cả nhánh ---
        const attendanceSnap = await getBranchRef(DB_PATHS.ATTENDANCE).once('value');
        // --- KẾT THÚC THAY ĐỔI ---
        const attendanceInBranch = attendanceSnap.val() || {};
        const attendedDates = [];

        // Duyệt qua các lớp trong chi nhánh này
        for (const classId in attendanceInBranch) {
            // Kiểm tra xem học viên có điểm danh trong lớp này không
            if (attendanceInBranch[classId][studentId]) {
                const studentAttendanceInClass = attendanceInBranch[classId][studentId];
                for (const date in studentAttendanceInClass) {
                    // Chỉ lấy ngày có attended = true
                    if (studentAttendanceInClass[date]?.attended === true) {
                        attendedDates.push(date);
                    }
                }
            }
        }

        if (attendedDates.length === 0) {
            console.log(`Không tìm thấy ngày điểm danh nào cho ${studentId} tại ${selectedBranchId}`);
            return null; // Không tìm thấy ngày nào
        }

        attendedDates.sort(); // Sắp xếp để tìm ngày sớm nhất
        console.log(`Ngày đi học đầu tiên của ${studentId} tại ${selectedBranchId} là: ${attendedDates[0]}`);
        return attendedDates[0];

    } catch (error) {
        console.error(`Lỗi khi tìm ngày đi học đầu tiên cho ${studentId} tại ${selectedBranchId}:`, error);
        return null;
    }
}
/**
 * HÀM MỚI: Hiển thị lịch sử các chu kỳ đóng học phí
 */
async function showTuitionCycleHistory(studentId) {
    const student = allStudentsData[studentId];
    if (!student) return;

    const tuitionCycles = student.tuitionCycles || [];

    if (tuitionCycles.length === 0) {
        Swal.fire({
            title: `Lịch sử đóng phí: ${student.name}`,
            text: 'Chưa có dữ liệu chu kỳ học phí nào.',
            icon: 'info'
        });
        return;
    }

    let historyHtml = `
        <div style="text-align: left; max-height: 400px; overflow-y: auto;">
            <table class="swal-table">
                <thead>
                    <tr>
                        <th>Gói học</th>
                        <th>Ngày gia hạn</th>
                        <th>Trạng thái</th>
                        <th>Ngày thanh toán</th>
                    </tr>
                </thead>
                <tbody>
    `;

    // Sắp xếp để hiển thị cái mới nhất lên đầu
    [...tuitionCycles].reverse().forEach(cycle => {
        const status = cycle.isPaid 
            ? '<span style="color: green; font-weight: bold;">Đã thanh toán</span>' 
            : '<span style="color: red;">Chưa thanh toán</span>';
        
        historyHtml += `
            <tr>
                <td>${cycle.packageName}</td>
                <td>${cycle.renewalDate}</td>
                <td>${status}</td>
                <td>${cycle.paidDate || '---'}</td>
            </tr>
        `;
    });

    historyHtml += `</tbody></table></div>`;

    Swal.fire({
        title: `Lịch sử đóng phí: ${student.name}`,
        html: historyHtml,
        width: '800px'
    });
}

/**
 * HÀM MỚI: Xử lý việc tick/bỏ tick ô đã thanh toán
 */
async function toggleTuitionCyclePaid(studentId, cycleId, isPaid) {

    // --- THÊM KIỂM TRA ---
    if (!selectedBranchId || !studentId) {
        console.error("Lỗi: Không xác định cơ sở/học viên khi cập nhật thanh toán chu kỳ.");
        const checkbox = event?.target; if(checkbox) checkbox.checked = !isPaid;
        return;
    }
    // --- KẾT THÚC KIỂM TRA ---

    showLoading(true);
    try {
        // --- THAY ĐỔI: Sử dụng getBranchRef để đọc và ghi ---
        const studentRef = getBranchRef(`${DB_PATHS.STUDENTS}/${studentId}`);
        // --- KẾT THÚC THAY ĐỔI ---
        const studentSnap = await studentRef.once('value');
        const studentData = studentSnap.val();

        if (!studentData) {
             throw new Error("Không tìm thấy dữ liệu học viên.");
        }

        let tuitionCycles = studentData.tuitionCycles || [];
        let updated = false; // Cờ để kiểm tra xem có thay đổi không

        // Xử lý 'new_cycle' (giữ nguyên logic)
        if (cycleId === 'new_cycle' && isPaid) { // Chỉ tạo mới khi tick lần đầu
            const newCycle = {
                cycleId: `cycle_${Date.now()}`,
                packageName: studentData.package,
                 // Lấy ngày gia hạn gần nhất (updatedAt hoặc createdAt)
                 renewalDate: formatTimestamp(studentData.updatedAt || studentData.createdAt || Date.now()), // Thêm Date.now() làm fallback
                isPaid: true,
                paidDate: new Date().toISOString().split("T")[0]
            };
            tuitionCycles.push(newCycle);
            updated = true;
        } else {
            // Tìm và cập nhật chu kỳ đã có
            const cycleIndex = tuitionCycles.findIndex(c => c.cycleId === cycleId);
            if (cycleIndex !== -1) {
                // Chỉ cập nhật nếu trạng thái thay đổi
                if (tuitionCycles[cycleIndex].isPaid !== isPaid) {
                    tuitionCycles[cycleIndex].isPaid = isPaid;
                    tuitionCycles[cycleIndex].paidDate = isPaid ? new Date().toISOString().split("T")[0] : null;
                    updated = true;
                }
            } else if (cycleId !== 'new_cycle') {
                 // Trường hợp bỏ tick 'new_cycle' hoặc cycleId không tồn tại
                 console.warn(`Không tìm thấy cycleId ${cycleId} để cập nhật cho student ${studentId}`);
                 // Bỏ tick checkbox lại trên UI
                 const checkbox = event?.target; if(checkbox) checkbox.checked = !isPaid;
                 updated = false; // Không có gì để cập nhật DB
            }
        }

        // Chỉ ghi vào DB nếu có thay đổi
        if (updated) {
            // --- THAY ĐỔI: Ghi vào đúng nhánh ---
            await studentRef.child('tuitionCycles').set(tuitionCycles);
            // --- KẾT THÚC THAY ĐỔI ---

             // Cập nhật lại allStudentsData
             if(allStudentsData[studentId]) {
                 allStudentsData[studentId].tuitionCycles = tuitionCycles;
             }
             // Log hành động
             await logActivity(`${isPaid ? 'Xác nhận' : 'Hủy'} thanh toán chu kỳ học phí ${cycleId === 'new_cycle' ? '(mới)' : cycleId} cho ${studentData.name} tại cơ sở ${selectedBranchId}`);

            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Đã cập nhật!', showConfirmButton: false, timer: 1500 });
        } else {
             console.log("Không có thay đổi trạng thái thanh toán chu kỳ.");
        }


    } catch (error) {
        console.error("Lỗi khi cập nhật trạng thái thanh toán:", error);
        Swal.fire("Lỗi", "Không thể cập nhật trạng thái: " + error.message, "error");
         // Bỏ tick checkbox lại trên UI
         const checkbox = event?.target; if(checkbox) checkbox.checked = !isPaid;
    } finally {
        showLoading(false);
    }
}
/**
 * HÀM MỚI: Chọn tất cả các học viên đang được hiển thị trong danh sách
 */
function selectAllStudentsInSwal(event) {
    event.preventDefault(); // Ngăn hành vi mặc định của button
    const studentSelect = document.getElementById('swal-student-select');
    const options = studentSelect.getElementsByTagName('option');

    for (const option of options) {
        // Chỉ chọn những học viên đang hiển thị (không bị ẩn bởi bộ lọc)
        if (option.style.display !== 'none') {
            option.selected = true;
        }
    }
}

/**
 * HÀM MỚI: Bỏ chọn tất cả học viên
 */
function deselectAllStudentsInSwal(event) {
    event.preventDefault();
    const studentSelect = document.getElementById('swal-student-select');
    const options = studentSelect.getElementsByTagName('option');
    for (const option of options) {
        option.selected = false;
    }
}
// ======================================================
// === CÁC HÀM MỚI CHO CHỨC NĂNG QUẢN LÝ MÃ NHÂN SỰ ===
// ======================================================

/**
 * Render trang Quản Lý Mã
 */
async function renderCodeManagementPage() {
    showLoading(true);
    const tbody = document.getElementById("personnel-code-list");
    tbody.innerHTML = ""; // Xóa nội dung cũ
    try {
        const snapshot = await database.ref(DB_PATHS.PERSONNEL_CODES).once('value');
        const codes = snapshot.val() || {};
        console.log("Dữ liệu mã nhân sự nhận được:", codes); // Kiểm tra lại dữ liệu

        if (Object.keys(codes).length === 0) {
             tbody.innerHTML = '<tr><td colspan="3">Chưa có mã nhân sự nào. Bấm "Thêm Nhân Sự Mới" để bắt đầu.</td></tr>';
             showLoading(false);
             return;
        }

        Object.entries(codes).forEach(([key, data]) => {
            // Thêm kiểm tra data có tồn tại không
            if (!data) {
                console.warn(`Dữ liệu không hợp lệ cho key: ${key}`);
                return; // Bỏ qua mục này nếu data là null/undefined
            }
            const nameValue = data.name || '';
            const codeValue = data.code || ''; // Thêm kiểm tra cho code

            const row = `
                <tr data-key="${key}">
                    <td><input type="text" class="personnel-code-input" value="${nameValue}" onchange="savePersonnelCode('${key}', 'name', this.value)"></td>
                    <td>
                        <div class="password-cell">
                            <input type="text" class="personnel-code-input" value="${codeValue}" onchange="savePersonnelCode('${key}', 'code', this.value)" maxlength="6">
                            <button class="random-code-btn" title="Tạo mã ngẫu nhiên" onclick="generateRandomCode(this.previousElementSibling)">
                                <img src="icons/dice.svg" alt="Random" width="24" height="24">
                            </button>
                        </div>
                    </td>
                    <td><button class="delete-btn" onclick="deletePersonnelCode('${key}')">Xóa</button></td>
                </tr>
            `;
            tbody.insertAdjacentHTML('beforeend', row);
        });
    } catch (error) {
        console.error("Lỗi tải mã nhân sự:", error);
        tbody.innerHTML = '<tr><td colspan="3">Có lỗi xảy ra khi tải dữ liệu.</td></tr>'; // Thông báo lỗi rõ hơn
    } finally {
        showLoading(false);
    }
}

/**
 * Thêm một dòng mới vào bảng Quản Lý Mã (CHỈ THÊM DỮ LIỆU, LISTENER SẼ RENDER)
 */
async function addNewPersonnelCodeRow() {
    showLoading(true);
    try {
        // Chỉ cần thêm dữ liệu trống vào Firebase
        await database.ref(DB_PATHS.PERSONNEL_CODES).push({ name: "", code: "" });
        
       // await renderPersonnelListForAttendance
       await renderCodeManagementPage;

    } catch (error) {
        console.error("Lỗi khi thêm dòng mã nhân sự mới:", error);
        Swal.fire("Lỗi", "Không thể thêm dòng mới.", "error");
    } finally {
        showLoading(false);
    }
}
/**
 * Lưu thay đổi tên hoặc mã
 */
async function savePersonnelCode(key, field, value) {
    try {
        await database.ref(`${DB_PATHS.PERSONNEL_CODES}/${key}/${field}`).set(value);
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Đã lưu!', showConfirmButton: false, timer: 1500 });
    } catch (error) {
        Swal.fire("Lỗi", "Không thể lưu thay đổi.", "error");
    }
}

/**
 * Xóa một nhân sự khỏi danh sách mã
 */
async function deletePersonnelCode(key) {
    const result = await Swal.fire({
        title: 'Bạn chắc chắn muốn xóa?',
        text: "Hành động này không thể hoàn tác!", // Thêm mô tả rõ hơn
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33', // Màu đỏ cho nút xóa
        confirmButtonText: 'Vâng, xóa!',
        cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
        showLoading(true); // Hiển thị loading
        try {
            // 1. Xóa dữ liệu trên Firebase
            await database.ref(`${DB_PATHS.PERSONNEL_CODES}/${key}`).remove();

            // 2. Xóa dòng tương ứng khỏi bảng trên giao diện ngay lập tức
            const rowToRemove = document.querySelector(`#personnel-code-list tr[data-key="${key}"]`);
            if (rowToRemove) {
                rowToRemove.remove(); // Xóa thẻ <tr>
            }

            Swal.fire('Đã xóa!', 'Nhân sự đã được xóa.', 'success'); // Thông báo thành công

        } catch (error) {
            console.error("Lỗi khi xóa mã nhân sự:", error);
            Swal.fire("Lỗi", "Không thể xóa nhân sự.", "error");
        } finally {
            showLoading(false); // Ẩn loading
        }
    }
}
/**
 * Tạo mã 6 số ngẫu nhiên và không trùng lặp
 */
async function generateRandomCode(inputElement) {
    showLoading(true);
    try {
        const snapshot = await database.ref(DB_PATHS.PERSONNEL_CODES).once('value');
        const existingCodes = Object.values(snapshot.val() || {}).map(item => item.code);
        let randomCode;
        do {
            randomCode = Math.floor(100000 + Math.random() * 900000).toString();
        } while (existingCodes.includes(randomCode));
        inputElement.value = randomCode;
        inputElement.dispatchEvent(new Event('change')); // Kích hoạt sự kiện onchange để tự động lưu
    } finally {
        showLoading(false);
    }
}
/**
 * HÀM MỚI: Yêu cầu mật khẩu trước khi vào điểm danh
 */
/**
 * HÀM NÂNG CẤP: Yêu cầu mật khẩu và kiểm tra quyền truy cập lớp
 */
/**
 * HÀM NÂNG CẤP: Yêu cầu mật khẩu, kiểm tra quyền và TỰ ĐỘNG MỞ BẢNG ĐIỂM DANH
 */
async function promptForAttendancePassword(classId) {

// --- THÊM KIỂM TRA ---
    if (!selectedBranchId || !classId) {
        Swal.fire("Lỗi", "Không thể xác định cơ sở hoặc lớp học.", "error");
        return;
    }
    // --- KẾT THÚC KIỂM TRA ---

    const role = currentUserData?.role;

    if (role === 'Admin' || role === 'Hội Đồng') {
        showClassAttendanceAndHomeworkTable(classId); // Vào thẳng
        return;
    }

    if (role === 'Giáo Viên' || role === 'Trợ Giảng') {
        const { value: enteredCode } = await Swal.fire({
            title: 'Xác thực nhân sự',
            input: 'password', // Giữ type password
            inputLabel: 'Vui lòng nhập mật mã 6 số của bạn để điểm danh',
            inputPlaceholder: '******',
            inputAttributes: {
                maxlength: 6,
                autocapitalize: 'off',
                autocorrect: 'off',
                // === THÊM DÒNG NÀY ĐỂ VÔ HIỆU HÓA GỢI Ý ===
                autocomplete: 'new-password' // Hoặc 'off', nhưng 'new-password' thường hiệu quả hơn
                // ===========================================
            },
            showCancelButton: true,
            confirmButtonText: 'Xác nhận',
            cancelButtonText: 'Hủy'
        });

        if (enteredCode) {
            showLoading(true);
            try {
                // Đọc mã nhân sự (chung) và dữ liệu lớp học (theo nhánh) đồng thời
                const [codesSnapshot, classSnapshot] = await Promise.all([
                    database.ref(DB_PATHS.PERSONNEL_CODES).once('value'), // Đọc mã chung
                    // --- THAY ĐỔI: Sử dụng getBranchRef để đọc lớp ---
                    getBranchRef(`${DB_PATHS.CLASSES}/${classId}`).once('value')
                    // --- KẾT THÚC THAY ĐỔI ---
                ]);

                const personnelList = codesSnapshot.val() || {};
                const classData = classSnapshot.val(); // Dữ liệu lớp từ đúng nhánh

                if (!classData) {
                    throw new Error(`Không tìm thấy thông tin lớp học (${classId}) trong cơ sở ${selectedBranchId}.`);
                }

                // Tìm nhân sự khớp với mã nhập vào (giữ nguyên)
                let matchedPersonnel = null;
                for (const key in personnelList) {
                    if (personnelList[key].code === enteredCode) {
                        matchedPersonnel = personnelList[key];
                        break;
                    }
                }

                if (!matchedPersonnel) {
                    Swal.fire('Lỗi', 'Mật mã không chính xác.', 'error');
                } else {
                    // Lấy tên GV/TG từ classData đã đọc đúng nhánh
                    const teacherName = classData.teacher || "";
                    const assistantName = classData.assistantTeacher || "";
                    const personnelName = matchedPersonnel.name || "";

                    // Kiểm tra xem tên có khớp không
                    if (personnelName === teacherName || personnelName === assistantName) {
                        // Khớp -> Mở bảng điểm danh
                        showClassAttendanceAndHomeworkTable(classId); // Hàm này đã được sửa
                    } else {
                        Swal.fire('Lỗi', 'Mật mã đúng, nhưng bạn không được phân công dạy lớp này.', 'error');
                    }
                }
            } catch (error) {
                console.error("Lỗi xác thực điểm danh:", error);
                Swal.fire("Lỗi", "Đã xảy ra lỗi: " + error.message, "error");
            } finally {
                // Chỉ tắt loading nếu có lỗi hiển thị (vì showClassAttendanceAndHomeworkTable có loading riêng)
                 if (Swal.isVisible()) { // Kiểm tra xem có Swal nào đang hiện không
                     const swalTitle = Swal.getTitle();
                     if (swalTitle && swalTitle.toLowerCase().includes('lỗi')) {
                         showLoading(false); // Chỉ tắt nếu là Swal báo lỗi
                     }
                 }
                 // Nếu không có Swal lỗi -> đã vào điểm danh -> không tắt loading ở đây
            }
        }
    } else {
        Swal.fire('Truy cập bị từ chối', 'Vai trò của bạn không được phép thực hiện điểm danh.', 'error');
    }
}
/**
 * HÀM MỚI: Lắng nghe thay đổi trên danh sách mã nhân sự
 */
function initPersonnelCodesListener() {
    database.ref(DB_PATHS.PERSONNEL_CODES).on("value", snapshot => {
         console.log("Listener: Dữ liệu mã nhân sự (chung) đã cập nhật."); // Thêm log
        // Khi có bất kỳ thay đổi nào, tự động vẽ lại trang nếu đang mở
      
        // Cập nhật lại dropdown trong form lớp học nếu cần
        if (document.getElementById('class-form-modal').style.display === 'flex') {
             populateTeacherDropdown();
             populateAssistantTeacherDropdown();
        }
        // Cập nhật dropdown trong form lớp tạm nếu cần
        if (document.getElementById('temp-class-form-modal').style.display === 'flex') {
             populatePersonnelDropdown(document.getElementById('temp-class-teacher'));
             populatePersonnelDropdown(document.getElementById('temp-class-assistant'));
        }
         // Cập nhật lại dropdown giáo viên/trợ giảng trong form lớp học nếu cần
         // (Logic này đã được xử lý trong initUsersListener, nhưng để đây cho rõ ràng)
    });
}
/**
 * HÀM MỚI: Khởi tạo tất cả các listener cần thiết
 */
function initListeners() {
    console.log(`Khởi tạo listeners cho cơ sở ${selectedBranchId}...`);
    // Listeners cho dữ liệu theo nhánh (branch-specific)
    initStudentsListener();
    initClassesListener();
    // Thêm các listener khác cho dữ liệu theo nhánh ở đây (vd: attendance, homework,...)
    // initAttendanceListener(); // Ví dụ

    // Listeners cho dữ liệu chung (global) - chỉ cần chạy MỘT LẦN
    // Chúng ta cần kiểm tra để tránh gắn listener nhiều lần khi chuyển cơ sở
    if (!window.globalListenersInitialized) {
         console.log("Khởi tạo listeners chung (users, personnel_codes)...");
         initUsersListener();
         initPersonnelCodesListener();
         window.globalListenersInitialized = true; // Đánh dấu đã chạy
    } else {
         console.log("Listeners chung đã được khởi tạo trước đó.");
    }
}

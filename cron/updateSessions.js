/**
 * updateSessions.js
 *
 * Mỗi lần chạy, script này sẽ:
 * 1. Kết nối Realtime Database bằng service account (từ biến môi trường).
 * 2. Đọc /classes, lấy fixedSchedule, danh sách students.
 * 3. So sánh ngày/giờ hiện tại (Asia/Bangkok) với fixedSchedule.
 * 4. Nếu trùng, tăng sessionsAttended và giảm sessionsPaid cho từng học viên.
 * 5. Đánh dấu đã xử lý trong /processedSessions để tránh trùng lặp.
 */

const admin = require("firebase-admin");

// Lấy service account JSON từ biến môi trường (được cấp qua GitHub Secret)
const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "{}"
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
 databaseURL: "https://lab-edu-11f05-default-rtdb.asia-southeast1.firebasedatabase.app/"
});


const db = admin.database();

/**
 * Lấy ngày và giờ hiện tại ở timezone Asia/Bangkok
 * Trả về: { dayName: "Monday|Tuesday|...", timeString: "HH:mm" }
 */
function getCurrentDayAndTime(timeZone = "Asia/Bangkok") {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(now);

  let dayName = "";
  let hour = "";
  let minute = "";
  parts.forEach(({ type, value }) => {
    if (type === "weekday") {
      dayName = value;
    } else if (type === "hour") {
      hour = value.padStart(2, "0");
    } else if (type === "minute") {
      minute = value.padStart(2, "0");
    }
  });
  return { dayName, timeString: `${hour}:${minute}` };
}
function isTimeLessOrEqual(timeA, timeB) {
  const [hA, mA] = timeA.split(":").map(Number);
  const [hB, mB] = timeB.split(":").map(Number);
  if (hA < hB) return true;
  if (hA > hB) return false;
  // hA === hB
  return mA <= mB;
}
async function runUpdateSessions() {
  const { dayName, timeString } = getCurrentDayAndTime("Asia/Bangkok");
  console.log(`>> Bắt đầu chạy: ${dayName} ${timeString} (Asia/Bangkok)`);

  try {
    // 1. Lấy toàn bộ classes
    const classesSnap = await db.ref("classes").once("value");
    const classes = classesSnap.val() || {};
    const processedRef = db.ref("processedSessions");

    // 2. Duyệt qua từng class
    for (const [classId, cls] of Object.entries(classes)) {
      const fixedSchedule = cls.fixedSchedule || {};
      // Nếu lớp không có lịch cố định hôm nay, bỏ qua
      if (!fixedSchedule[dayName]) continue;

      const scheduledTime = fixedSchedule[dayName];
      // Nếu giờ không trùng với giờ hiện tại, bỏ qua
     if (!isTimeLessOrEqual(scheduledTime, timeString)) continue;
      // Tạo key đánh dấu: "classId/YYYY-MM-DD_HH:mm"
      const nowDate = new Date().toLocaleDateString("en-CA", {
        timeZone: "Asia/Bangkok",
      }); // "2025-06-05"
    const sessionKey = `${classId}/${nowDate}_${scheduledTime}`;

      // 3. Kiểm tra xem buổi học này đã xử lý chưa
      const doneSnap = await processedRef.child(sessionKey).once("value");
      if (doneSnap.exists()) {
        console.log(`— Bỏ qua (đã xử lý): ${sessionKey}`);
        continue;
      }

      // 4. Lấy danh sách student IDs của lớp
      const studentIdsObj = cls.students || {};
      const studentIds = Object.keys(studentIdsObj);
      if (studentIds.length === 0) {
        // Nếu lớp chưa có học viên, vẫn đánh dấu đã xử lý để tránh lặp
        await processedRef.child(sessionKey).set(true);
        continue;
      }

      // 5. Chuẩn bị object multi-path updates
      const updates = {};
      for (const studentId of studentIds) {
        const stSnap = await db.ref(`students/${studentId}`).once("value");
        const stData = stSnap.val();
        if (!stData) continue;

        const currentAttended = parseInt(stData.sessionsAttended || 0, 10);
        const currentPaid = parseInt(stData.sessionsPaid || 0, 10);
        const newAttended = currentAttended + 1;
        const newPaid = currentPaid > 0 ? currentPaid - 1 : 0;

        updates[`students/${studentId}/sessionsAttended`] = newAttended;
        updates[`students/${studentId}/sessionsPaid`] = newPaid;
      }

      // 6. Đánh dấu đã xử lý
      updates[`processedSessions/${sessionKey}`] = true;

      // 7. Thực hiện cập nhật multi-path một lần
       await processedRef.child(sessionKey).set(true);
      console.log(`✔ Đã xử lý buổi học: ${sessionKey}`);
    }

    console.log(">> Kết thúc runUpdateSessions");
    process.exit(0);
  } catch (error) {
    console.error("Lỗi khi chạy updateSessions:", error);
    process.exit(1);
  }
}

// Gọi hàm khi file này được chạy
runUpdateSessions();

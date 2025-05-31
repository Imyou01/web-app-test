/**
 * updateSessions.js
 *
 * Mỗi lần chạy, script này sẽ:
 * 1. Kết nối vào Realtime Database bằng service account (được load từ biến môi trường).
 * 2. Đọc /classes, lấy fixedSchedule và danh sách students.
 * 3. So sánh ngày/giờ hiện tại (Asia/Bangkok) với fixedSchedule.
 * 4. Nếu khớp, tăng sessionsAttended và giảm sessionsPaid cho mỗi học viên.
 * 5. Đánh dấu đã xử lý trong /processedSessions để tránh trùng lặp.
 */

const admin = require("firebase-admin");

// Lấy service account JSON từ biến môi trường mà ta sẽ đặt trong GitHub Secret
const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "{}"
);

// Khởi tạo Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // Thay YOUR_DATABASE_URL bằng URL thực của Realtime Database (có dạng https://<project-id>.firebaseio.com)
  databaseURL: "https://<YOUR_DATABASE_URL>.firebaseio.com"
});

const db = admin.database();

/**
 * Lấy ngày và giờ hiện tại ở timezone Asia/Bangkok
 * Trả về { dayName: "Monday|Tuesday|...", timeString: "HH:mm" }
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

async function runUpdateSessions() {
  const { dayName, timeString } = getCurrentDayAndTime("Asia/Bangkok");
  console.log(`>> Bắt đầu chạy: ${dayName} ${timeString} (Asia/Bangkok)`);

  try {
    // 1. Lấy toàn bộ /classes
    const classesSnap = await db.ref("classes").once("value");
    const classes = classesSnap.val() || {};
    const processedRef = db.ref("processedSessions");

    // 2. Duyệt từng lớp học
    for (const [classId, cls] of Object.entries(classes)) {
      const fixedSchedule = cls.fixedSchedule || {};
      // Nếu lớp không có lịch cố định hôm nay, bỏ qua
      if (!fixedSchedule[dayName]) continue;

      const scheduledTime = fixedSchedule[dayName];
      // Nếu giờ không trùng với giờ hiện tại, bỏ qua
      if (scheduledTime !== timeString) continue;

      // Tạo key đánh dấu theo format "classId/YYYY-MM-DD_HH:mm"
      const nowDate = new Date().toLocaleDateString("en-CA", {
        timeZone: "Asia/Bangkok",
      }); // "2025-06-05"
      const sessionKey = `${classId}/${nowDate}_${timeString}`;

      // Kiểm tra xem đã xử lý buổi học này chưa
      const alreadySnap = await processedRef.child(sessionKey).once("value");
      if (alreadySnap.exists()) {
        console.log(`— Đã xử lý trước: ${sessionKey}`);
        continue;
      }

      // 3. Lấy danh sách học viên (student IDs) của lớp
      const studentIdsObj = cls.students || {};
      const studentIds = Object.keys(studentIdsObj);
      if (studentIds.length === 0) {
        // Nếu lớp chưa có học viên, vẫn đánh dấu đã xử lý để tránh loop
        await processedRef.child(sessionKey).set(true);
        continue;
      }

      // 4. Tạo object multi-path update cho Realtime DB
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

      // 5. Đánh dấu buổi học đã được xử lý (sessionKey)
      updates[`processedSessions/${sessionKey}`] = true;

      // 6. Thực hiện một lệnh update multi-path
      await db.ref().update(updates);
      console.log(
        `✓ Đã cập nhật buổi học cho lớp ${classId} (${nowDate} ${timeString})`
      );
    }

    console.log(">> Kết thúc chạy updateSessions");
    process.exit(0);
  } catch (err) {
    console.error("‼ Lỗi khi chạy updateSessions:", err);
    process.exit(1);
  }
}

runUpdateSessions();

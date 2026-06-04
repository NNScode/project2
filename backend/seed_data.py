"""
seed_data.py — Nạp dữ liệu mẫu vào database FacePass.

Chạy từ thư mục backend/:
    py -3 seed_data.py

Dữ liệu được tạo:
  • 1  ADMIN
  • 3  PROCTOR
  • 20 STUDENTS  (kèm student profile)
  • 3  Exam       (1 PAST · 1 NOW · 1 FUTURE)
  • 6  Room       (2 phòng / kỳ thi, mỗi phòng có proctor)
  • 42 RoomStudent (~7 sv/phòng)
  • 14 AttendanceRecord mẫu cho kỳ thi PAST

Dùng raw SQL để đúng tên cột thực tế trong DB.
"""

import sys
from datetime import datetime, timedelta
import bcrypt
from sqlalchemy import text
from database import SessionLocal

# ── helpers ──────────────────────────────────────────────────────────────────

def hash_pw(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()

def dt(days_offset: int, hour: int = 8) -> str:
    """Datetime string tương đối so với hôm nay, dùng cho MySQL."""
    base = datetime.now().replace(hour=hour, minute=0, second=0, microsecond=0)
    d = base + timedelta(days=days_offset)
    return d.strftime("%Y-%m-%d %H:%M:%S")

def dt_obj(days_offset: int, hour: int = 8, extra_minutes: int = 0) -> datetime:
    base = datetime.now().replace(hour=hour, minute=0, second=0, microsecond=0)
    return base + timedelta(days=days_offset, minutes=extra_minutes)

# ── data definitions ──────────────────────────────────────────────────────────

ADMIN_USERS = [
    {"user_name": "admin",    "full_name": "Quản trị viên",   "password": "Admin@123",  "role": "ADMIN"},
]

PROCTOR_USERS = [
    {"user_name": "proctor1", "full_name": "Nguyễn Văn Hùng", "password": "Proctor@1",  "role": "PROCTOR"},
    {"user_name": "proctor2", "full_name": "Trần Thị Mai",     "password": "Proctor@2",  "role": "PROCTOR"},
    {"user_name": "proctor3", "full_name": "Lê Đình Khoa",     "password": "Proctor@3",  "role": "PROCTOR"},
]

# (user_name, full_name, student_code, cccd_number, password)
STUDENT_DATA = [
    ("sv001", "Nguyễn Minh Tuấn",  "SV2021001", "079201001234", "Student@123"),
    ("sv002", "Trần Thị Hương",    "SV2021002", "079201002345", "Student@123"),
    ("sv003", "Lê Văn Đức",        "SV2021003", "079201003456", "Student@123"),
    ("sv004", "Phạm Thị Lan",      "SV2021004", "079201004567", "Student@123"),
    ("sv005", "Hoàng Minh Khoa",   "SV2021005", "079201005678", "Student@123"),
    ("sv006", "Vũ Thị Thu",        "SV2021006", "079201006789", "Student@123"),
    ("sv007", "Đặng Văn Bình",     "SV2021007", "079201007890", "Student@123"),
    ("sv008", "Bùi Thị Ngọc",      "SV2021008", "079201008901", "Student@123"),
    ("sv009", "Đỗ Văn Nam",        "SV2021009", "079201009012", "Student@123"),
    ("sv010", "Ngô Thị Diệu",      "SV2021010", "079201010123", "Student@123"),
    ("sv011", "Đinh Văn Long",     "SV2021011", "079201011234", "Student@123"),
    ("sv012", "Lý Thị Hà",         "SV2021012", "079201012345", "Student@123"),
    ("sv013", "Phan Văn Tú",       "SV2021013", "079201013456", "Student@123"),
    ("sv014", "Trịnh Thị Yến",     "SV2021014", "079201014567", "Student@123"),
    ("sv015", "Cao Văn Phúc",      "SV2021015", "079201015678", "Student@123"),
    ("sv016", "Dương Thị Kim",     "SV2021016", "079201016789", "Student@123"),
    ("sv017", "Hà Văn Lộc",        "SV2021017", "079201017890", "Student@123"),
    ("sv018", "Mai Thị Thảo",      "SV2021018", "079201018901", "Student@123"),
    ("sv019", "Tống Văn Quân",     "SV2021019", "079201019012", "Student@123"),
    ("sv020", "Lưu Thị Bích",      "SV2021020", "079201020123", "Student@123"),
]

# (name, description, status, created_at_offset_days)
EXAMS = [
    (
        "Kiểm tra Toán học kỳ 1 — 2024",
        "Bài thi cuối kỳ môn Toán học Đại cương. Hình thức thi trắc nghiệm 60 câu.",
        "PAST", -60,
    ),
    (
        "Thi Lập trình Python — HK2 2025",
        "Kiểm tra thực hành lập trình Python. Thời gian làm bài 90 phút.",
        "NOW", -3,
    ),
    (
        "Thi cuối kỳ Mạng máy tính — HK3 2025",
        "Bài thi lý thuyết Mạng máy tính, gồm 40 câu trắc nghiệm và 2 câu tự luận.",
        "FUTURE", -1,
    ),
]

# (exam_index, room_name, proctor_key, day_offset, h_start, h_end, meeting_url)
ROOMS_DEF = [
    (0, "Phòng A101", "proctor1", -30, 8,  10, "https://meet.google.com/abc-defg-hij"),
    (0, "Phòng A102", "proctor2", -30, 13, 15, "https://meet.google.com/abc-defg-ikl"),
    (1, "Phòng B201", "proctor1", 0,   8,  10, "https://meet.google.com/bcd-efgh-ijk"),
    (1, "Phòng B202", "proctor2", 0,   13, 15, "https://meet.google.com/bcd-efgh-lmn"),
    (2, "Phòng C301", "proctor2", 14,  8,  10, "https://meet.google.com/cde-fghi-jkl"),
    (2, "Phòng C302", "proctor3", 14,  13, 15, "https://meet.google.com/cde-fghi-mno"),
]

# room_index → [student_index 0-based]
ROOM_STUDENT_MAP = {
    0: [0, 1, 2, 3, 4, 5, 6],
    1: [7, 8, 9, 10, 11, 12, 13],
    2: [0, 2, 4, 6, 8, 10, 12],
    3: [1, 3, 5, 7, 9, 11, 13],
    4: [14, 15, 16, 17, 18, 19, 0],
    5: [1, 2, 3, 14, 15, 16, 17],
}

# (sv_idx, room_idx, status, checkin_min_after_start, liveness, match)
ATTENDANCE_SAMPLES = [
    (0,  0, "SUCCESS",      5,    0.97, 0.95),
    (1,  0, "SUCCESS",      8,    0.95, 0.91),
    (2,  0, "FAILED",       None, 0.42, 0.30),
    (3,  0, "SUCCESS",      12,   0.93, 0.89),
    (4,  0, "NEEDS_REVIEW", 20,   0.61, 0.55),
    (5,  0, "SUCCESS",      3,    0.98, 0.97),
    (6,  0, "PENDING",      None, None, None),
    (7,  1, "SUCCESS",      4,    0.96, 0.94),
    (8,  1, "SUCCESS",      9,    0.94, 0.90),
    (9,  1, "FAILED",       None, 0.38, 0.25),
    (10, 1, "SUCCESS",      15,   0.92, 0.88),
    (11, 1, "SUCCESS",      6,    0.97, 0.96),
    (12, 1, "NEEDS_REVIEW", 25,   0.59, 0.52),
    (13, 1, "SUCCESS",      11,   0.95, 0.93),
]

# ── seeding ───────────────────────────────────────────────────────────────────

def seed():
    db = SessionLocal()
    try:
        _seed(db)
    except Exception as e:
        db.rollback()
        print(f"\n❌ Lỗi: {e}", file=sys.stderr)
        raise
    finally:
        db.close()


def _seed(db):
    print("⏳ Bắt đầu seed dữ liệu...\n")

    # ── 1. ADMIN + PROCTOR users ──────────────────────────────────────────────
    proctor_ids: dict[str, int] = {}
    for u in ADMIN_USERS + PROCTOR_USERS:
        row = db.execute(
            text("SELECT id FROM users WHERE user_name = :un"),
            {"un": u["user_name"]},
        ).fetchone()
        if row:
            print(f"   · skip user đã tồn tại: {u['user_name']}")
            if u["role"] == "PROCTOR":
                proctor_ids[u["user_name"]] = row[0]
            continue
        result = db.execute(
            text("""
                INSERT INTO users (user_name, full_name, password_hash, role)
                VALUES (:un, :fn, :pw, :role)
            """),
            {"un": u["user_name"], "fn": u["full_name"],
             "pw": hash_pw(u["password"]), "role": u["role"]},
        )
        uid = result.lastrowid
        if u["role"] == "PROCTOR":
            proctor_ids[u["user_name"]] = uid
        print(f"   + tạo {u['role']}: {u['user_name']}")

    # Đảm bảo proctor_ids đầy đủ dù user đã tồn tại
    for u in PROCTOR_USERS:
        if u["user_name"] not in proctor_ids:
            row = db.execute(
                text("SELECT id FROM users WHERE user_name = :un"),
                {"un": u["user_name"]},
            ).fetchone()
            if row:
                proctor_ids[u["user_name"]] = row[0]

    db.commit()
    print(f"\n   ✔ {len(ADMIN_USERS)+len(PROCTOR_USERS)} tài khoản admin/proctor")

    # ── 2. STUDENT users + student profiles ──────────────────────────────────
    student_ids: list[int] = []
    for (uname, full_name, sv_code, cccd, pwd) in STUDENT_DATA:
        # user
        row = db.execute(
            text("SELECT id FROM users WHERE user_name = :un"),
            {"un": uname},
        ).fetchone()
        if row:
            user_id = row[0]
        else:
            result = db.execute(
                text("""
                    INSERT INTO users (user_name, full_name, password_hash, role)
                    VALUES (:un, :fn, :pw, 'STUDENTS')
                """),
                {"un": uname, "fn": full_name, "pw": hash_pw(pwd)},
            )
            user_id = result.lastrowid

        # student profile
        s_row = db.execute(
            text("SELECT id FROM students WHERE user_id = :uid"),
            {"uid": user_id},
        ).fetchone()
        if s_row:
            student_ids.append(s_row[0])
            continue

        # Chèn đúng cột thực tế: student_code, full_name, cccd_number, user_id
        result = db.execute(
            text("""
                INSERT INTO students (user_id, student_code, full_name, cccd_number)
                VALUES (:uid, :sc, :fn, :cccd)
            """),
            {"uid": user_id, "sc": sv_code, "fn": full_name, "cccd": cccd},
        )
        student_ids.append(result.lastrowid)

    db.commit()
    print(f"   ✔ {len(STUDENT_DATA)} tài khoản sinh viên")

    # ── 3. Exams ──────────────────────────────────────────────────────────────
    exam_ids: list[int] = []
    for (name, desc, status, day_offset) in EXAMS:
        row = db.execute(
            text("SELECT id FROM exams WHERE name = :n"),
            {"n": name},
        ).fetchone()
        if row:
            exam_ids.append(row[0])
            print(f"   · skip exam đã tồn tại: {name[:35]}...")
            continue
        # Chèn đúng cột: created_at (không phải create_at)
        result = db.execute(
            text("""
                INSERT INTO exams (name, description, status, created_at)
                VALUES (:name, :desc, :status, :cat)
            """),
            {"name": name, "desc": desc, "status": status, "cat": dt(day_offset)},
        )
        exam_ids.append(result.lastrowid)

    db.commit()
    print(f"   ✔ {len(EXAMS)} kỳ thi")

    # ── 4. Rooms ──────────────────────────────────────────────────────────────
    room_ids: list[int] = []
    room_start_times: list[datetime] = []
    for (exam_idx, room_name, proctor_key, day_offset, h_start, h_end, url) in ROOMS_DEF:
        exam_id = exam_ids[exam_idx]
        row = db.execute(
            text("SELECT id FROM rooms WHERE exam_id = :eid AND room_name = :rn"),
            {"eid": exam_id, "rn": room_name},
        ).fetchone()
        if row:
            room_ids.append(row[0])
            # Lấy start_time thực tế
            st = db.execute(
                text("SELECT start_time FROM rooms WHERE id = :rid"),
                {"rid": row[0]},
            ).fetchone()
            room_start_times.append(st[0] if st else dt_obj(day_offset, h_start))
            print(f"   · skip room đã tồn tại: {room_name}")
            continue

        proctor_id = proctor_ids.get(proctor_key)
        start_dt = dt_obj(day_offset, h_start)
        # Chèn đúng cột: proctor_id, meeting_url (không phải exam_url)
        result = db.execute(
            text("""
                INSERT INTO rooms (exam_id, proctor_id, room_name, start_time, end_time, meeting_url)
                VALUES (:eid, :pid, :rn, :st, :et, :url)
            """),
            {
                "eid": exam_id, "pid": proctor_id, "rn": room_name,
                "st": dt(day_offset, h_start),
                "et": dt(day_offset, h_end),
                "url": url,
            },
        )
        room_ids.append(result.lastrowid)
        room_start_times.append(start_dt)

    db.commit()
    print(f"   ✔ {len(ROOMS_DEF)} phòng thi (có proctor_id + meeting_url)")

    # ── 5. RoomStudents ───────────────────────────────────────────────────────
    rs_count = 0
    for room_idx, sv_indices in ROOM_STUDENT_MAP.items():
        room_id = room_ids[room_idx]
        for sv_idx in sv_indices:
            if sv_idx >= len(student_ids):
                continue
            student_id = student_ids[sv_idx]
            exists = db.execute(
                text("SELECT 1 FROM room_students WHERE room_id=:rid AND student_id=:sid"),
                {"rid": room_id, "sid": student_id},
            ).fetchone()
            if exists:
                continue
            db.execute(
                text("INSERT INTO room_students (room_id, student_id) VALUES (:rid, :sid)"),
                {"rid": room_id, "sid": student_id},
            )
            rs_count += 1

    db.commit()
    print(f"   ✔ {rs_count} phân công thí sinh — phòng thi")

    # ── 6. AttendanceRecords ──────────────────────────────────────────────────
    ar_count = 0
    for (sv_idx, room_idx, status, checkin_min, liveness, match) in ATTENDANCE_SAMPLES:
        if sv_idx >= len(student_ids):
            continue
        student_id = student_ids[sv_idx]
        room_id    = room_ids[room_idx]
        exists = db.execute(
            text("SELECT 1 FROM attendance_records WHERE room_id=:rid AND student_id=:sid"),
            {"rid": room_id, "sid": student_id},
        ).fetchone()
        if exists:
            continue

        check_in = None
        if checkin_min is not None:
            check_in = (room_start_times[room_idx] + timedelta(minutes=checkin_min)
                        ).strftime("%Y-%m-%d %H:%M:%S")

        db.execute(
            text("""
                INSERT INTO attendance_records
                    (room_id, student_id, status, check_in_time, liveness_score, match_score)
                VALUES (:rid, :sid, :st, :ci, :ls, :ms)
            """),
            {
                "rid": room_id, "sid": student_id, "st": status,
                "ci": check_in, "ls": liveness, "ms": match,
            },
        )
        ar_count += 1

    db.commit()
    print(f"   ✔ {ar_count} bản ghi điểm danh mẫu")

    # ── 7. Fix dữ liệu cũ bị chèn sai cột ───────────────────────────────────
    print("\n🔧 Kiểm tra và vá dữ liệu cũ bị sai cột...")

    # exams: copy create_at → created_at nếu created_at đang NULL
    fixed = db.execute(
        text("UPDATE exams SET created_at = create_at WHERE created_at IS NULL AND create_at IS NOT NULL")
    ).rowcount
    if fixed:
        print(f"   ✔ exams: đã copy create_at → created_at ({fixed} dòng)")

    # rooms: copy exam_url → meeting_url nếu meeting_url NULL
    fixed = db.execute(
        text("UPDATE rooms SET meeting_url = exam_url WHERE meeting_url IS NULL AND exam_url IS NOT NULL")
    ).rowcount
    if fixed:
        print(f"   ✔ rooms: đã copy exam_url → meeting_url ({fixed} dòng)")

    # rooms: gán proctor_id dựa theo thứ tự room nếu đang NULL
    for i, (_, room_name, proctor_key, *_rest) in enumerate(ROOMS_DEF):
        pid = proctor_ids.get(proctor_key)
        if not pid:
            continue
        room_id = room_ids[i] if i < len(room_ids) else None
        if not room_id:
            continue
        db.execute(
            text("UPDATE rooms SET proctor_id = :pid WHERE id = :rid AND proctor_id IS NULL"),
            {"pid": pid, "rid": room_id},
        )

    # students: copy student_number → student_code nếu student_code NULL
    fixed = db.execute(
        text("""
            UPDATE students
            SET student_code = student_number
            WHERE student_code IS NULL AND student_number IS NOT NULL
        """)
    ).rowcount
    if fixed:
        print(f"   ✔ students: đã copy student_number → student_code ({fixed} dòng)")

    # students: copy full_name từ users nếu students.full_name đang NULL
    fixed = db.execute(
        text("""
            UPDATE students s
            JOIN users u ON u.id = s.user_id
            SET s.full_name = u.full_name
            WHERE s.full_name IS NULL AND u.full_name IS NOT NULL
        """)
    ).rowcount
    if fixed:
        print(f"   ✔ students: đã sync full_name từ users ({fixed} dòng)")

    db.commit()

    print("\n✅ Seed hoàn tất!")
    print("\n📋 Tài khoản đăng nhập:")
    print("   ADMIN     — admin        / Admin@123")
    print("   PROCTOR   — proctor1     / Proctor@1")
    print("   PROCTOR   — proctor2     / Proctor@2")
    print("   PROCTOR   — proctor3     / Proctor@3")
    print("   STUDENTS  — sv001~sv020  / Student@123")


# ── entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    seed()

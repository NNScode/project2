from sqlalchemy import text
from database import engine


stmts = [
    "ALTER TABLE users ADD COLUMN user_name VARCHAR(20) NULL",
    "ALTER TABLE users ADD UNIQUE INDEX ix_users_user_name (user_name)",
    "UPDATE users SET user_name = username WHERE user_name IS NULL",
    "ALTER TABLE students ADD COLUMN user_id INT NULL",
    "ALTER TABLE students ADD COLUMN student_number VARCHAR(20) NULL",
    "ALTER TABLE students ADD COLUMN cccd_image_url VARCHAR(255) NULL",
    "ALTER TABLE students ADD COLUMN face_vector TEXT NULL",
    "CREATE UNIQUE INDEX ix_students_student_number ON students(student_number)",
    "CREATE UNIQUE INDEX ix_students_cccd_number ON students(cccd_number)",
    "UPDATE students SET student_number = student_code WHERE student_number IS NULL",
    "ALTER TABLE exams ADD COLUMN status ENUM('PAST','NOW','FUTURE') NOT NULL DEFAULT 'FUTURE'",
    "ALTER TABLE exams ADD COLUMN create_at DATETIME NULL",
    "UPDATE exams SET create_at = created_at WHERE create_at IS NULL",
    "ALTER TABLE rooms ADD COLUMN end_time DATETIME NULL",
    "ALTER TABLE rooms ADD COLUMN exam_url VARCHAR(255) NULL",
    "UPDATE rooms SET exam_url = meeting_url WHERE exam_url IS NULL",
    "UPDATE rooms SET end_time = DATE_ADD(start_time, INTERVAL 2 HOUR) WHERE end_time IS NULL",
    "ALTER TABLE users MODIFY username VARCHAR(50) NULL",
    "ALTER TABLE students MODIFY student_code VARCHAR(20) NULL",
    "ALTER TABLE students MODIFY full_name VARCHAR(100) NULL",
]

with engine.begin() as conn:
    for stmt in stmts:
        try:
            conn.execute(text(stmt))
            print(f"OK: {stmt}")
        except Exception as exc:
            print(f"SKIP: {stmt} | {exc}")

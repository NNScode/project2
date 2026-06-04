import client from './client';

export const login    = (user_name, password) => client.post('/auth/login', { user_name, password });
export const getMe    = () => client.get('/auth/me');

export const getHealth    = () => client.get('/health');
export const getDashboard = () => client.get('/dashboard/summary');

// Users
export const getUsers    = ()          => client.get('/users/');
export const getUser     = (id)        => client.get(`/users/${id}`);
export const createUser  = (data)      => client.post('/users/', data);
export const updateUser  = (id, data)  => client.put(`/users/${id}`, data);
export const deleteUser  = (id)        => client.delete(`/users/${id}`);

// Students
export const getStudents   = ()        => client.get('/students/');
export const createStudent = (data)    => client.post('/students/', data);

// Exams
export const getExams    = ()          => client.get('/exams/');
export const createExam  = (data)      => client.post('/exams/', data);
export const updateExam  = (id, data)  => client.put(`/exams/${id}`, data);
export const deleteExam  = (id)        => client.delete(`/exams/${id}`);

// Rooms
export const getRooms    = ()          => client.get('/rooms/');
export const createRoom  = (data)      => client.post('/rooms/', data);
export const updateRoom  = (id, data)  => client.put(`/rooms/${id}`, data);
export const deleteRoom  = (id)        => client.delete(`/rooms/${id}`);

// Attendance
export const getAttendanceRecords   = ()     => client.get('/attendance-records/');
export const createAttendanceRecord = (data) => client.post('/attendance-records/', data);

// Room students
export const getRoomStudents   = ()     => client.get('/room-students/');
export const createRoomStudent = (data) => client.post('/room-students/', data);

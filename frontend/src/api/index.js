import client from './client';

export const login = (user_name, password) =>
  client.post('/auth/login', { user_name, password });

export const getMe = () => client.get('/auth/me');

export const getHealth = () => client.get('/health');
export const getDashboard = () => client.get('/dashboard/summary');

export const getUsers = () => client.get('/users/');
export const getUser = (id) => client.get(`/users/${id}`);
export const createUser = (data) => client.post('/users/', data);
export const updateUser = (id, data) => client.put(`/users/${id}`, data);
export const deleteUser = (id) => client.delete(`/users/${id}`);

export const getStudents = () => client.get('/students/');
export const createStudent = (data) => client.post('/students/', data);

export const getExams = () => client.get('/exams/');
export const createExam = (data) => client.post('/exams/', data);

export const getRooms = () => client.get('/rooms/');
export const createRoom = (data) => client.post('/rooms/', data);

export const getAttendanceRecords = () => client.get('/attendance-records/');
export const createAttendanceRecord = (data) => client.post('/attendance-records/', data);

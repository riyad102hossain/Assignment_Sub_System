import api from "./api";

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  classRoomId?: number | null;
  createdAt: string;
}

export interface ClassRoom {
  id: number;
  name: string;
  section: string;
}

export interface Subject {
  id: number;
  name: string;
  classRoomId: number;
  classRoomName?: string;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role: number; // 0=Admin, 1=Teacher, 2=Student
  classRoomId?: number | null;
}

export interface UpdateUserDto {
  name: string;
  email: string;
  password?: string;
  role: number; // 0=Admin, 1=Teacher, 2=Student
  classRoomId?: number | null;
}

export interface CreateClassRoomDto {
  name: string;
  section: string;
}

export interface CreateSubjectDto {
  name: string;
  classRoomId: number;
}

export const adminService = {
  // User Management
  getUsers: async (): Promise<User[]> => {
    const response = await api.get("/Users");
    return response.data;
  },

  createUser: async (data: CreateUserDto): Promise<User> => {
    const response = await api.post("/Users", data);
    return response.data;
  },

  updateUser: async (id: number, data: UpdateUserDto): Promise<User> => {
    const response = await api.put(`/Users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id: number): Promise<void> => {
    await api.delete(`/Users/${id}`);
  },

  // ClassRoom Management
  getClassRooms: async (): Promise<ClassRoom[]> => {
    const response = await api.get("/ClassRooms");
    return response.data;
  },

  createClassRoom: async (data: CreateClassRoomDto): Promise<ClassRoom> => {
    const response = await api.post("/ClassRooms", data);
    return response.data;
  },

  updateClassRoom: async (id: number, data: CreateClassRoomDto): Promise<void> => {
    await api.put(`/ClassRooms/${id}`, data);
  },

  deleteClassRoom: async (id: number): Promise<void> => {
    await api.delete(`/ClassRooms/${id}`);
  },

  // Subject Management
  getSubjects: async (): Promise<Subject[]> => {
    const response = await api.get("/Subjects");
    return response.data;
  },

  createSubject: async (data: CreateSubjectDto): Promise<Subject> => {
    const response = await api.post("/Subjects", data);
    return response.data;
  },

  updateSubject: async (id: number, data: CreateSubjectDto): Promise<void> => {
    await api.put(`/Subjects/${id}`, data);
  },

  deleteSubject: async (id: number): Promise<void> => {
    await api.delete(`/Subjects/${id}`);
  },

  // Teacher Assignment
  assignTeacher: async (teacherId: number, subjectId: number): Promise<void> => {
    await api.post("/Subjects/assign-teacher", { teacherId, subjectId });
  },

  unassignTeacher: async (teacherId: number, subjectId: number): Promise<void> => {
    await api.delete("/Subjects/unassign-teacher", { data: { teacherId, subjectId } });
  },

  // View All Assignments and Submissions
  getAllAssignments: async () => {
    const response = await api.get("/Assignments");
    return response.data;
  },

  getAllSubmissions: async () => {
    const response = await api.get("/Submissions");
    return response.data;
  },
};
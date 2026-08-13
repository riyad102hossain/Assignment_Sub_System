import api from "./api";
import { Assignment, CreateAssignmentDto } from "@/types";

export const teacherService = {
  // 1. Get all assignments created by the logged-in teacher
  getMyAssignments: async (): Promise<Assignment[]> => {
    const response = await api.get("/Assignments");
    return response.data;
  },

  // 2. Create new assignment
  createAssignment: async (data: CreateAssignmentDto): Promise<Assignment> => {
    const response = await api.post("/Assignments", data);
    return response.data;
  },

  // 3. Update assignment
  updateAssignment: async (id: number, data: CreateAssignmentDto): Promise<void> => {
    await api.put(`/Assignments/${id}`, data);
  },

  // 4. Delete assignment
  deleteAssignment: async (id: number): Promise<void> => {
    await api.delete(`/Assignments/${id}`);
  },

  // 5. Toggle assignment Draft/Publish status
  togglePublishStatus: async (id: number, isDraft: boolean): Promise<void> => {
    await api.patch(`/Assignments/${id}/status`, { isDraft });
  },

  // 6. Get all submissions for teacher's assignments
  getMySubmissions: async () => {
    const response = await api.get("/Submissions");
    return response.data;
  },

  // 7. Grade/Review a submission
  reviewSubmission: async (id: number, data: { obtainedMarks: number; teacherFeedback: string }) => {
    await api.put(`/Submissions/${id}/review`, data);
  },

  // 8. Get Classes and Subjects assigned to this teacher (Dropdown)
  getTeacherClasses: async () => {
    const response = await api.get("/ClassRooms/assigned");
    return response.data;
  },
};

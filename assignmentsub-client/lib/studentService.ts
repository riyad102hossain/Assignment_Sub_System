import api from "./api";

export interface StudentAssignment {
  id: number;
  title: string;
  description: string;
  deadline: string;
  maxMarks: number;
  submissionId?: number | null;
  isSubmitted?: boolean;
  submittedContent?: string;
  marksObtained?: number | null;
  teacherFeedback?: string | null;
}

export const studentService = {
  getAssignments: async (): Promise<StudentAssignment[]> => {
    const response = await api.get("/Assignments");
    return response.data;
  },

  submitAssignment: async (data: { assignmentId: number; answerContent: string }) => {
    const response = await api.post("/Submissions", data);
    return response.data;
  },

  updateSubmission: async (id: number, data: { answerContent: string }) => {
    const response = await api.put(`/Submissions/${id}`, data);
    return response.data;
  },
};
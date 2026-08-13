export interface Assignment {
  id: number;
  title: string;
  description: string;
  deadline: string;
  maxMarks: number;
  isDraft: boolean;
  status: string;
  classRoomId: number;
  classRoomName?: string;
  subjectId: number;
  subjectName?: string;
  teacherId: number;
  teacherName?: string;
  createdAt: string;
}

export interface CreateAssignmentDto {
  title: string;
  description: string;
  deadline: string;
  maxMarks: number;
  isDraft: boolean;
  classRoomId: number;
  subjectId: number;
}

export interface UpdateAssignmentDto extends CreateAssignmentDto {
  status: "Draft" | "Published";
}

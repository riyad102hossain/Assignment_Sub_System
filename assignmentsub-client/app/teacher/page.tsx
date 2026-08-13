"use client";

import { useEffect, useState } from "react";
import { getAuthUser, logout, User } from "@/lib/auth";
import { teacherService } from "@/lib/teacherService";
import { Assignment } from "@/types";
import api from "@/lib/api";

export default function TeacherDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [classList, setClassList] = useState<any[]>([]);
  const [subjectList, setSubjectList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"assignments" | "submissions">("assignments");

  // Form states
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [maxMarks, setMaxMarks] = useState(100);
  const [classRoomId, setClassRoomId] = useState<number | "">("");
  const [subjectId, setSubjectId] = useState<number | "">("");
  const [isDraft, setIsDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Grading states
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [obtainedMarks, setObtainedMarks] = useState<number>(0);
  const [teacherFeedback, setTeacherFeedback] = useState("");

  useEffect(() => {
    setUser(getAuthUser());
    fetchAssignments();
    fetchSubmissions();
    fetchDropdowns();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const data = await teacherService.getMyAssignments();
      setAssignments(data);
    } catch (err) {
      console.error("Failed to load assignments", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const data = await teacherService.getMySubmissions();
      setSubmissions(data);
    } catch (err) {
      console.error("Failed to load submissions", err);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [resClasses, resSubjects] = await Promise.all([
        api.get("/ClassRooms"),
        api.get("/Subjects")
      ]);
      setClassList(resClasses.data);
      setSubjectList(resSubjects.data);
      if (resClasses.data.length > 0) setClassRoomId(resClasses.data[0].id);
      if (resSubjects.data.length > 0) setSubjectId(resSubjects.data[0].id);
    } catch (err) {
      console.error("Failed to load dropdown options", err);
    }
  };

  const resetForm = () => {
    setEditingAssignment(null);
    setTitle("");
    setDescription("");
    setDeadline("");
    setMaxMarks(100);
    setClassRoomId(classList.length > 0 ? classList[0].id : "");
    setSubjectId(subjectList.length > 0 ? subjectList[0].id : "");
    setIsDraft(false);
  };

  const handleOpenModal = (assignment?: any) => {
    if (assignment) {
      setEditingAssignment(assignment);
      setTitle(assignment.title);
      setDescription(assignment.description);
      setDeadline(new Date(assignment.deadline).toISOString().slice(0, 16));
      setMaxMarks(assignment.maxMarks);
      setClassRoomId(assignment.classRoomId);
      setSubjectId(assignment.subjectId);
      
      // FIX: Status mapping (0 / Draft / true -> Draft)
      const isAssignmentDraft = assignment.status === 0 || assignment.status === "Draft" || assignment.isDraft === true;
      setIsDraft(isAssignmentDraft);
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classRoomId || !subjectId) {
      alert("Please select a Class and a Subject.");
      return;
    }
    setSubmitting(true);
    try {
      // FIX: Passing `status` (0 = Draft, 1 = Published) to match C# Enum
      const assignmentData = {
        title,
        description,
        deadline: new Date(deadline).toISOString(),
        maxMarks: Number(maxMarks),
        classRoomId: Number(classRoomId),
        subjectId: Number(subjectId),
        status: isDraft ? 0 : 1, 
        isDraft: isDraft,
      };

      if (editingAssignment) {
        await teacherService.updateAssignment(editingAssignment.id, assignmentData);
        alert("Assignment updated successfully!");
      } else {
        await teacherService.createAssignment(assignmentData);
        alert("Assignment created successfully!");
      }

      resetForm();
      setShowModal(false);
      fetchAssignments();
    } catch (err: any) {
      console.error("Assignment Error:", err.response?.data);
      alert(err.response?.data?.message || "Error processing assignment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (id: number) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return;
    
    try {
      await teacherService.deleteAssignment(id);
      alert("Assignment deleted successfully!");
      fetchAssignments();
    } catch (err: any) {
      alert(err.response?.data?.message || "Error deleting assignment");
    }
  };

  const handleGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    try {
      await teacherService.reviewSubmission(selectedSubmission.id, {
        obtainedMarks,
        teacherFeedback,
      });
      alert("Submission graded successfully!");
      setShowGradeModal(false);
      setSelectedSubmission(null);
      fetchSubmissions();
    } catch (err: any) {
      alert(err.response?.data?.message || "Error grading submission");
    }
  };

  const openGradeModal = (submission: any) => {
    setSelectedSubmission(submission);
    setObtainedMarks(submission.obtainedMarks || 0);
    setTeacherFeedback(submission.teacherFeedback || "");
    setShowGradeModal(true);
  };

  return (
    <div className="min-h-screen bg-[#0f111a] text-gray-100 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between rounded-xl bg-[#1a1d2d] p-6 shadow-xl border border-gray-800">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 font-bold text-xl text-white">
              {user?.name ? user.name.charAt(0).toUpperCase() : "T"}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Teacher Dashboard</h1>
              <p className="text-sm text-gray-400">Welcome back, <span className="text-blue-400">{user?.name}</span> 👋</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleOpenModal()}
              className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 font-medium text-white shadow-lg hover:from-blue-500 hover:to-indigo-500 transition-all"
            >
              + Create Assignment
            </button>
            <button
              onClick={logout}
              className="rounded-lg bg-red-500/20 px-4 py-2.5 font-medium text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white transition-all"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl bg-[#1a1d2d] p-5 border border-gray-800">
            <p className="text-xs font-semibold text-blue-400 tracking-wider uppercase">Total Assignments</p>
            <p className="mt-2 text-3xl font-bold text-white">{assignments.length}</p>
          </div>
          <div className="rounded-xl bg-[#1a1d2d] p-5 border border-gray-800">
            <p className="text-xs font-semibold text-teal-400 tracking-wider uppercase">Submissions Received</p>
            <p className="mt-2 text-3xl font-bold text-white">{submissions.length}</p>
          </div>
          <div className="rounded-xl bg-[#1a1d2d] p-5 border border-gray-800">
            <p className="text-xs font-semibold text-amber-400 tracking-wider uppercase">Pending Reviews</p>
            <p className="mt-2 text-3xl font-bold text-white">
              {submissions.filter((s) => s.status !== "Reviewed").length}
            </p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="rounded-xl bg-[#1a1d2d] border border-gray-800 shadow-xl overflow-hidden">
          <div className="border-b border-gray-800 bg-[#141625]">
            <nav className="flex gap-2 p-2">
              <button
                onClick={() => setActiveTab("assignments")}
                className={`rounded-lg px-6 py-2.5 text-sm font-medium transition-all ${
                  activeTab === "assignments"
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                }`}
              >
                My Assignments ({assignments.length})
              </button>
              <button
                onClick={() => setActiveTab("submissions")}
                className={`rounded-lg px-6 py-2.5 text-sm font-medium transition-all ${
                  activeTab === "submissions"
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                }`}
              >
                Student Submissions ({submissions.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "assignments" && (
              <div>
                {loading ? (
                  <p className="text-center py-8 text-gray-400">Loading assignments...</p>
                ) : assignments.length === 0 ? (
                  <p className="py-12 text-center text-gray-400">No assignments created yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-300">
                      <thead className="bg-[#141625] text-xs uppercase text-gray-400">
                        <tr>
                          <th className="p-4">Title</th>
                          <th className="p-4">Class</th>
                          <th className="p-4">Subject</th>
                          <th className="p-4">Deadline</th>
                          <th className="p-4">Max Marks</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {assignments.map((assignment: any) => {
                          const isAssignmentDraft = assignment.status === 0 || assignment.status === "Draft" || assignment.isDraft === true;
                          return (
                            <tr key={assignment.id} className="hover:bg-[#21253b] transition-colors">
                              <td className="p-4 font-semibold text-white">{assignment.title}</td>
                              <td className="p-4 text-gray-400">{assignment.classRoomName || "N/A"}</td>
                              <td className="p-4 text-gray-400">{assignment.subjectName || "N/A"}</td>
                              <td className="p-4 text-gray-400">
                                {new Date(assignment.deadline).toLocaleString()}
                              </td>
                              <td className="p-4 text-gray-400">{assignment.maxMarks}</td>
                              <td className="p-4">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                                    isAssignmentDraft
                                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                      : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  }`}
                                >
                                  {isAssignmentDraft ? "Draft" : "Published"}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => handleOpenModal(assignment)}
                                    className="rounded-md bg-blue-600/20 px-3 py-1.5 text-xs text-blue-400 hover:bg-blue-600 hover:text-white transition-all border border-blue-500/30"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteAssignment(assignment.id)}
                                    className="rounded-md bg-red-600/20 px-3 py-1.5 text-xs text-red-400 hover:bg-red-600 hover:text-white transition-all border border-red-500/30"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "submissions" && (
              <div>
                {submissions.length === 0 ? (
                  <p className="py-12 text-center text-gray-400">No submissions yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-300">
                      <thead className="bg-[#141625] text-xs uppercase text-gray-400">
                        <tr>
                          <th className="p-4">Assignment</th>
                          <th className="p-4">Student</th>
                          <th className="p-4">Submitted At</th>
                          <th className="p-4">Status</th>
                          <th className="p-4">Marks</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {submissions.map((submission) => (
                          <tr key={submission.id} className="hover:bg-[#21253b] transition-colors">
                            <td className="p-4 font-semibold text-white">
                              {submission.assignmentTitle}
                            </td>
                            <td className="p-4 text-gray-400">{submission.studentName}</td>
                            <td className="p-4 text-gray-400">
                              {new Date(submission.submittedAt).toLocaleString()}
                            </td>
                            <td className="p-4">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-medium ${
                                  submission.status === "Reviewed"
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                }`}
                              >
                                {submission.status}
                              </span>
                            </td>
                            <td className="p-4 text-gray-300 font-medium">
                              {submission.obtainedMarks !== null
                                ? `${submission.obtainedMarks}`
                                : "Not graded"}
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => openGradeModal(submission)}
                                className="rounded-md bg-emerald-600/20 px-3 py-1.5 text-xs text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all border border-emerald-500/30"
                              >
                                {submission.status === "Reviewed" ? "Update Grade" : "Grade Work"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 z-50">
          <div className="w-full max-w-lg rounded-xl bg-[#1a1d2d] border border-gray-800 p-6 shadow-2xl">
            <h3 className="mb-4 text-xl font-bold text-white">
              {editingAssignment ? "Edit Assignment" : "Create Assignment"}
            </h3>
            <form onSubmit={handleSubmitAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase">Title</label>
                <input
                  type="text"
                  required
                  className="mt-1 w-full rounded-lg bg-[#141625] border border-gray-700 p-2.5 text-white focus:border-blue-500 focus:outline-none"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase">Description</label>
                <textarea
                  required
                  rows={3}
                  className="mt-1 w-full rounded-lg bg-[#141625] border border-gray-700 p-2.5 text-white focus:border-blue-500 focus:outline-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase">Class Room</label>
                  <select
                    required
                    className="mt-1 w-full rounded-lg bg-[#141625] border border-gray-700 p-2.5 text-white focus:border-blue-500 focus:outline-none"
                    value={classRoomId}
                    onChange={(e) => setClassRoomId(Number(e.target.value))}
                  >
                    <option value="">Select Class</option>
                    {classList.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase">Subject</label>
                  <select
                    required
                    className="mt-1 w-full rounded-lg bg-[#141625] border border-gray-700 p-2.5 text-white focus:border-blue-500 focus:outline-none"
                    value={subjectId}
                    onChange={(e) => setSubjectId(Number(e.target.value))}
                  >
                    <option value="">Select Subject</option>
                    {subjectList.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase">Deadline</label>
                  <input
                    type="datetime-local"
                    required
                    className="mt-1 w-full rounded-lg bg-[#141625] border border-gray-700 p-2.5 text-white focus:border-blue-500 focus:outline-none"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase">Max Marks</label>
                  <input
                    type="number"
                    required
                    className="mt-1 w-full rounded-lg bg-[#141625] border border-gray-700 p-2.5 text-white focus:border-blue-500 focus:outline-none"
                    value={maxMarks}
                    onChange={(e) => setMaxMarks(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isDraft"
                  className="h-4 w-4 rounded border-gray-700 bg-[#141625] text-blue-600 focus:ring-0"
                  checked={isDraft}
                  onChange={(e) => setIsDraft(e.target.checked)}
                />
                <label htmlFor="isDraft" className="text-sm text-gray-300">Save as Draft (Hide from students)</label>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg bg-gray-800 px-4 py-2 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 font-medium text-white shadow-lg hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editingAssignment ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grade Modal */}
      {showGradeModal && selectedSubmission && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 z-50">
          <div className="w-full max-w-md rounded-xl bg-[#1a1d2d] border border-gray-800 p-6 shadow-2xl">
            <h3 className="mb-4 text-xl font-bold text-white">Grade Submission</h3>
            <div className="mb-4 rounded-lg bg-[#141625] border border-gray-800 p-4 space-y-1">
              <p className="text-xs text-gray-400 uppercase font-semibold">
                Student: <span className="text-white normal-case font-normal">{selectedSubmission.studentName}</span>
              </p>
              <p className="text-xs text-gray-400 uppercase font-semibold">
                Assignment: <span className="text-white normal-case font-normal">{selectedSubmission.assignmentTitle}</span>
              </p>
              <div className="mt-2 pt-2 border-t border-gray-800">
                <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Student Answer:</p>
                <p className="text-sm text-gray-200 bg-[#0f111a] p-2.5 rounded border border-gray-800">
                  {selectedSubmission.answerContent || "No text provided"}
                </p>
              </div>
            </div>
            <form onSubmit={handleGradeSubmission} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase">Obtained Marks</label>
                <input
                  type="number"
                  required
                  min="0"
                  className="mt-1 w-full rounded-lg bg-[#141625] border border-gray-700 p-2.5 text-white focus:border-blue-500 focus:outline-none"
                  value={obtainedMarks}
                  onChange={(e) => setObtainedMarks(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase">Teacher Feedback</label>
                <textarea
                  rows={3}
                  className="mt-1 w-full rounded-lg bg-[#141625] border border-gray-700 p-2.5 text-white focus:border-blue-500 focus:outline-none"
                  value={teacherFeedback}
                  onChange={(e) => setTeacherFeedback(e.target.value)}
                  placeholder="Provide feedback to the student..."
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGradeModal(false)}
                  className="rounded-lg bg-gray-800 px-4 py-2 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-5 py-2 font-medium text-white shadow-lg hover:bg-emerald-500"
                >
                  Save Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
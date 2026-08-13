"use client";

import { useEffect, useState } from "react";
import { getAuthUser, logout, User } from "@/lib/auth";
import { studentService, StudentAssignment } from "@/lib/studentService";

export default function StudentDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [selectedAssignment, setSelectedAssignment] = useState<StudentAssignment | null>(null);
  const [answerContent, setAnswerContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setUser(getAuthUser());
    fetchStudentAssignments();
  }, []);

  const fetchStudentAssignments = async () => {
    try {
      setLoading(true);
      const data = await studentService.getAssignments();
      setAssignments(data);
    } catch (err) {
      console.error("Failed to fetch assignments", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item: StudentAssignment, editMode = false) => {
    setSelectedAssignment(item);
    setIsEditing(editMode);
    setAnswerContent(editMode ? item.submittedContent || "" : "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    setSubmitting(true);
    try {
      if (isEditing && selectedAssignment.submissionId) {
        // Update Submission
        await studentService.updateSubmission(selectedAssignment.submissionId, {
          answerContent,
        });
        alert("Submission updated successfully!");
      } else {
        // New Submission
        await studentService.submitAssignment({
          assignmentId: selectedAssignment.id,
          answerContent,
        });
        alert("Assignment submitted successfully!");
      }

      setSelectedAssignment(null);
      setAnswerContent("");
      fetchStudentAssignments();
    } catch (err: any) {
      alert(err.response?.data?.message || "Error processing request");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper check for submission state (handles backend casing variations)
  const checkIsSubmitted = (item: any) => {
    return Boolean(item.isSubmitted ?? item.IsSubmitted ?? item.submissionId);
  };

  // Stats calculation
  const totalAssignments = assignments.length;
  const submittedCount = assignments.filter((item) => checkIsSubmitted(item)).length;
  const pendingCount = totalAssignments - submittedCount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4 md:p-8 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-6">
        
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row items-center justify-between rounded-2xl bg-white/10 backdrop-blur-md p-6 border border-white/10 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-2xl font-bold text-white shadow-lg shadow-indigo-500/30">
              {user?.name ? user.name.charAt(0).toUpperCase() : "S"}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-wide">Student Dashboard</h1>
              <p className="text-sm font-medium text-indigo-200">Welcome back, <span className="text-amber-400 font-semibold">{user?.name || "Student"}</span> 👋</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-4 sm:mt-0 flex items-center gap-2 rounded-xl bg-rose-500/20 hover:bg-rose-600 px-5 py-2.5 text-sm font-semibold text-rose-300 hover:text-white border border-rose-500/30 transition-all duration-200 hover:shadow-lg hover:shadow-rose-500/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Logout
          </button>
        </div>

        {/* Dynamic Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-gradient-to-br from-indigo-600/30 to-blue-600/20 p-5 border border-indigo-500/20 shadow-xl">
            <p className="text-xs uppercase font-bold text-indigo-300 tracking-wider">Total Assignments</p>
            <p className="text-3xl font-extrabold text-white mt-2">{totalAssignments}</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-emerald-600/30 to-teal-600/20 p-5 border border-emerald-500/20 shadow-xl">
            <p className="text-xs uppercase font-bold text-emerald-300 tracking-wider">Submitted Work</p>
            <p className="text-3xl font-extrabold text-emerald-400 mt-2">{submittedCount}</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-amber-600/30 to-orange-600/20 p-5 border border-amber-500/20 shadow-xl">
            <p className="text-xs uppercase font-bold text-amber-300 tracking-wider">Pending Action</p>
            <p className="text-3xl font-extrabold text-amber-400 mt-2">{pendingCount}</p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="rounded-2xl bg-slate-900/80 backdrop-blur-xl p-6 border border-slate-800 shadow-2xl">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-indigo-500 animate-pulse"></span>
              Assigned Tasks
            </h2>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
              <p className="text-slate-400 font-medium animate-pulse">Fetching your assignments...</p>
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-16 bg-slate-800/30 rounded-xl border border-slate-800">
              <p className="text-slate-400 text-lg">🎉 No assignments found for your class right now.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {assignments.map((item) => {
                const isPastDeadline = new Date(item.deadline) < new Date();
                const isSubmitted = checkIsSubmitted(item);

                return (
                  <div
                    key={item.id}
                    className="group relative flex flex-col justify-between rounded-2xl bg-slate-800/50 hover:bg-slate-800/80 p-6 border border-slate-700/60 hover:border-indigo-500/50 shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <div>
                      {/* Status Header */}
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                          {item.title}
                        </h3>

                        {isSubmitted ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30 shadow-sm">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                            Submitted
                          </span>
                        ) : isPastDeadline ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/20 px-3 py-1 text-xs font-bold text-rose-400 border border-rose-500/30">
                            Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-500/30 animate-pulse">
                            Pending
                          </span>
                        )}
                      </div>

                      <p className="mt-3 text-sm text-slate-300 line-clamp-3 leading-relaxed">
                        {item.description || "No description provided."}
                      </p>

                      {/* Details Box */}
                      <div className="mt-5 space-y-2 rounded-xl bg-slate-900/60 p-3.5 border border-slate-800 text-xs text-slate-400">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Deadline:</span>
                          <span className="font-semibold text-slate-200">{new Date(item.deadline).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Max Marks:</span>
                          <span className="font-semibold text-amber-400">{item.maxMarks}</span>
                        </div>

                        {/* Marks & Feedback Box */}
                        {isSubmitted && (
                          <div className="mt-3 border-t border-slate-800 pt-2.5">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-indigo-400">Obtained Grade:</span>
                              <span className="font-bold text-emerald-400 text-sm">
                                {item.marksObtained !== null && item.marksObtained !== undefined
                                  ? `${item.marksObtained} / ${item.maxMarks}`
                                  : "Pending Evaluation"}
                              </span>
                            </div>
                            {item.teacherFeedback && (
                              <div className="mt-2 rounded-lg bg-indigo-950/50 p-2.5 border border-indigo-900/40 text-indigo-200">
                                <span className="font-bold text-indigo-400 block mb-0.5">Teacher Feedback:</span>
                                {item.teacherFeedback}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6">
                      {!isSubmitted && !isPastDeadline && (
                        <button
                          onClick={() => handleOpenModal(item, false)}
                          className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-200 active:scale-[0.98]"
                        >
                          Submit Work
                        </button>
                      )}

                      {isSubmitted && !isPastDeadline && (
                        <button
                          onClick={() => handleOpenModal(item, true)}
                          className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 transition-all duration-200 active:scale-[0.98]"
                        >
                          Update Submission
                        </button>
                      )}

                      {isPastDeadline && (
                        <button
                          disabled
                          className="w-full rounded-xl bg-slate-800 py-3 text-sm font-medium text-slate-500 border border-slate-700/50 cursor-not-allowed"
                        >
                          Closed (Deadline Passed)
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Styled Submission Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 p-6 border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-xl font-bold text-white">
                {isEditing ? "Update Submission" : "Submit Work"}
              </h3>
              <button
                onClick={() => setSelectedAssignment(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Submission Details / Drive Link <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Paste your Google Drive/Dropbox link or write your answer directly..."
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={answerContent}
                  onChange={(e) => setAnswerContent(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAssignment(null)}
                  className="rounded-xl bg-slate-800 hover:bg-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 disabled:opacity-50 transition-all"
                >
                  {submitting ? "Processing..." : isEditing ? "Save Changes" : "Confirm Submission"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
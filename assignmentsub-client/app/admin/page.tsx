"use client";

import { useEffect, useState } from "react";
import { getAuthUser, logout, User } from "@/lib/auth";
import { adminService, User as AdminUser, ClassRoom, Subject, CreateUserDto, UpdateUserDto, CreateClassRoomDto, CreateSubjectDto } from "@/lib/adminService";

// Role enum mapping to match backend
const RoleEnum = {
  Admin: 0,
  Teacher: 1,
  Student: 2
} as const;

const RoleNames = {
  0: "Admin",
  1: "Teacher", 
  2: "Student"
} as const;

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [classRooms, setClassRooms] = useState<ClassRoom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"users" | "classes" | "subjects" | "assignments" | "submissions">("users");

  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showAssignTeacherModal, setShowAssignTeacherModal] = useState(false);

  // Form states
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // User form
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userRole, setUserRole] = useState<keyof typeof RoleEnum>("Student");
  const [userClassRoomId, setUserClassRoomId] = useState<number | "">("");

  // Class form
  const [className, setClassName] = useState("");
  const [classSection, setClassSection] = useState("");

  // Subject form
  const [subjectName, setSubjectName] = useState("");
  const [subjectClassRoomId, setSubjectClassRoomId] = useState<number | "">("");

  // Teacher assignment
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | "">("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | "">("");

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setUser(getAuthUser());
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [usersData, classRoomsData, subjectsData, assignmentsData, submissionsData] = await Promise.all([
        adminService.getUsers(),
        adminService.getClassRooms(),
        adminService.getSubjects(),
        adminService.getAllAssignments(),
        adminService.getAllSubmissions(),
      ]);
      setUsers(usersData);
      setClassRooms(classRoomsData);
      setSubjects(subjectsData);
      setAssignments(assignmentsData);
      setSubmissions(submissionsData);
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setLoading(false);
    }
  };

  // User Management
  const resetUserForm = () => {
    setEditingUser(null);
    setUserName("");
    setUserEmail("");
    setUserPassword("");
    setUserRole("Student");
    setUserClassRoomId("");
  };

  const handleOpenUserModal = (user?: AdminUser) => {
    if (user) {
      setEditingUser(user);
      setUserName(user.name);
      setUserEmail(user.email);
      setUserPassword("");
      setUserRole(user.role as "Admin" | "Teacher" | "Student");
      setUserClassRoomId(user.classRoomId || "");
    } else {
      resetUserForm();
    }
    setShowUserModal(true);
  };

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Convert role to enum number for API
      const roleNumber = RoleEnum[userRole];
      
      const userData = {
        name: userName,
        email: userEmail,
        role: roleNumber, // Send as enum number (0, 1, 2)
        classRoomId: userRole === "Student" && userClassRoomId ? Number(userClassRoomId) : null,
      };

      if (editingUser) {
        // For updates, only include password if provided
        const updateData = {
          ...userData,
          ...(userPassword ? { password: userPassword } : {})
        };
        await adminService.updateUser(editingUser.id, updateData as UpdateUserDto);
        alert("User updated successfully!");
      } else {
        // For creation, password is required
        if (!userPassword) {
          alert("Password is required for new users");
          return;
        }
        const createData = {
          ...userData,
          password: userPassword
        };
        await adminService.createUser(createData as CreateUserDto);
        alert("User created successfully!");
      }

      resetUserForm();
      setShowUserModal(false);
      fetchAllData();
    } catch (err: any) {
      console.error("User submission error:", err.response?.data);
      alert(err.response?.data?.message || "Error processing user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    
    try {
      await adminService.deleteUser(id);
      alert("User deleted successfully!");
      fetchAllData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Error deleting user");
    }
  };

  // ClassRoom Management
  const resetClassForm = () => {
    setEditingClass(null);
    setClassName("");
    setClassSection("");
  };

  const handleOpenClassModal = (classRoom?: ClassRoom) => {
    if (classRoom) {
      setEditingClass(classRoom);
      setClassName(classRoom.name);
      setClassSection(classRoom.section);
    } else {
      resetClassForm();
    }
    setShowClassModal(true);
  };

  const handleSubmitClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const classData = { name: className, section: classSection };

      if (editingClass) {
        await adminService.updateClassRoom(editingClass.id, classData);
        alert("Class updated successfully!");
      } else {
        await adminService.createClassRoom(classData);
        alert("Class created successfully!");
      }

      resetClassForm();
      setShowClassModal(false);
      fetchAllData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Error processing class");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClass = async (id: number) => {
    if (!confirm("Are you sure you want to delete this class?")) return;
    
    try {
      await adminService.deleteClassRoom(id);
      alert("Class deleted successfully!");
      fetchAllData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Error deleting class");
    }
  };

  // Subject Management
  const resetSubjectForm = () => {
    setEditingSubject(null);
    setSubjectName("");
    setSubjectClassRoomId("");
  };

  const handleOpenSubjectModal = (subject?: Subject) => {
    if (subject) {
      setEditingSubject(subject);
      setSubjectName(subject.name);
      setSubjectClassRoomId(subject.classRoomId);
    } else {
      resetSubjectForm();
    }
    setShowSubjectModal(true);
  };

  const handleSubmitSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const subjectData = { name: subjectName, classRoomId: Number(subjectClassRoomId) };

      if (editingSubject) {
        await adminService.updateSubject(editingSubject.id, subjectData);
        alert("Subject updated successfully!");
      } else {
        await adminService.createSubject(subjectData);
        alert("Subject created successfully!");
      }

      resetSubjectForm();
      setShowSubjectModal(false);
      fetchAllData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Error processing subject");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubject = async (id: number) => {
    if (!confirm("Are you sure you want to delete this subject?")) return;
    
    try {
      await adminService.deleteSubject(id);
      alert("Subject deleted successfully!");
      fetchAllData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Error deleting subject");
    }
  };

  // Teacher Assignment
  const handleAssignTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherId || !selectedSubjectId) return;

    try {
      await adminService.assignTeacher(Number(selectedTeacherId), Number(selectedSubjectId));
      alert("Teacher assigned successfully!");
      setShowAssignTeacherModal(false);
      setSelectedTeacherId("");
      setSelectedSubjectId("");
    } catch (err: any) {
      alert(err.response?.data?.message || "Error assigning teacher");
    }
  };

  const teachers = users.filter(u => u.role === "Teacher");

  return (
    <div className="min-h-screen bg-[#0f111a] text-gray-100 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between rounded-xl bg-[#1a1d2d] p-6 shadow-xl border border-gray-800">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-600 font-bold text-xl text-white">
              {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-sm text-gray-400">Welcome back, <span className="text-purple-400">{user?.name}</span> 👑</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAssignTeacherModal(true)}
              className="rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 font-medium text-white shadow-lg hover:from-emerald-500 hover:to-teal-500 transition-all"
            >
              Assign Teacher
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="rounded-xl bg-[#1a1d2d] p-5 border border-gray-800">
            <p className="text-xs font-semibold text-purple-400 tracking-wider uppercase">Total Users</p>
            <p className="mt-2 text-3xl font-bold text-white">{users.length}</p>
          </div>
          <div className="rounded-xl bg-[#1a1d2d] p-5 border border-gray-800">
            <p className="text-xs font-semibold text-blue-400 tracking-wider uppercase">Classes</p>
            <p className="mt-2 text-3xl font-bold text-white">{classRooms.length}</p>
          </div>
          <div className="rounded-xl bg-[#1a1d2d] p-5 border border-gray-800">
            <p className="text-xs font-semibold text-teal-400 tracking-wider uppercase">Subjects</p>
            <p className="mt-2 text-3xl font-bold text-white">{subjects.length}</p>
          </div>
          <div className="rounded-xl bg-[#1a1d2d] p-5 border border-gray-800">
            <p className="text-xs font-semibold text-amber-400 tracking-wider uppercase">Assignments</p>
            <p className="mt-2 text-3xl font-bold text-white">{assignments.length}</p>
          </div>
          <div className="rounded-xl bg-[#1a1d2d] p-5 border border-gray-800">
            <p className="text-xs font-semibold text-rose-400 tracking-wider uppercase">Submissions</p>
            <p className="mt-2 text-3xl font-bold text-white">{submissions.length}</p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="rounded-xl bg-[#1a1d2d] border border-gray-800 shadow-xl overflow-hidden">
          <div className="border-b border-gray-800 bg-[#141625]">
            <nav className="flex gap-2 p-2">
              {[
                { key: "users", label: `Users (${users.length})`, color: "purple" },
                { key: "classes", label: `Classes (${classRooms.length})`, color: "blue" },
                { key: "subjects", label: `Subjects (${subjects.length})`, color: "teal" },
                { key: "assignments", label: `Assignments (${assignments.length})`, color: "amber" },
                { key: "submissions", label: `Submissions (${submissions.length})`, color: "rose" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`rounded-lg px-6 py-2.5 text-sm font-medium transition-all ${
                    activeTab === tab.key
                      ? `bg-${tab.color}-600/20 text-${tab.color}-400 border border-${tab.color}-500/30`
                      : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {loading ? (
              <p className="text-center py-8 text-gray-400">Loading...</p>
            ) : (
              <>
                {/* Users Tab */}
                {activeTab === "users" && (
                  <div>
                    <div className="mb-4 flex justify-between items-center">
                      <h2 className="text-lg font-semibold text-white">User Management</h2>
                      <button
                        onClick={() => handleOpenUserModal()}
                        className="rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 font-medium text-white shadow-lg hover:from-purple-500 hover:to-indigo-500 transition-all"
                      >
                        + Add User
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-gray-300">
                        <thead className="bg-[#141625] text-xs uppercase text-gray-400">
                          <tr>
                            <th className="p-4">Name</th>
                            <th className="p-4">Email</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Class</th>
                            <th className="p-4">Created</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                          {users.map((user) => (
                            <tr key={user.id} className="hover:bg-[#21253b] transition-colors">
                              <td className="p-4 font-semibold text-white">{user.name}</td>
                              <td className="p-4 text-gray-400">{user.email}</td>
                              <td className="p-4">
                                <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                                  user.role === "Admin" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                                  user.role === "Teacher" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                                  "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                }`}>
                                  {user.role}
                                </span>
                              </td>
                              <td className="p-4 text-gray-400">{user.classRoomId || "N/A"}</td>
                              <td className="p-4 text-gray-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                              <td className="p-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => handleOpenUserModal(user)}
                                    className="rounded-md bg-blue-600/20 px-3 py-1.5 text-xs text-blue-400 hover:bg-blue-600 hover:text-white transition-all border border-blue-500/30"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="rounded-md bg-red-600/20 px-3 py-1.5 text-xs text-red-400 hover:bg-red-600 hover:text-white transition-all border border-red-500/30"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Classes Tab */}
                {activeTab === "classes" && (
                  <div>
                    <div className="mb-4 flex justify-between items-center">
                      <h2 className="text-lg font-semibold text-white">Class Management</h2>
                      <button
                        onClick={() => handleOpenClassModal()}
                        className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 font-medium text-white shadow-lg hover:from-blue-500 hover:to-indigo-500 transition-all"
                      >
                        + Add Class
                      </button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {classRooms.map((classRoom) => (
                        <div key={classRoom.id} className="rounded-xl bg-[#141625] border border-gray-800 p-5 shadow-lg hover:shadow-xl transition-all">
                          <h3 className="font-semibold text-white text-lg">{classRoom.name}</h3>
                          <p className="text-sm text-gray-400 mt-1">Section: {classRoom.section}</p>
                          <div className="mt-4 flex gap-2">
                            <button
                              onClick={() => handleOpenClassModal(classRoom)}
                              className="rounded-md bg-blue-600/20 px-3 py-1.5 text-xs text-blue-400 hover:bg-blue-600 hover:text-white transition-all border border-blue-500/30"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteClass(classRoom.id)}
                              className="rounded-md bg-red-600/20 px-3 py-1.5 text-xs text-red-400 hover:bg-red-600 hover:text-white transition-all border border-red-500/30"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subjects Tab */}
                {activeTab === "subjects" && (
                  <div>
                    <div className="mb-4 flex justify-between items-center">
                      <h2 className="text-lg font-semibold text-white">Subject Management</h2>
                      <button
                        onClick={() => handleOpenSubjectModal()}
                        className="rounded-lg bg-gradient-to-r from-teal-600 to-cyan-600 px-5 py-2.5 font-medium text-white shadow-lg hover:from-teal-500 hover:to-cyan-500 transition-all"
                      >
                        + Add Subject
                      </button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {subjects.map((subject) => (
                        <div key={subject.id} className="rounded-xl bg-[#141625] border border-gray-800 p-5 shadow-lg hover:shadow-xl transition-all">
                          <h3 className="font-semibold text-white text-lg">{subject.name}</h3>
                          <p className="text-sm text-gray-400 mt-1">Class: {subject.classRoomName}</p>
                          <div className="mt-4 flex gap-2">
                            <button
                              onClick={() => handleOpenSubjectModal(subject)}
                              className="rounded-md bg-teal-600/20 px-3 py-1.5 text-xs text-teal-400 hover:bg-teal-600 hover:text-white transition-all border border-teal-500/30"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteSubject(subject.id)}
                              className="rounded-md bg-red-600/20 px-3 py-1.5 text-xs text-red-400 hover:bg-red-600 hover:text-white transition-all border border-red-500/30"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assignments Tab */}
                {activeTab === "assignments" && (
                  <div>
                    <h2 className="mb-4 text-lg font-semibold text-white">All Assignments</h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-gray-300">
                        <thead className="bg-[#141625] text-xs uppercase text-gray-400">
                          <tr>
                            <th className="p-4">Title</th>
                            <th className="p-4">Teacher</th>
                            <th className="p-4">Class</th>
                            <th className="p-4">Subject</th>
                            <th className="p-4">Deadline</th>
                            <th className="p-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                          {assignments.map((assignment) => (
                            <tr key={assignment.id} className="hover:bg-[#21253b] transition-colors">
                              <td className="p-4 font-semibold text-white">{assignment.title}</td>
                              <td className="p-4 text-gray-400">{assignment.teacherName}</td>
                              <td className="p-4 text-gray-400">{assignment.classRoomName}</td>
                              <td className="p-4 text-gray-400">{assignment.subjectName}</td>
                              <td className="p-4 text-gray-400">{new Date(assignment.deadline).toLocaleString()}</td>
                              <td className="p-4">
                                <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                                  assignment.status === "Published" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                }`}>
                                  {assignment.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Submissions Tab */}
                {activeTab === "submissions" && (
                  <div>
                    <h2 className="mb-4 text-lg font-semibold text-white">All Submissions</h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-gray-300">
                        <thead className="bg-[#141625] text-xs uppercase text-gray-400">
                          <tr>
                            <th className="p-4">Assignment</th>
                            <th className="p-4">Student</th>
                            <th className="p-4">Submitted At</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Marks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                          {submissions.map((submission) => (
                            <tr key={submission.id} className="hover:bg-[#21253b] transition-colors">
                              <td className="p-4 font-semibold text-white">{submission.assignmentTitle}</td>
                              <td className="p-4 text-gray-400">{submission.studentName}</td>
                              <td className="p-4 text-gray-400">{new Date(submission.submittedAt).toLocaleString()}</td>
                              <td className="p-4">
                                <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                                  submission.status === "Reviewed" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                }`}>
                                  {submission.status}
                                </span>
                              </td>
                              <td className="p-4 text-gray-300 font-medium">{submission.obtainedMarks || "Not graded"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 z-50">
          <div className="w-full max-w-lg rounded-xl bg-[#1a1d2d] border border-gray-800 p-6 shadow-2xl">
            <h3 className="mb-4 text-xl font-bold text-white">
              {editingUser ? "Edit User" : "Create User"}
            </h3>
            <form onSubmit={handleSubmitUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase">Name</label>
                <input
                  type="text"
                  required
                  className="mt-1 w-full rounded-lg bg-[#141625] border border-gray-700 p-2.5 text-white focus:border-purple-500 focus:outline-none"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase">Email</label>
                <input
                  type="email"
                  required
                  className="mt-1 w-full rounded-lg bg-[#141625] border border-gray-700 p-2.5 text-white focus:border-purple-500 focus:outline-none"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase">
                  Password {editingUser && "(leave blank to keep current)"}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  className="mt-1 w-full rounded-lg bg-[#141625] border border-gray-700 p-2.5 text-white focus:border-purple-500 focus:outline-none"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase">Role</label>
                <select
                  required
                  className="mt-1 w-full rounded-lg bg-[#141625] border border-gray-700 p-2.5 text-white focus:border-purple-500 focus:outline-none"
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as "Admin" | "Teacher" | "Student")}
                >
                  <option value="Student">Student</option>
                  <option value="Teacher">Teacher</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              {userRole === "Student" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase">Class</label>
                  <select
                    className="mt-1 w-full rounded-lg bg-[#141625] border border-gray-700 p-2.5 text-white focus:border-purple-500 focus:outline-none"
                    value={userClassRoomId}
                    onChange={(e) => setUserClassRoomId(Number(e.target.value))}
                  >
                    <option value="">Select Class</option>
                    {classRooms.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="rounded-lg bg-gray-800 px-4 py-2 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2 font-medium text-white shadow-lg hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editingUser ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Class Modal */}
      {showClassModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 z-50">
          <div className="w-full max-w-md rounded-xl bg-[#1a1d2d] border border-gray-800 p-6 shadow-2xl">
            <h3 className="mb-4 text-xl font-bold text-white">
              {editingClass ? "Edit Class" : "Create Class"}
            </h3>
            <form onSubmit={handleSubmitClass} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase">Name</label>
                <input
                  type="text"
                  required
                  className="mt-1 w-full rounded-lg bg-[#141625] border border-gray-700 p-2.5 text-white focus:border-blue-500 focus:outline-none"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase">Section</label>
                <input
                  type="text"
                  required
                  className="mt-1 w-full rounded-lg bg-[#141625] border border-gray-700 p-2.5 text-white focus:border-blue-500 focus:outline-none"
                  value={classSection}
                  onChange={(e) => setClassSection(e.target.value)}
                />
              </div>
              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClassModal(false)}
                  className="rounded-lg bg-gray-800 px-4 py-2 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 font-medium text-white shadow-lg hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editingClass ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subject Modal */}
      {showSubjectModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 z-50">
          <div className="w-full max-w-md rounded-xl bg-[#1a1d2d] border border-gray-800 p-6 shadow-2xl">
            <h3 className="mb-4 text-xl font-bold text-white">
              {editingSubject ? "Edit Subject" : "Create Subject"}
            </h3>
            <form onSubmit={handleSubmitSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase">Name</label>
                <input
                  type="text"
                  required
                  className="mt-1 w-full rounded-lg bg-[#141625] border border-gray-700 p-2.5 text-white focus:border-teal-500 focus:outline-none"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase">Class</label>
                <select
                  required
                  className="mt-1 w-full rounded-lg bg-[#141625] border border-gray-700 p-2.5 text-white focus:border-teal-500 focus:outline-none"
                  value={subjectClassRoomId}
                  onChange={(e) => setSubjectClassRoomId(Number(e.target.value))}
                >
                  <option value="">Select Class</option>
                  {classRooms.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
                  ))}
                </select>
              </div>
              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubjectModal(false)}
                  className="rounded-lg bg-gray-800 px-4 py-2 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-gradient-to-r from-teal-600 to-cyan-600 px-5 py-2 font-medium text-white shadow-lg hover:from-teal-500 hover:to-cyan-500 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editingSubject ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Teacher Modal */}
      {showAssignTeacherModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 z-50">
          <div className="w-full max-w-md rounded-xl bg-[#1a1d2d] border border-gray-800 p-6 shadow-2xl">
            <h3 className="mb-4 text-xl font-bold text-white">Assign Teacher to Subject</h3>
            <form onSubmit={handleAssignTeacher} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase">Teacher</label>
                <select
                  required
                  className="mt-1 w-full rounded-lg bg-[#141625] border border-gray-700 p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(Number(e.target.value))}
                >
                  <option value="">Select Teacher</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase">Subject</label>
                <select
                  required
                  className="mt-1 w-full rounded-lg bg-[#141625] border border-gray-700 p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
                >
                  <option value="">Select Subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>{subject.name} ({subject.classRoomName})</option>
                  ))}
                </select>
              </div>
              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignTeacherModal(false)}
                  className="rounded-lg bg-gray-800 px-4 py-2 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-5 py-2 font-medium text-white shadow-lg hover:bg-emerald-500"
                >
                  Assign Teacher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
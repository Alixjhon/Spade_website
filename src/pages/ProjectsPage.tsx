import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  FileText,
  Image,
  Code,
  Download,
  Eye,
  FolderOpen,
  Gamepad2,
  Globe,
  Camera,
  Users,
  Plus,
  Calendar as CalendarIcon,
  ClipboardList,
  Send,
   ArrowRight,
   Layers3,
   CheckCircle2,
   AlertCircle,
   Lock,
   Type,
   AlignLeft,
   Loader2,
   Trophy,
   FileSignature,
   MessageSquare,
   Pencil,
   Paperclip,
   UploadCloud,
   Video,
 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { useAuth } from "@/components/AuthProvider";
import type { ClassroomActivityItem, ProjectItem } from "@/lib/types";

const typeIcons: Record<string, React.ElementType> = {
  code: Code,
  image: Image,
  document: FileText,
};

const emptySubmissionDraft = {
  title: "",
  description: "",
  fileName: "",
  fileUrl: "",
};

const emptyActivityDraft = {
  title: "",
  description: "",
  deadline: null as Date | null,
};

const classrooms = [
  {
    id: "gamedev",
    label: "Game Developer",
    shortLabel: "GameDev",
    projectRole: "Game Developer",
    icon: Gamepad2,
    accent: "from-[#60B5FF] via-[#AFDDFF] to-[#FFECDB]",
    badge: "Prototype Lab",
    description:
      "Gameplay systems, prototypes, jams, and interactive experiments.",
  },
  {
    id: "webdev",
    label: "Web Developer",
    shortLabel: "WebDev",
    projectRole: "Web Developer",
    icon: Globe,
    accent: "from-[#60B5FF] via-[#AFDDFF] to-[#FFECDB]",
    badge: "Frontend Studio",
    description: "Sites, portals, dashboards, and deployment-ready web work.",
  },
  {
    id: "softwaredev",
    label: "Software Developer",
    shortLabel: "SoftwareDev",
    projectRole: "Software Developer",
    icon: Code,
    accent: "from-[#60B5FF] via-[#AFDDFF] to-[#FFECDB]",
    badge: "Systems Room",
    description: "Apps, tooling, automation, and deeper engineering projects.",
  },
  {
    id: "media",
    label: "Media Team",
    shortLabel: "Media",
    projectRole: "Media Team",
    icon: Camera,
    accent: "from-[#60B5FF] via-[#AFDDFF] to-[#FFECDB]",
    badge: "Creative Deck",
    description:
      "Visual assets, campaign materials, branding, and promo content.",
  },
];

const classroomRoleMap = Object.fromEntries(
  classrooms.map((classroom) => [classroom.id, classroom.projectRole]),
) as Record<string, string>;

const classroomIds = new Set(classrooms.map((classroom) => classroom.id));

function getSubmissionPreviewKind(project: Pick<ProjectItem, "fileName" | "fileUrl" | "type">) {
  const fileName = project.fileName.toLowerCase();
  const fileUrl = project.fileUrl.toLowerCase();

  if (project.type === "image" || fileName.match(/\.(png|jpg|jpeg|gif|webp|svg)$/)) {
    return "image";
  }

  if (
    fileName.match(/\.(mp4|webm|ogg|mov)$/) ||
    fileUrl.startsWith("data:video/")
  ) {
    return "video";
  }

  return "document";
}

function SubmissionPreview({ project }: { project: ProjectItem }) {
  const kind = getSubmissionPreviewKind(project);

  if (kind === "image") {
    return (
      <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50">
        <img
          src={project.fileUrl}
          alt={project.title}
          className="max-h-[420px] w-full object-contain bg-white"
        />
      </div>
    );
  }

  if (kind === "video") {
    return (
      <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-950">
        <video
          src={project.fileUrl}
          controls
          className="max-h-[420px] w-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-5">
      <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
          <FileText className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">{project.fileName}</p>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            Preview depends on browser support
          </p>
        </div>
      </div>
      <iframe
        src={project.fileUrl}
        title={project.title}
        className="h-[360px] w-full rounded-2xl border border-slate-200 bg-white"
      />
    </div>
  );
}

function OverviewMetric({
  label,
  value,
  hint,
  className = "",
  isDark = false,
}: {
  label: string;
  value: string | number;
  hint: string;
  className?: string;
  isDark?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.5rem] border border-white/20 px-4 py-4 backdrop-blur-sm transition-all duration-300 ${className}`}
    >
      <p
        className={`text-xs uppercase tracking-[0.22em] ${isDark ? "text-white/70" : "text-slate-700"}`}
      >
        {label}
      </p>
      <p
        className={`mt-2 text-3xl font-semibold ${isDark ? "text-white" : "text-slate-950"}`}
      >
        {value}
      </p>
      <p
        className={`mt-1 text-sm ${isDark ? "text-white/60" : "text-slate-800/70"}`}
      >
        {hint}
      </p>
    </div>
  );
}

const ProjectsPage = () => {
  const { user } = useAuth();
  const isPresident = user?.role === "president";
  const accessibleClassrooms = useMemo(() => {
    if (isPresident) {
      return classrooms;
    }

    if (user?.role && classroomIds.has(user.role)) {
      return classrooms.filter((classroom) => classroom.id === user.role);
    }

    return [];
  }, [isPresident, user?.role]);
  const userClassroomId = accessibleClassrooms[0]?.id ?? classrooms[0].id;
  const [createActivityOpen, setCreateActivityOpen] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [projectPreviewOpen, setProjectPreviewOpen] = useState(false);
  const [activeClassroom, setActiveClassroom] = useState(userClassroomId);
  const [selectedBoardActivityId, setSelectedBoardActivityId] = useState<number | null>(null);
  const [selectedClassroom, setSelectedClassroom] = useState<string | null>(
    null,
  );
  const [selectedActivity, setSelectedActivity] =
    useState<ClassroomActivityItem | null>(null);
  const [previewProject, setPreviewProject] = useState<ProjectItem | null>(null);
  const [editingActivity, setEditingActivity] = useState<ClassroomActivityItem | null>(null);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [newActivity, setNewActivity] = useState(emptyActivityDraft);
  const [viewedClassrooms, setViewedClassrooms] = useState<Set<string>>(
    new Set(userClassroomId ? [userClassroomId] : []),
  );
  const [submissionDraft, setSubmissionDraft] = useState(emptySubmissionDraft);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();

  const {
    data,
    isLoading: isLoadingProjects,
    error: projectsError,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: api.getProjects,
  });

  const {
    data: activitiesData,
    isLoading: isLoadingActivities,
    error: activitiesError,
  } = useQuery({
    queryKey: ["activities"],
    queryFn: api.getActivities,
  });

  const createActivityMutation = useMutation({
    mutationFn: api.createActivity,
    onSuccess: () => {
      toast.success("Activity assigned successfully!");
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setCreateActivityOpen(false);
      setEditingActivity(null);
      setNewActivity(emptyActivityDraft);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateActivityMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { title: string; description: string; deadline: string | null; points: number } }) =>
      api.updateActivity(id, payload),
    onSuccess: () => {
      toast.success("Activity updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      setCreateActivityOpen(false);
      setEditingActivity(null);
      setNewActivity(emptyActivityDraft);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const submitProjectMutation = useMutation({
    mutationFn: api.submitProject,
    onSuccess: () => {
      toast.success("Project submitted successfully!");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setSubmitDialogOpen(false);
      setSelectedActivity(null);
      setEditingProject(null);
      setSubmissionDraft(emptySubmissionDraft);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { title: string; description: string; fileUrl: string; fileName: string } }) =>
      api.updateProject(id, payload),
    onSuccess: () => {
      toast.success("Project updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setSubmitDialogOpen(false);
      setEditingProject(null);
      setSelectedActivity(null);
      setSubmissionDraft(emptySubmissionDraft);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const projects = data?.projects ?? [];
  const activities = activitiesData?.activities ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const totalOpenActivities = activities.filter(
    (activity) => !activity.deadline || activity.deadline >= today,
  ).length;
  const totalClosedActivities = activities.filter(
    (activity) => activity.deadline && activity.deadline < today,
  ).length;

  const projectsByClassroom = useMemo(
    () =>
      accessibleClassrooms.map((classroom) => ({
        ...classroom,
        projects: projects.filter(
          (project) => project.role === classroom.projectRole,
        ),
        activities: activities.filter(
          (activity) => activity.classroomId === classroom.id,
        ),
      })),
    [accessibleClassrooms, projects, activities],
  );

  const projectsByActivityId = useMemo(
    () =>
      projects.reduce<Record<number, ProjectItem[]>>((acc, project) => {
        if (!project.activityId) {
          return acc;
        }

        if (!acc[project.activityId]) {
          acc[project.activityId] = [];
        }

        acc[project.activityId].push(project);
        return acc;
      }, {}),
    [projects],
  );

  const getProjectsForActivity = (activityId: number) =>
    projectsByActivityId[activityId] ?? [];

  useEffect(() => {
    if (!accessibleClassrooms.length) {
      return;
    }

    const nextClassroomId = accessibleClassrooms.some(
      (classroom) => classroom.id === activeClassroom,
    )
      ? activeClassroom
      : accessibleClassrooms[0].id;

    setActiveClassroom(nextClassroomId);
    setViewedClassrooms((prev) => new Set([...prev, nextClassroomId]));
  }, [accessibleClassrooms, activeClassroom]);

  useEffect(() => {
    const activeActivities =
      projectsByClassroom.find((classroom) => classroom.id === activeClassroom)
        ?.activities ?? [];

    if (!activeActivities.length) {
      setSelectedBoardActivityId(null);
      return;
    }

    if (
      selectedBoardActivityId &&
      activeActivities.some((activity) => activity.id === selectedBoardActivityId)
    ) {
      return;
    }

    setSelectedBoardActivityId(activeActivities[0].id);
  }, [projectsByClassroom, activeClassroom, selectedBoardActivityId]);

  const readFile = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
      reader.readAsDataURL(file);
    });

  const isActivityClosed = (activity: ClassroomActivityItem) =>
    Boolean(activity.deadline && activity.deadline < today);

  const openSubmissionDialog = (activity: ClassroomActivityItem) => {
    if (!user?.email) {
      toast.error("Sign in first before submitting a project.");
      return;
    }
    setSelectedActivity(activity);
    setSubmissionDraft({
      ...emptySubmissionDraft,
      title: activity.title,
      description: activity.description,
    });
    setSubmitDialogOpen(true);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const fileUrl = await readFile(file);
    setSubmissionDraft((current) => ({
      ...current,
      fileName: file.name,
      fileUrl,
    }));
    toast.success(`File "${file.name}" selected successfully!`);
  };

  const handleOpenCreateActivity = (classroomId: string) => {
    if (!user?.email) {
      toast.error("Sign in first before creating an activity.");
      return;
    }

    if (user.role !== "president") {
      toast.error("Only the president can assign project activities.");
      return;
    }

    setSelectedClassroom(classroomId);
    setEditingActivity(null);
    setNewActivity(emptyActivityDraft);
    setCreateActivityOpen(true);
  };

  const openEditActivityDialog = (activity: ClassroomActivityItem) => {
    if (!isPresident || activity.createdByEmail !== user?.email) {
      toast.error("You can only edit activities that you assigned.");
      return;
    }

    setSelectedClassroom(activity.classroomId);
    setEditingActivity(activity);
    setNewActivity({
      title: activity.title,
      description: activity.description,
      deadline: activity.deadline ? new Date(activity.deadline) : null,
    });
    setCreateActivityOpen(true);
  };

  const handleCreateActivity = () => {
    if (user?.role !== "president") {
      toast.error("Only the president can assign project activities.");
      return;
    }

    if (!selectedClassroom) {
      toast.error("Choose a classroom first.");
      return;
    }

    const payload = {
      title: newActivity.title,
      description: newActivity.description,
      deadline: newActivity.deadline ? newActivity.deadline.toISOString() : null,
      points: 100,
    };

    if (editingActivity) {
      updateActivityMutation.mutate({
        id: editingActivity.id,
        payload,
      });
      return;
    }

    createActivityMutation.mutate({
      ...payload,
      classroomId: selectedClassroom,
    });
  };

  const openProjectPreview = (project: ProjectItem) => {
    setPreviewProject(project);
    setProjectPreviewOpen(true);
  };

  const openEditProjectDialog = (project: ProjectItem) => {
    if (project.submittedByEmail !== user?.email) {
      toast.error("You can only edit your own submitted project.");
      return;
    }

    const linkedActivity = activities.find((activity) => activity.id === project.activityId);
    if (!linkedActivity) {
      toast.error("The linked activity for this project could not be found.");
      return;
    }

    setEditingProject(project);
    setSelectedActivity(linkedActivity);
    setSubmissionDraft({
      title: project.title,
      description: project.description,
      fileName: project.fileName,
      fileUrl: project.fileUrl,
    });
    setProjectPreviewOpen(false);
    setSubmitDialogOpen(true);
  };

  const handleSubmitProject = () => {
    if (!selectedActivity) {
      return;
    }

    if (!submissionDraft.title.trim()) {
      toast.error("Project title is required.");
      return;
    }

    if (!submissionDraft.description.trim()) {
      toast.error("Project description is required.");
      return;
    }

    if (!submissionDraft.fileUrl || !submissionDraft.fileName) {
      toast.error("Attach a project file before submitting.");
      return;
    }

    if (!user?.email) {
      toast.error("Sign in first before submitting a project.");
      return;
    }

    const payload = {
      title: submissionDraft.title.trim(),
      description: submissionDraft.description.trim(),
      fileUrl: submissionDraft.fileUrl,
      fileName: submissionDraft.fileName,
    };

    if (editingProject) {
      updateProjectMutation.mutate({
        id: editingProject.id,
        payload,
      });
      return;
    }

    submitProjectMutation.mutate({
      activityId: selectedActivity.id,
      ...payload,
      submittedByEmail: user.email,
    });
  };

  const projectsRequestError =
    projectsError instanceof Error ? projectsError.message : "";
  const activitiesRequestError =
    activitiesError instanceof Error ? activitiesError.message : "";
  const pageError = projectsRequestError || activitiesRequestError;
  const submissionBlockedByDeadline =
    !editingProject && !!selectedActivity && isActivityClosed(selectedActivity);
  const activeClassroomData =
    projectsByClassroom.find((classroom) => classroom.id === activeClassroom) ??
    projectsByClassroom[0];
  const selectedBoardActivity =
    activeClassroomData?.activities.find(
      (activity) => activity.id === selectedBoardActivityId,
    ) ?? null;
  const liveBoardProjects = selectedBoardActivity
    ? getProjectsForActivity(selectedBoardActivity.id)
    : activeClassroomData?.projects ?? [];

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="group relative overflow-hidden rounded-[3rem] border border-white/60 bg-white/70 p-8 shadow-[0_20px_40px_-18px_rgba(0,0,0,0.08)] transition-all duration-300 hover:shadow-[0_28px_56px_-24px_rgba(0,0,0,0.12)] sm:p-12">
        {/* Dynamic Mesh Background */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-[240px] w-[240px] rounded-full bg-sky-400/10 blur-[60px]" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-[220px] w-[220px] rounded-full bg-orange-400/10 blur-[56px]" />

        <div className="relative grid gap-12 xl:grid-cols-[1.2fr_0.8fr]">
          {/* Left Column: Hero Content */}
          <div className="flex flex-col justify-center space-y-7">
            <div className="flex items-center gap-3">
              <Badge className="rounded-full bg-slate-950 px-4 py-1 text-[11px] font-bold uppercase tracking-widest text-white ring-4 ring-slate-950/5">
                Workspace v2
              </Badge>
              <div className="h-px w-12 bg-slate-200" />
            </div>

            <div className="space-y-4">
              <h1 className="max-w-xl text-4xl font-bold leading-[1.15] tracking-tight text-slate-950 sm:text-5xl">
                Streamline your{" "}
                <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                  Project Lifecycle
                </span>
                .
              </h1>
              <p className="max-w-lg text-base leading-relaxed text-slate-600/90">
                A centralized dashboard for technical teams. Track development
                milestones, manage submission sprints, and monitor real-time
                classroom activity.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              {[
                {
                  label: `${activities.length} Assignments`,
                  icon: Layers3,
                  color: "text-sky-600",
                },
                {
                  label: `${projects.length} Submissions`,
                  icon: CheckCircle2,
                  color: "text-emerald-600",
                },
              ].map((tag, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 rounded-2xl border border-white/80 bg-white/70 px-5 py-2.5 shadow-sm"
                >
                  <tag.icon className={`h-4 w-4 ${tag.color}`} />
                  <span className="text-sm font-semibold text-slate-700">
                    {tag.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Interactive Bento Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <OverviewMetric
              label="Open"
              value={totalOpenActivities}
              hint="Active Sprints"
              className="bg-emerald-50/50 hover:bg-emerald-50"
            />
            <OverviewMetric
              label="Due"
              value={totalClosedActivities}
              hint="Past Deadlines"
              className="bg-rose-50/50 hover:bg-rose-50"
            />
            <div className="col-span-2">
              <OverviewMetric
                label="Environment"
                value={accessibleClassrooms.length}
                hint={isPresident ? "Active Classrooms" : "Accessible Classroom"}
                className="bg-slate-900 text-white hover:bg-slate-800"
                isDark
              />
            </div>
            <div className="col-span-2 flex items-center justify-between rounded-3xl border border-slate-100 bg-white/80 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Your Identity
                  </p>
                  <p className="text-sm font-bold text-slate-900 capitalize">
                    {user?.role || "Member"}
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </section>

      {pageError ? (
        <div className="rounded-[1.75rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {pageError}
        </div>
      ) : null}

      {!accessibleClassrooms.length ? (
        <div className="rounded-[2rem] border border-amber-200 bg-amber-50/80 px-6 py-5 text-sm text-amber-800">
          Your account is not assigned to a project classroom yet.
        </div>
      ) : null}

      {accessibleClassrooms.length > 0 ? (
      <Tabs
        value={activeClassroom}
        onValueChange={(id) => {
          setActiveClassroom(id);
          setViewedClassrooms((prev) => new Set(prev).add(id));
        }}
        className="space-y-8"
      >
        <div className="flex justify-center sm:justify-start">
          <TabsList className="inline-flex h-auto items-center justify-start gap-1 rounded-[2rem] border border-white/60 bg-white/70 p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
            {projectsByClassroom.map((classroom) => {
              const Icon = classroom.icon;
              const isActive = activeClassroom === classroom.id;

              return (
                <TabsTrigger
                  key={classroom.id}
                  value={classroom.id}
                  className={`
                    relative flex items-center gap-2.5 rounded-[1.6rem] px-6 py-3 text-sm font-bold transition-all duration-300 focus-visible:ring-0
                    ${
                      isActive
                        ? "bg-slate-950 text-white shadow-lg shadow-slate-200"
                        : "text-slate-500 hover:bg-white/80 hover:text-slate-900"
                    }
                  `}
                >
                  <Icon
                    className={`h-4 w-4 transition-transform duration-300 ${isActive ? "scale-110" : "scale-100 opacity-70"}`}
                  />
                  <span className="relative tracking-tight">
                    {classroom.shortLabel}
                  </span>

                  {/* Indicator dot for unviewed assignments */}
                  {classroom.activities.length > 0 &&
                    !isActive &&
                    !viewedClassrooms.has(classroom.id) && (
                      <span className="absolute -right-1 -top-1 flex h-3 w-3">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-sky-400/55"></span>
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-sky-500"></span>
                      </span>
                    )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {activeClassroomData ? (() => {
          const classroom = activeClassroomData;
          const Icon = classroom.icon;

          return (
            <TabsContent
              key={classroom.id}
              value={classroom.id}
              className="animate-in fade-in duration-300 space-y-8 focus-visible:outline-none"
            >
              {/* 1. Hero Header Card */}
              <div className="relative overflow-hidden rounded-[2.5rem] border border-white/40 bg-white/55 p-8 shadow-xl">
                <div
                  className={`absolute inset-0 opacity-15 bg-gradient-to-br ${classroom.accent}`}
                />

                <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                    <div
                      className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-white shadow-xl shadow-slate-200/50`}
                    >
                      <Icon className="h-10 w-10 text-slate-800" />
                    </div>
                    <div className="space-y-2">
                      <Badge className="bg-slate-900/5 hover:bg-slate-900/10 border-0 text-slate-900 px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                        {classroom.badge}
                      </Badge>
                      <h2 className="text-4xl font-bold tracking-tight text-slate-950">
                        {classroom.label}
                      </h2>
                      <p className="max-w-md text-sm font-medium text-slate-600/80">
                        {classroom.description}
                      </p>
                    </div>
                  </div>

                  {/* Key Metrics Stats */}
                  <div className="flex gap-10">
                    {[
                      { label: "Projects", val: classroom.projects.length },
                      { label: "Activities", val: classroom.activities.length },
                    ].map((stat, i) => (
                      <div key={i} className="text-center">
                        <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500 mb-1">
                          {stat.label}
                        </p>
                        <p className="text-4xl font-bold bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-transparent">
                          {stat.val}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. Main Content Grid */}
              <div className="relative overflow-hidden rounded-[2.5rem] border border-white/40 bg-white/55 p-6 shadow-xl">
                <div
                  className={`absolute inset-0 opacity-10 bg-gradient-to-br ${classroom.accent}`}
                />
                <div className="relative grid grid-cols-1 gap-8 lg:grid-cols-12">
                  {/* Left Column: Activities (The Work) */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="flex items-center justify-between px-2">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">
                          Active Assignments
                        </h3>
                        <p className="text-sm text-slate-500 font-medium">
                          {isPresident
                            ? "Assign and review work"
                            : "View assigned work and submit your project"}
                        </p>
                      </div>
                      {isPresident ? (
                        <Button
                          onClick={() => handleOpenCreateActivity(classroom.id)}
                          className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800 px-6 h-12 shadow-lg"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Assign
                        </Button>
                      ) : (
                        <Badge className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-sky-700 shadow-sm">
                          View + Submit
                        </Badge>
                      )}
                    </div>

                    <div className="grid gap-4">
                      {isLoadingActivities ? (
                        Array.from({ length: 2 }).map((_, index) => (
                          <div
                            key={index}
                            className="h-48 animate-pulse rounded-[2rem] border border-slate-200/70 bg-white/70"
                          />
                        ))
                      ) : classroom.activities.length === 0 ? (
                        <div className="rounded-[1.7rem] border border-border/50 bg-muted/35 p-10 text-center">
                          <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
                          <p className="font-semibold text-slate-600">
                            No activities have been assigned
                          </p>
                        </div>
                      ) : (
                        classroom.activities.map((activity, index) => {
                          const closed = isActivityClosed(activity);
                          const matchedProjects = getProjectsForActivity(activity.id);
                          const isBoardFocused = selectedBoardActivityId === activity.id;
                          // Pad index for a technical feel (e.g., 01, 02)
                          const displayIndex = String(index + 1).padStart(2, '0');

                          return (
                            <button
                              key={activity.id}
                              onClick={() => setSelectedBoardActivityId(activity.id)}
                              className={`group relative flex flex-col overflow-hidden rounded-[2.5rem] border p-8 text-left transition-all duration-700
                                ${closed 
                                  ? "border-slate-200 bg-slate-50/60 grayscale-[0.8]" 
                                  : "border-white/80 bg-[linear-gradient(135deg,#ffffff,#f8faff)] shadow-[0_14px_32px_rgba(0,0,0,0.05)] hover:-translate-y-1 hover:border-sky-400/40 hover:shadow-[0_22px_44px_rgba(0,0,0,0.07)]"
                                }
                                ${isBoardFocused ? "ring-2 ring-sky-400/60" : ""}`}
                            >
                              {/* 1. Detail: Subtle Technical Grid Background */}
                              <div className="absolute inset-0 opacity-[0.03] [mask-image:linear-gradient(to_bottom,white,transparent)] bg-[grid:24px_24px] z-0" />
                              

                              <div className="relative z-10 flex flex-col h-full">
                                <div className="mb-6 flex items-start justify-between">
                                  <div className="space-y-1.5">
                                    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest
                                      ${closed ? "bg-slate-200 text-slate-500" : "bg-slate-950 text-white shadow-md shadow-slate-200"}`}>
                                      {!closed && <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />}
                                      {closed ? "Sprint Concluded" : "Active Sprint"}
                                    </div>
                                    <p className="pl-1 text-[9px] font-bold text-slate-400 uppercase tracking-tighter">System ID: {String(activity.id).slice(0,8)}</p>
                                  </div>

                                  <div className="flex items-start gap-3">
                                    {isPresident && activity.createdByEmail === user?.email ? (
                                      <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openEditActivityDialog(activity);
                                        }}
                                        className="h-10 w-10 rounded-2xl bg-white/80 text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-white"
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                    ) : null}
                                    <div className="flex flex-col items-end">
                                     <span className="text-[10px] font-black text-slate-400 uppercase leading-none">Yield</span>
                                     <span className="text-2xl font-black text-slate-950">{activity.points}<span className="text-xs text-slate-400 ml-0.5">PTS</span></span>
                                    </div>
                                  </div>
                                </div>

                                <h4 className="max-w-[85%] text-2xl font-extrabold leading-tight tracking-tight text-slate-950 group-hover:text-sky-600 transition-colors">
                                  {activity.title}
                                </h4>
                                
                                <p className="mt-3 text-sm leading-relaxed text-slate-600 font-medium line-clamp-2 pr-4">
                                  {activity.description || "Establish technical parameters and submit documentation for internal review."}
                                </p>

                                <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
                                  <div className="flex gap-6">
                                    <div className="space-y-1">
                                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Chronology</p>
                                      <div className="flex items-center gap-2">
                                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100">
                                          <CalendarIcon className="h-3 w-3 text-slate-500" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-800">{activity.deadline || "TBD"}</span>
                                      </div>
                                    </div>
                                    
                                    <div className="space-y-1">
                                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Security</p>
                                      <div className="flex items-center gap-2">
                                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100">
                                          <Lock className="h-3 w-3 text-slate-500" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-800 uppercase tracking-tighter">Public</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <div className="hidden rounded-2xl border border-slate-100 bg-white/80 px-3 py-2 text-right shadow-sm sm:block">
                                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
                                        Linked Submissions
                                      </p>
                                      <p className="mt-1 text-sm font-bold text-slate-800">
                                        {matchedProjects.length}
                                      </p>
                                    </div>
                                    <Button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openSubmissionDialog(activity);
                                      }}
                                      disabled={closed && !isPresident}
                                      className="rounded-2xl bg-slate-950 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white hover:bg-sky-600"
                                    >
                                      {closed && !isPresident ? "Closed" : "Submit"}
                                    </Button>
                                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-500 
                                      ${closed 
                                        ? "bg-slate-100 text-slate-300" 
                                        : "bg-white text-slate-950 shadow-sm ring-1 ring-slate-200 group-hover:bg-slate-950 group-hover:text-white group-hover:ring-slate-950"}`}>
                                      <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Right Column: Recent Submissions Board */}
                  <div className="lg:col-span-5 space-y-6">
                    <div className="flex items-center justify-between px-2">
                      <div>
                        <h3 className="text-2xl font-bold tracking-tight text-slate-950">
                          Live Board
                        </h3>
                        <p className="text-sm font-medium text-slate-500">
                          {selectedBoardActivity
                            ? `Submissions for ${selectedBoardActivity.title}`
                            : "Real-time team contributions"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedBoardActivity ? (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setSelectedBoardActivityId(null)}
                            className="rounded-2xl px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500"
                          >
                            Show All
                          </Button>
                        ) : null}
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100">
                          <div className="h-2 w-2 rounded-full bg-sky-500" />
                        </div>
                      </div>
                    </div>

                    <div className="relative space-y-4 rounded-[2.5rem] border border-slate-200/60 bg-slate-50/60 p-6">
                      {isLoadingProjects ? (
                        Array.from({ length: 3 }).map((_, index) => (
                          <div
                            key={index}
                            className="h-24 animate-pulse rounded-3xl bg-white ring-1 ring-slate-100"
                          />
                        ))
                      ) : liveBoardProjects.length === 0 ? (
                        <div className="py-20 text-center">
                          <FolderOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                          <p className="font-bold text-slate-400">
                            {selectedBoardActivity
                              ? "No submissions for this assignment yet."
                              : "Quiet in here..."}
                          </p>
                        </div>
                      ) : (
                        liveBoardProjects.slice(0, 5).map((project) => {
                          const TypeIcon = typeIcons[project.type] || FileText;
                          return (
                            <article
                              key={project.id}
                              className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition-all hover:ring-sky-500/30"
                            >
                              <div className="flex gap-4">
                                <div className="h-12 w-12 shrink-0 rounded-2xl bg-sky-50 flex items-center justify-center">
                                  <TypeIcon className="h-6 w-6 text-sky-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-3">
                                    <h4 className="truncate font-bold text-slate-900">
                                      {project.title}
                                    </h4>
                                    {project.submittedByEmail === user?.email ? (
                                      <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => openEditProjectDialog(project)}
                                        className="h-8 w-8 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                    ) : null}
                                  </div>
                                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                                    {project.linkedActivityTitle ||
                                      classroomRoleMap[classroom.id]}
                                  </p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {project.date}
                                  </p>
                                  <div className="mt-4 flex gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => openProjectPreview(project)}
                                      className="h-9 rounded-xl border-slate-200 px-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-700"
                                    >
                                      <Eye className="mr-2 h-3.5 w-3.5" />
                                      Preview
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </article>
                          );
                        })
                      )}
                      {liveBoardProjects.length > 5 && (
                        <Button
                          variant="ghost"
                          className="w-full rounded-2xl text-slate-500 font-bold text-xs uppercase tracking-widest"
                        >
                          View All Submissions
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          );
        })() : null}
      </Tabs>
      ) : null}

      {/* Create Activity Dialog */}
      <Dialog
        open={isPresident && createActivityOpen}
        onOpenChange={(open) => {
          setCreateActivityOpen(isPresident ? open : false);
          if (!open) {
            setEditingActivity(null);
            setNewActivity(emptyActivityDraft);
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px] overflow-hidden rounded-[2.5rem] border-white/40 bg-white/95 p-0 shadow-2xl">
          {/* 1. Header with Background Detail */}
          <div className="relative p-8 pb-4">
            <div className="absolute inset-0 z-0 opacity-[0.03] bg-[grid:20px_20px]" />
            <div className="relative z-10 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-xl">
                <ClipboardList className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-2xl font-black tracking-tight text-slate-950">
                  {editingActivity ? "Edit Activity" : "Assign Activity"}
                </DialogTitle>
                <DialogDescription className="text-sm font-medium text-slate-500">
                  {editingActivity
                    ? "Refine the task details for this workspace."
                    : "Deploy a new task to your team workspace."}
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* 2. Form Body */}
          <div className="space-y-6 px-8 py-6">
            {/* Title Input Section */}
            <div className="group space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 group-focus-within:text-sky-500 transition-colors">
                <Type className="h-3 w-3" /> Activity Title
              </label>
              <Input
                placeholder="e.g. Q2 System Architecture Review"
                value={newActivity.title}
                onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                className="h-14 rounded-2xl border-slate-200 bg-white px-5 text-base font-bold shadow-sm transition-all focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>

            {/* Description Section */}
            <div className="group space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 group-focus-within:text-sky-500 transition-colors">
                <AlignLeft className="h-3 w-3" /> Project Guidelines
              </label>
              <Textarea
                placeholder="Define the scope, technical requirements, and expected deliverables..."
                rows={5}
                value={newActivity.description}
                onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                className="resize-none rounded-2xl border-slate-200 bg-white p-5 text-sm font-medium leading-relaxed shadow-sm transition-all focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>

            {/* Deadline Section - Now Full Width and Enhanced */}
            <div className="group space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 group-focus-within:text-sky-500 transition-colors">
                <CalendarIcon className="h-3 w-3" /> Submission Deadline
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`h-14 w-full justify-start rounded-2xl border-slate-200 bg-white px-5 text-left font-bold transition-all hover:bg-slate-50 
                      ${!newActivity.deadline ? "text-slate-400" : "text-slate-900"}`}
                  >
                    <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 group-hover:bg-white transition-colors">
                      <CalendarIcon className="h-4 w-4" />
                    </div>
                    {newActivity.deadline ? format(newActivity.deadline, "PPP") : "Select a target date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto rounded-3xl border-slate-200 p-0 shadow-xl" align="start">
                  <Calendar
                    mode="single"
                    selected={newActivity.deadline || undefined}
                    onSelect={(date) => setNewActivity({ ...newActivity, deadline: date ?? null })}
                    initialFocus
                    className="p-4"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* 3. Footer with Premium Buttons */}
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 p-8">
            <Button
              variant="ghost"
              onClick={() => {
                setCreateActivityOpen(false);
                setEditingActivity(null);
                setNewActivity(emptyActivityDraft);
              }}
              className="rounded-xl font-bold text-slate-500 hover:text-slate-950"
            >
              Discard
            </Button>
            
            <Button
              className={`h-12 rounded-xl px-8 font-black uppercase tracking-widest transition-all duration-300
                ${!newActivity.title 
                  ? "bg-slate-200 text-slate-400" 
                  : "bg-slate-950 text-white shadow-xl shadow-slate-200 hover:bg-sky-600 hover:shadow-sky-100 active:scale-95"}`}
              onClick={handleCreateActivity}
              disabled={!isPresident || !newActivity.title || createActivityMutation.isPending || updateActivityMutation.isPending || !selectedClassroom}
            >
              {createActivityMutation.isPending || updateActivityMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing</span>
                </div>
              ) : (
                editingActivity ? "Save Activity" : "Assign Activity"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={submitDialogOpen}
        onOpenChange={(open) => {
          setSubmitDialogOpen(open);
          if (!open) {
            setSelectedActivity(null);
            setEditingProject(null);
            setSubmissionDraft(emptySubmissionDraft);
          }
        }}
      >
        <DialogContent className="sm:max-w-[650px] overflow-hidden rounded-[2.5rem] border-white/40 bg-white/95 p-0 shadow-2xl">
          {/* 1. Header Area */}
          <div className="relative border-b border-slate-100 p-8">
            <div className="absolute inset-0 z-0 opacity-[0.03] bg-[grid:20px_20px]" />
            <div className="relative z-10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500 text-white shadow-lg shadow-sky-200">
                  <Send className="h-5 w-5" />
                </div>
                <DialogTitle className="text-2xl font-black tracking-tight text-slate-950">
                  {editingProject ? "Edit Submission" : "Project Submission"}
                </DialogTitle>
              </div>
              <DialogDescription className="mt-2 text-sm font-medium text-slate-500">
                {editingProject
                  ? "Update your submitted file, summary, or project title."
                  : "Package your deliverables and transmit them to the classroom directory."}
              </DialogDescription>
            </div>
          </div>

          <div className="max-h-[70vh] overflow-y-auto p-8 pt-6 space-y-8">
            {selectedActivity && (
              <>
                {/* 2. Activity Summary Card (Technical Detail) */}
                <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-50/50 p-6">
                  <div className="absolute -right-4 -top-4 opacity-[0.05]">
                     <ClipboardList className="h-24 w-24 text-slate-950" />
                  </div>
                  
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md">Reference Activity</span>
                      <div className="h-px flex-1 bg-slate-200" />
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-black text-slate-950">{selectedActivity.title}</h4>
                      <p className="mt-1 text-sm font-medium text-slate-500 leading-relaxed">
                        {selectedActivity.description || "Refer to the initial project brief for specific hardware and documentation requirements."}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="rounded-xl border border-white bg-white/60 p-3 shadow-sm">
                        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Deadline Anchor</p>
                        <p className="mt-1 flex items-center gap-2 text-xs font-bold text-slate-700">
                          <CalendarIcon className="h-3 w-3 text-sky-500" />
                          {selectedActivity.deadline || "Open Submission"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-white bg-white/60 p-3 shadow-sm">
                        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Potential Yield</p>
                        <p className="mt-1 flex items-center gap-2 text-xs font-bold text-slate-700">
                          <Trophy className="h-3 w-3 text-amber-500" />
                          {selectedActivity.points} Points Available
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Input Fields (Industrial Detail) */}
                <div className="space-y-6">
                  <div className="group space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 group-focus-within:text-sky-500 transition-colors">
                      <FileSignature className="h-3 w-3" /> Submission Identity
                    </label>
                    <Input
                      value={submissionDraft.title}
                      onChange={(e) => setSubmissionDraft(c => ({ ...c, title: e.target.value }))}
                      placeholder="Name your specific implementation..."
                      className="h-14 rounded-2xl border-slate-200 bg-white px-5 font-bold shadow-sm transition-all focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500"
                    />
                  </div>

                  <div className="group space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 group-focus-within:text-sky-500 transition-colors">
                      <MessageSquare className="h-3 w-3" /> Technical Summary
                    </label>
                    <Textarea
                      rows={4}
                      value={submissionDraft.description}
                      onChange={(e) => setSubmissionDraft(c => ({ ...c, description: e.target.value }))}
                      placeholder="Explain your approach, challenges, and core logic..."
                      className="resize-none rounded-2xl border-slate-200 bg-white p-5 text-sm font-medium shadow-sm transition-all focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <Paperclip className="h-3 w-3" /> Attachment Portal
                    </label>
                    <input
                      id="project-file-upload"
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={(e) => void handleFileSelect(e)}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`group relative flex w-full flex-col items-center justify-center rounded-[1.8rem] border-2 border-dashed p-8 transition-all
                        ${submissionDraft.fileName 
                          ? "border-emerald-500/30 bg-emerald-50/20" 
                          : "border-slate-200 bg-white hover:border-sky-500/40 hover:bg-sky-50/10"}`}
                    >
                      <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl transition-transform group-hover:scale-110
                        ${submissionDraft.fileName ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"}`}>
                        <UploadCloud className="h-6 w-6" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-black text-slate-950">
                          {submissionDraft.fileName || "Transmit Local File"}
                        </p>
                        <p className="mt-1 text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
                          {submissionDraft.fileName ? "File successfully staged" : "Drag and drop or click to browse"}
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {submissionBlockedByDeadline && (
                  <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-600 shadow-sm">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <p className="text-xs font-black uppercase tracking-tight">Access Restricted: Submission Window Terminated</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* 4. Footer Buttons */}
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 p-8">
            <Button 
              variant="ghost" 
              onClick={() => setSubmitDialogOpen(false)}
              className="rounded-xl font-bold text-slate-400 hover:text-slate-950"
            >
              Abort
            </Button>
            <Button
              className={`h-14 rounded-2xl px-10 font-black uppercase tracking-widest transition-all duration-300
                ${!selectedActivity || submissionBlockedByDeadline || !submissionDraft.fileUrl || !submissionDraft.title.trim() || !submissionDraft.description.trim()
                  ? "bg-slate-200 text-slate-400" 
                  : "bg-slate-950 text-white shadow-xl shadow-slate-200 hover:bg-sky-600 hover:shadow-sky-100 active:scale-95"}`}
              disabled={submitProjectMutation.isPending || updateProjectMutation.isPending || !selectedActivity || !submissionDraft.fileUrl || !submissionDraft.title.trim() || !submissionDraft.description.trim() || submissionBlockedByDeadline}
              onClick={handleSubmitProject}
            >
              {submitProjectMutation.isPending || updateProjectMutation.isPending
                ? "Transmitting..."
                : editingProject
                  ? "Save Submission"
                  : "Execute Submission"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={projectPreviewOpen}
        onOpenChange={(open) => {
          setProjectPreviewOpen(open);
          if (!open) {
            setPreviewProject(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[780px] overflow-hidden rounded-[2.5rem] border-white/40 bg-white/95 p-0 shadow-2xl">
          {previewProject ? (
            <>
              <div className="border-b border-slate-100 p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <DialogTitle className="text-2xl font-black tracking-tight text-slate-950">
                      {previewProject.title}
                    </DialogTitle>
                    <DialogDescription className="mt-2 text-sm font-medium text-slate-500">
                      {previewProject.linkedActivityTitle || previewProject.description}
                    </DialogDescription>
                  </div>
                  <Badge className="rounded-full bg-slate-950 px-4 py-1.5 text-white">
                    {previewProject.type}
                  </Badge>
                </div>
              </div>

              <div className="max-h-[72vh] space-y-6 overflow-y-auto p-8">
                <SubmissionPreview project={previewProject} />
                <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Submission Summary
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-700">
                    {previewProject.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 p-8">
                <Button
                  type="button"
                  variant="outline"
                  asChild
                  className="rounded-2xl border-slate-200"
                >
                  <a href={previewProject.fileUrl} download={previewProject.fileName}>
                    <Download className="mr-2 h-4 w-4" />
                    Download File
                  </a>
                </Button>
                {previewProject.submittedByEmail === user?.email ? (
                  <Button
                    type="button"
                    onClick={() => openEditProjectDialog(previewProject)}
                    className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800"
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Submission
                  </Button>
                ) : null}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectsPage;

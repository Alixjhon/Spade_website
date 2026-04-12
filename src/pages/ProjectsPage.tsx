import { useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FileText, Image, Code, FolderOpen, Gamepad2, Globe, Camera, Users, Plus, Calendar as CalendarIcon, ClipboardList, Send, ArrowRight, Layers3, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { useAuth } from "@/components/AuthProvider";
import type { ClassroomActivityItem, ProjectItem } from "@/lib/types";

const typeIcons: Record<string, React.ElementType> = { code: Code, image: Image, document: FileText };

const emptySubmissionDraft = {
  title: "",
  description: "",
  fileName: "",
  fileUrl: "",
};

const classrooms = [
  {
    id: "gamedev",
    label: "Game Developer",
    shortLabel: "GameDev",
    projectRole: "Game Developer",
    icon: Gamepad2,
    accent: "from-orange-500 via-amber-400 to-yellow-300",
    badge: "Prototype Lab",
    description: "Gameplay systems, prototypes, jams, and interactive experiments.",
  },
  {
    id: "webdev",
    label: "Web Developer",
    shortLabel: "WebDev",
    projectRole: "Web Developer",
    icon: Globe,
    accent: "from-sky-500 via-cyan-400 to-blue-300",
    badge: "Frontend Studio",
    description: "Sites, portals, dashboards, and deployment-ready web work.",
  },
  {
    id: "softwaredev",
    label: "Software Developer",
    shortLabel: "SoftwareDev",
    projectRole: "Software Developer",
    icon: Code,
    accent: "from-emerald-500 via-teal-400 to-cyan-300",
    badge: "Systems Room",
    description: "Apps, tooling, automation, and deeper engineering projects.",
  },
  {
    id: "media",
    label: "Media Team",
    shortLabel: "Media",
    projectRole: "Media Team",
    icon: Camera,
    accent: "from-pink-500 via-rose-400 to-orange-300",
    badge: "Creative Deck",
    description: "Visual assets, campaign materials, branding, and promo content.",
  },
];

function SubmittedProjectsPreview({ projects }: { projects: ProjectItem[] }) {
  if (projects.length === 0) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-border/60 bg-background/40 px-4 py-3 text-sm text-muted-foreground">
        No submissions yet.
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Submitted Projects</p>
        <span className="text-xs font-medium text-foreground">{projects.length}</span>
      </div>
      <div className="space-y-2">
        {projects.map((project) => {
          const TypeIcon = typeIcons[project.type] || FileText;

          return (
            <div key={project.id} className="rounded-2xl border border-border/50 bg-background/55 px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary">
                  <TypeIcon className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-foreground">{project.title}</p>
                    <Badge variant="secondary" className="rounded-full">{project.type}</Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Submitted {project.date}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OverviewMetric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/20 bg-white/72 px-4 py-4 backdrop-blur-sm">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-700">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-800/70">{hint}</p>
    </div>
  );
}

const ProjectsPage = () => {
  const { user } = useAuth();
  const [createActivityOpen, setCreateActivityOpen] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [activeClassroom, setActiveClassroom] = useState(classrooms[0].id);
  const [selectedClassroom, setSelectedClassroom] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<ClassroomActivityItem | null>(null);
  const [newActivity, setNewActivity] = useState({
    title: "",
    description: "",
    deadline: null as Date | null,
    points: 100,
  });
  const [submissionDraft, setSubmissionDraft] = useState(emptySubmissionDraft);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();
  
  const { data } = useQuery({
    queryKey: ["projects"],
    queryFn: api.getProjects,
  });

  const { data: activitiesData } = useQuery({
    queryKey: ["activities"],
    queryFn: api.getActivities,
  });

  const createActivityMutation = useMutation({
    mutationFn: api.createActivity,
    onSuccess: () => {
      toast.success("Activity assigned successfully!");
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      setCreateActivityOpen(false);
      setNewActivity({ title: "", description: "", deadline: null, points: 100 });
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
      setSubmitDialogOpen(false);
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
  const totalOpenActivities = activities.filter((activity) => !activity.deadline || activity.deadline >= today).length;
  const totalClosedActivities = activities.filter((activity) => activity.deadline && activity.deadline < today).length;

  const projectsByClassroom = useMemo(
    () =>
      classrooms.map((classroom) => ({
        ...classroom,
        projects: projects.filter((project) => project.role === classroom.projectRole),
        activities: activities.filter((activity) => activity.classroomId === classroom.id),
      })),
    [projects, activities],
  );

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
    setSelectedActivity(activity);
    setSubmissionDraft(emptySubmissionDraft);
    setSubmitDialogOpen(true);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const fileUrl = await readFile(file);
    setSubmissionDraft((current) => ({ ...current, fileName: file.name, fileUrl }));
    toast.success(`File "${file.name}" selected successfully!`);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="relative overflow-hidden rounded-[2.4rem] border border-border/50 bg-[linear-gradient(135deg,rgba(250,252,255,0.96),rgba(233,244,255,0.94),rgba(255,244,233,0.92))] p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-10 top-0 h-44 w-44 rounded-full bg-sky-200/45 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-40 w-40 rounded-full bg-orange-200/35 blur-3xl" />
        <div className="relative grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
          <div className="space-y-5">
            <Badge className="rounded-full border-0 bg-white/80 px-4 py-1.5 text-slate-900">
              Project Workspace
            </Badge>
            <div className="space-y-3">
              <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Organize assignments, deadlines, and submissions in one project hub.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-800/75 sm:text-base">
                Each classroom acts like a live submission board. Open an activity to review the brief,
                check its points and deadline, and submit work directly from the card.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-slate-800/75">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2">
                <Layers3 className="h-4 w-4" />
                <span>{activities.length} active assignments</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>{projects.length} submitted projects</span>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <OverviewMetric label="Open Tasks" value={totalOpenActivities} hint="Still accepting work" />
            <OverviewMetric label="Closed Tasks" value={totalClosedActivities} hint="Past the deadline" />
            <OverviewMetric label="Classrooms" value={classrooms.length} hint="Team spaces available" />
            <OverviewMetric label="Your Access" value={user?.role || "member"} hint="Current signed-in role" />
          </div>
        </div>
      </section>

      <Tabs value={activeClassroom} onValueChange={setActiveClassroom} className="space-y-6">
        <TabsList className="h-auto flex-wrap rounded-[1.6rem] border border-border/50 bg-card/70 p-2 shadow-sm">
          {projectsByClassroom.map((classroom) => {
            const Icon = classroom.icon;
            return (
              <TabsTrigger key={classroom.id} value={classroom.id} className="rounded-[1rem] px-4 py-3">
                <Icon className="mr-2 h-4 w-4" />
                {classroom.shortLabel}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {projectsByClassroom.map((classroom) => {
          const Icon = classroom.icon;

          return (
            <TabsContent key={classroom.id} value={classroom.id} className="space-y-6">
              <section className="overflow-hidden rounded-[2rem] border border-border/50 bg-card/70">
                <div className={`bg-gradient-to-r ${classroom.accent} p-6 text-slate-950`}>
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-4">
                      <Badge className="border-0 bg-white/75 px-4 py-1.5 text-slate-900">{classroom.badge}</Badge>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="flex h-14 w-14 items-center justify-center rounded-[1.35rem] bg-white/80 shadow-sm">
                            <Icon className="h-6 w-6" />
                          </div>
                          <h2 className="text-3xl font-semibold">{classroom.label}</h2>
                        </div>
                        <p className="max-w-2xl text-sm leading-6 text-slate-900/75">{classroom.description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl bg-white/72 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-700">Projects</p>
                        <p className="mt-2 text-2xl font-semibold">{classroom.projects.length}</p>
                      </div>
                      <div className="rounded-2xl bg-white/72 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-700">Activities</p>
                        <p className="mt-2 text-2xl font-semibold">{classroom.activities.length}</p>
                      </div>
                      <div className="rounded-2xl bg-white/72 px-4 py-3 col-span-2 sm:col-span-1">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-700">Space</p>
                        <p className="mt-2 flex items-center gap-2 text-sm font-semibold">
                          <Users className="h-4 w-4" />
                          {classroom.shortLabel}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 p-6">
                  <div className="flex flex-col gap-4 rounded-[1.6rem] border border-border/50 bg-[linear-gradient(135deg,rgba(255,255,255,0.78),rgba(248,250,252,0.88))] p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <ClipboardList className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Assigned Activities</h3>
                        <p className="text-sm text-muted-foreground">Open a card to review submissions or send new work for that assignment.</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => {
                        setSelectedClassroom(classroom.id);
                        setCreateActivityOpen(true);
                      }}
                      className="gradient-primary text-primary-foreground rounded-xl"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Assign Activity
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {classroom.activities.length === 0 ? (
                      <div className="rounded-[1.5rem] border border-border/50 bg-background/60 p-5 text-sm text-muted-foreground">
                        No activities have been assigned for this classroom yet.
                      </div>
                    ) : (
                      <div className="grid gap-4 xl:grid-cols-2">
                        {classroom.activities.map((activity) => {
                          const closed = isActivityClosed(activity);
                          const submittedProjects = classroom.projects.filter(
                            (project) => project.activityId === activity.id,
                          );

                          return (
                            <button
                              key={activity.id}
                              type="button"
                              onClick={() => openSubmissionDialog(activity)}
                              className={`group rounded-[1.7rem] border p-5 text-left transition ${
                                closed
                                  ? "border-border/50 bg-muted/35"
                                  : "border-border/50 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(248,250,252,0.9))] hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)]"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className={`inline-flex h-2.5 w-2.5 rounded-full ${closed ? "bg-rose-400" : "bg-emerald-400"}`} />
                                    <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                                      {closed ? "Closed activity" : "Accepting submissions"}
                                    </span>
                                  </div>
                                  <h3 className="font-semibold text-foreground">{activity.title}</h3>
                                  <p className="mt-1 text-sm text-muted-foreground">{activity.description || "No description provided."}</p>
                                </div>
                                <Badge variant="secondary" className="rounded-full px-3 py-1">{activity.points} pts</Badge>
                              </div>
                              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                <div className="rounded-2xl border border-border/50 bg-background/50 px-4 py-3">
                                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Deadline</p>
                                  <p className="mt-1 text-sm font-medium text-foreground">{activity.deadline || "No deadline"}</p>
                                </div>
                                <div className="rounded-2xl border border-border/50 bg-background/50 px-4 py-3">
                                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Submissions</p>
                                  <p className="mt-1 text-sm font-medium text-foreground">
                                    {submittedProjects.length} project{submittedProjects.length === 1 ? "" : "s"}
                                  </p>
                                </div>
                              </div>
                              <SubmittedProjectsPreview projects={submittedProjects} />
                              <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4 text-sm">
                                <span className="text-muted-foreground">{closed ? "Review past submissions" : "Open this assignment"}</span>
                                <span className="inline-flex items-center gap-2 font-medium text-foreground">
                                  Open activity
                                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">Classroom Submission Board</h3>
                        <p className="text-sm text-muted-foreground">A broader view of all projects submitted in this team space.</p>
                      </div>
                      <Badge variant="secondary" className="rounded-full px-3 py-1">{classroom.projects.length} total</Badge>
                    </div>
                    {classroom.projects.length === 0 ? (
                      <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[1.75rem] border border-border/50 bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(248,250,252,0.88))] p-10 text-center">
                        <FolderOpen className="h-10 w-10 text-muted-foreground" />
                        <p className="mt-4 text-lg font-semibold text-foreground">No projects yet</p>
                        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                          This classroom is ready, but nobody has posted work here yet.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        {classroom.projects.map((project) => {
                          const TypeIcon = typeIcons[project.type] || FileText;

                          return (
                            <article key={project.id} className="rounded-[1.75rem] border border-border/50 bg-[linear-gradient(180deg,rgba(255,255,255,0.8),rgba(248,250,252,0.88))] p-5 transition hover:border-primary/30 hover:shadow-sm">
                              <div className="mb-4 flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl gradient-primary shadow-sm">
                                    <TypeIcon className="h-5 w-5 text-primary-foreground" />
                                  </div>
                                  <div>
                                    <h3 className="font-semibold text-foreground">{project.title}</h3>
                                    <p className="mt-1 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                                      Posted {project.date}
                                    </p>
                                  </div>
                                </div>
                                <Badge variant="secondary" className="rounded-full">{project.type}</Badge>
                              </div>

                              <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{project.description}</p>
                              {project.linkedActivityTitle ? (
                                <div className="mt-4 rounded-2xl border border-border/50 bg-background/55 px-4 py-3">
                                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Linked Activity</p>
                                  <p className="mt-1 font-medium text-foreground">{project.linkedActivityTitle}</p>
                                </div>
                              ) : null}
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Create Activity Dialog */}
      <Dialog open={createActivityOpen} onOpenChange={setCreateActivityOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Assign New Activity</DialogTitle>
            <DialogDescription>
              Create a task or activity for this team. Team members will be able to submit their projects here.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Activity Title</label>
              <Input 
                placeholder="Enter activity title" 
                value={newActivity.title}
                onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea 
                placeholder="Describe what needs to be done, requirements, and guidelines..."
                rows={4}
                value={newActivity.description}
                onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Deadline</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="secondary" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newActivity.deadline ? format(newActivity.deadline, 'PPP') : "Select deadline"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newActivity.deadline || undefined}
                      onSelect={(date) => setNewActivity({ ...newActivity, deadline: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Points</label>
                <Input 
                  type="number" 
                  placeholder="100"
                  value={newActivity.points}
                  onChange={(e) => setNewActivity({ ...newActivity, points: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateActivityOpen(false)}>Cancel</Button>
            <Button 
              className="gradient-primary text-primary-foreground"
              onClick={() => {
                createActivityMutation.mutate({
                  title: newActivity.title,
                  description: newActivity.description,
                  deadline: newActivity.deadline ? newActivity.deadline.toISOString() : null,
                  points: newActivity.points,
                  classroomId: selectedClassroom!,
                });
              }}
              disabled={!newActivity.title || createActivityMutation.isPending}
            >
              {createActivityMutation.isPending ? "Creating..." : "Assign Activity"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={submitDialogOpen}
        onOpenChange={(open) => {
          setSubmitDialogOpen(open);
          if (!open) {
            setSelectedActivity(null);
            setSubmissionDraft(emptySubmissionDraft);
          }
        }}
      >
        <DialogContent className="sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle>{selectedActivity?.title || "Submit Project"}</DialogTitle>
            <DialogDescription>
              Submit your work for this assigned activity. Submissions are only accepted before the deadline.
            </DialogDescription>
          </DialogHeader>

          {selectedActivity ? (
            <div className="space-y-4 py-2">
              <div className="rounded-[1.6rem] border border-border/50 bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(248,250,252,0.9))] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{selectedActivity.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedActivity.description || "No description provided."}
                    </p>
                  </div>
                  <Badge variant="secondary" className="rounded-full">
                    {selectedActivity.points} pts
                  </Badge>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/50 bg-background/60 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Deadline</p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {selectedActivity.deadline ? selectedActivity.deadline : "No deadline"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/50 bg-background/60 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Reward</p>
                    <p className="mt-1 text-sm font-medium text-foreground">{selectedActivity.points} points</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Project Title</label>
                <Input
                  value={submissionDraft.title}
                  onChange={(e) => setSubmissionDraft((current) => ({ ...current, title: e.target.value }))}
                  placeholder="Enter your project title"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Project Description</label>
                <Textarea
                  rows={4}
                  value={submissionDraft.description}
                  onChange={(e) => setSubmissionDraft((current) => ({ ...current, description: e.target.value }))}
                  placeholder="Describe what you built and what you are submitting."
                />
              </div>

              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    void handleFileSelect(e);
                  }}
                />
                <label className="text-sm font-medium">Project File</label>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start rounded-xl"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {submissionDraft.fileName || "Choose a file"}
                </Button>
              </div>

              {isActivityClosed(selectedActivity) ? (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  This activity is closed because the deadline has passed.
                </div>
              ) : null}
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setSubmitDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="gradient-primary text-primary-foreground"
              disabled={
                submitProjectMutation.isPending ||
                !selectedActivity ||
                isActivityClosed(selectedActivity) ||
                !user?.email ||
                !submissionDraft.title ||
                !submissionDraft.description ||
                !submissionDraft.fileUrl
              }
              onClick={() => {
                if (!selectedActivity) {
                  return;
                }

                submitProjectMutation.mutate({
                  activityId: selectedActivity.id,
                  title: submissionDraft.title,
                  description: submissionDraft.description,
                  fileUrl: submissionDraft.fileUrl,
                  fileName: submissionDraft.fileName,
                  submittedByEmail: user?.email || "",
                });
              }}
            >
              <Send className="mr-2 h-4 w-4" />
              {submitProjectMutation.isPending ? "Submitting..." : "Submit Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectsPage;

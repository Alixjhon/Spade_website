import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Upload, FileText, Image, Code, FolderOpen, Gamepad2, Globe, Camera, Users, Plus, Calendar as CalendarIcon, ClipboardList, Send, User } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { format } from "date-fns";

const typeIcons: Record<string, React.ElementType> = { code: Code, image: Image, document: FileText };

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

const ProjectsPage = () => {
  const [dragActive, setDragActive] = useState(false);
  const [createActivityOpen, setCreateActivityOpen] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState<string | null>(null);
  const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(null);
  const [newActivity, setNewActivity] = useState({
    title: "",
    description: "",
    deadline: null as Date | null,
    points: 100,
  });
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
  });

  const projects = data?.projects ?? [];
  const activities = activitiesData?.activities ?? [];

  const projectsByClassroom = useMemo(
    () =>
      classrooms.map((classroom) => ({
        ...classroom,
        projects: projects.filter((project) => project.role === classroom.projectRole),
        activities: activities.filter((activity) => activity.classroomId === classroom.id),
      })),
    [projects, activities],
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      toast.success(`File "${e.dataTransfer.files[0].name}" selected successfully!`);
    }
  };

  const handleCardClick = () => {
    if (fileInputRef) {
      fileInputRef.click();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      toast.success(`File "${e.target.files[0].name}" selected successfully!`);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Project Classrooms</h1>
          <p className="text-muted-foreground mt-1">Manage work by team space, like a shared classroom for each role.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {projectsByClassroom.map((classroom) => (
            <div key={classroom.id} className="rounded-2xl border border-border/50 bg-card/70 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{classroom.shortLabel}</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{classroom.projects.length}</p>
            </div>
          ))}
        </div>
      </div>

      <Tabs defaultValue={classrooms[0].id} className="space-y-6">
        <TabsList className="h-auto flex-wrap rounded-2xl bg-muted/40 p-1.5">
          {projectsByClassroom.map((classroom) => {
            const Icon = classroom.icon;
            return (
              <TabsTrigger key={classroom.id} value={classroom.id} className="rounded-xl px-4 py-2.5">
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
                      <Badge className="border-0 bg-white/75 text-slate-900">{classroom.badge}</Badge>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80">
                            <Icon className="h-6 w-6" />
                          </div>
                          <h2 className="text-3xl font-semibold">{classroom.label}</h2>
                        </div>
                        <p className="max-w-2xl text-sm leading-6 text-slate-900/75">{classroom.description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl bg-white/70 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-700">Projects</p>
                        <p className="mt-2 text-2xl font-semibold">{classroom.projects.length}</p>
                      </div>
                      <div className="rounded-2xl bg-white/70 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-700">Space</p>
                        <p className="mt-2 text-sm font-semibold">{classroom.shortLabel}</p>
                      </div>
                      <div className="rounded-2xl bg-white/70 px-4 py-3 col-span-2 sm:col-span-1">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-700">Members</p>
                        <p className="mt-2 flex items-center gap-2 text-sm font-semibold">
                          <Users className="h-4 w-4" />
                          Team Classroom
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 p-6">
                  {/* President Activity Creation Bar */}
                  <div className="flex items-center justify-between p-4 rounded-2xl border border-border/50 bg-muted/30">
                    <div className="flex items-center gap-3">
                      <ClipboardList className="h-5 w-5 text-primary" />
                      <div>
                        <h3 className="font-semibold">Class Activities</h3>
                        <p className="text-sm text-muted-foreground">President assigned tasks for this team</p>
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

                  <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                     <aside
                       className={`rounded-[1.75rem] border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
                         dragActive ? "border-primary bg-primary/5" : "border-border/50 bg-background/60 hover:border-primary/30 hover:bg-muted/30"
                       }`}
                       onClick={handleCardClick}
                       onDragOver={(e) => {
                         e.preventDefault();
                         setDragActive(true);
                       }}
                       onDragLeave={() => setDragActive(false)}
                       onDrop={handleDrop}
                     >
                       <input
                         ref={(el) => setFileInputRef(el)}
                         type="file"
                         className="hidden"
                         onChange={handleFileSelect}
                         aria-label="Upload project file"
                       />
                       <Upload className="mx-auto mb-4 h-10 w-10 text-primary" />
                       <h3 className="font-semibold text-foreground">Submit Your Project</h3>
                       <p className="mt-2 text-sm leading-6 text-muted-foreground">
                         Click anywhere here or drop files to upload your completed work for assigned activities.
                       </p>
                       <Button className="mt-5 w-full rounded-xl gradient-primary text-primary-foreground pointer-events-none">
                         <Send className="mr-2 h-4 w-4" />
                         Submit Work
                       </Button>
                     </aside>

                    <div className="space-y-4">
                    {classroom.projects.length === 0 ? (
                      <div className="flex min-h-[240px] flex-col items-center justify-center rounded-[1.75rem] border border-border/50 bg-background/60 p-10 text-center">
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
                            <article key={project.id} className="rounded-[1.75rem] border border-border/50 bg-background/70 p-5 transition hover:border-primary/30 hover:shadow-sm">
                              <div className="mb-4 flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl gradient-primary">
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
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </div>
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
    </div>
  );
};

export default ProjectsPage;

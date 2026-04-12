import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowRight, BadgeCheck, BriefcaseBusiness, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { APPLICANT_ROLES } from "@/lib/roles";
import { api } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import loginBg from "@/assets/login-bg.png";
import spadeLogo from "@/assets/spade-logo.png";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [course, setCourse] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [projectAttachmentName, setProjectAttachmentName] = useState("");
  const [projectAttachmentUrl, setProjectAttachmentUrl] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const title = isRegister ? "Apply to SPADE" : "Welcome Back";
  const description = isRegister
    ? "Submit your application and choose the role you want to contribute in."
    : "Sign in with your campus email to access elections, events, and projects.";

  const loginMutation = useMutation({
    mutationFn: api.login,
    onSuccess: ({ user }) => {
      signIn(user);
      toast.success("Welcome back!");
      navigate("/dashboard");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const registerMutation = useMutation({
    mutationFn: api.register,
    onSuccess: () => {
      toast.success("Application submitted! Please wait for approval.");
      setName("");
      setLocation("");
      setCourse("");
      setYearLevel("");
      setContactNumber("");
      setPassword("");
      setRole("");
      setProjectTitle("");
      setProjectDescription("");
      setProfilePictureUrl("");
      setProjectAttachmentName("");
      setProjectAttachmentUrl("");
      setIsRegister(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const isSubmitting = loginMutation.isPending || registerMutation.isPending;

  const toDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
      reader.readAsDataURL(file);
    });

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfilePictureUrl(await toDataUrl(file));
  };

  const handleProjectAttachmentChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProjectAttachmentName(file.name);
    setProjectAttachmentUrl(await toDataUrl(file));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.endsWith("@aclcbukidnon.com")) {
      toast.error("Only @aclcbukidnon.com emails are allowed");
      return;
    }
    if (!password) {
      toast.error("Please enter your password");
      return;
    }
    if (isRegister && !role) {
      toast.error("Please select a role");
      return;
    }
    if (isRegister && (!name || !location || !course || !yearLevel || !contactNumber || !projectTitle || !projectDescription)) {
      toast.error("Please complete the onboarding form");
      return;
    }

    if (isRegister) {
      registerMutation.mutate({
        email,
        password,
        role,
        name,
        location,
        course,
        yearLevel,
        contactNumber,
        profilePictureUrl,
        projectTitle,
        projectDescription,
        projectAttachmentName,
        projectAttachmentUrl,
      });
      return;
    }

    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(227,242,255,0.94),rgba(255,244,233,0.88))]">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative hidden overflow-hidden lg:flex">
          <img src={loginBg} alt="" className="absolute inset-0 h-full w-full object-cover scale-105 animate-drift" width={1920} height={1080} />
          <div className="absolute inset-0 bg-slate-950/45" />
          <div className="absolute inset-0 animate-shimmer bg-[radial-gradient(circle_at_top_left,rgba(125,197,255,0.35),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(255,223,196,0.4),transparent_32%)]" />
          <div className="absolute -left-16 top-12 h-56 w-56 rounded-full bg-sky-300/20 blur-3xl animate-drift" />
          <div className="absolute bottom-16 right-8 h-64 w-64 rounded-full bg-orange-200/20 blur-3xl animate-drift-reverse" />
          <div className="absolute left-[22%] top-[18%] h-3 w-3 rounded-full bg-white/80 shadow-[0_0_24px_rgba(255,255,255,0.7)] animate-pulse-soft" />
          <div className="absolute bottom-[26%] left-[18%] h-2.5 w-2.5 rounded-full bg-sky-200/80 shadow-[0_0_20px_rgba(125,197,255,0.65)] animate-pulse-soft" />
          <div className="absolute right-[20%] top-[24%] h-2 w-2 rounded-full bg-orange-100/80 shadow-[0_0_18px_rgba(255,223,196,0.65)] animate-pulse-soft" />

          <div className="relative z-10 flex h-full w-full flex-col justify-between p-10 xl:p-14">
            <div className="flex items-center gap-4">
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/14 backdrop-blur-md ring-1 ring-white/30">
                <span className="absolute inset-[-6px] rounded-[1.15rem] border border-white/20 animate-pulse-soft" />
                <span className="absolute inset-0 animate-orbit">
                  <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-white/80" />
                </span>
                <img src={spadeLogo} alt="SPADE" className="h-9 w-9" width={512} height={512} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.34em] text-white/70">Student Platform</p>
                <h1 className="text-2xl font-semibold text-white">SPADE Portal</h1>
              </div>
            </div>

            <div className="max-w-xl space-y-8">
              <div className="space-y-5">
                <div className="inline-flex animate-shimmer items-center rounded-full border border-white/20 bg-[linear-gradient(120deg,rgba(255,255,255,0.09),rgba(255,255,255,0.18),rgba(255,255,255,0.08))] px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-white/80 backdrop-blur-md">
                  Campus leadership workspace
                </div>
                <div className="space-y-4">
                  <h2 className="text-5xl font-semibold leading-[1.02] text-white xl:text-6xl">
                  </h2>
                  <p className="max-w-lg text-base leading-7 text-white/78 xl:text-lg">
                    Built for SPADE officers and applicants to manage elections, track initiatives, and stay aligned across the organization.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/18 bg-white/10 p-4 backdrop-blur-md animate-float">
                  <ShieldCheck className="mb-4 h-5 w-5 text-white" />
                  <p className="text-sm font-semibold text-white">Secure access</p>
                  <p className="mt-1 text-sm leading-6 text-white/72">Restricted to official campus email accounts.</p>
                </div>
                <div className="rounded-3xl border border-white/18 bg-white/10 p-4 backdrop-blur-md [animation-delay:1.2s] animate-float">
                  <BadgeCheck className="mb-4 h-5 w-5 text-white" />
                  <p className="text-sm font-semibold text-white">Applicant workflow</p>
                  <p className="mt-1 text-sm leading-6 text-white/72">Apply and route role selections through a clean intake flow.</p>
                </div>
                <div className="rounded-3xl border border-white/18 bg-white/10 p-4 backdrop-blur-md [animation-delay:2.4s] animate-float">
                  <BriefcaseBusiness className="mb-4 h-5 w-5 text-white" />
                  <p className="text-sm font-semibold text-white">Operational hub</p>
                  <p className="mt-1 text-sm leading-6 text-white/72">Centralize meetings, projects, and election activity.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex items-center justify-center overflow-hidden px-5 py-8 sm:px-8 lg:px-10 xl:px-14">
          <div className="absolute inset-0 lg:hidden">
            <img src={loginBg} alt="" className="h-full w-full object-cover opacity-15 animate-drift-reverse" width={1920} height={1080} />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(247,250,252,0.86),rgba(247,250,252,0.98))]" />
          </div>

          <div className="pointer-events-none absolute -left-12 top-10 h-32 w-32 rounded-full bg-primary/20 blur-3xl animate-drift" />
          <div className="pointer-events-none absolute bottom-10 right-0 h-40 w-40 rounded-full bg-accent/50 blur-3xl animate-drift-reverse" />
          <div className="pointer-events-none absolute left-10 top-1/3 h-2 w-2 rounded-full bg-primary/70 shadow-[0_0_16px_rgba(125,197,255,0.5)] animate-pulse-soft" />
          <div className="pointer-events-none absolute right-16 top-20 h-2.5 w-2.5 rounded-full bg-accent-foreground/40 shadow-[0_0_18px_rgba(255,210,170,0.5)] animate-pulse-soft" />

          <div className="relative z-10 w-full max-w-xl animate-fade-in">
            <div className="mb-6 flex items-center justify-center gap-3 lg:hidden">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 shadow-[var(--shadow-card)] ring-1 ring-border/60">
                <span className="absolute inset-[-5px] rounded-[1.05rem] border border-primary/20 animate-pulse-soft" />
                <img src={spadeLogo} alt="SPADE" className="h-7 w-7" width={512} height={512} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Student Platform</p>
                <span className="block text-2xl font-bold gradient-text">SPADE</span>
              </div>
            </div>

            <div className="glass-card-elevated animate-drift-reverse rounded-[2rem] p-6 sm:max-h-[92vh] sm:overflow-y-auto sm:p-8 xl:p-10">
              <div className="mb-8 flex rounded-2xl bg-muted/70 p-1.5">
                <button
                  type="button"
                  onClick={() => setIsRegister(false)}
                  className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                    !isRegister ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setIsRegister(true)}
                  className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                    isRegister ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Apply
                </button>
              </div>

              <div className="mb-8 space-y-3">
                <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                  {isRegister ? "Applicant access" : "Member access"}
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h2>
                  <p className="max-w-md text-sm leading-6 text-muted-foreground sm:text-base">{description}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {isRegister && (
                  <div className="grid gap-5 rounded-[1.5rem] border border-border/60 bg-background/55 p-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        placeholder="Your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-12 rounded-2xl border-border/60 bg-white/75 px-4 shadow-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        placeholder="City / Municipality"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="h-12 rounded-2xl border-border/60 bg-white/75 px-4 shadow-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="course">Course</Label>
                      <Input
                        id="course"
                        placeholder="e.g. BSIT"
                        value={course}
                        onChange={(e) => setCourse(e.target.value)}
                        className="h-12 rounded-2xl border-border/60 bg-white/75 px-4 shadow-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="year-level">Year</Label>
                      <Input
                        id="year-level"
                        placeholder="e.g. 2nd Year"
                        value={yearLevel}
                        onChange={(e) => setYearLevel(e.target.value)}
                        className="h-12 rounded-2xl border-border/60 bg-white/75 px-4 shadow-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact-number">Contact Number</Label>
                      <Input
                        id="contact-number"
                        placeholder="09xxxxxxxxx"
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)}
                        className="h-12 rounded-2xl border-border/60 bg-white/75 px-4 shadow-sm"
                      />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="profile-picture">Profile Picture</Label>
                      <Input
                        id="profile-picture"
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                        className="rounded-2xl border-border/60 bg-white/75 px-4 py-3 shadow-sm"
                      />
                      {profilePictureUrl && (
                        <img src={profilePictureUrl} alt="Profile preview" className="h-20 w-20 rounded-2xl object-cover ring-1 ring-border/60" />
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Campus Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@aclcbukidnon.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 rounded-2xl border-border/60 bg-white/75 px-4 shadow-sm transition focus-visible:border-primary focus-visible:ring-primary/30"
                  />
                  <p className="text-xs text-muted-foreground">Only `@aclcbukidnon.com` email addresses can sign in or apply.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 rounded-2xl border-border/60 bg-white/75 px-4 shadow-sm transition focus-visible:border-primary focus-visible:ring-primary/30"
                  />
                </div>

                {isRegister && (
                  <div className="grid gap-5 rounded-[1.5rem] border border-border/60 bg-background/55 p-4 animate-slide-up">
                    <div className="space-y-2">
                      <Label>Preferred Role</Label>
                      <Select value={role} onValueChange={setRole}>
                        <SelectTrigger className="h-12 rounded-2xl border-border/60 bg-white/75 px-4 shadow-sm">
                          <SelectValue placeholder="Select the role you are applying for" />
                        </SelectTrigger>
                        <SelectContent>
                          {APPLICANT_ROLES.map((r) => (
                            <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="project-title">Project Title</Label>
                      <Input
                        id="project-title"
                        placeholder="Name of your best project"
                        value={projectTitle}
                        onChange={(e) => setProjectTitle(e.target.value)}
                        className="h-12 rounded-2xl border-border/60 bg-white/75 px-4 shadow-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="project-description">Project Summary</Label>
                      <Textarea
                        id="project-description"
                        placeholder="What did you build, what stack did you use, and what was your contribution?"
                        value={projectDescription}
                        onChange={(e) => setProjectDescription(e.target.value)}
                        className="min-h-[120px] rounded-2xl border-border/60 bg-white/75 px-4 py-3 shadow-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="project-attachment">Project Attachment</Label>
                      <Input
                        id="project-attachment"
                        type="file"
                        onChange={handleProjectAttachmentChange}
                        className="rounded-2xl border-border/60 bg-white/75 px-4 py-3 shadow-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        {projectAttachmentName ? `Attached: ${projectAttachmentName}` : "Attach a zip, PDF, image, or any supporting project file."}
                      </p>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-12 w-full rounded-2xl gradient-primary text-base font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition hover:opacity-95"
                >
                  {isSubmitting ? "Please wait..." : isRegister ? "Submit Application" : "Open Dashboard"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>

              <div className="mt-8 flex flex-col gap-4 border-t border-border/60 pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <p>{isRegister ? "Already have an account?" : "Want to join the organization?"}</p>
                <button
                  type="button"
                  onClick={() => setIsRegister(!isRegister)}
                  className="text-left font-semibold text-primary transition hover:opacity-80"
                >
                  {isRegister ? "Return to sign in" : "Switch to application"}
                </button>
              </div>

              <div className="mt-6 grid gap-3 rounded-2xl bg-muted/55 p-4 text-sm text-muted-foreground sm:grid-cols-2">
                <div>
                  <p className="font-semibold text-foreground">For officers</p>
                  <p className="mt-1 leading-6">Manage meetings, projects, elections, and member activity from a single dashboard.</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">For applicants</p>
                  <p className="mt-1 leading-6">Choose your preferred role and send your application for review.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

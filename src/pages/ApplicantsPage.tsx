import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROLES } from "@/lib/roles";
import { CheckCircle, XCircle, Clock, Eye, Mail, MapPin, Phone, GraduationCap, FolderOpen, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { api } from "@/lib/api";

const statusStyles = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-100 text-rose-700 border-rose-200",
};

const statusIcons = {
  pending: Clock,
  approved: CheckCircle,
  rejected: XCircle,
};

const getInitials = (name: string) => name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

const ApplicantsPage = () => {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["applicants"],
    queryFn: api.getApplicants,
  });

  const applicants = data?.applicants ?? [];
  const pendingCount = applicants.filter((applicant) => applicant.status === "pending").length;

  const updateApplicantMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "approved" | "rejected" }) =>
      api.updateApplicantStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["applicants"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(`Applicant ${variables.status}`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Applicants</h1>
          <p className="text-muted-foreground mt-1">Review onboarding details, portfolio evidence, and pending member requests.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border/50 bg-card/70 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Pending</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{pendingCount}</p>
          </div>
          <div className="rounded-2xl border border-border/50 bg-card/70 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Total</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{applicants.length}</p>
          </div>
          <div className="rounded-2xl border border-border/50 bg-card/70 px-4 py-3 col-span-2 sm:col-span-1">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Review Mode</p>
            <p className="mt-2 text-sm font-medium text-foreground">Onboarding-first</p>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px]">
            <thead>
              <tr className="border-b border-border/50 bg-muted/20">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Applicant</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Role</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Academic</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Project</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {applicants.map((applicant) => {
                const StatusIcon = statusIcons[applicant.status];
                const roleLabel = ROLES.find((r) => r.id === applicant.role)?.label ?? applicant.role;

                return (
                  <tr key={applicant.id} className="border-b border-border/30 align-top hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex gap-3">
                        {applicant.profilePictureUrl ? (
                          <img
                            src={applicant.profilePictureUrl}
                            alt={applicant.name}
                            className="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-border/60"
                          />
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full gradient-primary text-sm font-bold text-primary-foreground">
                            {getInitials(applicant.name)}
                          </div>
                        )}

                        <div className="space-y-1">
                          <p className="font-semibold text-foreground">{applicant.name}</p>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {applicant.email}</p>
                            <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {applicant.contactNumber || "No contact number"}</p>
                            <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> {applicant.location || "No location"}</p>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <Badge variant="secondary" className="rounded-full px-3 py-1 font-medium">
                        {roleLabel}
                      </Badge>
                    </td>

                    <td className="p-4">
                      <div className="space-y-1 text-sm">
                        <p className="font-medium text-foreground">{applicant.course || "No course"}</p>
                        <p className="text-muted-foreground">{applicant.yearLevel || "No year level"}</p>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="max-w-xs space-y-1">
                        <p className="font-medium text-foreground">{applicant.projectTitle || "Untitled project"}</p>
                        <p className="line-clamp-2 text-sm text-muted-foreground">{applicant.projectDescription || "No project summary submitted."}</p>
                      </div>
                    </td>

                    <td className="p-4">
                      <Badge className={`border rounded-full px-3 py-1 ${statusStyles[applicant.status]}`}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
                      </Badge>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        {applicant.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              className="rounded-full px-4 gradient-primary text-primary-foreground"
                              onClick={() => updateApplicantMutation.mutate({ id: applicant.id, status: "approved" })}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full border-destructive/30 px-4 text-destructive hover:bg-destructive/10"
                              onClick={() => updateApplicantMutation.mutate({ id: applicant.id, status: "rejected" })}
                            >
                              Reject
                            </Button>
                          </>
                        )}

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="rounded-full px-3 text-foreground">
                              <Eye className="mr-2 h-4 w-4" />
                              Preview
                            </Button>
                          </DialogTrigger>

                          <DialogContent className="glass-card-elevated max-w-5xl overflow-hidden p-0">
                            <div className="grid md:grid-cols-[300px_1fr]">
                              <div className="border-b border-border/60 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(30,41,59,0.94))] p-6 text-white md:border-b-0 md:border-r">
                                <DialogHeader>
                                  <DialogTitle className="text-left text-2xl text-white">{applicant.name}</DialogTitle>
                                </DialogHeader>

                                <div className="mt-6 space-y-5">
                                  {applicant.profilePictureUrl ? (
                                    <img
                                      src={applicant.profilePictureUrl}
                                      alt={applicant.name}
                                      className="h-56 w-full rounded-3xl object-cover ring-1 ring-white/20"
                                    />
                                  ) : (
                                    <div className="flex h-56 w-full items-center justify-center rounded-3xl bg-white/10 text-6xl font-semibold text-white/80 ring-1 ring-white/15">
                                      {getInitials(applicant.name)}
                                    </div>
                                  )}

                                  <div className="space-y-3 rounded-3xl bg-white/8 p-4 ring-1 ring-white/10">
                                    <Badge className={`border ${statusStyles[applicant.status]}`}>
                                      <StatusIcon className="mr-1 h-3 w-3" />
                                      {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
                                    </Badge>
                                    <p className="text-sm text-white/75">Applied on {applicant.appliedDate}</p>
                                    <div className="space-y-2 text-sm text-white/90">
                                      <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> {applicant.email}</p>
                                      <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> {applicant.contactNumber || "No contact number"}</p>
                                      <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {applicant.location || "No location"}</p>
                                      <p className="flex items-center gap-2"><GraduationCap className="h-4 w-4" /> {applicant.course || "No course"} {applicant.yearLevel ? `• ${applicant.yearLevel}` : ""}</p>
                                    </div>
                                  </div>

                                  {applicant.status === "pending" && (
                                    <div className="flex gap-2">
                                      <Button
                                        className="flex-1 rounded-xl bg-white text-slate-900 hover:bg-white/90"
                                        onClick={() => updateApplicantMutation.mutate({ id: applicant.id, status: "approved" })}
                                      >
                                        Approve
                                      </Button>
                                      <Button
                                        variant="outline"
                                        className="flex-1 rounded-xl border-white/20 bg-transparent text-white hover:bg-white/10"
                                        onClick={() => updateApplicantMutation.mutate({ id: applicant.id, status: "rejected" })}
                                      >
                                        Reject
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="max-h-[85vh] overflow-y-auto p-6">
                                <div className="grid gap-6">
                                  <section className="rounded-3xl border border-border/50 bg-card/60 p-5">
                                    <div className="flex items-center gap-2">
                                      <FolderOpen className="h-4 w-4 text-primary" />
                                      <h3 className="font-semibold text-foreground">Project Submission</h3>
                                    </div>
                                    <p className="mt-3 text-xl font-semibold text-foreground">
                                      {applicant.projectTitle || "Untitled project"}
                                    </p>
                                    <p className="mt-3 leading-7 text-muted-foreground">
                                      {applicant.projectDescription || "No project summary submitted."}
                                    </p>
                                    {applicant.projectAttachmentUrl && (
                                      <a
                                        href={applicant.projectAttachmentUrl}
                                        download={applicant.projectAttachmentName || `${applicant.name}-project`}
                                        className="mt-5 inline-flex items-center gap-2 rounded-xl border border-border/60 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
                                      >
                                        <Download className="h-4 w-4" />
                                        {applicant.projectAttachmentName || "Download attachment"}
                                      </a>
                                    )}
                                  </section>

                                  <section className="grid gap-4 md:grid-cols-2">
                                    <div className="rounded-3xl border border-border/50 bg-card/60 p-5">
                                      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Preferred Role</p>
                                      <p className="mt-3 text-lg font-semibold text-foreground">{roleLabel}</p>
                                    </div>
                                    <div className="rounded-3xl border border-border/50 bg-card/60 p-5">
                                      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Applicant Snapshot</p>
                                      <p className="mt-3 text-sm leading-7 text-muted-foreground">
                                        {applicant.name} is applying from {applicant.location || "an unspecified location"} with a {applicant.course || "course not provided"} background.
                                      </p>
                                    </div>
                                  </section>

                                  <section className="rounded-3xl border border-border/50 bg-card/60 p-5">
                                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Review Checklist</p>
                                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                      <div className="rounded-2xl bg-muted/40 p-4">
                                        <p className="font-medium text-foreground">Identity</p>
                                        <p className="mt-1 text-sm text-muted-foreground">Name, email, phone, and location are attached to this application.</p>
                                      </div>
                                      <div className="rounded-2xl bg-muted/40 p-4">
                                        <p className="font-medium text-foreground">Academic Info</p>
                                        <p className="mt-1 text-sm text-muted-foreground">{applicant.course || "No course"} {applicant.yearLevel ? `• ${applicant.yearLevel}` : ""}</p>
                                      </div>
                                      <div className="rounded-2xl bg-muted/40 p-4">
                                        <p className="font-medium text-foreground">Project Evidence</p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                          {applicant.projectAttachmentName ? applicant.projectAttachmentName : "No attachment uploaded"}
                                        </p>
                                      </div>
                                      <div className="rounded-2xl bg-muted/40 p-4">
                                        <p className="font-medium text-foreground">Role Fit</p>
                                        <p className="mt-1 text-sm text-muted-foreground">Applicant is targeting the {roleLabel} track.</p>
                                      </div>
                                    </div>
                                  </section>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ApplicantsPage;

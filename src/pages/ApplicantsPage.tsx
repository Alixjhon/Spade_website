import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLES, isOfficer } from "@/lib/roles";
import { CheckCircle, XCircle, Clock, Eye, Mail, MapPin, Phone, GraduationCap } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";

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

const ApplicantRowSkeleton = ({ index }: { index: number }) => (
  <tr key={`skeleton-${index}`} className="border-b border-border/30 align-top">
    <td className="p-4">
      <div className="flex gap-3">
        <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
    </td>
    <td className="p-4">
      <Skeleton className="h-7 w-24 rounded-full" />
    </td>
    <td className="p-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-24" />
      </div>
    </td>
    <td className="p-4">
      <Skeleton className="h-7 w-24 rounded-full" />
    </td>
    <td className="p-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-24 rounded-full" />
        <Skeleton className="h-9 w-20 rounded-full" />
        <Skeleton className="h-9 w-24 rounded-full" />
      </div>
    </td>
  </tr>
);

const ApplicantsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["applicants"],
    queryFn: api.getApplicants,
  });

  const applicants = data?.applicants ?? [];
  const pendingCount = applicants.filter((applicant) => applicant.status === "pending").length;
  const showSkeleton = isLoading && !data;
  const canReviewApplicants = user ? isOfficer(user.role as Parameters<typeof isOfficer>[0]) : false;

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
            {showSkeleton ? (
              <Skeleton className="mt-2 h-8 w-16" />
            ) : (
              <p className="mt-2 text-2xl font-semibold text-foreground">{pendingCount}</p>
            )}
          </div>
          <div className="rounded-2xl border border-border/50 bg-card/70 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Total</p>
            {showSkeleton ? (
              <Skeleton className="mt-2 h-8 w-16" />
            ) : (
              <p className="mt-2 text-2xl font-semibold text-foreground">{applicants.length}</p>
            )}
          </div>
          <div className="rounded-2xl border border-border/50 bg-card/70 px-4 py-3 col-span-2 sm:col-span-1">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Review Mode</p>
            {showSkeleton ? (
              <Skeleton className="mt-2 h-5 w-28" />
            ) : (
              <p className="mt-2 text-sm font-medium text-foreground">Onboarding-first</p>
            )}
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
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {showSkeleton
                ? Array.from({ length: 5 }, (_, index) => <ApplicantRowSkeleton key={index} index={index} />)
                : applicants.map((applicant) => {
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
                          <Badge className={`border rounded-full px-3 py-1 ${statusStyles[applicant.status]}`}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
                          </Badge>
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            {canReviewApplicants && applicant.status === "pending" && (
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
                                <div className="max-h-[88vh] overflow-y-auto">
                                  <div className="relative overflow-hidden border-b border-border/60 bg-[linear-gradient(125deg,rgba(9,30,52,0.99),rgba(8,47,73,0.95),rgba(14,116,144,0.92),rgba(251,146,60,0.45))] px-6 pb-8 pt-6 text-white sm:px-8">
                                    <div className="absolute -right-10 top-6 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
                                    <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-cyan-300/15 blur-3xl" />
                                    <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.04))]" />

                                    <DialogHeader className="relative z-10 text-left">
                                      <div className="inline-flex w-fit items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/75 backdrop-blur-md">
                                        Applicant Preview
                                      </div>
                                      <DialogTitle className="mt-4 text-left font-serif text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                                        {applicant.name}
                                      </DialogTitle>
                                      <p className="mt-3 max-w-2xl text-sm leading-7 text-white/78">
                                        Review identity, academic details, and role alignment before deciding whether this application should move forward.
                                      </p>
                                    </DialogHeader>

                                    <div className="relative z-10 mt-8 grid gap-6 xl:grid-cols-[240px_1fr]">
                                      <div className="flex flex-col items-center rounded-[2rem] border border-white/15 bg-white/10 p-5 text-center backdrop-blur-md shadow-[0_20px_60px_rgba(15,23,42,0.22)]">
                                        {applicant.profilePictureUrl ? (
                                          <img
                                            src={applicant.profilePictureUrl}
                                            alt={applicant.name}
                                            className="h-32 w-32 rounded-3xl object-cover ring-2 ring-white/20 shadow-xl"
                                          />
                                        ) : (
                                          <div className="flex h-32 w-32 items-center justify-center rounded-3xl bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.28),rgba(255,255,255,0.08))] text-4xl font-semibold text-white/90 ring-2 ring-white/20 shadow-xl">
                                            {getInitials(applicant.name)}
                                          </div>
                                        )}
                                        <Badge className={`mt-5 border ${statusStyles[applicant.status]}`}>
                                          <StatusIcon className="mr-1 h-3 w-3" />
                                          {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
                                        </Badge>
                                        <div className="mt-5 w-full rounded-2xl bg-black/10 px-4 py-3 text-left ring-1 ring-white/10">
                                          <p className="text-[11px] uppercase tracking-[0.24em] text-white/50">Applied</p>
                                          <p className="mt-1 text-sm font-medium text-white">{applicant.appliedDate}</p>
                                        </div>
                                        <div className="mt-3 w-full rounded-2xl bg-black/10 px-4 py-3 text-left ring-1 ring-white/10">
                                          <p className="text-[11px] uppercase tracking-[0.24em] text-white/50">Track</p>
                                          <p className="mt-1 text-sm font-medium text-white">{roleLabel}</p>
                                        </div>
                                      </div>

                                      <div className="grid gap-4">
                                        <div className="rounded-[2rem] border border-white/15 bg-white/10 p-6 backdrop-blur-md shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
                                          <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div>
                                              <p className="text-[11px] uppercase tracking-[0.24em] text-white/55">Profile Notes</p>
                                              <p className="mt-3 max-w-xl text-sm leading-7 text-white/85">
                                                {applicant.name} is applying to join the organization with a declared focus on {roleLabel.toLowerCase()} work. Use the cards below to verify contact accuracy, academic fit, and overall readiness.
                                              </p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/75">
                                                {applicant.course || "Course not set"}
                                              </span>
                                              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/75">
                                                {applicant.yearLevel || "Year not set"}
                                              </span>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="grid gap-4 sm:grid-cols-2">
                                          <div className="rounded-[1.75rem] border border-white/15 bg-white/10 p-5 backdrop-blur-md">
                                            <p className="text-[11px] uppercase tracking-[0.24em] text-white/55">Email</p>
                                            <p className="mt-3 flex items-center gap-2 text-sm text-white/90">
                                              <Mail className="h-4 w-4 text-cyan-200" />
                                              {applicant.email}
                                            </p>
                                          </div>
                                          <div className="rounded-[1.75rem] border border-white/15 bg-white/10 p-5 backdrop-blur-md">
                                            <p className="text-[11px] uppercase tracking-[0.24em] text-white/55">Contact</p>
                                            <p className="mt-3 flex items-center gap-2 text-sm text-white/90">
                                              <Phone className="h-4 w-4 text-cyan-200" />
                                              {applicant.contactNumber || "No contact number"}
                                            </p>
                                          </div>
                                          <div className="rounded-[1.75rem] border border-white/15 bg-white/10 p-5 backdrop-blur-md">
                                            <p className="text-[11px] uppercase tracking-[0.24em] text-white/55">Location</p>
                                            <p className="mt-3 flex items-center gap-2 text-sm text-white/90">
                                              <MapPin className="h-4 w-4 text-cyan-200" />
                                              {applicant.location || "No location"}
                                            </p>
                                          </div>
                                          <div className="rounded-[1.75rem] border border-white/15 bg-white/10 p-5 backdrop-blur-md">
                                            <p className="text-[11px] uppercase tracking-[0.24em] text-white/55">Academic</p>
                                            <p className="mt-3 flex items-center gap-2 text-sm text-white/90">
                                              <GraduationCap className="h-4 w-4 text-cyan-200" />
                                              {applicant.course || "No course"} {applicant.yearLevel ? ` - ${applicant.yearLevel}` : ""}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="bg-[linear-gradient(180deg,rgba(248,250,252,0.96),rgba(255,255,255,0.96))] p-6 sm:p-8">
                                    <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                                      <section className="rounded-[2rem] border border-border/50 bg-white/95 p-6 shadow-sm">
                                        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Snapshot</p>
                                        <h3 className="mt-3 font-serif text-2xl font-semibold text-foreground">Quick review summary</h3>
                                        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
                                          {applicant.name} is applying for the <span className="font-medium text-foreground">{roleLabel}</span> role from{" "}
                                          <span className="font-medium text-foreground">{applicant.location || "an unspecified location"}</span>. Their academic
                                          background is listed as <span className="font-medium text-foreground">{applicant.course || "not provided"}</span>
                                          {applicant.yearLevel ? `, ${applicant.yearLevel}` : ""}.
                                        </p>

                                        <div className="mt-6 grid gap-3 sm:grid-cols-3">
                                          <div className="rounded-2xl bg-[linear-gradient(180deg,#f8fafc,#f1f5f9)] p-4 ring-1 ring-slate-200/70">
                                            <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Preferred Role</p>
                                            <p className="mt-2 text-base font-semibold text-foreground">{roleLabel}</p>
                                          </div>
                                          <div className="rounded-2xl bg-[linear-gradient(180deg,#f8fafc,#f1f5f9)] p-4 ring-1 ring-slate-200/70">
                                            <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Profile Status</p>
                                            <p className="mt-2 text-base font-semibold text-foreground">
                                              {applicant.contactNumber && applicant.location && applicant.course ? "Complete" : "Needs review"}
                                            </p>
                                          </div>
                                          <div className="rounded-2xl bg-[linear-gradient(180deg,#f8fafc,#f1f5f9)] p-4 ring-1 ring-slate-200/70">
                                            <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Review Action</p>
                                            <p className="mt-2 text-base font-semibold text-foreground">
                                              {applicant.status === "pending" ? "Decision pending" : "Decision recorded"}
                                            </p>
                                          </div>
                                        </div>
                                      </section>

                                      <section className="rounded-[2rem] border border-border/50 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] p-6 shadow-sm">
                                        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Review Checklist</p>
                                        <div className="mt-5 space-y-3">
                                          <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-md">
                                            <p className="font-medium text-foreground">Identity details</p>
                                            <p className="mt-1 text-sm leading-6 text-muted-foreground">Name, email, location, and contact information are available for officer review.</p>
                                          </div>
                                          <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-md">
                                            <p className="font-medium text-foreground">Academic information</p>
                                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                              {applicant.course || "No course"} {applicant.yearLevel ? ` - ${applicant.yearLevel}` : "- No year level"}
                                            </p>
                                          </div>
                                          <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-md">
                                            <p className="font-medium text-foreground">Role alignment</p>
                                            <p className="mt-1 text-sm leading-6 text-muted-foreground">Applicant is targeting the {roleLabel} track.</p>
                                          </div>
                                        </div>
                                      </section>
                                    </div>

                                    {canReviewApplicants && applicant.status === "pending" && (
                                      <div className="mt-6 rounded-[2rem] border border-border/50 bg-slate-950 p-5 text-white shadow-xl">
                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                          <div>
                                            <p className="text-xs uppercase tracking-[0.24em] text-white/55">Decision Panel</p>
                                            <p className="mt-2 text-lg font-semibold">Choose how to handle this application</p>
                                            <p className="mt-1 text-sm text-white/70">Approve to activate the account, or reject if the application should not move forward.</p>
                                          </div>
                                          <div className="flex flex-col gap-3 sm:flex-row">
                                            <Button
                                              className="rounded-2xl bg-white px-6 text-slate-950 hover:bg-white/90"
                                              onClick={() => updateApplicantMutation.mutate({ id: applicant.id, status: "approved" })}
                                            >
                                              Approve applicant
                                            </Button>
                                            <Button
                                              variant="outline"
                                              className="rounded-2xl border-white/20 bg-transparent px-6 text-white hover:bg-white/10"
                                              onClick={() => updateApplicantMutation.mutate({ id: applicant.id, status: "rejected" })}
                                            >
                                              Reject applicant
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    )}
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

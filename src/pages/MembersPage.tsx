import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, MapPin, Phone, GraduationCap, ShieldCheck, Users } from "lucide-react";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ROLES, isOfficer } from "@/lib/roles";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";

const getInitials = (name: string) => name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

const MemberCardSkeleton = () => (
  <article className="rounded-[1.75rem] border border-border/50 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))] p-5 shadow-sm">
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-14 w-14 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-44" />
        </div>
      </div>
      <Skeleton className="h-7 w-20 rounded-full" />
    </div>

    <div className="mt-5 flex gap-2">
      <Skeleton className="h-7 w-24 rounded-full" />
      <Skeleton className="h-7 w-24 rounded-full" />
    </div>

    <div className="mt-5 space-y-3">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-4 w-36" />
      <Skeleton className="h-4 w-44" />
      <Skeleton className="h-4 w-48" />
    </div>
  </article>
);

const MembersPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["members"],
    queryFn: api.getMembers,
  });

  const members = data?.members ?? [];
  const uniqueRoles = new Set(members.map((member) => member.role)).size;
  const showSkeleton = isLoading && !data;
  const canKickMembers = user ? isOfficer(user.role as Parameters<typeof isOfficer>[0]) : false;

  const deleteMemberMutation = useMutation({
    mutationFn: api.deleteMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Member removed.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Members</h1>
          <p className="mt-1 text-muted-foreground">Browse all active members currently approved in the organization.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border/50 bg-card/70 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Active</p>
            {showSkeleton ? (
              <Skeleton className="mt-2 h-8 w-16" />
            ) : (
              <p className="mt-2 text-2xl font-semibold text-foreground">{members.length}</p>
            )}
          </div>
          <div className="rounded-2xl border border-border/50 bg-card/70 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Roles</p>
            {showSkeleton ? (
              <Skeleton className="mt-2 h-8 w-16" />
            ) : (
              <p className="mt-2 text-2xl font-semibold text-foreground">{uniqueRoles}</p>
            )}
          </div>
          <div className="rounded-2xl border border-border/50 bg-card/70 px-4 py-3 col-span-2 sm:col-span-1">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Status</p>
            {showSkeleton ? (
              <Skeleton className="mt-2 h-5 w-24" />
            ) : (
              <p className="mt-2 text-sm font-medium text-foreground">Active only</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {showSkeleton
          ? Array.from({ length: 6 }, (_, index) => <MemberCardSkeleton key={index} />)
          : members.map((member) => {
          const roleLabel = ROLES.find((role) => role.id === member.role)?.label ?? member.role;

          return (
            <article
              key={member.id}
              className="rounded-[1.75rem] border border-border/50 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))] p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  {member.profilePictureUrl ? (
                    <img
                      src={member.profilePictureUrl}
                      alt={member.name}
                      className="h-14 w-14 rounded-full object-cover ring-1 ring-border/60"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full gradient-primary text-sm font-bold text-primary-foreground">
                      {getInitials(member.name)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-foreground">{member.name}</h2>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>
                <Badge className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
                  <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                  Active
                </Badge>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Badge variant="secondary" className="rounded-full px-3 py-1 font-medium">
                  {roleLabel}
                </Badge>
                <Badge variant="outline" className="rounded-full px-3 py-1">
                  <Users className="mr-1 h-3.5 w-3.5" />
                  Member
                </Badge>
              </div>

              <div className="mt-5 space-y-3 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  {member.course || "No course"} {member.yearLevel ? ` - ${member.yearLevel}` : ""}
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  {member.location || "No location"}
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  {member.contactNumber || "No contact number"}
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  {member.email}
                </p>
              </div>

              {canKickMembers && (
                <div className="mt-6 border-t border-border/50 pt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-11 w-full rounded-2xl border-border/60 bg-white/90 px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                    disabled={deleteMemberMutation.isPending}
                    onClick={() => {
                      const confirmed = window.confirm(`Kick ${member.name} from members? This will delete their data.`);
                      if (!confirmed) return;
                      deleteMemberMutation.mutate(member.id);
                    }}
                  >
                    {deleteMemberMutation.isPending ? "Removing member..." : `Kick ${member.name}`}
                  </Button>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {!showSkeleton && !members.length && (
        <div className="rounded-[1.75rem] border border-dashed border-border/70 bg-card/50 px-6 py-12 text-center">
          <p className="text-lg font-semibold text-foreground">No active members found</p>
          <p className="mt-2 text-sm text-muted-foreground">Approved users will appear here once their status becomes active.</p>
        </div>
      )}
    </div>
  );
};

export default MembersPage;

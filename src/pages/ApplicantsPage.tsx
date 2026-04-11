import { useState } from "react";
import { mockApplicants } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROLES } from "@/lib/roles";
import { CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

const statusStyles = {
  pending: "bg-accent text-accent-foreground",
  approved: "bg-primary/10 text-primary",
  rejected: "bg-destructive/10 text-destructive",
};

const statusIcons = {
  pending: Clock,
  approved: CheckCircle,
  rejected: XCircle,
};

const ApplicantsPage = () => {
  const [applicants, setApplicants] = useState(mockApplicants);

  const updateStatus = (id: number, status: "approved" | "rejected") => {
    setApplicants((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    toast.success(`Applicant ${status}`);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Applicants</h1>
        <p className="text-muted-foreground mt-1">Review and manage membership applications</p>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Name</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Email</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Role</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {applicants.map((applicant) => {
                const StatusIcon = statusIcons[applicant.status];
                const roleLabel = ROLES.find((r) => r.id === applicant.role)?.label ?? applicant.role;
                return (
                  <tr key={applicant.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center">
                          <span className="text-xs font-bold text-primary-foreground">
                            {applicant.name.split(" ").map((n) => n[0]).join("")}
                          </span>
                        </div>
                        <span className="font-medium text-foreground">{applicant.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{applicant.email}</td>
                    <td className="p-4"><Badge variant="secondary">{roleLabel}</Badge></td>
                    <td className="p-4">
                      <Badge className={statusStyles[applicant.status]}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {applicant.status === "pending" && (
                          <>
                            <Button size="sm" className="gradient-primary text-primary-foreground rounded-lg" onClick={() => updateStatus(applicant.id, "approved")}>
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" className="rounded-lg text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => updateStatus(applicant.id, "rejected")}>
                              Reject
                            </Button>
                          </>
                        )}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="rounded-lg"><Eye className="w-4 h-4" /></Button>
                          </DialogTrigger>
                          <DialogContent className="glass-card-elevated">
                            <DialogHeader>
                              <DialogTitle>{applicant.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-3 text-sm">
                              <p><span className="font-medium text-foreground">Email:</span> {applicant.email}</p>
                              <p><span className="font-medium text-foreground">Role:</span> {roleLabel}</p>
                              <p><span className="font-medium text-foreground">Applied:</span> {applicant.appliedDate}</p>
                              <p><span className="font-medium text-foreground">Status:</span> {applicant.status}</p>
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

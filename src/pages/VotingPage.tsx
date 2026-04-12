import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle2, Vote } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { OFFICER_POSITIONS } from "@/lib/roles";

const VotingPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { data } = useQuery({
    queryKey: ["election", user?.email],
    queryFn: () => api.getElection(user?.email),
    enabled: Boolean(user?.email),
  });

  const candidates = data?.candidates ?? [];
  const votedPositions = data?.votedPositions ?? [];
  const election = data?.election;
  const isVotingOpen = election?.status === "voting";
  const resultsVisible = election?.resultsVisible ?? false;

  const voteMutation = useMutation({
    mutationFn: api.vote,
    onSuccess: () => {
      toast.success("Vote submitted successfully!");
      setConfirmOpen(false);
      setSelectedCandidate(null);
      queryClient.invalidateQueries({ queryKey: ["election"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const positions = OFFICER_POSITIONS.filter((position) =>
    candidates.some((candidate) => candidate.position === position.id),
  );

  const handleVote = () => {
    if (!user || selectedCandidate === null) return;
    voteMutation.mutate({ email: user.email, candidateId: selectedCandidate });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Voting</h1>
        <p className="text-muted-foreground mt-1">
          {!election
            ? "No election schedule is available yet."
            : isVotingOpen
            ? "Cast your vote during the official voting period."
            : resultsVisible
              ? "Voting is closed. Final results are now visible."
              : "Voting will open on the date set by the president."}
        </p>
      </div>

      {!election && (
        <div className="glass-card p-8 text-center text-muted-foreground">
          No voting session is available yet. Wait for the president to schedule the annual election.
        </div>
      )}

      {positions.map((position) => {
        const positionCandidates = candidates.filter((candidate) => candidate.position === position.id);
        const totalVotes = positionCandidates.reduce((sum, candidate) => sum + candidate.votes, 0) || 1;

        return (
          <div key={position.id} className="space-y-4">
            <div className="flex items-center gap-3">
              <Vote className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">{position.label}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {positionCandidates.map((candidate) => {
                const pct = Math.round((candidate.votes / totalVotes) * 100);
                const hasVoted = votedPositions.includes(candidate.position);

                return (
                  <div key={candidate.id} className={`glass-card hover-lift p-6 relative ${hasVoted ? "ring-2 ring-primary" : ""}`}>
                    {hasVoted && (
                      <div className="absolute top-4 right-4">
                        <CheckCircle2 className="w-6 h-6 text-primary" />
                      </div>
                    )}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center">
                        <span className="text-lg font-bold text-primary-foreground">
                          {candidate.name.split(" ").map((n) => n[0]).join("")}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{candidate.name}</h3>
                        <Badge variant="secondary" className="text-xs">{position.label}</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{candidate.manifesto}</p>
                    {resultsVisible && (
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Votes</span>
                          <span className="font-medium text-foreground">{candidate.votes} ({pct}%)</span>
                        </div>
                        <Progress value={pct} className="h-2" />
                      </div>
                    )}
                    {isVotingOpen && !hasVoted && (
                      <Button
                        className="w-full gradient-primary text-primary-foreground rounded-xl"
                        onClick={() => { setSelectedCandidate(candidate.id); setConfirmOpen(true); }}
                      >
                        Vote Now
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="glass-card-elevated">
          <DialogHeader>
            <DialogTitle>Confirm Your Vote</DialogTitle>
            <DialogDescription>
              You are voting for{" "}
              <span className="font-semibold text-foreground">
                {candidates.find((candidate) => candidate.id === selectedCandidate)?.name}
              </span>
              . This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleVote} className="gradient-primary text-primary-foreground rounded-xl">Confirm Vote</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VotingPage;

import { useState } from "react";
import { OFFICER_POSITIONS, OfficerRoleId } from "@/lib/roles";
import { mockCandidates } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Vote, CalendarIcon, UserPlus, Trophy, Clock } from "lucide-react";
import { toast } from "sonner";
import { format, isWithinInterval, isBefore } from "date-fns";
import { cn } from "@/lib/utils";

interface ElectionCycle {
  id: number;
  filingStart: Date;
  filingEnd: Date;
  votingStart: Date;
  votingEnd: Date;
  status: "upcoming" | "filing" | "voting" | "completed";
}

interface Candidacy {
  id: number;
  name: string;
  position: OfficerRoleId;
  manifesto: string;
  votes: number;
}

const now = new Date();

const mockElection: ElectionCycle = {
  id: 1,
  filingStart: new Date(2026, 3, 1),
  filingEnd: new Date(2026, 3, 15),
  votingStart: new Date(2026, 3, 16),
  votingEnd: new Date(2026, 3, 30),
  status: "filing",
};

const ElectionPage = () => {
  const [election, setElection] = useState<ElectionCycle>(mockElection);
  const [candidates, setCandidates] = useState<Candidacy[]>([
    { id: 1, name: "Maria Santos", position: "president", manifesto: "Building a stronger community through innovation.", votes: 45 },
    { id: 2, name: "John Doe", position: "president", manifesto: "Empowering every member to reach their potential.", votes: 38 },
    { id: 3, name: "Sarah Lee", position: "vice-president", manifesto: "Bridging departments for unified growth.", votes: 62 },
  ]);
  const [fileDialogOpen, setFileDialogOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  const [manifesto, setManifesto] = useState("");
  const [voteConfirmOpen, setVoteConfirmOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null);
  const [votedPositions, setVotedPositions] = useState<string[]>([]);

  // Admin: date pickers
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [filingStart, setFilingStart] = useState<Date | undefined>(election.filingStart);
  const [filingEnd, setFilingEnd] = useState<Date | undefined>(election.filingEnd);
  const [votingStart, setVotingStart] = useState<Date | undefined>(election.votingStart);
  const [votingEnd, setVotingEnd] = useState<Date | undefined>(election.votingEnd);

  const isFilingOpen = election.status === "filing";
  const isVotingOpen = election.status === "voting";

  const handleFileCandidacy = () => {
    if (!selectedPosition || !manifesto.trim()) {
      toast.error("Please select a position and write your manifesto");
      return;
    }
    const newCandidate: Candidacy = {
      id: Date.now(),
      name: "You",
      position: selectedPosition as OfficerRoleId,
      manifesto: manifesto.trim(),
      votes: 0,
    };
    setCandidates([...candidates, newCandidate]);
    toast.success("Candidacy filed successfully!");
    setFileDialogOpen(false);
    setSelectedPosition("");
    setManifesto("");
  };

  const handleVote = () => {
    if (selectedCandidateId === null) return;
    const candidate = candidates.find(c => c.id === selectedCandidateId);
    if (!candidate) return;
    setCandidates(prev => prev.map(c => c.id === selectedCandidateId ? { ...c, votes: c.votes + 1 } : c));
    setVotedPositions([...votedPositions, candidate.position]);
    toast.success("Vote cast successfully!");
    setVoteConfirmOpen(false);
    setSelectedCandidateId(null);
  };

  const handleSaveSettings = () => {
    if (filingStart && filingEnd && votingStart && votingEnd) {
      setElection({
        ...election,
        filingStart,
        filingEnd,
        votingStart,
        votingEnd,
      });
      toast.success("Election schedule updated!");
      setSettingsOpen(false);
    } else {
      toast.error("Please set all dates");
    }
  };

  const positionsWithCandidates = OFFICER_POSITIONS.map(pos => ({
    ...pos,
    candidates: candidates.filter(c => c.position === pos.id),
  }));

  const totalVotes = candidates.reduce((sum, c) => sum + c.votes, 0) || 1;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Elections</h1>
          <p className="text-muted-foreground mt-1">File candidacy and vote for SPADE officers</p>
        </div>
        <div className="flex gap-2">
          {isFilingOpen && (
            <Button onClick={() => setFileDialogOpen(true)} className="gradient-primary text-primary-foreground rounded-xl">
              <UserPlus className="w-4 h-4 mr-2" />
              File Candidacy
            </Button>
          )}
          <Button variant="outline" onClick={() => setSettingsOpen(true)} className="rounded-xl">
            <CalendarIcon className="w-4 h-4 mr-2" />
            Election Settings
          </Button>
        </div>
      </div>

      {/* Election Status Banner */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="w-6 h-6 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Election Cycle</h2>
          <Badge variant={isFilingOpen ? "default" : isVotingOpen ? "secondary" : "outline"}>
            {election.status === "filing" && "Filing Open"}
            {election.status === "voting" && "Voting Open"}
            {election.status === "upcoming" && "Upcoming"}
            {election.status === "completed" && "Completed"}
          </Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">Filing Start</p>
              <p className="font-medium text-foreground">{format(election.filingStart, "MMM d, yyyy")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">Filing End</p>
              <p className="font-medium text-foreground">{format(election.filingEnd, "MMM d, yyyy")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">Voting Start</p>
              <p className="font-medium text-foreground">{format(election.votingStart, "MMM d, yyyy")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">Voting End</p>
              <p className="font-medium text-foreground">{format(election.votingEnd, "MMM d, yyyy")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Candidates by Position */}
      <Tabs defaultValue={OFFICER_POSITIONS[0].id} className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1 bg-muted/50 rounded-xl p-1">
          {OFFICER_POSITIONS.map(pos => (
            <TabsTrigger key={pos.id} value={pos.id} className="rounded-lg text-xs sm:text-sm">
              {pos.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {positionsWithCandidates.map(pos => (
          <TabsContent key={pos.id} value={pos.id} className="space-y-4">
            {pos.candidates.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <Vote className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No candidates yet for {pos.label}</p>
                {isFilingOpen && (
                  <Button onClick={() => { setSelectedPosition(pos.id); setFileDialogOpen(true); }} className="mt-4 gradient-primary text-primary-foreground rounded-xl">
                    Be the first to file!
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pos.candidates.map(candidate => {
                  const hasVoted = votedPositions.includes(candidate.position);
                  const posTotal = pos.candidates.reduce((s, c) => s + c.votes, 0) || 1;
                  const pct = Math.round((candidate.votes / posTotal) * 100);

                  return (
                    <div key={candidate.id} className={`glass-card hover-lift p-6 relative ${hasVoted ? "ring-2 ring-primary" : ""}`}>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center">
                          <span className="text-lg font-bold text-primary-foreground">
                            {candidate.name.split(" ").map(n => n[0]).join("")}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{candidate.name}</h3>
                          <Badge variant="secondary" className="text-xs">{pos.label}</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">{candidate.manifesto}</p>
                      {(isVotingOpen || election.status === "completed") && (
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
                          onClick={() => { setSelectedCandidateId(candidate.id); setVoteConfirmOpen(true); }}
                        >
                          Vote Now
                        </Button>
                      )}
                      {hasVoted && (
                        <div className="flex items-center gap-2 text-primary">
                          <CheckCircle2 className="w-5 h-5" />
                          <span className="text-sm font-medium">You voted for this position</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* File Candidacy Dialog */}
      <Dialog open={fileDialogOpen} onOpenChange={setFileDialogOpen}>
        <DialogContent className="glass-card-elevated">
          <DialogHeader>
            <DialogTitle>File Your Candidacy</DialogTitle>
            <DialogDescription>Choose a position and tell members why they should vote for you.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Position</label>
              <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {OFFICER_POSITIONS.map(pos => (
                    <SelectItem key={pos.id} value={pos.id}>{pos.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Manifesto</label>
              <textarea
                value={manifesto}
                onChange={e => setManifesto(e.target.value)}
                placeholder="Write your platform and goals..."
                className="w-full min-h-[100px] rounded-xl border border-border/50 bg-muted/50 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setFileDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleFileCandidacy} className="gradient-primary text-primary-foreground rounded-xl">Submit Candidacy</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Vote Confirmation Dialog */}
      <Dialog open={voteConfirmOpen} onOpenChange={setVoteConfirmOpen}>
        <DialogContent className="glass-card-elevated">
          <DialogHeader>
            <DialogTitle>Confirm Your Vote</DialogTitle>
            <DialogDescription>
              You are voting for{" "}
              <span className="font-semibold text-foreground">
                {candidates.find(c => c.id === selectedCandidateId)?.name}
              </span>
              . This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setVoteConfirmOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleVote} className="gradient-primary text-primary-foreground rounded-xl">Confirm Vote</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Election Settings Dialog (Admin) */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="glass-card-elevated max-w-lg">
          <DialogHeader>
            <DialogTitle>Election Schedule Settings</DialogTitle>
            <DialogDescription>Set the filing and voting periods for this election cycle.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            {[
              { label: "Filing Start", value: filingStart, setter: setFilingStart },
              { label: "Filing End", value: filingEnd, setter: setFilingEnd },
              { label: "Voting Start", value: votingStart, setter: setVotingStart },
              { label: "Voting End", value: votingEnd, setter: setVotingEnd },
            ].map(({ label, value, setter }) => (
              <div key={label} className="space-y-2">
                <label className="text-sm font-medium text-foreground">{label}</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal rounded-xl", !value && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {value ? format(value, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={value} onSelect={setter} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <Select value={election.status} onValueChange={(v) => setElection({ ...election, status: v as ElectionCycle["status"] })}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="filing">Filing Open</SelectItem>
                <SelectItem value="voting">Voting Open</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSettingsOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleSaveSettings} className="gradient-primary text-primary-foreground rounded-xl">Save Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ElectionPage;

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, Monitor, PhoneOff, Users, MessageSquare } from "lucide-react";

const participants = [
  { name: "Alex Rivera", isSpeaking: true },
  { name: "Maria Santos", isSpeaking: false },
  { name: "John Doe", isSpeaking: false },
  { name: "Sarah Lee", isSpeaking: true },
  { name: "Mike Chen", isSpeaking: false },
  { name: "Ana Cruz", isSpeaking: false },
];

const MeetingsPage = () => {
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Meetings</h1>
        <p className="text-muted-foreground mt-1">SPADE Team Meeting — Live</p>
      </div>

      <div className="flex gap-4 flex-col lg:flex-row">
        {/* Video Grid */}
        <div className="flex-1">
          <div className="glass-card-elevated p-4 rounded-2xl">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {participants.map((p, i) => (
                <div
                  key={i}
                  className={`aspect-video rounded-xl bg-foreground/5 flex items-center justify-center relative overflow-hidden ${
                    p.isSpeaking ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center">
                    <span className="text-lg font-bold text-primary-foreground">
                      {p.name.split(" ").map((n) => n[0]).join("")}
                    </span>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-foreground/60 text-primary-foreground px-2 py-0.5 rounded text-xs">
                    {p.name.split(" ")[0]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <Button
              variant="outline"
              size="icon"
              className={`w-12 h-12 rounded-full ${!micOn ? "bg-destructive/10 border-destructive text-destructive" : ""}`}
              onClick={() => setMicOn(!micOn)}
            >
              {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className={`w-12 h-12 rounded-full ${!videoOn ? "bg-destructive/10 border-destructive text-destructive" : ""}`}
              onClick={() => setVideoOn(!videoOn)}
            >
              {videoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </Button>
            <Button variant="outline" size="icon" className="w-12 h-12 rounded-full">
              <Monitor className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="icon" className="w-12 h-12 rounded-full" onClick={() => setShowParticipants(!showParticipants)}>
              <Users className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="icon" className="w-12 h-12 rounded-full">
              <MessageSquare className="w-5 h-5" />
            </Button>
            <Button size="icon" className="w-12 h-12 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <PhoneOff className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Participants sidebar */}
        {showParticipants && (
          <div className="glass-card p-4 w-full lg:w-72 animate-scale-in">
            <h3 className="font-semibold text-foreground mb-3">Participants ({participants.length})</h3>
            <div className="space-y-2">
              {participants.map((p, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50">
                  <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
                    <span className="text-xs font-bold text-primary-foreground">{p.name[0]}</span>
                  </div>
                  <span className="text-sm text-foreground flex-1">{p.name}</span>
                  {p.isSpeaking && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingsPage;

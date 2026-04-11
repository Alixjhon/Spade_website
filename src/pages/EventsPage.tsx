import { mockEvents } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";

const categoryColors: Record<string, string> = {
  Workshop: "bg-primary/10 text-primary",
  Competition: "bg-accent text-accent-foreground",
  Meeting: "bg-secondary text-secondary-foreground",
};

const EventsPage = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Events</h1>
          <p className="text-muted-foreground mt-1">Upcoming SPADE events and activities</p>
        </div>
        <Button className="gradient-primary text-primary-foreground rounded-xl">+ Create Event</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mockEvents.map((event, i) => (
          <div key={event.id} className="glass-card hover-lift overflow-hidden" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="h-2 gradient-primary" />
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <Badge className={categoryColors[event.category] || "bg-muted text-muted-foreground"}>
                    {event.category}
                  </Badge>
                  <h3 className="text-lg font-semibold text-foreground mt-2">{event.title}</h3>
                </div>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" /> {new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> {event.time}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" /> {event.attendees} attending
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {event.organizer}
                </span>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                      View Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-card-elevated">
                    <DialogHeader>
                      <DialogTitle>{event.title}</DialogTitle>
                      <DialogDescription>{event.description}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 text-sm">
                      <p><span className="font-medium text-foreground">Date:</span> {event.date}</p>
                      <p><span className="font-medium text-foreground">Time:</span> {event.time}</p>
                      <p><span className="font-medium text-foreground">Organizer:</span> {event.organizer}</p>
                      <p><span className="font-medium text-foreground">Attendees:</span> {event.attendees}</p>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventsPage;

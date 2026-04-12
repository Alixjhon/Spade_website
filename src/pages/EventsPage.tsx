import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Facebook, ImagePlus, Info, MapPin, PlusCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { EventItem } from "@/lib/types";

type EventsResponse = Awaited<ReturnType<typeof api.getEvents>>;
type CreateEventPayload = Parameters<typeof api.createEvent>[0];
type CreateEventResponse = Awaited<ReturnType<typeof api.createEvent>>;

const categoryColors: Record<string, string> = {
  Workshop: "bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200",
  Competition: "bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200",
  Meeting: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200",
};

const fallbackEventImage =
  "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop";

export default function EventsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [registeredEvents, setRegisteredEvents] = useState<number[]>(() => {
    const saved = localStorage.getItem("registeredEvents");
    return saved ? JSON.parse(saved) : [];
  });
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    organizer: "",
    category: "Workshop",
    location: "",
    image: null as File | null,
    autoPostFacebook: true,
  });

  const {
    data: eventsData,
    isLoading: isLoadingEvents,
    error: eventsError,
  } = useQuery({
    queryKey: ["events"],
    queryFn: api.getEvents,
  });

  const createEventMutation = useMutation<CreateEventResponse, Error, CreateEventPayload>({
    mutationFn: api.createEvent,
    onSuccess: ({ event }) => {
      queryClient.setQueryData<EventsResponse | undefined>(["events"], (current) => ({
        events: [...(current?.events ?? []), event].sort((a, b) =>
          `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
        ),
      }));
      setIsCreateOpen(false);
      resetForm();
      toast({
        title: "Event published",
        description: "The event was saved to the backend.",
      });
    },
    onError: (error: Error) => {
      console.error(error);
      toast({
        title: "Failed to publish event",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const events = eventsData?.events ?? [];

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = event.target;
    const checked = (event.target as HTMLInputElement).checked;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      setForm((current) => ({ ...current, image: event.target.files![0] }));
    }
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      date: "",
      time: "",
      organizer: "",
      category: "Workshop",
      location: "",
      image: null,
      autoPostFacebook: true,
    });
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in before creating an event.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createEventMutation.mutateAsync({
        title: form.title,
        date: form.date,
        time: form.time,
        description: form.description,
        organizer: form.organizer.trim() || user.name,
        category: form.category,
        location: form.location,
        imageUrl: "",
        socialCaption: form.description,
        createdByEmail: user.email,
      });
    } catch {
      // Handled by the mutation callbacks.
    }
  };

  const handleCopyInviteLink = (event: EventItem) => {
    const link = `${window.location.origin}/dashboard/events?event=${event.id}`;

    navigator.clipboard
      .writeText(link)
      .then(() => {
        setInviteLink(link);
        setShowInviteDialog(true);
        window.setTimeout(() => setShowInviteDialog(false), 3000);
      })
      .catch(() => {
        toast({
          title: "Failed to copy link",
          description: "Please try again.",
          variant: "destructive",
        });
      });
  };

  const handleRegisterToAttend = (eventId: number) => {
    if (registeredEvents.includes(eventId)) {
      toast({
        title: "Already registered",
        description: "You already registered for this event.",
      });
      return;
    }

    const updatedRegistered = [...registeredEvents, eventId];
    setRegisteredEvents(updatedRegistered);
    localStorage.setItem("registeredEvents", JSON.stringify(updatedRegistered));
    queryClient.setQueryData<EventsResponse | undefined>(["events"], (current) => {
      if (!current) {
        return current;
      }

      return {
        events: current.events.map((event) => (event.id === eventId ? { ...event, attendees: event.attendees + 1 } : event)),
      };
    });

    toast({
      title: "Registration successful",
      description: "You are now marked as attending this event.",
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col gap-4 border-b pb-8 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Events</h1>
          <p className="mt-1 text-lg text-muted-foreground">Manage and discover upcoming SPADE activities.</p>
          {eventsError ? <p className="mt-2 text-sm text-destructive">{eventsError instanceof Error ? eventsError.message : "Failed to load events."}</p> : null}
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="rounded-xl bg-primary shadow-lg transition-all hover:shadow-primary/20">
              <PlusCircle className="mr-2 h-5 w-5" /> Create Event
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-5xl overflow-hidden border-none p-0 shadow-2xl">
            <div className="grid h-full max-h-[90vh] grid-cols-1 lg:grid-cols-5">
              <div className="space-y-6 overflow-y-auto p-8 lg:col-span-3">
                <DialogHeader>
                  <DialogTitle className="text-2xl">New Event Details</DialogTitle>
                  <DialogDescription>Input the specifics for your new event.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Event Title</Label>
                    <Input
                      id="title"
                      name="title"
                      value={form.title}
                      placeholder="e.g. Design Hackathon 2026"
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={form.description}
                      placeholder="What should attendees expect?"
                      className="min-h-[80px]"
                      onChange={handleChange}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input type="date" name="date" value={form.date} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <Label>Time</Label>
                      <Input type="time" name="time" value={form.time} onChange={handleChange} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Organizer</Label>
                      <Input
                        name="organizer"
                        value={form.organizer}
                        placeholder={user?.name ?? "Club Name"}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="event-category">Category</Label>
                      <select
                        id="event-category"
                        title="Event category"
                        name="category"
                        value={form.category}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        onChange={handleChange}
                      >
                        <option value="Workshop">Workshop</option>
                        <option value="Meeting">Meeting</option>
                        <option value="Competition">Competition</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input name="location" value={form.location} placeholder="Physical room or URL" onChange={handleChange} />
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <Label className="flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 transition hover:bg-slate-50">
                      <ImagePlus size={18} className="text-primary" />
                      <span className="text-sm font-medium">{form.image ? "Image Selected" : "Add Cover"}</span>
                      <input type="file" hidden onChange={handleFile} />
                    </Label>

                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        name="autoPostFacebook"
                        checked={form.autoPostFacebook}
                        onChange={handleChange}
                        className="h-4 w-4 rounded border-slate-300 text-primary"
                      />
                      <span className="text-sm font-medium text-slate-600">Facebook Sync</span>
                    </label>
                  </div>
                </div>

                <Button onClick={handleSubmit} disabled={createEventMutation.isPending} className="mt-2 h-12 w-full text-md font-bold">
                  {createEventMutation.isPending ? "Publishing..." : "Publish Event"}
                </Button>
              </div>

              <div className="hidden border-l bg-slate-50 p-8 lg:col-span-2 lg:block">
                <div className="sticky top-0 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Live Preview</h3>
                    <span className="flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                    </span>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                    {form.image ? (
                      <img src={URL.createObjectURL(form.image)} className="h-40 w-full object-cover" alt="Preview" />
                    ) : (
                      <div className="flex h-40 w-full flex-col items-center justify-center bg-slate-200 text-slate-400">
                        <ImagePlus size={24} className="mb-1 opacity-20" />
                        <p className="text-[10px]">Preview Image</p>
                      </div>
                    )}
                    <div className="space-y-3 p-5">
                      <Badge className={categoryColors[form.category]}>{form.category}</Badge>
                      <h4 className="text-lg font-bold leading-tight text-slate-900">{form.title || "Untitled Event"}</h4>
                      <p className="line-clamp-2 text-xs text-slate-500">
                        {form.description || "Enter a description..."}
                      </p>
                    </div>
                  </div>

                  {form.autoPostFacebook ? (
                    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <Facebook size={14} className="text-blue-600" />
                        <span className="text-[10px] font-bold uppercase text-blue-900">Facebook Post</span>
                      </div>
                      <p className="text-xs font-bold text-slate-800">{form.title || "Event Title"}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {isLoadingEvents ? (
          <div className="col-span-full rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500">
            Loading events...
          </div>
        ) : null}

        {!isLoadingEvents && events.length === 0 ? (
          <div className="col-span-full rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <p className="text-lg font-semibold text-slate-900">No events yet</p>
            <p className="mt-2 text-sm text-slate-500">Create the first event and it will be saved in the backend.</p>
          </div>
        ) : null}

        {events.map((event: EventItem) => (
          <div
            key={event.id}
            className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-600" />

            <div className="flex-1 space-y-4 p-6">
              <div className="flex items-start justify-between">
                <Badge variant="outline" className={`${categoryColors[event.category] ?? categoryColors.Workshop} border-none`}>
                  {event.category}
                </Badge>
                <div className="flex items-center text-xs font-bold text-slate-400">
                  <Users size={14} className="mr-1" /> {event.attendees}
                </div>
              </div>

              <div>
                <h3 className="line-clamp-1 text-xl font-bold text-slate-900 transition-colors group-hover:text-primary">
                  {event.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-500">{event.description}</p>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center gap-1.5 rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600">
                  <Calendar size={13} className="text-primary" /> {event.date}
                </div>
                <div className="flex items-center gap-1.5 rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600">
                  <Clock size={13} className="text-primary" /> {event.time}
                </div>
              </div>
            </div>

            <div className="mt-auto flex items-center justify-between p-6 pt-0">
              <span className="text-xs font-bold uppercase italic tracking-tighter text-slate-400">{event.organizer}</span>
              <Button
                variant="secondary"
                size="sm"
                className="rounded-lg font-bold transition-colors group-hover:bg-primary group-hover:text-white"
                onClick={() => setSelectedEvent(event)}
              >
                Details
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!selectedEvent} onOpenChange={(isOpen: boolean) => (!isOpen ? setSelectedEvent(null) : undefined)}>
        <DialogContent className="max-w-2xl overflow-hidden rounded-3xl border-none p-0">
          {selectedEvent ? (
            <div className="flex flex-col">
              <div className="relative h-72 bg-slate-900">
                <img
                  src={selectedEvent.imageUrl || fallbackEventImage}
                  className="h-full w-full object-cover opacity-80"
                  alt="Event Banner"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <Badge className={`absolute left-6 top-6 ${categoryColors[selectedEvent.category] ?? categoryColors.Workshop}`}>
                  {selectedEvent.category}
                </Badge>
              </div>

              <div className="relative -mt-12 space-y-8 rounded-t-[40px] bg-white p-10">
                <div className="space-y-4">
                  <DialogTitle className="text-4xl font-black tracking-tight text-slate-900">
                    {selectedEvent.title}
                  </DialogTitle>

                  <div className="flex flex-wrap gap-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Date & Time</span>
                      <span className="text-sm font-semibold">
                        {selectedEvent.date} @ {selectedEvent.time}
                      </span>
                    </div>
                    <div className="flex flex-col border-l pl-6">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Location</span>
                      <span className="flex items-center gap-1 text-sm font-semibold">
                        <MapPin size={14} className="text-primary" /> {selectedEvent.location || "On Campus"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="prose prose-slate max-w-none">
                  <h4 className="flex items-center gap-2 text-sm font-bold uppercase text-slate-900">
                    <Info size={16} /> Event Description
                  </h4>
                  <p className="mt-2 italic leading-relaxed text-slate-600">{selectedEvent.description}</p>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    className="h-14 flex-1 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20"
                    onClick={() => handleRegisterToAttend(selectedEvent.id)}
                    disabled={registeredEvents.includes(selectedEvent.id)}
                  >
                    {registeredEvents.includes(selectedEvent.id) ? "Already Registered" : "Register to Attend"}
                  </Button>
                  <Button
                    variant="outline"
                    className="h-14 rounded-2xl border-2 px-8"
                    onClick={() => handleCopyInviteLink(selectedEvent)}
                  >
                    Invite
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Invite Link</DialogTitle>
            <DialogDescription>Share this link with others to invite them to this event</DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-2">
              <Input value={inviteLink} readOnly className="font-mono text-sm" />
              <Button
                onClick={() => {
                  void navigator.clipboard.writeText(inviteLink);
                  toast({
                    title: "Link copied",
                    description: "Invite link copied to clipboard.",
                  });
                }}
              >
                Copy
              </Button>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              This link has been copied to your clipboard automatically
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

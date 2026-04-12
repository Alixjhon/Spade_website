import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  ImagePlus, 
  PlusCircle, 
  Facebook, 
  Info,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { EventItem } from "@/lib/types";

// Mock data for development (will be removed when API is working)
export const mockEvents = [
  {
    id: 1,
    title: "Tech Workshop: React Basics",
    date: "2026-04-15",
    time: "2:00 PM",
    description: "Learn the fundamentals of React.js with hands-on exercises.",
    organizer: "Web Developer Team",
    attendees: 42,
    category: "Workshop",
    location: "Room 101",
    imageUrl: "",
    socialCaption: "",
    createdByEmail: "admin@spade.com",
  },
  {
    id: 2,
    title: "Game Jam 2026",
    date: "2026-04-20",
    time: "9:00 AM",
    description: "48-hour game development challenge. Build, create, and compete!",
    organizer: "Game Developer Team",
    attendees: 28,
    category: "Competition",
    location: "Online",
    imageUrl: "",
    socialCaption: "",
    createdByEmail: "admin@spade.com",
  },
  {
    id: 3,
    title: "General Assembly",
    date: "2026-04-25",
    time: "3:00 PM",
    description: "Quarterly general assembly meeting for all SPADE members.",
    organizer: "Executive Board",
    attendees: 98,
    category: "Meeting",
    location: "Auditorium",
    imageUrl: "",
    socialCaption: "",
    createdByEmail: "admin@spade.com",
  },
];

// Styling configuration for categories
const categoryColors: Record<string, string> = {
  Workshop: "bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200",
  Competition: "bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200",
  Meeting: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200",
};

export default function EventsPage() {
  // --- STATE ---
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<EventItem[]>([]);

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

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await api.getEvents();
        setEvents(response.events);
      } catch (error) {
        console.error("Failed to fetch events:", error);
        // Fallback to mock data
        setEvents(mockEvents);
      }
    };

    fetchEvents();
  }, []);

  // --- HANDLERS ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setForm((prev) => ({ ...prev, image: e.target.files![0] }));
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      const result = await api.createEvent({
        title: form.title,
        date: form.date,
        time: form.time,
        description: form.description,
        organizer: form.organizer,
        category: form.category,
        location: form.location,
        imageUrl: "", // This will be handled when file upload is implemented
        socialCaption: form.description,
        createdByEmail: "admin@spade.com",
      });
      
      // Add the new event to the list
      setEvents(prev => [...prev, result.event]);
      
      setIsCreateOpen(false);
      alert("Event published successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to publish event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-10 animate-in fade-in duration-700">
      
      {/* --- PAGE HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Events</h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Manage and discover upcoming SPADE activities.
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="rounded-xl shadow-lg hover:shadow-primary/20 transition-all bg-primary">
              <PlusCircle className="mr-2 h-5 w-5" /> Create Event
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-5xl p-0 overflow-hidden border-none shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-5 h-full max-h-[90vh]">
              
              {/* MODAL LEFT: INPUT FORM */}
              <div className="lg:col-span-3 p-8 overflow-y-auto space-y-6">
                <DialogHeader>
                  <DialogTitle className="text-2xl">New Event Details</DialogTitle>
                  <DialogDescription>Input the specifics for your new event.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Event Title</Label>
                    <Input id="title" name="title" placeholder="e.g. Design Hackathon 2026" onChange={handleChange} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" placeholder="What should attendees expect?" className="min-h-[80px]" onChange={handleChange} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input type="date" name="date" onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <Label>Time</Label>
                      <Input type="time" name="time" onChange={handleChange} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Organizer</Label>
                      <Input name="organizer" placeholder="Club Name" onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <select name="category" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" onChange={handleChange}>
                        <option value="Workshop">Workshop</option>
                        <option value="Meeting">Meeting</option>
                        <option value="Competition">Competition</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input name="location" placeholder="Physical room or URL" onChange={handleChange} />
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <Label className="flex items-center gap-2 cursor-pointer border rounded-lg px-4 py-2 hover:bg-slate-50 transition">
                      <ImagePlus size={18} className="text-primary" />
                      <span className="text-sm font-medium">{form.image ? "Image Selected" : "Add Cover"}</span>
                      <input type="file" hidden onChange={handleFile} />
                    </Label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" name="autoPostFacebook" checked={form.autoPostFacebook} onChange={handleChange} className="w-4 h-4 rounded border-slate-300 text-primary" />
                      <span className="text-sm font-medium text-slate-600">Facebook Sync</span>
                    </label>
                  </div>
                </div>

                <Button onClick={handleSubmit} disabled={loading} className="w-full h-12 text-md font-bold mt-2">
                  {loading ? "Publishing..." : "Publish Event"}
                </Button>
              </div>

              {/* MODAL RIGHT: LIVE PREVIEW */}
              <div className="lg:col-span-2 bg-slate-50 border-l p-8 hidden lg:block">
                <div className="sticky top-0 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Live Preview</h3>
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Active
                    </span>
                  </div>

                  <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
                    {form.image ? (
                      <img src={URL.createObjectURL(form.image)} className="w-full h-40 object-cover" alt="Preview" />
                    ) : (
                      <div className="w-full h-40 bg-slate-200 flex flex-col items-center justify-center text-slate-400">
                        <ImagePlus size={24} className="mb-1 opacity-20" />
                        <p className="text-[10px]">Preview Image</p>
                      </div>
                    )}
                    <div className="p-5 space-y-3">
                      <Badge className={categoryColors[form.category]}>{form.category}</Badge>
                      <h4 className="text-lg font-bold text-slate-900 leading-tight">{form.title || "Untitled Event"}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2">{form.description || "Enter a description..."}</p>
                    </div>
                  </div>

                  {form.autoPostFacebook && (
                    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Facebook size={14} className="text-blue-600" />
                        <span className="text-[10px] font-bold text-blue-900 uppercase">Facebook Post</span>
                      </div>
                      <p className="text-xs font-bold text-slate-800">{form.title || "Event Title"}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

{/* --- MAIN GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {events.map((event) => (
          <div key={event.id} className="group bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
            <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-600" />
            
            <div className="p-6 flex-1 space-y-4">
              <div className="flex justify-between items-start">
                <Badge variant="outline" className={`${categoryColors[event.category]} border-none`}>
                  {event.category}
                </Badge>
                <div className="flex items-center text-xs font-bold text-slate-400">
                  <Users size={14} className="mr-1" /> {event.attendees}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-1">{event.title}</h3>
                <p className="text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed">{event.description}</p>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded-md">
                  <Calendar size={13} className="text-primary" /> {event.date}
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded-md">
                  <Clock size={13} className="text-primary" /> {event.time}
                </div>
              </div>
            </div>

            <div className="p-6 pt-0 mt-auto flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter italic">{event.organizer}</span>
              <Button 
                variant="secondary" 
                size="sm" 
                className="rounded-lg font-bold group-hover:bg-primary group-hover:text-white transition-colors"
                onClick={() => setSelectedEvent(event)}
              >
                Details
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* --- EVENT DETAILS MODAL --- */}
      <Dialog 
        open={!!selectedEvent} 
        onOpenChange={(isOpen) => !isOpen && setSelectedEvent(null)}
      >
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-3xl border-none">
          {selectedEvent && (
            <div className="flex flex-col">
              <div className="h-72 relative bg-slate-900">
                <img 
                  src={selectedEvent.image || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop"} 
                  className="w-full h-full object-cover opacity-80"
                  alt="Event Banner"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <Badge className={`absolute top-6 left-6 ${categoryColors[selectedEvent.category]}`}>
                  {selectedEvent.category}
                </Badge>
              </div>

              <div className="p-10 -mt-12 relative bg-white rounded-t-[40px] space-y-8">
                <div className="space-y-4">
                  <DialogTitle className="text-4xl font-black text-slate-900 tracking-tight">
                    {selectedEvent.title}
                  </DialogTitle>
                  
                  <div className="flex flex-wrap gap-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Date & Time</span>
                      <span className="text-sm font-semibold">{selectedEvent.date} @ {selectedEvent.time}</span>
                    </div>
                    <div className="flex flex-col border-l pl-6">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Location</span>
                      <span className="text-sm font-semibold flex items-center gap-1">
                        <MapPin size={14} className="text-primary" /> {selectedEvent.location || "On Campus"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="prose prose-slate max-w-none">
                  <h4 className="text-sm font-bold uppercase text-slate-900 flex items-center gap-2">
                    <Info size={16} /> Event Description
                  </h4>
                  <p className="text-slate-600 leading-relaxed mt-2 italic">
                    {selectedEvent.description}
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button className="flex-1 h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20">
                    Register to Attend
                  </Button>
                  <Button variant="outline" className="h-14 px-8 rounded-2xl border-2">
                    Invite
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Image, Code, MoreVertical } from "lucide-react";
import { toast } from "sonner";

const mockProjects = [
  { id: 1, title: "SPADE Mobile App", description: "Cross-platform mobile application for SPADE members", role: "Software Developer", type: "code", date: "2026-04-10" },
  { id: 2, title: "Event Poster — Game Jam", description: "Promotional poster for the upcoming Game Jam 2026", role: "Media Team", type: "image", date: "2026-04-08" },
  { id: 3, title: "Portfolio Website", description: "Official SPADE portfolio website redesign", role: "Web Developer", type: "code", date: "2026-04-06" },
  { id: 4, title: "2D Platformer Demo", description: "Game prototype built with Unity for showcasing", role: "Game Developer", type: "code", date: "2026-04-04" },
];

const typeIcons: Record<string, React.ElementType> = { code: Code, image: Image, document: FileText };

const ProjectsPage = () => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    toast.success("File uploaded successfully!");
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground mt-1">Upload and manage team projects</p>
        </div>
      </div>

      {/* Upload area */}
      <div
        className={`glass-card border-2 border-dashed p-12 text-center transition-all ${dragActive ? "border-primary bg-primary/5" : "border-border/50"}`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <Upload className="w-10 h-10 text-primary mx-auto mb-4" />
        <h3 className="font-semibold text-foreground mb-1">Drop files here or click to upload</h3>
        <p className="text-sm text-muted-foreground">Supports images, documents, and code files</p>
        <Button className="mt-4 gradient-primary text-primary-foreground rounded-xl">Browse Files</Button>
      </div>

      {/* Projects grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockProjects.map((project, i) => {
          const TypeIcon = typeIcons[project.type] || FileText;
          return (
            <div key={project.id} className="glass-card hover-lift p-6" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                  <TypeIcon className="w-5 h-5 text-primary-foreground" />
                </div>
                <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg">
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
              <h3 className="font-semibold text-foreground mb-1">{project.title}</h3>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{project.description}</p>
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">{project.role}</Badge>
                <span className="text-xs text-muted-foreground">{project.date}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectsPage;

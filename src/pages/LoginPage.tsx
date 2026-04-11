import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROLES } from "@/lib/roles";
import { toast } from "sonner";
import loginBg from "@/assets/login-bg.jpg";
import spadeLogo from "@/assets/spade-logo.png";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.endsWith("@aclcbukidnon.com")) {
      toast.error("Only @aclcbukidnon.com emails are allowed");
      return;
    }
    if (!password) {
      toast.error("Please enter your password");
      return;
    }
    if (isRegister && !role) {
      toast.error("Please select a role");
      return;
    }
    toast.success(isRegister ? "Account created!" : "Welcome back!");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Background */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        <img src={loginBg} alt="" className="absolute inset-0 w-full h-full object-cover" width={1920} height={1080} />
        <div className="absolute inset-0 gradient-primary opacity-40" />
        <div className="relative z-10 p-12 text-center">
          <img src={spadeLogo} alt="SPADE" className="w-24 h-24 mx-auto mb-6 animate-float" width={512} height={512} />
          <h1 className="text-4xl font-bold text-primary-foreground mb-4">SPADE</h1>
          <p className="text-lg text-primary-foreground/80 max-w-md">
            Student Platform for Administration, Development, and Engagement
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <img src={spadeLogo} alt="SPADE" className="w-10 h-10" width={512} height={512} />
            <span className="text-2xl font-bold gradient-text">SPADE</span>
          </div>

          <h2 className="text-3xl font-bold text-foreground mb-2">
            {isRegister ? "Create Account" : "Welcome Back"}
          </h2>
          <p className="text-muted-foreground mb-8">
            {isRegister ? "Join the SPADE community" : "Sign in to your account"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@aclcbukidnon.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl bg-muted/50 border-border/50 focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl bg-muted/50 border-border/50 focus:border-primary"
              />
            </div>

            {isRegister && (
              <div className="space-y-2 animate-slide-up">
                <Label>Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="h-12 rounded-xl bg-muted/50 border-border/50">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button type="submit" className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-opacity">
              {isRegister ? "Create Account" : "Sign In"}
            </Button>
          </form>

          <p className="text-center mt-6 text-muted-foreground">
            {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-primary font-semibold hover:underline"
            >
              {isRegister ? "Sign In" : "Register"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

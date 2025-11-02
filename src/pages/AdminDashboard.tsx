import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  MessageSquare,
  TrendingUp,
  Users,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";

interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  created_at: string;
  deadline: string | null;
  feedback: string | null;
  location: string | null;
  image_url: string | null;
  student_id: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
  });
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(
    null
  );
  const [newStatus, setNewStatus] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if user has admin role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (roleError || !roleData) {
        toast.error("Access denied. Admin privileges required.");
        navigate("/dashboard");
        return;
      }

      setIsAdmin(true);
      fetchComplaints();
    } catch (error) {
      console.error("Error checking admin access:", error);
      navigate("/auth");
    }
  };

  const fetchComplaints = async () => {
    try {
      const { data, error } = await supabase
        .from("complaints")
        .select(
          `
          *,
          profiles:student_id (
            full_name,
            email
          )
        `
        )
        .order("created_at", { ascending: false});

      if (error) {
        console.error("Fetch error:", error);
        throw error;
      }

      setComplaints((data as any) || []);

      // Calculate stats
      const total = data?.length || 0;
      const pending =
        data?.filter((c: any) => c.status === "submitted").length || 0;
      const inProgress =
        data?.filter((c: any) => c.status === "in_review").length || 0;
      const resolved =
        data?.filter((c: any) => c.status === "resolved").length || 0;

      setStats({ total, pending, inProgress, resolved });
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch complaints");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateComplaint = async () => {
    if (!selectedComplaint) return;

    try {
      const updates: any = {};

      if (newStatus) updates.status = newStatus;
      if (newDeadline) updates.deadline = newDeadline;

      const { error: updateError } = await supabase
        .from("complaints")
        .update(updates)
        .eq("id", selectedComplaint.id);

      if (updateError) throw updateError;

      // Add feedback if provided
      if (feedbackText) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const { error: feedbackError } = await supabase
          .from("admin_feedback")
          .insert({
            complaint_id: selectedComplaint.id,
            admin_id: user?.id,
            feedback: feedbackText,
          });

        if (feedbackError) throw feedbackError;

        // Also update the feedback field in complaints table for easy access
        await supabase
          .from("complaints")
          .update({ feedback: feedbackText })
          .eq("id", selectedComplaint.id);
      }

      toast.success("Complaint updated successfully");
      setSelectedComplaint(null);
      setNewStatus("");
      setNewDeadline("");
      setFeedbackText("");
      fetchComplaints();
    } catch (error: any) {
      toast.error(error.message || "Failed to update complaint");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-yellow-500";
      case "in_progress":
        return "bg-blue-500";
      case "resolved":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusBadge = (status: string): "default" | "destructive" | "outline" | "secondary" => {
    const colors: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      submitted: "secondary",
      in_review: "default",
      resolved: "outline",
    };
    return colors[status] || "secondary";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage and resolve campus grievances
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Back to Portal
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover-scale animate-fade-in border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Complaints
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                All time submissions
              </p>
            </CardContent>
          </Card>

          <Card className="hover-scale animate-fade-in border-l-4 border-l-yellow-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-500">
                {stats.pending}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting review
              </p>
            </CardContent>
          </Card>

          <Card className="hover-scale animate-fade-in border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                In Progress
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-500">
                {stats.inProgress}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Being resolved
              </p>
            </CardContent>
          </Card>

          <Card className="hover-scale animate-fade-in border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">
                {stats.resolved}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Complaints List */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              All Complaints
            </CardTitle>
            <CardDescription>
              Click on any complaint to manage it
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {complaints.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No complaints found</p>
              </div>
            ) : (
              complaints.map((complaint, index) => (
                <Dialog
                  key={complaint.id}
                  onOpenChange={(open) => {
                    if (open) {
                      setSelectedComplaint(complaint);
                      setNewStatus(complaint.status);
                      setNewDeadline(
                        complaint.deadline
                          ? format(
                              new Date(complaint.deadline),
                              "yyyy-MM-dd'T'HH:mm"
                            )
                          : ""
                      );
                      setFeedbackText(complaint.feedback || "");
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Card
                      className="cursor-pointer hover:shadow-lg transition-all hover-scale"
                      style={{
                        animationDelay: `${index * 0.1}s`,
                        animationFillMode: "both",
                      }}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant={getStatusBadge(complaint.status)}>
                                {complaint.status.replace("_", " ")}
                              </Badge>
                              <Badge variant="outline">{complaint.category}</Badge>
                              {complaint.deadline && (
                                <Badge
                                  variant="secondary"
                                  className="gap-1"
                                >
                                  <Calendar className="h-3 w-3" />
                                  {format(
                                    new Date(complaint.deadline),
                                    "MMM dd, yyyy"
                                  )}
                                </Badge>
                              )}
                            </div>
                            <h3 className="font-semibold text-lg">
                              {complaint.title}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {complaint.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>By: {complaint.profiles?.full_name || complaint.student_id}</span>
                              <span>•</span>
                              <span>
                                {format(
                                  new Date(complaint.created_at),
                                  "MMM dd, yyyy"
                                )}
                              </span>
                              {complaint.location && (
                                <>
                                  <span>•</span>
                                  <span>{complaint.location}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Manage Complaint</DialogTitle>
                      <DialogDescription>
                        Update status, set deadline, and provide feedback
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6">
                      {/* Complaint Details */}
                      <div className="space-y-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Title
                          </Label>
                          <p className="font-semibold">{selectedComplaint?.title}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Description
                          </Label>
                          <p className="text-sm">
                            {selectedComplaint?.description}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs text-muted-foreground">
                              Submitted By
                            </Label>
                            <p className="text-sm">
                              {selectedComplaint?.profiles?.full_name || "Student"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {selectedComplaint?.profiles?.email || ""}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">
                              Submitted On
                            </Label>
                            <p className="text-sm">
                              {selectedComplaint &&
                                format(
                                  new Date(selectedComplaint.created_at),
                                  "PPP"
                                )}
                            </p>
                          </div>
                        </div>
                        {selectedComplaint?.image_url && (
                          <div>
                            <Label className="text-xs text-muted-foreground">
                              Attached Image
                            </Label>
                            <img
                              src={selectedComplaint.image_url}
                              alt="Complaint"
                              className="rounded-lg border mt-2 max-h-64 object-cover"
                            />
                          </div>
                        )}
                      </div>

                      {/* Management Controls */}
                      <div className="space-y-4 pt-4 border-t">
                        <div className="space-y-2">
                          <Label htmlFor="status">Update Status</Label>
                          <Select value={newStatus} onValueChange={setNewStatus}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="submitted">Submitted</SelectItem>
                              <SelectItem value="in_review">
                                In Review
                              </SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="deadline">Set Deadline</Label>
                          <Input
                            id="deadline"
                            type="datetime-local"
                            value={newDeadline}
                            onChange={(e) => setNewDeadline(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="feedback">
                            <MessageSquare className="inline h-4 w-4 mr-1" />
                            Admin Feedback
                          </Label>
                          <Textarea
                            id="feedback"
                            placeholder="Provide feedback or updates to the student..."
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            rows={4}
                          />
                        </div>

                        <Button
                          onClick={handleUpdateComplaint}
                          className="w-full gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Update Complaint
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

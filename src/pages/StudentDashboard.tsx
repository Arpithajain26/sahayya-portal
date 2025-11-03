import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import ComplaintForm from "@/components/complaints/ComplaintForm";
import ComplaintCard from "@/components/complaints/ComplaintCard";
import ComplaintDetailsDialog from "@/components/complaints/ComplaintDetailsDialog";
import { LogOut, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchComplaints();
  }, []);

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
    } else {
      setUser(user);

      // Check if user is admin
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      setIsAdmin(!!roleData);
    }
  };

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("complaints")
        .select("*")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setComplaints(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch complaints");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const filterComplaints = (status?: string) => {
    if (!status) return complaints;
    return complaints.filter((c) => c.status === status);
  };

  const handleResubmit = async (complaintId: string) => {
    try {
      const originalComplaint = complaints.find((c) => c.id === complaintId);
      if (!originalComplaint) return;

      // Create a new complaint based on the original
      const { error } = await supabase.from("complaints").insert({
        student_id: user?.id,
        title: `[RESUBMITTED] ${originalComplaint.title}`,
        description: originalComplaint.description,
        category: originalComplaint.category,
        location: originalComplaint.location,
        image_url: originalComplaint.image_url,
        resubmitted_from: complaintId,
      });

      if (error) throw error;
      toast.success("Complaint resubmitted successfully");
      setSelectedComplaint(null);
      fetchComplaints();
    } catch (error: any) {
      toast.error(error.message || "Failed to resubmit complaint");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="bg-card border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Campus Grievance Portal</h1>
            <p className="text-sm text-muted-foreground">
              Welcome back, {user?.user_metadata?.full_name || user?.email}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button variant="default" onClick={() => navigate("/admin")}>
                Admin Dashboard
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={fetchComplaints}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-3xl font-bold">My Complaints</h2>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Submit New Complaint
          </Button>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">
              All ({complaints.length})
            </TabsTrigger>
            <TabsTrigger value="submitted">
              Submitted ({filterComplaints("submitted").length})
            </TabsTrigger>
            <TabsTrigger value="in_review">
              In Review ({filterComplaints("in_review").length})
            </TabsTrigger>
            <TabsTrigger value="resolved">
              Resolved ({filterComplaints("resolved").length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="mt-2 text-muted-foreground">Loading complaints...</p>
              </div>
            ) : complaints.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-lg border">
                <p className="text-muted-foreground">No complaints yet.</p>
                <Button className="mt-4" onClick={() => setShowForm(true)}>
                  Submit Your First Complaint
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {complaints.map((complaint) => (
                  <ComplaintCard
                    key={complaint.id}
                    complaint={complaint}
                    onClick={() => setSelectedComplaint(complaint)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {["submitted", "in_review", "resolved"].map((status) => (
            <TabsContent key={status} value={status} className="space-y-4">
              {filterComplaints(status).length === 0 ? (
                <div className="text-center py-12 bg-card rounded-lg border">
                  <p className="text-muted-foreground">
                    No {status.replace("_", " ")} complaints.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filterComplaints(status).map((complaint) => (
                    <ComplaintCard
                      key={complaint.id}
                      complaint={complaint}
                      onClick={() => setSelectedComplaint(complaint)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <ComplaintForm
            onSuccess={() => {
              setShowForm(false);
              fetchComplaints();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Complaint Details Dialog */}
      <ComplaintDetailsDialog
        complaint={selectedComplaint}
        isOpen={!!selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
        onUpdate={fetchComplaints}
        onResubmit={handleResubmit}
      />
    </div>
  );
}
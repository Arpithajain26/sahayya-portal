import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar, Star, MessageSquare, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ComplaintDetailsDialogProps {
  complaint: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  onResubmit?: (complaintId: string) => void;
}

export default function ComplaintDetailsDialog({
  complaint,
  isOpen,
  onClose,
  onUpdate,
  onResubmit,
}: ComplaintDetailsDialogProps) {
  const [deadline, setDeadline] = useState(
    complaint?.deadline ? new Date(complaint.deadline).toISOString().split("T")[0] : ""
  );
  const [studentFeedback, setStudentFeedback] = useState(complaint?.student_feedback || "");
  const [rating, setRating] = useState(complaint?.student_rating || 0);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("complaints")
        .update({
          deadline: deadline || null,
          student_feedback: studentFeedback || null,
          student_rating: rating || null,
        })
        .eq("id", complaint.id);

      if (error) throw error;
      toast.success("Complaint updated successfully");
      onUpdate();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to update complaint");
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-blue-500";
      case "in_review":
        return "bg-yellow-500";
      case "resolved":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {complaint && (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>{complaint.title}</DialogTitle>
                <Badge className={getStatusColor(complaint.status)}>
                  {complaint.status.replace("_", " ").toUpperCase()}
                </Badge>
              </div>
            </DialogHeader>

            <div className="space-y-6">
              {/* Description */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Description
                </h4>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                  {complaint.description}
                </p>
              </div>

              {/* Image */}
              {complaint.image_url && (
                <div>
                  <h4 className="font-semibold mb-2">Attached Image</h4>
                  <img
                    src={complaint.image_url}
                    alt="Complaint"
                    className="w-full rounded-lg border"
                  />
                </div>
              )}

              {/* Location & Category */}
              <div className="grid grid-cols-2 gap-4">
                {complaint.location && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Location</Label>
                    <p className="text-sm font-medium">{complaint.location}</p>
                  </div>
                )}
                <div>
                  <Label className="text-xs text-muted-foreground">Category</Label>
                  <p className="text-sm font-medium">{complaint.category}</p>
                </div>
              </div>

              {/* Set Deadline */}
              <div className="space-y-2">
                <Label htmlFor="deadline" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Set Deadline (Optional)
                </Label>
                <Input
                  id="deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              {/* Student Feedback */}
              <div className="space-y-2">
                <Label htmlFor="feedback">Your Feedback</Label>
                <Textarea
                  id="feedback"
                  placeholder="Add any additional feedback or updates..."
                  value={studentFeedback}
                  onChange={(e) => setStudentFeedback(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Rating */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Rate Resolution (1-5 stars)
                </Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Admin Resolution Notes */}
              {complaint.resolution_notes && (
                <div className="bg-success/10 p-4 rounded-lg border border-success/20">
                  <h4 className="font-semibold mb-2 text-success">Admin Resolution Notes</h4>
                  <p className="text-sm">{complaint.resolution_notes}</p>
                </div>
              )}

              {/* Admin Feedback */}
              {complaint.feedback && (
                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border">
                  <h4 className="font-semibold mb-2">Admin Feedback</h4>
                  <p className="text-sm">{complaint.feedback}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} disabled={saving} className="flex-1">
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                {onResubmit && complaint.status !== "resolved" && (
                  <Button
                    variant="outline"
                    onClick={() => onResubmit(complaint.id)}
                    className="flex-1"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Resubmit Complaint
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar, Star, MessageSquare, RefreshCw, CheckCircle, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [showConfirmResolved, setShowConfirmResolved] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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

  const handleConfirmResolved = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("complaints")
        .delete()
        .eq("id", complaint.id);

      if (error) throw error;
      toast.success("Complaint confirmed as resolved and removed");
      onUpdate();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to confirm resolution");
    } finally {
      setSaving(false);
      setShowConfirmResolved(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("complaints")
        .delete()
        .eq("id", complaint.id);

      if (error) throw error;
      toast.success("Complaint deleted successfully");
      onUpdate();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete complaint");
    } finally {
      setSaving(false);
      setShowDeleteDialog(false);
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
        {complaint && (
          <>
            <DialogHeader className="animate-fade-in">
              <div className="flex items-center justify-between">
                <DialogTitle>{complaint.title}</DialogTitle>
                <Badge className={`${getStatusColor(complaint.status)} transition-all hover:scale-105`}>
                  {complaint.status.replace("_", " ").toUpperCase()}
                </Badge>
              </div>
            </DialogHeader>

            <div className="space-y-6">
              {/* Description */}
              <div className="animate-fade-in">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Description
                </h4>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg transition-all hover:bg-muted/80">
                  {complaint.description}
                </p>
              </div>

              {/* Image */}
              {complaint.image_url && (
                <div className="animate-fade-in">
                  <h4 className="font-semibold mb-2">Attached Image</h4>
                  <img
                    src={complaint.image_url}
                    alt="Complaint"
                    className="w-full rounded-lg border transition-transform hover:scale-[1.02]"
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
              <div className="space-y-2 animate-fade-in">
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
                      className="transition-all hover:scale-125 active:scale-110"
                    >
                      <Star
                        className={`h-8 w-8 transition-colors duration-200 ${
                          star <= rating
                            ? "fill-yellow-400 text-yellow-400 animate-scale-in"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Admin Resolution Notes */}
              {complaint.resolution_notes && (
                <div className="bg-success/10 p-4 rounded-lg border border-success/20 animate-fade-in transition-all hover:bg-success/20">
                  <h4 className="font-semibold mb-2 text-success">Admin Resolution Notes</h4>
                  <p className="text-sm">{complaint.resolution_notes}</p>
                </div>
              )}

              {/* Admin Feedback */}
              {complaint.feedback && (
                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border animate-fade-in transition-all hover:bg-blue-100 dark:hover:bg-blue-950/30">
                  <h4 className="font-semibold mb-2">Admin Feedback</h4>
                  <p className="text-sm">{complaint.feedback}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-4 animate-fade-in">
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={saving} className="flex-1 hover-scale">
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                  {onResubmit && complaint.status !== "resolved" && (
                    <Button
                      variant="outline"
                      onClick={() => onResubmit(complaint.id)}
                      className="flex-1 hover-scale"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Resubmit
                    </Button>
                  )}
                </div>
                
                {complaint.status === "resolved" && (
                  <Button
                    variant="default"
                    onClick={() => setShowConfirmResolved(true)}
                    className="w-full bg-green-600 hover:bg-green-700 hover-scale transition-all"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm Resolved & Remove
                  </Button>
                )}
                
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  className="w-full hover-scale transition-all"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Complaint
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>

      {/* Confirm Resolved Dialog */}
      <AlertDialog open={showConfirmResolved} onOpenChange={setShowConfirmResolved}>
        <AlertDialogContent className="animate-scale-in">
          <AlertDialogHeader className="animate-fade-in">
            <AlertDialogTitle>Confirm Resolution</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure this complaint has been resolved? This will permanently remove it from your list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="hover-scale">Keep It</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmResolved} disabled={saving} className="hover-scale">
              {saving ? "Removing..." : "Confirm & Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="animate-scale-in">
          <AlertDialogHeader className="animate-fade-in">
            <AlertDialogTitle>Delete Complaint</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this complaint? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="hover-scale">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={saving} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 hover-scale">
              {saving ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}

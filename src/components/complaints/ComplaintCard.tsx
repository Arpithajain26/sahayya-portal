import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Calendar, MapPin, Image as ImageIcon, Languages, Volume2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Complaint {
  id: string;
  category: string;
  title: string;
  description: string;
  location?: string;
  image_url?: string;
  kannada_translation?: string;
  status: "submitted" | "in_review" | "resolved";
  created_at: string;
}

interface ComplaintCardProps {
  complaint: Complaint;
  onClick: () => void;
}

const statusConfig = {
  submitted: {
    label: "Submitted",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  in_review: {
    label: "In Review",
    className: "bg-warning/20 text-warning-foreground",
  },
  resolved: {
    label: "Resolved",
    className: "bg-success/20 text-success-foreground",
  },
};

export default function ComplaintCard({ complaint, onClick }: ComplaintCardProps) {
  const status = statusConfig[complaint.status];
  const [showKannada, setShowKannada] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const playAudio = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsPlaying(true);
      const textToSpeak = showKannada && complaint.kannada_translation 
        ? complaint.kannada_translation 
        : `${complaint.title}. ${complaint.description}`;
      
      const language = showKannada && complaint.kannada_translation ? 'kannada' : 'en';
      
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text: textToSpeak, language }
      });

      if (error) throw error;

      if (data?.audioContent) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => setIsPlaying(false);
        await audio.play();
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      toast.error("Failed to play audio. Please try again.");
      setIsPlaying(false);
    }
  };

  const toggleLanguage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowKannada(!showKannada);
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.02]"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{complaint.title}</h3>
            <Badge variant="outline" className="mt-1 capitalize">
              {complaint.category.replace("_", " ")}
            </Badge>
          </div>
          <Badge className={status.className}>{status.label}</Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-3 space-y-3">
        {complaint.kannada_translation && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleLanguage}
            >
              <Languages className="h-4 w-4 mr-1" />
              {showKannada ? 'English' : 'ಕನ್ನಡ'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={playAudio}
              disabled={isPlaying}
            >
              <Volume2 className="h-4 w-4 mr-1" />
              {isPlaying ? 'Playing...' : 'Listen'}
            </Button>
          </div>
        )}

        <p className="text-sm text-muted-foreground line-clamp-2">
          {showKannada && complaint.kannada_translation 
            ? complaint.kannada_translation 
            : complaint.description}
        </p>

        {complaint.image_url && (
          <div className="mt-3 relative">
            <img
              src={complaint.image_url}
              alt="Complaint"
              className="w-full h-40 object-cover rounded-lg"
            />
            <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
              <ImageIcon className="h-3 w-3" />
              Image attached
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center gap-4 text-xs text-muted-foreground pt-3 border-t">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {formatDistanceToNow(new Date(complaint.created_at), { addSuffix: true })}
        </div>
        {complaint.location && (
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {complaint.location}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

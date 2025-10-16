import React, { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Upload, X, Mic, StopCircle, Volume2 } from "lucide-react";

const CATEGORIES = [
  { value: "infrastructure", label: "Infrastructure" },
  { value: "academics", label: "Academics" },
  { value: "hostel", label: "Hostel" },
  { value: "harassment", label: "Harassment" },
  { value: "facilities", label: "Facilities" },
  { value: "administration", label: "Administration" },
  { value: "other", label: "Other" },
];

interface ComplaintFormProps {
  onSuccess: () => void;
}

export default function ComplaintForm({ onSuccess }: ComplaintFormProps) {
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioPlayingRef = useRef<HTMLAudioElement | null>(null);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("kannada");

  const TRANSLATION_LANGUAGES = [
    { value: "english", label: "English" },
    { value: "kannada", label: "Kannada" },
    { value: "hindi", label: "Hindi" },
    { value: "tulu", label: "Tulu" },
    { value: "tamil", label: "Tamil" },
    { value: "telugu", label: "Telugu" },
  ];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const startRecording = async () => {
    try {
      // Prefer Web Speech API (live recognition) when available
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          setIsRecording(true);
          toast.success("Recording started - speak now");
        };

        recognition.onresult = (event: any) => {
          let interimTranscript = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + " ";
            } else {
              interimTranscript += transcript;
            }
          }

          if (finalTranscript) {
            setDescription((prev) =>
              prev ? `${prev} ${finalTranscript}` : finalTranscript
            );
          }
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsRecording(false);
          if (event.error === "no-speech") {
            toast.error("No speech detected. Please try again.");
          } else if (event.error === "not-allowed") {
            toast.error(
              "Microphone access denied. Please allow microphone permissions."
            );
          } else {
            toast.error("Speech recognition error. Please try again.");
          }
        };

        recognition.onend = () => {
          setIsRecording(false);
          toast.success("Recording stopped");
        };

        mediaRecorderRef.current = recognition;
        recognition.start();
        return;
      }

      // Fallback: use MediaRecorder to record audio and send to server for transcription
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("Audio capture not supported in this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const options: MediaRecorderOptions = { mimeType: "audio/webm" };
      const recorder = new MediaRecorder(stream, options as any);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstart = () => {
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
        toast.success("Recording started - speak now");
      };

      recorder.onstop = async () => {
        setIsRecording(false);
        toast.success("Recording stopped");

        try {
          const blob = new Blob(chunks, { type: "audio/webm" });
          // convert to base64 without data: prefix
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const dataUrl = reader.result as string;
              const commaIndex = dataUrl.indexOf(",");
              resolve(dataUrl.slice(commaIndex + 1));
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

          // send to speech-to-text supabase function
          toast.success("Sending audio for transcription...");
          const { data, error } = await supabase.functions.invoke(
            "speech-to-text",
            {
              body: { audio: base64 },
            } as any
          );

          if (error) {
            console.error("STT function error:", error);
            toast.error("Failed to transcribe audio");
          } else if (data?.text) {
            setDescription((prev) =>
              prev ? `${prev} ${data.text}` : data.text
            );
          } else if (data) {
            // sometimes supabase returns parsed JSON in data
            const parsed = data as any;
            if (parsed?.text)
              setDescription((prev) =>
                prev ? `${prev} ${parsed.text}` : parsed.text
              );
            else if (parsed?.message)
              setDescription((prev) =>
                prev ? `${prev} ${parsed.message}` : parsed.message
              );
          }
        } catch (err) {
          console.error("Error processing recorded audio:", err);
          toast.error("Error processing recorded audio");
        } finally {
          // stop tracks
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((t) => t.stop());
            mediaStreamRef.current = null;
          }
          mediaRecorderRef.current = null;
        }
      };

      recorder.start();
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error(
        "Failed to start recording. Please check microphone permissions."
      );
    }
  };

  const stopRecording = () => {
    try {
      if (mediaRecorderRef.current && isRecording) {
        // If SpeechRecognition instance
        const mr = mediaRecorderRef.current;
        if (
          typeof mr.stop === "function" &&
          mr.state !== undefined &&
          (mr.state === "recording" || mr.state === "paused")
        ) {
          mr.stop();
        } else if (typeof mr.stop === "function") {
          // SpeechRecognition also has stop()
          mr.stop();
        } else {
          // best-effort
          mr.stop && mr.stop();
        }
        setIsRecording(false);
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
    } catch (err) {
      console.error("Error stopping recording", err);
      setIsRecording(false);
    }
  };

  // Play audio from base64 returned by text-to-speech function
  const playBase64Audio = async (base64: string, mime = "audio/mpeg") => {
    try {
      const binary = atob(base64);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: mime });
      const url = URL.createObjectURL(blob);
      if (audioPlayingRef.current) {
        audioPlayingRef.current.pause();
        audioPlayingRef.current.src = "";
      }
      const audio = new Audio(url);
      audioPlayingRef.current = audio;
      audio.onended = () => {
        URL.revokeObjectURL(url);
        audioPlayingRef.current = null;
      };
      await audio.play();
    } catch (err) {
      console.error("Error playing audio:", err);
      toast.error("Failed to play audio");
    }
  };

  // Translate description and play via text-to-speech function
  const playTranslation = async () => {
    if (!description) {
      toast.error("Nothing to translate/play");
      return;
    }
    setTtsLoading(true);
    try {
      const languageLabel = TRANSLATION_LANGUAGES.find(
        (lang) => lang.value === selectedLanguage
      )?.label || "English";

      // Translate first (skip if English)
      let translatedText = description;
      if (selectedLanguage !== "english") {
        const { data: translationData, error: translationError } =
          await supabase.functions.invoke("translate-text", {
            body: { text: description, targetLanguage: languageLabel },
          } as any);

        if (translationError) {
          console.error("Translation error:", translationError);
          toast.error("Translation failed, playing original text");
        } else if (translationData?.translatedText) {
          translatedText = translationData.translatedText;
        } else if (translationData) {
          const parsed = translationData as any;
          translatedText =
            parsed?.translatedText || parsed?.translated || parsed?.text || description;
        }
      }

      // Request TTS
      const { data: ttsData, error: ttsError } =
        await supabase.functions.invoke("text-to-speech", {
          body: { text: translatedText, language: selectedLanguage },
        } as any);

      if (ttsError) {
        console.error("TTS function error:", ttsError);
        toast.error("Failed to generate speech");
      } else if (ttsData?.audioContent) {
        await playBase64Audio(ttsData.audioContent, "audio/mpeg");
        toast.success(`Playing in ${languageLabel}`);
      } else if (ttsData) {
        const parsed = ttsData as any;
        if (parsed?.audioContent) {
          await playBase64Audio(parsed.audioContent, "audio/mpeg");
          toast.success(`Playing in ${languageLabel}`);
        } else {
          toast.error("No audio returned from TTS");
        }
      }
    } catch (err) {
      console.error("playTranslation error:", err);
      toast.error("Failed to play audio");
    } finally {
      setTtsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get authenticated user from session (getSession is safe with current supabase-js types)
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) throw new Error("Not authenticated");

      let imageUrl = null;

      // Upload image if present
      if (image) {
        const fileExt = image.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("complaint-images")
          .upload(fileName, image);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("complaint-images").getPublicUrl(fileName);
        imageUrl = publicUrl;
      }

      // Translate to Kannada
      const complaintText = `${title}\n\n${description}`;
      const { data: translationData, error: translationError } =
        await supabase.functions.invoke("translate-text", {
          body: { text: complaintText, targetLanguage: "Kannada" },
        });

      let kannadaTranslation = null;
      if (!translationError && translationData?.translatedText) {
        kannadaTranslation = translationData.translatedText;
      }

      // Insert complaint
      const { error } = await supabase.from("complaints").insert([
        {
          student_id: user.id,
          category: category as any,
          title,
          description,
          location: location || null,
          image_url: imageUrl,
          kannada_translation: kannadaTranslation,
        },
      ]);

      if (error) throw error;

      toast.success("Complaint submitted and translated successfully!");

      // Reset form
      setCategory("");
      setTitle("");
      setDescription("");
      setLocation("");
      clearImage();
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit complaint");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit New Complaint</CardTitle>
        <CardDescription>
          Fill in the details below to submit your grievance. All fields marked
          with * are required.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Brief title for your complaint"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <Label htmlFor="description">Description *</Label>
              <div className="flex gap-2 items-center flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={isRecording ? stopRecording : startRecording}
                  className="gap-2"
                >
                  {isRecording ? (
                    <>
                      <StopCircle className="h-4 w-4 animate-pulse text-red-500" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4" />
                      Record Audio
                    </>
                  )}
                </Button>

                {description && (
                  <>
                    <Select
                      value={selectedLanguage}
                      onValueChange={setSelectedLanguage}
                    >
                      <SelectTrigger className="w-[140px] h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TRANSLATION_LANGUAGES.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={playTranslation}
                      disabled={ttsLoading}
                      className="gap-2"
                    >
                      {ttsLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Playing...
                        </>
                      ) : (
                        <>
                          <Volume2 className="h-4 w-4" />
                          Play Audio
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
            <Textarea
              id="description"
              placeholder="Type or record your complaint..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={6}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/1000
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location (Optional)</Label>
            <Input
              id="location"
              placeholder="e.g., Main Building, Floor 2"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Image (Optional)</Label>
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={clearImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                <input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <Label htmlFor="image" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG up to 5MB
                  </p>
                </Label>
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Complaint"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

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
import { Loader2, Upload, X, Mic, StopCircle, Volume2, Languages, ArrowRight, Play, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const CATEGORIES = [
  { value: "infrastructure", label: "Infrastructure" },
  { value: "academics", label: "Academics" },
  { value: "hostel", label: "Hostel" },
  { value: "harassment", label: "Harassment" },
  { value: "facilities", label: "Facilities" },
  { value: "administration", label: "Administration" },
  { value: "other", label: "Other" },
];

const MAX_VOICE_NOTE_DURATION = 180; // 3 minutes in seconds

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
  const [inputLanguage, setInputLanguage] = useState("auto");
  const [outputLanguage, setOutputLanguage] = useState("english");
  const [transliterationMode, setTransliterationMode] = useState<"transliterate" | "translate" | "both">("transliterate");
  const [convertedText, setConvertedText] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // Voice note recording states
  const [isRecordingVoiceNote, setIsRecordingVoiceNote] = useState(false);
  const [voiceNoteBlob, setVoiceNoteBlob] = useState<Blob | null>(null);
  const [voiceNoteUrl, setVoiceNoteUrl] = useState<string | null>(null);
  const [voiceNoteProgress, setVoiceNoteProgress] = useState(0);
  const voiceNoteRecorderRef = useRef<MediaRecorder | null>(null);
  const voiceNoteStreamRef = useRef<MediaStream | null>(null);
  const voiceNoteTimerRef = useRef<NodeJS.Timeout | null>(null);
  const voiceNoteChunksRef = useRef<Blob[]>([]);

  const TRANSLATION_LANGUAGES = [
    { value: "english", label: "English" },
    { value: "kannada", label: "Kannada" },
    { value: "hindi", label: "Hindi" },
    { value: "tulu", label: "Tulu" },
    { value: "tamil", label: "Tamil" },
    { value: "telugu", label: "Telugu" },
    { value: "malayalam", label: "Malayalam" },
  ];

  const INPUT_LANGUAGES = [
    { value: "auto", label: "Auto-Detect" },
    ...TRANSLATION_LANGUAGES,
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
        const languageCodeMap: Record<string, string> = {
          english: "en-US",
          kannada: "kn-IN",
          hindi: "hi-IN",
          tulu: "en-US", // Tulu not widely supported, fallback to English
          tamil: "ta-IN",
          telugu: "te-IN",
        };

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = languageCodeMap[selectedLanguage] || "en-US";

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

  // Convert text: transliterate and/or translate
  const handleConvertText = async () => {
    if (!description) {
      toast.error("Please enter some text first");
      return;
    }

    setIsConverting(true);
    setShowPreview(true);

    try {
      const { data, error } = await supabase.functions.invoke("transliterate-text", {
        body: {
          text: description,
          sourceLanguage: inputLanguage,
          targetLanguage: outputLanguage,
          mode: transliterationMode,
        },
      } as any);

      if (error) {
        console.error("Conversion error:", error);
        toast.error("Conversion failed");
        setShowPreview(false);
      } else if (data?.convertedText) {
        setConvertedText(data.convertedText);
        
        // If mode is "both", show both native script and translation
        if (transliterationMode === "both" && data.nativeScript && data.translation) {
          toast.success("Text converted and translated!");
        } else if (transliterationMode === "transliterate") {
          toast.success("Text transliterated to native script!");
        } else {
          toast.success("Text translated!");
        }
      }
    } catch (err) {
      console.error("Conversion error:", err);
      toast.error("Failed to convert text");
      setShowPreview(false);
    } finally {
      setIsConverting(false);
    }
  };

  // Apply converted text to description
  const applyConvertedText = () => {
    setDescription(convertedText);
    setShowPreview(false);
    toast.success("Text applied to description");
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

  // Voice note recording functions
  const startVoiceNoteRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      voiceNoteStreamRef.current = stream;
      
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      voiceNoteChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          voiceNoteChunksRef.current.push(e.data);
        }
      };

      recorder.onstart = () => {
        setIsRecordingVoiceNote(true);
        setVoiceNoteProgress(0);
        toast.success("Voice note recording started (max 3 minutes)");
        
        // Progress timer
        let elapsed = 0;
        voiceNoteTimerRef.current = setInterval(() => {
          elapsed += 1;
          const progress = (elapsed / MAX_VOICE_NOTE_DURATION) * 100;
          setVoiceNoteProgress(Math.min(progress, 100));
          
          if (elapsed >= MAX_VOICE_NOTE_DURATION) {
            stopVoiceNoteRecording();
          }
        }, 1000);
      };

      recorder.onstop = () => {
        setIsRecordingVoiceNote(false);
        if (voiceNoteTimerRef.current) {
          clearInterval(voiceNoteTimerRef.current);
          voiceNoteTimerRef.current = null;
        }

        const blob = new Blob(voiceNoteChunksRef.current, { type: mimeType });
        setVoiceNoteBlob(blob);
        const url = URL.createObjectURL(blob);
        setVoiceNoteUrl(url);
        toast.success("Voice note recorded successfully!");

        // Clean up stream
        if (voiceNoteStreamRef.current) {
          voiceNoteStreamRef.current.getTracks().forEach(t => t.stop());
          voiceNoteStreamRef.current = null;
        }
      };

      voiceNoteRecorderRef.current = recorder;
      recorder.start(1000); // Collect data every second
    } catch (error) {
      console.error("Error starting voice note recording:", error);
      toast.error("Failed to start recording. Please check microphone permissions.");
    }
  };

  const stopVoiceNoteRecording = () => {
    if (voiceNoteRecorderRef.current && voiceNoteRecorderRef.current.state !== 'inactive') {
      voiceNoteRecorderRef.current.stop();
    }
    if (voiceNoteTimerRef.current) {
      clearInterval(voiceNoteTimerRef.current);
      voiceNoteTimerRef.current = null;
    }
  };

  const clearVoiceNote = () => {
    if (voiceNoteUrl) {
      URL.revokeObjectURL(voiceNoteUrl);
    }
    setVoiceNoteBlob(null);
    setVoiceNoteUrl(null);
    setVoiceNoteProgress(0);
  };

  const playVoiceNote = () => {
    if (voiceNoteUrl) {
      const audio = new Audio(voiceNoteUrl);
      audio.play();
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
      let voiceNoteStorageUrl = null;

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

      // Upload voice note if present
      if (voiceNoteBlob) {
        const voiceNoteFileName = `${user.id}/${Date.now()}.webm`;
        const { error: voiceUploadError } = await supabase.storage
          .from("voice-notes")
          .upload(voiceNoteFileName, voiceNoteBlob);

        if (voiceUploadError) throw voiceUploadError;

        const {
          data: { publicUrl: voicePublicUrl },
        } = supabase.storage.from("voice-notes").getPublicUrl(voiceNoteFileName);
        voiceNoteStorageUrl = voicePublicUrl;
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
          voice_note_url: voiceNoteStorageUrl,
        },
      ]);

      if (error) throw error;

      toast.success("Complaint submitted successfully!");

      // Reset form
      setCategory("");
      setTitle("");
      setDescription("");
      setLocation("");
      clearImage();
      clearVoiceNote();
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

            {/* Smart Multilingual Input Section */}
            <Card className="border-dashed bg-muted/30">
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <Languages className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-sm">Smart Language Converter</h3>
                  <Badge variant="secondary" className="text-xs">AI-Powered</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Mode Selection */}
                  <div className="space-y-2">
                    <Label className="text-xs">Mode</Label>
                    <Select value={transliterationMode} onValueChange={(value: any) => setTransliterationMode(value)}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="transliterate">Transliterate Only</SelectItem>
                        <SelectItem value="translate">Translate Only</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Input Language */}
                  <div className="space-y-2">
                    <Label className="text-xs">Input Language</Label>
                    <Select value={inputLanguage} onValueChange={setInputLanguage}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INPUT_LANGUAGES.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Output Language */}
                  <div className="space-y-2">
                    <Label className="text-xs">Output Language</Label>
                    <Select value={outputLanguage} onValueChange={setOutputLanguage}>
                      <SelectTrigger className="h-9">
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
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleConvertText}
                  disabled={isConverting || !description}
                  className="w-full gap-2"
                  variant="secondary"
                >
                  {isConverting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Converting...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-4 w-4" />
                      Convert Text
                    </>
                  )}
                </Button>

                {/* Preview Section */}
                {showPreview && convertedText && (
                  <div className="space-y-3 mt-4 p-4 bg-background rounded-lg border">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold">Converted Result:</Label>
                      <Button
                        type="button"
                        size="sm"
                        onClick={applyConvertedText}
                        className="gap-2"
                      >
                        Apply to Description
                      </Button>
                    </div>
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm whitespace-pre-wrap">{convertedText}</p>
                    </div>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline">Original: {description.substring(0, 30)}...</Badge>
                      <ArrowRight className="h-4 w-4" />
                      <Badge variant="outline">Converted</Badge>
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  💡 Type in English letters (e.g., "ninna hesaru yenu") and convert to native script (e.g., "ನಿನ್ನ ಹೆಸರು ಏನು?")
                </p>
              </CardContent>
            </Card>
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

          {/* Voice Note Section */}
          <div className="space-y-2">
            <Label>Voice Note (Optional - up to 3 minutes)</Label>
            {voiceNoteUrl ? (
              <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="gap-1">
                    <Mic className="h-3 w-3" />
                    Voice Note Recorded
                  </Badge>
                  <div className="flex gap-2 ml-auto">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={playVoiceNote}
                      className="gap-1"
                    >
                      <Play className="h-4 w-4" />
                      Play
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={clearVoiceNote}
                      className="gap-1"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
                <audio src={voiceNoteUrl} controls className="w-full h-10" />
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
                {isRecordingVoiceNote ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-sm font-medium">Recording...</span>
                    </div>
                    <Progress value={voiceNoteProgress} className="w-full" />
                    <p className="text-xs text-muted-foreground">
                      {Math.floor((voiceNoteProgress / 100) * MAX_VOICE_NOTE_DURATION)}s / {MAX_VOICE_NOTE_DURATION}s
                    </p>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={stopVoiceNoteRecording}
                      className="gap-2"
                    >
                      <StopCircle className="h-4 w-4" />
                      Stop Recording
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Mic className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Record a voice note to explain your complaint
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={startVoiceNoteRecording}
                      className="gap-2"
                    >
                      <Mic className="h-4 w-4" />
                      Start Recording
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Maximum duration: 3 minutes
                    </p>
                  </div>
                )}
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

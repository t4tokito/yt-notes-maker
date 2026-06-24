import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  Animated,
  Easing,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { generateQuiz, generateQuizFromPdf, type GeneratedQuiz, type QuizDifficulty } from "../../lib/api";
import { getNotes, type Note } from "../../lib/notes";
import { saveTestResult } from "../../lib/testResults";
import { useTheme } from "../../lib/theme";
import { hapticMedium, hapticSuccess } from "../../lib/haptics";

type Source = "notes" | "pdf" | "youtube";
type Phase = "setup" | "loading" | "quiz" | "result";

const SOURCES: { key: Source; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { key: "notes", label: "My Notes", icon: "menu-book" },
  { key: "pdf", label: "PDF", icon: "picture-as-pdf" },
  { key: "youtube", label: "YouTube", icon: "smart-display" },
];

const COUNTS = [5, 10, 15];
const DIFFICULTIES: QuizDifficulty[] = ["easy", "medium", "hard"];

const CARD_SHADOW = {
  shadowColor: "#659287",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 2,
} as const;

export default function TestScreen() {
  const { noteId } = useLocalSearchParams<{ noteId?: string }>();
  const { colors, gradient } = useTheme();

  const [phase, setPhase] = useState<Phase>("setup");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [source, setSource] = useState<Source>("notes");
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [pdf, setPdf] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [ytUrl, setYtUrl] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState<QuizDifficulty>("medium");
  const [quiz, setQuiz] = useState<GeneratedQuiz | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [current, setCurrent] = useState(0);
  const [saved, setSaved] = useState(false);

  useFocusEffect(useCallback(() => {
    getNotes().then((n) => {
      setNotes(n);
      if (noteId) { const m = n.find((x) => x.id === noteId); if (m) { setSource("notes"); setSelectedNote(m); } }
    }).catch((e) => console.error(e));
  }, [noteId]));

  async function pickPdf() {
    const res = await DocumentPicker.getDocumentAsync({ type: "application/pdf", copyToCacheDirectory: true });
    if (!res.canceled && res.assets?.[0]) { setPdf(res.assets[0]); setError(null); }
  }

  const quizTitle = () => {
    if (source === "notes") return selectedNote?.title ?? "Notes quiz";
    if (source === "pdf") return pdf?.name?.replace(/\.pdf$/i, "") ?? "PDF quiz";
    return "YouTube quiz";
  };

  async function onGenerate() {
    setError(null);
    try {
      if (source === "notes" && !selectedNote) { setError("Pick a note to be tested on."); return; }
      if (source === "pdf" && !pdf) { setError("Choose a PDF first."); return; }
      if (source === "youtube" && !ytUrl.trim()) { setError("Paste a YouTube link first."); return; }
      setPhase("loading");
      setProgress(0);

      const progressInterval = setInterval(() => {
        setProgress((p) => {
          if (p >= 90) return 90;
          return p + Math.random() * 15;
        });
      }, 800);

      const opts = { numQuestions, difficulty };
      let result: GeneratedQuiz;
      if (source === "notes") result = await generateQuiz("notes", { text: selectedNote!.content }, opts);
      else if (source === "youtube") result = await generateQuiz("youtube", { url: ytUrl.trim() }, opts);
      else result = await generateQuizFromPdf(pdf!, opts);

      clearInterval(progressInterval);
      setProgress(100);
      hapticSuccess();
      setQuiz(result); setAnswers(new Array(result.questions.length).fill(null)); setCurrent(0); setSaved(false); setPhase("quiz");
    } catch (e: any) { setError(e?.message || "Something went wrong."); setPhase("setup"); }
  }

  const score = quiz ? quiz.questions.reduce((acc, q, i) => acc + (answers[i] === q.answer ? 1 : 0), 0) : 0;

  useEffect(() => {
    if (phase === "result" && quiz && !saved) {
      setSaved(true);
      saveTestResult({ title: quizTitle(), source, score, total: quiz.questions.length, difficulty: quiz.difficulty ?? difficulty }).catch((e) => console.error("save result failed", e));
    }
  }, [phase]);

  function restart() { setQuiz(null); setAnswers([]); setCurrent(0); setSaved(false); setError(null); setPhase("setup"); }
  function retake() { if (!quiz) return; setAnswers(new Array(quiz.questions.length).fill(null)); setCurrent(0); setSaved(false); setPhase("quiz"); }

  const inputStyle = { borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.input, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: colors.text } as const;

  if (phase === "loading") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg, paddingHorizontal: 32 }}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={{ marginTop: 16, textAlign: "center", fontSize: 18, fontWeight: "700", color: colors.text }}>Building your quiz...</Text>
        <View style={{ marginTop: 20, width: "80%" }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
            <Text style={{ fontSize: 13, color: colors.muted }}>Progress</Text>
            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.accentDark }}>{Math.min(Math.round(progress), 100)}%</Text>
          </View>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: "hidden" }}>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.accentDark, width: `${Math.min(progress, 100)}%` }} />
          </View>
          <Text style={{ marginTop: 8, textAlign: "center", fontSize: 12, color: colors.muted }}>
            {progress < 30 ? "Reading material..." : progress < 60 ? "Analyzing content..." : progress < 90 ? "Writing questions..." : "Almost done..."}
          </Text>
        </View>
      </View>
    );
  }

  if (phase === "quiz" && quiz) {
    const q = quiz.questions[current];
    const picked = answers[current];
    const isLast = current === quiz.questions.length - 1;
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.muted }}>Question {current + 1} of {quiz.questions.length}</Text>
          <View style={{ marginTop: 8, height: 8, width: "100%", borderRadius: 4, backgroundColor: colors.border, overflow: "hidden" }}>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.accent, width: `${((current + 1) / quiz.questions.length) * 100}%` }} />
          </View>
          <View style={{ marginTop: 20, borderRadius: 20, backgroundColor: colors.cardGlass, padding: 20, borderWidth: 1, borderColor: colors.border, ...CARD_SHADOW }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>{q.question}</Text>
          </View>
          <View style={{ marginTop: 16, gap: 12 }}>
            {q.options.map((opt, i) => {
              const active = picked === i;
              return (
                <Pressable key={i} onPress={() => {
                  hapticMedium();
                  const next = [...answers]; next[current] = i; setAnswers(next);
                  if (next.every((a) => a !== null)) setTimeout(() => setPhase("result"), 300);
                }}
                  style={{ flexDirection: "row", alignItems: "center", borderRadius: 16, borderWidth: active ? 2 : 1, padding: 16, borderColor: active ? colors.accentDark : colors.border, backgroundColor: active ? colors.accent : colors.cardGlass, ...CARD_SHADOW }}
                >
                  <View style={{ marginRight: 12, width: 28, height: 28, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: active ? "#ffffff" : colors.border }}>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: active ? colors.accentDark : colors.text }}>{String.fromCharCode(65 + i)}</Text>
                  </View>
                  <Text style={{ flex: 1, fontSize: 16, fontWeight: active ? "600" : "400", color: active ? "#ffffff" : colors.text }}>{opt}</Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
        <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", gap: 12, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg, padding: 16 }}>
          {current > 0 && (
            <Pressable onPress={() => setCurrent((c) => c - 1)} style={{ flex: 1, alignItems: "center", justifyContent: "center", borderRadius: 16, borderWidth: 1, borderColor: colors.border, paddingVertical: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>Back</Text>
            </Pressable>
          )}
          {!isLast && (
            <Pressable onPress={() => setCurrent((c) => c + 1)} style={{ flex: 1, alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: colors.accent, paddingVertical: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#ffffff" }}>Next</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  if (phase === "result" && quiz) {
    const total = quiz.questions.length;
    const pct = Math.round((score / total) * 100);
    const verdict = pct >= 80 ? "Excellent!" : pct >= 50 ? "Good effort!" : "Keep practicing!";
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
        <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={{ alignItems: "center", borderRadius: 20, padding: 28, marginBottom: 20 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: "rgba(255,255,255,0.8)" }}>Your score</Text>
          <Text style={{ marginTop: 8, fontSize: 52, fontWeight: "800", color: "#ffffff" }}>{score}/{total}</Text>
          <Text style={{ marginTop: 4, fontSize: 20, fontWeight: "700", color: "#ffffff" }}>{pct}%</Text>
          <Text style={{ marginTop: 8, fontSize: 16, color: "rgba(255,255,255,0.9)" }}>{verdict}</Text>
        </LinearGradient>
        <Text style={{ marginBottom: 12, marginTop: 8, fontSize: 18, fontWeight: "700", color: colors.text }}>Review</Text>
        {quiz.questions.map((q, i) => {
          const userAns = answers[i];
          const correct = userAns === q.answer;
          return (
            <View key={i} style={{ marginBottom: 12, borderRadius: 16, backgroundColor: colors.cardGlass, padding: 16, borderWidth: 1, borderColor: colors.border, ...CARD_SHADOW }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>{i + 1}. {q.question}</Text>
              {q.options.map((opt, oi) => {
                const isCorrect = oi === q.answer;
                const isWrongPick = oi === userAns && !correct;
                return (
                  <View key={oi} style={{ marginTop: 8, flexDirection: "row", alignItems: "center", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: isCorrect ? colors.greenBg : isWrongPick ? colors.redBg : colors.input }}>
                    <MaterialIcons name={isCorrect ? "check-circle" : isWrongPick ? "cancel" : "radio-button-unchecked"} size={18} color={isCorrect ? colors.greenText : isWrongPick ? colors.redText : colors.muted} style={{ marginRight: 8 }} />
                    <Text style={{ flex: 1, fontSize: 14, fontWeight: isCorrect ? "600" : "400", color: isCorrect ? colors.greenText : isWrongPick ? colors.redText : colors.text }}>{opt}</Text>
                  </View>
                );
              })}
              {q.explanation ? <Text style={{ marginTop: 8, fontSize: 12, fontStyle: "italic", color: colors.muted }}>{q.explanation}</Text> : null}
            </View>
          );
        })}
        <View style={{ marginTop: 16, flexDirection: "row", gap: 12 }}>
          <Pressable onPress={() => { hapticMedium(); retake(); }} style={{ flex: 1, alignItems: "center", justifyContent: "center", borderRadius: 16, borderWidth: 1, borderColor: colors.border, paddingVertical: 16, backgroundColor: colors.cardGlass }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>Retake</Text>
          </Pressable>
          <Pressable onPress={() => { hapticMedium(); restart(); }} style={{ flex: 1, alignItems: "center", justifyContent: "center", borderRadius: 16, overflow: "hidden" }}>
            <LinearGradient colors={gradient} style={{ width: "100%", paddingVertical: 16, alignItems: "center", borderRadius: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#ffffff" }}>New Test</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg, marginTop: 40 }} contentContainerStyle={{ padding: 20, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
      <Text style={{ marginBottom: 8, fontSize: 14, fontWeight: "500", color: colors.text }}>Test me from</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {SOURCES.map((s) => {
          const active = s.key === source;
          return (
            <Pressable key={s.key} onPress={() => { setSource(s.key); setError(null); }}
              style={{ flex: 1, alignItems: "center", borderRadius: 16, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 12, borderColor: active ? colors.accentDark : colors.border, backgroundColor: active ? colors.accent : colors.card }}
            >
              <MaterialIcons name={s.icon} size={24} color={active ? "#fff" : colors.text} />
              <Text style={{ marginTop: 4, fontSize: 14, fontWeight: "600", color: active ? "#ffffff" : colors.text }}>{s.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ marginTop: 24 }}>
        {source === "notes" && (
          <>
            <Text style={{ marginBottom: 8, fontSize: 14, fontWeight: "500", color: colors.text }}>Pick a note</Text>
            {notes.length === 0 ? (
              <View style={{ borderRadius: 16, backgroundColor: colors.card, padding: 16, ...CARD_SHADOW }}>
                <Text style={{ fontSize: 14, color: colors.muted }}>You have no notes yet. Create one first, or test from a PDF or YouTube link.</Text>
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                {notes.map((n) => {
                  const active = selectedNote?.id === n.id;
                  return (
                    <Pressable key={n.id} onPress={() => setSelectedNote(n)}
                      style={{ borderRadius: 16, borderWidth: 1, padding: 16, borderColor: active ? colors.accentDark : colors.border, backgroundColor: active ? colors.accent : colors.card, ...CARD_SHADOW }}
                    >
                      <Text numberOfLines={1} style={{ fontSize: 16, fontWeight: "600", color: active ? "#ffffff" : colors.text }}>{n.title}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </>
        )}

        {source === "pdf" && (
          <>
            <Text style={{ marginBottom: 8, fontSize: 14, fontWeight: "500", color: colors.text }}>PDF file</Text>
            <Pressable onPress={pickPdf} style={{ alignItems: "center", borderRadius: 16, borderWidth: 1, borderStyle: "dashed", borderColor: colors.border, backgroundColor: colors.card, padding: 24 }}>
              <Text style={{ fontSize: 24 }}>📄</Text>
              <Text style={{ marginTop: 8, fontSize: 16, fontWeight: "600", color: colors.text }}>{pdf ? pdf.name : "Choose a PDF"}</Text>
              <Text style={{ marginTop: 4, fontSize: 12, color: colors.muted }}>{pdf ? "Tap to change" : "Text-based PDFs only (not scanned images)"}</Text>
            </Pressable>
          </>
        )}

        {source === "youtube" && (
          <>
            <Text style={{ marginBottom: 8, fontSize: 14, fontWeight: "500", color: colors.text }}>YouTube link</Text>
            <TextInput value={ytUrl} onChangeText={setYtUrl} placeholder="https://youtube.com/watch?v=..." placeholderTextColor={colors.muted} autoCapitalize="none" autoCorrect={false} keyboardType="url" style={inputStyle} />
          </>
        )}
      </View>

      <Text style={{ marginBottom: 8, marginTop: 24, fontSize: 14, fontWeight: "500", color: colors.text }}>Number of questions</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {COUNTS.map((c) => {
          const active = c === numQuestions;
          return (
            <Pressable key={c} onPress={() => { hapticMedium(); setNumQuestions(c); }}
              style={{ flex: 1, alignItems: "center", borderRadius: 14, borderWidth: active ? 2 : 1, paddingVertical: 14, borderColor: active ? colors.accentDark : colors.border, backgroundColor: active ? colors.accent : colors.cardGlass }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: active ? "#ffffff" : colors.text }}>{c}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={{ marginBottom: 8, marginTop: 24, fontSize: 14, fontWeight: "500", color: colors.text }}>Difficulty</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {DIFFICULTIES.map((d) => {
          const active = d === difficulty;
          return (
            <Pressable key={d} onPress={() => { hapticMedium(); setDifficulty(d); }}
              style={{ flex: 1, alignItems: "center", borderRadius: 14, borderWidth: active ? 2 : 1, paddingVertical: 14, borderColor: active ? colors.accentDark : colors.border, backgroundColor: active ? colors.accent : colors.cardGlass }}>
              <Text style={{ fontSize: 14, fontWeight: "600", textTransform: "capitalize", color: active ? "#ffffff" : colors.text }}>{d}</Text>
            </Pressable>
          );
        })}
      </View>

      {error ? (
        <View style={{ marginTop: 20, borderRadius: 14, borderWidth: 1, borderColor: colors.errorBorder, backgroundColor: colors.errorBg, padding: 14 }}>
          <Text style={{ fontSize: 14, color: colors.errorText }}>{error}</Text>
        </View>
      ) : null}

      <Pressable onPress={() => { hapticMedium(); onGenerate(); }}
        style={{ marginTop: 28, borderRadius: 16, overflow: "hidden", shadowColor: colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6 }}>
        <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={{ height: 56, alignItems: "center", justifyContent: "center", borderRadius: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#ffffff" }}>✨ Generate Test</Text>
        </LinearGradient>
      </Pressable>
    </ScrollView>
  );
}

import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  generateQuiz,
  generateQuizFromPdf,
  type GeneratedQuiz,
  type QuizDifficulty,
} from "../../lib/api";
import { getNotes, type Note } from "../../lib/notes";
import { saveTestResult } from "../../lib/testResults";

type Source = "notes" | "pdf" | "youtube";
type Phase = "setup" | "loading" | "quiz" | "result";

const SOURCES: { key: Source; label: string; icon: string }[] = [
  { key: "notes", label: "My Notes", icon: "📒" },
  { key: "pdf", label: "PDF", icon: "📄" },
  { key: "youtube", label: "YouTube", icon: "▶️" },
];

const COUNTS = [5, 10, 15];
const DIFFICULTIES: QuizDifficulty[] = ["easy", "medium", "hard"];

const CARD = {
  shadowColor: "#659287",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 2,
} as const;

export default function TestScreen() {
  const { noteId } = useLocalSearchParams<{ noteId?: string }>();

  const [phase, setPhase] = useState<Phase>("setup");
  const [error, setError] = useState<string | null>(null);

  // Setup state
  const [source, setSource] = useState<Source>("notes");
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [pdf, setPdf] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [ytUrl, setYtUrl] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState<QuizDifficulty>("medium");

  // Quiz state
  const [quiz, setQuiz] = useState<GeneratedQuiz | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [current, setCurrent] = useState(0);
  const [saved, setSaved] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getNotes()
        .then((n) => {
          setNotes(n);
          if (noteId) {
            const match = n.find((x) => x.id === noteId);
            if (match) {
              setSource("notes");
              setSelectedNote(match);
            }
          }
        })
        .catch((e) => console.error(e));
    }, [noteId])
  );

  async function pickPdf() {
    const res = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
    });
    if (!res.canceled && res.assets?.[0]) {
      setPdf(res.assets[0]);
      setError(null);
    }
  }

  const quizTitle = () => {
    if (source === "notes") return selectedNote?.title ?? "Notes quiz";
    if (source === "pdf") return pdf?.name?.replace(/\.pdf$/i, "") ?? "PDF quiz";
    return "YouTube quiz";
  };

  async function onGenerate() {
    setError(null);
    try {
      if (source === "notes" && !selectedNote) {
        setError("Pick a note to be tested on.");
        return;
      }
      if (source === "pdf" && !pdf) {
        setError("Choose a PDF first.");
        return;
      }
      if (source === "youtube" && !ytUrl.trim()) {
        setError("Paste a YouTube link first.");
        return;
      }
      setPhase("loading");
      const opts = { numQuestions, difficulty };
      let result: GeneratedQuiz;
      if (source === "notes") {
        result = await generateQuiz("notes", { text: selectedNote!.content }, opts);
      } else if (source === "youtube") {
        result = await generateQuiz("youtube", { url: ytUrl.trim() }, opts);
      } else {
        result = await generateQuizFromPdf(pdf!, opts);
      }
      setQuiz(result);
      setAnswers(new Array(result.questions.length).fill(null));
      setCurrent(0);
      setSaved(false);
      setPhase("quiz");
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
      setPhase("setup");
    }
  }

  const score = quiz
    ? quiz.questions.reduce((acc, q, i) => acc + (answers[i] === q.answer ? 1 : 0), 0)
    : 0;

  // Persist the result once, when we reach the result screen.
  useEffect(() => {
    if (phase === "result" && quiz && !saved) {
      setSaved(true);
      saveTestResult({
        title: quizTitle(),
        source,
        score,
        total: quiz.questions.length,
        difficulty: quiz.difficulty ?? difficulty,
      }).catch((e) => console.error("save result failed", e));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function restart() {
    setQuiz(null);
    setAnswers([]);
    setCurrent(0);
    setSaved(false);
    setError(null);
    setPhase("setup");
  }

  function retake() {
    if (!quiz) return;
    setAnswers(new Array(quiz.questions.length).fill(null));
    setCurrent(0);
    setSaved(false);
    setPhase("quiz");
  }

  // --------------------------- Loading ---------------------------
  if (phase === "loading") {
    return (
      <View className="flex-1 items-center justify-center bg-background px-8">
        <ActivityIndicator color="#88BDA4" size="large" />
        <Text className="mt-4 text-center text-base font-semibold text-text-primary">
          Building your quiz…
        </Text>
        <Text className="mt-1 text-center text-xs text-leaf-200">
          Reading the material and writing questions.
        </Text>
      </View>
    );
  }

  // --------------------------- Quiz ------------------------------
  if (phase === "quiz" && quiz) {
    const q = quiz.questions[current];
    const picked = answers[current];
    const isLast = current === quiz.questions.length - 1;
    const answeredCount = answers.filter((a) => a !== null).length;

    return (
      <View className="flex-1 bg-background">
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
          <Text className="text-sm font-semibold text-text-secondary">
            Question {current + 1} of {quiz.questions.length}
          </Text>
          <View className="mt-2 h-2 w-full overflow-hidden rounded-full bg-leaf-100">
            <View
              className="h-2 rounded-full bg-leaf-200"
              style={{ width: `${((current + 1) / quiz.questions.length) * 100}%` }}
            />
          </View>

          <View className="mt-5 rounded-2xl bg-white/70 p-5" style={CARD}>
            <Text className="text-lg font-bold text-text-primary">{q.question}</Text>
          </View>

          <View className="mt-4 gap-3">
            {q.options.map((opt, i) => {
              const active = picked === i;
              return (
                <Pressable
                  key={i}
                  onPress={() => {
                    const next = [...answers];
                    next[current] = i;
                    setAnswers(next);
                  }}
                  className={`flex-row items-center rounded-2xl border p-4 ${
                    active ? "border-leaf-300 bg-leaf-200" : "border-leaf-100 bg-white/70"
                  }`}
                  style={CARD}
                >
                  <View
                    className={`mr-3 h-7 w-7 items-center justify-center rounded-full ${
                      active ? "bg-white" : "bg-leaf-100"
                    }`}
                  >
                    <Text
                      className={`text-sm font-bold ${
                        active ? "text-leaf-300" : "text-text-primary"
                      }`}
                    >
                      {String.fromCharCode(65 + i)}
                    </Text>
                  </View>
                  <Text
                    className={`flex-1 text-base ${
                      active ? "font-semibold text-white" : "text-text-primary"
                    }`}
                  >
                    {opt}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View className="absolute bottom-0 left-0 right-0 flex-row gap-3 border-t border-leaf-100 bg-background p-4">
          {current > 0 && (
            <Pressable
              onPress={() => setCurrent((c) => c - 1)}
              className="flex-1 items-center justify-center rounded-2xl border border-leaf-200 py-4"
            >
              <Text className="text-base font-bold text-text-primary">Back</Text>
            </Pressable>
          )}
          {isLast ? (
            <Pressable
              onPress={() => setPhase("result")}
              disabled={answeredCount < quiz.questions.length}
              className={`flex-1 items-center justify-center rounded-2xl py-4 ${
                answeredCount < quiz.questions.length ? "bg-leaf-200/50" : "bg-leaf-300"
              }`}
            >
              <Text className="text-base font-bold text-white">
                {answeredCount < quiz.questions.length
                  ? `Answer all (${answeredCount}/${quiz.questions.length})`
                  : "Finish"}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => setCurrent((c) => c + 1)}
              className="flex-1 items-center justify-center rounded-2xl bg-leaf-200 py-4"
            >
              <Text className="text-base font-bold text-white">Next</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  // --------------------------- Result ----------------------------
  if (phase === "result" && quiz) {
    const total = quiz.questions.length;
    const pct = Math.round((score / total) * 100);
    const verdict =
      pct >= 80 ? "Excellent! 🎉" : pct >= 50 ? "Good effort 👍" : "Keep practicing 💪";

    return (
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
      >
        <View className="items-center rounded-2xl bg-white/70 p-6" style={CARD}>
          <Text className="text-sm font-semibold text-text-secondary">Your score</Text>
          <Text className="mt-1 text-5xl font-extrabold text-leaf-300">
            {score}/{total}
          </Text>
          <Text className="mt-1 text-lg font-bold text-text-primary">{pct}%</Text>
          <Text className="mt-2 text-base text-text-secondary">{verdict}</Text>
        </View>

        <Text className="mb-2 mt-6 text-base font-bold text-text-primary">Review</Text>
        {quiz.questions.map((q, i) => {
          const userAns = answers[i];
          const correct = userAns === q.answer;
          return (
            <View key={i} className="mb-3 rounded-2xl bg-white/70 p-4" style={CARD}>
              <Text className="text-sm font-semibold text-text-primary">
                {i + 1}. {q.question}
              </Text>
              {q.options.map((opt, oi) => {
                const isCorrect = oi === q.answer;
                const isWrongPick = oi === userAns && !correct;
                return (
                  <View
                    key={oi}
                    className={`mt-2 flex-row items-center rounded-xl px-3 py-2 ${
                      isCorrect
                        ? "bg-green-100"
                        : isWrongPick
                          ? "bg-red-100"
                          : "bg-leaf-50"
                    }`}
                  >
                    <Text className="mr-2">
                      {isCorrect ? "✅" : isWrongPick ? "❌" : "•"}
                    </Text>
                    <Text
                      className={`flex-1 text-sm ${
                        isCorrect
                          ? "font-semibold text-green-700"
                          : isWrongPick
                            ? "text-red-700"
                            : "text-text-primary"
                      }`}
                    >
                      {opt}
                    </Text>
                  </View>
                );
              })}
              {q.explanation ? (
                <Text className="mt-2 text-xs italic text-text-secondary">
                  {q.explanation}
                </Text>
              ) : null}
            </View>
          );
        })}

        <View className="mt-4 flex-row gap-3">
          <Pressable
            onPress={retake}
            className="flex-1 items-center justify-center rounded-2xl border border-leaf-200 py-4"
          >
            <Text className="text-base font-bold text-text-primary">Retake</Text>
          </Pressable>
          <Pressable
            onPress={restart}
            className="flex-1 items-center justify-center rounded-2xl bg-leaf-300 py-4"
          >
            <Text className="text-base font-bold text-white">New Test</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  // --------------------------- Setup -----------------------------
  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text className="mb-2 text-sm font-medium text-text-primary">Test me from</Text>
      <View className="flex-row gap-2">
        {SOURCES.map((s) => {
          const active = s.key === source;
          return (
            <Pressable
              key={s.key}
              onPress={() => {
                setSource(s.key);
                setError(null);
              }}
              className={`flex-1 items-center rounded-2xl border px-3 py-3 ${
                active ? "border-leaf-300 bg-leaf-200" : "border-leaf-100 bg-white/60"
              }`}
            >
              <Text className="text-2xl">{s.icon}</Text>
              <Text
                className={`mt-1 text-sm font-semibold ${
                  active ? "text-white" : "text-text-primary"
                }`}
              >
                {s.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Source-specific input */}
      <View className="mt-6">
        {source === "notes" && (
          <>
            <Text className="mb-2 text-sm font-medium text-text-primary">
              Pick a note
            </Text>
            {notes.length === 0 ? (
              <View className="rounded-2xl bg-white/70 p-4" style={CARD}>
                <Text className="text-sm text-text-secondary">
                  You have no notes yet. Create one first, or test from a PDF or
                  YouTube link.
                </Text>
              </View>
            ) : (
              <View className="gap-2">
                {notes.map((n) => {
                  const active = selectedNote?.id === n.id;
                  return (
                    <Pressable
                      key={n.id}
                      onPress={() => setSelectedNote(n)}
                      className={`rounded-2xl border p-4 ${
                        active
                          ? "border-leaf-300 bg-leaf-200"
                          : "border-leaf-100 bg-white/70"
                      }`}
                      style={CARD}
                    >
                      <Text
                        numberOfLines={1}
                        className={`text-base font-semibold ${
                          active ? "text-white" : "text-text-primary"
                        }`}
                      >
                        {n.title}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </>
        )}

        {source === "pdf" && (
          <>
            <Text className="mb-2 text-sm font-medium text-text-primary">PDF file</Text>
            <Pressable
              onPress={pickPdf}
              className="items-center rounded-2xl border border-dashed border-leaf-200 bg-white/60 p-6"
            >
              <Text className="text-3xl">📄</Text>
              <Text className="mt-2 text-base font-semibold text-text-primary">
                {pdf ? pdf.name : "Choose a PDF"}
              </Text>
              <Text className="mt-1 text-xs text-text-secondary">
                {pdf ? "Tap to change" : "Text-based PDFs only (not scanned images)"}
              </Text>
            </Pressable>
          </>
        )}

        {source === "youtube" && (
          <>
            <Text className="mb-2 text-sm font-medium text-text-primary">
              YouTube link
            </Text>
            <TextInput
              value={ytUrl}
              onChangeText={setYtUrl}
              placeholder="https://youtube.com/watch?v=..."
              placeholderTextColor="#B1D3B9"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              className="rounded-xl border border-leaf-100 bg-white/60 px-4 py-3 text-base text-text-primary"
            />
          </>
        )}
      </View>

      {/* Number of questions */}
      <Text className="mb-2 mt-6 text-sm font-medium text-text-primary">
        Number of questions
      </Text>
      <View className="flex-row gap-2">
        {COUNTS.map((c) => {
          const active = c === numQuestions;
          return (
            <Pressable
              key={c}
              onPress={() => setNumQuestions(c)}
              className={`flex-1 items-center rounded-xl border py-3 ${
                active ? "border-leaf-300 bg-leaf-200" : "border-leaf-100 bg-white/60"
              }`}
            >
              <Text
                className={`text-base font-bold ${
                  active ? "text-white" : "text-text-primary"
                }`}
              >
                {c}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Difficulty */}
      <Text className="mb-2 mt-6 text-sm font-medium text-text-primary">Difficulty</Text>
      <View className="flex-row gap-2">
        {DIFFICULTIES.map((d) => {
          const active = d === difficulty;
          return (
            <Pressable
              key={d}
              onPress={() => setDifficulty(d)}
              className={`flex-1 items-center rounded-xl border py-3 ${
                active ? "border-leaf-300 bg-leaf-200" : "border-leaf-100 bg-white/60"
              }`}
            >
              <Text
                className={`text-sm font-semibold capitalize ${
                  active ? "text-white" : "text-text-primary"
                }`}
              >
                {d}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {error ? (
        <View className="mt-5 rounded-xl border border-red-300 bg-red-50 p-3">
          <Text className="text-sm text-red-500">{error}</Text>
        </View>
      ) : null}

      <Pressable
        onPress={onGenerate}
        className="mt-7 h-14 items-center justify-center rounded-2xl bg-leaf-300 active:opacity-80"
        style={CARD}
      >
        <Text className="text-base font-bold text-white">Generate Test</Text>
      </Pressable>
    </ScrollView>
  );
}

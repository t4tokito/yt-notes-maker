import { Fragment } from "react";
import { Text, View } from "react-native";
import { useTheme } from "./theme";

function renderInline(text: string, keyPrefix: string, colors: ReturnType<typeof useTheme>["colors"]) {
  const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_|`[^`]+`)/g);
  return tokens.filter(Boolean).map((tok, i) => {
    const key = `${keyPrefix}-${i}`;
    if (tok.startsWith("**") && tok.endsWith("**")) {
      return <Text key={key} style={{ fontWeight: "bold", color: colors.accentDark }}>{tok.slice(2, -2)}</Text>;
    }
    if ((tok.startsWith("*") && tok.endsWith("*")) || (tok.startsWith("_") && tok.endsWith("_"))) {
      return <Text key={key} style={{ fontStyle: "italic", color: colors.muted }}>{tok.slice(1, -1)}</Text>;
    }
    if (tok.startsWith("`") && tok.endsWith("`")) {
      return <Text key={key} style={{ color: colors.accentDark }}>{tok.slice(1, -1)}</Text>;
    }
    return <Fragment key={key}>{tok}</Fragment>;
  });
}

export function Markdown({ content }: { content: string }) {
  const { colors } = useTheme();
  const lines = content.replace(/\r\n/g, "\n").split("\n");

  return (
    <View>
      {lines.map((raw, idx) => {
        const line = raw.replace(/\s+$/, "");
        const key = `l-${idx}`;

        if (line.trim() === "") return <View key={key} style={{ height: 8 }} />;

        if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
          return <View key={key} style={{ marginVertical: 12, height: 1, backgroundColor: colors.border }} />;
        }

        const h = line.match(/^(#{1,6})\s+(.*)$/);
        if (h) {
          const level = h[1].length;
          const style = {
            fontWeight: "700" as const,
            color: colors.accentDark,
            marginTop: level <= 2 ? 16 : 12,
            marginBottom: 4,
            ...(level === 1 ? { fontSize: 22 } : level === 2 ? { fontSize: 18 } : { fontSize: 16 }),
          };
          return <Text key={key} style={style}>{renderInline(h[2], key, colors)}</Text>;
        }

        const bq = line.match(/^\s*>\s?(.*)$/);
        if (bq) {
          return (
            <View key={key} style={{ marginVertical: 4, borderLeftWidth: 4, borderLeftColor: colors.border, backgroundColor: colors.card, paddingVertical: 4, paddingLeft: 12 }}>
              <Text style={{ fontSize: 15, lineHeight: 24, color: colors.muted }}>{renderInline(bq[1], key, colors)}</Text>
            </View>
          );
        }

        const bullet = line.match(/^(\s*)[-*+]\s+(.*)$/);
        if (bullet) {
          const indent = Math.min(Math.floor(bullet[1].length / 2), 3);
          return (
            <View key={key} style={{ marginVertical: 2, flexDirection: "row", paddingLeft: 8 + indent * 16 }}>
              <Text style={{ fontSize: 15, lineHeight: 24, color: colors.muted }}>• </Text>
              <Text style={{ flex: 1, fontSize: 15, lineHeight: 24, color: colors.text }}>{renderInline(bullet[2], key, colors)}</Text>
            </View>
          );
        }

        const ordered = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
        if (ordered) {
          const indent = Math.min(Math.floor(ordered[1].length / 2), 3);
          return (
            <View key={key} style={{ marginVertical: 2, flexDirection: "row", paddingLeft: 8 + indent * 16 }}>
              <Text style={{ fontSize: 15, lineHeight: 24, color: colors.muted }}>{ordered[2]}. </Text>
              <Text style={{ flex: 1, fontSize: 15, lineHeight: 24, color: colors.text }}>{renderInline(ordered[3], key, colors)}</Text>
            </View>
          );
        }

        return <Text key={key} style={{ marginVertical: 2, fontSize: 15, lineHeight: 24, color: colors.text }}>{renderInline(line, key, colors)}</Text>;
      })}
    </View>
  );
}

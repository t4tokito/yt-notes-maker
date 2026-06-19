import { Fragment } from "react";
import { Text, View } from "react-native";

/**
 * Minimal Markdown renderer for AI-generated notes.
 * Handles: #/##/### headings, -/* bullet lists (with simple nesting),
 * 1. ordered lists, > blockquotes, --- rules, and inline **bold** / *italic* /
 * `code`. Good enough for the structured notes our backend produces, with no
 * native dependency.
 */

function renderInline(text: string, keyPrefix: string) {
  // Split on **bold**, *italic*/_italic_, and `code` while keeping delimiters.
  const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_|`[^`]+`)/g);
  return tokens.filter(Boolean).map((tok, i) => {
    const key = `${keyPrefix}-${i}`;
    if (tok.startsWith("**") && tok.endsWith("**")) {
      return (
        <Text key={key} className="font-bold text-white">
          {tok.slice(2, -2)}
        </Text>
      );
    }
    if (
      (tok.startsWith("*") && tok.endsWith("*")) ||
      (tok.startsWith("_") && tok.endsWith("_"))
    ) {
      return (
        <Text key={key} className="italic text-slate-200">
          {tok.slice(1, -1)}
        </Text>
      );
    }
    if (tok.startsWith("`") && tok.endsWith("`")) {
      return (
        <Text key={key} className="text-rose-300">
          {tok.slice(1, -1)}
        </Text>
      );
    }
    return <Fragment key={key}>{tok}</Fragment>;
  });
}

export function Markdown({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");

  return (
    <View>
      {lines.map((raw, idx) => {
        const line = raw.replace(/\s+$/, "");
        const key = `l-${idx}`;

        if (line.trim() === "") {
          return <View key={key} className="h-2" />;
        }

        // Horizontal rule
        if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
          return <View key={key} className="my-3 h-px bg-slate-700" />;
        }

        // Headings
        const h = line.match(/^(#{1,6})\s+(.*)$/);
        if (h) {
          const level = h[1].length;
          const cls =
            level === 1
              ? "text-2xl font-bold text-slate-50 mt-4 mb-1"
              : level === 2
                ? "text-xl font-bold text-slate-100 mt-4 mb-1"
                : "text-base font-semibold text-slate-200 mt-3 mb-1";
          return (
            <Text key={key} className={cls}>
              {renderInline(h[2], key)}
            </Text>
          );
        }

        // Blockquote
        const bq = line.match(/^\s*>\s?(.*)$/);
        if (bq) {
          return (
            <View
              key={key}
              className="my-1 border-l-4 border-indigo-500 bg-slate-800 py-1 pl-3"
            >
              <Text className="text-[15px] leading-6 text-slate-300">
                {renderInline(bq[1], key)}
              </Text>
            </View>
          );
        }

        // Bullet list (supports one level of nesting via leading spaces)
        const bullet = line.match(/^(\s*)[-*+]\s+(.*)$/);
        if (bullet) {
          const indent = Math.min(Math.floor(bullet[1].length / 2), 3);
          return (
            <View
              key={key}
              className="my-0.5 flex-row"
              style={{ paddingLeft: 8 + indent * 16 }}
            >
              <Text className="text-[15px] leading-6 text-indigo-400">• </Text>
              <Text className="flex-1 text-[15px] leading-6 text-slate-200">
                {renderInline(bullet[2], key)}
              </Text>
            </View>
          );
        }

        // Ordered list
        const ordered = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
        if (ordered) {
          const indent = Math.min(Math.floor(ordered[1].length / 2), 3);
          return (
            <View
              key={key}
              className="my-0.5 flex-row"
              style={{ paddingLeft: 8 + indent * 16 }}
            >
              <Text className="text-[15px] leading-6 text-indigo-400">
                {ordered[2]}.{" "}
              </Text>
              <Text className="flex-1 text-[15px] leading-6 text-slate-200">
                {renderInline(ordered[3], key)}
              </Text>
            </View>
          );
        }

        // Paragraph
        return (
          <Text key={key} className="my-0.5 text-[15px] leading-6 text-slate-200">
            {renderInline(line, key)}
          </Text>
        );
      })}
    </View>
  );
}

import { Highlight, themes } from "prism-react-renderer";

type Props = {
  code: string;
  language?: string;
};

/**
 * Small JS code block with syntax highlighting, tuned to fit inside a
 * pattern card. Uses Prism's VS Dark theme as a starting point and then
 * overrides the background to match our felt surface.
 */
export function CodeBlock({ code, language = "javascript" }: Props) {
  return (
    <Highlight code={code.trim()} language={language} theme={themes.vsDark}>
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre
          className={[
            className,
            "w-full overflow-x-auto rounded-lg p-3 text-left font-mono text-[0.72rem] leading-[1.45]",
          ].join(" ")}
          style={{
            ...style,
            background: "rgba(6, 32, 24, 0.85)",
            border: "1px solid rgba(212, 175, 55, 0.22)",
            textAlign: "left",
          }}
        >
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })} className="table-row">
              <span className="table-cell select-none pr-3 text-right align-top text-[--color-gold-500]/45 tabular-nums">
                {i + 1}
              </span>
              <span className="table-cell whitespace-pre align-top">
                {line.map((token, j) => (
                  <span key={j} {...getTokenProps({ token })} />
                ))}
              </span>
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
}

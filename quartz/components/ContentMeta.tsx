import { formatDate, getDate } from "./Date"
import { QuartzComponentConstructor, QuartzComponentProps } from "./types"
import readingTime from "reading-time"
import { classNames } from "../util/lang"
import { i18n } from "../i18n"

import type { JSX } from "preact"
import { format as formatDateFn, formatISO } from "date-fns"

const TimeMeta = ({ value }: { value: Date }) => (
  <time dateTime={formatISO(value)} title={formatDateFn(value, "ccc w")}>
    {formatDateFn(value, "MMM do yyyy")}
  </time>
)

interface ContentMetaOptions {
  /**
   * Whether to display reading time
   */
  showReadingTime: boolean
}

const defaultOptions: ContentMetaOptions = {
  showReadingTime: true,
}

export default ((opts?: Partial<ContentMetaOptions>) => {
  // Merge options with defaults
  const options: ContentMetaOptions = { ...defaultOptions, ...opts }

  function ContentMetadata({ cfg, fileData, displayClass }: QuartzComponentProps) {
    const text = fileData.text

    if (text) {
      const segments: JSX.Element[] = []
      const { text: timeTaken, words: _words } = readingTime(text)

      if (fileData.dates) {
        if (fileData.dates.created) {
          segments.push(
            <span>
            📋 Created <TimeMeta value={fileData.dates.created} />
            </span>,
          )
        }

        if (fileData.dates.modified) {
          segments.push(
            <span>
            ✏️  Updated <TimeMeta value={fileData.dates.modified} />
            </span>,
          )
        }
      }

      segments.push(<span>⏲ {timeTaken}</span>)

      segments.push(
        <a
          href={`https://github.com/persona0220/quartz/commits/v4/${fileData.filePath}`}
          target="_blank"
        >
          🗓️ History
        </a>,
      )

      return (
        <p class="content-meta">
          {segments.map((meta, idx) => (
            <>
              {meta}
              {idx < segments.length - 1 ? <br /> : null}
            </>
          ))}
        </p>
      )

    } else {
      return null
    }
  }

  ContentMetadata.css = `
  .content-meta {
    display:flex;
    justify-content: flex-start;
    flex-wrap: wrap;
    gap: 10;

    margin-top: 0;
    color: var(--gray);
  }
  `
  return ContentMetadata
}) satisfies QuartzComponentConstructor

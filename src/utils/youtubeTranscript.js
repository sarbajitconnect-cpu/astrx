/**
 * Real YouTube Video Metadata (Title, Channel, Author)
 */
export async function getRealYouTubeMetadata(videoId) {
  if (!videoId) return { title: 'Educational Video', channel: 'YouTube' };
  try {
    const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
    if (res.ok) {
      const data = await res.json();
      if (data.title) {
        return {
          title: data.title,
          channel: data.author_name || 'YouTube'
        };
      }
    }
  } catch (err) {
    console.warn("oEmbed metadata fetch failed:", err);
  }
  return { title: 'Educational Video', channel: 'YouTube' };
}

/**
 * Real YouTube Transcript Extractor
 */
export async function getRealYouTubeTranscript(videoId, videoTitle = '', videoChannel = '') {
  if (!videoId) return null;

  // 1. Fetch metadata if title is generic
  const meta = await getRealYouTubeMetadata(videoId);
  const resolvedTitle = meta.title || videoTitle || 'Educational Video';

  try {
    const res = await fetch(`/api/yt-transcript?v=${videoId}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.status === 'success' && Array.isArray(data.items) && data.items.length > 0) {
        const formatted = formatTranscriptItems(data.items);
        if (formatted) {
          return `### Spoken Transcript: ${resolvedTitle}\n\n${formatted}`;
        }
      }
    }
  } catch (err) {
    console.warn("Server-side transcript fetch failed:", err);
  }

  return `### Video Transcript: ${resolvedTitle}\n\n_Note: Official spoken captions or subtitles are not available or have been disabled for this video on YouTube._`;
}

/**
 * Cleanly group raw caption items into timestamped paragraphs
 */
function formatTranscriptItems(items) {
  if (!items || items.length === 0) return null;
  const blocks = [];
  let currentBlock = [];
  let currentStart = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    // offset is in ms or seconds
    const rawOffset = item.offset || 0;
    const offsetSec = rawOffset > 10000 ? Math.floor(rawOffset / 1000) : Math.floor(rawOffset);
    const cleanText = decodeHtmlEntities(item.text).replace(/[\r\n]+/g, ' ').trim();
    if (!cleanText) continue;

    if (currentBlock.length === 0) {
      currentStart = offsetSec;
      currentBlock.push(cleanText);
    } else {
      const lastText = currentBlock.join(' ');
      // If block has accumulated ~25 seconds or ~220 chars, start new block
      if (offsetSec - currentStart >= 25 || lastText.length > 220) {
        const m = Math.floor(currentStart / 60);
        const s = currentStart % 60;
        const timeStr = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        blocks.push(`**[${timeStr}]** ${currentBlock.join(' ')}`);
        currentBlock = [cleanText];
        currentStart = offsetSec;
      } else {
        currentBlock.push(cleanText);
      }
    }
  }

  if (currentBlock.length > 0) {
    const m = Math.floor(currentStart / 60);
    const s = currentStart % 60;
    const timeStr = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    blocks.push(`**[${timeStr}]** ${currentBlock.join(' ')}`);
  }

  return blocks.join('\n\n');
}

function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n/g, ' ')
    .trim();
}

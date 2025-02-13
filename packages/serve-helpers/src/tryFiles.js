import { randomUUID } from "node:crypto";
import { createReadStream, existsSync, statSync } from "node:fs";

/**
 * @param files {string|string[]}
 */
export function tryFiles(files) {
  /** @type {string[]} */
  const fileList = [].concat(files);
  for (const filePath of fileList) {
    if (existsSync(filePath)) {
      return filePath;
    }
  }
}

/**
 * @param files {string|string[]}
 * @param req {import("express").Request}
 * @param res {import("express").Response}
 */
export function tryServeFiles(files, req, res, next) {
  const filePath = tryFiles(files);
  if (filePath) {
    // Express.js doesn't support multiple ranges out of the box.
    const range = req.get("range");
    if (range) {
      const matches = range.match(/bytes=([\d-]+(?:,\s*[\d-]+)+)/);
      if (matches) {
        const ranges = matches[1].split(/,\s*/g);
        if (ranges.length > 1) {
          return sendMultiRanges(filePath, ranges, res);
        }
      }
    }
    res.sendFile(filePath);
    return;
  }
  next();
}

function sendMultiRanges(filePath, _ranges, res) {
  const stat = statSync(filePath);
  const fileSize = stat.size;

  const ranges = _ranges.map((range) => {
    const [start, end] = range.split("-").map(Number);
    return {
      start: isNaN(start) ? fileSize - end : start,
      end: isNaN(end) ? fileSize - 1 : end,
    };
  });

  const boundary = randomUUID().replaceAll("-", "");
  res.writeHead(206, {
    "Content-Type": `multipart/byteranges; boundary=${boundary}`,
    "Last-Modified": stat.mtime.toUTCString(),
    "Cache-Control": "max-age=31536000",
    // "Expires": "Thu, 12 Feb 2026 09:39:38 GMT",
  });

  (async () => {
    for (const { start, end } of ranges) {
      await new Promise((resolve) => {
        const stream = createReadStream(filePath, { start, end });
        let chunk = `\r\n--${boundary}\r\n`;
        chunk += `Content-Range: bytes ${start}-${end}/${fileSize}\r\n\r\n`;
        res.write(chunk);
        stream.pipe(res, { end: false });
        stream.on("end", resolve);
      });
    }
  })().then(() => {
    res.end(`\r\n--${boundary}--\r\n`);
  });
}

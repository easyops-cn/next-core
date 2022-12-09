function triggerHttpCache(type: "http:cache.start" | "http:cache.end") {
  return () => {
    window.dispatchEvent(new CustomEvent(type));
  };
}
export const httpCacheRecord = {
  start: triggerHttpCache("http:cache.start"),
  end: triggerHttpCache("http:cache.end"),
};

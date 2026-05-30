const REVIEWS_KEY = "ai_reviews";
const CONFIG_KEY = "ai_config";

// ── Reviews ──────────────────────────────────
export function saveReview(reviewData) {
  const reviews = getAllReviews();
  const entry = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    ...reviewData,
  };
  reviews.unshift(entry);
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
  return entry;
}

export function getAllReviews() {
  try {
    return JSON.parse(localStorage.getItem(REVIEWS_KEY)) || [];
  } catch {
    return [];
  }
}

export function deleteReview(id) {
  const reviews = getAllReviews().filter((r) => r.id !== id);
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
}

export function clearAllReviews() {
  localStorage.removeItem(REVIEWS_KEY);
}

// ── AI Config ─────────────────────────────────
export function saveConfig(config) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export function getConfig() {
  try {
    return (
      JSON.parse(localStorage.getItem(CONFIG_KEY)) || {
        provider: "google",
        model: "gemini-flash-latest",
        api_key: "",
        post_to_github: true,
      }
    );
  } catch {
    return {
      provider: "google",
      model: "gemini-flash-latest",
      api_key: "",
      post_to_github: true,
    };
  }
}
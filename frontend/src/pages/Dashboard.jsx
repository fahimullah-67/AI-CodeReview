import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, GitPullRequest, Bug, Shield, Trash2, Star } from "lucide-react";
import { getAllReviews, deleteReview, clearAllReviews } from "../utils/storage";

export default function Dashboard() {
  const [reviews, setReviews] = useState(getAllReviews());
  const [feedback, setFeedback] = useState({});
  const navigate = useNavigate();

  const totalBugs = reviews.reduce((acc, r) =>
    acc + r.reviews.reduce((a, f) => a + f.review.bugs.length, 0), 0);
  const totalSecurity = reviews.reduce((acc, r) =>
    acc + r.reviews.reduce((a, f) => a + f.review.security_issues.length, 0), 0);
  const avgScore = reviews.length
    ? Math.round(reviews.reduce((acc, r) => {
        const scores = r.reviews.map((f) => f.review.overall_score);
        return acc + scores.reduce((a, b) => a + b, 0) / scores.length;
      }, 0) / reviews.length)
    : 0;

  const handleDelete = (id) => {
    deleteReview(id);
    setReviews(getAllReviews());
  };

  const handleClearAll = () => {
    if (window.confirm("Delete all reviews?")) {
      clearAllReviews();
      setReviews([]);
    }
  };

  const handleFeedback = (id, rating) => {
    setFeedback((prev) => ({ ...prev, [id]: rating }));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
      <p className="text-gray-400 mb-8">Your AI code review history</p>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "PRs Reviewed", value: reviews.length, icon: <GitPullRequest size={20} />, color: "text-purple-400" },
          { label: "Bugs Found", value: totalBugs, icon: <Bug size={20} />, color: "text-red-400" },
          { label: "Security Issues", value: totalSecurity, icon: <Shield size={20} />, color: "text-orange-400" },
          { label: "Avg Score", value: `${avgScore}/100`, icon: <Bot size={20} />, color: "text-green-400" },
        ].map((stat) => (
          <div key={stat.label}
            className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
            <div className={`mb-3 ${stat.color}`}>{stat.icon}</div>
            <div className="text-3xl font-bold mb-1">{stat.value}</div>
            <div className="text-gray-400 text-sm">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Review Form */}
      <QuickReviewForm navigate={navigate} />

      {/* Recent Reviews */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Reviews</h2>
          {reviews.length > 0 && (
            <button onClick={handleClearAll}
              className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1">
              <Trash2 size={14} /> Clear All
            </button>
          )}
        </div>

        {reviews.length === 0 ? (
          <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-12 text-center text-gray-500">
            <Bot size={40} className="mx-auto mb-3 text-gray-600" />
            <p>No reviews yet. Use Quick Review above to start!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id}
                className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <GitPullRequest size={16} className="text-purple-400" />
                      <span className="font-medium">{review.pr.title}</span>
                      <span className="text-xs text-gray-500 font-mono">
                        #{review.pr.number}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400 mb-3">
                      {review.pr.author} • {review.owner}/{review.repo} •{" "}
                      {new Date(review.timestamp).toLocaleDateString()}
                    </div>

                    {/* Per-file scores */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {review.reviews.map((f) => (
                        <span key={f.filename}
                          className="text-xs bg-[#0d1117] border border-[#21262d] rounded px-2 py-1 font-mono">
                          {f.filename}
                          <span className="ml-2 text-purple-400">
                            {f.review.overall_score}/100
                          </span>
                        </span>
                      ))}
                    </div>

                    {/* User Feedback */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Rate this review:</span>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star}
                          onClick={() => handleFeedback(review.id, star)}
                          className={`transition-colors ${
                            (feedback[review.id] || 0) >= star
                              ? "text-yellow-400"
                              : "text-gray-600 hover:text-yellow-400"
                          }`}>
                          <Star size={14} fill={
                            (feedback[review.id] || 0) >= star
                              ? "currentColor" : "none"
                          } />
                        </button>
                      ))}
                      {feedback[review.id] && (
                        <span className="text-xs text-gray-500 ml-1">
                          Thanks for your feedback!
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-end gap-3 ml-4">
                    <button
                      onClick={() => navigate(
                        `/reviews/${review.owner}/${review.repo}/${review.pr.number}`
                      )}
                      className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg transition-colors">
                      View Detail
                    </button>
                    <button
                      onClick={() => handleDelete(review.id)}
                      className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Quick Review Form ──────────────────────────
function QuickReviewForm({ navigate }) {
  const [repo, setRepo] = useState("");
  const [prNum, setPrNum] = useState("");
  const [error, setError] = useState("");

  const handleReview = () => {
    if (!repo.includes("/") || !prNum) {
      setError("Enter repo as owner/repo and a PR number");
      return;
    }
    const [owner, repoName] = repo.split("/");
    navigate(`/reviews/${owner}/${repoName}/${prNum}`);
  };

  return (
    <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-6">
      <h2 className="text-lg font-semibold mb-4">Quick Review</h2>
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="owner/repo-name"
          value={repo}
          onChange={(e) => { setRepo(e.target.value); setError(""); }}
          className="bg-[#0d1117] border border-[#21262d] rounded-lg px-4 py-2 text-sm flex-1 outline-none focus:border-purple-500"
        />
        <input
          type="number"
          placeholder="PR #"
          value={prNum}
          onChange={(e) => { setPrNum(e.target.value); setError(""); }}
          className="bg-[#0d1117] border border-[#21262d] rounded-lg px-4 py-2 text-sm w-28 outline-none focus:border-purple-500"
        />
        <button
          onClick={handleReview}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors">
          Review PR
        </button>
      </div>
      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
    </div>
  );
}
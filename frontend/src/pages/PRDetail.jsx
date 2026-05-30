import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import { Bug, Shield, Lightbulb, CheckCircle, Loader, ExternalLink } from "lucide-react";
import { getConfig } from "../utils/storage";
import { saveReview, getAllReviews } from "../utils/storage";

export default function PRDetail() {
  const { owner, repo, prNumber } = useParams();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [config, setConfig] = useState(getConfig());
  const [alreadySaved, setAlreadySaved] = useState(false);

  // Check if this PR was already reviewed
  useEffect(() => {
    const existing = getAllReviews().find(
      (r) => r.pr?.number === parseInt(prNumber) &&
             r.owner === owner && r.repo === repo
    );
    if (existing) {
      setReview(existing);
      setAlreadySaved(true);
    }
  }, [owner, repo, prNumber]);

  const startReview = async () => {
    if (!config.api_key) {
      setError("No API key found. Please configure it in Settings first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(
        `http://localhost:8000/api/review/${owner}/${repo}/${prNumber}`,
        {
          provider: config.provider,
          model: config.model,
          api_key: config.api_key,
          post_to_github: config.post_to_github,
        }
      );

      const data = res.data;

      // Save to localStorage
      const saved = saveReview({
        owner,
        repo,
        pr: data.pr,
        reviews: data.reviews,
        model_used: data.model_used,
      });

      setReview(saved);
      setAlreadySaved(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Review failed. Check backend.");
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">
          PR #{prNumber} — {owner}/{repo}
        </h1>
        <a
          href={`https://github.com/${owner}/${repo}/pull/${prNumber}`}
          target="_blank" rel="noreferrer"
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-white">
          <ExternalLink size={14} /> View on GitHub
        </a>
      </div>

      {/* Model badge */}
      <p className="text-gray-500 text-sm mb-6">
        Model: <span className="text-purple-400">{config.provider}/{config.model}</span>
        {alreadySaved && (
          <span className="ml-3 text-green-400 text-xs">✓ Saved to history</span>
        )}
      </p>

      {/* Review Button */}
      {!review && (
        <button
          onClick={startReview}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 mb-8">
          {loading
            ? <><Loader size={16} className="animate-spin" /> Reviewing with AI...</>
            : "🤖 Start AI Review"}
        </button>
      )}

      {review && !loading && (
        <button
          onClick={() => { setReview(null); setAlreadySaved(false); startReview(); }}
          className="mb-6 text-sm text-purple-400 hover:text-purple-300 underline">
          Re-run review
        </button>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-xl p-4 mb-6 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Results */}
      {review && review.reviews?.map((fileReview) => (
        <FileReviewCard key={fileReview.filename} fileReview={fileReview} />
      ))}
    </div>
  );
}

function FileReviewCard({ fileReview }) {
  const r = fileReview.review;
  return (
    <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-6 mb-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-mono text-purple-400 font-medium text-sm">
          📁 {fileReview.filename}
        </h2>
        <div className="text-right">
          <div className="text-3xl font-bold">{r.overall_score}/100</div>
          <div className="text-xs text-gray-500 mt-1">overall score</div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-[#0d1117] rounded-lg p-4 mb-6 text-gray-300 text-sm leading-relaxed">
        {r.summary}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-red-900/20 border border-red-900/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-400">{r.bugs.length}</div>
          <div className="text-red-400 text-xs mt-1">Bugs</div>
        </div>
        <div className="bg-yellow-900/20 border border-yellow-900/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-yellow-400">{r.improvements.length}</div>
          <div className="text-yellow-400 text-xs mt-1">Improvements</div>
        </div>
        <div className="bg-orange-900/20 border border-orange-900/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-orange-400">{r.security_issues.length}</div>
          <div className="text-orange-400 text-xs mt-1">Security</div>
        </div>
      </div>

      {/* Issues */}
      <IssueList title="Bugs Found" items={r.bugs}
        color="red" icon={<Bug size={15} />} />
      <IssueList title="Improvements" items={r.improvements}
        color="yellow" icon={<Lightbulb size={15} />} />
      <IssueList title="Security Issues" items={r.security_issues}
        color="orange" icon={<Shield size={15} />} />
      <IssueList title="Positive Points" items={r.positive_points?.map((p) => ({
        line: null, description: p, severity: "good"
      })) || []} color="green" icon={<CheckCircle size={15} />} />
    </div>
  );
}

function IssueList({ title, items, color, icon }) {
  if (!items?.length) return null;

  const colors = {
    red: { text: "text-red-400", border: "border-red-500", bg: "bg-red-900/10" },
    yellow: { text: "text-yellow-400", border: "border-yellow-500", bg: "bg-yellow-900/10" },
    orange: { text: "text-orange-400", border: "border-orange-500", bg: "bg-orange-900/10" },
    green: { text: "text-green-400", border: "border-green-500", bg: "bg-green-900/10" },
  }[color];

  return (
    <div className="mb-5">
      <h3 className={`flex items-center gap-2 ${colors.text} font-medium mb-3 text-sm`}>
        {icon} {title} ({items.length})
      </h3>
      {items.map((item, i) => (
        <div key={i}
          className={`${colors.bg} border-l-4 ${colors.border} rounded-r-lg p-3 mb-2`}>
          {item.line && (
            <span className={`${colors.text} text-xs font-mono mr-2`}>
              Line {item.line}
            </span>
          )}
          {item.severity && item.severity !== "good" && (
            <span className={`text-xs px-2 py-0.5 rounded mr-2 ${colors.bg} ${colors.text} border ${colors.border}`}>
              {item.severity}
            </span>
          )}
          <span className="text-gray-300 text-sm">{item.description}</span>
        </div>
      ))}
    </div>
  );
}
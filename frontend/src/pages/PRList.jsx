import { Link } from "react-router-dom";
import { GitPullRequest, Bug, Shield } from "lucide-react";

const mockPRs = [
  { id: 1, title: "Fix payment bug", repo: "fahimullah-67/ai-reviewer-test", author: "fahimullah-67", score: 55, bugs: 2, security: 1, status: "Reviewed", pr_number: 3 },
  { id: 2, title: "Add new feature", repo: "fahimullah-67/ai-reviewer-test", author: "fahimullah-67", score: 80, bugs: 0, security: 0, status: "Reviewed", pr_number: 2 },
];

export default function PRList() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">PR Reviews</h1>
      <p className="text-gray-400 mb-8">All pull requests reviewed by AI</p>

      <div className="space-y-4">
        {mockPRs.map((pr) => (
          <div key={pr.id}
            className="bg-[#161b22] border border-[#21262d] rounded-xl p-5 hover:border-purple-500 transition-colors">
            <div className="flex items-center justify-between">

              {/* Left */}
              <div className="flex items-center gap-3">
                <GitPullRequest className="text-purple-400" size={20} />
                <div>
                  <div className="font-medium">{pr.title}</div>
                  <div className="text-gray-400 text-sm">{pr.repo} • by {pr.author}</div>
                </div>
              </div>

              {/* Right */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-red-400 text-sm">
                  <Bug size={14} />
                  {pr.bugs} bugs
                </div>
                <div className="flex items-center gap-1 text-orange-400 text-sm">
                  <Shield size={14} />
                  {pr.security} security
                </div>
                <div className="text-2xl font-bold text-purple-400">
                  {pr.score}/100
                </div>
                <Link
                  to={`/reviews/fahimullah-67/ai-reviewer-test/${pr.pr_number}`}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded-lg text-sm transition-colors">
                  View Review
                </Link>
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
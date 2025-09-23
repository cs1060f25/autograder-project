export function MarketingPanel() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
          <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
            AI-Assisted
          </span>
          <span className="text-black block">Grading Platform</span>
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed">
          Transform your grading process with intelligent automation that saves
          time while maintaining accuracy and fairness.
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Intelligent Assessment
            </h3>
            <p className="text-gray-600">
              Advanced AI algorithms analyze student work with human-level
              understanding and consistency, greatly accelerating the human
              grading process.
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-5 h-5 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Instant Feedback
            </h3>
            <p className="text-gray-600">
              Provide immediate, detailed feedback to students, accelerating
              their learning process.
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
            <svg
              className="w-5 h-5 text-orange-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Secure & Reliable
            </h3>
            <p className="text-gray-600">
              Encryption ensures that sensitive student data is protected at all
              times.
            </p>
          </div>
        </div>
      </div>

      <div className="pt-4">
        <p className="text-sm text-gray-500">
          Created by Evan Jiang, Andrew Zhao, and Jackson Moody
        </p>
      </div>
    </div>
  );
}

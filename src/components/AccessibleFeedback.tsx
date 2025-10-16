'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function AccessibleFeedback() {
  const [isAccessibleMode, setIsAccessibleMode] = useState(false);

  // Sample data for colorblind-safe chart
  const chartData = [
    { label: 'Clarity', value: 85, color: isAccessibleMode ? '#0066CC' : '#3B82F6' }, // Blue
    { label: 'Accuracy', value: 92, color: isAccessibleMode ? '#FF8800' : '#F97316' }, // Orange
    { label: 'Helpfulness', value: 78, color: isAccessibleMode ? '#0066CC' : '#3B82F6' }, // Blue
    { label: 'Actionability', value: 88, color: isAccessibleMode ? '#FF8800' : '#F97316' }, // Orange
  ];

  const maxValue = 100;

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-6 transition-all duration-300 ${
        isAccessibleMode
          ? 'bg-black text-yellow-300'
          : 'bg-gradient-to-br from-slate-50 to-slate-100 text-gray-800'
      }`}
      style={
        isAccessibleMode
          ? { fontFamily: 'OpenDyslexic, Arial, sans-serif' }
          : {}
      }
    >
      <div
        className={`w-full max-w-3xl rounded-2xl shadow-2xl p-8 transition-all duration-300 ${
          isAccessibleMode
            ? 'bg-gray-900 border-4 border-yellow-300'
            : 'bg-white border border-gray-200'
        }`}
      >
        {/* Header with Toggle */}
        <div className="flex items-center justify-between mb-8">
          <h1
            className={`font-bold transition-all duration-300 ${
              isAccessibleMode ? 'text-4xl' : 'text-3xl'
            }`}
          >
            AI Feedback Report
          </h1>
          <button
            onClick={() => setIsAccessibleMode(!isAccessibleMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
              isAccessibleMode
                ? 'bg-yellow-300 text-black hover:bg-yellow-400 text-lg'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            aria-label={`Switch to ${isAccessibleMode ? 'default' : 'accessible'} mode`}
          >
            {isAccessibleMode ? (
              <>
                <EyeOff size={20} />
                <span>Default Mode</span>
              </>
            ) : (
              <>
                <Eye size={20} />
                <span>Accessible Mode</span>
              </>
            )}
          </button>
        </div>

        {/* Mode Explanation */}
        <div
          className={`rounded-lg p-4 mb-8 transition-all duration-300 ${
            isAccessibleMode
              ? 'bg-gray-800 border-2 border-yellow-300'
              : 'bg-blue-50 border border-blue-200'
          }`}
        >
          <h2
            className={`font-semibold mb-2 transition-all duration-300 ${
              isAccessibleMode ? 'text-2xl' : 'text-lg'
            }`}
          >
            {isAccessibleMode ? 'Accessible Mode Active' : 'Default Mode Active'}
          </h2>
          <p
            className={`transition-all duration-300 ${
              isAccessibleMode ? 'text-xl leading-relaxed' : 'text-base'
            }`}
          >
            {isAccessibleMode
              ? 'High-contrast theme with larger text and OpenDyslexic font for improved readability. Designed for users with visual impairments or dyslexia.'
              : 'Standard viewing mode with modern design and comfortable reading experience for general use.'}
          </p>
        </div>

        {/* Feedback Content */}
        <div className="mb-8">
          <h2
            className={`font-semibold mb-4 transition-all duration-300 ${
              isAccessibleMode ? 'text-3xl' : 'text-2xl'
            }`}
          >
            Assignment Feedback
          </h2>
          <div
            className={`space-y-4 transition-all duration-300 ${
              isAccessibleMode ? 'text-xl leading-loose' : 'text-base leading-relaxed'
            }`}
          >
            <p>
              <strong className={isAccessibleMode ? 'text-yellow-300' : 'text-gray-900'}>
                Overall Assessment:
              </strong>{' '}
              Your submission demonstrates a solid understanding of the core concepts. The
              implementation is well-structured and follows best practices.
            </p>
            <p>
              <strong className={isAccessibleMode ? 'text-yellow-300' : 'text-gray-900'}>
                Strengths:
              </strong>{' '}
              Clear code organization, comprehensive test coverage, and excellent documentation.
            </p>
            <p>
              <strong className={isAccessibleMode ? 'text-yellow-300' : 'text-gray-900'}>
                Areas for Improvement:
              </strong>{' '}
              Consider edge case handling and optimize the algorithm for larger datasets.
            </p>
          </div>
        </div>

        {/* Colorblind-Safe Chart */}
        <div>
          <h2
            className={`font-semibold mb-4 transition-all duration-300 ${
              isAccessibleMode ? 'text-3xl' : 'text-2xl'
            }`}
          >
            Feedback Quality Metrics
          </h2>
          <p
            className={`mb-4 transition-all duration-300 ${
              isAccessibleMode ? 'text-lg' : 'text-sm'
            } ${isAccessibleMode ? 'text-yellow-200' : 'text-gray-600'}`}
          >
            Using colorblind-safe colors: Blue and Orange (accessible for all types of color
            vision deficiency)
          </p>
          <div className="space-y-4">
            {chartData.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between mb-1">
                  <span
                    className={`font-medium transition-all duration-300 ${
                      isAccessibleMode ? 'text-xl' : 'text-base'
                    }`}
                  >
                    {item.label}
                  </span>
                  <span
                    className={`font-bold transition-all duration-300 ${
                      isAccessibleMode ? 'text-xl' : 'text-base'
                    }`}
                  >
                    {item.value}%
                  </span>
                </div>
                <div
                  className={`w-full rounded-full overflow-hidden transition-all duration-300 ${
                    isAccessibleMode
                      ? 'bg-gray-700 h-8 border-2 border-yellow-300'
                      : 'bg-gray-200 h-6'
                  }`}
                >
                  <div
                    className="h-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
                    style={{
                      width: `${item.value}%`,
                      backgroundColor: item.color,
                    }}
                    role="progressbar"
                    aria-valuenow={item.value}
                    aria-valuemin={0}
                    aria-valuemax={maxValue}
                    aria-label={`${item.label}: ${item.value}%`}
                  >
                    {isAccessibleMode && (
                      <span className="text-white font-bold text-sm">{item.value}%</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex gap-6 justify-center">
          <div className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded transition-all duration-300 ${
                isAccessibleMode ? 'border-2 border-yellow-300' : ''
              }`}
              style={{ backgroundColor: isAccessibleMode ? '#0066CC' : '#3B82F6' }}
            />
            <span className={isAccessibleMode ? 'text-lg' : 'text-sm'}>Category A</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded transition-all duration-300 ${
                isAccessibleMode ? 'border-2 border-yellow-300' : ''
              }`}
              style={{ backgroundColor: isAccessibleMode ? '#FF8800' : '#F97316' }}
            />
            <span className={isAccessibleMode ? 'text-lg' : 'text-sm'}>Category B</span>
          </div>
        </div>

        {/* Accessibility Note */}
        <div
          className={`mt-8 pt-6 border-t transition-all duration-300 ${
            isAccessibleMode
              ? 'border-yellow-300 text-lg'
              : 'border-gray-200 text-sm text-gray-500'
          }`}
        >
          <p className="text-center">
            💡 Toggle between modes to experience different accessibility features designed for
            diverse user needs.
          </p>
        </div>
      </div>
    </div>
  );
}

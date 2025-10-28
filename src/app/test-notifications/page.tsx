"use client";

import { useState } from "react";
import { notifySubmissionGraded, getUserNotifications } from "@/lib/notification-actions";

export default function TestNotificationsPage() {
  const [status, setStatus] = useState("");
  const [notifications, setNotifications] = useState<any[]>([]);

  const testNotification = async () => {
    setStatus("Sending notification...");
    
    const result = await notifySubmissionGraded({
      submissionId: "test-sub-123",
      studentId: "test-user-123", // Replace with a real user ID from your database
      assignmentId: "test-assign-123",
      grade: 95,
      feedback: "Excellent work on this assignment!",
      gradedBy: "instructor-123",
    });

    if (result.success) {
      setStatus("✅ Notification sent successfully!");
    } else {
      setStatus(`❌ Error: ${result.error}`);
    }
  };

  const fetchNotifications = async () => {
    setStatus("Fetching notifications...");
    
    const result = await getUserNotifications(10);
    
    if (result.success && result.data) {
      setNotifications(result.data);
      setStatus(`✅ Found ${result.data.length} notifications`);
    } else {
      setStatus(`❌ Error: ${result.error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">NotificationService Test Page</h1>

        {/* Service Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Service Status</h2>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Mode:</span>{" "}
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                Mock Mode (Development)
              </span>
            </p>
            <p className="text-sm text-gray-600">
              Notifications are logged to console and database without sending real emails/SMS
            </p>
          </div>
        </div>

        {/* Test Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
          <div className="space-y-4">
            <button
              onClick={testNotification}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Send Test Notification (Submission Graded)
            </button>
            
            <button
              onClick={fetchNotifications}
              className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition"
            >
              Fetch Notification History
            </button>
          </div>
        </div>

        {/* Status Display */}
        {status && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Status</h2>
            <p className="text-lg">{status}</p>
          </div>
        )}

        {/* Notifications List */}
        {notifications.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Notification History</h2>
            <div className="space-y-4">
              {notifications.map((notif) => (
                <div key={notif.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium">{notif.event_type}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      notif.status === 'sent' ? 'bg-green-100 text-green-800' :
                      notif.status === 'mock' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {notif.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Provider: {notif.provider}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(notif.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Features List */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">✨ Implemented Features</h2>
          <ul className="space-y-2">
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Event-driven notification architecture</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>SendGrid email integration</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Twilio SMS integration</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Mock mode for local testing</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Database logging with RLS policies</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Support for Grading Service events</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Support for Document Management events</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

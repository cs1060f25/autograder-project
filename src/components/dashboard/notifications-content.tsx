"use client";

import { useState, useEffect } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";
import { getUserNotifications, markNotificationAsRead, markAllAsRead } from "@/lib/notification-actions";
import { NotificationRecord } from "@/services/notifications/types";
import { formatDistanceToNow } from "@/lib/date-utils";

export function NotificationsContent() {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const result = await getUserNotifications(100); // Fetch more to account for duplicates
      if (result.success && result.data) {
        // Group notifications by event_type and created_at to remove duplicates
        const uniqueNotifications = result.data.reduce((acc: any[], notification: any) => {
          // Check if we already have a notification with same event_type within 1 second
          const isDuplicate = acc.some(n => 
            n.event_type === notification.event_type &&
            Math.abs(new Date(n.created_at).getTime() - new Date(notification.created_at).getTime()) < 1000
          );
          
          if (!isDuplicate) {
            acc.push(notification);
          }
          return acc;
        }, []);
        
        setNotifications(uniqueNotifications.slice(0, 50)); // Take first 50 unique
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    await markNotificationAsRead(notificationId);
    await loadNotifications();
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    await loadNotifications();
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "submission_graded":
        return "📝";
      case "grade_updated":
        return "📊";
      case "feedback_available":
        return "💬";
      case "document_uploaded":
        return "📄";
      case "assignment_published":
        return "📢";
      case "assignment_due_soon":
        return "⏰";
      default:
        return "🔔";
    }
  };

  const getEventTitle = (eventType: string) => {
    switch (eventType) {
      case "submission_graded":
        return "Submission Graded";
      case "grade_updated":
        return "Grade Updated";
      case "feedback_available":
        return "New Feedback";
      case "document_uploaded":
        return "Document Uploaded";
      case "assignment_published":
        return "New Assignment";
      case "assignment_due_soon":
        return "Assignment Due Soon";
      default:
        return "Notification";
    }
  };

  const getMessageContent = (message: string) => {
    try {
      const parsed = JSON.parse(message);
      return {
        subject: parsed.subject || "",
        body: parsed.body || "",
      };
    } catch {
      return {
        subject: "",
        body: message,
      };
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") {
      return !n.read_at;
    }
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Actions Bar */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === "unread"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {filter === "unread" ? "No unread notifications" : "No notifications yet"}
          </h3>
          <p className="text-gray-600">
            {filter === "unread"
              ? "You're all caught up!"
              : "Notifications will appear here when you receive them"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => {
            const content = getMessageContent(notification.message);
            return (
              <div
                key={notification.id}
                className={`bg-white rounded-lg shadow p-6 transition hover:shadow-md ${
                  !notification.read_at ? "border-l-4 border-blue-500" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <span className="text-3xl flex-shrink-0">
                      {getEventIcon(notification.event_type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {getEventTitle(notification.event_type)}
                        </h3>
                        {notification.status === "mock" && (
                          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                            Mock Mode
                          </span>
                        )}
                      </div>
                      {content.subject && (
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          {content.subject}
                        </p>
                      )}
                      <div
                        className="text-sm text-gray-600 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: content.body }}
                      />
                      <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                        <span>
                          {formatDistanceToNow(new Date(notification.created_at))}
                        </span>
                      </div>
                    </div>
                  </div>
                  {!notification.read_at && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="ml-4 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition flex-shrink-0"
                      title="Mark as read"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


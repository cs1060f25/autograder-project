"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { getUserNotifications, getUnreadCount, markNotificationAsRead, markAllAsRead } from "@/lib/notification-actions";
import { NotificationRecord } from "@/services/notifications/types";
import { formatDistanceToNow } from "@/lib/date-utils";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Load notifications and unread count
  const loadNotifications = async () => {
    setLoading(true);
    try {
      const [notifResult, countResult] = await Promise.all([
        getUserNotifications(10),
        getUnreadCount(),
      ]);

      if (notifResult.success && notifResult.data) {
        setNotifications(notifResult.data);
      }

      if (countResult.success && countResult.count !== undefined) {
        setUnreadCount(countResult.count);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load on mount
  useEffect(() => {
    loadNotifications();
  }, []);

  // Reload every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = async (notificationId: string) => {
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

  const getMessagePreview = (message: string) => {
    try {
      const parsed = JSON.parse(message);
      return parsed.subject || parsed.body?.substring(0, 100) || "New notification";
    } catch {
      return message.substring(0, 100);
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) loadNotifications();
        }}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Notification Panel */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="p-8 text-center text-gray-500">
                  Loading...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification.id)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition ${
                        !notification.read_at ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl flex-shrink-0">
                          {getEventIcon(notification.event_type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-gray-900">
                              {getEventTitle(notification.event_type)}
                            </p>
                            {!notification.read_at && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {getMessagePreview(notification.message)}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDistanceToNow(new Date(notification.created_at))}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200">
                <a
                  href="/dashboard/notifications"
                  className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  View all notifications
                </a>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

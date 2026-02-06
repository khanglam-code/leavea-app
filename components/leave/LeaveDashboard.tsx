"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Plus, Clock, FileText, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LeaveForm } from "./LeaveForm";

export default function LeaveDashboard() {
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<"leave" | "late">("leave");

  // TODO: Get actual user ID from Auth
  const userId = "user_123"; 
  const requests = useQuery(api.leave.listByUser, { userId });

  if (showForm) {
    return <LeaveForm type={formType} onBack={() => setShowForm(false)} />;
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 p-4 font-sans text-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pt-2">
        <div>
          <h1 className="text-2xl font-bold">Xin Nghỉ Phép</h1>
          <p className="text-sm text-gray-500">Nexus Internal App</p>
        </div>
        <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
          👤
        </div>
      </div>

      {/* Stats Cards (Bento) */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="p-4 bg-white border-none shadow-sm rounded-2xl">
          <div className="text-sm text-gray-500 mb-1">Phép năm</div>
          <div className="text-3xl font-bold text-gray-900">12</div>
          <div className="text-xs text-gray-400">Ngày còn lại</div>
        </Card>
        <Card className="p-4 bg-white border-none shadow-sm rounded-2xl">
          <div className="text-sm text-gray-500 mb-1">Nghỉ ốm</div>
          <div className="text-3xl font-bold text-gray-900">2</div>
          <div className="text-xs text-gray-400">Ngày đã dùng</div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <button 
          onClick={() => { setFormType("leave"); setShowForm(true); }}
          className="flex flex-col items-center justify-center p-6 bg-blue-600 text-white rounded-2xl shadow-lg hover:bg-blue-700 transition active:scale-95"
        >
          <Calendar className="w-8 h-8 mb-2" />
          <span className="font-semibold">Nghỉ Phép</span>
        </button>

        <button 
          onClick={() => { setFormType("late"); setShowForm(true); }}
          className="flex flex-col items-center justify-center p-6 bg-amber-500 text-white rounded-2xl shadow-lg hover:bg-amber-600 transition active:scale-95"
        >
          <Clock className="w-8 h-8 mb-2" />
          <span className="font-semibold">Đi Trễ</span>
        </button>
      </div>

      {/* Recent History */}
      <div>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-400" />
          Lịch sử gần đây
        </h2>
        
        <div className="space-y-3">
          {!requests ? (
            <p className="text-gray-400 text-center py-4">Đang tải...</p>
          ) : requests.length === 0 ? (
            <p className="text-gray-400 text-center py-4">Chưa có đơn nào.</p>
          ) : (
            requests.map((req) => (
              <div key={req._id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                <div>
                  <div className="font-semibold text-gray-800">
                    {req.category === "leave" ? "Nghỉ phép" : "Đi trễ/Về sớm"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {req.category === "leave" 
                      ? `${new Date(req.startDate!).toLocaleDateString()} - ${req.durationDays} ngày`
                      : `${new Date(req.targetDate!).toLocaleDateString()} @ ${req.targetTime}`
                    }
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  req.status === "approved" ? "bg-green-100 text-green-700" :
                  req.status === "rejected" ? "bg-red-100 text-red-700" :
                  "bg-yellow-100 text-yellow-700"
                }`}>
                  {req.status === "approved" ? "Đã duyệt" : req.status === "rejected" ? "Từ chối" : "Chờ duyệt"}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

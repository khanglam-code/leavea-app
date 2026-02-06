"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LeaveFormProps {
  type: "leave" | "late";
  onBack: () => void;
}

export function LeaveForm({ type, onBack }: LeaveFormProps) {
  const createRequest = useMutation(api.leave.create);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form State
  const [leaveType, setLeaveType] = useState("annual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [session, setSession] = useState("full");
  
  const [lateType, setLateType] = useState("late"); // late | early
  const [lateDate, setLateDate] = useState("");
  const [lateTime, setLateTime] = useState("");
  
  const [reason, setReason] = useState("");

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Mock User Data (Replace with Auth later)
      const userData = {
        userId: "user_123",
        userEmail: "khang@nexus.com",
        userName: "Khang",
      };

      if (type === "leave") {
        await createRequest({
          ...userData,
          category: "leave",
          type: leaveType,
          startDate: new Date(startDate).getTime(),
          endDate: new Date(endDate || startDate).getTime(),
          session: session as any,
          reason,
        });
      } else {
        await createRequest({
          ...userData,
          category: "late",
          type: lateType === "late" ? "Late Arrival" : "Early Departure",
          targetDate: new Date(lateDate).getTime(),
          targetTime: lateTime,
          reason,
        });
      }
      setSuccess(true);
      setTimeout(onBack, 1500); // Auto back after success
    } catch (error) {
      alert("Error: " + error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-6 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold text-gray-800">Thành công!</h2>
        <p className="text-gray-500">Đơn của bạn đã được gửi.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white font-sans">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-gray-100">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold">
          {type === "leave" ? "Xin Nghỉ Phép" : "Đi Trễ / Về Sớm"}
        </h1>
      </div>

      <div className="p-6 space-y-6">
        
        {/* LEAVE FORM */}
        {type === "leave" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại nghỉ</label>
              <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn loại nghỉ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual">Phép năm (Annual)</SelectItem>
                  <SelectItem value="sick">Nghỉ ốm (Sick)</SelectItem>
                  <SelectItem value="wfh">Làm tại nhà (WFH)</SelectItem>
                  <SelectItem value="unpaid">Không lương</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Từ ngày</label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Đến ngày</label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>

            {/* Session Toggle (Only if 1 day selected) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Thời gian</label>
              <div className="flex bg-gray-100 p-1 rounded-lg">
                {["full", "morning", "afternoon"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSession(s)}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
                      session === s ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {s === "full" ? "Cả ngày" : s === "morning" ? "Sáng" : "Chiều"}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* LATE FORM */}
        {type === "late" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại hình</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 border p-3 rounded-xl w-full cursor-pointer hover:border-blue-500 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                  <input type="radio" name="lateType" checked={lateType === "late"} onChange={() => setLateType("late")} className="accent-blue-600" />
                  <span className="font-medium">Đi Trễ</span>
                </label>
                <label className="flex items-center gap-2 border p-3 rounded-xl w-full cursor-pointer hover:border-blue-500 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                  <input type="radio" name="lateType" checked={lateType === "early"} onChange={() => setLateType("early")} className="accent-blue-600" />
                  <span className="font-medium">Về Sớm</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày</label>
                <Input type="date" value={lateDate} onChange={(e) => setLateDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {lateType === "late" ? "Giờ đến" : "Giờ về"}
                </label>
                <Input type="time" value={lateTime} onChange={(e) => setLateTime(e.target.value)} />
              </div>
            </div>

            {/* Quick Time Pills */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2 uppercase">Chọn nhanh</label>
              <div className="flex gap-2">
                {["30p", "1h", "1.5h", "2h"].map((t) => (
                  <button 
                    key={t} 
                    onClick={() => { /* TODO: Logic auto-fill time */ }}
                    className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600 hover:bg-gray-200"
                  >
                    +{t}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Lý do <span className="text-red-500">*</span></label>
          <Textarea 
            value={reason} 
            onChange={(e) => setReason(e.target.value)} 
            placeholder="Nhập lý do..." 
            className="min-h-[100px]" 
          />
        </div>

        {/* Submit Button */}
        <Button 
          onClick={handleSubmit} 
          disabled={loading || !reason}
          className="w-full py-6 text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-lg rounded-xl"
        >
          {loading ? "Đang gửi..." : "Gửi Đơn"}
        </Button>

      </div>
    </div>
  );
}

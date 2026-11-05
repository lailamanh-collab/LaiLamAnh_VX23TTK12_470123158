import { useEffect, useState } from "react"
import { dayLabel, dayOrder, myTechnicianProfile, type ScheduleDay } from "../api/branches"
import {
  completeRepair,
  fetchTechnicianDashboard,
  fetchTechnicianJobDetail,
  fetchTechnicianJobs,
  receiveJob,
  startInspection,
  startRepair,
  updateRepairInfo,
  type TechnicianDashboardData,
  type TechnicianJobDetail,
  type TechnicianJobSummary,
} from "../api/technicianJobs"
import { useAuth } from "../auth/AuthContext"
import { formatDateTimeVi } from "../utils/date"

const statusLabels: Record<string, string> = {
  Pending: "Chờ xác nhận",
  Confirmed: "Đã xác nhận",
  Assigned: "Đã phân công",
  OnTheWay: "Đang di chuyển",
  Received: "Đang di chuyển",
  Inspecting: "Đang kiểm tra",
  Repairing: "Đang sửa chữa",
  Completed: "Đã hoàn thành",
  Cancelled: "Đã hủy",
}

function getStatusBadge(status: string) {
  switch (status) {
    case "Confirmed":
      return <span className="badge badge-info">● {statusLabels[status] ?? status}</span>
    case "Assigned":
      return <span className="badge" style={{ background: "#e0e7ff", color: "#3730a3" }}>● {statusLabels[status] ?? status}</span>
    case "OnTheWay":
    case "Received":
      return <span className="badge badge-warning" style={{ background: "#fef3c7", color: "#92400e" }}>🛵 {statusLabels[status] ?? status}</span>
    case "Inspecting":
      return <span className="badge badge-fixed" style={{ background: "#e0e7ff", color: "#3730a3" }}>🔍 {statusLabels[status] ?? status}</span>
    case "Repairing":
      return <span className="badge badge-inspection" style={{ background: "#fed7aa", color: "#9a3412" }}>🛠️ {statusLabels[status] ?? status}</span>
    case "Completed":
      return <span className="badge badge-fixed" style={{ background: "#dcfce7", color: "#166534" }}>✓ {statusLabels[status] ?? status}</span>
    case "Cancelled":
      return <span className="badge" style={{ background: "#fee2e2", color: "#991b1b" }}>✕ {statusLabels[status] ?? status}</span>
    default:
      return <span className="badge badge-quiet">{statusLabels[status] ?? status}</span>
  }
}

const workflowSteps = [
  { key: "Pending", label: "Đặt lịch" },
  { key: "Confirmed", label: "Đã xác nhận" },
  { key: "Assigned", label: "Đã phân công" },
  { key: "OnTheWay", label: "Di chuyển" },
  { key: "Inspecting", label: "Khảo sát" },
  { key: "Repairing", label: "Sửa chữa" },
  { key: "Completed", label: "Hoàn thành" },
]

export function TechnicianHomePage() {
  const { token, user } = useAuth()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Main Tabs: "jobs" | "completed" | "schedule"
  const [activeTab, setActiveTab] = useState<"jobs" | "completed" | "schedule">("jobs")

  // Dashboard Stats
  const [dashboard, setDashboard] = useState<TechnicianDashboardData | null>(null)

  // Jobs List
  const [jobs, setJobs] = useState<TechnicianJobSummary[]>([])
  const [loadingJobs, setLoadingJobs] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("All")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [errorMsg, setErrorMsg] = useState<string>("")
  const [successMsg, setSuccessMsg] = useState<string>("")

  // Schedule
  const [branchName, setBranchName] = useState<string>("")
  const [schedules, setSchedules] = useState<ScheduleDay[]>([])

  // Selected Job for Detail & Processing Modal
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null)
  const [jobDetail, setJobDetail] = useState<TechnicianJobDetail | null>(null)
  const [processing, setProcessing] = useState(false)

  // Action Form States
  const [receiveNote, setReceiveNote] = useState("")
  const [inspectionDiagnosis, setInspectionDiagnosis] = useState("")
  const [inspectionNotes, setInspectionNotes] = useState("")
  const [inspectionActualCost, setInspectionActualCost] = useState("")

  const [repairSolution, setRepairSolution] = useState("")
  const [repairNotes, setRepairNotes] = useState("")
  const [repairActualCost, setRepairActualCost] = useState("")
  const [progressUpdateNote, setProgressUpdateNote] = useState("")

  const [completionResult, setCompletionResult] = useState("")
  const [completionNotes, setCompletionNotes] = useState("")
  const [completionActualCost, setCompletionActualCost] = useState("")

  // Load Dashboard & Initial Jobs
  const reloadData = async () => {
    if (!token) return
    setErrorMsg("")
    try {
      const [dash, jobList] = await Promise.all([
        fetchTechnicianDashboard(token),
        fetchTechnicianJobs(token, {
          status: activeTab === "completed" ? "Completed" : statusFilter === "All" ? undefined : statusFilter,
          search: searchQuery || undefined,
        }),
      ])
      setDashboard(dash)
      setJobs(jobList)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Không tải được dữ liệu kỹ thuật viên.")
    }
  }

  useEffect(() => {
    if (!token) return
    setLoadingJobs(true)

    fetchTechnicianDashboard(token)
      .then((dash) => setDashboard(dash))
      .catch((err) => setErrorMsg(err instanceof Error ? err.message : "Lỗi tải dashboard."))

    // Also load technician schedule profile
    myTechnicianProfile(token)
      .then((profile) => {
        setBranchName(profile.branchName || "")
        setSchedules(profile.schedules || [])
      })
      .catch(() => {})
  }, [token])

  // Reload jobs when filter or active tab changes
  useEffect(() => {
    if (!token) return
    setLoadingJobs(true)
    const filterParam = activeTab === "completed" ? "Completed" : statusFilter === "All" ? undefined : statusFilter

    fetchTechnicianJobs(token, { status: filterParam, search: searchQuery || undefined })
      .then((data) => setJobs(data))
      .catch((err) => setErrorMsg(err instanceof Error ? err.message : "Không tải được danh sách việc."))
      .finally(() => setLoadingJobs(false))
  }, [token, statusFilter, activeTab])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setLoadingJobs(true)
    const filterParam = activeTab === "completed" ? "Completed" : statusFilter === "All" ? undefined : statusFilter

    fetchTechnicianJobs(token, { status: filterParam, search: searchQuery || undefined })
      .then((data) => setJobs(data))
      .catch((err) => setErrorMsg(err instanceof Error ? err.message : "Lỗi tìm kiếm."))
      .finally(() => setLoadingJobs(false))
  }

  // Open Job Detail Modal
  const handleOpenDetail = async (id: number) => {
    if (!token) return
    setSelectedJobId(id)
    setErrorMsg("")
    setSuccessMsg("")

    try {
      const detail = await fetchTechnicianJobDetail(token, id)
      setJobDetail(detail)
      // Initialize inputs based on existing values
      setReceiveNote("")
      setInspectionDiagnosis(detail.diagnosis || "")
      setInspectionNotes(detail.repairNotes || "")
      setInspectionActualCost(detail.actualCost !== null && detail.actualCost !== undefined ? String(detail.actualCost) : "")
      setRepairSolution(detail.repairSolution || "")
      setRepairNotes(detail.repairNotes || "")
      setRepairActualCost(detail.actualCost !== null && detail.actualCost !== undefined ? String(detail.actualCost) : "")
      setProgressUpdateNote("")
      setCompletionResult(detail.repairSolution || "")
      setCompletionNotes(detail.repairNotes || "")
      setCompletionActualCost(detail.actualCost !== null && detail.actualCost !== undefined ? String(detail.actualCost) : (detail.estimatedTotal > 0 ? String(detail.estimatedTotal) : ""))
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Không thể tải chi tiết ca sửa chữa.")
      setSelectedJobId(null)
    }
  }

  // ACTION 1: Receive Job (Confirmed -> Received)
  const handleReceivePhone = async () => {
    if (!token || !jobDetail) return
    setProcessing(true)
    setErrorMsg("")
    try {
      const updated = await receiveJob(token, jobDetail.id, receiveNote)
      setJobDetail(updated)
      setSuccessMsg(`Đã tiếp nhận ca sửa chữa ${updated.bookingCode} thành công. Trạng thái: Đã tiếp nhận tại nhà.`)
      await reloadData()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Không thể tiếp nhận yêu cầu.")
    } finally {
      setProcessing(false)
    }
  }

  // ACTION 2: Start Inspection (Received -> Inspecting)
  const handleStartInspection = async () => {
    if (!token || !jobDetail) return
    if (!inspectionDiagnosis.trim()) {
      setErrorMsg("Vui lòng nhập chẩn đoán tình trạng sự cố ban đầu.")
      return
    }
    setProcessing(true)
    setErrorMsg("")
    try {
      const cost = inspectionActualCost ? parseFloat(inspectionActualCost) : null
      const updated = await startInspection(token, jobDetail.id, {
        diagnosis: inspectionDiagnosis.trim(),
        repairNotes: inspectionNotes.trim() || undefined,
        actualCost: cost,
      })
      setJobDetail(updated)
      setSuccessMsg(`Đã chuyển sang trạng thái: Đang khảo sát & kiểm tra.`)
      await reloadData()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Không thể bắt đầu khảo sát.")
    } finally {
      setProcessing(false)
    }
  }

  // ACTION 3: Start Repair (Inspecting -> Repairing)
  const handleStartRepair = async () => {
    if (!token || !jobDetail) return
    setProcessing(true)
    setErrorMsg("")
    try {
      const cost = repairActualCost ? parseFloat(repairActualCost) : null
      const updated = await startRepair(token, jobDetail.id, {
        repairSolution: repairSolution.trim() || undefined,
        repairNotes: repairNotes.trim() || undefined,
        actualCost: cost,
      })
      setJobDetail(updated)
      setSuccessMsg(`Đã bắt đầu thi công sửa chữa cho ca ${updated.bookingCode}.`)
      await reloadData()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Không thể bắt đầu sửa chữa.")
    } finally {
      setProcessing(false)
    }
  }

  // ACTION 4: Update Technical Progress Info
  const handleUpdateProgress = async () => {
    if (!token || !jobDetail) return
    setProcessing(true)
    setErrorMsg("")
    try {
      const cost = repairActualCost ? parseFloat(repairActualCost) : null
      const updated = await updateRepairInfo(token, jobDetail.id, {
        diagnosis: inspectionDiagnosis.trim() || undefined,
        repairSolution: repairSolution.trim() || undefined,
        repairNotes: repairNotes.trim() || undefined,
        actualCost: cost,
        progressNote: progressUpdateNote.trim() || undefined,
      })
      setJobDetail(updated)
      setProgressUpdateNote("")
      setSuccessMsg(`Cập nhật tiến độ thành công!`)
      await reloadData()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Không thể cập nhật tiến độ.")
    } finally {
      setProcessing(false)
    }
  }

  // ACTION 5: Complete Repair (Repairing -> Completed)
  const handleCompleteRepair = async () => {
    if (!token || !jobDetail) return
    setProcessing(true)
    setErrorMsg("")
    try {
      const cost = completionActualCost ? parseFloat(completionActualCost) : null
      const updated = await completeRepair(token, jobDetail.id, {
        repairResult: completionResult.trim() || "Đã sửa hoàn tất, kiểm tra vận hành hệ thống ổn định.",
        repairNotes: completionNotes.trim() || undefined,
        actualCost: cost,
      })
      setJobDetail(updated)
      setSuccessMsg(`🎉 Chúc mừng! Đã hoàn thành sửa chữa ca ${updated.bookingCode}. Đã nghiệm thu và bàn giao cho khách tại nhà.`)
      await reloadData()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Không thể hoàn thành sửa chữa.")
    } finally {
      setProcessing(false)
    }
  }

  const formatMoney = (val?: number | null) => {
    if (val === undefined || val === null) return "Chưa xác định"
    return `${new Intl.NumberFormat("vi-VN").format(val)} đ`
  }

  return (
    <main className="page">
      {/* HEADER SECTION */}
      <section className="hero" style={{ paddingBottom: "24px" }}>
        <div>
          <span className="eyebrow">Trạm kỹ thuật viên</span>
          <h1>Bàn làm việc Kỹ thuật</h1>
          <p className="lede">
            Kỹ thuật viên: <strong>{user?.fullName || dashboard?.technicianName || "Chưa có tên"}</strong> · Khu vực phục vụ: <strong>{branchName || dashboard?.branchName || "Toàn hệ thống"}</strong>
          </p>
        </div>
      </section>

      {/* NAVIGATION TABS */}
      <div style={{ display: "flex", gap: "10px", margin: "20px 0 16px", borderBottom: "2px solid var(--color-line)", paddingBottom: "8px", flexWrap: "wrap" }}>
        <button
          className={`btn ${activeTab === "jobs" ? "" : "btn-quiet"}`}
          type="button"
          onClick={() => {
            setActiveTab("jobs")
            setStatusFilter("All")
          }}
          style={{ padding: "8px 16px" }}
        >
          🔧 Bàn làm việc & Công việc ({dashboard?.totalActiveJobs ?? 0})
        </button>
        <button
          className={`btn ${activeTab === "completed" ? "" : "btn-quiet"}`}
          type="button"
          onClick={() => {
            setActiveTab("completed")
            setStatusFilter("Completed")
          }}
          style={{ padding: "8px 16px" }}
        >
          ✅ Ca đã nghiệm thu ({dashboard?.completedJobs ?? 0})
        </button>
        <button
          className={`btn ${activeTab === "schedule" ? "" : "btn-quiet"}`}
          type="button"
          onClick={() => setActiveTab("schedule")}
          style={{ padding: "8px 16px" }}
        >
          📅 Lịch làm việc tuần
        </button>
      </div>

      {errorMsg ? <p className="form-error" style={{ margin: "12px 0" }}>{errorMsg}</p> : null}
      {successMsg ? <p className="form-success" style={{ margin: "12px 0" }}>{successMsg}</p> : null}

      {/* TAB 1: WORKSTATION & ACTIVE JOBS */}
      {activeTab === "jobs" ? (
        <>
          {/* DASHBOARD METRIC CARDS (44.2) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "12px",
              marginBottom: "24px",
            }}
          >
            {/* Jobs Today */}
            <div
              className="card"
              onClick={() => setStatusFilter("Today")}
              style={{
                cursor: "pointer",
                padding: "14px",
                border: statusFilter === "Today" ? "2px solid var(--color-accent)" : "1px solid var(--color-line)",
                background: statusFilter === "Today" ? "var(--color-accent-soft)" : "white",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ fontSize: "0.8rem", color: "var(--color-muted)", fontWeight: 600 }}>HÔM NAY</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--color-ink)", margin: "4px 0" }}>
                {dashboard?.jobsToday ?? 0}
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--color-muted)" }}>Lịch hẹn hôm nay</div>
            </div>

            {/* Need Receive: Assigned or Confirmed */}
            <div
              className="card"
              onClick={() => setStatusFilter("Assigned")}
              style={{
                cursor: "pointer",
                padding: "14px",
                border: statusFilter === "Assigned" || statusFilter === "Confirmed" ? "2px solid #0284c7" : "1px solid var(--color-line)",
                background: statusFilter === "Assigned" || statusFilter === "Confirmed" ? "#f0f9ff" : "white",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ fontSize: "0.8rem", color: "#0284c7", fontWeight: 600 }}>CHỜ TIẾP NHẬN</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0369a1", margin: "4px 0" }}>
                {(dashboard?.assignedJobs ?? 0) + (dashboard?.confirmedJobs ?? 0)}
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--color-muted)" }}>Lịch hẹn mới được giao</div>
            </div>

            {/* OnTheWay / Received */}
            <div
              className="card"
              onClick={() => setStatusFilter("OnTheWay")}
              style={{
                cursor: "pointer",
                padding: "14px",
                border: statusFilter === "OnTheWay" || statusFilter === "Received" ? "2px solid #d97706" : "1px solid var(--color-line)",
                background: statusFilter === "OnTheWay" || statusFilter === "Received" ? "#fefce8" : "white",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ fontSize: "0.8rem", color: "#d97706", fontWeight: 600 }}>ĐANG DI CHUYỂN</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#b45309", margin: "4px 0" }}>
                {(dashboard?.onTheWayJobs ?? 0) + (dashboard?.receivedJobs ?? 0)}
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--color-muted)" }}>Đang đến nhà khách</div>
            </div>

            {/* Inspecting */}
            <div
              className="card"
              onClick={() => setStatusFilter("Inspecting")}
              style={{
                cursor: "pointer",
                padding: "14px",
                border: statusFilter === "Inspecting" ? "2px solid #6366f1" : "1px solid var(--color-line)",
                background: statusFilter === "Inspecting" ? "#eef2ff" : "white",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ fontSize: "0.8rem", color: "#6366f1", fontWeight: 600 }}>ĐANG KHẢO SÁT</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#4f46e5", margin: "4px 0" }}>
                {dashboard?.inspectingJobs ?? 0}
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--color-muted)" }}>Chẩn đoán sự cố</div>
            </div>

            {/* Repairing */}
            <div
              className="card"
              onClick={() => setStatusFilter("Repairing")}
              style={{
                cursor: "pointer",
                padding: "14px",
                border: statusFilter === "Repairing" ? "2px solid #ea580c" : "1px solid var(--color-line)",
                background: statusFilter === "Repairing" ? "#fff7ed" : "white",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ fontSize: "0.8rem", color: "#ea580c", fontWeight: 600 }}>ĐANG THI CÔNG</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#c2410c", margin: "4px 0" }}>
                {dashboard?.repairingJobs ?? 0}
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--color-muted)" }}>Đang thi công sửa chữa</div>
            </div>

            {/* Completed */}
            <div
              className="card"
              onClick={() => setStatusFilter("Completed")}
              style={{
                cursor: "pointer",
                padding: "14px",
                border: statusFilter === "Completed" ? "2px solid #16a34a" : "1px solid var(--color-line)",
                background: statusFilter === "Completed" ? "#f0fdf4" : "white",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ fontSize: "0.8rem", color: "#16a34a", fontWeight: 600 }}>ĐÃ NGHIỆM THU</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#15803d", margin: "4px 0" }}>
                {dashboard?.completedJobs ?? 0}
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--color-muted)" }}>Hôm nay xong: {dashboard?.completedTodayJobs ?? 0}</div>
            </div>
          </div>

          {/* SEARCH & QUICK FILTERS BAR (44.3) */}
          <div className="card" style={{ marginBottom: "20px", padding: "16px" }}>
            <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
              <input
                className="input"
                type="search"
                placeholder="Tìm mã booking, tên khách, SĐT, thiết bị / dịch vụ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: 1, minWidth: isMobile ? "100%" : "240px" }}
              />
              <button className="btn" type="submit" style={{ padding: "8px 16px", width: isMobile ? "100%" : "auto" }}>
                Tìm kiếm
              </button>
              {searchQuery ? (
                <button
                  className="btn btn-quiet"
                  type="button"
                  onClick={() => {
                    setSearchQuery("")
                    setStatusFilter("All")
                  }}
                  style={{ padding: "8px 12px", width: isMobile ? "100%" : "auto" }}
                >
                  Xóa tìm
                </button>
              ) : null}
            </form>

            <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--color-muted)", alignSelf: "center", marginRight: "4px" }}>
                Lọc trạng thái:
              </span>
              {[
                { id: "All", label: "Tất cả công việc" },
                { id: "Today", label: "📅 Lịch hôm nay" },
                { id: "Assigned", label: "📥 Chờ tiếp nhận" },
                { id: "OnTheWay", label: "🛵 Đang di chuyển" },
                { id: "Inspecting", label: "🔍 Đang khảo sát" },
                { id: "Repairing", label: "⚙️ Đang thi công" },
                { id: "Completed", label: "✅ Đã nghiệm thu" },
              ].map((btn) => (
                <button
                  key={btn.id}
                  className={`btn ${statusFilter === btn.id ? "" : "btn-quiet"}`}
                  type="button"
                  onClick={() => setStatusFilter(btn.id)}
                  style={{
                    padding: "4px 10px",
                    fontSize: "0.85rem",
                    borderRadius: "20px",
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* JOBS LIST (44.3) */}
          <section>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h2>Danh sách ca sửa chữa ({jobs.length})</h2>
              <button
                className="btn btn-quiet"
                type="button"
                onClick={() => void reloadData()}
                style={{ padding: "4px 12px", fontSize: "0.85rem" }}
              >
                🔄 Làm mới
              </button>
            </div>

            {loadingJobs ? (
              <p className="card" style={{ textAlign: "center", padding: "30px", color: "var(--color-muted)" }}>
                Đang tải danh sách công việc...
              </p>
            ) : jobs.length === 0 ? (
              <div className="card" style={{ textAlign: "center", padding: "40px 20px" }}>
                <p style={{ fontSize: "1.2rem", fontWeight: 600, color: "var(--color-muted)", margin: 0 }}>
                  Không có ca sửa chữa nào phù hợp với bộ lọc hiện tại.
                </p>
                <p style={{ margin: "8px 0 0", color: "var(--color-muted)", fontSize: "0.9rem" }}>
                  Hãy chọn bộ lọc "Tất cả công việc" hoặc xóa từ khóa tìm kiếm.
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "14px" }}>
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="card"
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      justifyContent: "space-between",
                      alignItems: isMobile ? "flex-start" : "center",
                      gap: "16px",
                      padding: "16px 20px",
                      borderLeft: `5px solid ${
                        job.status === "Assigned" || job.status === "Confirmed"
                          ? "#0284c7"
                          : job.status === "OnTheWay" || job.status === "Received"
                          ? "#d97706"
                          : job.status === "Inspecting"
                          ? "#6366f1"
                          : job.status === "Repairing"
                          ? "#ea580c"
                          : job.status === "Completed"
                          ? "#16a34a"
                          : "#94a3b8"
                      }`,
                    }}
                  >
                    <div style={{ minWidth: isMobile ? "100%" : "220px", flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px", flexWrap: "wrap" }}>
                        <strong style={{ fontSize: "1.1rem", color: "var(--color-ink)" }}>{job.bookingCode}</strong>
                        {getStatusBadge(job.status)}
                      </div>
                      <p style={{ margin: "2px 0", fontSize: "1rem", fontWeight: 700, color: "var(--color-ink)" }}>
                        🛠️ {job.primaryServiceName || "Dịch vụ sửa chữa tại nhà"}{job.serviceCategoryName ? ` (${job.serviceCategoryName})` : ""}
                      </p>
                      <p style={{ margin: "2px 0", fontSize: "0.88rem", color: "var(--color-muted)", wordBreak: "break-word" }}>
                        👤 Khách hàng: <strong>{job.customerName}</strong>
                        {job.customerPhone ? (
                          <a href={`tel:${job.customerPhone}`} style={{ marginLeft: "8px", color: "var(--color-accent-strong)" }}>
                            📞 {job.customerPhone}
                          </a>
                        ) : null}
                      </p>
                      {job.fullAddress ? (
                        <p style={{ margin: "2px 0", fontSize: "0.85rem", color: "#475569", wordBreak: "break-word" }}>
                          📍 Địa chỉ: <strong>{job.fullAddress}</strong>
                        </p>
                      ) : null}
                      {job.problemDescription ? (
                        <p style={{ margin: "6px 0 0", fontSize: "0.85rem", color: "#475569", background: "#f8fafc", padding: "6px 10px", borderRadius: "8px", wordBreak: "break-word" }}>
                          ⚠️ Khách báo: <em>{job.problemDescription}</em>
                        </p>
                      ) : null}
                    </div>

                    <div style={{
                      width: isMobile ? "100%" : "auto",
                      minWidth: isMobile ? "100%" : "180px",
                      textAlign: isMobile ? "left" : "right",
                      borderTop: isMobile ? "1px solid var(--color-line)" : "none",
                      paddingTop: isMobile ? "12px" : 0,
                    }}>
                      <div style={{ display: isMobile ? "flex" : "block", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "6px" }}>
                        <div style={{ fontSize: "0.88rem", color: "var(--color-muted)" }}>
                          📅 Hẹn: <strong>{job.appointmentDate}</strong>
                        </div>
                        <div style={{ fontSize: "0.88rem", color: "var(--color-muted)" }}>
                          ⏰ Khung giờ: <strong>{job.slotStart} – {job.slotEnd}</strong>
                        </div>
                      </div>
                      <div style={{ marginBottom: "10px", display: isMobile ? "flex" : "block", justifyContent: isMobile ? "space-between" : "flex-end", alignItems: "center" }}>
                        <span style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>Chi phí ước tính: </span>
                        <strong style={{ fontSize: "1.1rem", color: job.actualCost ? "var(--color-ok)" : "var(--color-accent-strong)" }}>
                          {formatMoney(job.actualCost ?? job.estimatedTotal)}
                        </strong>
                      </div>
                      <button
                        className="btn"
                        type="button"
                        onClick={() => void handleOpenDetail(job.id)}
                        style={{ padding: "10px 16px", fontSize: "0.9rem", width: isMobile ? "100%" : "auto" }}
                      >
                        {job.status === "Assigned" || job.status === "Confirmed"
                          ? "🛵 Tiếp nhận & Di chuyển →"
                          : job.status === "OnTheWay" || job.status === "Received"
                          ? "🔍 Khảo sát sự cố →"
                          : job.status === "Inspecting"
                          ? "⚙️ Bắt đầu thi công →"
                          : job.status === "Repairing"
                          ? "🛠️ Cập nhật & Nghiệm thu →"
                          : "Xem chi tiết →"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}

      {/* TAB 2: COMPLETED HISTORY (44.11) */}
      {activeTab === "completed" ? (
        <section>
          <h2>Lịch sử các ca đã nghiệm thu ({jobs.length})</h2>
          <p className="section-intro">
            Tổng hợp toàn bộ các dịch vụ sửa chữa nhà cửa bạn đã hoàn thành và nghiệm thu thành công tại khu vực {branchName || dashboard?.branchName || "Toàn hệ thống"}.
          </p>

          <div style={{ marginTop: "16px", display: "grid", gap: "12px" }}>
            {jobs.length === 0 ? (
              <p className="card" style={{ textAlign: "center", padding: "30px", color: "var(--color-muted)" }}>
                Chưa có ca sửa chữa nào hoàn thành.
              </p>
            ) : (
              jobs.map((job) => (
                <div
                  key={job.id}
                  className="card"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: isMobile ? "flex-start" : "center",
                    flexDirection: isMobile ? "column" : "row",
                    gap: "12px",
                    padding: "16px 20px",
                    borderLeft: "5px solid #16a34a",
                  }}
                >
                  <div style={{ width: isMobile ? "100%" : "auto" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <strong>{job.bookingCode}</strong>
                      {getStatusBadge(job.status)}
                    </div>
                    <p style={{ margin: "4px 0", fontWeight: 700 }}>🛠️ {job.primaryServiceName || "Dịch vụ sửa chữa tại nhà"}{job.serviceCategoryName ? ` (${job.serviceCategoryName})` : ""}</p>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-muted)", wordBreak: "break-word" }}>
                      Khách hàng: {job.customerName} · Hoàn thành: {job.completedAt ? new Date(job.completedAt).toLocaleString("vi-VN") : "Đã nghiệm thu"}
                    </p>
                  </div>
                  <div style={{ textAlign: isMobile ? "left" : "right", width: isMobile ? "100%" : "auto", borderTop: isMobile ? "1px solid var(--color-line)" : "none", paddingTop: isMobile ? "8px" : 0 }}>
                    <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-ok)" }}>
                      {formatMoney(job.actualCost ?? job.estimatedTotal)}
                    </div>
                    <button
                      className="btn btn-quiet"
                      type="button"
                      onClick={() => void handleOpenDetail(job.id)}
                      style={{ marginTop: "6px", padding: "6px 12px", fontSize: "0.85rem", width: isMobile ? "100%" : "auto" }}
                    >
                      Xem chi tiết kết quả
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      ) : null}

      {/* TAB 3: SCHEDULE (44.10) */}
      {activeTab === "schedule" ? (
        <section>
          <h2>Lịch làm việc hàng tuần</h2>
          <p className="section-intro">
            Lịch phân công trực tại chi nhánh <strong>{branchName || dashboard?.branchName || "Chi nhánh"}</strong>.
          </p>
          <ul className="plain-list card" style={{ marginTop: "16px" }}>
            {dayOrder.map((day) => {
              const row = schedules.find((item) => item.dayOfWeek === day)
              return (
                <li
                  key={day}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "10px 0",
                    borderBottom: "1px solid var(--color-line)",
                  }}
                >
                  <strong>{dayLabel[day]}</strong>
                  <span>{row?.isWorking ? `⏰ ${row.startTime} – ${row.endTime}` : "💤 Nghỉ"}</span>
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}

      {/* JOB DETAIL & ACTION MODAL / WORKSPACE (44.4–44.9) */}
      {selectedJobId !== null && jobDetail ? (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.55)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !processing) setSelectedJobId(null)
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: "840px",
              width: "100%",
              maxHeight: "92vh",
              overflowY: "auto",
              padding: "24px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <span className="eyebrow">Xử lý ca sửa chữa</span>
                <h2 style={{ margin: "2px 0 0" }}>{jobDetail.bookingCode}</h2>
                <p style={{ margin: "4px 0 0", color: "var(--color-muted)", fontSize: "1rem" }}>
                  Dịch vụ: <strong>{jobDetail.primaryServiceName || "Dịch vụ sửa chữa tại nhà"}{jobDetail.serviceCategoryName ? ` (${jobDetail.serviceCategoryName})` : ""}</strong>
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {getStatusBadge(jobDetail.status)}
                <button
                  className="btn btn-quiet"
                  type="button"
                  disabled={processing}
                  onClick={() => setSelectedJobId(null)}
                  style={{ padding: "4px 10px" }}
                >
                  ✕ Đóng
                </button>
              </div>
            </div>

            {/* Customer & Appointment Info Banner */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: "14px",
                background: "#f8fafc",
                padding: "14px 16px",
                borderRadius: "12px",
                border: "1px solid var(--color-line)",
                marginBottom: "16px",
              }}
            >
              <div>
                <strong>👤 Khách hàng</strong>
                <p style={{ margin: "4px 0" }}>{jobDetail.customerName}</p>
                <p style={{ margin: 0, color: "var(--color-muted)", fontSize: "0.85rem", wordBreak: "break-word" }}>
                  SĐT:{" "}
                  {jobDetail.customerPhone ? (
                    <a href={`tel:${jobDetail.customerPhone}`} style={{ color: "var(--color-accent-strong)" }}>
                      {jobDetail.customerPhone}
                    </a>
                  ) : (
                    "Chưa cung cấp"
                  )}{" "}
                  · Email: {jobDetail.customerEmail}
                </p>
              </div>
              <div>
                <strong>📍 Lịch hẹn & Địa chỉ sửa chữa tại nhà</strong>
                <p style={{ margin: "4px 0" }}>
                  {jobDetail.appointmentDate} ({jobDetail.slotStart} – {jobDetail.slotEnd})
                </p>
                <p style={{ margin: 0, color: "var(--color-ink)", fontSize: "0.85rem", wordBreak: "break-word" }}>
                  🏠 <strong>Địa chỉ:</strong> {jobDetail.fullAddress || jobDetail.addressLine || jobDetail.branchAddress || jobDetail.branchName}
                </p>
              </div>
            </div>

            {/* REPAIR WORKFLOW TIMELINE */}
            <div className="timeline-stepper" style={{ margin: "16px 0 20px", overflowX: isMobile ? "auto" : "visible", paddingBottom: isMobile ? "8px" : 0 }}>
              {workflowSteps.map((step, idx) => {
                const normalizedStatus = jobDetail.status === "Received" ? "OnTheWay" : jobDetail.status
                const currentIdx = workflowSteps.findIndex((s) => s.key === normalizedStatus)
                const isDone = currentIdx > idx
                const isActive = currentIdx === idx
                return (
                  <div
                    key={step.key}
                    className={`timeline-node ${isActive ? "timeline-node-active" : ""} ${isDone ? "timeline-node-done" : ""}`}
                  >
                    <div className="timeline-node-num">{isDone ? "✓" : idx + 1}</div>
                    <div className="timeline-node-label">{step.label}</div>
                  </div>
                )
              })}
            </div>

            {/* SPLIT LAYOUT: LEFT = SPECS & DIAGNOSIS; RIGHT = ACTION WORKBENCH */}
            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: "flex-start", gap: "20px" }}>
              {/* LEFT COLUMN: REQUESTED SERVICES & NOTES */}
              <div style={{ flex: 1, width: isMobile ? "100%" : "auto" }}>
                {/* Services list */}
                <div className="card" style={{ padding: "16px", marginBottom: "16px" }}>
                  <strong style={{ fontSize: "0.95rem" }}>Dịch vụ sửa chữa yêu cầu</strong>
                  <ul className="plain-list" style={{ marginTop: "10px" }}>
                    {jobDetail.services.map((s) => (
                      <li
                        key={s.repairServiceId}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "6px 0",
                          borderBottom: "1px solid var(--color-line)",
                          fontSize: "0.9rem",
                        }}
                      >
                        <div>
                          <span>{s.serviceName}</span>
                          <span
                            className={s.pricingType === "FixedPrice" ? "badge badge-fixed" : "badge badge-inspection"}
                            style={{ marginLeft: "6px", fontSize: "0.75rem", padding: "2px 6px" }}
                          >
                            {s.pricingType === "FixedPrice" ? "Giá cố định" : "Cần kiểm tra"}
                          </span>
                        </div>
                        <strong>{s.unitPrice !== null && s.unitPrice !== undefined ? formatMoney(s.unitPrice) : "Kiểm tra"}</strong>
                      </li>
                    ))}
                  </ul>

                  <div style={{ marginTop: "12px", display: "flex", justifyContent: "space-between", fontSize: "0.95rem" }}>
                    <span>Tổng tạm tính:</span>
                    <strong style={{ color: "var(--color-accent-strong)" }}>{formatMoney(jobDetail.estimatedTotal)}</strong>
                  </div>

                  {jobDetail.actualCost !== null && jobDetail.actualCost !== undefined ? (
                    <div style={{ marginTop: "6px", display: "flex", justifyContent: "space-between", color: "var(--color-ok)", fontSize: "1rem" }}>
                      <strong>Chi phí thực tế:</strong>
                      <strong>{formatMoney(jobDetail.actualCost)}</strong>
                    </div>
                  ) : null}
                </div>

                {/* Problem description from customer */}
                <div className="card" style={{ padding: "16px", marginBottom: "16px" }}>
                  <strong>Mô tả của khách hàng:</strong>
                  <p style={{ margin: "6px 0 0", color: "#334155", background: "#f8fafc", padding: "10px", borderRadius: "8px", fontSize: "0.9rem", wordBreak: "break-word" }}>
                    {jobDetail.problemDescription || "Không có mô tả chi tiết."}
                  </p>
                </div>

                {/* Existing diagnosis & solution */}
                {jobDetail.diagnosis || jobDetail.repairSolution ? (
                  <div className="card" style={{ padding: "16px", marginBottom: "16px", background: "#f5f3ff", borderColor: "#ddd6fe" }}>
                    {jobDetail.diagnosis ? (
                      <div style={{ marginBottom: "10px" }}>
                        <strong style={{ color: "#6b21a8" }}>Chẩn đoán tình trạng:</strong>
                        <p style={{ margin: "4px 0 0", color: "#4c1d95", fontSize: "0.9rem", wordBreak: "break-word" }}>{jobDetail.diagnosis}</p>
                      </div>
                    ) : null}
                    {jobDetail.repairSolution ? (
                      <div>
                        <strong style={{ color: "#6b21a8" }}>Giải pháp & Vật tư:</strong>
                        <p style={{ margin: "4px 0 0", color: "#4c1d95", fontSize: "0.9rem", wordBreak: "break-word" }}>{jobDetail.repairSolution}</p>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {/* Status history log */}
                <div className="card" style={{ padding: "16px" }}>
                  <strong style={{ fontSize: "0.95rem" }}>Lịch sử tiến trình</strong>
                  <div className="history-feed" style={{ marginTop: "10px" }}>
                    {jobDetail.timeline.map((item, idx) => (
                      <div key={idx} className="history-item">
                        <div className="history-dot" />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "4px" }}>
                            <strong style={{ fontSize: "0.88rem" }}>{statusLabels[item.toStatus] ?? item.toStatus}</strong>
                            <span className="muted" style={{ fontSize: "0.78rem" }}>
                              {formatDateTimeVi(item.changedAt)}
                            </span>
                          </div>
                          {item.note ? <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "var(--color-muted)", wordBreak: "break-word" }}>{item.note}</p> : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: ACTION WORKBENCH (44.5 - 44.9) */}
              <div style={{ flex: 1, width: isMobile ? "100%" : "auto" }}>
                {/* 1. STATE: ASSIGNED / CONFIRMED -> START TRAVEL / RECEIVE (44.5) */}
                {(jobDetail.status === "Assigned" || jobDetail.status === "Confirmed") ? (
                  <div className="card" style={{ background: "#f0f9ff", borderColor: "#bae6fd", padding: "20px" }}>
                    <h3 style={{ margin: "0 0 8px", color: "#0369a1" }}>1. Tiếp nhận và bắt đầu di chuyển đến nhà khách (44.5)</h3>
                    <p style={{ margin: "0 0 14px", fontSize: "0.88rem", color: "#0c4a6e" }}>
                      Kỹ thuật viên đã nhận ca sửa này. Bấm nút bên dưới để xác nhận tiếp nhận và bắt đầu di chuyển đến địa chỉ nhà khách hàng.
                    </p>
                    <label className="field">
                      <span>Ghi chú di chuyển / liên hệ (tùy chọn)</span>
                      <textarea
                        className="input"
                        rows={3}
                        placeholder="Ví dụ: Đã gọi điện cho khách, đang xuất phát từ trạm kỹ thuật, dự kiến 20 phút có mặt..."
                        value={receiveNote}
                        onChange={(e) => setReceiveNote(e.target.value)}
                      />
                    </label>
                    <button
                      className="btn"
                      type="button"
                      disabled={processing}
                      onClick={() => void handleReceivePhone()}
                      style={{ width: "100%", marginTop: "12px", background: "#0284c7" }}
                    >
                      {processing ? "Đang xử lý..." : "🛵 Bắt đầu di chuyển đến nhà khách (Assigned → OnTheWay)"}
                    </button>
                  </div>
                ) : null}

                {/* 2. STATE: ONTHEWAY / RECEIVED -> START INSPECTION (44.6) */}
                {(jobDetail.status === "OnTheWay" || jobDetail.status === "Received") ? (
                  <div className="card" style={{ background: "#fefce8", borderColor: "#fde047", padding: "20px" }}>
                    <h3 style={{ margin: "0 0 8px", color: "#854d0e" }}>2. Đã đến nơi & Bắt đầu khảo sát hiện trường (44.6)</h3>
                    <p style={{ margin: "0 0 14px", fontSize: "0.88rem", color: "#713f12" }}>
                      Kỹ thuật viên đã có mặt tại nhà khách hàng. Thực hiện kiểm tra hiện trường, chẩn đoán nguyên nhân sự cố và cập nhật chi phí khảo sát.
                    </p>
                    <label className="field">
                      <span>Chẩn đoán nguyên nhân & Tình trạng hư hỏng *</span>
                      <textarea
                        className="input"
                        rows={3}
                        placeholder="Ví dụ: Rò rỉ van nước âm tường tại phòng tắm, cần thay cút nối và quấn băng tan chống rò rỉ..."
                        value={inspectionDiagnosis}
                        onChange={(e) => setInspectionDiagnosis(e.target.value)}
                        required
                      />
                    </label>
                    <label className="field" style={{ marginTop: "10px" }}>
                      <span>Ghi chú kỹ thuật</span>
                      <input
                        className="input"
                        type="text"
                        placeholder="Ghi chú về thiết bị, vật tư thay thế hoặc biện pháp thi công an toàn..."
                        value={inspectionNotes}
                        onChange={(e) => setInspectionNotes(e.target.value)}
                      />
                    </label>
                    <label className="field" style={{ marginTop: "10px" }}>
                      <span>Chi phí thực tế ước tính (nếu chốt giá sau khảo sát)</span>
                      <input
                        className="input"
                        type="number"
                        placeholder="Nhập số tiền VNĐ..."
                        value={inspectionActualCost}
                        onChange={(e) => setInspectionActualCost(e.target.value)}
                      />
                    </label>
                    <button
                      className="btn"
                      type="button"
                      disabled={processing}
                      onClick={() => void handleStartInspection()}
                      style={{ width: "100%", marginTop: "16px", background: "#ca8a04" }}
                    >
                      {processing ? "Đang lưu..." : "🔍 Xác nhận khảo sát xong (OnTheWay → Inspecting)"}
                    </button>
                  </div>
                ) : null}

                {/* 3. STATE: INSPECTING -> START REPAIR (44.7 & 44.8) */}
                {jobDetail.status === "Inspecting" ? (
                  <div className="card" style={{ background: "#eef2ff", borderColor: "#c7d2fe", padding: "20px" }}>
                    <h3 style={{ margin: "0 0 8px", color: "#3730a3" }}>3. Tiến hành thi công sửa chữa (44.7)</h3>
                    <p style={{ margin: "0 0 14px", fontSize: "0.88rem", color: "#312e81" }}>
                      Sau khi khảo sát và khách hàng chốt phương án, tiến hành thi công sửa chữa hoặc thay thế vật tư thiết bị.
                    </p>
                    <label className="field">
                      <span>Giải pháp thi công / Vật tư thay thế</span>
                      <input
                        className="input"
                        type="text"
                        placeholder="Ví dụ: Thay lõi van đồng Tiền Phong phi 21, xử lý chống thấm cục bộ cổ ống..."
                        value={repairSolution}
                        onChange={(e) => setRepairSolution(e.target.value)}
                      />
                    </label>
                    <label className="field" style={{ marginTop: "10px" }}>
                      <span>Ghi chú kỹ thuật</span>
                      <input
                        className="input"
                        type="text"
                        placeholder="Ghi chú trong quá trình thi công hoặc lưu ý sử dụng..."
                        value={repairNotes}
                        onChange={(e) => setRepairNotes(e.target.value)}
                      />
                    </label>
                    <label className="field" style={{ marginTop: "10px" }}>
                      <span>Chi phí thực tế chính thức (VNĐ)</span>
                      <input
                        className="input"
                        type="number"
                        placeholder="Ví dụ: 850000"
                        value={repairActualCost}
                        onChange={(e) => setRepairActualCost(e.target.value)}
                      />
                    </label>

                    <button
                      className="btn"
                      type="button"
                      disabled={processing}
                      onClick={() => void handleStartRepair()}
                      style={{ width: "100%", marginTop: "16px", background: "#4f46e5" }}
                    >
                      {processing ? "Đang lưu..." : "⚙️ Bắt đầu thi công (Inspecting → Repairing)"}
                    </button>
                  </div>
                ) : null}

                {/* 4. STATE: REPAIRING -> UPDATE PROGRESS OR COMPLETE (44.8 & 44.9) */}
                {jobDetail.status === "Repairing" ? (
                  <div style={{ display: "grid", gap: "16px" }}>
                    {/* Progress Update Sub-card (44.8) */}
                    <div className="card" style={{ background: "#fff7ed", borderColor: "#fed7aa", padding: "16px" }}>
                      <h4 style={{ margin: "0 0 6px", color: "#9a3412" }}>Cập nhật tiến độ & Vật tư thi công (44.8)</h4>
                      <label className="field">
                        <span>Nhật ký tiến độ</span>
                        <input
                          className="input"
                          type="text"
                          placeholder="Ví dụ: Đã tháo dỡ phụ kiện cũ, đang hàn ống nhiệt PPR, test áp lực..."
                          value={progressUpdateNote}
                          onChange={(e) => setProgressUpdateNote(e.target.value)}
                        />
                      </label>
                      <button
                        className="btn btn-quiet"
                        type="button"
                        disabled={processing || !progressUpdateNote.trim()}
                        onClick={() => void handleUpdateProgress()}
                        style={{ marginTop: "8px", width: "100%" }}
                      >
                        Lưu nhật ký tiến độ
                      </button>
                    </div>

                    {/* Complete Repair Sub-card (44.9) */}
                    <div className="card" style={{ background: "#f0fdf4", borderColor: "#bbf7d0", padding: "20px" }}>
                      <h3 style={{ margin: "0 0 8px", color: "#166534" }}>4. Nghiệm thu & Bàn giao tại nhà (44.9)</h3>
                      <p style={{ margin: "0 0 14px", fontSize: "0.88rem", color: "#14532d" }}>
                        Công việc sửa chữa đã xong. Kỹ thuật viên cùng khách hàng nghiệm thu và kiểm tra vận hành hệ thống trước khi bàn giao.
                      </p>
                      <label className="field">
                        <span>Kết quả nghiệm thu kỹ thuật *</span>
                        <input
                          className="input"
                          type="text"
                          placeholder="Ví dụ: Hệ thống hoạt động ổn định, không rò rỉ, vệ sinh sạch sẽ hiện trường thi công"
                          value={completionResult}
                          onChange={(e) => setCompletionResult(e.target.value)}
                          required
                        />
                      </label>
                      <label className="field" style={{ marginTop: "10px" }}>
                        <span>Chi phí thực tế thanh toán (VNĐ) *</span>
                        <input
                          className="input"
                          type="number"
                          placeholder="Nhập số tiền khách thanh toán..."
                          value={completionActualCost}
                          onChange={(e) => setCompletionActualCost(e.target.value)}
                          required
                        />
                      </label>
                      <button
                        className="btn"
                        type="button"
                        disabled={processing}
                        onClick={() => void handleCompleteRepair()}
                        style={{ width: "100%", marginTop: "16px", background: "#16a34a" }}
                      >
                        {processing ? "Đang nghiệm thu..." : "🎉 Nghiệm thu & Bàn giao (Repairing → Completed)"}
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* 5. STATE: COMPLETED */}
                {jobDetail.status === "Completed" ? (
                  <div className="card" style={{ background: "#f0fdf4", borderColor: "#86efac", padding: "24px", textAlign: "center" }}>
                    <div style={{ fontSize: "40px", margin: "0 auto 10px" }}>🎉</div>
                    <h3 style={{ margin: "0 0 6px", color: "#166534" }}>Đã hoàn thành sửa chữa & Bàn giao</h3>
                    <p style={{ margin: "0 0 14px", fontSize: "0.9rem", color: "#14532d" }}>
                      Ca sửa chữa nhà cửa đã được nghiệm thu thành công và bàn giao cho khách hàng tại nhà.
                    </p>
                    <div style={{ background: "white", padding: "12px", borderRadius: "10px", border: "1px solid #bbf7d0", textAlign: "left", fontSize: "0.9rem" }}>
                      <p style={{ margin: "4px 0" }}>
                        <strong>Thời gian hoàn tất:</strong> {jobDetail.completedAt ? new Date(jobDetail.completedAt).toLocaleString("vi-VN") : "Đã nghiệm thu"}
                      </p>
                      <p style={{ margin: "4px 0" }}>
                        <strong>Kết quả nghiệm thu:</strong> {jobDetail.repairSolution || "Hoàn thành kiểm tra vận hành ổn định"}
                      </p>
                      <p style={{ margin: "4px 0", color: "var(--color-ok)", fontSize: "1.05rem" }}>
                        <strong>Tổng chi phí thực tế:</strong> {formatMoney(jobDetail.actualCost)}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}

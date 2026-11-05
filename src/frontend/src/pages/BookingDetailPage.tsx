import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { formatPrice } from "../api/catalog"
import { cancelBooking, myBooking, statusLabel, type BookingDetail } from "../api/bookings"
import { fetchBookingReview, submitReview, type ReviewItem } from "../api/reviews"
import { ApiError } from "../api/client"
import { useAuth } from "../auth/AuthContext"
import { formatDateTimeVi } from "../utils/date"

const workflowSteps = [
  { key: "Pending", num: "1", label: "Chờ xác nhận" },
  { key: "Confirmed", num: "2", label: "Đã xác nhận" },
  { key: "Assigned", num: "3", label: "Đã phân công" },
  { key: "OnTheWay", num: "4", label: "Đang di chuyển" },
  { key: "Inspecting", num: "5", label: "Đang kiểm tra" },
  { key: "Repairing", num: "6", label: "Đang sửa chữa" },
  { key: "Completed", num: "7", label: "Hoàn thành" },
]

export function BookingDetailPage() {
  const { id } = useParams()
  const { token } = useAuth()
  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [message, setMessage] = useState("")
  const [successMsg, setSuccessMsg] = useState("")
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [cancelling, setCancelling] = useState(false)

  // Review state (Section 43.12 & RULE 11)
  const [review, setReview] = useState<ReviewItem | null>(null)
  const [rating, setRating] = useState<number>(5)
  const [comment, setComment] = useState<string>("")
  const [isEditingReview, setIsEditingReview] = useState(false)
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewMsg, setReviewMsg] = useState("")

  useEffect(() => {
    if (!token || !id) return
    myBooking(token, Number(id))
      .then(setBooking)
      .catch(() => setMessage("Không tìm thấy thông tin lịch hẹn."))
  }, [token, id])

  useEffect(() => {
    if (!token || !booking || booking.status !== "Completed") return
    fetchBookingReview(token, booking.id)
      .then((r) => {
        if (r) {
          setReview(r)
          setRating(r.rating)
          setComment(r.comment || "")
        }
      })
      .catch(() => {})
  }, [token, booking?.id, booking?.status])

  async function handleConfirmCancel() {
    if (!token || !booking) return
    setCancelling(true)
    setMessage("")
    try {
      await cancelBooking(token, booking.id, cancelReason.trim() || "Khách hủy lịch.")
      const refreshed = await myBooking(token, booking.id)
      setBooking(refreshed)
      setShowCancelModal(false)
      setCancelReason("")
      setSuccessMsg("Đã hủy lịch hẹn thành công.")
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "Không hủy được lịch hẹn.")
    } finally {
      setCancelling(false)
    }
  }

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault()
    if (!token || !booking) return
    setSubmittingReview(true)
    setReviewMsg("")
    try {
      const res = await submitReview(token, booking.id, { rating, comment: comment.trim() || undefined })
      setReview(res)
      setIsEditingReview(false)
      setReviewMsg("Cảm ơn bạn đã gửi đánh giá dịch vụ!")
    } catch (err) {
      setReviewMsg(err instanceof Error ? err.message : "Không gửi được đánh giá.")
    } finally {
      setSubmittingReview(false)
    }
  }

  function getStatusBadgeClass(status: string) {
    switch (status) {
      case "Pending":
        return "badge badge-pending"
      case "Confirmed":
        return "badge badge-confirmed"
      case "Received":
        return "badge badge-received"
      case "Inspecting":
        return "badge badge-inspecting"
      case "Repairing":
        return "badge badge-repairing"
      case "Completed":
        return "badge badge-completed"
      case "Cancelled":
        return "badge badge-cancelled"
      default:
        return "badge"
    }
  }

  if (!booking) {
    return (
      <main className="page narrow">
        <p>{message || "Đang tải thông tin lịch hẹn..."}</p>
        <p><Link className="text-link" to="/my-bookings">← Quay lại danh sách lịch</Link></p>
      </main>
    )
  }

  const isCancelled = booking.status === "Cancelled"
  const currentStepIndex = workflowSteps.findIndex((s) => s.key === booking.status || (booking.status === "Received" && s.key === "OnTheWay"))
  const canCancel = booking.status === "Pending" || booking.status === "Confirmed" || booking.status === "Assigned"

  return (
    <main className="page">
      <div style={{ marginBottom: "16px" }}>
        <Link className="text-link" to="/my-bookings">
          ← Quay lại danh sách lịch
        </Link>
      </div>

      <section className="section-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <span className="eyebrow">Chi tiết lịch hẹn</span>
          <h1 style={{ margin: "4px 0" }}>{booking.bookingCode}</h1>
          <p style={{ margin: "4px 0 0", color: "var(--color-muted)", fontSize: "1.1rem" }}>
            Dịch vụ: <strong>{booking.primaryServiceName || "Dịch vụ sửa chữa tại nhà"}</strong>
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <span className={getStatusBadgeClass(booking.status)} style={{ fontSize: "1rem", padding: "6px 14px" }}>
            ● {statusLabel[booking.status] ?? booking.status}
          </span>
          {canCancel && !showCancelModal ? (
            <button
              className="btn btn-quiet"
              type="button"
              onClick={() => setShowCancelModal(true)}
              style={{ color: "var(--color-danger)", borderColor: "#fca5a5" }}
            >
              Hủy lịch hẹn
            </button>
          ) : null}
        </div>
      </section>

      {successMsg ? <p className="form-success" style={{ margin: "12px 0" }}>{successMsg}</p> : null}
      {message ? <p className="form-error" style={{ margin: "12px 0" }}>{message}</p> : null}

      {/* Cancel Confirmation Box */}
      {showCancelModal ? (
        <div className="card" style={{ background: "#fff1f2", borderColor: "#fecdd3", margin: "16px 0", padding: "20px" }}>
          <h3 style={{ margin: "0 0 8px", color: "var(--color-danger)" }}>Xác nhận hủy lịch hẹn</h3>
          <p style={{ margin: "0 0 12px", fontSize: "0.9rem" }}>
            Sau khi hủy, khung giờ này sẽ được giải phóng cho người khác đặt. Bạn có chắc chắn muốn hủy lịch hẹn <strong>{booking.bookingCode}</strong>?
          </p>
          <label className="field">
            <span>Lý do hủy (tùy chọn)</span>
            <input
              className="input"
              type="text"
              placeholder="Ví dụ: Bận việc đột xuất, đã tự khắc phục được sự cố,..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </label>
          <div style={{ marginTop: "12px", display: "flex", gap: "10px" }}>
            <button
              className="btn"
              type="button"
              disabled={cancelling}
              onClick={() => void handleConfirmCancel()}
              style={{ background: "var(--color-danger)" }}
            >
              {cancelling ? "Đang hủy..." : "Xác nhận hủy lịch"}
            </button>
            <button
              className="btn btn-quiet"
              type="button"
              disabled={cancelling}
              onClick={() => setShowCancelModal(false)}
            >
              Đóng
            </button>
          </div>
        </div>
      ) : null}

      {/* REPAIR TRACKING TIMELINE (43.9) */}
      <section className="card" style={{ margin: "24px 0" }}>
        <h2>Tiến trình sửa chữa</h2>
        <p className="section-intro">Quy trình thợ đến nhà và xử lý sự cố theo thời gian thực:</p>

        {isCancelled ? (
          <div style={{ padding: "16px", background: "#fef2f2", borderRadius: "12px", border: "1px solid #fecaca", margin: "16px 0" }}>
            <strong style={{ color: "var(--color-danger)" }}>Lịch hẹn này đã bị hủy.</strong>
          </div>
        ) : (
          <div className="timeline-stepper">
            {workflowSteps.map((stepItem, index) => {
              let nodeClass = "timeline-node"
              if (index === currentStepIndex) nodeClass += " timeline-node-active"
              else if (index < currentStepIndex) nodeClass += " timeline-node-done"
              return (
                <div key={stepItem.key} className={nodeClass}>
                  <div className="timeline-node-num">
                    {index < currentStepIndex ? "✓" : stepItem.num}
                  </div>
                  <span className="timeline-node-label">{stepItem.label}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* Status History Logs */}
        <h3 style={{ margin: "24px 0 12px", fontSize: "1rem" }}>Nhật ký trạng thái</h3>
        <div className="history-feed">
          {booking.timeline.length === 0 ? (
            <p className="muted">Chưa có lịch sử cập nhật.</p>
          ) : (
            booking.timeline.map((item, idx) => (
              <div key={idx} className="history-item">
                <div className="history-dot" />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
                    <strong style={{ fontSize: "0.95rem" }}>
                      {statusLabel[item.toStatus] ?? item.toStatus}
                    </strong>
                    <span className="muted" style={{ fontSize: "0.82rem" }}>
                      {formatDateTimeVi(item.changedAt)}
                    </span>
                  </div>
                  {item.note ? (
                    <p style={{ margin: "4px 0 0", color: "var(--color-muted)", fontSize: "0.9rem" }}>
                      {item.note}
                    </p>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* TWO COLUMN DETAIL GRID */}
      <div className="split">
        {/* Left Column: Device & Services */}
        <section className="card">
          <h2>Dịch vụ sửa chữa</h2>
          <ul className="plain-list" style={{ marginTop: "14px" }}>
            {booking.services.map((service) => (
              <li
                key={service.repairServiceId}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 0",
                  borderBottom: "1px solid var(--color-line)",
                }}
              >
                <div>
                  <strong>{service.serviceName}</strong>
                  <span
                    className={service.pricingType === "FixedPrice" ? "badge badge-fixed" : "badge badge-inspection"}
                    style={{ marginLeft: "8px" }}
                  >
                    {service.pricingType === "FixedPrice" ? "Giá cố định" : "Cần kiểm tra"}
                  </span>
                </div>
                <strong style={{ color: "var(--color-accent-strong)" }}>
                  {formatPrice(service.pricingType, service.unitPrice)}
                </strong>
              </li>
            ))}
          </ul>

          <div style={{ marginTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Tổng chi phí tạm tính:</span>
            <strong style={{ fontSize: "1.2rem", color: "var(--color-accent-strong)" }}>
              {new Intl.NumberFormat("vi-VN").format(booking.estimatedTotal)} đ
            </strong>
          </div>

          {booking.actualCost !== null ? (
            <div style={{ marginTop: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--color-ok)" }}>
              <strong>Chi phí thực tế sau kiểm tra:</strong>
              <strong style={{ fontSize: "1.25rem" }}>
                {new Intl.NumberFormat("vi-VN").format(booking.actualCost)} đ
              </strong>
            </div>
          ) : null}

          <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--color-line)" }}>
            <strong>Mô tả lỗi từ khách hàng:</strong>
            <p style={{ margin: "6px 0 0", color: "var(--color-ink)", background: "#f8fafc", padding: "10px 14px", borderRadius: "10px" }}>
              {booking.problemDescription || "Không có mô tả."}
            </p>
          </div>

          {booking.diagnosis ? (
            <div style={{ marginTop: "16px" }}>
              <strong>Chẩn đoán từ kỹ thuật viên:</strong>
              <p style={{ margin: "6px 0 0", color: "var(--color-ink)", background: "#f3e8ff", padding: "10px 14px", borderRadius: "10px" }}>
                {booking.diagnosis}
              </p>
            </div>
          ) : null}

          {booking.repairSolution ? (
            <div style={{ marginTop: "16px" }}>
              <strong>Giải pháp & Vật tư thay thế:</strong>
              <p style={{ margin: "6px 0 0", color: "var(--color-ink)", background: "#f0fdf4", padding: "10px 14px", borderRadius: "10px" }}>
                {booking.repairSolution}
              </p>
            </div>
          ) : null}

          {booking.repairNotes ? (
            <div style={{ marginTop: "16px" }}>
              <strong>Ghi chú sửa chữa:</strong>
              <p style={{ margin: "6px 0 0", color: "var(--color-ink)", background: "#f8fafc", padding: "10px 14px", borderRadius: "10px" }}>
                {booking.repairNotes}
              </p>
            </div>
          ) : null}
        </section>

        {/* Right Column: Branch & Technician */}
        <section className="card">
          <h2>Thông tin phục vụ & Địa chỉ tại nhà</h2>

          <div style={{ marginTop: "16px" }}>
            <span className="muted">Khu vực phục vụ:</span>
            <p style={{ margin: "2px 0 0", fontSize: "1.1rem", fontWeight: 700 }}>
              {booking.serviceAreaName || booking.branchName}
            </p>
            <p style={{ margin: "4px 0", color: "var(--color-ink)", fontSize: "0.95rem" }}>
              📍 <strong>Địa chỉ sửa chữa:</strong> {booking.fullAddress || booking.addressLine || booking.branchAddress}
            </p>
          </div>

          <div style={{ marginTop: "16px" }}>
            <span className="muted">Thời gian kỹ thuật viên đến:</span>
            <p style={{ margin: "2px 0 0", fontSize: "1.1rem", fontWeight: 700 }}>
              Ngày {booking.appointmentDate}
            </p>
            <p style={{ margin: "4px 0", color: "var(--color-accent-strong)", fontWeight: 600 }}>
              ⏰ Khung giờ: {booking.slotStart} – {booking.slotEnd}
            </p>
          </div>

          <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--color-line)" }}>
            <span className="muted">Kỹ thuật viên phụ trách:</span>
            <p style={{ margin: "4px 0 0", fontWeight: 600 }}>
              {booking.technicianName ? `👨‍🔧 ${booking.technicianName}` : "Hệ thống sẽ phân công KTV khu vực"}
            </p>
          </div>

          <div className="next-steps-box" style={{ marginTop: "24px" }}>
            <h3>Lưu ý dành cho bạn:</h3>
            <ol>
              <li>Kỹ thuật viên sẽ liên hệ điện thoại trước khi đến nhà.</li>
              <li>Chi phí được khảo sát và thống nhất rõ ràng trước khi sửa chữa.</li>
              <li>Nghiệm thu chất lượng và nhận phiếu bảo hành điện tử 12 tháng.</li>
            </ol>
          </div>
        </section>
      </div>

      {/* CUSTOMER REVIEW SECTION (Section 43.12 & RULE 11) */}
      <section className="card" style={{ marginTop: "24px", padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <span className="eyebrow">Phản hồi khách hàng</span>
            <h2 style={{ margin: "2px 0 0" }}>Đánh giá chất lượng dịch vụ</h2>
          </div>
          {review && !isEditingReview && booking.status === "Completed" ? (
            <button
              className="btn btn-quiet"
              type="button"
              onClick={() => setIsEditingReview(true)}
              style={{ padding: "6px 14px", fontSize: "0.88rem" }}
            >
              ✏️ Chỉnh sửa đánh giá
            </button>
          ) : null}
        </div>

        {reviewMsg ? <p className="form-success" style={{ margin: "12px 0" }}>{reviewMsg}</p> : null}

        {booking.status === "Completed" ? (
          review && !isEditingReview ? (
            /* VIEW EXISTING REVIEW */
            <div style={{ marginTop: "16px", background: "#f8fafc", padding: "16px 20px", borderRadius: "14px", border: "1px solid var(--color-line)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ fontSize: "1.6rem", color: "#f59e0b", letterSpacing: "2px" }}>
                  {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                </div>
                <strong style={{ fontSize: "1.1rem" }}>{review.rating} / 5 sao</strong>
                <span className="muted" style={{ fontSize: "0.85rem", marginLeft: "auto" }}>
                  {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                  {review.updatedAt ? " (Đã chỉnh sửa)" : ""}
                </span>
              </div>
              <p style={{ margin: "12px 0 0", fontSize: "0.95rem", color: "var(--color-ink)", lineHeight: 1.6 }}>
                {review.comment ? `"${review.comment}"` : "Bạn không để lại nhận xét bằng lời."}
              </p>
              <p style={{ margin: "10px 0 0", fontSize: "0.82rem", color: "var(--color-muted)" }}>
                Kỹ thuật viên phụ trách: <strong>{booking.technicianName || "Đội ngũ kỹ thuật"}</strong> · Khu vực phục vụ: <strong>{booking.serviceAreaName || booking.branchName}</strong>
              </p>
            </div>
          ) : (
            /* SUBMIT / EDIT REVIEW FORM */
            <form onSubmit={handleSubmitReview} style={{ marginTop: "16px" }}>
              <p style={{ margin: "0 0 12px", color: "var(--color-muted)", fontSize: "0.95rem" }}>
                Đánh giá của bạn giúp chúng tôi nâng cao chất lượng dịch vụ và tay nghề kỹ thuật viên tại khu vực {booking.serviceAreaName || booking.branchName}.
              </p>

              {/* Star selector */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", margin: "12px 0" }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "2.2rem",
                      lineHeight: 1,
                      padding: "2px 4px",
                      color: star <= rating ? "#f59e0b" : "#cbd5e1",
                      transition: "transform 0.15s ease",
                    }}
                    title={`${star} sao`}
                  >
                    ★
                  </button>
                ))}
                <span style={{ marginLeft: "12px", fontSize: "1rem", fontWeight: 700, color: "#b45309" }}>
                  {rating === 5
                    ? "5 sao — Rất hài lòng, tuyệt vời!"
                    : rating === 4
                    ? "4 sao — Hài lòng"
                    : rating === 3
                    ? "3 sao — Bình thường"
                    : rating === 2
                    ? "2 sao — Chưa hài lòng"
                    : "1 sao — Rất không hài lòng"}
                </span>
              </div>

              {/* Comment text */}
              <label className="field" style={{ marginTop: "14px" }}>
                <span>Nhận xét chi tiết (tùy chọn)</span>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Chia sẻ trải nghiệm của bạn về độ mượt của máy sau sửa, thái độ kỹ thuật viên, thời gian chờ..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </label>

              <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
                <button
                  className="btn"
                  type="submit"
                  disabled={submittingReview}
                  style={{ background: "var(--color-accent-strong)" }}
                >
                  {submittingReview ? "Đang gửi..." : review ? "Cập nhật đánh giá" : "Gửi đánh giá dịch vụ"}
                </button>
                {review && isEditingReview ? (
                  <button
                    className="btn btn-quiet"
                    type="button"
                    disabled={submittingReview}
                    onClick={() => {
                      setIsEditingReview(false)
                      setRating(review.rating)
                      setComment(review.comment || "")
                    }}
                  >
                    Hủy bỏ
                  </button>
                ) : null}
              </div>
            </form>
          )
        ) : (
          /* RULE 11 NOTICE: NOT COMPLETED YET */
          <div style={{ marginTop: "12px", background: "#f8fafc", padding: "14px 18px", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
            <p style={{ margin: 0, color: "var(--color-muted)", fontSize: "0.9rem" }}>
              ℹ️ <strong>Quy định đánh giá (RULE 11):</strong> Bạn chỉ có thể đánh giá và chấm điểm chất lượng sau khi thiết bị đã được sửa chữa hoàn thành (Trạng thái: <strong>Completed</strong>).
            </p>
          </div>
        )}
      </section>
    </main>
  )
}

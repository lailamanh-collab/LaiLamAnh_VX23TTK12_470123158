import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getBranches, type Branch } from "../api/branches"
import {
  deleteReview,
  fetchAdminReviews,
  fetchAdminReviewStats,
  updateReviewVisibility,
  type ReviewItem,
  type ReviewStats,
} from "../api/reviews"
import { useAuth } from "../auth/AuthContext"
import { useIsMobile } from "../utils/useMediaQuery"

export function AdminReviewsPage() {
  const isMobile = useIsMobile(768)
  const { token } = useAuth()

  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Filters
  const [search, setSearch] = useState("")
  const [ratingFilter, setRatingFilter] = useState<string>("")
  const [branchFilter, setBranchFilter] = useState<string>("")
  const [visibilityFilter, setVisibilityFilter] = useState<string>("")

  // Alerts
  const [errorMsg, setErrorMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<ReviewItem | null>(null)

  const loadData = async () => {
    if (!token) return
    setLoading(true)
    setErrorMsg("")
    try {
      const [revList, statData, branchList] = await Promise.all([
        fetchAdminReviews(token, {
          search: search || undefined,
          rating: ratingFilter ? Number(ratingFilter) : undefined,
          branchId: branchFilter ? Number(branchFilter) : undefined,
          isVisible: visibilityFilter === "" ? undefined : visibilityFilter === "true",
        }),
        fetchAdminReviewStats(token),
        getBranches(),
      ])
      setReviews(revList)
      setStats(statData)
      setBranches(branchList)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Lỗi tải danh sách đánh giá.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [token, ratingFilter, branchFilter, visibilityFilter])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void loadData()
  }

  const handleToggleVisibility = async (review: ReviewItem) => {
    if (!token) return
    setActionLoading(true)
    setErrorMsg("")
    setSuccessMsg("")
    try {
      await updateReviewVisibility(token, review.id, !review.isVisible)
      setSuccessMsg(`Đã ${!review.isVisible ? "hiển thị" : "ẩn"} đánh giá cho ca ${review.bookingCode}.`)
      await loadData()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Lỗi cập nhật hiển thị.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!token || !deleteTarget) return
    setActionLoading(true)
    setErrorMsg("")
    setSuccessMsg("")
    try {
      await deleteReview(token, deleteTarget.id)
      setSuccessMsg(`Đã xóa đánh giá của khách hàng ${deleteTarget.customerName}.`)
      setDeleteTarget(null)
      await loadData()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Lỗi khi xóa đánh giá.")
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <main className="page">
      <div style={{ marginBottom: "16px" }}>
        <Link className="text-link" to="/admin">
          ← Quay lại Trung tâm Quản trị
        </Link>
      </div>

      <section className="hero" style={{ paddingBottom: "24px" }}>
        <div>
          <span className="eyebrow">Quản trị & Phản hồi</span>
          <h1>Quản lý Đánh giá Khách hàng (45.14)</h1>
          <p className="lede">
            Theo dõi ý kiến khách hàng, chất lượng sửa chữa tại các chi nhánh và quản lý trạng thái hiển thị công khai.
          </p>
        </div>
      </section>

      {errorMsg ? <p className="form-error" style={{ margin: "14px 0" }}>{errorMsg}</p> : null}
      {successMsg ? <p className="form-success" style={{ margin: "14px 0" }}>{successMsg}</p> : null}

      {/* STATS OVERVIEW CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(160px, 1fr))",
          gap: isMobile ? "10px" : "14px",
          margin: "20px 0",
        }}
      >
        <div className="card" style={{ padding: "16px" }}>
          <span className="muted" style={{ fontSize: "0.82rem", fontWeight: 600 }}>TỔNG ĐÁNH GIÁ</span>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--color-ink)", margin: "4px 0" }}>
            {stats?.totalReviews ?? 0}
          </div>
          <span className="muted" style={{ fontSize: "0.8rem" }}>Tất cả đánh giá</span>
        </div>

        <div className="card" style={{ padding: "16px", background: "#fefce8", borderColor: "#fef08a" }}>
          <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#854d0e" }}>ĐIỂM TRUNG BÌNH</span>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#b45309", margin: "4px 0" }}>
            ⭐ {stats?.averageRating ? stats.averageRating.toFixed(1) : "5.0"}
          </div>
          <span style={{ fontSize: "0.8rem", color: "#854d0e" }}>Thang điểm 5.0</span>
        </div>

        <div className="card" style={{ padding: "16px" }}>
          <span className="muted" style={{ fontSize: "0.82rem", fontWeight: 600 }}>5 SAO (XUẤT SẮC)</span>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#16a34a", margin: "4px 0" }}>
            {stats?.fiveStarCount ?? 0}
          </div>
          <span className="muted" style={{ fontSize: "0.8rem" }}>Độ hài lòng tối đa</span>
        </div>

        <div className="card" style={{ padding: "16px" }}>
          <span className="muted" style={{ fontSize: "0.82rem", fontWeight: 600 }}>1 – 3 SAO</span>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#ea580c", margin: "4px 0" }}>
            {(stats?.oneStarCount ?? 0) + (stats?.twoStarCount ?? 0) + (stats?.threeStarCount ?? 0)}
          </div>
          <span className="muted" style={{ fontSize: "0.8rem" }}>Cần lưu ý chăm sóc</span>
        </div>

        <div className="card" style={{ padding: "16px", background: stats?.hiddenCount ? "#fee2e2" : "white", gridColumn: isMobile ? "1 / -1" : "auto" }}>
          <span style={{ fontSize: "0.82rem", fontWeight: 600, color: stats?.hiddenCount ? "#991b1b" : "var(--color-muted)" }}>
            ĐANG ẨN
          </span>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: stats?.hiddenCount ? "#dc2626" : "var(--color-ink)", margin: "4px 0" }}>
            {stats?.hiddenCount ?? 0}
          </div>
          <span className="muted" style={{ fontSize: "0.8rem" }}>Không hiện công khai</span>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <form onSubmit={handleSearchSubmit} className="card" style={{ padding: isMobile ? "14px" : "16px", marginBottom: "20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", alignItems: "flex-end" }}>
          <label className="field" style={{ margin: 0 }}>
            <span>Tìm kiếm từ khóa</span>
            <input
              className="input"
              type="search"
              placeholder="Nội dung, khách hàng, mã booking, KTV..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>

          <label className="field" style={{ margin: 0 }}>
            <span>Số sao đánh giá</span>
            <select className="input" value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)}>
              <option value="">Tất cả số sao</option>
              <option value="5">★★★★★ 5 sao</option>
              <option value="4">★★★★☆ 4 sao</option>
              <option value="3">★★★☆☆ 3 sao</option>
              <option value="2">★★☆☆☆ 2 sao</option>
              <option value="1">★☆☆☆☆ 1 sao</option>
            </select>
          </label>

          <label className="field" style={{ margin: 0 }}>
            <span>Chi nhánh sửa chữa</span>
            <select className="input" value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
              <option value="">Tất cả chi nhánh</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </label>

          <label className="field" style={{ margin: 0 }}>
            <span>Trạng thái hiển thị</span>
            <select className="input" value={visibilityFilter} onChange={(e) => setVisibilityFilter(e.target.value)}>
              <option value="">Tất cả trạng thái</option>
              <option value="true">Đang hiển thị công khai</option>
              <option value="false">Đang bị ẩn</option>
            </select>
          </label>

          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn" type="submit" style={{ flex: 1 }}>
              Tìm kiếm
            </button>
            {(search || ratingFilter || branchFilter || visibilityFilter) ? (
              <button
                className="btn btn-quiet"
                type="button"
                onClick={() => {
                  setSearch("")
                  setRatingFilter("")
                  setBranchFilter("")
                  setVisibilityFilter("")
                }}
              >
                Xóa lọc
              </button>
            ) : null}
          </div>
        </div>
      </form>

      {/* REVIEWS LIST */}
      <section className="card" style={{ overflowX: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2>Danh sách đánh giá ({reviews.length})</h2>
          <button className="btn btn-quiet" type="button" onClick={() => void loadData()} style={{ padding: "4px 12px", fontSize: "0.85rem" }}>
            🔄 Làm mới
          </button>
        </div>

        {loading ? (
          <p style={{ textAlign: "center", padding: "30px", color: "var(--color-muted)" }}>Đang tải danh sách đánh giá...</p>
        ) : reviews.length === 0 ? (
          <p style={{ textAlign: "center", padding: "30px", color: "var(--color-muted)" }}>Không có đánh giá nào phù hợp với bộ lọc.</p>
        ) : isMobile ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {reviews.map((r) => (
              <div
                key={r.id}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "14px",
                  padding: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  boxShadow: "0 1px 4px rgba(15,23,42,0.02)",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                  <div>
                    <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>{r.customerName}</strong>
                    <div style={{ fontSize: "0.76rem", color: "var(--color-muted)" }}>
                      {new Date(r.createdAt).toLocaleDateString("vi-VN")}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: "#f59e0b", fontSize: "0.95rem" }}>
                      {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                    </div>
                    {r.isVisible ? (
                      <span className="badge badge-fixed" style={{ background: "#dcfce7", color: "#166534", fontSize: "0.72rem", padding: "2px 8px" }}>
                        ✓ Hiển thị
                      </span>
                    ) : (
                      <span className="badge" style={{ background: "#fee2e2", color: "#991b1b", fontSize: "0.72rem", padding: "2px 8px" }}>
                        ✕ Đang ẩn
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", fontSize: "0.82rem" }}>
                  <span style={{ fontWeight: 700, color: "var(--color-accent-strong)", background: "#eff6ff", padding: "2px 8px", borderRadius: "6px" }}>
                    {r.bookingCode}
                  </span>
                  <span style={{ color: "var(--color-ink)", fontWeight: 600 }}>
                    {r.serviceName || r.serviceCategoryName || "Dịch vụ sửa chữa tại nhà"}
                  </span>
                </div>

                <div style={{ fontSize: "0.8rem", color: "var(--color-muted)", display: "flex", flexDirection: "column", gap: "2px" }}>
                  <div>📍 {r.serviceAreaName || r.branchName}</div>
                  <div>👨‍🔧 {r.technicianName || "Chưa gán KTV"}</div>
                </div>

                {r.comment ? (
                  <div style={{ background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: "10px", padding: "10px 12px", fontSize: "0.84rem", color: "var(--color-ink)", lineHeight: 1.4 }}>
                    💬 {r.comment}
                  </div>
                ) : (
                  <div style={{ fontSize: "0.78rem", color: "var(--color-muted)", fontStyle: "italic" }}>
                    (Không có nhận xét bằng lời)
                  </div>
                )}

                <div style={{ display: "flex", gap: "8px", borderTop: "1px solid #f1f5f9", paddingTop: "10px", marginTop: "4px" }}>
                  <button
                    className="btn btn-quiet"
                    type="button"
                    disabled={actionLoading}
                    onClick={() => void handleToggleVisibility(r)}
                    style={{
                      flex: 1,
                      padding: "8px",
                      fontSize: "0.82rem",
                      color: r.isVisible ? "var(--color-danger)" : "var(--color-ok)",
                      fontWeight: 600,
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                  >
                    {r.isVisible ? "👁️ Ẩn khỏi trang chủ" : "👁️ Hiện công khai"}
                  </button>
                  <button
                    className="btn btn-quiet"
                    type="button"
                    disabled={actionLoading}
                    onClick={() => setDeleteTarget(r)}
                    style={{
                      padding: "8px 14px",
                      fontSize: "0.82rem",
                      color: "var(--color-danger)",
                      border: "1px solid #fee2e2",
                      background: "#fef2f2",
                      borderRadius: "8px",
                    }}
                  >
                    🗑️ Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ overflowX: "auto", width: "100%" }}>
            <table style={{ width: "100%", minWidth: "920px", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--color-line)", color: "var(--color-muted)" }}>
                <th style={{ padding: "10px" }}>Khách hàng</th>
                <th style={{ padding: "10px" }}>Mã lịch & Dịch vụ</th>
                <th style={{ padding: "10px" }}>Đánh giá</th>
                <th style={{ padding: "10px" }}>Nội dung nhận xét</th>
                <th style={{ padding: "10px" }}>Khu vực & Thợ</th>
                <th style={{ padding: "10px" }}>Trạng thái</th>
                <th style={{ padding: "10px", textAlign: "right" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid var(--color-line)", verticalAlign: "top" }}>
                  <td style={{ padding: "12px 10px" }}>
                    <strong>{r.customerName}</strong>
                    <div style={{ fontSize: "0.78rem", color: "var(--color-muted)" }}>
                      {new Date(r.createdAt).toLocaleDateString("vi-VN")}
                    </div>
                  </td>

                  <td style={{ padding: "12px 10px" }}>
                    <span style={{ fontWeight: 700, color: "var(--color-accent-strong)" }}>{r.bookingCode}</span>
                    <div style={{ fontSize: "0.82rem", color: "var(--color-ink)" }}>
                      {r.serviceName || r.serviceCategoryName || "Dịch vụ sửa chữa tại nhà"}
                    </div>
                  </td>

                  <td style={{ padding: "12px 10px", whiteSpace: "nowrap" }}>
                    <div style={{ color: "#f59e0b", fontSize: "1.1rem" }}>
                      {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                    </div>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700 }}>{r.rating} / 5</span>
                  </td>

                  <td style={{ padding: "12px 10px", maxWidth: "260px" }}>
                    {r.comment ? (
                      <p style={{ margin: 0, color: "var(--color-ink)", lineHeight: 1.4 }}>{r.comment}</p>
                    ) : (
                      <span className="muted" style={{ fontStyle: "italic" }}>Không có nhận xét bằng lời</span>
                    )}
                  </td>

                  <td style={{ padding: "12px 10px" }}>
                    <div>📍 {r.branchName}</div>
                    <div style={{ fontSize: "0.82rem", color: "var(--color-muted)" }}>
                      👨‍🔧 {r.technicianName || "Chưa gán KTV"}
                    </div>
                  </td>

                  <td style={{ padding: "12px 10px" }}>
                    {r.isVisible ? (
                      <span className="badge badge-fixed" style={{ background: "#dcfce7", color: "#166534" }}>
                        ✓ Hiển thị
                      </span>
                    ) : (
                      <span className="badge" style={{ background: "#fee2e2", color: "#991b1b" }}>
                        ✕ Đang ẩn
                      </span>
                    )}
                  </td>

                  <td style={{ padding: "12px 10px", textAlign: "right", whiteSpace: "nowrap" }}>
                    <button
                      className="btn btn-quiet"
                      type="button"
                      disabled={actionLoading}
                      onClick={() => void handleToggleVisibility(r)}
                      style={{
                        padding: "4px 8px",
                        fontSize: "0.8rem",
                        marginRight: "6px",
                        color: r.isVisible ? "var(--color-danger)" : "var(--color-ok)",
                      }}
                      title={r.isVisible ? "Ẩn khỏi trang chủ" : "Hiện công khai"}
                    >
                      {r.isVisible ? "👁️ Ẩn" : "👁️ Hiện"}
                    </button>
                    <button
                      className="btn btn-quiet"
                      type="button"
                      disabled={actionLoading}
                      onClick={() => setDeleteTarget(r)}
                      style={{ padding: "4px 8px", fontSize: "0.8rem", color: "var(--color-danger)" }}
                      title="Xóa đánh giá này"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </section>

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget ? (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "16px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !actionLoading) setDeleteTarget(null)
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: "460px",
              width: "100%",
              padding: "24px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h3 style={{ margin: "0 0 10px", color: "var(--color-danger)" }}>Xác nhận xóa đánh giá</h3>
            <p style={{ margin: "0 0 16px", fontSize: "0.92rem", lineHeight: 1.5 }}>
              Bạn có chắc chắn muốn xóa vĩnh viễn đánh giá ({deleteTarget.rating} sao) của khách hàng{" "}
              <strong>{deleteTarget.customerName}</strong> cho lịch hẹn <strong>{deleteTarget.bookingCode}</strong>?
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                className="btn btn-quiet"
                type="button"
                disabled={actionLoading}
                onClick={() => setDeleteTarget(null)}
              >
                Hủy bỏ
              </button>
              <button
                className="btn"
                type="button"
                disabled={actionLoading}
                onClick={() => void handleConfirmDelete()}
                style={{ background: "var(--color-danger)" }}
              >
                {actionLoading ? "Đang xóa..." : "Xóa vĩnh viễn"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}

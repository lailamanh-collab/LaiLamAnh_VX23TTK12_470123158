import { useState } from "react"
import { Link } from "react-router-dom"

interface FaqItem {
  id: string
  category: "booking" | "pricing" | "workflow" | "warranty" | "technician" | "policy"
  question: string
  answer: string
  badge?: string
}

const FAQ_LIST: FaqItem[] = [
  {
    id: "b1",
    category: "booking",
    question: "Tôi có cần đặt cọc hay thanh toán tiền trước khi đặt lịch không?",
    badge: "Phổ biến",
    answer:
      "Không. Hệ thống đặt lịch trực tuyến của HomeFix hoàn toàn miễn phí 100% và không yêu cầu đặt cọc trước. Bạn chỉ thanh toán trực tiếp sau khi kỹ thuật viên đến tận nhà, hoàn tất kiểm tra/sửa chữa và bạn đã nghiệm thu chất lượng hoàn toàn ưng ý.",
  },
  {
    id: "b2",
    category: "booking",
    question: "Một lần đặt lịch thợ tôi có thể yêu cầu sửa nhiều hạng mục cùng lúc không?",
    badge: "Quy tắc đặt lịch",
    answer:
      "Hoàn toàn ĐƯỢC. Bạn có thể chọn nhiều dịch vụ cùng lúc trong một đơn đặt lịch (ví dụ: vừa bảo dưỡng vệ sinh điều hòa, vừa sửa vòi nước rò rỉ). Kỹ thuật viên sẽ chuẩn bị đầy đủ dụng cụ và phụ tùng cần thiết để xử lý trọn gói trong một lần đến nhà.",
  },
  {
    id: "b3",
    category: "booking",
    question: "Kỹ thuật viên sẽ đến trong bao lâu sau khi đặt lịch?",
    answer:
      "Tùy vào khung giờ bạn đã chọn trên hệ thống. Với các ca cần xử lý gấp (sự cố chập điện, vỡ ống nước), đội thợ trực tại khu vực sẽ có mặt trong vòng 30 - 45 phút kể từ khi quản trị viên phân công và xác nhận đơn.",
  },
  {
    id: "p1",
    category: "pricing",
    question: "Sự khác biệt giữa 'Giá trọn gói' (Fixed Price) và 'Khảo sát báo giá' (Inspection Required)?",
    badge: "Minh bạch giá",
    answer:
      "Với các công việc tiêu chuẩn như vệ sinh điều hòa, thay vòi sen, thay ổ cắm điện, hệ thống áp dụng bảng giá trọn gói niêm yết rõ ràng. Với các sự cố phức tạp (như chập cháy âm tường, rò rỉ nước ngầm, máy giặt hỏng bo mạch điều khiển), kỹ thuật viên cần đến khảo sát hiện trường trước, sau đó chẩn đoán và lập phiếu báo giá cụ thể để bạn duyệt trước khi thi công.",
  },
  {
    id: "p2",
    category: "pricing",
    question: "Giá hiển thị đã bao gồm phí di chuyển và bảo hành chưa?",
    answer:
      "Tất cả giá dịch vụ tại HomeFix đã bao gồm công thợ cơ bản, phí di chuyển trong phạm vi khu vực phục vụ và chính sách bảo hành tiêu chuẩn từ 3 - 12 tháng. Cam kết không phát sinh bất kỳ khoản phí ngoài thỏa thuận nào.",
  },
  {
    id: "p3",
    category: "pricing",
    question: "Nếu sau khi thợ đến kiểm tra mà tôi không đồng ý mức giá thì có mất phí không?",
    badge: "Miễn phí 100%",
    answer:
      "Khách hàng hoàn toàn có quyền từ chối nếu cảm thấy phương án sửa chữa hoặc chi phí đề xuất chưa phù hợp. HomeFix không thu bất kỳ khoản phí ép buộc nào nếu khách hàng quyết định chưa làm.",
  },
  {
    id: "w1",
    category: "workflow",
    question: "Quy trình thực hiện sửa chữa tại nhà diễn ra như thế nào?",
    badge: "Quy trình chuẩn",
    answer:
      "Quy trình 4 bước chuyên nghiệp: 1. Đặt lịch online -> 2. Kỹ thuật viên di chuyển và có mặt đúng hẹn -> 3. Kiểm tra sự cố, tư vấn giải pháp và báo giá rõ ràng -> 4. Tiến hành sửa chữa, kiểm tra vận hành, dọn dẹp vệ sinh và viết phiếu bảo hành.",
  },
  {
    id: "w2",
    category: "workflow",
    question: "Chủ nhà có cần chuẩn bị đồ nghề, thang hay dụng cụ gì không?",
    answer:
      "Không cần. Kỹ thuật viên của HomeFix luôn mang theo túi đồ nghề chuyên dụng, thiết bị đo điện trở/áp lực nước, thang nhôm và các vật tư phổ thông. Bạn chỉ cần hỗ trợ chỉ dẫn vị trí cần sửa và nguồn điện/nước trong nhà.",
  },
  {
    id: "wa1",
    category: "warranty",
    question: "Chính sách bảo hành sau khi sửa chữa tại nhà như thế nào?",
    badge: "Bảo hành 6-12T",
    answer:
      "Tất cả các dịch vụ sửa chữa và thay thế linh kiện tại HomeFix đều được bảo hành từ 6 đến 12 tháng. Thông tin bảo hành được lưu trữ điện tử theo Số điện thoại và Mã lịch hẹn trên hệ thống. Nếu có bất kỳ sự cố phát sinh trong thời gian bảo hành, kỹ thuật viên sẽ đến xử lý lại miễn phí 100%.",
  },
  {
    id: "wa2",
    category: "warranty",
    question: "Linh kiện, vật tư thay thế (dây điện, ống nước, block lạnh) có chính hãng không?",
    answer:
      "HomeFix cam kết chỉ sử dụng vật tư của các thương hiệu uy tín (Cadivi, Panasonic, Sino, Tiền Phong, Daikin, LG...) có đầy đủ hóa đơn, tem mác xuất xứ và đạt chuẩn an toàn phòng chống cháy nổ.",
  },
  {
    id: "t1",
    category: "technician",
    question: "Kỹ thuật viên của HomeFix có lý lịch và tay nghề như thế nào?",
    badge: "An tâm tuyệt đối",
    answer:
      "100% thợ kỹ thuật của HomeFix đều có hồ sơ lý lịch tư pháp rõ ràng, được đào tạo tay nghề chính quy và có chứng chỉ an toàn lao động. Khi đến nhà, kỹ thuật viên bắt buộc mặc đồng phục HomeFix, đeo thẻ nhân viên và tuân thủ quy tắc ứng xử lịch sự, trung thực.",
  },
  {
    id: "po1",
    category: "policy",
    question: "Tôi có thể hủy hoặc đổi ngày giờ lịch hẹn đã đặt không?",
    answer:
      "Bạn hoàn toàn có thể hủy hoặc đổi lịch hẹn miễn phí bất kỳ lúc nào trước khi kỹ thuật viên bắt đầu di chuyển. Chỉ cần vào mục 'Lịch hẹn của tôi', chọn lịch tương ứng và nhấn 'Hủy lịch hẹn'.",
  },
  {
    id: "po2",
    category: "policy",
    question: "Tôi có thể đánh giá và khiếu nại về thái độ của thợ như thế nào?",
    answer:
      "Sau khi ca sửa chữa hoàn tất (trạng thái Hoàn thành), bạn có thể gửi đánh giá từ 1 đến 5 sao và nhận xét trực tiếp trên trang chi tiết đơn. Nếu có khiếu nại gấp, vui lòng gọi ngay Hotline 1900 8899 để quản lý hỗ trợ giải quyết trong 15 phút.",
  },
]

const CATEGORIES = [
  { id: "all", label: "Tất cả câu hỏi", icon: "💡" },
  { id: "booking", label: "Đặt lịch & Phục vụ", icon: "🗓️" },
  { id: "pricing", label: "Bảng giá & Chi phí", icon: "💰" },
  { id: "workflow", label: "Quy trình tại nhà", icon: "⏱️" },
  { id: "warranty", label: "Chính sách Bảo hành", icon: "🛡️" },
  { id: "technician", label: "Thợ & An toàn", icon: "👷" },
  { id: "policy", label: "Hủy lịch & Khiếu nại", icon: "📋" },
]

export function SupportPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    b1: true,
    p1: true,
    w1: true,
  })

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleAll = (expand: boolean) => {
    const newState: Record<string, boolean> = {}
    FAQ_LIST.forEach((item) => {
      newState[item.id] = expand
    })
    setOpenItems(newState)
  }

  const filteredFaqs = FAQ_LIST.filter((item) => {
    const matchCategory = activeCategory === "all" || item.category === activeCategory
    const matchSearch =
      !searchQuery.trim() ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCategory && matchSearch
  })

  return (
    <main style={{ background: "#f8fafc", minHeight: "100vh", padding: "24px 20px 80px" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        {/* TOP BREADCRUMB */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "#64748b", marginBottom: "20px" }}>
          <Link to="/" style={{ color: "#64748b", textDecoration: "none" }}>
            Trang chủ
          </Link>
          <span>/</span>
          <span style={{ color: "#0f172a", fontWeight: 700 }}>Trung tâm Hỗ trợ & FAQ</span>
        </div>

        {/* HERO BANNER */}
        <section
          style={{
            background: "linear-gradient(135deg, #0b1329 0%, #172554 45%, #1e40af 100%)",
            borderRadius: "24px",
            padding: "44px 36px",
            color: "#ffffff",
            marginBottom: "36px",
            boxShadow: "0 10px 30px rgba(15,23,42,0.18)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ maxWidth: "780px", margin: "0 auto", textAlign: "center", position: "relative", zIndex: 2 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.25)",
                padding: "4px 14px",
                borderRadius: "999px",
                fontSize: "0.78rem",
                fontWeight: 700,
                letterSpacing: "0.5px",
                marginBottom: "16px",
                backdropFilter: "blur(6px)",
              }}
            >
              <span>🎧</span>
              <span>TRUNG TÂM TRỢ GIÚP HOMEFIX 24/7</span>
            </span>

            <h1 style={{ fontSize: "2.3rem", fontWeight: 900, margin: "0 0 14px", letterSpacing: "-0.02em", lineHeight: 1.25 }}>
              Chúng tôi có thể giúp gì cho ngôi nhà của bạn?
            </h1>
            <p style={{ fontSize: "1rem", color: "#cbd5e1", margin: "0 auto 28px", lineHeight: 1.6, maxWidth: "640px" }}>
              Tìm câu trả lời nhanh chóng về chi phí, quy trình tiếp nhận, chính sách bảo hành và cam kết chất lượng của đội thợ HomeFix.
            </p>

            {/* SEARCH INPUT BAR */}
            <div
              style={{
                position: "relative",
                maxWidth: "640px",
                margin: "0 auto 18px",
                background: "#ffffff",
                borderRadius: "16px",
                boxShadow: "0 8px 25px rgba(0,0,0,0.25)",
                display: "flex",
                alignItems: "center",
                padding: "6px 8px 6px 18px",
              }}
            >
              <span style={{ fontSize: "1.2rem", color: "#94a3b8", marginRight: "10px" }}>🔍</span>
              <input
                type="text"
                placeholder="Nhập câu hỏi: chập điện, vệ sinh điều hòa, bảo hành, hủy lịch, thợ đến nhà..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  fontSize: "0.95rem",
                  color: "#0f172a",
                  padding: "8px 0",
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "1rem", padding: "0 10px" }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* POPULAR KEYWORD TAGS */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", flexWrap: "wrap", fontSize: "0.78rem" }}>
              <span style={{ color: "#94a3b8" }}>Tìm kiếm phổ biến:</span>
              {[
                "Sửa chập điện",
                "Vệ sinh máy lạnh",
                "Chính sách bảo hành 12 tháng",
                "Hủy lịch hẹn",
                "Báo giá khảo sát",
              ].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSearchQuery(tag)}
                  style={{
                    background: "rgba(255,255,255,0.12)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "#ffffff",
                    borderRadius: "999px",
                    padding: "3px 12px",
                    fontSize: "0.76rem",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 4 QUICK CONTACT CHANNELS */}
        <section style={{ marginBottom: "40px" }}>
          <div className="support-quick-contact-grid">
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "18px", padding: "22px 20px", boxShadow: "0 2px 10px rgba(15,23,42,0.02)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", marginBottom: "12px" }}>
                  📞
                </div>
                <strong style={{ fontSize: "1rem", color: "#0f172a", display: "block", marginBottom: "4px" }}>
                  Tổng đài CSKH 24/7
                </strong>
                <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "0 0 12px", lineHeight: 1.45 }}>
                  Tư vấn sự cố tại nhà và điều phối thợ khẩn cấp 08:00 - 21:00 hàng ngày.
                </p>
                <div style={{ fontSize: "1.25rem", fontWeight: 900, color: "#1d4ed8", letterSpacing: "0.5px", marginBottom: "14px" }}>
                  1900 8899
                </div>
              </div>
              <a href="tel:19008899" style={{ display: "block", textAlign: "center", background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", padding: "8px 14px", borderRadius: "10px", fontSize: "0.82rem", fontWeight: 700, textDecoration: "none" }}>
                Gọi ngay ↗
              </a>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "18px", padding: "22px 20px", boxShadow: "0 2px 10px rgba(15,23,42,0.02)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#f0fdf4", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", marginBottom: "12px" }}>
                  💬
                </div>
                <strong style={{ fontSize: "1rem", color: "#0f172a", display: "block", marginBottom: "4px" }}>
                  Zalo Kỹ thuật viên
                </strong>
                <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "0 0 12px", lineHeight: 1.45 }}>
                  Gửi ảnh sự cố đường điện, ống nước để kỹ thuật viên tư vấn giải pháp.
                </p>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#16a34a", marginBottom: "14px" }}>
                  0901 234 567
                </div>
              </div>
              <a href="https://zalo.me" target="_blank" rel="noreferrer" style={{ display: "block", textAlign: "center", background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", padding: "8px 14px", borderRadius: "10px", fontSize: "0.82rem", fontWeight: 700, textDecoration: "none" }}>
                Nhắn Zalo ngay ↗
              </a>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "18px", padding: "22px 20px", boxShadow: "0 2px 10px rgba(15,23,42,0.02)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#faf5ff", color: "#9333ea", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", marginBottom: "12px" }}>
                  📧
                </div>
                <strong style={{ fontSize: "1rem", color: "#0f172a", display: "block", marginBottom: "4px" }}>
                  Email tiếp nhận phản ánh
                </strong>
                <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "0 0 12px", lineHeight: 1.45 }}>
                  Tiếp nhận hóa đơn VAT, hợp đồng bảo trì tòa nhà và góp ý dịch vụ.
                </p>
                <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#9333ea", marginBottom: "14px", wordBreak: "break-all" }}>
                  hotro@homefix.vn
                </div>
              </div>
              <a href="mailto:hotro@homefix.vn" style={{ display: "block", textAlign: "center", background: "#faf5ff", color: "#9333ea", border: "1px solid #e9d5ff", padding: "8px 14px", borderRadius: "10px", fontSize: "0.82rem", fontWeight: 700, textDecoration: "none" }}>
                Gửi Email ↗
              </a>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "18px", padding: "22px 20px", boxShadow: "0 2px 10px rgba(15,23,42,0.02)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#fff7ed", color: "#ea580c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", marginBottom: "12px" }}>
                  📍
                </div>
                <strong style={{ fontSize: "1rem", color: "#0f172a", display: "block", marginBottom: "4px" }}>
                  Khu vực phục vụ
                </strong>
                <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "0 0 12px", lineHeight: 1.45 }}>
                  Xem danh sách các trạm kỹ thuật và đội cơ động tại các quận huyện.
                </p>
                <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#ea580c", marginBottom: "14px" }}>
                  Toàn quốc & 3 Miền
                </div>
              </div>
              <Link to="/branches" style={{ display: "block", textAlign: "center", background: "#fff7ed", color: "#ea580c", border: "1px solid #fed7aa", padding: "8px 14px", borderRadius: "10px", fontSize: "0.82rem", fontWeight: 700, textDecoration: "none" }}>
                Xem khu vực ↗
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>
                Câu hỏi thường gặp
              </h2>
              <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                Hiển thị {filteredFaqs.length} câu hỏi theo bộ lọc
              </span>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={() => toggleAll(true)}
                style={{ background: "#ffffff", border: "1px solid #cbd5e1", padding: "6px 12px", borderRadius: "8px", fontSize: "0.8rem", fontWeight: 600, color: "#334155", cursor: "pointer" }}
              >
                Mở tất cả
              </button>
              <button
                type="button"
                onClick={() => toggleAll(false)}
                style={{ background: "#ffffff", border: "1px solid #cbd5e1", padding: "6px 12px", borderRadius: "8px", fontSize: "0.8rem", fontWeight: 600, color: "#334155", cursor: "pointer" }}
              >
                Thu gọn
              </button>
            </div>
          </div>

          {/* CATEGORIES BUTTONS */}
          <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveCategory(c.id)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "10px",
                  border: "1px solid",
                  borderColor: activeCategory === c.id ? "#2563eb" : "#e2e8f0",
                  background: activeCategory === c.id ? "#2563eb" : "#ffffff",
                  color: activeCategory === c.id ? "#ffffff" : "#334155",
                  fontWeight: 600,
                  fontSize: "0.84rem",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.15s ease",
                }}
              >
                <span>{c.icon}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>

          {/* FAQ ACCORDION LIST */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {filteredFaqs.map((faq) => {
              const isOpen = !!openItems[faq.id]
              return (
                <div
                  key={faq.id}
                  style={{
                    background: "#ffffff",
                    border: "1px solid",
                    borderColor: isOpen ? "#93c5fd" : "#e2e8f0",
                    borderRadius: "14px",
                    overflow: "hidden",
                    transition: "all 0.15s ease",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(faq.id)}
                    style={{
                      width: "100%",
                      padding: "18px 20px",
                      background: isOpen ? "#f8fafc" : "#ffffff",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "14px",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {faq.badge && (
                        <span style={{ fontSize: "0.72rem", background: "#eff6ff", color: "#2563eb", padding: "3px 8px", borderRadius: "6px", fontWeight: 700, flexShrink: 0 }}>
                          {faq.badge}
                        </span>
                      )}
                      <strong style={{ fontSize: "0.95rem", color: "#0f172a", fontWeight: 700 }}>
                        {faq.question}
                      </strong>
                    </div>
                    <span style={{ fontSize: "1.1rem", color: "#64748b", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}>
                      ▼
                    </span>
                  </button>
                  {isOpen && (
                    <div style={{ padding: "0 20px 20px", fontSize: "0.9rem", color: "#475569", lineHeight: 1.6, borderTop: "1px solid #f1f5f9", background: "#ffffff" }}>
                      <p style={{ margin: "14px 0 0" }}>{faq.answer}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </main>
  )
}

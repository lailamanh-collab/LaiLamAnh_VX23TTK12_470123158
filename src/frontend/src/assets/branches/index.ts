import branchCauGiay from "./branch-caugiay.jpg"
import branchDongDa from "./branch-dongda.jpg"
import branchHaiBaTrung from "./branch-haibatrung.jpg"
import branchThanhXuan from "./branch-thanhxuan.jpg"
import branchBaDinh from "./branch-badinh.jpg"
import branchLongBien from "./branch-longbien.jpg"
import branchQuan1 from "./branch-quan1.jpg"
import branchQuan7 from "./branch-quan7.jpg"
import branchThuDuc from "./branch-thuduc.jpg"

export const BRANCH_IMAGES: Record<string, string> = {
  "Cầu Giấy": branchCauGiay,
  "Đống Đa": branchDongDa,
  "Hai Bà Trưng": branchHaiBaTrung,
  "Thanh Xuân": branchThanhXuan,
  "Ba Đình": branchBaDinh,
  "Long Biên": branchLongBien,
  "Quận 1": branchQuan1,
  "Quận 7": branchQuan7,
  "Thủ Đức": branchThuDuc,
}

export function getBranchImage(nameOrAddress?: string): string {
  if (!nameOrAddress) return branchCauGiay
  const lower = nameOrAddress.toLowerCase()
  if (lower.includes("quận 1") || lower.includes("nguyễn huệ")) return branchQuan1
  if (lower.includes("quận 7") || lower.includes("nguyễn thị thập")) return branchQuan7
  if (lower.includes("thủ đức") || lower.includes("võ văn ngân")) return branchThuDuc
  if (lower.includes("đống đa")) return branchDongDa
  if (lower.includes("hai bà trưng") || lower.includes("phố huế") || lower.includes("quận 5") || lower.includes("quận 10")) return branchHaiBaTrung
  if (lower.includes("thanh xuân") || lower.includes("nguyễn trãi") || lower.includes("phú nhuận")) return branchThanhXuan
  if (lower.includes("ba đình") || lower.includes("đội cấn") || lower.includes("bình thạnh") || lower.includes("gò vấp") || lower.includes("hải châu")) return branchBaDinh
  if (lower.includes("long biên") || lower.includes("nguyễn văn cừ") || lower.includes("tân bình") || lower.includes("thanh khê")) return branchLongBien
  if (lower.includes("quận 3")) return branchDongDa
  return branchCauGiay
}

export {
  branchCauGiay,
  branchDongDa,
  branchHaiBaTrung,
  branchThanhXuan,
  branchBaDinh,
  branchLongBien,
  branchQuan1,
  branchQuan7,
  branchThuDuc,
}

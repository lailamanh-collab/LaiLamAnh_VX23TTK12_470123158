import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { getProfile, type UserProfile } from "../api/auth"

const tokenKey = "homerepair.token"

type AuthContextValue = {
  token: string | null
  user: UserProfile | null
  ready: boolean
  setSession: (token: string, user: UserProfile) => void
  setUser: (user: UserProfile) => void
  logout: () => void
  isAuthModalOpen: boolean
  authModalTab: "login" | "register" | "forgot"
  openAuthModal: (tab?: "login" | "register" | "forgot") => void
  closeAuthModal: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem(tokenKey))
  const [user, setUserState] = useState<UserProfile | null>(null)
  const [ready, setReady] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authModalTab, setAuthModalTab] = useState<"login" | "register" | "forgot">("login")

  const openAuthModal = (tab: "login" | "register" | "forgot" = "login") => {
    setAuthModalTab(tab)
    setIsAuthModalOpen(true)
  }

  const closeAuthModal = () => {
    setIsAuthModalOpen(false)
  }

  useEffect(() => {
    let active = true
    const stored = sessionStorage.getItem(tokenKey)
    if (!stored) {
      setReady(true)
      return
    }

    getProfile(stored)
      .then((profile) => {
        if (active) {
          setToken(stored)
          setUserState(profile)
        }
      })
      .catch(() => {
        sessionStorage.removeItem(tokenKey)
        if (active) {
          setToken(null)
          setUserState(null)
        }
      })
      .finally(() => {
        if (active) {
          setReady(true)
        }
      })

    return () => {
      active = false
    }
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    token,
    user,
    ready,
    setSession: (nextToken, nextUser) => {
      sessionStorage.setItem(tokenKey, nextToken)
      setToken(nextToken)
      setUserState(nextUser)
    },
    setUser: (nextUser) => setUserState(nextUser),
    logout: () => {
      sessionStorage.removeItem(tokenKey)
      setToken(null)
      setUserState(null)
    },
    isAuthModalOpen,
    authModalTab,
    openAuthModal,
    closeAuthModal,
  }), [ready, token, user, isAuthModalOpen, authModalTab])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}

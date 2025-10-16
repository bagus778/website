import { ReactNode } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import MaintenanceGuard from '@/components/MaintenanceGuard'

interface StoreLayoutProps {
  children: ReactNode
  showSearch?: boolean
  searchQuery?: string
  onSearchChange?: (query: string) => void
}

export default function StoreLayout({ children, showSearch, searchQuery, onSearchChange }: StoreLayoutProps) {
  return (
    <MaintenanceGuard>
      <div className="page-container">
        <Navbar showSearch={showSearch} searchQuery={searchQuery} onSearchChange={onSearchChange} />
        <main className="main-content">
          <div className="store-layout-decorative">
            <div className="corner-decoration-bottom-left"></div>
            <div className="corner-decoration-bottom-right"></div>
            {children}
          </div>
        </main>
        <Footer />
      </div>
    </MaintenanceGuard>
  )
}

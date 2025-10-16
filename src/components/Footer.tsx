'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Page {
  _id: string
  title: string
  slug: string
  isActive: boolean
}

export default function Footer() {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Moonchunk Store'
  const currentYear = new Date().getFullYear()
  const [pages, setPages] = useState<Page[]>([])

  useEffect(() => {
    const fetchPages = async () => {
      try {
        const response = await fetch('/api/pages', { cache: 'no-store' })
        if (!response.ok) return

        const data = await response.json()
        if (data.success) {
          setPages(data.data.filter((page: Page) => page.isActive))
        }
      } catch (error) {
        console.error('Error fetching pages:', error)
      }
    }

    fetchPages()
  }, [])

  // Categorize pages
  const serverPages = pages.filter(p =>
    ['about', 'contact'].includes(p.slug.toLowerCase())
  )
  const legalPages = pages.filter(p =>
    ['terms', 'privacy', 'privacy-policy'].includes(p.slug.toLowerCase())
  )

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">
              <span className="footer-brand-icon">{siteName[0]}</span>
              <span className="footer-brand-text">{siteName}</span>
            </div>
            <p className="footer-powered-by">
              Powered by <a href="https://github.com/Moonchunk" className="footer-powered-link">Moonchunk</a>
            </p>
            <p className="footer-tagline">Open Source Minecraft Store Platform</p>
          </div>

          <div>
            <h4 className="footer-section-title">Shop</h4>
            <ul className="footer-links">
              <li>
                <Link className="footer-link" href="/">
                  All Products
                </Link>
              </li>
              <li>
                <Link className="footer-link" href="/cart">
                  Cart
                </Link>
              </li>
            </ul>
          </div>

          {serverPages.length > 0 && (
            <div>
              <h4 className="footer-section-title">Server</h4>
              <ul className="footer-links">
                {serverPages.map((page) => (
                  <li key={page._id}>
                    <Link className="footer-link" href={`/page/${page.slug}`}>
                      {page.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {legalPages.length > 0 && (
            <div>
              <h4 className="footer-section-title">Legal</h4>
              <ul className="footer-links">
                {legalPages.map((page) => (
                  <li key={page._id}>
                    <Link className="footer-link" href={`/page/${page.slug}`}>
                      {page.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="footer-bottom">
          <p className="footer-copyright">
            © {currentYear} {siteName}. All rights reserved.
          </p>
          <p className="footer-disclaimer">
            Not affiliated with Mojang Studios or Microsoft
          </p>
        </div>
      </div>
    </footer>
  )
}

import { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import '@/theme/store/common.css'

interface PageData {
  _id: string
  title: string
  slug: string
  content: string
  isActive: boolean
  metaTitle?: string
  metaDescription?: string
}

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getPage(slug: string): Promise<PageData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/pages/${slug}`, {
      cache: 'no-store',
    })

    if (!response.ok) return null

    const data = await response.json()
    return data.success ? data.data : null
  } catch (error) {
    console.error('Error fetching page:', error)
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const page = await getPage(slug)

  if (!page) {
    return {
      title: 'Page Not Found',
    }
  }

  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription || undefined,
  }
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params
  const page = await getPage(slug)

  if (!page || !page.isActive) {
    return (
      <div className="page-container">
        <Navbar />
        <main className="main-content">
          <div className="content-page">
            <h1 className="content-page-title">Page Not Found</h1>
            <p className="content-page-text">The page you're looking for doesn't exist.</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="page-container">
      <Navbar />
      <main className="main-content">
        <div className="content-page">
          <h1 className="content-page-title">{page.title}</h1>
          <div
            className="content-page-body"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </div>
      </main>
      <Footer />
    </div>
  )
}

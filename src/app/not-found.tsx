import Footer from "@/components/Footer"
import Navbar from "@/components/Navbar"

const NotFound = () => {
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

export default NotFound